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

## Distribution Principles

- Preserve upstream attribution and license.
- Keep upstream as a remote named `upstream`.
- Keep Axios-specific changes in clearly named modules and docs.
- Prefer one-command editor setup scripts over manual config.
- Treat generated media as scratch output unless it is an intentional template asset.

## Editor Setup Target

The editor-facing path should eventually be:

1. Install Node if needed.
2. Run one setup script.
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
