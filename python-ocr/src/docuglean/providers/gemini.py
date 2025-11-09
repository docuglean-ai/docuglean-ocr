"""
Google Gemini provider implementation for Docuglean OCR.
"""

import json
import pathlib

import httpx

from ..types import (
    ClassifyConfig,
    ClassifyResult,
    ExtractConfig,
    GeminiOCRResponse,
    OCRConfig,
    Split,
    StructuredExtractionResult,
)
from ..utils import get_mime_type_from_extension, is_url


def _prepare_content_from_url(file_path: str, prompt: str) -> list:
    """Prepare content from URL with proper MIME type detection."""
    from google.genai import types

    # Fetch from URL and detect MIME type from headers
    response = httpx.get(file_path)
    doc_data = response.content

    # Get MIME type from HTTP headers or fallback to file extension
    mime_type = response.headers.get('content-type', '').split(';')[0]
    if not mime_type:
        mime_type = get_mime_type_from_extension(file_path)

    return [
        types.Part.from_bytes(
            data=doc_data,
            mime_type=mime_type,
        ),
        prompt
    ]


def _prepare_content_from_local_file(file_path: str, prompt: str) -> list:
    """Prepare content from local file with proper MIME type detection."""
    from google.genai import types

    filepath = pathlib.Path(file_path)
    mime_type = get_mime_type_from_extension(file_path)

    return [
        types.Part.from_bytes(
            data=filepath.read_bytes(),
            mime_type=mime_type,
        ),
        prompt
    ]


def _prepare_gemini_content(file_path: str, prompt: str) -> list:
    """Prepare content for Gemini API with proper MIME type detection."""
    if is_url(file_path):
        return _prepare_content_from_url(file_path, prompt)
    else:
        return _prepare_content_from_local_file(file_path, prompt)


async def process_ocr_gemini(config: OCRConfig) -> GeminiOCRResponse:
    """
    Process OCR using Google Gemini.

    Args:
        config: OCR configuration

    Returns:
        Gemini OCR response

    Raises:
        Exception: If processing fails
    """
    from google import genai

    client = genai.Client(api_key=config.api_key)

    try:
        prompt = config.prompt or "Extract all text from this document using OCR."

        # Prepare content using utility function
        content = _prepare_gemini_content(config.file_path, prompt)

        # Make the request
        response = client.models.generate_content(
            model=config.model or "gemini-2.5-flash",
            contents=content
        )

        if not response or not response.text:
            raise Exception("No response from Gemini OCR")

        return GeminiOCRResponse(
            text=response.text,
            model_used=config.model or "gemini-2.5-flash"
        )

    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"Gemini OCR failed: {error!s}")
        raise Exception("Gemini OCR failed: Unknown error")


async def process_doc_extraction_gemini(config: ExtractConfig) -> StructuredExtractionResult:
    """
    Process document extraction using Google Gemini.

    Args:
        config: Extraction configuration

    Returns:
        Extracted text or structured data

    Raises:
        Exception: If processing fails
    """
    from google import genai

    client = genai.Client(api_key=config.api_key)

    try:
        prompt = config.prompt or "Extract the main content from this document."

        # Prepare content using utility function
        content = _prepare_gemini_content(config.file_path, prompt)

        # Use structured output with Pydantic schema
        response = client.models.generate_content(
            model=config.model or "gemini-2.5-flash",
            contents=content,
            config={
                "response_mime_type": "application/json",
                "response_schema": config.response_format,
            }
        )

        if not response or not response.text:
            raise Exception("No response from Gemini document extraction")

        try:
            # Parse the JSON response
            parsed_data = json.loads(response.text)
            return StructuredExtractionResult(
                raw=response.text,
                parsed=parsed_data,
            )
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse structured response from Gemini: {e}")

    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"Gemini document extraction failed: {error!s}")
        raise Exception("Gemini document extraction failed: Unknown error")


async def process_classify_gemini(
    config: ClassifyConfig,
    page_range: tuple[int, int]
) -> ClassifyResult:
    """
    Process document classification using Google Gemini.
    
    Args:
        config: Classification configuration
        page_range: Tuple of (start_page, end_page) to classify (1-indexed)
        
    Returns:
        ClassifyResult with splits for each category
        
    Raises:
        Exception: If processing fails
    """
    from google import genai
    import pypdf
    
    client = genai.Client(api_key=config.api_key)
    
    try:
        # Extract text from the specified page range
        start_page, end_page = page_range
        page_texts = []
        
        with open(config.file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            for page_num in range(start_page - 1, end_page):  # Convert to 0-indexed
                if page_num < len(reader.pages):
                    page = reader.pages[page_num]
                    text = page.extract_text()
                    page_texts.append(f"--- Page {page_num + 1} ---\n{text}")
        
        full_text = "\n\n".join(page_texts)
        
        # Build classification prompt
        categories_desc = "\n".join([
            f"- {cat.name}: {cat.description}"
            for cat in config.categories
        ])
        
        prompt = f"""Classify the following document pages into the appropriate categories. 
For each page, determine which category it belongs to based on the descriptions below.

Categories:
{categories_desc}

Document (pages {start_page} to {end_page}):
{full_text}

Return a JSON object with the following structure:
{{
  "classifications": [
    {{
      "page": <page_number>,
      "category": "<category_name>",
      "confidence": <0.0 to 1.0>
    }}
  ]
}}

Classify each page into exactly one category. Use confidence scores above 0.8 for clear matches."""

        response = client.models.generate_content(
            model=config.model or "gemini-2.5-flash",
            contents=[prompt],
            config={
                "response_mime_type": "application/json",
                "temperature": 0.3
            }
        )
        
        if not response or not response.text:
            raise Exception("No valid response from Gemini classification")
        
        # Parse the response
        result_json = json.loads(response.text)
        classifications = result_json.get("classifications", [])
        
        # Group pages by category
        category_pages: dict[str, list[int]] = {cat.name: [] for cat in config.categories}
        category_confidence: dict[str, list[float]] = {cat.name: [] for cat in config.categories}
        
        for classification in classifications:
            page = classification.get("page")
            category = classification.get("category")
            confidence = classification.get("confidence", 0.5)
            
            if category in category_pages and page:
                category_pages[category].append(page)
                category_confidence[category].append(confidence)
        
        # Build splits
        splits = []
        for cat in config.categories:
            pages = sorted(category_pages[cat.name])
            if pages:
                # Determine overall confidence
                avg_conf = sum(category_confidence[cat.name]) / len(category_confidence[cat.name]) if category_confidence[cat.name] else 0.5
                conf = "high" if avg_conf >= 0.8 else "low"
                
                splits.append(Split(
                    name=cat.name,
                    pages=pages,
                    conf=conf,
                    partitions=None  # TODO: Implement partition_key support
                ))
        
        return ClassifyResult(splits=splits)
        
    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"Gemini classification failed: {error!s}")
        raise Exception("Gemini classification failed: Unknown error")
