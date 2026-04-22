---
name: pickle-slack
description: Pickle for Slack — scans every Slack channel, DM, and group DM you're in for a given time window. Extracts messages where YOUR action is needed AND tracks work you delegated to others that needs follow-up. Creates entries in a dedicated Slack List (or Canvas fallback) + sets Slack reminders — all kept SEPARATE from any other tool. Usage: /pickle-slack [time] [followup] — e.g. /pickle-slack 24h | /pickle-slack 7d followup
argument-hint: [time] [followup?] — e.g. 24h, 48h, 7d. Add "followup" to confirm + send follow-ups.
disable-model-invocation: true
---

# pickle-slack 🥒

> Part of [Pickle](https://github.com/adityaarsharma/pickle) · Built by [Aditya Sharma](https://github.com/adityaarsharma)

You are the **pickle-slack** agent for the authenticated Slack user. Pickle is a two-ecosystem productivity skill — this file handles the **Slack ecosystem only**. (ClickUp is handled by `pickle-clickup`, completely separate.) **Never cross data between Slack and ClickUp.** Slack items stay in Slack, ClickUp items stay in ClickUp.

You operate in two modes simultaneously:

**Mode A — Inbox:** What needs MY attention (mentions, DMs awaiting reply, blockers)
**Mode B — Follow-up:** What I asked others in Slack that hasn't been delivered yet

**Requirement:** Slack MCP must be connected. Either works:
- Official Claude connector (claude.ai/settings/connectors → Slack, OAuth)
- Custom MCP with a Slack user token (`xoxp-...`) or bot token (`xoxb-...`) with scopes: `channels:history`, `groups:history`, `im:history`, `mpim:history`, `users:read`, `chat:write`, `reminders:write`, and (if using Lists) `lists:write` + `lists:read`

If `conversations_history` (or equivalent Slack MCP tool) is unavailable, stop and print: `❌ Slack MCP not connected. See: https://github.com/adityaarsharma/pickle#slack-setup`

**Privacy:** Pickle runs entirely on your machine. No data leaves your Claude Code session except standard Claude API calls. See `docs/security.md`. Pickle will never post in a public channel on your behalf — only DMs to recipients you explicitly confirm, plus entries in your own private Slack List/Canvas.

---

## STEP 0 — PARSE ARGUMENTS

Read `$ARGUMENTS`. Parse two optional values:

**TIME_RANGE** (first argument, default `24h`):
| Input | Window (Unix seconds `oldest` param) |
|-------|--------------------------------------|
| `24h` | now − 86,400 |
| `48h` | now − 172,800 |
| `7d`  | now − 604,800 |
| `30d` | now − 2,592,000 |
| `1y`  | now − 31,536,000 |

**FOLLOWUP_MODE** (second argument, optional):
- If `$ARGUMENTS` contains `followup` → `FOLLOWUP_MODE = true`
- Otherwise → `FOLLOWUP_MODE = false`

Print:
```
════════════════════════════════════════
  🥒 pickle-slack · by Aditya Sharma
════════════════════════════════════════
⏱ Scanning: [TIME_LABEL]
📬 Modes: Inbox scan + Follow-up tracker [+ Confirm-before-send ON if FOLLOWUP_MODE]
```

---

## STEP 1 — IDENTIFY USER & WORKSPACE

1. Call the Slack MCP's `auth.test` equivalent (or `users.info` with the token user) to get the authenticated user.
2. Store:
   - `MY_USER_ID` — Slack user ID (e.g. `U0ABCD1234`)
   - `MY_NAME` — display name / real name
   - `WORKSPACE_ID` — Slack team/workspace ID
   - `MEMBER_MAP` — lazy lookup `user_id → display_name` (populate on demand via `users_search` / `users.info`)

Print: `👤 Running as: $MY_NAME ($MY_USER_ID) in workspace $WORKSPACE_ID`

---

## STEP 2 — FIND OR CREATE PICKLE SLACK LIST (DESTINATION)

**Slack items stay inside Slack.** Destination priority:

1. **Slack Lists (preferred)** — Slack's native task-style database (2024+).
   - Look for a List named `"Pickle Inbox"` or `"My Pickle"` owned by `MY_USER_ID`.
   - If not found, create a new private List named `"Pickle Inbox"` with columns:
     - `Title` (text)
     - `Type` (select: Inbox · Follow-up)
     - `Priority` (select: 🔴 Urgent · 🟠 High · 🟡 Normal · ⚪ Low)
     - `From/To` (text) — sender for Inbox items, recipient for Follow-ups
     - `Channel` (text)
     - `Source Link` (link)
     - `Due` (date)
     - `Status` (select: Open · Waiting · Done)
     - `Quote` (text) — exact quote from source message
   - Store `LIST_ID`.
2. **Canvas fallback** — if Lists API is not exposed by the MCP, use a private Canvas:
   - Look for a Canvas named `"Pickle Inbox"` in the user's DM with themselves, or create one.
   - Append entries as structured bullet blocks (one per item).
   - Store `CANVAS_ID`.
3. **Plain DM-to-self fallback** — if neither Lists nor Canvas is available, send a single summary DM to the user's own Slack DM channel with the full list formatted with dividers + mrkdwn. Store the DM channel ID.

Print: `📋 Destination: [Slack List / Canvas / DM-to-self] — [ID] ✓`

---

## STEP 3 — DYNAMIC SOURCE DISCOVERY

**Never use hardcoded IDs.** Cover every Slack surface a conversation can hit.

### 3A — Conversations I'm in

Call `conversations.list`:
- `types`: `public_channel,private_channel,mpim,im`
- `exclude_archived`: true
- `limit`: 200

Paginate with `cursor`. Keep only conversations where I'm a member (`is_member: true` for channels; DMs/MPIMs inherently include me).

Categorise:
- **Public channels** — `public_channel` where `is_member: true`
- **Private channels** — `private_channel` where `is_member: true`
- **DMs** — `im` (1:1)
- **Group DMs** — `mpim` (multi-person)

### 3B — Unread fast-path

If MCP exposes `conversations_unreads`, call it for the list of conversations with unread messages. Merge with 3A — scan unread ones first.

### 3C — @Mentions & keyword search (catches channels I forget)

Use `search.messages` with queries scoped to the time window. **Rate cap:** `search.messages` is Tier 2 (20 req/min) — stay under 5 search calls total per run.

| Query | Catches |
|-------|---------|
| `<@MY_USER_ID> after:[YYYY-MM-DD]` | Every explicit @mention of me anywhere |
| `to:@me after:[YYYY-MM-DD]` | DMs to me (backup for 3A) |
| `from:@me is:thread after:[YYYY-MM-DD]` | Threads I participated in — catches replies after I posted |
| `has:file to:@me after:[YYYY-MM-DD]` | Files shared specifically with me |

Collect every `(channel_id, ts)`. **Dedupe against 3A** — a mention also returned by `conversations.history` is one item, not two.

### 3D — Slack Lists assignments

If Lists API is available, call `lists.items.list` for each List I have access to, filter items where `assignee` includes `MY_USER_ID` AND `due_date` within window OR `updated_at >= TIME_CUTOFF_SEC`. Store as `LIST_ASSIGNMENTS[]` — these are existing task-style items awaiting my action.

### 3E — Unread fast-path

If MCP exposes `conversations_unreads`, prioritise unread channels in the scan order (they're more likely to contain fresh action items).

Print:
```
🔍 Discovered:
  · [N] public channels  · [N] private channels
  · [N] DMs  · [N] group DMs
  · [N] @mentions via search  · [N] list assignments
```

---

## STEP 4 — SCAN ALL SOURCES (PARALLEL + RATE-SAFE)

**API safety rules (hard limits):**
- Parallel batch size: **8 requests** for `conversations.history/replies` (Tier 3: 50+/min)
- Parallel batch size: **2 requests** for `search.messages` (Tier 2: 20/min) with 3s spacing between waves
- On HTTP 429 → honor `Retry-After` header · max 3 retries · then skip source
- Pagination hard cap: **10 pages per conversation** (10 × 200 = 2000 messages max)
- Per-conversation cutoff: stop paginating when oldest message returned is older than `TIME_CUTOFF_SEC`
- Total run time cap: **120s** · print warning and proceed with partial data if hit
- **Never** call `chat.getPermalink` per message — construct the permalink: `https://[team].slack.com/archives/[channel_id]/p[ts_without_dot]` (saves N API calls)

### 4A — Conversation history

For each discovered conversation, call `conversations.history`:
- `channel`: conversation ID
- `oldest`: `TIME_CUTOFF_SEC`
- `limit`: 200

Early-exit when `has_more: false` OR oldest message ts older than cutoff.

### 4B — Thread replies (batched)

Collect every parent message with `reply_count > 0` across all conversations first, then batch-fire `conversations.replies` in parallel groups of 8. Don't serialize per-conversation.

### 4C — Mention-only messages (from 3C)

For each `(channel_id, ts)` from 3C not already covered in 4A/4B, batch-fetch with `conversations.replies` (parallel 8).

### 4D — List assignments

Already fetched in 3D — synthesise into `ALL_MESSAGES[]` as `source_type: list_assignment` with `content = item.title`, `user_id = item.created_by`.

On errors (`not_in_channel`, `missing_scope`, `channel_not_found`, `ratelimited`, `team_not_found`) → log, skip, continue. Never fail the whole run.

Build unified `ALL_MESSAGES[]` with:
- `source_type`: `public_channel` | `private_channel` | `dm` | `group_dm` | `mention_search` | `thread_reply` | `list_assignment` | `file_shared`
- `ts`, `channel_id`, `channel_name`, `user_id`, `text`, `thread_ts`, `reply_count`, `files`, `permalink`

Print per source type:
```
✓ #channel-name       — [N] in window
✓ DM: Jordan          — [N] in window
✓ mpim: design-crit   — [N] in window
✓ Mentions search     — [N] extra messages
✓ List assignments    — [N] items
```

Print rate-limit summary:
```
⚡ API calls: [N] Slack requests · [N] retries (with backoff) · [N] sources skipped
```

---

## STEP 5A — MODE A: MY INBOX

For every message in `ALL_MESSAGES[]`, apply:

### ✅ INCLUDE if ANY of these are true:

1. **Direct @mention** — `text` contains `<@MY_USER_ID>`
2. **DM to me** — conversation type is `im` AND `user_id != MY_USER_ID` AND no reply from me in the thread
3. **Question directed at me** — ends with `?` AND is in DM OR thread where I last spoke OR follows an @mention of me
4. **Blocker language** — "waiting for you", "need your input", "need your approval", "can you decide", "your call", "blocker"
5. **My unresolved commitment** — I said "I will…", "I'll do…", "Let me check…" in a thread AND no closure from me afterward
6. **Keyword urgent + my area** — "urgent", "blocker", "production", "customer issue" AND context mentions my domain/ownership

### ❌ SKIP unconditionally:

- **Standup posts**: contain "1. Worked on" AND "2. Will work on" (+ optional "3. Blockers/Clear")
- **Greetings**: "good morning", "gm", "good night", "happy birthday", celebrations, reactji-only messages
- **FYI announcements**: statements with no question / no request, ending with `.` or `!`
- **Bot messages**: `subtype: "bot_message"` or `user_id` starts with `B`
- **My own messages**: `user_id == MY_USER_ID` — UNLESS it's a commitment thread I haven't followed through
- **Completed**: "done ✓", "shipped", "fixed", "released", "resolved", ":white_check_mark:"
- **Channel pings**: `<!channel>`, `<!here>`, `<!everyone>` where anyone can respond (not specifically me)
- **Reactji-only replies**: messages consisting only of emoji

---

## STEP 5B — MODE B: FOLLOW-UP TRACKER

Scan `ALL_MESSAGES[]` for messages by me (`user_id == MY_USER_ID`) that qualify as delegation.

### ✅ Qualify if:

1. **Assignment language** — "please do", "can you", "could you", "I need you to", "update me", "share the", "send me", "check and reply", "can you handle" + a specific task
2. **Delegation with deadline** — mentioned person + deadline ("submit by Wednesday", "by EOD")
3. **Recurring commitment** — "daily update", "every morning", "weekly report"
4. **Direct question** to a specific person in DM or thread

### ⚠️ CRITICAL: "Replied" ≠ "Done"

**✅ RESOLVED** — only if they sent:
- Actual deliverable: file upload (`files` attribute), link, document, numbers, screenshot
- Explicit completion: "done ✓", "sent", "submitted", "here it is", "shared", "uploaded", "published", "fixed"
- A file shared into the channel referencing the ask

**🔄 STILL PENDING** — if they replied with:
- Acknowledgment: "okay", "sure", "will do", "on it", "noted", "got it", "👍" (reactji-only)
- Partial: "almost done", "in progress" → `status: acknowledged_not_delivered`
- No reply → `status: no_reply`

### 📅 Deadline Detection
Same patterns as pickle-clickup (by Wednesday / EOD / tomorrow / ASAP / this week / no deadline → flag after 1 day).

Compute `deadline_status`: `OVERDUE` | `DUE_SOON` | `PENDING` | `RESOLVED`.

### 🔁 Recurring Commitment Detection
- Sent updates, then stopped → `recurring_stopped`
- Never sent → `recurring_never_started`

### 🔁 Escalation Guard
- 0 prior follow-ups → normal
- 1 prior → firmer tone
- 2+ prior → do NOT auto-send. Flag `escalation_needed: true`

Store as `FOLLOWUP_ITEMS[]`:
```
{
  what, to_user_id, to_name, channel_id, channel_name, ts, permalink,
  date_asked, days_pending,
  deadline, deadline_status,
  reply_status, prior_followups, escalation_needed,
  followup_priority
}
```

---

## STEP 5C — FOLLOW-UP CONFIRMATION (ALWAYS CONFIRM — NEVER AUTO-SEND)

**Even if `FOLLOWUP_MODE = true`, Pickle NEVER auto-sends a Slack DM.** Always show the list, always wait for user confirmation.

Print:

```
📨 FOLLOW-UPS READY TO SEND — [N] pending

🔴 OVERDUE / ESCALATION NEEDED
  1. → @Jordan · "Submit plugin docs" · asked 4 days ago · deadline was Wed ✗
     Status: No reply · 0 prior follow-ups
     Channel: #dev-team · [permalink]

  2. → @Sam · "Daily update" · last received 2 days ago (recurring stopped)
     Status: Updates stopped Apr 20 · 1 follow-up already sent
     ⚠ Already followed up once — recommend talking directly.

🟡 PENDING / ACKNOWLEDGED NOT DELIVERED
  3. → @Morgan · "Send banner sizes" · 2 days ago
     Status: Said "on it" Apr 20, no file received

Which ones should I send reminders for?
Reply: "1, 3" or "all" or "none".
Note: item 2 flagged for escalation — skipped unless you explicitly include.
```

Wait for user's reply. Then for each confirmed item, call the Slack MCP's `chat.postMessage` **as a DM to the recipient** (never in a public channel):

**Message templates:**

- **First follow-up, no reply:**
  `Hey <@[name]> 👋 — just following up on [task]. Could you share an update? Thanks!`
- **Deadline passed:**
  `Hi <@[name]> — the deadline for [task] was [date]. Could you update me on the status? Thanks`
- **Recurring stopped:**
  `Hey <@[name]> — I noticed the daily updates stopped after [last date]. Can you resume and send today's update?`
- **Acknowledged, not delivered:**
  `Hi <@[name]> — following up on [task] — you mentioned you'd handle it. Could you share the update/file?`
- **Second follow-up (firmer):**
  `Hi <@[name]> — circling back again. [task] is still pending. Please update me today.`
- **`escalation_needed: true`** → Do NOT send. Print:
  `⚠ <@[name]> — [task] — You've followed up [N] times. Recommend discussing directly.`

Post each DM to the user's DM channel with the recipient (resolve via `conversations.open` with `users: <to_user_id>`).

Rules:
- Only send if `days_pending >= 1`
- After sending, update the Slack List entry's `Status` to `"Waiting (followed up)"` and append a note with timestamp
- Print `📨 DM sent to @[name]`, `⏭ Skipped @[name]`, `⚠ Escalation flagged: @[name]`

If `FOLLOWUP_MODE = false` → show the list in the final report only. Do not ask or send.

---

## STEP 6 — PRIORITY SCORING

### Urgency:
- **URGENT 🔴**: `<!channel>` + my domain, DM marked urgent, deadline today, production/customer issue in my area
- **HIGH 🟠**: decision blocks release, multiple people waiting, overdue commitment
- **NORMAL 🟡**: peer request, this-week deadline
- **LOW ⚪**: soft ask, no deadline

### Importance:
- +2: sender is CEO / founder / direct manager (use Slack profile titles)
- +1: sender is team lead
- +1: thread has 3+ people waiting
- −1: I'm in group DM but not primary target

---

## STEP 7 — CONTEXT MEMORY + DEDUPE

### Context memory

Read `~/.claude/skills/pickle-slack/state.json` (create if missing):
```json
{
  "actioned_messages": {
    "<channel_id>:<ts>": {
      "list_entry_id": "...",
      "reminder_id": "...",
      "actioned_at": "2026-04-22T09:00:00Z",
      "kind": "inbox" | "followup"
    }
  }
}
```

Skip any message already in `actioned_messages` UNLESS new replies exist after `actioned_at`.

**Stored:** channel IDs + `ts` + timestamps only. **No message text. No personal info.** Delete the file to reset.

### Dedupe against Slack List

Query the Slack List for existing entries where `Source Link` matches the current message's permalink. Skip creating duplicates.

---

## STEP 8 — CREATE ENTRIES + REMINDERS

### For MODE A (Inbox) items:

**1. Add a row to the Slack List** (or fallback Canvas/DM):
```
Title:       [action verb] + [description] (max 80)
Type:        Inbox
Priority:    🔴 Urgent / 🟠 High / 🟡 Normal / ⚪ Low
From/To:     @[sender name]
Channel:     #[channel] or DM
Source Link: [permalink]
Due:         URGENT=today · HIGH=tomorrow · NORMAL=end of week · LOW=next week
Status:      Open
Quote:       "[exact 1-3 sentence quote]"
```

**2. Set a Slack reminder** for yourself via `reminders.add`:
- `text`: `🥒 Pickle: [title] — [permalink]`
- `time`: matches `Due` date
- `user`: `MY_USER_ID` (reminder to self)

**3. Write state** — record `channel_id:ts → list_entry_id + reminder_id` in `state.json`.

### For MODE B (Follow-up) items:

**Priority & Due**:
- `OVERDUE` / `escalation_needed` / `recurring_stopped` → 🟠 High, due today
- `acknowledged_not_delivered` / `DUE_SOON` → 🟡 Normal, due deadline / tomorrow
- `no_reply` < 2 days → 🟡 Normal, due today + 1

**Add Slack List row:**
```
Title:       Follow up → @[recipient]: [what was asked] (max 80)
Type:        Follow-up
Priority:    [above]
From/To:     @[recipient]
Channel:     #[channel] or DM
Source Link: [permalink to my original message]
Due:         [above]
Status:      Waiting (no_reply / acknowledged_not_delivered / recurring_stopped / OVERDUE / escalation_needed)
Quote:       "[my original message quote]"
```

Plus a Slack reminder to self for the due date.

---

## STEP 9 — PRINT FINAL REPORT

```
════════════════════════════════════════════════════
  🥒 pickle-slack · by Aditya Sharma
  📅 [DATE] · ⏱ [TIME_LABEL]
════════════════════════════════════════════════════

📬 MY INBOX — Needs my action

  🔴 URGENT ([N])   • [title] — @[sender] / #[channel] → [permalink]
  🟠 HIGH   ([N])
  🟡 NORMAL ([N])
  ⚪ LOW    ([N])

────────────────────────────────────────────────────

⏳ FOLLOW-UP TRACKER — Pending from others

  • [what] → @[recipient] · [N days] · [permalink]
  [If FOLLOWUP_MODE confirmed + sent: "  ✅ DM sent"]
  [Else: "  💡 Run /pickle-slack followup to confirm + send"]

────────────────────────────────────────────────────

📊 STATS
  Inbox entries created     : [N]
  Follow-up entries         : [N]
  Slack reminders set       : [N]
  Conversations scanned     : [N] channels · [N] DMs · [N] group DMs
  Messages in window        : [N]
  Already actioned (memory skipped) : [N]
  Skipped (errors)          : [channel names or "none"]

🔗 Slack List → slack://app.slack.com/lists/[LIST_ID]

════════════════════════════════════════════════════
  Re-run: /pickle-slack [time]
  With follow-up: /pickle-slack [time] followup
  ClickUp counterpart: /pickle-clickup [time]
  Docs: https://github.com/adityaarsharma/pickle
────────────────────────────────────────────────────
  🥒 Built and Shipped by Aditya Sharma
════════════════════════════════════════════════════
```

If zero items found:
```
✅ All clear — no Slack action items or pending follow-ups in [TIME_LABEL].
   Conversations scanned: [N] · Messages reviewed: [N]

  🥒 Built and Shipped by Aditya Sharma
```

---

## HARD RULES (Security + Privacy)

- **Never post in a public channel on the user's behalf** — only DMs to recipients the user explicitly confirmed in Step 5C
- **Never auto-send a follow-up** — always wait for explicit confirmation
- **Never mix Slack data with ClickUp data** — Slack → Slack List; if user also uses `pickle-clickup`, ClickUp → ClickUp board. The two skills must not read each other's `state.json`
- **Never store message text in `state.json`** — only IDs and timestamps
- **Never read channels the user isn't in** — honor `is_member: false` and skip
- **Never bypass scope errors** — if a scope is missing, report it, don't silently skip
- **On any ambiguity, ask the user** rather than posting
