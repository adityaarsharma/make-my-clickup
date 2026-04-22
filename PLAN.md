# Product Plan — v2.0

> Strategic plan for evolving `make-my-clickup` into a standalone, multi-source, monetisable product.

---

## 1 — Naming

### The criteria

Short (1-2 syllables). Memorable. Brandable. Works as verb ("just pickle it"). Evokes clearing / sorting / cutting noise. Domain likely available. Professional enough to charge for.

### Candidates

| Name | Meaning / Hook | Verb form | Vibe | Score |
|------|---------------|-----------|------|-------|
| **Pickle** (your pick) | "In a pickle" / "Pickle sorts it" | "pickle my inbox" | Playful, cute | 🟡 Cute but non-serious |
| **Signal** | AI cuts the *signal* from noise | "get the signal" | Serious, tech | 🟢 Strong meaning |
| **Nudge** | Nudges you · and nudges others (follow-ups) | "nudge me" | Friendly, dual-purpose | 🟢 Dual meaning 👑 |
| **Relay** | Relays what needs you · Relays follow-ups to others | "relay the work" | Team, dual-purpose | 🟢 Dual meaning |
| **Hark** | "Hark, what needs you today?" | "hark it" | Old-school, memorable | 🟡 Unusual |
| **Clutch** | The clutch play · What matters | "clutch moment" | Strong, action-y | 🟡 Already used often |
| **Sift** | Sifts signal from noise | "sift my inbox" | Descriptive | 🟢 Clear meaning |
| **Tempo** | Keeps the pace of your work | — | Calm, professional | 🟡 Generic |

### My pick: **Nudge**

Why:
- Dual meaning perfectly matches the dual product: *nudges you* (inbox scan) + *nudges others* (follow-ups)
- 1-syllable, easy to say
- `getnudge.com` / `nudge.work` likely available
- Tagline writes itself: *"Nudge clears your inbox. And your follow-ups."*
- Can grow into: Nudge for Slack, Nudge for ClickUp, Nudge for Linear

Runner-up: **Signal** — if you want to sound more "AI-tech" and less friendly.

### Honest take on Pickle

Cute, but non-serious. If this is a hobby tool → fine. If you want to charge $15/month later, a SaaS called "Pickle" needs to overcome the "is this a joke" reaction. Not impossible (Slack, Flock, Yammer all sound silly) but it's a harder climb.

---

## 2 — ClickUp: Where Do Tasks Actually Live?

You asked: *"are u making task board in any space or personal list? Also do u list them in Clickup My Tasks of the person?"*

### How ClickUp is structured

```
Workspace
  └── Space (personal or shared)
        └── Folder (optional)
              └── List
                    └── Task
```

**"My Tasks"** is not a list — it's a **view** that automatically shows every task where you're the assignee, across all lists/spaces you have access to.

### What the current skill does

1. Finds your **Personal space** (only you are a member · or named "Personal")
2. Inside it, looks for a list named `My Task Board` / `Task Board` / `Daily Inbox`
3. If none exists → creates the list inside the personal space
4. Creates tasks in that list with `assignees: [YOU]`

### Result

- ✅ Tasks are in a private list in your personal space → invisible to teammates
- ✅ Because you're the assignee → they **automatically appear in your "My Tasks" view**
- ✅ They also appear in your ClickUp Home / Today widget

So you don't need to go to the list to see them — they surface in "My Tasks" naturally.

### Edge case

If you have ClickUp's default **Personal List** (the native "Lists" → "Personal" in Home), we could optionally write there instead. Pros: one less list to manage. Cons: less customisable view.

**My recommendation:** keep creating a dedicated `My Task Board` list inside Personal space. Reason: it becomes the single source of truth for the skill, you can filter/sort it, and you can share the list UI as a "here's how I manage my day" template to team later.

---

## 3 — Connector + API (Both)

Your concern is valid: shared Claude account = shared connector = everyone's inbox gets mixed. Need both paths.

### Proposed flow

```
        /nudge setup
             │
             ▼
   ┌─────────────────────┐
   │ How do you want to  │
   │ connect?            │
   └─────────────────────┘
        │               │
   [1] Connector   [2] API Token
   (solo, fastest) (team, isolated)
        │               │
        ▼               ▼
   OAuth flow     Guide to generate pk_
                  Auto-write ~/.claude.json
                  Verify connection
```

### When to use which

| Use case | Choice |
|----------|--------|
| Solo · own Claude account | Connector (OAuth, 2 clicks) |
| Team sharing Claude seats | API token (each person, own isolation) |
| Personal + work ClickUp | API token (switch tokens, can't switch OAuth) |
| Multi-workspace ClickUp | API token (scope better) |

The skill detects which one is active and routes MCP calls accordingly.

### Open question

Right now the skill uses the official Claude connector's tool IDs (`mcp__6e1b...__clickup_*`). For API token flow, the tools become `mcp__clickup__*` (from `@taazkareem/clickup-mcp-server`). **The skill needs to work with either.**

I'd write the skill to:
- First try `clickup_get_workspace_hierarchy` (works for both)
- Fall back to the tool namespace that's available
- Document both configs in SKILL.md

---

## 4 — Slack Expansion

### Why Slack is different from ClickUp

| | ClickUp | Slack |
|--|---------|-------|
| Native task concept | ✅ Yes | ❌ No |
| Message volume | Medium | High (10x ClickUp) |
| Action items | Structured | Verbal, scattered |
| Thread depth | Shallow | Deep (long threads) |
| DMs vs channels | Channels heavier | DMs heavier |
| Reminders | Native tasks | `/remind` is weak |

### Proposed Slack plan

**Core loop (same as ClickUp):**
1. Scan channels + DMs + group DMs user is in
2. Extract action items (mentions, commitments, deadlines)
3. Track follow-ups (what you asked, did they deliver)

**Where do Slack tasks go?**

This is the product decision. Three options:

**Option A — Slack only, Slack-native:**
Create Slack reminders (`/remind me` via API) + post a daily digest to yourself in Slack
- Pro: no other tool needed
- Con: Slack reminders are weak, not really tasks

**Option B — Slack → ClickUp (unified):** ⭐ recommended
Scan Slack, create tasks in ClickUp task board alongside ClickUp-sourced tasks. One unified inbox.
- Pro: one place to work from, uses ClickUp as task engine
- Con: requires both tools connected

**Option C — Slack → any destination:**
User picks: ClickUp, Notion, Linear, Asana, Todoist
- Pro: flexible
- Con: 10x more engineering, dilutes focus

**My recommendation: start with Option B (Slack → ClickUp unified).**

One command scans both tools → creates tasks in ClickUp with source tag (`slack` / `clickup`).

```
/nudge 24h
  │
  ├── Scans ClickUp  (channels + DMs)
  ├── Scans Slack    (channels + DMs)
  ├── Dedupes        (same request in both tools = one task)
  └── Creates tasks in your ClickUp board with source tag
```

### Slack MCP setup

Same pattern as ClickUp:
- **Connector path** — claude.ai connectors → Slack
- **API path** — Slack Bot Token (`xoxb-...`) via MCP server

Slack has more complicated permissions: you need `channels:history`, `groups:history`, `im:history`, `mpim:history` scopes. Document this clearly.

---

## 5 — Smart Features Beyond What You Asked

Things that would make this a serious product:

### Tier 1 — Build in v2

1. **Cross-tool dedup** — same request in Slack + ClickUp = one task, not two
2. **Context memory** — remembers what you actioned last run, skips those on rerun (no duplicate tasks)
3. **Scheduled runs** — "run every morning at 8am" via Claude Code routines
4. **Escalation guard** — already built (after 2+ follow-ups, stops and tells you to talk directly)

### Tier 2 — Differentiators

5. **Meeting prep mode** — `/nudge prep sam` — shows every open action item involving Sam before your 1:1
6. **Weekly review** — `/nudge weekly` — different format: what got done, what's still open, who owes what
7. **Smart batching** — if 3 people ask the same question, group them ("3 pricing questions" → 1 task, 3 links)
8. **Calendar-aware due dates** — reads your calendar, avoids setting due dates during vacation / busy days

### Tier 3 — Team layer (paid)

9. **Team leader view** — "what's my team blocked on", "who has overdue follow-ups from leadership"
10. **Shared accountability** — if multiple leaders followed up on same task, don't double-ping
11. **SLA tracking** — "customer X's requests average 3 days to respond" — track response time metrics

---

## 6 — Monetisation Path

### Free tier (the skill as-is)
- Local Claude Code only, single source (ClickUp OR Slack), single user
- Drives adoption, builds community
- MIT licensed

### Pro tier ($12/mo or $99/year)
- Multi-source (Slack + ClickUp + more)
- Scheduled runs, cross-tool dedup
- Meeting prep, weekly review, smart batching
- Calendar integration
- Runs as a hosted service (not just local)

### Team tier ($20/user/mo)
- Everything in Pro
- Team leader view
- Shared follow-up accountability
- SLA tracking
- SSO, admin controls

### Path forward
- v1.x — free skill (building community, proving value)
- v2.0 — multi-source (Slack added), still free
- v3.0 — Pro launch with hosted version, scheduled runs, cross-device sync

---

## 7 — Questions I Need Answered

Before I build v2.0:

### Product
1. **Name** — Nudge, Signal, Pickle, or something else? Lock it so I can rename the skill.
2. **Slack destination** — Option B (Slack → ClickUp unified) or something else?
3. **Both paths** — confirm you want me to support Connector + API token simultaneously, not just API?

### Technical
4. **Multi-source** — should `/nudge 24h` scan BOTH Slack and ClickUp when both are connected, or should you pass source flags? (`/nudge slack 24h`, `/nudge clickup 24h`, `/nudge 24h` = all)
5. **Context memory** — is it OK if the skill stores a small JSON at `~/.claude/skills/nudge/state.json` to remember what it actioned? (needed for dedup)
6. **Scheduled runs** — is Claude Code routines enough, or do you want a hosted scheduler for later?

### Team / monetisation
7. **Open source?** — MIT now, but will you close-source v2+ when Pro launches? (I'd recommend keeping the free skill open-source forever, Pro features closed-source)
8. **Brand** — standalone product site (getnudge.com) or under POSIMYTH umbrella?

---

## 8 — Recommended Next Steps

1. **You confirm:** name, Slack destination choice, both-paths confirmation
2. **I rename** the skill from `make-my-clickup` → `nudge` (or whatever you pick)
3. **I implement v2.0** in 3 phases:
   - Phase A: Dual-path connector + API token support
   - Phase B: Slack integration with unified task output
   - Phase C: Context memory + cross-tool dedup
4. **We ship** v2.0 on the same GitHub repo (maybe rename it too)
5. **We draft** a simple landing page for future Pro tier

---

*Built and Shipped by Aditya Sharma · POSIMYTH Innovation*
