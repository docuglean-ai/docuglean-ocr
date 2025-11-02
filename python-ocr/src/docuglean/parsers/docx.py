"""DOC/DOCX parsing utilities using mammoth."""

from __future__ import annotations


async def parse_docx(file_path: str) -> dict:
    if not file_path:
        return {"html": "", "markdown": "", "raw_text": "", "text": ""}
    
    import mammoth
    
    html_result = mammoth.convert_to_html(file_path)
    markdown_result = mammoth.convert_to_markdown(file_path)
    raw_text_result = mammoth.extract_raw_text(file_path)
    
    markdown = markdown_result.value or ""
    
    return {
        "html": html_result.value or "",
        "markdown": markdown,
        "raw_text": raw_text_result.value or "",
        "text": markdown,
    }



