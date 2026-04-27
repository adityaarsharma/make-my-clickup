#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  🥒  Pickle — Team Member Install
#  Installs: pickle-clickup · pickle-slack · pickle-update
#  Configures: ClickUp personal token MCP (for shared accounts)
#
#  Usage: open Claude Code → press ⌃` → paste:
#    curl -fsSL https://raw.githubusercontent.com/adityaarsharma/pickle/main/install-team.sh | bash
# ══════════════════════════════════════════════════════════════
set -e

SKILLS_DIR="$HOME/.claude/skills"
PICKLE_MCP_DIR="$HOME/.claude/pickle-mcp"
CLAUDE_JSON="$HOME/.claude.json"
REPO_URL="https://github.com/adityaarsharma/pickle.git"

echo ""
echo "════════════════════════════════════════════════════"
echo "  🥒  Pickle — Team Member Install"
echo "════════════════════════════════════════════════════"
echo ""
echo "Installing:"
echo "   /pickle-clickup   — your ClickUp inbox"
echo "   /pickle-slack     — your Slack inbox"
echo "   /pickle-update    — one-command updater"
echo ""
echo "Takes about 2 minutes."
echo ""

# ── Clone latest ────────────────────────────────────────────────
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo "⏳ [1/4] Fetching latest from GitHub ..."

LATEST_TAG=""
LATEST_TAG=$(git ls-remote --tags --sort="-v:refname" "$REPO_URL" 2>/dev/null \
  | grep -oE 'refs/tags/v[0-9]+\.[0-9]+\.[0-9]+$' \
  | head -1 \
  | sed 's|refs/tags/||' || echo "")

if [ -n "$LATEST_TAG" ]; then
  git clone --depth 1 --branch "$LATEST_TAG" --quiet "$REPO_URL" "$TMPDIR" 2>/dev/null \
    || git clone --depth 1 --quiet "$REPO_URL" "$TMPDIR"
else
  LATEST_TAG="main"
  git clone --depth 1 --quiet "$REPO_URL" "$TMPDIR"
fi
echo "   ✓ Fetched $LATEST_TAG"

# ── Install skills ───────────────────────────────────────────────
echo ""
echo "⏳ [2/4] Installing skill files ..."
mkdir -p "$SKILLS_DIR"

for skill in pickle-clickup pickle-slack pickle-update; do
  if [ -d "$TMPDIR/$skill" ]; then
    rm -rf "$SKILLS_DIR/$skill"
    cp -R "$TMPDIR/$skill" "$SKILLS_DIR/$skill"
    CMD=$(grep "^name:" "$SKILLS_DIR/$skill/SKILL.md" 2>/dev/null | head -1 | sed 's/name: *//' || echo "$skill")
    echo "   ✓ /$CMD"
  fi
done

# ── Install ClickUp MCP server ───────────────────────────────────
echo ""
echo "⏳ [3/4] Installing ClickUp MCP server ..."
if command -v node >/dev/null 2>&1; then
  mkdir -p "$PICKLE_MCP_DIR/clickup"
  if [ -f "$TMPDIR/pickle-mcp/clickup/server.mjs" ]; then
    cp "$TMPDIR/pickle-mcp/clickup/server.mjs" "$PICKLE_MCP_DIR/clickup/server.mjs"
    [ -f "$TMPDIR/pickle-mcp/clickup/package.json" ] && \
      cp "$TMPDIR/pickle-mcp/clickup/package.json" "$PICKLE_MCP_DIR/clickup/package.json"
    (cd "$PICKLE_MCP_DIR/clickup" && npm install --silent 2>/dev/null)
    echo "   ✓ MCP server ready"
  fi
  [ -f "$TMPDIR/update.sh" ] && cp "$TMPDIR/update.sh" "$PICKLE_MCP_DIR/update.sh" && chmod +x "$PICKLE_MCP_DIR/update.sh"
else
  echo "   ✗ Node.js not found."
  echo "     Install Node.js LTS from nodejs.org, then re-run this script."
  exit 1
fi

# ── Configure ClickUp API token ──────────────────────────────────
echo ""
echo "⏳ [4/4] Connecting your ClickUp account ..."
echo ""
echo "   Get your token from: app.clickup.com/settings/apps"
echo "   It starts with pk_..."
echo ""
printf "   Paste your ClickUp API token: "
read -r CLICKUP_TOKEN </dev/tty

if [ -z "$CLICKUP_TOKEN" ]; then
  echo ""
  echo "   ⚠ No token entered — skipping ClickUp configuration."
  echo "     Run this script again when you have your token."
  SKIP_TOKEN=1
else
  # Fetch workspace ID from the API
  echo "   Verifying token ..."
  TEAM_RESPONSE=$(curl -s -H "Authorization: $CLICKUP_TOKEN" "https://api.clickup.com/api/v2/team" 2>/dev/null || echo "{}")
  TEAM_ID=$(python3 -c "import sys,json; d=$TEAM_RESPONSE; teams=d.get('teams',[]); print(teams[0]['id'] if teams else '')" 2>/dev/null \
    || echo "")

  if [ -z "$TEAM_ID" ]; then
    echo "   ✗ Could not verify token. Check that it's correct and try again."
    echo "     Token starts with pk_ — get it from app.clickup.com/settings/apps"
    exit 1
  fi

  TEAM_NAME=$(python3 -c "import sys,json; d=$TEAM_RESPONSE; teams=d.get('teams',[]); print(teams[0].get('name','') if teams else '')" 2>/dev/null || echo "")
  echo "   ✓ Token valid — workspace: $TEAM_NAME ($TEAM_ID)"

  # Write to ~/.claude.json
  SERVER_PATH="$PICKLE_MCP_DIR/clickup/server.mjs"
  python3 - <<PYEOF
import json, os, sys

path = os.path.expanduser("~/.claude.json")
try:
    with open(path, "r") as f:
        config = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    config = {}

config.setdefault("mcpServers", {})["clickup"] = {
    "command": "node",
    "args": ["$SERVER_PATH"],
    "env": {
        "CLICKUP_API_KEY": "$CLICKUP_TOKEN",
        "CLICKUP_TEAM_ID": "$TEAM_ID"
    }
}

with open(path, "w") as f:
    json.dump(config, f, indent=2)

print("   ✓ ClickUp configured in ~/.claude.json")
PYEOF
  SKIP_TOKEN=0
fi

# ── Remove deprecated tools ──────────────────────────────────────
for deprecated in pickle-setup pickle-me pickle-report; do
  [ -d "$SKILLS_DIR/$deprecated" ] && rm -rf "$SKILLS_DIR/$deprecated"
done

# ── Write version ────────────────────────────────────────────────
mkdir -p "$PICKLE_MCP_DIR"
echo "$LATEST_TAG" > "$PICKLE_MCP_DIR/.pickle_version"

# ── Done ─────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅  Pickle installed — $LATEST_TAG"
echo "════════════════════════════════════════════════════"
echo ""
if [ "${SKIP_TOKEN:-0}" -eq 0 ]; then
  echo "One last step:"
  echo ""
  echo "   Fully quit Claude Code (Cmd+Q — not just close the window)"
  echo "   Reopen it"
  echo "   Type: /pickle-clickup 24h"
  echo ""
  echo "That's it. You're live."
else
  echo "ClickUp token not configured yet."
  echo "Get it from app.clickup.com/settings/apps and re-run this script."
fi
echo ""
echo "Your commands:"
echo "   /pickle-clickup    — scan your ClickUp inbox"
echo "   /pickle-slack      — scan your Slack inbox"
echo "   /pickle-update     — update Pickle"
echo ""
echo "Docs: https://github.com/adityaarsharma/pickle"
echo ""
