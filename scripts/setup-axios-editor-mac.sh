#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/axios-editor-common.sh
source "$SCRIPT_DIR/axios-editor-common.sh"

usage() {
  cat <<'EOF'
Usage: scripts/setup-axios-editor-mac.sh [--yes] [--skip-codex]

First-time Axios editor setup for the Premiere Pro MCP bridge.

Options:
  --yes         Do not prompt before enabling Adobe CEP debug mode.
  --skip-codex  Install/build the bridge but do not register the Codex MCP server.
EOF
}

SKIP_CODEX=0

for arg in "$@"; do
  case "$arg" in
    --yes|-y)
      export AXIOS_PREMIERE_MCP_ASSUME_YES=1
      ;;
    --skip-codex)
      SKIP_CODEX=1
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      usage >&2
      exit 1
      ;;
  esac
done

require_macos
ROOT="$(repo_root)"

require_node_and_npm
ensure_media_binaries
ensure_python_media_tools "$ROOT"
install_dependencies "$ROOT"
build_server "$ROOT"
enable_cep_debug_mode
install_cep_extension "$ROOT"
prepare_bridge_temp_dir

if [[ "$SKIP_CODEX" == "0" ]]; then
  configure_codex_mcp "$ROOT"
fi

print_next_steps
