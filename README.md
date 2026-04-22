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

## Install

```
/pickle-setup
```

Takes about 3 minutes. Pickle asks your name + role, which ecosystem (ClickUp / Slack / both), handles the auth. One restart. You're live.

## Daily usage

```
/pickle-clickup            # scan last 24 hours
/pickle-clickup 7d         # last week
/pickle-clickup 24h followup   # scan + draft follow-up reminders

/pickle-slack              # same for Slack
/pickle-slack 7d
```

ClickUp data and Slack data stay completely separate — never mixed.

## Update

When a new version drops, run:

```bash
bash ~/.claude/pickle-mcp/update.sh
```

Or the universal one-liner (works for any install):

```bash
curl -fsSL https://raw.githubusercontent.com/adityaarsharma/pickle/main/update.sh | bash
```

Auto-detects what you have, only updates those pieces, keeps your preferences untouched.

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
rm -rf ~/.claude/skills/pickle-clickup ~/.claude/skills/pickle-slack ~/.claude/skills/pickle-setup ~/.claude/pickle-mcp
```

Then remove the `mcpServers.clickup` block from `~/.claude.json` if you added one. That's the entire uninstall — no services, no system files.

---

## Credits

Built by [Aditya Sharma](https://github.com/adityaarsharma). MIT licensed. Contributions welcome.
