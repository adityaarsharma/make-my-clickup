# ClickUp API Token Setup Guide

> Part of [make-my-clickup](https://github.com/adityaarsharma/make-my-clickup) — Built and Shipped by Aditya Sharma

This is the **team-friendly setup** — each person connects their own ClickUp account using a personal API token. No shared Claude account needed.

---

## Step 1 — Generate Your ClickUp API Token

1. Open [app.clickup.com](https://app.clickup.com) and log in
2. Click your **avatar / profile picture** in the bottom-left corner
3. Click **Settings**
4. In the left sidebar, click **Apps**
5. Under **"API Token"** — click **Generate** (or **Regenerate** if one already exists)
6. Copy the token — it starts with `pk_`

> ⚠️ Keep this token private. It gives full access to your ClickUp account.

---

## Step 2 — Run the Auto-Setup in Claude Code

Open Claude Code and paste this **exactly**:

```
Run the make-my-clickup setup:
1. Ask me for my ClickUp API token (starts with pk_)
2. Add it to ~/.claude.json under mcpServers using @taazkareem/clickup-mcp-server
3. Verify the connection works by listing my ClickUp workspaces
```

Claude Code will:
- Ask for your `pk_` token
- Write the config to `~/.claude.json` automatically
- Test that ClickUp responds correctly
- Tell you when it's ready

Then **restart Claude Code** once and you're connected.

---

## Step 3 — Run the Skill

```
/make-my-clickup
```

---

## What Gets Added to Your Config

Claude Code will add this to `~/.claude.json` on your machine:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["@taazkareem/clickup-mcp-server"],
      "env": {
        "CLICKUP_API_TOKEN": "pk_your_token_here"
      }
    }
  }
}
```

This only lives on **your machine**. Your token never leaves your computer.

---

## For Each Team Member

Everyone on the team follows the same 3 steps above with their own ClickUp account. Each person gets their own inbox scan, their own task board, their own follow-up tracker.

---

## Troubleshooting

**"Command not found: npx"**
→ Node.js is not installed. Install from [nodejs.org](https://nodejs.org) — pick the LTS version.

**Token not working**
→ Make sure you copied the full token including `pk_`. Regenerate in ClickUp Settings → Apps if needed.

**Claude Code not seeing ClickUp after setup**
→ Restart Claude Code fully (quit and reopen, not just a new session).

**Want to switch to a different ClickUp account**
→ Open `~/.claude.json`, replace the `CLICKUP_API_TOKEN` value with the new token, restart Claude Code.

---

*Back to [main README](../README.md)*
