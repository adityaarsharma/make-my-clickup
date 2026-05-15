# CLAUDE.md — Pickle quality standards

> Hard rules for any agent (Claude or otherwise) editing this repo. Violating these has cost real time. Read this top-to-bottom before changing anything.

---

## 1. Pickle is ONE product

Pickle is a single product called **Pickle**, built by Aditya Sharma. It ships as three inbox skills (`pickle-clickup`, `pickle-slack`, `pickle-teams`) plus a setup wizard and updater — but the public framing is always **one product**, not three.

- ❌ Never write README headings like "Three platforms. Three independent tools."
- ✅ It's **Pickle**. Inbox commands (`/pickle-clickup`, `/pickle-slack`, `/pickle-teams`) are three views into the same Pickle — one per ecosystem the user uses.

---

## 2. No third-party connectors. Pickle uses its own paths.

Pickle does **not** rely on:
- Claude's official ClickUp connector
- Claude's official Slack connector
- Claude's official Microsoft Teams connector

The user's tokens stay on their machine. The auth paths are:
- **ClickUp** → Pickle's bundled MCP server (`~/.claude/pickle-mcp/clickup/server.mjs`) + the user's `pk_…` personal token
- **Slack** → `xoxp-` user token via the bundled config (`korotovsky/slack-mcp-server` is fine as the runtime), but Pickle's setup is what walks them through it
- **Teams** → Microsoft Graph token at `~/.claude/pickle/teams-config.json` (Azure AD app + device flow, or Graph Explorer for quick tests)

When in doubt: if a doc, README, install script, or skill says "claude.ai → Settings → Connectors", that's a bug. Remove it.

---

## 3. Never claim anything about pricing

Pickle's pricing is decided outside of the public-facing copy. The README, every SKILL.md, every install script, and every release note **says nothing** about pricing, beta status, free tiers, paid tiers, future paid plans, credit cards, founding-member rates, or grandfathering.

Banned phrases:
- "Free forever"
- "100% free"
- "Always free"
- "No credit card"
- "Free for now"
- "Public beta"
- "Paid plan"
- "Paid tier"
- "Charge you …"
- "Founding member"
- "Grandfather"

What you CAN say:
- "Runs on your machine" (a technical fact)
- "ClickUp's API is free on every plan" (factual about ClickUp, not Pickle)
- "Slack's API is free on every plan" (factual about Slack)
- "Microsoft Graph is free on every Microsoft 365 plan" (factual about MS)

The license is MIT (badge can stay) — that's a fact, not a price.

---

## 4. No hardcoded personal / company / workspace identifiers

Banned strings in user-facing template text, examples, and detection patterns:
- `Aditya` as a hardcoded name pattern (e.g. `"Aditya please review"`)
- `POSIMYTH`, `posimyth.com`, `posimyth.slack.com`
- `RunCloud`, `runcloud.com`
- `Hetzner`, `95.216.156.89`, RunCloud panel paths
- `nexterwp`, `theplusaddons`, `uichemy`, `wdesignkit` (product-team channels)
- `nexter-hq`, `tpae-*` (POSIMYTH internal channels)

What CAN stay:
- "Built by Aditya Sharma" credit lines — these are the personal-brand vibes, do not remove them
- Author entries in `package.json` pointing to `https://adityaarsharma.com`
- Example channel names: `marketing-hq`, `engineering-hq`, `design-hq` (generic)
- Example workspace: `acme-corp.slack.com` (generic)

User-facing detection patterns must use `$MY_NAME` interpolation, never a literal name.

---

## 5. Comparison tables compare WITHIN a platform

When writing "Pickle X vs [Native AI Y]" tables, every row must be a capability **inside that platform**.

- ❌ Bad row: "Reads your ClickUp tasks" (in a Slack-vs-Slack-AI table — a Slack user doesn't care)
- ✅ Good row: "Tracks unanswered DMs as inbox items" (inside Slack, a real Slack AI gap)

Cross-platform synthesis is mentioned ONCE in the closing summary line, not as a feature row in every table. A Slack-only user reading "Pickle Slack vs Slack AI" should see why Pickle is better for THEM, on Slack, today.

---

## 6. Skill name = directory name = slash command

Every skill must satisfy: `directory name === frontmatter name === slash command`. If you rename one, rename all three plus every reference in:
- `README.md`
- `install-manager.sh` / `install-team.sh` / `update.sh`
- Other skills' SKILL.md that mention this skill
- Brain memory if relevant

The slash command set (current and locked):
- `/pickle-setup` (self-deletes after onboarding)
- `/pickle-clickup`
- `/pickle-slack`
- `/pickle-teams`
- `/pickle-update`

---

## 7. `/pickle-update` never deletes a skill the user is using

The deprecated-cleanup list in `update.sh` must NEVER include a skill that's still a part of the public product.
- Only `pickle-setup` (self-deleting wizard), `pickle-me` (retired), and `pickle-report` (removed in v3.0.0) may be auto-removed.

Adding a live skill to the deprecated list = breaking every install that uses it. Don't.

---

## 8. Token handling — three non-negotiable rules

1. **Never echo tokens back** to the user after they paste. No `echo "$TOKEN"`. No printing curl output that contains the token.
2. **Atomic writes** for any file that contains a token (`~/.claude.json`, `~/.claude/pickle/teams-config.json`). Always `tempfile + fsync + os.replace`. Never truncate-in-place — a crash loses every other MCP server the user has configured.
3. **chmod 600** on any token file. Use `umask 077` before creating it. Use a heredoc, never `echo "{...}" >`, so the token isn't in shell history.

For the Microsoft Graph token refresh: validate `access_token` is present in the response before overwriting. A failed refresh must NEVER wipe a working credential.

---

## 9. Version drift detection

If you bump `pickle-mcp/clickup/server.mjs` version, you MUST also bump:
- The header comment block in `server.mjs` (`@pickle/clickup-mcp vX.Y.Z`)
- The server constructor `version` field in `server.mjs`
- `pickle-mcp/clickup/package.json` `version` field

The `version` source-of-truth for installed Pickle is `~/.claude/pickle-mcp/.pickle_version` (written by `install-*.sh` / `update.sh`). All version-check blocks across skills read this file — never grep `server.mjs`.

---

## 10. Privacy claims must be true

The README says "no telemetry, no phone-home, no cloud". This must be literally true in code:
- The only outbound HTTP allowed from any skill is to: `api.clickup.com`, `slack.com`, `graph.microsoft.com`, `login.microsoftonline.com`, `api.anthropic.com` (Claude API), `api.github.com` (release check only, opt-out gated + 24h cached on disk).
- No analytics. No error reporting services. No usage telemetry.
- Scratch files in `~/.claude/skills/*/.scratch/` are cleaned up after each run or auto-pruned after 24h.
- State files (`state.json`, `report-memory.json`, `workspace.json`) contain IDs + timestamps + scores. They never contain raw message content.

---

## 11. Skill safety rule for shell

When a skill emits bash that handles dynamic strings (member names, message bodies, task titles from any API), the rule is:
- **Build JSON via** `python3 -c 'json.dumps(...)'` or `jq` — never inline `-d "{...}"` with string interpolation.
- **Pipe via stdin** for `shasum`, `sed`, anything reading dynamic content — never as positional args.
- Use `--data-urlencode` for curl form-data, not `-d "key=$VAR"`.

A teammate's display name can contain `"`, `\`, `$`, or backticks. If your skill executes that name directly, that's RCE.

---

## 12. Test before release

Before every `git tag` + `gh release create`:

```bash
# 1. Frontmatter integrity
for s in pickle-*/SKILL.md; do head -5 "$s" | grep -q "^name:" && echo "✓ $s" || echo "✗ $s"; done

# 2. Bash syntax
bash -n install-manager.sh && bash -n install-team.sh && bash -n update.sh

# 3. Node syntax
node --check pickle-mcp/clickup/server.mjs

# 4. No banned strings (CLAUDE.md is excluded — it documents the bans)
grep -rEn "free forever|100% free|paid plan|posimyth|runcloud|nexter-hq|pickle-clickup-team-report" . --include="*.md" --include="*.sh" --include="*.mjs" --include="*.json" | grep -v node_modules | grep -v "CLAUDE.md:"
# (Above must return zero hits.)

# 5. No hardcoded user name in detection patterns (CLAUDE.md excluded)
grep -rn "Aditya please\|check with Aditya\|waiting for Aditya\|@Aditya " . --include="*.md" | grep -v "Built by\|Built and Shipped\|by Aditya Sharma" | grep -v "CLAUDE.md:"
# (Must return zero hits.)
```

If any check fails, don't tag the release.

---

## 13. Release commits + tags + gh release notes

Every release ships three things together:
1. Conventional commit with a real changelog body (not just "fix")
2. Annotated tag (`v2.X.Y`) pushed to origin
3. `gh release create` with user-readable notes — what changed and why a user should update

Use the patch number (`2.9.X`) for doc/positioning changes, minor (`2.X.0`) for new skill features, major bumps only for breaking changes.

---

## 14. Pickle is LLM-agnostic — public copy must reflect this

The MCP server is the core product. It runs in **any MCP-compatible AI host**, not just Claude. Public-facing copy (README, GitHub description, badges, topics, release notes, landing page) must NEVER make Pickle sound Claude-only.

- ❌ Banned in public copy: "Claude Code skill suite" as the primary description, "AI for Claude Code" as the tagline, badges that only mention Claude, topics like `claude-plugin` / `claude-skill` / `anthropic`.
- ✅ Use: "MCP server + (optional) Claude Code skills", "Works with Claude, Cursor, Codex, Cline, any MCP host", topics like `mcp`, `mcp-server`, `mcp-tools`, `cursor`, `codex`, `llm`, `llm-agent`, `ai-agent`.

Skills are a Claude-Code/Desktop convenience layer (slash commands). The MCP server is the value. When a user in Cursor or Codex looks for "MCP servers for ClickUp" or "MCP for Slack", Pickle should be in the result set — that's the discovery surface.

Inside the SKILL.md files (which Claude Code/Desktop read), it's fine to mention "Claude Code" since that's the runtime — those files are Claude-specific by design. But README, package.json descriptions, release notes, and the landing page are seen by everyone in the MCP ecosystem.

GitHub topics (max 20) should always include: `mcp`, `mcp-server`, `mcp-tools`, `model-context-protocol`, plus at least 2 non-Claude MCP-host names (`cursor`, `codex`, `cline`, `continue`, `goose`, `zed`) for discoverability across that ecosystem.

---

## 15. When in doubt — the user's mental model wins

The user is Aditya Sharma. His mental model of Pickle lives in `~/.claude/CLAUDE.md` (global) and is reinforced through the chat history. When public-facing copy contradicts that mental model, fix the copy, not the mental model.

If you're about to write something the user would call "nonsense" — stop and re-read this file.
