# Knowledge And Assets

Axios-specific knowledge and generated media need predictable homes.

## Brand Knowledge

The raw Axios brand guide should stay out of public git history. The committed repo includes:

- `knowledge/axios-brand-profile.example.json`
- `scripts/import-axios-brand-guidelines.py`

The local private profile lives at:

```text
private/knowledge/axios-brand-profile.json
```

Generate it from an approved PDF:

```bash
python3 scripts/import-axios-brand-guidelines.py /path/to/Axios_Brand_Guidelines.pdf
```

Brand-aware MCP tools should first call `axios_get_brand_knowledge_status`, then `axios_read_brand_profile` when the profile exists.

## Skill Growth

Starter skills live in `src/axios/editorSkills.ts` and are documented in `docs/AXIOS_EDITOR_SKILLS.md`.

When editors keep asking for the same workflow, use `axios_plan_custom_editor_skill`. It returns:

- a proposed skill id and category
- trigger phrases from real editor asks
- evidence to review
- expected outputs
- implementation and test paths
- a promotion checklist

Keep raw request logs in `private/skill-requests/` until a pattern is ready to promote into the committed skill catalog.

## Generated Assets

Use `axios_plan_asset_storage` before creating frames, title graphics, fact-check cards, generated images, exports, or analysis JSON.

The standard local output root is:

```text
workspace/projects/<project-slug>/
```

This keeps source media, generated graphics, exports, cache files, and analysis artifacts from spreading across the repo root.

## Thumbnail Packages

When generating a thumbnail, make the finished thumbnail first. The final PNG should be a complete usable image that includes the requested subject/design and can stand on its own.

After the finished image exists, create an editable workspace package so editors can revise it later. Editability is an addition to the completed thumbnail, not a replacement for it.

At minimum, save:

- the final export PNG
- the source frame or reference image used for the subject
- separate transparent PNG components when practical, such as the visible subject image/cutout, background, headline text, banners, icons, and overlays
- a short manifest or README that lists the files and the intended edit order

Use a local workspace path such as:

```text
workspace/projects/<project-slug>/thumbnail/
```

Flattened PNGs are useful for upload and review, but the workspace package is the source of truth for future edits.
