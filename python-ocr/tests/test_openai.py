"""
OpenAI tests for Docuglean Python SDK.
Real integration tests with actual files and API calls.
"""

import os

import pytest
from pydantic import BaseModel

from docuglean import ExtractConfig, OCRConfig, OpenAIOCRResponse, extract, ocr


# Define example schema for structured extraction
class ReceiptItem(BaseModel):
    """Individual receipt item."""
    name: str
    price: float

class Receipt(BaseModel):
    """Receipt schema for structured extraction."""
    date: str
    total: float
    items: list[ReceiptItem]


# Test URLs - using smaller images that fit OpenAI's 10MB limit
TEST_IMAGE_URL = "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png"
TEST_PDF_URL = "https://arxiv.org/pdf/2302.12854"

# Skip tests if no API key
pytestmark = pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set"
)


@pytest.mark.asyncio
async def test_openai_ocr_url_image():
    """Test OpenAI OCR with URL image."""
    config = OCRConfig(
        file_path=TEST_IMAGE_URL,
        provider="openai",
        model="gpt-4.1-mini",
        api_key=os.getenv("OPENAI_API_KEY"),
        prompt="Extract all text visible in this image."
    )

    result = await ocr(config)

    assert isinstance(result, OpenAIOCRResponse)
    assert len(result.text) > 0
    print(f"OpenAI OCR URL image result: {result.text[:100]}...")


@pytest.mark.asyncio
async def test_openai_ocr_local_image():
    """Test OpenAI OCR with local image."""
    config = OCRConfig(
        file_path="./tests/data/testocr.png",
        provider="openai",
        model="gpt-4.1-mini",
        api_key=os.getenv("OPENAI_API_KEY"),
        prompt="Extract all text from this image using OCR."
    )

    result = await ocr(config)

    assert isinstance(result, OpenAIOCRResponse)
    assert len(result.text) > 0
    print(f"OpenAI OCR local image result: {result.text[:100]}...")


@pytest.mark.asyncio
async def test_openai_extract_structured_pdf():
    """Test OpenAI structured extraction with PDF URL."""
    config = ExtractConfig(
        file_path=TEST_PDF_URL,
        provider="openai",
        model="gpt-5-mini",
        api_key=os.getenv("OPENAI_API_KEY"),
        response_format=Receipt,
        prompt="Extract key information from this research paper including title, authors, and main findings."
    )

    result = await extract(config)

    assert hasattr(result, 'raw')
    assert hasattr(result, 'parsed')
    assert len(result.raw) > 0
    print(f"OpenAI structured extraction result - Raw: {result.raw[:200]}...")
    print(f"OpenAI structured extraction result - Parsed: {result.parsed}")


@pytest.mark.asyncio
async def test_openai_extract_structured_local_pdf():
    """Test OpenAI structured extraction with local PDF."""
    config = ExtractConfig(
        file_path="./tests/data/receipt.pdf",
        provider="openai",
        model="gpt-5-mini",
        api_key=os.getenv("OPENAI_API_KEY"),
        response_format=Receipt,
        system_prompt="You are an expert at structured data extraction. Extract receipt information from the document.",
        prompt="Extract the receipt details including date, total amount, and itemized list with prices."
    )

    result = await extract(config)

    # For structured output, result should be StructuredExtractionResult
    assert hasattr(result, 'raw') or isinstance(result, str)
    if hasattr(result, 'raw'):
        assert hasattr(result, 'parsed')
        print(f"OpenAI structured extraction - Raw: {result.raw[:100]}...")
        print(f"OpenAI structured extraction - Parsed: {result.parsed}")
    else:
        print(f"OpenAI structured extraction result: {result[:200]}...")
