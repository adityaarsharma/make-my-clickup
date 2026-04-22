# 🥒 Pickle

> **In a pickle? Pickle sorts it.**
>
> A Claude Code skill that scans ClickUp + Slack, extracts what actually needs your attention, and creates prioritised tasks in your personal board — in any language, from any corner.

Built by [Aditya Sharma](https://github.com/adityaarsharma). MIT licensed. 100% free, forever.

---

## What Pickle does

Every morning (or whenever you run it), Pickle scans **every corner** of your work chat and hands you a prioritised inbox of what actually needs you:

### Mode A — Inbox 📥
What needs YOUR action right now:
- DMs and group DMs you're in (questions, decisions, approvals)
- Channel messages where you're @mentioned
- Task comments on tasks you own or watch
- Docs where you're mentioned
- Reminders others set for you

### Mode B — Follow-up Tracker 🔁
What OTHERS owe YOU:
- You asked → they acknowledged but never delivered
- You asked → no reply at all
- You asked → they said "will do" 3 days ago

Optional: `/pickle-clickup 24h followup` — Pickle drafts reminder messages and asks before sending.

---

## Why Pickle is different

### 🌐 Multilingual intent detection
Hindi, Gujarati, English — or any mix in one sentence. Pickle understands the **meaning**, not just keywords.

| Meaning | English | Hindi/Hinglish | Gujarati |
|---------|---------|----------------|----------|
| Waiting for approval | "once you confirm" | "aap bolo toh karunga" | "tame confirm karo" |
| Asking for opinion | "what do you think" | "kya lagta hai" | "tame shu vicharcho" |
| Task request | "please do this" | "yeh karo", "ho jayega?" | "aa karo", "thase?" |

### 📬 DM-aware
In a DM or group DM that includes you, **every question or pending decision is yours to see — @mention NOT required.** Because in a private conversation, you're implicitly the audience. That's how you stop missing things.

### 🎯 Personalised scoring
During `/pickle-setup`, you tell Pickle your **role** (Founder, Dev, Marketer, etc.) and a one-line "what I do day-to-day". Pickle uses that as a PERSPECTIVE — a CEO gets approvals/deals boosted, a dev gets PR reviews/incidents boosted, a marketer gets copy approvals/launches boosted.

**Nothing is hidden by role.** Role only reorders priority — the inbox still catches everything.

### 🔒 Your data stays on your machine
Pickle has no server. No phone-home. No telemetry. The only network calls are directly to ClickUp's / Slack's official APIs — from YOUR machine, using YOUR token.

### 💰 Actually free forever
Both supported paths are 100% free:
1. **Pickle's own MCP** (recommended) — bundled Node.js server, MIT licensed, no license key, no rate limits
2. **Official Claude Connector** (OAuth) — 2-click setup, rate-limited to 50-300 calls/day

Pickle does **NOT** depend on `@taazkareem/clickup-mcp-server` — that package moved to a paid model. Pickle's own MCP is a free drop-in replacement.

---

## Install

```
/pickle-setup
```

That's it. The setup skill walks you through:
1. Your name + role (2 questions, used for personalisation)
2. ClickUp, Slack, or both?
3. Auth path (OAuth connector or personal token)
4. One-time restart
5. A test scan

Takes ~3 minutes.

---

## Daily usage

```
/pickle-clickup            # scan last 24 hours
/pickle-clickup 7d         # scan last week
/pickle-clickup 24h followup   # scan + draft follow-up reminders

/pickle-slack              # same for Slack
/pickle-slack 7d
```

Or run both at once — ClickUp data and Slack data stay completely separate.

---

## Update command (never reinstall)

When a new version drops, just run:

### Form A — If you installed via personal token (pickle-mcp path)
```bash
bash ~/.claude/pickle-mcp/update.sh
```

### Form B — Universal one-liner (works for everyone)
```bash
curl -fsSL https://raw.githubusercontent.com/adityaarsharma/pickle/main/update.sh | bash
```

Both:
- ✅ Auto-detect what you have (ClickUp, Slack, or both)
- ✅ Only update those — never install anything you didn't pick
- ✅ Refresh npm deps if package.json changed
- ✅ Keep your prefs.json and state.json untouched
- ✅ Show long-form ETA with fun facts so you're never staring at a blank terminal

After the update finishes: **fully quit Claude Code (Cmd+Q on Mac) and reopen** so the MCP tools re-register.

---

## What's covered (every corner, no task missed)

| Source | Supported? |
|--------|-----------|
| ClickUp channels | ✅ |
| ClickUp DMs (1:1) | ✅ |
| ClickUp group DMs | ✅ |
| ClickUp task comments | ✅ |
| ClickUp threaded replies | ✅ |
| ClickUp task descriptions (@me) | ✅ |
| ClickUp Docs (@me) | ✅ |
| ClickUp reminders | ✅ |
| Slack channels | ✅ |
| Slack DMs | ✅ |
| Slack group DMs (mpim) | ✅ |
| Slack threads | ✅ |
| Slack mentions | ✅ |
| Slack reminders | ✅ |

---

## What Pickle NEVER does

- ❌ Never auto-sends a follow-up. Every reminder message asks you first.
- ❌ Never posts in public channels for you.
- ❌ Never hides a message because of role. Role only boosts priority.
- ❌ Never calls a second follow-up if one was already sent (escalation guard).
- ❌ Never uploads your data anywhere.

---

## Uninstall

```bash
rm -rf ~/.claude/skills/pickle-clickup
rm -rf ~/.claude/skills/pickle-slack
rm -rf ~/.claude/skills/pickle-setup
rm -rf ~/.claude/pickle-mcp
```

Then remove the `mcpServers.clickup` block from `~/.claude.json`.

That's the entire uninstall. No system files, no services, nothing else to clean up.

---

## Credits

Built by [Aditya Sharma](https://github.com/adityaarsharma) because inbox-chaos across ClickUp + Slack was eating hours every morning.

MIT licensed. Feel free to fork, PR, or extend.
