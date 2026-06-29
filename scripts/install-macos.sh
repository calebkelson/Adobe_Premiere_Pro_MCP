#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This installer currently supports macOS only."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CEP_EXTENSIONS_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
CEP_TARGET_DIR="$CEP_EXTENSIONS_DIR/MCPBridgeCEP"
CLAUDE_CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
TEMP_DIR="/tmp/premiere-mcp-bridge"
DIST_ENTRY="$REPO_ROOT/dist/index.js"
MEDIA_REQUIREMENTS_FILE="$REPO_ROOT/requirements-media.txt"

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

ensure_media_binaries() {
  if FFMPEG_BIN="$(find_executable ffmpeg 2>/dev/null)"; then
    echo "ffmpeg available at $FFMPEG_BIN"
  else
    if ! BREW_BIN="$(find_executable brew 2>/dev/null)"; then
      echo "ffmpeg is required for transcript, subtitle, audio-analysis, and proxy workflows."
      echo "Install Homebrew, then run: brew install ffmpeg"
      exit 1
    fi

    echo "Installing ffmpeg with Homebrew..."
    "$BREW_BIN" install ffmpeg

    FFMPEG_BIN="$(find_executable ffmpeg 2>/dev/null)" || {
      echo "Homebrew finished, but ffmpeg was still not found."
      exit 1
    }
    echo "ffmpeg installed at $FFMPEG_BIN"
  fi

  FFPROBE_BIN="$(find_executable ffprobe 2>/dev/null)" || {
    echo "ffprobe is required and should be installed with ffmpeg, but it was not found."
    exit 1
  }
  echo "ffprobe available at $FFPROBE_BIN"
}

ensure_python_media_tools() {
  if ! command -v python3 >/dev/null 2>&1; then
    echo "Python 3 is required for auto-editor, OpenTimelineIO, and media helpers."
    exit 1
  fi

  if ! python3 -m pip --version >/dev/null 2>&1; then
    echo "pip for Python 3 is required. Install pip, then rerun this script."
    exit 1
  fi

  if [[ ! -f "$MEDIA_REQUIREMENTS_FILE" ]]; then
    echo "Media requirements file missing at $MEDIA_REQUIREMENTS_FILE"
    exit 1
  fi

  echo "Installing Python media dependencies..."
  python3 -m pip install --user -r "$MEDIA_REQUIREMENTS_FILE"

  if ! python3 - <<'PY'; then
import auto_editor  # noqa: F401
import opentimelineio  # noqa: F401
import pdfplumber  # noqa: F401
PY
    echo "One or more Python media dependencies could not be imported."
    exit 1
  fi

  if ! find_executable auto-editor >/dev/null 2>&1; then
    echo "warning: auto-editor was installed but is not on PATH. Add your Python user bin directory to PATH if direct CLI calls fail."
  else
    AUTO_EDITOR_BIN="$(find_executable auto-editor)"
    "$AUTO_EDITOR_BIN" --version >/dev/null
  fi
}

if ! NODE_BIN="$(find_executable node 2>/dev/null)"; then
  echo "Node.js 18+ is required but 'node' was not found."
  exit 1
fi

if ! NPM_BIN="$(find_executable npm 2>/dev/null)"; then
  echo "npm is required but was not found."
  exit 1
fi

export PATH="$(dirname "$NODE_BIN"):$(dirname "$NPM_BIN"):$PATH"

NODE_MAJOR="$("$NODE_BIN" -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "Node.js 18+ is required. Found: $("$NODE_BIN" -v)"
  exit 1
fi

ensure_media_binaries
ensure_python_media_tools

echo "Installing npm dependencies..."
npm install --prefix "$REPO_ROOT"

echo "Building MCP server..."
npm run build --prefix "$REPO_ROOT"

if [[ ! -f "$DIST_ENTRY" ]]; then
  echo "Build completed but dist/index.js was not created."
  exit 1
fi

echo "Enabling Adobe CEP debug mode..."
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1

echo "Installing Premiere CEP extension..."
mkdir -p "$CEP_EXTENSIONS_DIR"
rm -rf "$CEP_TARGET_DIR"
cp -R "$REPO_ROOT/cep-plugin" "$CEP_TARGET_DIR"

echo "Preparing bridge temp directory..."
mkdir -p "$TEMP_DIR"

echo "Updating Claude Desktop config..."
mkdir -p "$(dirname "$CLAUDE_CONFIG_PATH")"
CONFIG_PATH="$CLAUDE_CONFIG_PATH" DIST_PATH="$DIST_ENTRY" TEMP_PATH="$TEMP_DIR" "$NODE_BIN" -e '
const fs = require("fs");

const configPath = process.env.CONFIG_PATH;
const distPath = process.env.DIST_PATH;
const tempPath = process.env.TEMP_PATH;

let data = {};

if (fs.existsSync(configPath)) {
  const raw = fs.readFileSync(configPath, "utf8").trim();
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.error(`Claude Desktop config is not valid JSON: ${configPath}`);
      process.exit(1);
    }
  }
}

if (!data || typeof data !== "object" || Array.isArray(data)) {
  data = {};
}

if (!data.mcpServers || typeof data.mcpServers !== "object" || Array.isArray(data.mcpServers)) {
  data.mcpServers = {};
}

data.mcpServers["axios-premeire-mcp"] = {
  command: "node",
  args: [distPath],
  env: {
    PREMIERE_TEMP_DIR: tempPath
  }
};

fs.writeFileSync(configPath, `${JSON.stringify(data, null, 2)}\n`);
'

echo
echo "Install complete."
echo "Next:"
echo "1. Restart Claude Desktop."
echo "2. Restart Premiere Pro."
echo "3. Open Window > Extensions > MCP Bridge (CEP)."
echo "4. Set Temp Directory to $TEMP_DIR."
echo "5. Click Save Configuration, then Start Bridge, then Test Connection."
