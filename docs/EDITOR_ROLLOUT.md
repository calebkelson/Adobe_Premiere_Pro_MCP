# Editor Rollout Plan

This is the working rollout plan for making the Axios Premiere MCP usable by editors.

## Phase 1: Internal Prototype

- Keep the MCP server running locally through Codex.
- Use the existing CEP bridge panel.
- Validate core operations on scratch Premiere projects.
- Document every manual step that causes friction.

## Phase 2: Reusable Axios Tools

Package repeated workflows into first-class MCP tools:

- Subtitles from transcript or YouTube ID.
- Axios title animations.
- Fact-check cards from transcript ranges.
- Timeline markers for editorial review.
- Export queue helpers.

Each tool should return a clear summary of what it changed in the project.

## Phase 3: Editor Install

Use the editor-facing setup script:

```bash
npm run setup:axios:mac -- --yes
```

The script:

- Installs dependencies.
- Builds the MCP server.
- Installs the CEP panel.
- Creates the bridge temp directory.
- Registers the Codex MCP server when Codex is available.
- Prints exact next steps for Premiere and Codex.

The script should avoid requiring editors to edit JSON by hand.

## Phase 3.5: Editor Updates

Use the editor-facing update script:

```bash
npm run update:axios:mac -- --yes
```

The script fast-forwards the current branch, rebuilds the server, reinstalls the CEP panel, and refreshes the Codex MCP registration.

## Phase 4: Support and Safety

- Add diagnostics collection.
- Add a scratch-project test command.
- Add rollback guidance.
- Add versioned releases.
- Keep generated media out of Git by default.

## Open Questions

- Should the repo live under a personal account first or an Axios GitHub organization?
- Which export presets are official for Axios editors?
- Should generated fact-check cards be still overlays, MOGRTs, or rendered transparent MOVs?
- What approval workflow should fact-check cards follow before final export?
