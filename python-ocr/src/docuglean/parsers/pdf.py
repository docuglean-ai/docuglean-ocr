"""PDF parsing utilities using pdftext."""

from __future__ import annotations


async def parse_pdf(file_path: str) -> dict:
    if not file_path:
        return {"text": ""}
    
    try:
        import pdftext.extraction
    except ImportError as e:
        raise Exception("pdftext is required: pip install pdftext") from e
    
    pdf_pages = pdftext.extraction.plain_text_output(file_path)
    texts = [page for page in pdf_pages]
    
    return {"text": "\n\n".join(texts)}


