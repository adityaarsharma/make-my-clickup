# ClickUp API Token Setup

> Part of [make-my-clickup](https://github.com/adityaarsharma/make-my-clickup) · Built and Shipped by Aditya Sharma

---

## Generate Your API Token

```
ClickUp App
    │
    ▼
👤 Your Avatar  ←── bottom-left corner
    │
    ▼
⚙️  Settings
    │
    ▼
🔧 Apps  ←── in the left sidebar
    │
    ▼
🔑 API Token  →  [ Generate ]
    │
    ▼
📋 Copy token  ←── starts with  pk_xxxxxxxxxxxxxxxx
```

---

### Step by Step

**1 →** Open [app.clickup.com](https://app.clickup.com)

**2 →** Click your **profile picture / avatar** — bottom-left of the screen

**3 →** Click **Settings**

**4 →** In the left sidebar → click **Apps**

**5 →** Find **"API Token"** → click **Generate**
   _(if you already have one, click Regenerate to get a fresh one)_

**6 →** Click **Copy** — your token looks like:
```
pk_12345678_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456
```

> ⚠️ Keep this private — it gives full access to your ClickUp account.

---

## Connect to Claude Code

Once you have your token, paste this into Claude Code:

```
Run the make-my-clickup setup:
1. Ask me for my ClickUp API token (starts with pk_)
2. Add it to ~/.claude.json under mcpServers using @taazkareem/clickup-mcp-server
3. Verify the connection works by listing my ClickUp workspaces
```

Claude Code will:

```
  You paste prompt
       │
       ▼
  Claude asks for your pk_ token
       │
       ▼
  You paste your token
       │
       ▼
  Claude writes ~/.claude.json automatically
       │
       ▼
  Claude tests the connection
       │
       ▼
  ✅ Connected — restart Claude Code once
       │
       ▼
  /make-my-clickup  ←── you're live
```

---

## For Your Team

Everyone follows the same steps with their **own** ClickUp account.

```
  Teammate A          Teammate B          Teammate C
  pk_aaaaaa           pk_bbbbbb           pk_cccccc
      │                   │                   │
      ▼                   ▼                   ▼
  Their inbox         Their inbox         Their inbox
  Their tasks         Their tasks         Their tasks
  Their board         Their board         Their board
```

No shared accounts. No overlap. Fully isolated.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npx: command not found` | Install Node.js from [nodejs.org](https://nodejs.org) (LTS version) |
| Token not accepted | Make sure you copied the full `pk_` token |
| ClickUp not showing after setup | Fully quit and reopen Claude Code |
| Wrong ClickUp account connected | Replace token in `~/.claude.json` → restart Claude Code |

---

*Back to [README](../README.md)*
