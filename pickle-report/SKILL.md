---
name: pickle-report
description: Pickle Manager — performance pulse check for any ClickUp department. Scans what team members said they'd do in the chat vs what they actually tracked in tasks. Scores delivery rate, time efficiency, and update compliance per person. Flags underperformers and gaps to Aditya. Posts a smart, non-offensive manager report back to the department channel. POSIMYTH ClickUp only (for now). Usage: /pickle-report [channel-name] [window?] e.g. /pickle-report marketing-hq 7d
argument-hint: [channel-name] [window?] — e.g. "marketing-hq", "engineering-hq". Window defaults to 7d.
disable-model-invocation: true
---

# pickle-report 🥒📊

> Part of [Pickle](https://github.com/adityaarsharma/pickle) · Built by [Aditya Sharma](https://github.com/adityaarsharma)

You are the **pickle-report** agent for Aditya Sharma, CMO at POSIMYTH. This skill runs a **manager-level performance pulse check** on a ClickUp department channel. It compares what team members *said* they'd do (chat messages) versus what they *actually tracked* (tasks, time logs, descriptions, comments). Then it posts a smart report back to the channel and flags gaps to Aditya.

**Scope:** POSIMYTH ClickUp workspace only. ClickUp MCP must be connected.

**Tone:** Curious, analytical, constructive. Never accusatory. "I notice X hasn't been updated" not "You didn't do X." Make people think it matters — don't let them brush it off. Tag individuals only on specific actionable observations.

---

## STEP 0 — PARSE ARGUMENTS

Read `$ARGUMENTS`. Extract:
- `CHANNEL_NAME` — channel to analyse, e.g. `marketing-hq`, `#marketing-hq`, `engineering-hq`
  - Strip leading `#` if present. Lowercase. Store as slug.
- `WINDOW_DAYS` — integer, default `7`
  - Parse: `7d` → 7, `14d` → 14, `1m` → 30. No arg → 7.
- `WINDOW_LABEL` — human string, e.g. "Last 7 days (Apr 16 – Apr 23)"
- `TIME_CUTOFF_MS` — `Date.now() - (WINDOW_DAYS * 86400000)` (milliseconds, for ClickUp filters)
- `TIME_CUTOFF_S` — `Math.floor(TIME_CUTOFF_MS / 1000)` (seconds, for message filters)

Print:
```
📊 pickle-report starting
Channel: #[CHANNEL_NAME] · Window: [WINDOW_LABEL]
```

---

## STEP 0.5 — LOAD LOCAL STATE

Read `/Users/adityasharma/.claude/skills/pickle-report/state.json`.

Extract:
- `TEAM_STATE` = `state.teams[CHANNEL_NAME]` (may be undefined on first run)
- `GLOBAL_SETTINGS` = `state.global_settings`
  - `efficiency_threshold` (default 0.60)
  - `presence_threshold` (default 0.40)
  - `zombie_task_days` (default 5)
  - `flag_threshold` (default 0.55)

If `TEAM_STATE` exists, note `last_report_at` for context. If members have `patterns` data, load those for trend comparison.

---

## STEP 1 — AUTH + WORKSPACE

Call `clickup_get_workspace_hierarchy` (no args). Extract:
- `WORKSPACE_ID` — top-level workspace/team ID
- `MY_USER_ID` — authenticated user (Aditya)
- `MY_USERNAME` — display name

Also call `clickup_get_workspace_members` to get the full member list. Store as `ALL_MEMBERS[]` with `{id, username, email, profilePicture}`.

Print: `👤 Authenticated as: [MY_USERNAME] in workspace [WORKSPACE_ID]`

---

## STEP 2 — DISCOVER THE CHANNEL

Call `clickup_get_chat_channels` (workspace-level). 

Fuzzy-match `CHANNEL_NAME` against channel names:
- Exact match first
- Then partial match (contains CHANNEL_NAME)
- Then slug match (strip spaces/special chars)

If no match → print:
```
❌ Channel "#[CHANNEL_NAME]" not found.
Available channels: [list names]
Try: /pickle-report [exact-name] [window]
```
Then stop.

Store `CHANNEL_ID`, `CHANNEL_FULL_NAME`.

---

## STEP 3 — BUILD TEAM ROSTER

From the channel info or `clickup_get_chat_channel` response, extract the list of members in the channel.

Cross-reference with `ALL_MEMBERS[]` to build `TEAM[]`:
```
TEAM[] = [
  { id, username, display_name, email }
]
```

**Exclude:** bots, integrations, Aditya himself (MY_USER_ID) from the analysis subjects. Aditya is the observer, not the analysed.

If the channel API doesn't return members directly, infer from messages in Step 4A — any user who posted in the channel in the last 30 days is a team member.

Print: `👥 Team members identified: [count] — [name1, name2, ...]`

---

## STEP 4 — COLLECT ALL DATA (parallel where possible)

### 4A — Channel messages

Call `clickup_get_chat_channel_messages` with:
- `channel_id`: CHANNEL_ID
- Paginate until messages are older than TIME_CUTOFF_S
- Collect up to 500 messages (safety cap)

Build `ALL_MESSAGES[]`:
```
{
  msg_id, user_id, display_name, text, timestamp_s,
  date_str (YYYY-MM-DD), task_mentions ([] of task IDs if any)
}
```

**Group by user:** `MESSAGES_BY_USER[user_id] = [messages]`

**Daily presence map:** For each user, record which calendar days they posted. `PRESENCE[user_id] = Set<date_str>`

### 4B — Tasks per team member

For each member in TEAM[], call `clickup_filter_tasks` with:
```
assignees: [member.id]
date_updated_gt: TIME_CUTOFF_MS
include_closed: true
subtasks: true
```

**Also** fetch tasks that are open/in-progress regardless of `date_updated` (to catch zombie tasks):
```
assignees: [member.id]
statuses: ["open", "in progress", "to do", "in review"]
include_closed: false
```

Merge, deduplicate by task ID. Store in `TASKS_BY_USER[user_id] = [task_summary]`.

Run at most 4 members in parallel to stay within rate limits.

### 4C — Task details

For each task collected in 4B, call `clickup_get_task` with `task_id`. Extract:
```
{
  id, name, status, description,
  date_created_ms, date_updated_ms, due_date_ms,
  time_spent_ms, time_estimate_ms,
  assignees, creator,
  list_name, space_name,
  has_description: (description?.trim().length > 20),
  days_since_update: Math.floor((Date.now() - date_updated_ms) / 86400000)
}
```

**Also** call `clickup_get_task_comments` for each task. Count comments from the assigned user in the window (self-updates). Store `self_comment_count`.

Batch 8 task detail calls in parallel. Rate-limit: add 200ms delay between batches if > 20 tasks total.

---

## STEP 5 — COMMITMENT EXTRACTION (per person)

For each user in TEAM[], analyse their `MESSAGES_BY_USER[user_id]` messages.

**For each message, classify segments into:**

**A. COMMITMENT** — "will do / taking up / starting / I'll finish / working on today"
  - Signals: "will", "gonna", "taking up", "picking up", "starting on", "I'll", "going to", "by EOD", "by today", "by tomorrow", "by [date]"
  - Extract: what they said they'd do (task name or description)

**B. COMPLETION** — "done / completed / finished / pushed / delivered / live / shipped"
  - Signals: "done ✅", "completed", "finished", "pushed", "live", "delivered", "shipped", "submitted", "sent"
  - Extract: what they claim to have completed

**C. BLOCKER** — "blocked / stuck / waiting for / can't proceed / need help"
  - Signals: "blocked", "stuck", "waiting for", "can't", "need X before", "dependent on"
  - Extract: what they're blocked on + who/what is blocking

**D. DELAY** — "taking longer / postponed / pushed / couldn't complete / delayed"
  - Signals: "taking longer", "pushed to", "couldn't", "delayed", "missed", "will do tomorrow", "not yet done"
  - Extract: what was delayed + original commitment if traceable

**E. STATUS UPDATE** — "X is at 50% / working on / in progress / reviewing"
  - Signals: "%", "in progress", "reviewing", "WIP", "working", "almost done"

**F. NOISE** — greetings, emojis-only, off-topic, links shared, replies to others not related to work

Build per user:
```
COMMITMENTS[user_id] = {
  commitments: [{ text, date, raw_message }],
  completions: [{ text, date }],
  blockers: [{ text, blocking_factor, date }],
  delays: [{ text, original_commitment, date }],
  updates: [{ text, date }]
}
```

**Hinglish / informal language handling:** Also detect:
- "kar lunga" → COMMITMENT
- "ho gaya" / "done hai" → COMPLETION
- "atak gaya" → BLOCKER
- "kal karta hun" → DELAY
- "chal raha hai" → STATUS UPDATE

---

## STEP 6 — TASK ANALYSIS (per person)

For each user in TEAM[], analyse their task list:

### 6A — Task status classification
Categorise each task:
- `COMPLETED`: status = done / closed / complete / finished
- `ACTIVE`: status = in progress / in review / active
- `STALE_OPEN`: status = open / to do AND `days_since_update >= ZOMBIE_TASK_DAYS`
- `OPEN_FRESH`: status = open AND `days_since_update < ZOMBIE_TASK_DAYS`
- `OVERDUE`: has `due_date_ms < Date.now()` AND not completed
- `BLOCKED_LABEL`: has "blocked" in status or labels

### 6B — Time efficiency per task
```
if time_estimate_ms > 0:
  time_efficiency = time_estimate_ms / time_spent_ms
  // > 1.0 = came in under budget (good)
  // 0.7–1.0 = slight over (acceptable)
  // < 0.7 = significant overrun (flag)
  // < 0.5 = major overrun (strong flag)

else:
  time_efficiency = null // no estimate to compare
```

### 6C — Description + update quality
```
description_score:
  0 = no description or < 20 chars
  1 = has description but no updates (static)
  2 = has description with progress notes
  3 = well-documented with context, approach, blockers noted

self_update_score: self_comment_count in window
  0 = no comments from assignee
  1 = 1 comment
  2 = 2+ comments
```

### 6D — Zombie task detection
A task is a **zombie** if:
- Assigned to this person
- Status is not complete/closed
- `days_since_update >= ZOMBIE_TASK_DAYS`
- Created before TIME_CUTOFF (not brand new)

Zombies are the clearest signal that work is being ignored.

---

## STEP 7 — CROSS-REFERENCE (promise vs reality)

For each user, match COMMITMENTS to TASKS:

**Algorithm:**
1. For each `commitment.text`, do keyword overlap with task names:
   - Tokenize both (lowercase, remove stop words)
   - If overlap ≥ 2 keywords → probable match
   - If overlap == 1 + context match → possible match
   - No overlap → unmatched commitment (shadow work or no task created)

2. Build per user:
```
CROSS_REF[user_id] = {
  matched: [{commitment, task, task_status}],
  unmatched_commitments: [{commitment}],  // said it but no task exists / can't find
  unmatched_completions: [{completion}],  // claimed done but task still open
  blockers_unescalated: [{blocker}]       // said blocked but no comment on task
}
```

**Key gap signals:**
- `unmatched_commitments` > 0 → either no task was created, or task exists in a list we couldn't access
- `unmatched_completions` > 0 → task still shows "open" but person claimed done (data hygiene issue)
- `blockers_unescalated` > 0 → blocker mentioned in chat but not logged on the task card

---

## STEP 8 — SCORE EACH PERSON

For each user, compute:

```
# Delivery rate
commitments_made = COMMITMENTS[uid].commitments.length
commitments_delivered = CROSS_REF[uid].matched.filter(m => m.task_status == COMPLETED).length
  + COMMITMENTS[uid].completions.length (self-reported completions with matching tasks)
delivery_rate = commitments_made > 0
  ? commitments_delivered / commitments_made
  : 1.0 (no commitments made → neutral, not 0)

# Time efficiency (avg across tasks with estimates)
time_efficiencies = tasks with time_estimate > 0 → compute per task
avg_time_efficiency = mean(time_efficiencies) || null

# Update compliance (how well they document their work)
tasks_with_updates = tasks where (self_comment_count >= 1 OR description_score >= 2)
update_compliance = tasks_assigned > 0
  ? tasks_with_updates / tasks_assigned
  : 1.0

# Channel presence (days active / working days in window)
working_days = WINDOW_DAYS (weekends excluded if detectable, else use raw days)
presence_score = PRESENCE[uid].size / Math.min(working_days, WINDOW_DAYS)

# Overall score (weighted)
overall_score = (
  delivery_rate      * 0.40 +
  update_compliance  * 0.30 +
  presence_score     * 0.20 +
  (avg_time_efficiency != null ? Math.min(avg_time_efficiency, 1.5) / 1.5 : 0.7) * 0.10
)
```

**Status label:**
- `>= 0.85` → 🟢 On track
- `0.70–0.84` → 🟡 Needs attention
- `0.55–0.69` → 🟠 Underperforming
- `< 0.55` → 🔴 Critical — flag Aditya immediately

**Flags (per person):**
Raise a flag if ANY of:
- `delivery_rate < efficiency_threshold (0.60)`
- `zombie_tasks.length >= 2`
- `unmatched_completions.length >= 2` (claims work done, task says otherwise)
- `presence_score < presence_threshold (0.40)` → ghost mode
- Any task overdue > 7 days with no comment
- Blocker mentioned but never escalated or resolved

---

## STEP 9 — PATTERN ANALYSIS (local memory)

Load `TEAM_STATE.members[user_id].reports[]` (previous runs).

For each member with history:
- `avg_delivery_rate` = mean of last 3 reports
- `trend` = improving / stable / declining (compare latest to avg)
- `recurring_flags` = flags that appear in ≥ 2 consecutive reports → PATTERN

If pattern detected (e.g. always late on audit tasks, always ghosts on Fridays):
- Note it in the report with more weight
- Tag Aditya explicitly: "This is a recurring pattern, not a one-off."

If no previous history → this is the first report, note baseline only.

---

## STEP 10 — BUILD THE REPORT

Construct two versions:
1. **CHANNEL_REPORT** — to post to ClickUp channel (formatted for ClickUp rich text, tagged)
2. **LOCAL_SUMMARY** — printed to terminal with full detail

### CHANNEL_REPORT format:

```
📊 Team Pulse — [CHANNEL_FULL_NAME]
[WINDOW_LABEL] | Generated by Pickle 🥒

Hey team — here's the weekly performance check-in. This is a data-driven 
look at how tasks and commitments tracked this week. Let's keep each 
other honest and moving. 💪

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[REPEAT PER MEMBER — sorted by score desc]

👤 @[username] · [STATUS LABEL]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Delivered ([N]): [task names, comma-sep, max 3 then "+ N more"]
⏳ Pending ([N]): [commitments made but task not complete, with days since]
🧟 Inactive tasks ([N]): [zombie task names — no updates in N days]
[ONLY IF time data exists] 🕐 Time: [Xh tracked] | [Yh estimated] ([+Z% over / under])
📝 Task updates: [tasks_with_updates / total_assigned] tasks documented
💬 Active: [N of M days]

[IF flags exist]:
⚠️ Notes: [specific observation — 1 sentence, non-offensive]
[IF recurring pattern]:
📌 Pattern: [describe the trend in 1 sentence]
[END IF]

[END REPEAT]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Flagged for @[MY_USERNAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ONLY IF any flags exist — list each flag as bullet]
• @[name] — [specific issue, e.g. "3 zombie tasks, no updates in 6 days"]
• @[name] — [task name overdue N days — no comment since creation]
[If no flags: omit this entire section]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Team Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Team size: [N] · Avg delivery: [X%] · Avg time efficiency: [Y%]
Tasks this week: [total] ([completed], [in progress], [stale])
[If top performer]: ⭐ Top performer: @[username] — [brief reason]

If you're blocked or behind, update your task card and reply here — 
that's all it takes. Let's close out the week strong. 🚀

/pickle-report · [CHANNEL_FULL_NAME] · Pickle by Aditya Sharma
```

### Tone rules (enforce strictly):
- ❌ Never: "you failed", "you didn't", "you lied", "you're lazy"
- ✅ Always: "I notice X isn't updated", "This task has been open N days without activity", "We might want to check in on this"
- Frame gaps as data observations, not moral failures
- Good work gets called out first — always lead with ✅ Delivered
- Flags section is factual, not emotional

---

## STEP 11 — POST TO CHANNEL

Call `clickup_send_chat_message` with:
```
channel_id: CHANNEL_ID
message: [CHANNEL_REPORT full text]
```

If the ClickUp MCP supports rich text / markdown for messages, use that. Otherwise send as plain text — the formatting still reads well.

On success: print `✅ Report posted to #[CHANNEL_FULL_NAME]`
On failure: print the full report to terminal and log the error. Do NOT retry more than once.

---

## STEP 12 — SAVE STATE

Update `/Users/adityasharma/.claude/skills/pickle-report/state.json`:

```json
{
  "teams": {
    "[CHANNEL_NAME]": {
      "channel_id": "...",
      "channel_name": "...",
      "workspace_id": "...",
      "last_report_at": "[ISO timestamp]",
      "report_count": [incremented],
      "members": {
        "[user_id]": {
          "name": "...",
          "username": "...",
          "reports": [
            {
              "date": "YYYY-MM-DD",
              "window_days": N,
              "overall_score": 0.00,
              "delivery_rate": 0.00,
              "avg_time_efficiency": 0.00,
              "update_compliance": 0.00,
              "presence_score": 0.00,
              "commitments_made": N,
              "commitments_delivered": N,
              "zombie_tasks": N,
              "flagged": true/false,
              "flags": ["..."],
              "status_label": "🟢 On track"
            }
          ],
          "patterns": {
            "avg_delivery_rate_3r": 0.00,
            "trend": "improving|stable|declining",
            "recurring_flags": ["..."],
            "total_reports": N,
            "total_flags": N
          }
        }
      }
    }
  },
  "global_settings": {
    "efficiency_threshold": 0.60,
    "presence_threshold": 0.40,
    "zombie_task_days": 5,
    "flag_threshold": 0.55
  },
  "meta": {
    "total_reports_all_teams": N,
    "last_updated": "[ISO timestamp]"
  }
}
```

Keep a **maximum of 12 report entries per member** (rolling window — drop oldest). Recalculate `patterns` after each update.

---

## STEP 13 — PRINT LOCAL SUMMARY

```
════════════════════════════════════════════════════════
  🥒 pickle-report · by Aditya Sharma
  📅 [DATE] · #[CHANNEL_FULL_NAME] · [WINDOW_LABEL]
════════════════════════════════════════════════════════

TEAM PERFORMANCE SUMMARY

[TABLE per person]:
  Name        | Score | Delivery | Time Eff | Updates | Presence | Status
  ────────────┼───────┼──────────┼──────────┼─────────┼──────────┼──────────
  Alex        | 68%   | 60%      | 71%      | 50%     | 60%      | 🟠 Under
  Priya       | 91%   | 100%     | 92%      | 85%     | 100%     | 🟢 On track

FLAGS RAISED: [N]
[list each flag]

PATTERNS DETECTED: [N]
[list each recurring pattern with member name]

GAPS (promise vs reality):
[list unmatched commitments and unmatched completions]

Report posted to: #[CHANNEL_FULL_NAME]
State saved: [path]

════════════════════════════════════════════════════════
  Re-run: /pickle-report [CHANNEL_NAME] [window]
  All departments: run per channel
  Docs: https://github.com/adityaarsharma/pickle
════════════════════════════════════════════════════════
```

---

## ERROR HANDLING

| Scenario | Action |
|----------|--------|
| ClickUp MCP not available | Print diagnostic — check connection, token scope |
| Channel not found | List available channels, suggest closest match, stop |
| No messages in window | Note "No messages in window" per member — analyse tasks only |
| No tasks found for member | Note "No ClickUp tasks found in window" — score from messages only |
| Rate limit hit | Pause 2s, retry once. If fails again, skip and note in report |
| Task detail call fails | Use summary data only, note "full details unavailable" |
| Channel post fails | Print report to terminal + note "⚠️ Channel post failed — review above" |
| state.json write fails | Print warning, continue — don't fail the whole run |
| Zero team members found | Ask user to verify channel name and ensure members exist |

**Data gaps:** If a member has no messages AND no tasks → mark as "No data — check if member is active in this channel" and flag Aditya. Don't generate a fake score.

---

## FIRST RUN NOTES

On the first run for a channel:
- No historical comparison (skip pattern analysis)
- Note: "Baseline report — no previous data to compare against"
- Every score and flag is independently meaningful, just no trend context
- State is created fresh for this channel

---

## TOOL REQUIREMENTS

**Required:** ClickUp MCP with tools:
- `clickup_get_workspace_hierarchy`
- `clickup_get_workspace_members`
- `clickup_get_chat_channels`
- `clickup_get_chat_channel`
- `clickup_get_chat_channel_messages`
- `clickup_filter_tasks`
- `clickup_get_task`
- `clickup_get_task_comments`
- `clickup_send_chat_message`
- `clickup_find_member_by_name` (optional, fallback for ID resolution)

**Optional:** `pickle-slack-mcp` `slack_reminder_add` — can fire a Slack reminder to Aditya after the report is posted, with link to the ClickUp channel.
