#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This doctor command currently supports macOS only."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_ENTRY="$REPO_ROOT/dist/index.js"
CEP_TARGET_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/MCPBridgeCEP"
CLAUDE_CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
TEMP_DIR="/tmp/premiere-mcp-bridge"
FAILURES=0

pass() {
  echo "[ok] $1"
}

fail() {
  echo "[missing] $1"
  FAILURES=$((FAILURES + 1))
}

info() {
  echo "[info] $1"
}

find_executable() {
  local name="$1"

  if command -v "$name" >/dev/null 2>&1; then
    command -v "$name"
    return 0
  fi

  for candidate in "/opt/homebrew/bin/$name" "/usr/local/bin/$name"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  for candidate in "$HOME"/Library/Python/*/bin/"$name"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

if NODE_BIN="$(find_executable node 2>/dev/null)"; then
  NODE_VERSION="$("$NODE_BIN" -v)"
  NODE_MAJOR="$("$NODE_BIN" -p "process.versions.node.split('.')[0]")"
  if [[ "$NODE_MAJOR" -ge 18 ]]; then
    pass "Node.js available at $NODE_BIN ($NODE_VERSION)"
  else
    fail "Node.js 18+ required (found $NODE_VERSION)"
  fi
else
  fail "Node.js not found in PATH"
fi

if NPM_BIN="$(find_executable npm 2>/dev/null)"; then
  pass "npm available at $NPM_BIN"
else
  fail "npm not found in PATH"
fi

if FFMPEG_BIN="$(find_executable ffmpeg 2>/dev/null)"; then
  FFMPEG_VERSION="$("$FFMPEG_BIN" -version | sed -n '1p')"
  pass "ffmpeg available at $FFMPEG_BIN ($FFMPEG_VERSION)"
else
  fail "ffmpeg not found. Install it with: brew install ffmpeg"
fi

if FFPROBE_BIN="$(find_executable ffprobe 2>/dev/null)"; then
  FFPROBE_VERSION="$("$FFPROBE_BIN" -version | sed -n '1p')"
  pass "ffprobe available at $FFPROBE_BIN ($FFPROBE_VERSION)"
else
  fail "ffprobe not found. It should be installed with ffmpeg."
fi

if command -v python3 >/dev/null 2>&1; then
  PYTHON_VERSION="$(python3 --version)"
  pass "Python 3 available ($PYTHON_VERSION)"
else
  fail "Python 3 not found in PATH"
fi

if python3 -m pip --version >/dev/null 2>&1; then
  pass "Python pip available ($(python3 -m pip --version))"
else
  fail "Python pip not found. Install pip for python3."
fi

if AUTO_EDITOR_BIN="$(find_executable auto-editor 2>/dev/null)"; then
  if AUTO_EDITOR_VERSION="$("$AUTO_EDITOR_BIN" --version 2>&1)"; then
    pass "auto-editor CLI available at $AUTO_EDITOR_BIN ($AUTO_EDITOR_VERSION)"
  else
    fail "auto-editor CLI exists at $AUTO_EDITOR_BIN but failed to run: $AUTO_EDITOR_VERSION"
  fi
else
  fail "auto-editor CLI not found. Install with: python3 -m pip install --user -r requirements-media.txt"
fi

if OTIOCONVERT_BIN="$(find_executable otioconvert 2>/dev/null)"; then
  pass "OpenTimelineIO CLI available at $OTIOCONVERT_BIN"
else
  fail "OpenTimelineIO CLI not found. Install with: python3 -m pip install --user -r requirements-media.txt"
fi

PYTHON_MEDIA_CHECK="$(
  python3 - <<'PY' 2>&1 || true
missing = []
for module_name in ("auto_editor", "opentimelineio", "pdfplumber"):
    try:
        __import__(module_name)
    except Exception as error:
        missing.append(f"{module_name}: {error}")
if missing:
    print("; ".join(missing))
else:
    print("ok")
PY
)"

if [[ "$PYTHON_MEDIA_CHECK" == "ok" ]]; then
  pass "Python media dependencies import successfully"
else
  fail "Python media dependencies missing ($PYTHON_MEDIA_CHECK). Install with: python3 -m pip install --user -r requirements-media.txt"
fi

if [[ -f "$DIST_ENTRY" ]]; then
  pass "Built MCP server found at $DIST_ENTRY"
else
  fail "Build output missing at $DIST_ENTRY (run npm run build)"
fi

if [[ -d "$CEP_TARGET_DIR" ]]; then
  if [[ -f "$CEP_TARGET_DIR/CSXS/manifest.xml" && -f "$CEP_TARGET_DIR/index.html" ]]; then
    pass "Premiere CEP extension installed at $CEP_TARGET_DIR"
  else
    fail "CEP extension folder exists but is incomplete at $CEP_TARGET_DIR"
  fi
else
  fail "Premiere CEP extension not installed at $CEP_TARGET_DIR"
fi

if [[ -d "$TEMP_DIR" ]]; then
  pass "Bridge temp directory exists at $TEMP_DIR"
else
  fail "Bridge temp directory missing at $TEMP_DIR"
fi

for csxs_version in 12 11 10; do
  VALUE="$(defaults read "com.adobe.CSXS.$csxs_version" PlayerDebugMode 2>/dev/null || true)"
  if [[ "$VALUE" == "1" ]]; then
    pass "Adobe CEP debug mode enabled for CSXS.$csxs_version"
  else
    fail "Adobe CEP debug mode not enabled for CSXS.$csxs_version"
  fi
done

if [[ -f "$CLAUDE_CONFIG_PATH" ]]; then
  CONFIG_CHECK="$(
    CONFIG_PATH="$CLAUDE_CONFIG_PATH" DIST_PATH="$DIST_ENTRY" TEMP_PATH="$TEMP_DIR" "$NODE_BIN" -e '
const fs = require("fs");

const configPath = process.env.CONFIG_PATH;
const distPath = process.env.DIST_PATH;
const tempPath = process.env.TEMP_PATH;

try {
  const raw = fs.readFileSync(configPath, "utf8");
  const data = JSON.parse(raw);
  const server = data && data.mcpServers && data.mcpServers["axios-premeire-mcp"];

  if (!server) {
    console.log("missing-server");
    process.exit(0);
  }

  const arg0 = Array.isArray(server.args) ? server.args[0] : "";
  const temp = server.env && server.env.PREMIERE_TEMP_DIR;

  if (server.command !== "node") {
    console.log(`bad-command:${server.command || ""}`);
  } else if (arg0 !== distPath) {
    console.log(`bad-path:${arg0}`);
  } else if (temp !== tempPath) {
    console.log(`bad-temp:${temp || ""}`);
  } else {
    console.log("ok");
  }
} catch (error) {
  console.log(`invalid-json:${error.message}`);
}
'
  )"

  case "$CONFIG_CHECK" in
    ok)
      pass "Claude Desktop config contains a valid axios-premeire-mcp entry"
      ;;
    missing-server)
      fail "Claude Desktop config is present but missing the axios-premeire-mcp entry"
      ;;
    bad-command:*)
      fail "Claude Desktop config has an axios-premeire-mcp entry with the wrong command (${CONFIG_CHECK#bad-command:})"
      ;;
    bad-path:*)
      fail "Claude Desktop config points to the wrong dist path (${CONFIG_CHECK#bad-path:})"
      ;;
    bad-temp:*)
      fail "Claude Desktop config points to the wrong temp dir (${CONFIG_CHECK#bad-temp:})"
      ;;
    invalid-json:*)
      fail "Claude Desktop config is not valid JSON"
      ;;
    *)
      fail "Claude Desktop config check returned an unexpected result: $CONFIG_CHECK"
      ;;
  esac
else
  fail "Claude Desktop config not found at $CLAUDE_CONFIG_PATH"
fi

info "Premiere panel check must still be done manually inside Premiere Pro."
info "Open Window > Extensions > MCP Bridge (CEP), then click Test Connection."

if [[ "$FAILURES" -gt 0 ]]; then
  echo
  echo "Doctor found $FAILURES issue(s)."
  exit 1
fi

echo
echo "Doctor check passed."
