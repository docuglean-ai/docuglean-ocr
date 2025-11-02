"""CSV/TSV parsing utilities."""

from __future__ import annotations

import csv


async def parse_csv(file_path: str) -> dict:
    if not file_path:
        return {"text": "", "rows": [], "columns": []}
    
    delimiter = "\t" if file_path.lower().endswith(".tsv") else ","
    
    with open(file_path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        rows = list(reader)
    
    if not rows:
        return {"text": "", "rows": [], "columns": []}
    
    columns = list(rows[0].keys())
    text_lines = []
    for row in rows:
        line = "\n".join(f"{key}: {row.get(key, '')}" for key in columns)
        text_lines.append(line)
    
    return {
        "text": "\n\n".join(text_lines),
        "rows": rows,
        "columns": columns,
    }

