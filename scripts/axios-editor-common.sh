#!/usr/bin/env bash

set -euo pipefail

MCP_NAME="${AXIOS_PREMIERE_MCP_NAME:-premiere_pro}"
TEMP_DIR="${AXIOS_PREMIERE_TEMP_DIR:-/tmp/premiere-mcp-bridge}"
CEP_BUNDLE_NAME="${AXIOS_PREMIERE_CEP_BUNDLE_NAME:-MCPBridgeCEP}"

info() {
  printf '[axios-premiere-mcp] %s\n' "$1"
}

warn() {
  printf '[axios-premiere-mcp] warning: %s\n' "$1" >&2
}

die() {
  printf '[axios-premiere-mcp] error: %s\n' "$1" >&2
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
  command -v node >/dev/null 2>&1 || die "Node.js 18+ is required. Install Node, then rerun this script."
  command -v npm >/dev/null 2>&1 || die "npm is required. Install Node/npm, then rerun this script."

  local node_major
  node_major="$(node -p "process.versions.node.split('.')[0]")"
  [[ "$node_major" -ge 18 ]] || die "Node.js 18+ is required. Found: $(node -v)"
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
  node_bin="$(command -v node)"

  if ! command -v codex >/dev/null 2>&1; then
    warn "Codex CLI was not found on PATH. Skipping Codex MCP registration."
    warn "Editors can add it later with: codex mcp add $MCP_NAME --env PREMIERE_TEMP_DIR=$TEMP_DIR -- node \"$root/dist/index.js\""
    return 0
  fi

  info "Registering Codex MCP server '$MCP_NAME'..."
  codex mcp remove "$MCP_NAME" >/dev/null 2>&1 || true
  codex mcp add "$MCP_NAME" --env "PREMIERE_TEMP_DIR=$TEMP_DIR" -- "$node_bin" "$root/dist/index.js"
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

EOF
}
