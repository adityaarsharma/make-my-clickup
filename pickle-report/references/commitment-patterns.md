# Commitment Pattern Reference

## English Patterns

### COMMITMENT (will do)
- "I'll [verb] X" / "I will [verb] X"
- "Will do X" / "Doing X today" / "Starting X"
- "Taking up X" / "Picking up X" / "Working on X"
- "Going to [verb] X" / "Going to finish X by [date]"
- "Will have X ready by [date]" / "X by EOD" / "X by tomorrow"
- "On my plate: X" / "My task this week: X"
- "Assigned myself X" / "Took X"

### COMPLETION (done)
- "Done ✅" / "Done with X" / "X is done" / "Completed X"
- "Finished X" / "X is live" / "Pushed X" / "X shipped"
- "Delivered X" / "Submitted X" / "Sent X"
- "X is ready" / "X is up" / "X is out"
- "Closed X" / "Wrapped X"

### BLOCKER (stuck)
- "Blocked on X" / "Stuck on X" / "Can't proceed with X"
- "Waiting for X" / "Need X before I can continue"
- "X is dependent on [person/task]"
- "Need help with X" / "Need [person] to [do Y]"
- "Can't start X until Y is done"

### DELAY (postponed)
- "X is taking longer than expected"
- "Pushing X to [date]" / "X pushed to tomorrow"
- "Couldn't finish X today" / "Didn't get to X"
- "X is delayed" / "X is running behind"
- "Will do X tomorrow / next week"
- "Missed X" (explicit acknowledgement)

### STATUS UPDATE (in progress)
- "Working on X" / "In progress on X" / "X is WIP"
- "X is at [N]%" / "Almost done with X" / "Reviewing X"
- "Drafted X" / "First version of X is ready for review"
- "Testing X" / "X is in review"

## Hinglish / Informal Patterns

### COMMITMENT
- "kar lunga" / "kar leta hun" / "le leta hun"
- "le raha hun X" / "start kar raha hun"
- "kal kar dunga" / "aaj kar leta hun"
- "apne upar le liya X" / "main X dekh leta hun"

### COMPLETION
- "ho gaya" / "ho gayi" / "kar diya"
- "done hai" / "X complete" / "bhej diya"
- "X ready hai" / "X live hai" / "X up hai"
- "khatam" / "finish"

### BLOCKER
- "atak gaya" / "atak gaya hun X mein"
- "wait kar raha hun X ke liye"
- "X nahi ho raha" / "rukka hua hai"
- "X ke bina nahi ho sakta"

### DELAY
- "kal karta hun" / "kal tak karr dunga"
- "thoda der lagega" / "extend ho raha hai"
- "nahi hua X" / "X reh gaya"
- "miss ho gaya" / "next week le lunga"

## Noise Patterns (exclude from analysis)
- Pure emoji messages
- Greetings: "good morning", "hey", "hi all", "gm"
- Reactions: "+1", "👍", "ok", "noted", "sure"
- Off-topic: links without context, memes, jokes
- Questions TO others: "can you do X?" (not a commitment)
- Acknowledgements: "will check", "let me see", "I'll look into it" (ambiguous — mark as SOFT_COMMITMENT with 0.5 weight)

## Keyword Matching for Task Cross-Reference

When matching a commitment text to a task name:

1. **Tokenize:** lowercase, split on spaces/punctuation, remove stop words (a, an, the, is, in, on, for, to, of, and, or, with)
2. **Stem/normalize:** "designing" → "design", "reviewing" → "review", "writing" → "write"
3. **Match threshold:**
   - ≥ 3 keywords overlap → HIGH CONFIDENCE match
   - 2 keywords overlap → MEDIUM CONFIDENCE
   - 1 keyword overlap + same assignee + close dates → LOW CONFIDENCE
   - 0 overlap → NO MATCH

4. **Special cases:**
   - If commitment mentions a person name and a task has that person assigned → boost confidence
   - If commitment has a date and task has matching due_date → boost confidence
   - Task mentions in chat (clickup task URLs or IDs) → direct match, 100% confidence

## Unmatched Handling

**Unmatched commitment** (said they'd do it, no task found):
- Possible reasons: task in a list we don't have access to, no task created, shadow work
- Flag level: LOW (not all work is tracked in ClickUp)
- Report as: "Mentioned X but no matching task found — might be untracked work"

**Unmatched completion** (claimed done, task still open):
- Possible reasons: forgot to update task status, task updated by someone else, different task
- Flag level: MEDIUM (data hygiene issue)
- Report as: "Claimed X complete but task card still shows [status] — update the card"
