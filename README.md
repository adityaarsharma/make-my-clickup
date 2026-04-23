# 🥒 Pickle

> **In a pickle? Pickle sorts it.**
>
> Every morning, 200+ messages across ClickUp and Slack. Half are noise. A few are decisions waiting on you. Pickle reads everything, keeps the few that matter, and drops them in your personal task board — ranked by what YOU actually do.

Built by [Aditya Sharma](https://github.com/adityaarsharma). MIT licensed. Free forever.

---

## The problem

You wake up. Open ClickUp. Open Slack. 47 unread threads. You scan, skim, miss the one DM where a teammate's been waiting 2 days for your approval. By 11am, someone pings: *"any update on the thing I sent Monday?"*

The problem isn't you. Your attention is spread across channels, DMs, task comments, and threaded replies — and no single view tells you *"here's what needs you right now."*

## What Pickle does

**Mode A — Inbox** 📥 — Every message that needs your action:
- DMs and group DMs you're in (questions, approvals, decisions)
- Channel messages where you're @mentioned
- Task comments on tasks you own or watch
- Docs where someone tagged you
- Reminders others set for you

**Mode B — Follow-up Tracker** 🔁 — Every thread where someone owes YOU something:
- You asked → they said "will do" → 3 days of silence
- You asked for a file → they replied "sure" but never sent it
- You set a recurring ask → updates stopped after Tuesday

Pickle creates prioritised tasks in your personal board, ranked by urgency and by what your role actually cares about. You go from 47 threads to 7 tasks.

## What makes Pickle different

### 🎯 Scored by YOUR role, not a generic rule
During setup, Pickle asks your role (CEO, Developer, Marketer, Designer, PM, Sales, etc.) and one line about what you do day-to-day. It uses that as a lens — a CEO sees partnership and approval asks ranked higher; a developer sees PR reviews and production blockers; a marketer sees copy approvals and launch decisions. Nothing gets hidden — role only reorders, never filters out.

### 📬 Catches DMs that others miss
In a private DM or group DM that includes you, every unanswered question is yours — even if it's technically addressed to someone else in the thread. That's how work actually flows. Pickle knows this.

### 🌐 Reads intent, not just keywords
Teams write in whatever language is natural — and Pickle reads the *meaning*, not the exact phrase. "Can you confirm?", "please approve", and any local-language equivalent all register the same way.

### 🚫 Never auto-sends
Every follow-up message is drafted, shown to you, and only sent after you say so. If you've already nudged someone twice, Pickle refuses to send a third — it suggests you talk to them directly. No awkward spam-your-teammate moments.

### 🔒 Runs on your machine
No Pickle server exists. Your chat data never leaves your laptop. The only network calls are directly from your machine to the official ClickUp / Slack APIs, using your own session.

### 💰 Free forever
Both supported paths are 100% free. No trial, no paid tier, no credit card.

---

## Two versions of Pickle

Pickle ships as two separate installs targeting different people on a team.

### 🧑‍💼 Pickle Manager
For team leads and managers. Scans the whole team.

| Command | What it does |
|---------|-------------|
| `/pickle-report [channel] [window]` | Team performance pulse — commitment vs execution vs time tracking |
| `/pickle-clickup [window]` | Personal ClickUp inbox — what needs your action |
| `/pickle-slack [window]` | Personal Slack inbox — same, from Slack |

### 👤 Pickle Team Member
For individual contributors. Shows you your own board.

| Command | What it does |
|---------|-------------|
| `/pickle-me` | Daily briefing — your tasks, overdue, zombies, standup gaps, blockers |
| `/pickle-me 7d` | Same, but with 7-day context window |

Both versions are completely isolated. Team members never see manager commands. Managers never clutter team members with report tools. Each version installs only what it needs.

---

## Install

Two separate install links — share the right one with each person.

### 🧑‍💼 For managers and team leads

Paste into Claude Code:

```
Install Pickle from github.com/adityaarsharma/pickle and run /pickle-setup manager
```

Installs: `/pickle-report` · `/pickle-clickup` · `/pickle-slack` · `/pickle-update`

Takes about 3 minutes. Walks through name, role, ClickUp/Slack auth. One restart. You're live.

### 👤 For team members

Paste into Claude Code:

```
Install Pickle from github.com/adityaarsharma/pickle and run /pickle-setup team
```

Installs: `/pickle-me` · `/pickle-update`

Takes about 2 minutes. Connects ClickUp only. No manager commands, no report tools.

> **Repo:** [github.com/adityaarsharma/pickle](https://github.com/adityaarsharma/pickle)

**Setup is one-time only** — `/pickle-setup` self-removes after it completes. You never run it again.

Pickle ships its own free open-source MCPs — no paid dependencies:
- `pickle-mcp/clickup/` — ClickUp tasks, comments, docs, reminders
- `pickle-mcp/slack/` — Slack Lists, reminders, messaging

## Daily usage

**For managers:**
```
/pickle-clickup            # scan last 24 hours
/pickle-clickup 7d         # last week
/pickle-clickup 24h followup   # scan + draft follow-up reminders

/pickle-slack              # same for Slack
/pickle-slack 7d

/pickle-report marketing-hq        # team pulse
/pickle-report engineering-hq 14d  # two-week view
```

**For team members:**
```
/pickle-me        # daily briefing — your board, overdue, gaps
/pickle-me 7d     # same with 7-day standup context
```

ClickUp data and Slack data stay completely separate — never mixed.

---

## Pickle Manager — Team Performance Reports

```
/pickle-report marketing-hq        # weekly report for the marketing team
/pickle-report engineering-hq 14d  # 2-week view for engineering
/pickle-report design-hq 7d        # design team pulse
```

Pickle Manager scans what your team said they'd do (ClickUp chat) vs what they actually tracked (task cards, time logs, comments). Per person: delivery rate, time efficiency, update compliance, channel presence. Posts a smart, non-offensive report back to the department channel. Flags underperformers to you directly.

**What it analyses:**
- 📋 Commitments made in chat → matched to real task completion
- 🕐 Time tracked vs estimated (per-task efficiency)
- 🧟 Zombie tasks — assigned but untouched for 5+ days
- 💬 Task documentation quality (descriptions, progress comments)
- 👻 Ghost mode — team members silent for 40%+ of the window
- 📉 Trends over time — is someone consistently slipping, or improving?

**Truly Done standard:** A task only counts as complete when ALL THREE are true — status closed + description filled + time tracked. Ghost closures (closed with no description) and untracked completions are both flagged.

**What it posts:**
A structured report in the department's ClickUp channel (from your account), tagging each team member with their individual summary. Flags section for your eyes — anything that needs a direct conversation.

**Local memory:** Stores efficiency trends per person in `~/.claude/skills/pickle-report/state.json`. After 3+ runs, detects recurring patterns and escalates with appropriate weight. The state file stays local — never committed to GitHub.

> **Scope:** ClickUp only for now. Slack report coming later. Requires ClickUp MCP connected.

## Pickle Team Member — Personal Daily Briefing

```
/pickle-me          # your board right now — overdue, zombies, gaps
/pickle-me 7d       # same with 7-day standup context
```

The personal version of Pickle. Run it at the start of your day. It shows you:
- Every task assigned to you, ranked by urgency
- What's overdue and by how many days
- Zombie tasks you haven't touched in 5+ days
- Gaps between what you said in standup vs what your cards actually show
- Blockers you mentioned that are still unresolved

After the briefing it can optionally draft your standup message for the day.

**Local memory:** Tracks your run history in `~/.claude/skills/pickle-me/state.json`. Supports snoozing tasks you've already acknowledged.

## Update

```
/pickle-update
```

That's it. No terminal, no copy-paste. Auto-detects what you have, pulls the latest, tells you to Cmd+Q and reopen Claude Code. Your tokens, role, and task history stay untouched.

> **Note:** `/pickle-update` overwrites `SKILL.md` files with the latest repo versions. If you've hand-edited any Pickle skill locally (e.g. added custom noise-channel patterns), copy your edits somewhere safe before updating — they'll be replaced.

---

## How Pickle connects to ClickUp / Slack

Two free paths per ecosystem. `/pickle-setup` walks you through either — you don't need to pick upfront.

### 🔵 ClickUp

| Path | Best for | Setup |
|------|---------|-------|
| **Official Claude Connector** (recommended) | Personal Claude accounts | claude.ai → Settings → Connectors → ClickUp → Connect. 2 clicks, no terminal. |
| **Pickle's own MCP** (personal token) | Shared Claude accounts — each person keeps their own ClickUp session | Paste your ClickUp API token. Pickle's free, MIT-licensed MCP server runs locally. |

**Getting your ClickUp API token** (only for the token path):
1. Open [app.clickup.com/settings/apps](https://app.clickup.com/settings/apps)
2. Under "API Token" → click **Generate** (or Regenerate)
3. Copy the token starting with `pk_…`
4. Paste it into `/pickle-setup` when prompted. The token stays in `~/.claude.json` on your machine — never uploaded.

To revoke: same page → Regenerate → old token dies instantly.

### 💬 Slack

| Path | Best for | Setup |
|------|---------|-------|
| **Official Claude Connector** (recommended) | Personal Claude accounts | claude.ai → Settings → Connectors → Slack → Connect. 2 clicks. |
| **Your own Slack App + User OAuth token** | Shared Claude accounts, or workspaces where admin-approved connectors are blocked | Create a free Slack app, install to your workspace, paste the `xoxp-` token. |

**Getting your Slack User OAuth token** (only for the token path — takes ~2 minutes):
1. Open [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → From scratch
2. Name it "Pickle", pick your workspace
3. Left sidebar → **OAuth & Permissions** → scroll to **User Token Scopes** and add:
   ```
   channels:history   groups:history   im:history      mpim:history
   channels:read      groups:read      im:read         mpim:read
   users:read         chat:write       search:read     reminders:write
   lists:read         lists:write
   ```
4. Scroll up → **Install to Workspace** → approve
5. Copy the **User OAuth Token** starting with `xoxp-…`
6. Paste it into `/pickle-setup`. Token stays in `~/.claude.json` — never uploaded.

To revoke: api.slack.com/apps → your Pickle app → Install App → Revoke. 5 seconds.

**Which Slack MCP does Pickle use?** The token path wires up [`korotovsky/slack-mcp-server`](https://github.com/korotovsky/slack-mcp-server) — a free, open-source MCP that already covers Slack's full scan surface (channels, DMs, group DMs, threads, search, reminders, lists). No need to reinvent it.

### 🔐 Both APIs are free

ClickUp API: free on every plan, no per-call billing. Slack API: free on every workspace plan (including free tier). Pickle will never recommend a paid upgrade to unlock features.

---

## Every surface covered

| Source | ClickUp | Slack |
|--------|---------|-------|
| Channels | ✅ | ✅ |
| Direct messages | ✅ | ✅ |
| Group DMs | ✅ | ✅ (mpim) |
| Task comments | ✅ | — |
| Threaded replies | ✅ | ✅ |
| Task descriptions / mentions | ✅ | — |
| Docs / canvas mentions | ✅ | — |
| Reminders | ✅ | ✅ |

No corner left unscanned.

---

## What Pickle will never do

- ❌ Auto-send any message without your confirmation
- ❌ Post in public channels on your behalf
- ❌ Hide a message because your role "doesn't care" about it
- ❌ Send a third follow-up to someone you've already nudged twice
- ❌ Upload your chat data anywhere — it all stays on your machine

---

## Uninstall

```bash
rm -rf \
  ~/.claude/skills/pickle-clickup \
  ~/.claude/skills/pickle-slack \
  ~/.claude/skills/pickle-report \
  ~/.claude/skills/pickle-me \
  ~/.claude/skills/pickle-setup \
  ~/.claude/skills/pickle-update \
  ~/.claude/pickle-mcp \
  ~/.claude/pickle
```

Then remove the `mcpServers.clickup` and/or `mcpServers.slack` blocks from `~/.claude.json` if they exist. That's the entire uninstall — no services, no system files.

---

## Credits

Built by [Aditya Sharma](https://github.com/adityaarsharma). MIT licensed. Contributions welcome.
