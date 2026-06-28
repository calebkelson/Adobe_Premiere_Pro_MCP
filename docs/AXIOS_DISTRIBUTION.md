# Axios Premiere MCP Distribution

This fork is intended to become an Axios-focused Premiere Pro MCP distribution for editors.

The upstream project provides the core bridge:

- A local MCP server that Codex and other MCP clients can run.
- A Premiere Pro CEP panel that watches a temp directory for commands.
- ExtendScript tooling that executes inside Premiere Pro.

This fork should keep those core pieces, then add Axios-specific editing workflows on top.

## Product Goals

- Give Axios editors repeatable AI-assisted Premiere workflows without requiring them to understand MCP internals.
- Package common Axios edit patterns as explicit tools with safe defaults.
- Keep project changes inspectable and reversible inside Premiere.
- Make setup, update, and diagnostics simple enough for a non-engineer editor.

## Initial Axios Workflows

- Import YouTube transcript subtitles and create a caption track.
- Generate and place Axios-style fact-check cards for a selected time range.
- Generate Axios-style show/title overlays.
- Build repeatable title animations, including slam-in and lower-third variants.
- Export sequences using Axios platform presets.

See `docs/AXIOS_EDITOR_SKILLS.md` for the initial Axios editor assistant catalog.

## Distribution Principles

- Preserve upstream attribution and license.
- Keep upstream as a remote named `upstream`.
- Keep Axios-specific changes in clearly named modules and docs.
- Prefer one-command editor setup scripts over manual config.
- Treat generated media as scratch output unless it is an intentional template asset.

## Editor Setup Target

The first editor-facing path is now:

1. Install Node if needed.
2. Clone this repository.
3. Run `npm run setup:axios:mac -- --yes`.
4. Open Premiere Pro.
5. Open `Window > Extensions > MCP Bridge (CEP)`.
6. Confirm the temp directory is `/tmp/premiere-mcp-bridge`.
7. Click `Save Configuration`, `Start Bridge`, then `Test Connection`.
8. Restart Codex so it reloads the `premiere_pro` MCP server.

The first setup script:

- Installs Node dependencies.
- Builds the MCP server.
- Installs the Premiere CEP panel.
- Enables Adobe CEP debug mode after warning the editor.
- Creates the bridge temp directory.
- Registers the Codex MCP server when the Codex CLI is available.

## Editor Update Target

The update path is:

1. Open Terminal in this repository.
2. Run `npm run update:axios:mac -- --yes`.
3. Restart Codex.
4. Reload the Premiere CEP panel if it is already open.
5. Click `Test Connection`.

The update script:

- Refuses to pull over uncommitted local edits.
- Fast-forwards the current branch from `origin`.
- Reinstalls dependencies.
- Rebuilds the MCP server.
- Reinstalls the CEP panel.
- Refreshes the Codex MCP registration.

## Longer-Term Setup Target

The future polished path should become:

1. Install Node if needed.
2. Run one package command, such as `npx axios-premiere-mcp setup`.
3. Open Premiere Pro.
4. Open `Window > Extensions > MCP Bridge (CEP)`.
5. Click `Start Bridge`.
6. Use Codex with the `premiere_pro` MCP server.

## Near-Term Backlog

- Fix the current `import_folder` bin import bug.
- Add a supported `axios_add_show_title` tool.
- Add a supported `axios_add_fact_check_cards` tool.
- Add a supported `axios_import_youtube_subtitles` tool.
- Add a dedicated Axios quickstart.
- Add a smoke test that validates bridge connection against a scratch Premiere project.
