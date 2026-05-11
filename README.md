# 🥒 Pickle

> **ClickUp Brain shows your tasks. Slack AI shows your messages. Pickle shows if they match.**

Built by [Aditya Sharma](https://adityaarsharma.com). MIT licensed. **Runs 100% on your machine.**

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

## Two tools in one

### 👤 For you — `/pickle-clickup` and `/pickle-slack`

Reads every surface where work decisions happen — DMs, channels, task comments, threaded replies, assigned comments, reminders — and gives you a ranked inbox of what needs your attention right now.

```
/pickle-clickup 24h          # everything in ClickUp that needs you
/pickle-clickup 7d followup  # last week + draft follow-ups
/pickle-slack 24h            # same for Slack
```

### 🧑‍💼 For managers — `/pickle-report`

Scans your team's standups, DMs, task cards, time entries, and comments. Compares commitment to evidence. Posts a full per-person report to the team channel with scores, patterns, action items, and private escalation flags.

```
/pickle-report marketing-hq 7d     # weekly team pulse
/pickle-report engineering-hq 14d  # two-week view
/pickle-report design-hq 1m        # monthly rollup from stored reports
```

**What the report covers per person:**
- Per-day activity breakdown (every standup, DM, task event)
- Verified Output — every task touched, with evidence source
- Truly Done Check — status closed + description + time tracked (all three required)
- Score: Delivery % | Time Docs % | Card Updates % | Presence %
- Team velocity trend across last 4 reports (↑↑ ↑ → ↓ ↓↓)
- Escalation watch — recurring flags, blocker age, expired commitments
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

---

## Every surface covered

| Source | ClickUp | Slack |
|--------|---------|-------|
| Channels | ✅ | ✅ |
| Direct messages | ✅ | ✅ |
| Group DMs | ✅ | ✅ |
| Task comments + threads | ✅ | — |
| Task descriptions | ✅ | — |
| Time entries with descriptions | ✅ | — |
| Assigned/delegated comments | ✅ | — |
| Reminders | ✅ | ✅ |

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
