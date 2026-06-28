#!/usr/bin/env python3
"""Import an approved Axios brand guidelines PDF into a local private JSON profile."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_OUTPUT = Path("private/knowledge/axios-brand-profile.json")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", help="Path to the approved Axios brand guidelines PDF.")
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help=f"Output JSON path. Defaults to {DEFAULT_OUTPUT}.",
    )
    args = parser.parse_args()

    try:
        import pdfplumber  # type: ignore[import-not-found]
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: pdfplumber. Install it with `python3 -m pip install pdfplumber` "
            "or run from the Codex bundled Python environment."
        ) from exc

    pdf_path = Path(args.pdf).expanduser().resolve()
    output_path = Path(args.output).expanduser()
    if not pdf_path.exists():
        raise SystemExit(f"PDF not found: {pdf_path}")

    sections: list[dict[str, Any]] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            text = normalize_text(page.extract_text() or "")
            if not text:
                continue
            heading = first_heading(text, page_index)
            sections.append(
                {
                    "page": page_index,
                    "heading": heading,
                    "text": text,
                    "wordCount": len(text.split()),
                }
            )
        page_count = len(pdf.pages)

    profile = {
        "profileVersion": "axios-brand-guidelines-v1.2-local-private",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "fileName": pdf_path.name,
            "sha256": sha256_file(pdf_path),
            "pages": page_count,
        },
        "usage": {
            "visibility": "private",
            "commitPolicy": (
                "Do not commit this generated profile or the raw PDF while the repository is public. "
                "Commit only after the repository is private or moved under approved Axios access controls."
            ),
        },
        "sections": sections,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(profile, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {output_path} with {len(sections)} sections from {page_count} pages.")
    return 0


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_text(text: str) -> str:
    return "\n".join(line.strip() for line in text.splitlines() if line.strip())


def first_heading(text: str, page_index: int) -> str:
    first_line = text.splitlines()[0].strip() if text.splitlines() else ""
    return first_line[:120] if first_line else f"Page {page_index}"


if __name__ == "__main__":
    raise SystemExit(main())
