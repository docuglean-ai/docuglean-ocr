"""
Local OCR provider using PyMuPDF (fitz) for simple text extraction from PDFs.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class LocalOCRResponse:
    text: str


async def process_ocr_local(file_path: str) -> LocalOCRResponse:
    try:
        import fitz  # PyMuPDF
    except Exception as e:  # pragma: no cover
        raise Exception("PyMuPDF (fitz) is required: pip install pymupdf") from e

    if file_path.startswith("http://") or file_path.startswith("https://"):
        raise Exception("Local OCR requires a local PDF file path")
    if not os.path.exists(file_path):
        raise Exception(f"File not found: {file_path}")

    if not file_path.lower().endswith(".pdf"):
        raise Exception("Local OCR currently supports only PDF files")

    doc = fitz.open(file_path)
    texts: list[str] = []
    for page in doc:
        texts.append(page.get_text())
    doc.close()
    return LocalOCRResponse(text="\n".join(texts))


