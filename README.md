# 🥒 Pickle — AI Manager Productivity for Claude Code

> **The Claude Code skill suite for managers and teams using ClickUp, Slack, and Microsoft Teams.**
> ClickUp Brain shows your tasks. Slack AI shows your messages. **Pickle shows if they match.**

[![GitHub release](https://img.shields.io/github/v/release/adityaarsharma/pickle?style=flat-square&color=22c55e)](https://github.com/adityaarsharma/pickle/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-skill-orange?style=flat-square)](https://claude.com/claude-code)
[![MCP](https://img.shields.io/badge/MCP-server-purple?style=flat-square)](https://modelcontextprotocol.io)
[![GitHub stars](https://img.shields.io/github/stars/adityaarsharma/pickle?style=flat-square)](https://github.com/adityaarsharma/pickle/stargazers)

**What it is:** A Claude Code skill suite + MCP server for managers and engineering/product/marketing leads. Audits team performance across ClickUp, Slack, and Microsoft Teams. Compares standup commitments to task evidence. Generates weekly performance reports automatically.

**Built by [Aditya Sharma](https://adityaarsharma.com)** · **Runs 100% on your machine** · **No telemetry, no phone-home, no cloud**

**Keywords:** Claude Code · Claude Skill · MCP Server · ClickUp · Slack · Microsoft Teams · Team Management · Standup Bot · Performance Report · Engineering Manager · Remote Team · AI Productivity · Project Management AI

---

## The problem Pickle solves

Your team logs 40 hours on a task. The status still says "in progress." The description is blank. The last comment was three weeks ago.

Your standup says "wrapping it up." Pickle says: *there is no evidence of that.*

No other tool compares what your team **said** they'd do against what the **tasks actually show**. ClickUp Brain summarises tasks. Slack AI summarises threads. Neither checks if the two match. Pickle does.

---

## 13 patterns Pickle catches that no native tool surfaces

Every pattern below is something Pickle detects automatically across ClickUp, Slack, and Teams. Each is a real failure mode that looks fine on the dashboard but isn't.

| # | Pattern | What goes wrong | What Pickle does |
|---|---|---|---|
| 1 | **Empty hours** | 40h logged on a task, description blank, zero context | Flags hours + task — "what did those hours buy?" |
| 2 | **Stale "in progress"** | "In progress" for 6 weeks, no comment in 3 | Names the task with days-since-last-update |
| 3 | **Zombie tasks** | Assigned 30+ days, never mentioned in standup or DM | Surfaces with link, age, hours, comment count |
| 4 | **Standup copy-paste** | Same standup text 3+ days running = no real update | Detects similarity, marks those days zero-evidence |
| 5 | **Expired promises** | "By Friday" said Monday → Tuesday now → still open | Tracks temporal commits, flags by exact quote |
| 6 | **Blocker age** | Blocker raised 14 days ago, nobody cleared it | Days-unresolved on every blocker, auto-🔴 at 14d |
| 7 | **Effort-output mismatch** | 40h+ logged + still open + no comments in window | Critical flag with hours + comment count cited |
| 8 | **Ghost mode** | Silent in channels for 40%+ of the window | Flags presence gap + checks if DM-active |
| 9 | **DM-only completion** | "Done" claimed in DM, task card never updated | Partial credit + card hygiene flag |
| 10 | **Description quality** | "8h development" tells nothing about what shipped | Scores description quality, not just hours |
| 11 | **Manager-side blocker** | YOU are the bottleneck on someone's work | Tracks tasks awaiting you, flags age |
| 12 | **Cross-team handoff in DM** | Decision made in group DM never reaches the card | Scans group DMs, links to relevant task |
| 13 | **Recurring zombie** | Same task stale across 3+ reports = task graveyard | "Recurring zombie" pattern with first-flag date |

---

## 5 use cases Pickle is built for

| Use case | Replaces | One command |
|---|---|---|
| **Weekly team pulse** | 45-min Monday status meeting | `/pickle-report marketing-hq 7d` |
| **Performance review prep** | 3 hours digging through history | Velocity trend + flag history pre-rendered |
| **Returning from vacation** ★ | Wall of 200+ unread messages | `/pickle-clickup 7d` → ranked 7 items |
| **Auto-escalation** | Manual pattern matching across weeks | Pickle flags 3+ declining reports automatically |
| **Monthly rollup** | Re-scanning a month of ClickUp data | `/pickle-report channel 1m` synthesises from memory |

---

## How you use Pickle

Pickle is one product. It reads three platforms — **ClickUp**, **Slack**, **Microsoft Teams** — and keeps each ecosystem isolated (data never crosses between them).

```
/pickle-clickup 24h          # what needs you in ClickUp — last 24h
/pickle-clickup 7d followup  # past week + draft follow-ups for stuff you're owed
/pickle-slack 24h            # same, from Slack
/pickle-teams 24h            # same, from Microsoft Teams (incl. Planner + meetings)
```

Each command scans every surface in that ecosystem — DMs, channels, group chats, task/card comments, threaded replies, assigned comments, reminders — and gives you a ranked inbox of what needs your action right now.

**If you also manage a team in ClickUp,** Pickle has a Manager Mode — same install, one extra command that points at a department channel and posts a team-performance report there:

```
/pickle-report marketing-hq 7d   # weekly pulse for the marketing-hq channel
```

Manager Mode uses the same MCP server and the same patterns from the table above — it just applies them across an entire team's week and posts the synthesis back to the channel.

---

## Why Pickle vs each platform's native AI

Every ecosystem now has its own AI: ClickUp Brain inside ClickUp, Slack AI inside Slack, Microsoft Copilot inside Teams. Each does one thing well — **summarise what's inside that one tool**. None of them can read across the others. None compare what your team said in chat against what the tasks actually show.

That cross-tool synthesis is the entire point of Pickle.

### Pickle on ClickUp vs ClickUp Brain

(For a ClickUp user — what does Pickle do that Brain doesn't, inside ClickUp.)

| Capability inside ClickUp | ClickUp Brain | Pickle |
|---|---|---|
| Summarises a task | ✅ | ✅ |
| Generates task descriptions for you | ✅ | — |
| Ranked inbox of comments + mentions across all your tasks | ❌ | ✅ |
| Treats unresolved task comments assigned to you as inbox items | ❌ | ✅ |
| Tracks comments you assigned to others (delegated work) | ❌ | ✅ |
| Flags time entries with empty / "8h development"-style descriptions | ❌ | ✅ |
| Detects zombie tasks (assigned, open 30+ days, no activity) | ❌ | ✅ |
| Compares standup chat messages against task evidence | ❌ | ✅ |
| Tracks blocker age across reports | ❌ | ✅ |
| Detects standup copy-paste (same text 3+ days) | ❌ | ✅ |
| Tracks expired promises ("by Friday") on tasks | ❌ | ✅ |
| Per-person weekly team performance report | ❌ | ✅ |
| Runs on your machine | ❌ (cloud) | ✅ |

**Where ClickUp Brain falls short:** Brain writes for you — descriptions, summaries, action items. It doesn't audit. It can't tell you that a task has 40 hours logged with empty descriptions, or that the standup said "shipping today" 4 days ago. Pickle audits.

### Pickle on Slack vs Slack AI

(For a Slack user — what does Pickle do that Slack AI doesn't, inside Slack.)

| Capability inside Slack | Slack AI | Pickle |
|---|---|---|
| Summarises a thread or channel | ✅ | ✅ |
| Daily channel recap | ✅ | ✅ |
| Treats unanswered DMs as actionable inbox items | ❌ | ✅ |
| Tracks @mentions across channels with no reply from you | ❌ | ✅ |
| Tracks what YOU delegated and haven't heard back on (Mode B) | ❌ | ✅ |
| Drafts follow-up messages and waits for your approval | ❌ | ✅ |
| Refuses to send a 3rd nudge to the same person | ❌ | ✅ |
| Scores Slack messages by your role (founder vs dev vs marketer) | ❌ | ✅ |
| Reminds you back inside Slack when the scan finds something | ❌ | ✅ |
| Runs on your machine | ❌ (cloud) | ✅ |

**Where Slack AI falls short:** Slack AI summarises. It doesn't follow up. A DM where someone's been waiting 4 days for your decision shows up in Pickle's inbox; Slack AI will tell you it exists if you ask, but won't surface it.

### Pickle on Teams vs Microsoft Copilot for Teams

(For a Teams user — what does Pickle do that Copilot doesn't, inside Teams.)

| Capability inside Teams | Copilot for Teams | Pickle |
|---|---|---|
| Summarises a meeting | ✅ | meeting action items only |
| Drafts replies in Teams | ✅ | — |
| Reads Planner tasks assigned to you | ✅ | ✅ |
| Treats unanswered 1:1 DMs + group chats as inbox items | ❌ | ✅ |
| Detects Approvals-app messages and adaptive cards as inbox items | partial | ✅ |
| Tracks delegated Planner tasks (you assigned, awaiting completion) | ❌ | ✅ |
| Pulls action items from meeting chat transcripts | partial | ✅ |
| Refuses to send a 3rd follow-up to the same person | ❌ | ✅ |
| Scores by your role (CEO vs dev vs marketer) | ❌ | ✅ |
| Runs on your machine | ❌ (cloud) | ✅ |

**Where Copilot for Teams falls short:** Copilot helps you write inside a meeting or thread. It doesn't run a daily audit. Action items from yesterday's meeting that nobody followed up on don't surface unless you specifically ask. Pickle surfaces them automatically.

### The one-line summary

> Native AIs (ClickUp Brain, Slack AI, Microsoft Copilot) **write** for you inside their tool.
> Pickle **audits** what's already there and tells you what needs your action — across whichever platforms you use.

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

Pickle uses its own MCP server. No third-party connector needed. Your token stays on your machine.

1. Open [app.clickup.com](https://app.clickup.com) → avatar → Settings → Integrations & ClickApps → ClickUp API
2. Click **Generate** → copy the `pk_…` token
3. Paste it when `/pickle-setup` asks
4. Quit Claude Code (Cmd+Q) and reopen — done

Token is stored in `~/.claude.json` on your machine. Never uploaded anywhere.

## Connect Slack — 2 minutes

Pickle reads Slack via your own user token — not a shared app, not a connector. Full DM and channel access.

`/pickle-setup` walks you through creating a free Slack app and pasting the `xoxp-` token. Takes 2 minutes. Always free on every Slack plan.

## Connect Microsoft Teams

Pickle reads Teams via your own Microsoft Graph API token — no third-party connector, your token stays on your machine. `/pickle-teams` walks you through it the first time you run it.

**Persistent setup** (one-time, auto-refreshes after):
1. [portal.azure.com](https://portal.azure.com) → App registrations → New registration ("Pickle CLI", Personal Microsoft accounts)
2. API permissions → Add → Microsoft Graph (Delegated): `Chat.Read`, `ChannelMessage.Read.All`, `Team.ReadBasic.All`, `User.Read`, `Tasks.ReadWrite`, `offline_access`
3. `/pickle-teams` runs the device-flow sign-in for you and saves the token to `~/.claude/pickle/teams-config.json`

**Quick test** (1-hour token, no Azure app needed):
1. [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer) → sign in with your Teams account
2. DevTools → Network → copy the `Authorization: Bearer …` value
3. `/pickle-teams` will prompt to paste the token — done

Token file is created with `chmod 600`. Auto-refreshes if you used the Azure app path.

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

---

Built by [Aditya Sharma](https://adityaarsharma.com) · [adityaarsharma.com/pickle](https://adityaarsharma.com/pickle)
