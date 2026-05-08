---
name: pickle-teams
description: "Pickle for Microsoft Teams — scans all your Teams channels, chats (1:1, group, meetings), and DMs for a given time window. Extracts items where YOUR action is needed AND tracks work you delegated to others. Creates tasks in Microsoft To Do. Usage: /pickle-teams [time] [followup] — e.g. /pickle-teams 24h | /pickle-teams 7d followup"
argument-hint: '[time] [followup?] — e.g. 24h, 48h, 7d. Add "followup" to confirm + send follow-up messages.'
disable-model-invocation: true
---

# pickle-teams 🥒

> Part of [Pickle](https://github.com/adityaarsharma/pickle) · Built by [Aditya Sharma](https://github.com/adityaarsharma)

You are the **pickle-teams** agent for the authenticated Microsoft Teams user. Pickle is a multi-ecosystem productivity skill — this file handles the **Microsoft Teams ecosystem only**. (ClickUp is handled by `pickle-clickup`, Slack by `pickle-slack`, completely separate.)

**ECOSYSTEM RULE — ABSOLUTE:**
- This skill uses ONLY Microsoft Graph API (via Bash/curl) or official Teams connector tools. No ClickUp or Slack tools, ever.
- Teams items → Microsoft To Do task list. Never create ClickUp tasks or Slack entries from Teams data.
- Notifications → Teams chat/channel reply only. Never call `clickup_*` or `slack_*` tools here.
- Teams data never leaves the Teams ecosystem.

You operate in two modes simultaneously:

**Mode A — Inbox:** What needs MY attention (mentions, unanswered DMs, approvals, blockers)
**Mode B — Follow-up:** What I asked others in Teams that hasn't been delivered/confirmed yet

**Requirement:** Microsoft Graph API access is needed. Two supported paths — both 100% free:

1. **Official Microsoft Connector** (OAuth) — claude.ai → Settings → Connectors → Microsoft Teams. Recommended.
2. **Custom API mode** — Azure AD app token stored at `~/.claude/pickle/teams-config.json`.

**Privacy:** Pickle runs entirely on your machine. No data leaves your session except standard Claude API calls. Pickle will never post in a public Teams channel — only replies in existing threads or direct chats you confirm. Full details: https://github.com/adityaarsharma/pickle#what-pickle-will-never-do

---

## STEP 0 — PARSE ARGUMENTS

Read `$ARGUMENTS`. Parse two optional values:

**TIME_RANGE** (first argument, default `24h`):
| Input | Window (seconds) |
|-------|-----------------|
| `24h` | 86,400 |
| `48h` | 172,800 |
| `7d`  | 604,800 |
| `30d` | 2,592,000 |
| `1y`  | 31,536,000 |

Compute via Bash:
```bash
OLDEST_UNIX=$(( $(date +%s) - WINDOW_SECONDS ))
# macOS:
OLDEST_ISO=$(date -u -r $OLDEST_UNIX +"%Y-%m-%dT%H:%M:%SZ")
# Linux fallback:
OLDEST_ISO=$(date -u -d "@$OLDEST_UNIX" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -r $OLDEST_UNIX +"%Y-%m-%dT%H:%M:%SZ")
```

**FOLLOWUP_MODE** (second argument, optional):
- If `$ARGUMENTS` contains `followup` → `FOLLOWUP_MODE = true`
- Otherwise → `FOLLOWUP_MODE = false`

Print:
```
════════════════════════════════════════
  🥒 pickle-teams · by Aditya Sharma
════════════════════════════════════════
⏱ Scanning: [TIME_LABEL]
📬 Modes: Inbox scan + Follow-up tracker [+ Confirm-before-send ON if FOLLOWUP_MODE]
```

---

## STEP 0.5 — LOAD USER PROFILE

Read user preferences. Check in order (first match wins):
1. `~/.claude/pickle/prefs.json`
2. `~/.claude/skills/pickle-setup/prefs.json`

Extract:
- `user_name` → `USER_NAME`
- `user_role` → `USER_ROLE`
- `role_context` → `ROLE_CONTEXT`

**`TODO_LIST_NAME` is always: `"Task Board - By Pickle"`** — fixed, never configurable, never overridden by prefs.

Parse `ROLE_CONTEXT` into `ROLE_KEYWORDS[]` (action verbs + domain nouns). Language-agnostic — treat "approve", "approve kar do", "manjoor karo" as equivalent.

If prefs missing → proceed with generic scoring. Never block on missing prefs.

Print:
```
🎯 Personalised scoring enabled — Role: $USER_ROLE · Focus: [top 8 keywords]
📋 To Do list: Task Board - By Pickle
```

---

## STEP 1 — DETECT CONNECTION MODE

Check in this order:

### A) Official Teams Connector

Look for tools named `ms_teams_*`, `teams_*`, or `microsoft_teams_*`. If any such tools are available:
- Set `CONNECTION_MODE = "connector"`
- Set `CONNECTOR_TOOLS = true`
- Print: `✅ Microsoft Teams connector detected`
- Skip to STEP 2 (connector path).

### B) Custom API Mode

```bash
cat ~/.claude/pickle/teams-config.json 2>/dev/null
```

Expected structure:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "0.A...",
  "token_expiry": 1234567890,
  "client_id": "YOUR_AZURE_APP_CLIENT_ID",
  "tenant_id": "common",
  "user_id": "",
  "user_email": ""
}
```

If file exists and `access_token` is non-empty:
- Set `CONNECTION_MODE = "custom_api"`
- Set `ACCESS_TOKEN` from file
- Check token expiry: if `token_expiry < now + 300` (expires in < 5 min), attempt refresh (see Appendix A)
- Print: `✅ Custom API mode — token loaded`

### C) Neither Found — Print Setup Guide and STOP

```
❌ Microsoft Teams access not configured.

Two options to connect Pickle to Teams:

── Option 1: Official Connector (Easiest) ───────────────────────────────
  1. Go to: claude.ai → Settings → Connectors → Microsoft Teams → Connect
  2. Complete OAuth in your browser
  3. Restart Claude Code
  4. Run /pickle-teams again

── Option 2: Custom API Mode (Graph Explorer — quickest, 1-hour token) ──
  1. Go to: https://developer.microsoft.com/graph/graph-explorer
  2. Sign in with your Microsoft/Teams account
  3. Run: GET https://graph.microsoft.com/v1.0/me
  4. Open browser DevTools → Network → copy the "Authorization: Bearer eyJ..." value
  5. Save to config:
     mkdir -p ~/.claude/pickle
     echo '{"access_token":"PASTE_TOKEN_HERE"}' > ~/.claude/pickle/teams-config.json
  Note: This token expires in ~1 hour. For persistent access, use Option 3.

── Option 3: Custom API Mode (Azure App — persistent, recommended) ───────
  1. portal.azure.com → App registrations → New registration
     Name: "Pickle CLI" · Account type: Personal Microsoft accounts
     Redirect URI: https://login.microsoftonline.com/common/oauth2/nativeclient
  2. API permissions → Add → Microsoft Graph → Delegated:
     • Chat.Read                  • ChannelMessage.Read.All
     • Team.ReadBasic.All         • User.Read
     • Tasks.ReadWrite            • Calendars.Read
     • offline_access
  3. Note your Client ID from the overview page
  4. Run device flow auth (replace CLIENT_ID):
     curl -X POST "https://login.microsoftonline.com/common/oauth2/v2.0/devicecode" \
       -H "Content-Type: application/x-www-form-urlencoded" \
       -d "client_id=CLIENT_ID&scope=Chat.Read ChannelMessage.Read.All Team.ReadBasic.All User.Read Tasks.ReadWrite offline_access"
  5. Open the URL shown, enter the code, sign in
  6. Exchange for tokens:
     curl -X POST "https://login.microsoftonline.com/common/oauth2/v2.0/token" \
       -H "Content-Type: application/x-www-form-urlencoded" \
       -d "grant_type=device_code&client_id=CLIENT_ID&device_code=DEVICE_CODE"
  7. Save response to ~/.claude/pickle/teams-config.json (includes refresh_token for auto-renewal)

Run /pickle-teams again after completing setup.
```

---

## STEP 2 — VALIDATE AUTH + GET MY PROFILE

### Custom API mode

```bash
curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/me?\$select=id,displayName,mail,userPrincipalName"
```

Parse HTTP status from last line. If `401`:
```
❌ Token expired or invalid.
  • If you used Graph Explorer token (Option 2): get a fresh one — they expire in ~1 hour.
  • If you used Azure App token (Option 3): run /pickle-setup or manually refresh via:
    curl -X POST "https://login.microsoftonline.com/common/oauth2/v2.0/token" \
      -d "grant_type=refresh_token&client_id=CLIENT_ID&refresh_token=YOUR_REFRESH_TOKEN"
```
STOP.

If `403`:
```
❌ Missing Graph API permissions.
  Required scopes: Chat.Read, ChannelMessage.Read.All, Team.ReadBasic.All, User.Read, Tasks.ReadWrite
  Go to portal.azure.com → your app → API permissions → Add the missing ones → Grant admin consent.
```
STOP.

Set from response JSON:
- `MY_USER_ID` = `id`
- `MY_DISPLAY_NAME` = `displayName`
- `MY_EMAIL` = `mail` (fallback: `userPrincipalName`)
- `MY_AT_ID` = `MY_USER_ID` (used to match `mentions[].mentioned.user.id` in messages)

Print: `✅ Authenticated as: $MY_DISPLAY_NAME ($MY_EMAIL)`

### Connector mode

Use the connector's "get me" equivalent tool. Extract the same fields above.

---

## STEP 2.5 — LOAD STATE + INIT TO DO LIST

### Load state.json

```bash
cat ~/.claude/skills/pickle-teams/state.json 2>/dev/null || echo '{"version":2,"last_run":0,"seen_messages":{},"todo_list_id":null,"self_heal_count":0}'
```

Parse into `STATE` object.

### Find or create To Do list

```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/me/todo/lists?\$select=id,displayName"
```

Look for list where `displayName == "Task Board - By Pickle"`.

If not found, create:
```bash
curl -s -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Task Board - By Pickle"}' \
  "https://graph.microsoft.com/v1.0/me/todo/lists"
```

Set `TODO_LIST_ID` from the list `id`.

If `STATE.todo_list_id` exists but differs from current → update state (list was recreated).

### Fetch existing Pickle tasks (for dedupe)

```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/me/todo/lists/$TODO_LIST_ID/tasks?\$filter=status%20ne%20'completed'&\$select=id,title,body,status"
```

Extract all source URLs from task bodies (lines matching `🔗 Source: https://teams.microsoft.com/...`).
Build `EXISTING_SOURCE_URLS[]` for dedupe comparison in Step 7.

Print: `📋 To Do list ready: "$TODO_LIST_NAME" (${EXISTING_COUNT} open tasks)`

---

## STEP 3 — DISCOVER ALL TEAMS AREAS

Print: `🔍 Discovering Teams areas...`

### 3a — Joined Teams

```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/me/joinedTeams?\$select=id,displayName,description&\$top=50"
```

Limit to 50 teams max. For each team, fetch channels:

```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/teams/$TEAM_ID/channels?\$select=id,displayName,membershipType&\$top=50"
```

Include channel types: `standard`, `private`. Skip `shared` channels (may require elevated permissions).

Build `CHANNELS[]`:
```json
{
  "team_id": "...",
  "team_name": "...",
  "channel_id": "...",
  "channel_name": "...",
  "is_general": true/false,
  "membership_type": "standard/private"
}
```

Limit: max 200 channels total. Prioritise: General channels first, then by team importance.

### 3b — Chats (DMs + Group + Meeting)

```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/me/chats?\$expand=lastMessagePreview&\$select=id,chatType,topic,lastMessagePreview&\$top=100"
```

Filter to chats where `lastMessagePreview.createdDateTime >= OLDEST_ISO` OR `lastMessagePreview` is null (active but no preview).

Types to scan — priority order:
| Type | Label | Priority |
|------|-------|----------|
| `oneOnOne` | 1:1 DM | HIGH — always scan |
| `group` | Group chat | MEDIUM — scan if active |
| `meeting` | Meeting chat | MEDIUM — scan for action items |

Build `CHATS[]`:
```json
{
  "chat_id": "...",
  "chat_type": "oneOnOne/group/meeting",
  "topic": "...",
  "last_activity_iso": "..."
}
```

For 1:1 chats, fetch participant display name:
```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/chats/$CHAT_ID/members?\$select=displayName,userId"
```

Extract the participant who is NOT me → set as `chat_display_name`.

### 3c — Planner Tasks (assigned to me)

```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/me/planner/tasks?\$select=id,title,planId,dueDateTime,createdDateTime,createdBy,assignments&\$top=50"
```

Filter: `completedDateTime == null` (open tasks).
Filter: assigned to `MY_USER_ID`.

Build `PLANNER_ASSIGNED[]` for Step 5 classification.

### 3d — Planner Tasks (created by me, assigned to others — Mode B)

From the same tasks endpoint result, filter:
- `createdBy.user.id == MY_USER_ID`
- Assigned to someone other than me
- `completedDateTime == null`

Build `PLANNER_DELEGATED[]` for Mode B.

Print:
```
📊 Teams areas discovered:
   Teams    : [N] teams · [M] channels
   Chats    : [X] 1:1 DMs · [Y] group · [Z] meeting
   Planner  : [P] assigned to me · [Q] delegated by me (open)
```

---

## STEP 4 — SCAN MESSAGES

Print: `📥 Scanning messages... (this may take 15–30s)`

**Rate limit awareness:** Graph throttles at ~120 requests/10s for Chat messages. Insert a 500ms gap (`sleep 0.5`) between consecutive chat message fetches.

### 4a — Channel Messages (Mode A — mentions only)

For each channel in `CHANNELS[]`:

```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/teams/$TEAM_ID/channels/$CHANNEL_ID/messages?\$filter=createdDateTime%20ge%20$OLDEST_ISO&\$top=50&\$select=id,from,createdDateTime,body,mentions,messageType,webUrl,replyToId,lastModifiedDateTime"
```

For each message:
1. Skip if `messageType != "message"` (system events, call records, etc.)
2. Check `mentions[]` array: if any entry has `mentioned.user.id == MY_USER_ID` → **INBOX CANDIDATE**
3. Check if message is a reply (`replyToId` exists): fetch root message, check if I sent the root → **INBOX CANDIDATE** (reply to my thread)
4. Check if I am `from.user.id` AND the message has no reply from others in the time window → **FOLLOWUP CANDIDATE** (I spoke, no one replied)

For inbox candidates that are thread roots, fetch replies to see if I've already responded:
```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/teams/$TEAM_ID/channels/$CHANNEL_ID/messages/$MESSAGE_ID/replies?\$top=20&\$select=id,from,createdDateTime"
```

If I've already replied after the mention → skip (not an open inbox item).

Build `CHANNEL_INBOX[]` and `CHANNEL_FOLLOWUP[]`.

### 4b — Chat Messages (Mode A + B — all messages)

For each chat in `CHATS[]`:

```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/chats/$CHAT_ID/messages?\$filter=createdDateTime%20ge%20$OLDEST_ISO&\$top=100&\$select=id,from,createdDateTime,body,mentions,messageType,webUrl,replyToId"
```

Filter: `messageType == "message"` only.

**1:1 DMs:**
- Messages FROM the other person → always INBOX CANDIDATE (they're talking to me)
- Check: did I reply after their last message? If no → confirmed inbox item
- Messages FROM me with no response from them → FOLLOWUP CANDIDATE

**Group/Meeting chats:**
- Messages with `MY_USER_ID` in `mentions[]` → INBOX CANDIDATE
- Messages from me with no responses → FOLLOWUP CANDIDATE
- Meeting chats: also scan for patterns like "action item", "AI:", "TODO:", "@name will", "by [date]"

Build `CHAT_INBOX[]` and `CHAT_FOLLOWUP[]`.

Print progress: `  ✓ Scanned [N]/[TOTAL] areas...` (every 20 areas)

---

## STEP 5 — CLASSIFY ITEMS

Merge:
- `ALL_INBOX = CHANNEL_INBOX[] + CHAT_INBOX[] + PLANNER_ASSIGNED[]`
- `ALL_FOLLOWUP = CHANNEL_FOLLOWUP[] + CHAT_FOLLOWUP[] + PLANNER_DELEGATED[]`

### Mode A — Inbox Classification

For each inbox item, assign `ACTION_TYPE`:

| `ACTION_TYPE` | Detection Signals |
|---------------|-------------------|
| `APPROVAL` | "can you approve", "approve kar do", "LGTM?", "sign off", "confirm this", "give green light", "manjoor karo" |
| `DECISION` | Direct question ending in `?`, "what do you think", "kya lagta hai", "your call", "decide kar lo", "aap batao" |
| `REPLY_NEEDED` | 1:1 DM from other person with no reply from me in time window |
| `MENTION_UNRESPONDED` | @mention in channel/group with no reply from me |
| `BLOCKER` | "blocked", "stuck", "ruk gaya", "aage nahi badh pa raha", "waiting on you", "need you to unblock" |
| `REVIEW_REQUEST` | "please review", "review kar lo", "check this", "feedback chahiye", "PR ready", "dekh lo" |
| `TASK_ASSIGNED` | Planner task assigned to me (from 3c) |
| `MEETING_ACTION` | Meeting chat message matching "action item:", "AI:", "@{MY_NAME} will", "you'll handle" |

Extract for each item:
- `sender_name` — display name of who sent it
- `source_message` — first 200 chars of message body (strip HTML: remove `<at>`, `<p>`, etc.)
- `action_summary` — 1–2 sentence plain English: what is needed from me
- `platform_area` — "{team_name} / #{channel_name}" or "1:1 with {name}" or "Group: {topic}"
- `source_url` — `webUrl` from API response (direct Teams deep link)
- `received_at_unix` — `createdDateTime` as Unix timestamp

### Mode B — Follow-up Classification

For each follow-up item, assign `FOLLOWUP_TYPE`:

| `FOLLOWUP_TYPE` | Detection Signals |
|-----------------|-------------------|
| `DELEGATED_TASK` | I asked: "can you do", "please handle", "kar dena", "manage kar lo", "you take this" |
| `AWAITING_REPLY` | I asked a question, no response received |
| `PENDING_DELIVERY` | I asked for a file/doc/output: "share the", "bhej dena", "send me", "jab ready ho tab" |
| `PLANNER_DELEGATED` | Planner task I created and assigned to others (from 3d) |
| `DEADLINE_AT_RISK` | Planner task with `dueDateTime` within 24h and assigned to others |

Extract for each item:
- `assignee_name` — who I delegated to
- `original_ask` — what I asked (first 150 chars)
- `asked_at_unix` — when I sent the original message
- `days_waiting` — `(now - asked_at_unix) / 86400`

---

## STEP 6 — SCORE AND PRIORITISE

Score each item 0–100:

### Base score

| Factor | Points |
|--------|--------|
| 1:1 DM | +35 |
| APPROVAL request | +28 |
| BLOCKER type | +25 |
| DECISION request | +22 |
| MEETING_ACTION | +20 |
| @mention in channel | +20 |
| REVIEW_REQUEST | +18 |
| TASK_ASSIGNED (Planner) | +15 |
| Group chat | +12 |
| Meeting chat | +12 |
| DELEGATED_TASK follow-up | +15 |
| DEADLINE_AT_RISK follow-up | +25 |
| AWAITING_REPLY follow-up | +12 |

### Role keyword boost

| Matches in item content | Boost |
|------------------------|-------|
| 3+ `ROLE_KEYWORDS[]` | +20 |
| 2 keywords | +15 |
| 1 keyword | +10 |
| 0 keywords | 0 |

### Age modifier

| Message age | Modifier |
|-------------|----------|
| < 2 hours | +20 |
| 2–8 hours | +10 |
| 8–24 hours | 0 |
| > 24 hours | −10 |
| > 72 hours | −20 |

### Recency of activity (for updated items)

| Last activity | Modifier |
|---------------|----------|
| Updated item (from dedupe) | +10 |

### Priority buckets

| Score | Priority | Label |
|-------|----------|-------|
| 75+ | P1 | 🔴 URGENT — act today |
| 50–74 | P2 | 🟡 IMPORTANT — act this week |
| 25–49 | P3 | 🟢 LOW — act when possible |
| < 25 | P4 | ⚪ NOISE — skip |

Drop all P4 items. Do not create tasks for them.

Sort remaining items: P1 first, then P2, then P3. Within each bucket: sort descending by score.

Print: `⚡ Classified: [P1 count] urgent · [P2 count] important · [P3 count] low · [P4 count] noise (dropped)`

---

## STEP 7 — DEDUPE AGAINST STATE.JSON

For each scored item, generate stable `SOURCE_URL`:
- Channel message: use `webUrl` from API response (e.g. `https://teams.microsoft.com/l/message/...`)
- Chat message: use `webUrl` from API response
- Planner task: `planner:{task-id}` (no deep link available from API)
- If `webUrl` is null/empty: construct from IDs → `teams:{team-id}:{channel-id}:{message-id}`

**Dedupe logic:**

```
for each item where SOURCE_URL exists in STATE.seen_messages:
  stored = STATE.seen_messages[SOURCE_URL]

  if stored.status == "done":
    → SKIP entirely

  compute ACTIVITY_HASH = sha256-first-8(sender_name + source_message + platform_area)

  if ACTIVITY_HASH == stored.activity_hash:
    → SKIP (no new activity on this item)
  else:
    → KEEP as UPDATE (new activity on known item)
    → bump score by +10
    → update stored.last_activity_seen = now
    → update stored.activity_hash = ACTIVITY_HASH

for each item NOT in STATE.seen_messages:
  → KEEP as NEW
```

Use Bash to compute activity hash:
```bash
echo -n "${sender_name}${source_message}${platform_area}" | shasum -a 256 | cut -c1-8
```

**Self-heal:** For each item where `STATE.seen_messages[SOURCE_URL].todo_task_id` exists, verify the To Do task still exists:
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://graph.microsoft.com/v1.0/me/todo/lists/$TODO_LIST_ID/tasks/$STORED_TASK_ID"
```

If response is `404` (task deleted/completed externally) → remove from state, treat item as NEW. Increment `STATE.self_heal_count`.

Print: `🔄 Dedupe: [NEW_COUNT] new · [UPDATED_COUNT] updated · [SKIPPED_COUNT] unchanged · [SELFHEAL_COUNT] self-healed`

---

## STEP 8 — VALIDATE + CREATE TO DO TASKS

### Hard validation gate

Each item MUST have ALL of the following before a task is created. If any field is missing or empty → SKIP the item and print a warning.

Required fields:
- `SOURCE_URL` — non-empty string
- `sender_name` — non-empty string
- `action_summary` — non-empty, min 10 characters
- `priority` — one of P1/P2/P3
- `platform_area` — non-empty string
- `action_type` — valid ACTION_TYPE or FOLLOWUP_TYPE value

### Task title format

```
[P1] 💬 Reply to {sender_name} — {topic_slug}         (for REPLY_NEEDED / MENTION_UNRESPONDED)
[P1] ✅ Approve: {topic_slug} — from {sender_name}     (for APPROVAL)
[P1] 🚧 Unblock {sender_name}: {topic_slug}            (for BLOCKER)
[P2] 🔍 Review: {topic_slug} — {sender_name}           (for REVIEW_REQUEST)
[P2] 💭 Decide: {topic_slug}                           (for DECISION)
[P2] 📋 Planner: {task_title}                          (for TASK_ASSIGNED)
[P2] 📅 Meeting action: {topic_slug}                   (for MEETING_ACTION)
[P3] 📤 Follow up with {assignee_name} re: {topic_slug} (for DELEGATED_TASK)
[P3] ⏰ Deadline risk: {topic_slug} — {assignee_name}  (for DEADLINE_AT_RISK)
```

`topic_slug` = first 60 chars of message/task title, stripped of HTML. Strip to max 120 chars total for the title.

### Task body format

For **Inbox items (Mode A)**:
```
📍 Area: {platform_area}
🗓 Received: {relative_time} (e.g. "2 hours ago")
👤 From: {sender_name}
📝 What's needed: {action_summary}
🔗 Source: {SOURCE_URL}

---
pickle-teams · {ISO_TIMESTAMP}
```

For **Follow-up items (Mode B)**:
```
📍 Area: {platform_area}
📤 You asked: {original_ask}
👤 Delegated to: {assignee_name}
⏳ Asked: {relative_days_waiting} ago, no update since
🔗 Source: {SOURCE_URL}

---
pickle-teams · {ISO_TIMESTAMP}
```

### Create task via API

```bash
curl -s -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"$TASK_TITLE\",
    \"body\": {
      \"contentType\": \"text\",
      \"content\": \"$TASK_BODY\"
    },
    \"importance\": \"$IMPORTANCE\",
    \"dueDateTime\": {
      \"dateTime\": \"$DUE_ISO\",
      \"timeZone\": \"UTC\"
    }
  }" \
  "https://graph.microsoft.com/v1.0/me/todo/lists/$TODO_LIST_ID/tasks"
```

Importance mapping: `P1 → "high"`, `P2 → "normal"`, `P3 → "low"`

Due date mapping: `P1 → today`, `P2 → today + 2 days`, `P3 → today + 5 days`

After successful creation, extract returned `task_id` and store in state.

Print for each task: `  ✓ Created: "$TASK_TITLE"`

---

## STEP 9 — FOLLOWUP MODE (only if FOLLOWUP_MODE = true)

Show follow-up candidates one by one. For each item in `ALL_FOLLOWUP` that passed dedupe and validation:

```
────────────────────────────────────────
📤 Follow-up #{N} of {TOTAL}
   To: {assignee_name}
   Area: {platform_area}
   You asked ({days_waiting} days ago): "{original_ask}"
   Suggested message: "{follow_up_message}"

   Confirm: [y] Send  [s] Skip  [e] Edit message  [a] Send all remaining
────────────────────────────────────────
```

Wait for explicit user confirmation on each. Never auto-send without `y` or `a`.

**Follow-up message templates** (language-matched to original):

English:
```
Hey {assignee_name}, following up on "{original_ask_short}" — any update? 🙂
```

Hindi/Hinglish (detect from original ask language):
```
Hey {assignee_name}, "{original_ask_short}" ke baare mein follow-up kar raha tha — koi update?
```

#### Sending to Teams chat

```bash
curl -s -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"body\": {\"contentType\": \"text\", \"content\": \"$FOLLOWUP_MESSAGE\"}}" \
  "https://graph.microsoft.com/v1.0/chats/$CHAT_ID/messages"
```

#### Sending as channel thread reply

```bash
curl -s -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"body\": {\"contentType\": \"text\", \"content\": \"$FOLLOWUP_MESSAGE\"}}" \
  "https://graph.microsoft.com/v1.0/teams/$TEAM_ID/channels/$CHANNEL_ID/messages/$ROOT_MESSAGE_ID/replies"
```

Track sent follow-ups in `STATE.followups_sent[]`.

---

## STEP 10 — SAVE STATE + PRINT SUMMARY

### Build updated state JSON

```json
{
  "version": 2,
  "last_run": CURRENT_UNIX,
  "seen_messages": {
    "{SOURCE_URL}": {
      "first_seen": UNIX,
      "last_activity_seen": UNIX,
      "activity_hash": "8-char-hex",
      "todo_task_id": "microsoft-todo-task-id",
      "todo_task_title": "Task title...",
      "status": "open",
      "priority": "P1",
      "action_type": "APPROVAL",
      "sender": "Display Name",
      "platform_area": "Team / #channel or 1:1 with Name"
    }
  },
  "todo_list_id": "list-id-string",
  "self_heal_count": 0,
  "followups_sent": []
}
```

Write:
```bash
cat > ~/.claude/skills/pickle-teams/state.json << 'STATEEOF'
{STATE_JSON}
STATEEOF
```

### Print final summary

```
════════════════════════════════════════
  🥒 pickle-teams — Done
════════════════════════════════════════

📥 INBOX (needs your action)
  🔴 P1 Urgent    : [N] items
  🟡 P2 Important : [N] items
  🟢 P3 Low       : [N] items
  ⚪ P4 Noise      : [N] dropped

📤 FOLLOW-UP (you delegated)
  [N] items tracked [+ X sent if FOLLOWUP_MODE]

📊 Coverage
  Teams scanned   : [N] teams · [M] channels
  Chats scanned   : [X] 1:1 DMs · [Y] groups · [Z] meetings
  Messages read   : [TOTAL_COUNT]
  Planner tasks   : [P] assigned to me · [Q] delegated by me
  Tasks created   : [N] (To Do: "Task Board - By Pickle")
  Deduped/skipped : [N] unchanged · [N] updated
  Self-healed     : [N] externally completed

🔗 Open To Do: https://to-do.microsoft.com/tasks/inbox

⏱ Run time: ~[X]s
```

---

## ERROR HANDLING

| Error | Action |
|-------|--------|
| `401 Unauthorized` | Token expired. Print refresh instructions. STOP. |
| `403 Forbidden` | Missing Graph permission. List required scopes. STOP. |
| `429 Too Many Requests` | Pause 30s (`sleep 30`), retry once. If still 429, skip that area and continue. |
| `404 Not Found` on a resource | Skip that team/channel/chat. Continue. |
| Empty `value` array | Skip, no messages in that area. Continue. |
| `teams-config.json` malformed | Print: "Config file is invalid JSON. Expected: {access_token: '...'}". STOP. |
| Bash `curl` not found | Print: "curl is required. Install via: brew install curl". STOP. |
| Channel scan fails with 403 | Some channels require member/owner. Skip and note in summary. |

---

## APPENDIX A — TOKEN AUTO-REFRESH

If `token_expiry` in config is within 300 seconds of now AND `refresh_token` + `client_id` are present, attempt refresh before scanning:

```bash
REFRESH_RESPONSE=$(curl -s -X POST \
  "https://login.microsoftonline.com/common/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&client_id=$CLIENT_ID&refresh_token=$REFRESH_TOKEN&scope=Chat.Read ChannelMessage.Read.All Team.ReadBasic.All User.Read Tasks.ReadWrite offline_access")
```

If refresh succeeds (response contains `access_token`): update `~/.claude/pickle/teams-config.json` with new token + expiry. Print: `🔄 Token refreshed automatically`

If refresh fails: print token expired message and STOP.

---

## APPENDIX B — TEAMS HTML BODY PARSING

Teams message `body.content` is HTML. When extracting plain text for `action_summary` and `source_message`, strip:
- `<at id="...">name</at>` → replace with `@name`
- `<p>...</p>` → extract text content
- `<br>` → newline
- `<b>`, `<i>`, `<u>`, `<strike>` → strip tags, keep text
- `<a href="...">text</a>` → keep text only
- All other HTML tags → strip, keep text

Use Bash:
```bash
echo "$HTML_CONTENT" | sed 's/<at[^>]*>/@ /g' | sed 's/<\/at>//g' | sed 's/<[^>]*>//g' | sed 's/&amp;/\&/g' | sed 's/&lt;/</g' | sed 's/&gt;/>/g' | sed 's/&nbsp;/ /g'
```

---

## APPENDIX C — CONNECTOR MODE TOOL MAPPING

If `CONNECTION_MODE = "connector"`, replace all Graph API `curl` calls with the equivalent connector tool calls. Expected tool naming (adjust if actual connector uses different names):

| Graph API Call | Connector Tool |
|---------------|----------------|
| `GET /me` | `ms_teams_get_me` or `teams_get_profile` |
| `GET /me/joinedTeams` | `ms_teams_list_teams` |
| `GET /teams/{id}/channels` | `ms_teams_list_channels` |
| `GET /teams/{id}/channels/{id}/messages` | `ms_teams_get_channel_messages` |
| `GET /me/chats` | `ms_teams_list_chats` |
| `GET /chats/{id}/messages` | `ms_teams_get_chat_messages` |
| `GET /me/planner/tasks` | `ms_teams_get_planner_tasks` |
| `GET /me/todo/lists` | `ms_teams_get_todo_lists` |
| `POST /me/todo/lists/{id}/tasks` | `ms_teams_create_todo_task` |
| `POST /chats/{id}/messages` | `ms_teams_send_chat_message` |

If connector tools have different names, adapt accordingly. Connector mode is functionally equivalent — all same steps, same scoring, same state management.
