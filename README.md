# 🥒 Pickle — AI Manager Productivity for Claude Code

> **The Claude Code skill suite for managers and teams using ClickUp, Slack, and Microsoft Teams.**
> ClickUp Brain shows your tasks. Slack AI shows your messages. **Pickle shows if they match.**

[![GitHub release](https://img.shields.io/github/v/release/adityaarsharma/pickle?style=flat-square&color=22c55e)](https://github.com/adityaarsharma/pickle/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-skill-orange?style=flat-square)](https://claude.com/claude-code)
[![MCP](https://img.shields.io/badge/MCP-server-purple?style=flat-square)](https://modelcontextprotocol.io)
[![GitHub stars](https://img.shields.io/github/stars/adityaarsharma/pickle?style=flat-square)](https://github.com/adityaarsharma/pickle/stargazers)

**What it is:** A free, open-source Claude Code skill suite + MCP server for managers and engineering/product/marketing leads. Audits team performance across ClickUp, Slack, and Microsoft Teams. Compares standup commitments to task evidence. Generates weekly performance reports automatically.

**Built by [Aditya Sharma](https://adityaarsharma.com)** · **MIT licensed** · **Runs 100% on your machine** · **No telemetry, no phone-home, no cloud**

**Keywords:** Claude Code · Claude Skill · MCP Server · ClickUp · Slack · Microsoft Teams · Team Management · Standup Bot · Performance Report · Engineering Manager · Remote Team · AI Productivity · Project Management AI

---

## The problem Pickle solves

Your team logs 40 hours on a task. The status still says "in progress." The description is blank. The last comment was three weeks ago.

Your standup says "wrapping it up." Pickle says: *there is no evidence of that.*

No other tool compares what your team **said** they'd do against what the **tasks actually show**. ClickUp Brain summarises tasks. Slack AI summarises threads. Neither checks if the two match. Pickle does.

---

## What Pickle catches automatically

- **Said vs done gap** — standup claimed "done", task still open, no delivery comment → flagged
- **Zombie tasks** — assigned, "in progress" for 30+ days, no activity → named and escalated
- **Empty hours** — time logged with no description → "Xh tracked, zero context"
- **Standup copy-paste** — same update 3 days running → flagged as no real update
- **Expired promises** — "will finish by Friday" → it's Tuesday → still open → flagged
- **Blocker age** — blocker raised 14 days ago, never cleared → escalated with day count
- **Effort-output mismatch** — 40h logged, still open, no comments → "what is the current state?"
- **Manager-side blockers** — Pickle tracks when *you* are the bottleneck, not just your team

---

## Three platforms. Three independent tools.

Pickle covers **ClickUp**, **Slack**, and **Microsoft Teams**. Each ecosystem stays completely isolated — data never crosses between them.

### 👤 Personal inbox — what needs your action

```
/pickle-clickup 24h          # ClickUp inbox — last 24 hours
/pickle-clickup 7d followup  # last week + draft follow-ups
/pickle-slack 24h            # Slack inbox
/pickle-teams 24h            # Microsoft Teams inbox (DMs, channels, Planner)
/pickle-teams 7d followup    # Teams + draft follow-up messages
```

Each command reads every surface in that ecosystem — DMs, channels, group chats, task/card comments, threaded replies, assigned comments, reminders, Planner tasks — and gives you a ranked inbox of what needs your action right now.

### 🧑‍💼 For managers — `/pickle-report`

Scans your team's standups, DMs, task cards, time entries, and comments in ClickUp. Compares commitment to evidence. Posts a full per-person report to the team channel with scores, patterns, action items, and private escalation flags.

```
/pickle-report marketing-hq 7d     # weekly team pulse
/pickle-report engineering-hq 14d  # two-week view
/pickle-report design-hq 1m        # monthly rollup from stored reports (no ClickUp scan needed)
```

**What the report covers per person:**
- Per-day activity breakdown (every standup, DM, task event)
- Verified Output — every task touched, with evidence source
- Truly Done Check — status closed + description + time tracked (all three required)
- Score: Delivery % | Time Docs % | Card Updates % | Presence %
- Team velocity trend across last 4 reports (↑↑ ↑ → ↓ ↓↓)
- Standup copy-paste detection — same update 3+ days = flagged
- Expired promises — "will finish by Friday" + still open = flagged
- Blocker age — how many days unresolved, auto-escalates at 14 days
- Escalation watch — 3+ declining reports or same unresolved flag 4+ weeks
- Private manager section — what *you* need to unblock

---

## Install

Open Claude Code. Paste this message into chat:

**For managers:**
```
Install Pickle (manager version) by running: curl -fsSL https://raw.githubusercontent.com/adityaarsharma/pickle/main/install-manager.sh | bash
```

**For team members:**
```
Install Pickle (team member version) by running: curl -fsSL https://raw.githubusercontent.com/adityaarsharma/pickle/main/install-team.sh | bash
```

After install, `/pickle-setup` runs automatically. Takes 2 minutes. Asks your name, role, and ClickUp API token — then you're live.

**Requires:** Node.js LTS ([nodejs.org](https://nodejs.org))

---

## Connect ClickUp — 30 seconds

Pickle uses its own free MCP server. No third-party connector needed. Your token stays on your machine.

1. Open [app.clickup.com](https://app.clickup.com) → avatar → Settings → Integrations & ClickApps → ClickUp API
2. Click **Generate** → copy the `pk_…` token
3. Paste it when `/pickle-setup` asks
4. Quit Claude Code (Cmd+Q) and reopen — done

Token is stored in `~/.claude.json` on your machine. Never uploaded anywhere.

## Connect Slack — 2 minutes

Pickle reads Slack via your own user token — not a shared app, not a connector. Full DM and channel access.

`/pickle-setup` walks you through creating a free Slack app and pasting the `xoxp-` token. Takes 2 minutes. Always free on every Slack plan.

## Connect Microsoft Teams

Two paths — both free:

**Option A: Official connector** (easiest)
1. claude.ai → Settings → Connectors → Microsoft Teams → Connect
2. Complete OAuth in your browser
3. Restart Claude Code → run `/pickle-teams`

**Option B: Azure AD app token** (persistent, recommended for power users)
1. portal.azure.com → App registrations → New registration
2. Add Graph API permissions: `Chat.Read`, `ChannelMessage.Read.All`, `Team.ReadBasic.All`, `User.Read`, `Tasks.ReadWrite`, `offline_access`
3. Run device flow auth — `/pickle-teams` will guide you through it step by step
4. Token saved to `~/.claude/pickle/teams-config.json` and auto-refreshes

**Quick test with Graph Explorer** (1-hour token, no app needed):
1. developer.microsoft.com/graph/graph-explorer → sign in
2. Copy the `Authorization: Bearer eyJ...` token from DevTools
3. `echo '{"access_token":"PASTE_HERE"}' > ~/.claude/pickle/teams-config.json`
4. Run `/pickle-teams`

Required permissions: `Chat.Read` · `ChannelMessage.Read.All` · `Team.ReadBasic.All` · `User.Read` · `Tasks.ReadWrite`

---

## Every surface covered

| Source | ClickUp | Slack | Teams |
|--------|---------|-------|-------|
| Channels | ✅ | ✅ | ✅ |
| Direct messages (1:1) | ✅ | ✅ | ✅ |
| Group DMs / group chats | ✅ | ✅ | ✅ |
| Meeting chats | — | — | ✅ |
| Task comments + threads | ✅ | — | — |
| Task descriptions | ✅ | — | — |
| Time entries with descriptions | ✅ | — | — |
| Assigned/delegated comments | ✅ | — | — |
| Planner tasks | — | — | ✅ |
| Reminders | ✅ | ✅ | — |
| Approvals (Adaptive Cards) | — | — | ✅ |

---

## Privacy — your data never leaves your machine

Pickle runs entirely inside your Claude Code session. There is no Pickle server. Your ClickUp token, Slack token, chat messages, and task data are never sent anywhere except the standard Claude API call. You can verify this by reading the source — it's all here in this repo.

**To revoke access instantly:**
- ClickUp: Settings → Integrations & ClickApps → ClickUp API → Generate a new token (old one dies immediately)
- Slack: api.slack.com/apps → your Pickle app → Install App → Revoke

---

## Update

```
/pickle-update
```

Pulls the latest version from GitHub. Your tokens, role, and report history are untouched.

---

## Uninstall

```bash
rm -rf ~/.claude/skills/pickle-clickup \
       ~/.claude/skills/pickle-slack \
       ~/.claude/skills/pickle-teams \
       ~/.claude/skills/pickle-report \
       ~/.claude/skills/pickle-update \
       ~/.claude/pickle-mcp \
       ~/.claude/pickle
```

Remove the `mcpServers.clickup` and/or `mcpServers.slack` entries from `~/.claude.json`.

---

## What Pickle will never do

- Auto-send any message without your confirmation
- Post to public channels or group DMs on your behalf
- Send a third follow-up to someone you've already nudged twice
- Upload your tokens, messages, or task data anywhere
- Charge you — free forever for solo use

---

Built by [Aditya Sharma](https://adityaarsharma.com) · [adityaarsharma.com/pickle](https://adityaarsharma.com/pickle) · MIT License
