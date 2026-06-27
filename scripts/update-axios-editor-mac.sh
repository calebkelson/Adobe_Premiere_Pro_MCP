#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/axios-editor-common.sh
source "$SCRIPT_DIR/axios-editor-common.sh"

usage() {
  cat <<'EOF'
Usage: scripts/update-axios-editor-mac.sh [--yes] [--skip-git] [--skip-codex]

Updates an existing Axios Premiere MCP checkout, rebuilds the server, reinstalls
the Premiere CEP bridge, and refreshes the Codex MCP registration.

Options:
  --yes         Do not prompt before enabling Adobe CEP debug mode if needed.
  --skip-git    Do not run git pull. Rebuild and reinstall the current checkout.
  --skip-codex  Reinstall/build the bridge but do not update Codex MCP registration.
EOF
}

SKIP_GIT=0
SKIP_CODEX=0

for arg in "$@"; do
  case "$arg" in
    --yes|-y)
      export AXIOS_PREMIERE_MCP_ASSUME_YES=1
      ;;
    --skip-git)
      SKIP_GIT=1
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
cd "$ROOT"

if [[ "$SKIP_GIT" == "0" ]]; then
  command -v git >/dev/null 2>&1 || die "git is required for updates."

  if [[ -n "$(git status --porcelain)" ]]; then
    die "This checkout has uncommitted changes. Commit/stash them or rerun with --skip-git."
  fi

  current_branch="$(git branch --show-current)"
  [[ -n "$current_branch" ]] || die "Cannot update while in detached HEAD state."

  info "Fetching latest changes from origin..."
  git fetch origin "$current_branch"
  info "Fast-forwarding $current_branch..."
  git merge --ff-only "origin/$current_branch"
fi

require_node_and_npm
install_dependencies "$ROOT"
build_server "$ROOT"
enable_cep_debug_mode
install_cep_extension "$ROOT"
prepare_bridge_temp_dir

if [[ "$SKIP_CODEX" == "0" ]]; then
  configure_codex_mcp "$ROOT"
fi

cat <<EOF

Axios Premiere MCP is updated.

Recommended next steps:
1. Restart Codex so it reloads the MCP server.
2. In Premiere, right-click the MCP Bridge (CEP) panel and Reload if it is already open.
3. Click Test Connection.

EOF
