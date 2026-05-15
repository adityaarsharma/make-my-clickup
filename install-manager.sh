#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  🥒  Pickle — Manager Install
#  Installs: pickle-clickup · pickle-slack · pickle-teams · pickle-update
#
#  Usage (paste into Claude Code terminal):
#    curl -fsSL https://raw.githubusercontent.com/adityaarsharma/pickle/main/install-manager.sh | bash
# ══════════════════════════════════════════════════════════════
set -e

SKILLS_DIR="$HOME/.claude/skills"
PICKLE_MCP_DIR="$HOME/.claude/pickle-mcp"
REPO_URL="https://github.com/adityaarsharma/pickle.git"

echo ""
echo "════════════════════════════════════════════════════"
echo "  🥒  Pickle — Manager Install"
echo "════════════════════════════════════════════════════"
echo ""
echo "Installing:"
echo "   /pickle-clickup   — your ClickUp inbox scanner"
echo "   /pickle-slack     — your Slack inbox scanner"
echo "   /pickle-teams     — your Microsoft Teams inbox scanner"
echo "   /pickle-update    — one-command updater"
echo ""
echo "ClickUp, Slack, and Teams are independent — connect any or all."
echo "Takes about 2–3 minutes."
echo ""

# ── Clone latest ────────────────────────────────────────────────
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo "⏳ [1/3] Fetching latest from GitHub ..."

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

# ── Install skills ──────────────────────────────────────────────
echo ""
echo "⏳ [2/3] Installing skill files ..."
mkdir -p "$SKILLS_DIR"

for skill in pickle-clickup pickle-slack pickle-teams pickle-update pickle-setup; do
  if [ -d "$TMPDIR/$skill" ]; then
    rm -rf "$SKILLS_DIR/$skill"
    cp -R "$TMPDIR/$skill" "$SKILLS_DIR/$skill"
    # Display the skill's command name from frontmatter
    CMD=$(grep "^name:" "$SKILLS_DIR/$skill/SKILL.md" 2>/dev/null | head -1 | sed 's/name: *//' || echo "$skill")
    echo "   ✓ /$CMD"
  fi
done

# ── Install ClickUp MCP (optional path) ─────────────────────────
echo ""
echo "⏳ [3/3] Setting up ClickUp MCP (personal token path) ..."
if command -v node >/dev/null 2>&1; then
  mkdir -p "$PICKLE_MCP_DIR/clickup"
  if [ -f "$TMPDIR/pickle-mcp/clickup/server.mjs" ]; then
    cp "$TMPDIR/pickle-mcp/clickup/server.mjs" "$PICKLE_MCP_DIR/clickup/server.mjs"
    [ -f "$TMPDIR/pickle-mcp/clickup/package.json" ] && cp "$TMPDIR/pickle-mcp/clickup/package.json" "$PICKLE_MCP_DIR/clickup/package.json"
    (cd "$PICKLE_MCP_DIR/clickup" && npm install --silent 2>/dev/null)
    echo "   ✓ ClickUp MCP server ready (personal token path)"
  fi
  # Copy update.sh
  [ -f "$TMPDIR/update.sh" ] && cp "$TMPDIR/update.sh" "$PICKLE_MCP_DIR/update.sh" && chmod +x "$PICKLE_MCP_DIR/update.sh"
else
  echo "   ⚠️  Node.js not found — install Node.js LTS from nodejs.org then re-run"
  echo "     (Pickle's ClickUp MCP requires Node.js)"
fi

# ── Remove deprecated tools ─────────────────────────────────────
for deprecated in pickle-setup pickle-me pickle-report; do
  [ -d "$SKILLS_DIR/$deprecated" ] && rm -rf "$SKILLS_DIR/$deprecated" && echo "   ✓ Removed deprecated: $deprecated"
done

# ── Write version ───────────────────────────────────────────────
mkdir -p "$PICKLE_MCP_DIR"
echo "$LATEST_TAG" > "$PICKLE_MCP_DIR/.pickle_version"

# ── Done ────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅  Pickle Manager installed — $LATEST_TAG"
echo "════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "  1. Connect ClickUp:"
echo "     Token setup is handled by /pickle-setup manager (guided, ~30 sec)"
echo "     If Node.js was missing above: install from nodejs.org, re-run this script first"
echo ""
echo "  2. Connect Teams (optional):"
echo "     Run /pickle-teams — guides you through the Microsoft Graph token setup"
echo "     Token saved locally to ~/.claude/pickle/teams-config.json"
echo ""
echo "  3. Connect Slack (optional):"
echo "     Personal token: handled by /pickle-setup manager (guided)"
echo ""
echo "  4. Fully quit Claude Code (Cmd+Q) and reopen"
echo ""
echo "  5. Run: /pickle-clickup 24h"
echo ""
echo "Your commands:"
echo "   /pickle-clickup   — ClickUp inbox"
echo "   /pickle-slack     — Slack inbox"
echo "   /pickle-teams     — Microsoft Teams inbox"
echo "   /pickle-update    — update Pickle"
echo ""
echo "Docs: https://github.com/adityaarsharma/pickle"
echo ""
