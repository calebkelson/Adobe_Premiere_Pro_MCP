#!/usr/bin/env bash

set -euo pipefail

MCP_NAME="${AXIOS_PREMIERE_MCP_NAME:-axios-premeire-mcp}"
N8N_MCP_NAME="${AXIOS_PREMIERE_N8N_MCP_NAME:-axios-premier-mcp}"
N8N_MCP_URL="${AXIOS_PREMIERE_N8N_MCP_URL:-https://n8n.automail-ai.com/mcp/axios-premier-mcp}"
TEMP_DIR="${AXIOS_PREMIERE_TEMP_DIR:-/tmp/premiere-mcp-bridge}"
CEP_BUNDLE_NAME="${AXIOS_PREMIERE_CEP_BUNDLE_NAME:-MCPBridgeCEP}"
MEDIA_REQUIREMENTS_FILE="${AXIOS_PREMIERE_MEDIA_REQUIREMENTS_FILE:-requirements-media.txt}"

info() {
  printf '[axios-premeire-mcp] %s\n' "$1"
}

warn() {
  printf '[axios-premeire-mcp] warning: %s\n' "$1" >&2
}

die() {
  printf '[axios-premeire-mcp] error: %s\n' "$1" >&2
  exit 1
}

confirm_or_exit() {
  local prompt="$1"

  if [[ "${AXIOS_PREMIERE_MCP_ASSUME_YES:-0}" == "1" ]]; then
    return 0
  fi

  read -r -p "$prompt [y/N] " answer
  case "$answer" in
    y|Y|yes|YES)
      ;;
    *)
      die "Canceled."
      ;;
  esac
}

repo_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$script_dir/.." && pwd
}

require_macos() {
  [[ "$(uname -s)" == "Darwin" ]] || die "This script currently supports macOS only."
}

require_node_and_npm() {
  local node_bin
  local npm_bin
  node_bin="$(find_executable node 2>/dev/null)" || die "Node.js 18+ is required. Install Node, then rerun this script."
  npm_bin="$(find_executable npm 2>/dev/null)" || die "npm is required. Install Node/npm, then rerun this script."

  export PATH="$(dirname "$node_bin"):$(dirname "$npm_bin"):$PATH"

  local node_major
  node_major="$("$node_bin" -p "process.versions.node.split('.')[0]")"
  [[ "$node_major" -ge 18 ]] || die "Node.js 18+ is required. Found: $("$node_bin" -v)"
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

find_homebrew() {
  find_executable brew
}

ensure_media_binaries() {
  local ffmpeg_bin
  local ffprobe_bin

  if ffmpeg_bin="$(find_executable ffmpeg 2>/dev/null)"; then
    info "ffmpeg available at $ffmpeg_bin"
  else
    local brew_bin
    if ! brew_bin="$(find_homebrew 2>/dev/null)"; then
      die "ffmpeg is required for transcript, subtitle, audio-analysis, and proxy workflows. Install Homebrew, then run: brew install ffmpeg"
    fi

    warn "ffmpeg is required for transcript, subtitle, audio-analysis, and proxy workflows, but it was not found."
    confirm_or_exit "Install ffmpeg with Homebrew now?"
    "$brew_bin" install ffmpeg

    ffmpeg_bin="$(find_executable ffmpeg 2>/dev/null)" || die "Homebrew finished, but ffmpeg was still not found."
    info "ffmpeg installed at $ffmpeg_bin"
  fi

  ffprobe_bin="$(find_executable ffprobe 2>/dev/null)" || die "ffprobe is required and should be installed with ffmpeg, but it was not found."
  info "ffprobe available at $ffprobe_bin"
}

ensure_python_media_tools() {
  local root="$1"
  local requirements_path="$root/$MEDIA_REQUIREMENTS_FILE"

  command -v python3 >/dev/null 2>&1 || die "Python 3 is required for auto-editor, OpenTimelineIO, and media helpers."
  python3 -m pip --version >/dev/null 2>&1 || die "pip for Python 3 is required. Install pip, then rerun this script."

  [[ -f "$requirements_path" ]] || die "Media requirements file missing at $requirements_path"

  info "Installing Python media dependencies from $MEDIA_REQUIREMENTS_FILE..."
  python3 -m pip install --user -r "$requirements_path"

  local auto_editor_bin
  if auto_editor_bin="$(find_executable auto-editor 2>/dev/null)"; then
    "$auto_editor_bin" --version >/dev/null
  else
    warn "auto-editor was installed but is not on PATH. Add your Python user bin directory to PATH if direct CLI calls fail."
  fi

  python3 - <<'PY' || die "One or more Python media dependencies could not be imported."
import auto_editor  # noqa: F401
import opentimelineio  # noqa: F401
import pdfplumber  # noqa: F401
PY
}

install_dependencies() {
  local root="$1"
  info "Installing Node dependencies..."
  npm install --prefix "$root"
}

build_server() {
  local root="$1"
  info "Building MCP server..."
  npm run build --prefix "$root"

  [[ -f "$root/dist/index.js" ]] || die "Build completed but dist/index.js was not created."
}

enable_cep_debug_mode() {
  info "Enabling Adobe CEP debug mode for unsigned local extensions."
  warn "This is required for the local Premiere bridge panel. It allows local unsigned CEP extensions to load."
  confirm_or_exit "Allow this script to persistently enable Adobe CEP debug mode?"

  for csxs_version in 10 11 12 13 14; do
    defaults write "com.adobe.CSXS.$csxs_version" PlayerDebugMode 1
  done
}

install_cep_extension() {
  local root="$1"
  local cep_extensions_dir="$HOME/Library/Application Support/Adobe/CEP/extensions"
  local cep_target_dir="$cep_extensions_dir/$CEP_BUNDLE_NAME"

  info "Installing Premiere CEP bridge panel..."
  mkdir -p "$cep_extensions_dir"
  rm -rf "$cep_target_dir"
  cp -R "$root/cep-plugin" "$cep_target_dir"
}

prepare_bridge_temp_dir() {
  info "Preparing bridge temp directory at $TEMP_DIR..."
  mkdir -p "$TEMP_DIR"
  chmod 700 "$TEMP_DIR"
}

configure_codex_mcp() {
  local root="$1"
  local node_bin
  node_bin="$(find_executable node 2>/dev/null)" || die "Node.js is required to register the Codex MCP server."

  if ! command -v codex >/dev/null 2>&1; then
    warn "Codex CLI was not found on PATH. Skipping Codex MCP registration."
    warn "Editors can add it later with: codex mcp add $MCP_NAME --env PREMIERE_TEMP_DIR=$TEMP_DIR -- node \"$root/dist/index.js\""
    return 0
  fi

  info "Registering Codex MCP server '$MCP_NAME'..."
  codex mcp remove "$MCP_NAME" >/dev/null 2>&1 || true
  codex mcp add "$MCP_NAME" --env "PREMIERE_TEMP_DIR=$TEMP_DIR" -- "$node_bin" "$root/dist/index.js"

  info "Registering Codex remote n8n MCP server '$N8N_MCP_NAME'..."
  codex mcp remove "$N8N_MCP_NAME" >/dev/null 2>&1 || true
  if ! codex mcp add "$N8N_MCP_NAME" --url "$N8N_MCP_URL"; then
    warn "Codex CLI could not register the remote n8n MCP automatically."
    warn "Editors can add it manually to Codex config as: [mcp_servers.$N8N_MCP_NAME] url = \"$N8N_MCP_URL\""
  fi
}

print_next_steps() {
  cat <<EOF

Axios Premiere MCP is installed.

Next steps for the editor:
1. Restart Codex if it was open.
2. Restart Premiere Pro if it was open.
3. Open a Premiere project.
4. Go to Window > Extensions > MCP Bridge (CEP).
5. Confirm the temp directory is $TEMP_DIR.
6. Click Save Configuration, Start Bridge, then Test Connection.
7. Confirm Codex also loaded the remote n8n MCP server '$N8N_MCP_NAME'.

EOF
}
