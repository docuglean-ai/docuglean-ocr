"""
Google Gemini provider implementation for Docuglean OCR.
"""

import json
import pathlib

import httpx

from ..types import ExtractConfig, GeminiOCRResponse, OCRConfig, StructuredExtractionResult
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
