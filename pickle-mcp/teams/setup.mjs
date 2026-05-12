#!/usr/bin/env node
/**
 * One-time auth setup for @pickle/teams-mcp
 * Uses OAuth2 Device Code Flow — no browser redirect needed.
 *
 * Usage:
 *   node setup.mjs <CLIENT_ID> [TENANT_ID]
 *   node setup.mjs  (prints Azure setup instructions if CLIENT_ID missing)
 */

import fs   from "fs";
import path from "path";
import os   from "os";
import https from "https";

const CLIENT_ID = process.argv[2] || process.env.TEAMS_CLIENT_ID || "";
const TENANT_ID = process.argv[3] || process.env.TEAMS_TENANT_ID || "common";

const SCOPES = [
  "Chat.Read",
  "Chat.ReadWrite",
  "ChannelMessage.Read.All",
  "ChatMessage.Send",
  "Team.ReadBasic.All",
  "Channel.ReadBasic.All",
  "User.Read",
  "offline_access",
].join(" ");

const AUTH_CACHE = path.join(os.homedir(), ".claude", "pickle", "memory", "teams_auth.json");

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

function postForm(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const buf = Buffer.from(body);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": buf.length,
        },
        timeout: 30_000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const p = JSON.parse(data);
            if (res.statusCode >= 400) reject(new Error(p.error_description || p.error || data));
            else resolve(p);
          } catch { reject(new Error(data)); }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.write(buf);
    req.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (!CLIENT_ID) {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  🥒 pickle-teams-mcp  — First-time Azure Setup           ║
╚══════════════════════════════════════════════════════════╝

Step 1 — Create an Azure AD app (free, 2 minutes):
  → https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/CreateApplicationBlade

  Name:                   Pickle Teams MCP
  Supported account types: Accounts in this org only (single tenant)
                           OR "Any Azure AD directory" (multi-tenant)
  Redirect URI:           (leave empty)

Step 2 — Configure the app:
  → Authentication tab:
    Enable "Allow public client flows" → Yes (enables device code flow)

  → API permissions tab → Add a permission → Microsoft Graph → Delegated:
    ✅ Chat.Read
    ✅ Chat.ReadWrite
    ✅ ChannelMessage.Read.All
    ✅ ChatMessage.Send
    ✅ Team.ReadBasic.All
    ✅ Channel.ReadBasic.All
    ✅ User.Read
    ✅ offline_access
    → Grant admin consent (or sign in as yourself to consent)

Step 3 — Run setup with your Client ID:
  node ~/.claude/pickle-mcp/teams/setup.mjs <APPLICATION_CLIENT_ID> [TENANT_ID]

  Example:
    node setup.mjs 9a3b7c2d-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    node setup.mjs 9a3b7c2d-xxxx-xxxx-xxxx-xxxxxxxxxxxx organizations
`);
  process.exit(0);
}

console.log(`\n🥒 pickle-teams-mcp setup — client: ${CLIENT_ID} · tenant: ${TENANT_ID}\n`);

// Step 1: Request device code
const dc = await postForm(
  `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/devicecode`,
  new URLSearchParams({ client_id: CLIENT_ID, scope: SCOPES }).toString()
);

console.log(`─────────────────────────────────────────────────`);
console.log(dc.message);
console.log(`─────────────────────────────────────────────────\n`);
console.log(`Waiting for you to authenticate… (${dc.expires_in}s window)\n`);

// Step 2: Poll for token
const interval = (dc.interval || 5) * 1000;
const deadline = Date.now() + dc.expires_in * 1000;
let token = null;

while (Date.now() < deadline) {
  await sleep(interval);
  try {
    token = await postForm(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id:   CLIENT_ID,
        grant_type:  "urn:ietf:params:oauth2:grant-type:device_code",
        device_code: dc.device_code,
      }).toString()
    );
    break;
  } catch (e) {
    if (e.message.includes("authorization_pending")) continue;
    if (e.message.includes("slow_down")) { await sleep(interval); continue; }
    if (e.message.includes("authorization_declined")) {
      console.error("❌ Auth declined by user.");
      process.exit(1);
    }
    throw e;
  }
}

if (!token?.access_token) {
  console.error("❌ Timed out waiting for auth. Run setup again.");
  process.exit(1);
}

// Step 3: Save token cache
const cache = {
  client_id:     CLIENT_ID,
  tenant_id:     TENANT_ID,
  access_token:  token.access_token,
  refresh_token: token.refresh_token,
  expires_at:    Date.now() + (token.expires_in - 60) * 1000,
  scopes:        SCOPES,
};

fs.mkdirSync(path.dirname(AUTH_CACHE), { recursive: true });
fs.writeFileSync(AUTH_CACHE, JSON.stringify(cache, null, 2), { mode: 0o600 });

console.log(`✅ Auth complete! Token cached → ${AUTH_CACHE}\n`);

// Step 4: Print claude.json snippet
console.log(`Add to ~/.claude.json under "mcpServers":

  "teams": {
    "command": "node",
    "args": ["${path.join(os.homedir(), ".claude", "pickle-mcp", "teams", "server.mjs")}"],
    "env": {
      "TEAMS_CLIENT_ID": "${CLIENT_ID}",
      "TEAMS_TENANT_ID": "${TENANT_ID}"
    }
  }

Then fully quit Claude Code (Cmd+Q) and reopen.
`);
