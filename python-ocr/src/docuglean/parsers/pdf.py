"""PDF parsing utilities using pdftext."""

from __future__ import annotations


async def parse_pdf(file_path: str) -> dict:
    if not file_path:
        return {"text": ""}
    
    try:
        from pdftext.extraction import plain_text_output
    except ImportError as e:
        raise Exception("pdftext is required: pip install pdftext") from e
    
    # Extract text from PDF
    # plain_text_output may return a string or an iterator of pages
    result = plain_text_output(file_path, sort=False, hyphens=False)
    
    # Handle different return types
    if isinstance(result, str):
        # It's already a string, use it directly
        text = result
    elif hasattr(result, '__iter__') and not isinstance(result, (str, bytes)):
        # It's an iterator/list of pages, join them
        text = "\n".join(str(page) for page in result)
    else:
        # Fallback: convert to string
        text = str(result)
    
    return {"text": text}


