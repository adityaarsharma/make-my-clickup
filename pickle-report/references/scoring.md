# Pickle Report — Scoring Reference

## Score Weights

| Metric | Weight | What it measures |
|--------|--------|------------------|
| Delivery rate | 40% | Did they do what they said? |
| Update compliance | 30% | Did they document their work in tasks? |
| Channel presence | 20% | Were they active and communicating? |
| Time efficiency | 10% | Did tasks take longer than estimated? |

## Delivery Rate Formula

```
commitments_made = count of COMMITMENT-type messages in window
commitments_delivered = tasks matched to commitments AND status = COMPLETED
  + self-reported completions that match a real completed task

delivery_rate = commitments_made > 0
  ? commitments_delivered / commitments_made
  : 1.0  // if no explicit commitments, don't penalise
```

**Edge cases:**
- If person made 0 commitments in chat but has completed tasks → delivery_rate = 1.0 (silent achiever)
- If person made commitments but no tasks exist at all → delivery_rate = 0.0 (talk without tracking)
- If commitments can't be matched to tasks (ambiguous) → count as 0.5 (partial credit)

## Time Efficiency Formula

```
per_task_efficiency = time_estimate_ms / time_spent_ms

// Examples:
// Estimated 4h, spent 4h → 1.0 (perfect)
// Estimated 4h, spent 8h → 0.5 (50% over budget)  
// Estimated 4h, spent 2h → 2.0 (under budget, cap at 1.5 for scoring)
// No estimate → exclude from calculation

avg_time_efficiency = mean(per_task_efficiency[]) over all tasks with estimates
// If no tasks have estimates → null → use 0.70 as neutral assumption
```

**What to flag:**
- avg < 0.70 → tasks are taking significantly longer than estimated → flag in report
- avg < 0.50 → major overrun → strong flag

## Update Compliance Formula

```
tasks_assigned = all tasks assigned to this person in window (active or completed)
tasks_with_updates = tasks where:
  - description_score >= 2 (has progress notes), OR
  - self_comment_count >= 1 (commented on the task themselves in the window)

update_compliance = tasks_assigned > 0
  ? tasks_with_updates / tasks_assigned
  : 1.0  // no tasks → neutral
```

**Description scoring:**
- Score 0: No description, or title only (< 20 chars)
- Score 1: Has description, but it's just the original brief (no updates, no progress)
- Score 2: Has progress notes, some updates, but not complete
- Score 3: Well-documented: approach, progress, blockers, what was done — manager can understand status without asking

## Channel Presence Formula

```
unique_days_posted = count of unique calendar dates member posted in channel (WINDOW_DAYS)
working_days = WINDOW_DAYS // ideally exclude weekends, but use WINDOW_DAYS as safe default

presence_score = unique_days_posted / min(working_days, WINDOW_DAYS)
// Cap at 1.0
```

**What to flag:**
- presence_score < 0.40 → ghost mode (only active 2 out of 5 days) → flag
- presence_score == 0.0 → completely silent for the whole window → strong flag + tag Aditya

## Overall Score

```
overall_score = (
  delivery_rate      * 0.40 +
  update_compliance  * 0.30 +
  presence_score     * 0.20 +
  min(avg_time_efficiency ?? 0.70, 1.5) / 1.5 * 0.10
)
```

## Status Labels

| Score Range | Label | Colour |
|-------------|-------|--------|
| ≥ 0.85 | On track | 🟢 |
| 0.70 – 0.84 | Needs attention | 🟡 |
| 0.55 – 0.69 | Underperforming | 🟠 |
| < 0.55 | Critical | 🔴 |

## Flag Triggers (any one triggers a flag)

| Condition | Severity |
|-----------|----------|
| delivery_rate < 0.60 | HIGH |
| zombie_tasks >= 2 | HIGH |
| presence_score < 0.40 | HIGH |
| unmatched_completions >= 2 (claimed done, task open) | MEDIUM |
| Any task overdue > 7 days, zero comments | MEDIUM |
| Blocker mentioned in chat but not logged on task card | MEDIUM |
| avg_time_efficiency < 0.50 | MEDIUM |
| No task descriptions at all (description_score all 0) | LOW |

## Pattern Detection (across reports)

A **pattern** is flagged when:
- Same flag appears in ≥ 2 consecutive reports
- Or: delivery_rate < 0.70 for ≥ 3 out of last 4 reports
- Or: presence_score < 0.40 for ≥ 2 consecutive reports

Pattern = something to escalate to Aditya with stronger language in the report.

Pattern label options:
- `"consistently_late_delivery"` — delivery rate trend declining
- `"task_hygiene_issue"` — consistently doesn't document tasks
- `"ghost_pattern"` — presence score low repeatedly
- `"time_overruns"` — consistently over time estimates
- `"improving"` — scores improving, worth noting positively
