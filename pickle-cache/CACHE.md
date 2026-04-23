# Pickle Shared Cache — Protocol

> Used by: `pickle-clickup`, `pickle-slack`, `pickle-report`, `pickle-me`

All Pickle skills share a local cache at `~/.claude/pickle/cache/`. This avoids redundant API calls — if `pickle-clickup` ran this morning and fetched the member list, `pickle-report` running an hour later uses that same list without hitting ClickUp again.

---

## Cache Files

### `~/.claude/pickle/cache/workspace.json`
Workspace-level data. Expensive to fetch, rarely changes.

```json
{
  "workspace_id": "9016694417",
  "workspace_name": "POSIMYTH",
  "members_cached_at": "2026-04-23T08:00:00Z",
  "members_ttl_hours": 24,
  "members": {
    "11111111": { "name": "Your Name", "username": "yourname", "email": "..." },
    "22222222": { "name": "Team Member", "username": "team_member", "email": "..." }
  },
  "channels_cached_at": "2026-04-23T08:00:00Z",
  "channels_ttl_hours": 6,
  "channels": {
    "8cpznmh-3296": {
      "name": "marketing-hq",
      "member_ids": ["12345678", "..."],
      "last_message_at": "2026-04-23T07:45:00Z"
    }
  }
}
```

### `~/.claude/pickle/cache/tasks.json`
Recently fetched task details. Short TTL since tasks update frequently.

```json
{
  "86d1cftyd": {
    "name": "Regular tasks UiChemy",
    "status": "to do",
    "assignee_id": "11111111",
    "time_spent_ms": 288000000,
    "time_estimate_ms": 0,
    "description": "",
    "date_updated_ms": 1713820000000,
    "due_date_ms": null,
    "priority": "normal",
    "list_name": "UiChemy",
    "cached_at": "2026-04-23T08:00:00Z",
    "ttl_hours": 1
  }
}
```

### `~/.claude/pickle/cache/report-memory.json`
Behavioural patterns per channel per member. Used by `pickle-report` to detect trends over time. No TTL — grows permanently, pruned to 90 days.

```json
{
  "your-channel": {
    "22222222": {
      "commitment_patterns": {
        "words": ["taking up", "will do", "working on"],
        "avg_commitments_per_window": 4.5,
        "typical_tasks": ["blog", "SEO", "content"]
      },
      "known_flags": {
        "task_abc123": {
          "task_name": "Example Task",
          "first_flagged": "2026-04-23",
          "flag_count": 1,
          "flag_type": "overdue",
          "resolved_at": null
        }
      },
      "known_zombie_ids": ["task_abc123"],
      "last_seen_score": 0.85,
      "score_history": [0.85],
      "flag_history": []
    }
  }
}
```

---

## Cache Read Protocol (for all skills)

At the start of any data-fetch step, before calling any ClickUp MCP tool:

```
CACHE_READ(key, ttl_hours):
  1. Read ~/.claude/pickle/cache/workspace.json (or tasks.json)
  2. Check if key exists AND cached_at + ttl_hours > now
  3. If FRESH → return cached value, skip API call
  4. If STALE or MISSING → call ClickUp API, then write result to cache
```

**TTL rules:**
| Data type | TTL | Why |
|-----------|-----|-----|
| Workspace ID | 7 days | Never changes |
| Member list | 24 hours | Rarely changes |
| Channel list + member IDs | 6 hours | Changes slowly |
| Task details (name, status, time) | 1 hour | Can change mid-day |
| Task comments | 30 min | Most volatile |

---

## Cache Write Protocol

After every fresh API fetch, always write back:

```
CACHE_WRITE(key, data):
  1. Read existing cache file (or start with {})
  2. Merge key → data with cached_at = now ISO timestamp
  3. Write back atomically
  4. Never delete existing keys when writing new ones
```

---

## Cache Invalidation

A skill should **force-refresh** (ignore TTL) when:
- User explicitly passes `--refresh` or `fresh` argument
- A write operation was just performed (e.g. task status updated)
- Cache file is corrupt or unparseable → treat as MISS, rebuild

---

## Cross-Skill Data Flow

```
pickle-clickup (runs daily)
  → fetches members, channels, task details
  → writes to workspace.json + tasks.json

pickle-report (runs weekly)
  → reads workspace.json → SKIPS member/channel API calls if fresh
  → reads tasks.json → SKIPS task detail calls for recently cached tasks
  → writes report-memory.json with new patterns + flags

pickle-me (runs daily)
  → reads workspace.json → gets MY_USER_ID + member map without API call
  → reads tasks.json → gets task details for recently touched tasks
  → writes nothing to shared cache (personal only → state.json)
```

**Net result:** After `pickle-clickup` runs once, `pickle-report` needs ~60% fewer API calls. After 3+ runs, `pickle-report` only re-fetches tasks that changed since last cache.

---

## First Run

On first run, all caches are empty (MISS). All API calls happen normally. After the run, everything is written to cache. Second run is significantly faster.

If cache folder doesn't exist: `mkdir -p ~/.claude/pickle/cache/` and proceed — caches are all MISS, build fresh.
