# Axios Premiere MCP Agent Rules

These rules apply to Codex and other coding agents working in this repository.

## Generated Media

- Store generated video assets under `workspace/projects/<project-slug>/` using the MCP `axios_plan_asset_storage` tool when available.
- Keep local generated assets out of git unless they are intentionally promoted into a reusable template or approved sample.
- For thumbnails, always create a complete finished thumbnail image first. The final PNG should stand on its own and include the actual requested subject/design, not merely placeholder components or an isolated editable layer.
- Also create an editable workspace package. Include the final PNG plus editable components such as the source frame, subject image/cutout, background, text overlays, icons, effects, and a short manifest when practical.
- Put thumbnail packages under `workspace/projects/<project-slug>/thumbnail/` or a similarly clear local workspace path.
- If a thumbnail is requested for Premiere editing, favor transparent PNG layers that can be stacked in Premiere, Photoshop, Canva, or another editor.

## Private Axios Knowledge

- Do not commit raw Axios brand PDFs or private brand profiles while the repository is public.
- Keep private source materials under ignored paths such as `private/`.
- Use committed examples for schema and local private files for proprietary content.
