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

## Why Pickle vs each platform's native AI

Every ecosystem now has its own AI: ClickUp Brain inside ClickUp, Slack AI inside Slack, Microsoft Copilot inside Teams. Each does one thing well — **summarise what's inside that one tool**. None of them can read across the others. None compare what your team said in chat against what the tasks actually show.

That cross-tool synthesis is the entire point of Pickle.

### Pickle ClickUp vs ClickUp Brain

| Capability | ClickUp Brain | Pickle |
|---|---|---|
| Writes / summarises tasks inside ClickUp | ✅ | — |
| Generates task descriptions for you | ✅ | — |
| **Reads your Slack messages** | ❌ | ✅ |
| **Reads your Microsoft Teams messages** | ❌ | ✅ |
| **Compares "said in standup" vs "what the task shows"** | ❌ | ✅ |
| Flags empty time entry descriptions | ❌ | ✅ |
| Tracks blocker age across reports | ❌ | ✅ |
| Detects copy-paste standups | ❌ | ✅ |
| Tracks expired promises ("by Friday") | ❌ | ✅ |
| Tracks tasks where YOU are the blocker | ❌ | ✅ |
| Per-person weekly performance report | ❌ | ✅ |
| Runs on your machine | ❌ (cloud-only) | ✅ |

**Where ClickUp Brain falls short:** it can write you a task description. It cannot see that your teammate said "done" in Slack 4 hours before logging 6 more hours on the same task with no comments. Pickle reads both surfaces — Brain only reads ClickUp.

### Pickle Slack vs Slack AI

| Capability | Slack AI | Pickle |
|---|---|---|
| Summarises a thread or channel | ✅ | ✅ |
| Daily recap of channels | ✅ | ✅ |
| **Reads your ClickUp tasks** | ❌ | ✅ |
| **Reads your Microsoft Teams chats** | ❌ | ✅ |
| Tracks what YOU delegated to others (Mode B) | ❌ | ✅ |
| Auto-drafts follow-ups with your approval | ❌ | ✅ |
| Treats unanswered DMs as inbox items | ❌ | ✅ |
| Compares "said" to "done" | ❌ | ✅ |
| Runs on your machine | ❌ (cloud-only) | ✅ |

**Where Slack AI falls short:** it summarises a thread that says "I'll merge the PR today." It cannot check whether the PR was actually merged in your ClickUp workspace. Pickle reads both.

### Pickle Teams vs Microsoft Copilot for Teams

| Capability | Copilot for Teams | Pickle |
|---|---|---|
| Summarises a meeting | ✅ | meeting action items only |
| Drafts replies in Teams | ✅ | — |
| Reads Planner tasks assigned to you | ✅ | ✅ |
| **Reads your ClickUp tasks** | ❌ | ✅ |
| **Reads your Slack messages** | ❌ | ✅ |
| Tracks delegated work as Mode B follow-ups | ❌ | ✅ |
| Tracks blocker age across weeks | ❌ | ✅ |
| Generates cross-platform team performance reports | ❌ | ✅ |
| Detects Approvals app messages as inbox items | partial | ✅ |
| Runs on your machine | ❌ (cloud) | ✅ |

**Where Copilot for Teams falls short:** it pulls a meeting action item like "the report ships by Friday." It cannot follow up on Friday to check whether the report actually shipped in your ClickUp workspace. Pickle does that automatically.

### The one-line summary

> ClickUp Brain reads tasks. Slack AI reads messages. Copilot reads Microsoft.
> Pickle reads **all three** and tells you whether what was said matches what got done.

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

Two paths supported:

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

---

Built by [Aditya Sharma](https://adityaarsharma.com) · [adityaarsharma.com/pickle](https://adityaarsharma.com/pickle)
