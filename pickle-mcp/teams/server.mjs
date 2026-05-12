#!/usr/bin/env node
/**
 * @pickle/teams-mcp  v1.0.0
 *
 * Microsoft Teams MCP server — part of the Pickle project.
 * Pure Node.js ESM · no build step · no TypeScript compilation.
 *
 * Key design: delta-cursor incremental sync + Graph $batch API.
 * - First run per chat/channel: fetch recent messages, establish deltaLink cursor.
 * - Subsequent runs: use stored deltaLink → ONLY new messages returned by server.
 * - Batch tool: up to 20 chats in ONE HTTP call — 200 DMs = 10 HTTP calls total.
 *
 * Zero telemetry. Only talks to https://graph.microsoft.com and
 * https://login.microsoftonline.com (for token refresh).
 *
 * Auth: OAuth2 device code flow. Run setup.mjs once to authenticate.
 *       Token cached at ~/.claude/pickle/memory/teams_auth.json
 *
 * License: MIT
 * Repo:    https://github.com/adityaarsharma/pickle
 */

import { Server }               from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z }    from "zod";
import fs       from "fs";
import path     from "path";
import os       from "os";
import https    from "https";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_ID  = process.env.TEAMS_CLIENT_ID  || "";
const TENANT_ID  = process.env.TEAMS_TENANT_ID  || "common";

const AUTH_CACHE   = process.env.TEAMS_AUTH_CACHE ||
  path.join(os.homedir(), ".claude", "pickle", "memory", "teams_auth.json");
const CURSOR_FILE  = process.env.TEAMS_CURSOR_FILE ||
  path.join(os.homedir(), ".claude", "pickle", "memory", "teams_cursors.json");

const GRAPH_BASE         = "https://graph.microsoft.com/v1.0";
const TOKEN_URL          = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
const SCOPES             = "Chat.Read Chat.ReadWrite ChannelMessage.Read.All ChatMessage.Send Team.ReadBasic.All Channel.ReadBasic.All User.Read offline_access";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES        = 4;
const BATCH_SIZE         = 20; // Graph $batch max
const DELTA_MAX_PAGES    = 10; // safety cap per chat (10 × 50 = 500 msgs max first-run)

// $select for messages — only fetch fields Pickle needs (saves tokens significantly)
const MSG_SELECT = "$select=id,createdDateTime,lastModifiedDateTime,from,body,channelIdentity,chatId,attachments,mentions,importance,subject,deletedDateTime,replyToId";

if (!CLIENT_ID) {
  process.stderr.write(
    "[pickle-teams-mcp] FATAL: TEAMS_CLIENT_ID not set.\n" +
    "Run once: node ~/.claude/pickle-mcp/teams/setup.mjs\n" +
    "Then add to ~/.claude.json mcpServers entry (setup.mjs will print it).\n"
  );
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Token management (load → auto-refresh → save)
// ─────────────────────────────────────────────────────────────────────────────

let tokenCache = null;

function loadTokenCache() {
  try {
    if (fs.existsSync(AUTH_CACHE)) {
      tokenCache = JSON.parse(fs.readFileSync(AUTH_CACHE, "utf8"));
    }
  } catch { tokenCache = null; }
}

function saveTokenCache() {
  try {
    fs.mkdirSync(path.dirname(AUTH_CACHE), { recursive: true });
    fs.writeFileSync(AUTH_CACHE, JSON.stringify(tokenCache, null, 2), { mode: 0o600 });
  } catch (e) {
    process.stderr.write(`[teams-mcp] WARN: could not save token cache: ${e.message}\n`);
  }
}

async function refreshToken() {
  if (!tokenCache?.refresh_token) {
    throw new McpError(ErrorCode.InternalError,
      "No refresh token. Run: node ~/.claude/pickle-mcp/teams/setup.mjs");
  }
  const data = await postForm(TOKEN_URL, new URLSearchParams({
    client_id:     CLIENT_ID,
    grant_type:    "refresh_token",
    refresh_token: tokenCache.refresh_token,
    scope:         SCOPES,
  }).toString());
  tokenCache = {
    ...tokenCache,
    access_token:  data.access_token,
    refresh_token: data.refresh_token || tokenCache.refresh_token,
    expires_at:    Date.now() + (data.expires_in - 60) * 1000,
  };
  saveTokenCache();
}

async function getToken() {
  if (!tokenCache) loadTokenCache();
  if (!tokenCache?.access_token) {
    throw new McpError(ErrorCode.InternalError,
      "Not authenticated. Run: node ~/.claude/pickle-mcp/teams/setup.mjs");
  }
  if (Date.now() >= (tokenCache.expires_at || 0)) await refreshToken();
  return tokenCache.access_token;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function postForm(url, body) {
  return new Promise((resolve, reject) => {
    const u   = new URL(url);
    const buf = Buffer.from(body);
    const req = https.request(
      {
        hostname: u.hostname, path: u.pathname + u.search,
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": buf.length },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            const p = JSON.parse(d);
            res.statusCode >= 400 ? reject(new Error(p.error_description || p.error || d)) : resolve(p);
          } catch { reject(new Error(d)); }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.write(buf);
    req.end();
  });
}

async function graphRequest(urlOrPath, opts = {}, attempt = 0) {
  const token = await getToken();
  const url   = urlOrPath.startsWith("http") ? urlOrPath : `${GRAPH_BASE}${urlOrPath}`;
  const u     = new URL(url);
  const body  = opts.body ? JSON.stringify(opts.body) : undefined;

  const headers = {
    Authorization:  `Bearer ${token}`,
    Accept:         "application/json",
    "Content-Type": "application/json",
  };
  if (opts.consistencyLevel) headers.ConsistencyLevel = opts.consistencyLevel;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: opts.method || "GET",
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", async () => {
          // Rate limit / service unavailable — exponential backoff
          if ((res.statusCode === 429 || res.statusCode === 503) && attempt < MAX_RETRIES) {
            const wait = parseInt(res.headers["retry-after"] || "2", 10) * 1000;
            await sleep(wait);
            resolve(graphRequest(urlOrPath, opts, attempt + 1));
            return;
          }
          // Token expired mid-request
          if (res.statusCode === 401 && attempt === 0) {
            await refreshToken();
            resolve(graphRequest(urlOrPath, opts, attempt + 1));
            return;
          }
          try {
            const p = d ? JSON.parse(d) : {};
            if (res.statusCode >= 400) {
              reject(new McpError(ErrorCode.InternalError,
                `Graph ${res.statusCode}: ${p?.error?.message || JSON.stringify(p).slice(0, 300)}`));
            } else {
              resolve(p);
            }
          } catch { reject(new McpError(ErrorCode.InternalError, `Parse error: ${d.slice(0, 200)}`)); }
        });
      }
    );
    req.on("error", (e) => reject(new McpError(ErrorCode.InternalError, e.message)));
    req.on("timeout", () => { req.destroy(); reject(new McpError(ErrorCode.InternalError, "request timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Delta query helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a delta endpoint (follows nextLinks, stops at deltaLink or page cap).
 * Returns { messages: [], deltaLink: string | null }
 */
async function fetchDelta(startUrl) {
  let url      = startUrl;
  const msgs   = [];
  let deltaLink = null;
  let pages    = 0;

  while (url && pages < DELTA_MAX_PAGES) {
    const data = await graphRequest(url);
    if (Array.isArray(data.value)) msgs.push(...data.value);
    pages++;

    if (data["@odata.deltaLink"]) {
      deltaLink = data["@odata.deltaLink"];
      break;
    } else if (data["@odata.nextLink"]) {
      url = data["@odata.nextLink"];
    } else {
      break;
    }
  }
  return { messages: msgs, deltaLink };
}

/**
 * Send a Graph $batch request. Handles chunking into BATCH_SIZE groups.
 * Input:  [{ id, url }]   (relative Graph URLs)
 * Output: { [id]: { status, body } }
 */
async function batchGet(requests) {
  const results = {};
  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const chunk = requests.slice(i, i + BATCH_SIZE);
    const resp  = await graphRequest("/$batch", {
      method: "POST",
      body: {
        requests: chunk.map((r) => ({
          id:     r.id,
          method: "GET",
          url:    r.url.startsWith("/") ? r.url : `/${r.url}`,
        })),
      },
    });
    for (const item of resp.responses || []) {
      results[item.id] = { status: item.status, body: item.body };
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cursor helpers
// ─────────────────────────────────────────────────────────────────────────────

function readCursors() {
  try {
    if (fs.existsSync(CURSOR_FILE)) return JSON.parse(fs.readFileSync(CURSOR_FILE, "utf8"));
  } catch {}
  return { chat_cursors: {}, channel_cursors: {}, last_run_ms: 0 };
}

function writeCursors(data) {
  fs.mkdirSync(path.dirname(CURSOR_FILE), { recursive: true });
  const cur = readCursors();
  const merged = {
    chat_cursors:    { ...cur.chat_cursors,    ...(data.chat_cursors    || {}) },
    channel_cursors: { ...cur.channel_cursors, ...(data.channel_cursors || {}) },
    last_run_ms:     data.last_run_ms ?? Date.now(),
  };
  // Remove null/undefined entries (explicit cursor clears)
  for (const k of Object.keys(merged.chat_cursors))    if (!merged.chat_cursors[k])    delete merged.chat_cursors[k];
  for (const k of Object.keys(merged.channel_cursors)) if (!merged.channel_cursors[k]) delete merged.channel_cursors[k];
  fs.writeFileSync(CURSOR_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool implementations
// ─────────────────────────────────────────────────────────────────────────────

async function handleGetMe() {
  return await graphRequest("/me?$select=id,displayName,mail,userPrincipalName");
}

async function handleListChats({ top = 50 }) {
  const cap  = Math.min(top, 50);
  const data = await graphRequest(
    `/me/chats?$top=${cap}&$expand=members($select=id,displayName,email)&$select=id,topic,chatType,createdDateTime,lastUpdatedDateTime`
  );
  return { chats: data.value || [], next_link: data["@odata.nextLink"] || null };
}

async function handleGetChatMessages({ chat_id, cursor }) {
  let startUrl;
  if (cursor) {
    startUrl = cursor; // full deltaLink from previous run
  } else {
    // First run: start delta from beginning (up to DELTA_MAX_PAGES pages)
    startUrl = `/me/chats/${chat_id}/messages/delta?${MSG_SELECT}`;
  }
  const { messages, deltaLink } = await fetchDelta(startUrl);
  return { chat_id, messages, new_cursor: deltaLink, message_count: messages.length };
}

/**
 * Batch fetch new messages for multiple chats.
 * Loads cursors from disk, sends up to 20 delta requests per HTTP call.
 * Handles pagination within batch responses automatically.
 */
async function handleBatchNewMessages({ chat_ids }) {
  const cursors = readCursors();
  const newCursors = {};

  // Build initial batch requests
  const requests = chat_ids.map((cid, i) => {
    const cursor = cursors.chat_cursors[cid];
    const url    = cursor
      ? cursor.replace(GRAPH_BASE, "") // strip base → relative URL for $batch
      : `/me/chats/${cid}/messages/delta?${MSG_SELECT}`;
    return { id: String(i), chatId: cid, url };
  });

  // Iterative pagination: some responses may have nextLink
  const allMessages = Object.fromEntries(chat_ids.map((cid) => [cid, []]));
  let pending = requests;

  let safetyLimit = 10; // max pagination rounds
  while (pending.length > 0 && safetyLimit-- > 0) {
    const batchResult = await batchGet(pending.map((r) => ({ id: r.id, url: r.url })));
    const nextPending = [];

    for (const req of pending) {
      const resp = batchResult[req.id];
      if (!resp || resp.status !== 200) {
        // error for this chat — skip, don't update cursor
        process.stderr.write(`[teams-mcp] batch item ${req.id} (chat ${req.chatId}) status ${resp?.status}\n`);
        continue;
      }
      const body = resp.body;
      if (Array.isArray(body.value)) allMessages[req.chatId].push(...body.value);

      if (body["@odata.deltaLink"]) {
        newCursors[req.chatId] = body["@odata.deltaLink"];
      } else if (body["@odata.nextLink"]) {
        nextPending.push({ ...req, url: body["@odata.nextLink"].replace(GRAPH_BASE, "") });
      }
    }
    pending = nextPending;
  }

  // Build result
  const result = {};
  for (const cid of chat_ids) {
    result[cid] = {
      messages:   allMessages[cid],
      new_cursor: newCursors[cid] || null,
      count:      allMessages[cid].length,
    };
  }
  return { results: result, new_chat_cursors: newCursors };
}

async function handleGetMessageReplies({ chat_id, message_id }) {
  const data = await graphRequest(
    `/me/chats/${chat_id}/messages/${message_id}/replies?${MSG_SELECT}&$top=50`
  );
  return { replies: data.value || [], count: (data.value || []).length };
}

async function handleListJoinedTeams() {
  const data = await graphRequest(
    "/me/joinedTeams?$select=id,displayName,description,visibility"
  );
  return { teams: data.value || [] };
}

async function handleListChannels({ team_id }) {
  const data = await graphRequest(
    `/teams/${team_id}/channels?$select=id,displayName,description,membershipType`
  );
  return { channels: data.value || [] };
}

async function handleGetChannelMessages({ team_id, channel_id, cursor }) {
  let startUrl;
  if (cursor) {
    startUrl = cursor;
  } else {
    startUrl = `/teams/${team_id}/channels/${channel_id}/messages/delta?${MSG_SELECT}`;
  }
  const { messages, deltaLink } = await fetchDelta(startUrl);
  return {
    team_id, channel_id,
    messages,
    new_cursor: deltaLink,
    message_count: messages.length,
  };
}

/**
 * Batch fetch new channel messages across multiple team/channel pairs.
 * Mirrors handleBatchNewMessages but for channels.
 */
async function handleBatchChannelMessages({ channels }) {
  const cursors    = readCursors();
  const newCursors = {};
  const allMessages = {};

  const requests = channels.map(({ team_id, channel_id }, i) => {
    const key    = `${team_id}/${channel_id}`;
    allMessages[key] = [];
    const cursor = cursors.channel_cursors[key];
    const url    = cursor
      ? cursor.replace(GRAPH_BASE, "")
      : `/teams/${team_id}/channels/${channel_id}/messages/delta?${MSG_SELECT}`;
    return { id: String(i), teamId: team_id, channelId: channel_id, key, url };
  });

  let pending    = requests;
  let safetyLimit = 10;
  while (pending.length > 0 && safetyLimit-- > 0) {
    const batchResult = await batchGet(pending.map((r) => ({ id: r.id, url: r.url })));
    const nextPending = [];

    for (const req of pending) {
      const resp = batchResult[req.id];
      if (!resp || resp.status !== 200) {
        process.stderr.write(`[teams-mcp] batch channel ${req.key} status ${resp?.status}\n`);
        continue;
      }
      const body = resp.body;
      if (Array.isArray(body.value)) allMessages[req.key].push(...body.value);

      if (body["@odata.deltaLink"]) {
        newCursors[req.key] = body["@odata.deltaLink"];
      } else if (body["@odata.nextLink"]) {
        nextPending.push({ ...req, url: body["@odata.nextLink"].replace(GRAPH_BASE, "") });
      }
    }
    pending = nextPending;
  }

  const result = {};
  for (const { team_id, channel_id } of channels) {
    const key = `${team_id}/${channel_id}`;
    result[key] = { messages: allMessages[key], new_cursor: newCursors[key] || null, count: allMessages[key].length };
  }
  return { results: result, new_channel_cursors: newCursors };
}

async function handleGetChannelMessageReplies({ team_id, channel_id, message_id }) {
  const data = await graphRequest(
    `/teams/${team_id}/channels/${channel_id}/messages/${message_id}/replies?${MSG_SELECT}&$top=50`
  );
  return { replies: data.value || [], count: (data.value || []).length };
}

async function handleSendChatMessage({ chat_id, content, content_type = "text" }) {
  const body  = { body: { contentType: content_type, content } };
  const resp  = await graphRequest(`/me/chats/${chat_id}/messages`, { method: "POST", body });
  return { id: resp.id, createdDateTime: resp.createdDateTime, chat_id };
}

function handleReadCursors() {
  return readCursors();
}

function handleWriteCursors({ chat_cursors, channel_cursors, last_run_ms }) {
  const merged = writeCursors({ chat_cursors, channel_cursors, last_run_ms });
  return { ok: true, cursor_file: CURSOR_FILE, merged };
}

// ─────────────────────────────────────────────────────────────────────────────
// MCP Server
// ─────────────────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "pickle-teams-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "teams_get_me",
      description: "Get the authenticated Microsoft 365 user profile (id, displayName, mail).",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "teams_list_chats",
      description: "List all Microsoft Teams chats (1:1 DMs and group chats) the user is a member of. Returns id, topic, chatType, members.",
      inputSchema: {
        type: "object",
        properties: { top: { type: "integer", description: "Max results (default 50, max 50)", default: 50 } },
        required: [],
      },
    },
    {
      name: "teams_get_chat_messages",
      description: "Fetch messages from a single chat. If 'cursor' (deltaLink) is provided, returns ONLY messages since that cursor — very fast. If omitted, fetches up to 500 messages and returns a deltaLink to store for next time.",
      inputSchema: {
        type: "object",
        properties: {
          chat_id: { type: "string", description: "Chat ID from teams_list_chats" },
          cursor:  { type: "string", description: "deltaLink from a previous run. Omit for first-time fetch." },
        },
        required: ["chat_id"],
      },
    },
    {
      name: "teams_batch_new_messages",
      description: "MOST EFFICIENT: Fetch new messages from multiple chats in ONE batched call. Reads cursors from disk automatically. Returns messages + new_cursor per chat. Always use this instead of calling teams_get_chat_messages in a loop. Up to 200 chats = 10 HTTP calls total.",
      inputSchema: {
        type: "object",
        properties: {
          chat_ids: {
            type: "array",
            items: { type: "string" },
            description: "List of chat IDs to check for new messages",
          },
        },
        required: ["chat_ids"],
      },
    },
    {
      name: "teams_get_chat_message_replies",
      description: "Get replies to a specific chat message (thread).",
      inputSchema: {
        type: "object",
        properties: {
          chat_id:    { type: "string" },
          message_id: { type: "string" },
        },
        required: ["chat_id", "message_id"],
      },
    },
    {
      name: "teams_list_joined_teams",
      description: "List all Microsoft Teams the user has joined (returns id, displayName, description).",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "teams_list_channels",
      description: "List channels in a Team.",
      inputSchema: {
        type: "object",
        properties: { team_id: { type: "string" } },
        required: ["team_id"],
      },
    },
    {
      name: "teams_get_channel_messages",
      description: "Fetch messages from a Teams channel. Uses deltaLink cursor if provided.",
      inputSchema: {
        type: "object",
        properties: {
          team_id:    { type: "string" },
          channel_id: { type: "string" },
          cursor:     { type: "string", description: "deltaLink from previous run. Omit for first-time fetch." },
        },
        required: ["team_id", "channel_id"],
      },
    },
    {
      name: "teams_batch_channel_messages",
      description: "MOST EFFICIENT: Fetch new messages from multiple channels in one batched call. Reads cursors from disk automatically.",
      inputSchema: {
        type: "object",
        properties: {
          channels: {
            type: "array",
            items: {
              type: "object",
              properties: {
                team_id:    { type: "string" },
                channel_id: { type: "string" },
              },
              required: ["team_id", "channel_id"],
            },
          },
        },
        required: ["channels"],
      },
    },
    {
      name: "teams_get_channel_message_replies",
      description: "Get replies to a channel message.",
      inputSchema: {
        type: "object",
        properties: {
          team_id:    { type: "string" },
          channel_id: { type: "string" },
          message_id: { type: "string" },
        },
        required: ["team_id", "channel_id", "message_id"],
      },
    },
    {
      name: "teams_send_chat_message",
      description: "Send a message to a Teams chat (DM or group chat).",
      inputSchema: {
        type: "object",
        properties: {
          chat_id:      { type: "string" },
          content:      { type: "string", description: "Message text (plain text or HTML)" },
          content_type: { type: "string", enum: ["text", "html"], default: "text" },
        },
        required: ["chat_id", "content"],
      },
    },
    {
      name: "teams_read_cursors",
      description: "Read current delta cursor state from disk. Returns { chat_cursors, channel_cursors, last_run_ms }. Call this before a scan to load stored cursors.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "teams_write_cursors",
      description: "Persist updated delta cursors to disk. Call this after a scan with the new_cursor values returned by batch tools. Merges into existing file — only updates keys you provide.",
      inputSchema: {
        type: "object",
        properties: {
          chat_cursors:    { type: "object", description: "Map of chat_id → deltaLink" },
          channel_cursors: { type: "object", description: "Map of 'team_id/channel_id' → deltaLink" },
          last_run_ms:     { type: "number" },
        },
        required: [],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  try {
    let result;
    switch (name) {
      case "teams_get_me":                    result = await handleGetMe();                         break;
      case "teams_list_chats":                result = await handleListChats(args);                 break;
      case "teams_get_chat_messages":         result = await handleGetChatMessages(args);           break;
      case "teams_batch_new_messages":        result = await handleBatchNewMessages(args);          break;
      case "teams_get_chat_message_replies":  result = await handleGetMessageReplies(args);         break;
      case "teams_list_joined_teams":         result = await handleListJoinedTeams();               break;
      case "teams_list_channels":             result = await handleListChannels(args);              break;
      case "teams_get_channel_messages":      result = await handleGetChannelMessages(args);        break;
      case "teams_batch_channel_messages":    result = await handleBatchChannelMessages(args);      break;
      case "teams_get_channel_message_replies": result = await handleGetChannelMessageReplies(args); break;
      case "teams_send_chat_message":         result = await handleSendChatMessage(args);           break;
      case "teams_read_cursors":              result = handleReadCursors();                         break;
      case "teams_write_cursors":             result = handleWriteCursors(args);                    break;
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    if (err instanceof McpError) throw err;
    throw new McpError(ErrorCode.InternalError, err.message || String(err));
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);

process.stderr.write(
  `[pickle-teams-mcp] v1.0.0 ready · client: ${CLIENT_ID} · tenant: ${TENANT_ID}\n` +
  `[pickle-teams-mcp] cursor file: ${CURSOR_FILE}\n` +
  `[pickle-teams-mcp] auth cache:  ${AUTH_CACHE}\n`
);
