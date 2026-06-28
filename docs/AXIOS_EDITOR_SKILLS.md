# Axios Editor Skills

This is the first Axios-specific editor assistant catalog for the Premiere Pro MCP.

These skills start as structured review/planning tools. They can list the available Axios assistant roles and generate a scoped review prompt/checklist for the current edit. Individual skills can later graduate into deeper automation, such as adding markers, creating graphics, trimming, or exporting deliverables.

## MCP Tools

- `axios_list_editor_skills`: lists the Axios editor assistant catalog.
- `axios_plan_editor_skill_review`: creates a structured review plan for one assistant role.
- `axios_plan_custom_editor_skill`: drafts a new skill from repeated editor asks.
- `axios_get_brand_knowledge_status`: checks whether private Axios brand knowledge is installed locally.
- `axios_read_brand_profile`: reads the local private brand profile when available.
- `axios_plan_asset_storage`: suggests organized paths for generated frames, graphics, thumbnails, exports, and analysis.

## Skill Catalog

| Skill | Purpose |
| --- | --- |
| Story Analyst | Reviews openings, repetition, pacing, and story structure. |
| Smart Brevity Coach | Suggests cuts and rewrites for shorter, clearer Axios-style storytelling. |
| B-Roll Director | Recommends B-roll, screenshots, archival footage, and visual coverage. |
| Graphics Assistant | Finds stats, names, quotes, and moments that need lower thirds, charts, or graphics. |
| Social Producer | Finds strong long-edit moments and recommends platform-specific clips. |
| QC Editor | Checks silences, peaks, captions, spelling, abrupt cuts, and export readiness. |
| Fact Check Assistant | Flags factual claims, statistics, dates, names, and quotes for verification. |
| Timeline Analyst | Summarizes timeline metrics such as talking-head time, B-roll, pacing, filler, and scene lengths. |
| Marker Generator | Plans color-coded markers for quotes, edits, B-roll, graphics, and issues. |
| Continuity Checker | Finds inconsistent terminology, repeated concepts, missing explanations, and narrative gaps. |
| Version Comparison | Compares two edits and summarizes cuts, moves, graphics, and audio changes. |
| Ask the Timeline | Answers natural-language questions about the current project and timeline. |
| Highlight Finder | Scores segments for hooks, quotes, reactions, and memorable moments. |
| Interview Cleaner | Finds filler, pauses, repeats, tangents, and rambling while preserving natural flow. |
| Export Optimizer | Recommends export settings, aspect ratios, captions, and deliverables by platform. |
| Thumbnail & Title Assistant | Suggests titles, thumbnail text, key frame candidates, and editable thumbnail asset packages. |
| Music & Pacing Advisor | Recommends music starts, stops, builds, fades, and ducking moments. |
| Brand Compliance Checker | Checks fonts, colors, lower thirds, logos, captions, and visual standards. |

## Private Brand Knowledge

The raw Axios brand guidelines PDF should not be committed while this repository is public. The safer path is:

1. Make the GitHub repo private or move it under an Axios GitHub organization with team access.
2. Store raw brand source files only in approved private locations.
3. Distill approved rules into a machine-readable brand profile used by `Graphics Assistant`, `Export Optimizer`, `Thumbnail & Title Assistant`, and `Brand Compliance Checker`.

The `.gitignore` includes local private brand paths so proprietary PDFs can sit near the project during development without being accidentally staged.

## Skill Growth

When editors repeatedly ask for the same workflow, use `axios_plan_custom_editor_skill` before adding it to this catalog. Keep the first pass review-only, collect real examples, add tests, then promote it into `src/axios/editorSkills.ts` after the output shape is stable.

## Generated Asset Storage

Generated frames, title graphics, thumbnail packages, fact-check cards, social exports, and analysis JSON should go under `workspace/projects/<project-slug>/`. Use `axios_plan_asset_storage` to keep file paths predictable.

Thumbnail work should always include an editable package, not just a flattened PNG. Save the final PNG plus source/reference frames and separate transparent components when practical.
