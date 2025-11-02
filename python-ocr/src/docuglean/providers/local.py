"""Local document parsing provider."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from ..parsers.docx import parse_docx
from ..parsers.pptx import parse_pptx
from ..parsers.spreadsheet import parse_spreadsheet
from ..parsers.pdf import parse_pdf
from ..parsers.csv import parse_csv


@dataclass
class LocalOCRResponse:
    text: str


async def parse_document_local(file_path: str) -> dict:
    if not file_path:
        return {"text": ""}
    
    ext = Path(file_path).suffix.lower()
    
    if ext == ".docx":
        return await parse_docx(file_path)
    elif ext == ".pptx":
        return await parse_pptx(file_path)
    elif ext == ".xlsx":
        return await parse_spreadsheet(file_path)
    elif ext in [".csv", ".tsv"]:
        return await parse_csv(file_path)
    elif ext == ".pdf":
        return await parse_pdf(file_path)
    else:
        raise Exception(f"Unsupported file format: {ext}")


async def process_ocr_local(file_path: str) -> LocalOCRResponse:
    result = await parse_document_local(file_path)
    
    # Handle different return types
    if "text" in result:
        text = result["text"]
    elif "raw_text" in result:
        text = result["raw_text"]
    elif "markdown" in result:
        text = result["markdown"]
    else:
        text = ""
    
    return LocalOCRResponse(text=text)


