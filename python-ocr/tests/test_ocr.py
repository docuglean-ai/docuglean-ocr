"""
OCR tests for Docuglean Python SDK.
Real integration tests with actual files and API calls.
"""

import os

import pytest

from docuglean import MistralOCRResponse, OCRConfig, ocr

# Test URLs
TEST_IMAGE_URL = "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png"
TEST_PDF_URL = "https://arxiv.org/pdf/2302.12854"

# Skip tests if no API key
pytestmark = pytest.mark.skipif(
    not os.getenv("MISTRAL_API_KEY"),
    reason="MISTRAL_API_KEY not set"
)


@pytest.mark.asyncio
async def test_mistral_url_image():
    """Test Mistral OCR with URL image."""
    config = OCRConfig(
        file_path=TEST_IMAGE_URL,
        provider="mistral",
        model="mistral-ocr-latest",
        api_key=os.getenv("MISTRAL_API_KEY")
    )

    result = await ocr(config)

    assert isinstance(result, MistralOCRResponse)
    assert len(result.pages) > 0
    assert len(result.pages[0].markdown) > 0
    print(f"URL Image OCR result: {result.pages[0].markdown[:100]}...")


@pytest.mark.asyncio
async def test_mistral_local_image():
    """Test Mistral OCR with local image."""
    config = OCRConfig(
        file_path="./tests/data/testocr.png",
        provider="mistral",
        model="mistral-ocr-latest",
        api_key=os.getenv("MISTRAL_API_KEY")
    )

    result = await ocr(config)

    assert isinstance(result, MistralOCRResponse)
    assert len(result.pages) > 0
    assert len(result.pages[0].markdown) > 0
    print(f"Local Image OCR result: {result.pages[0].markdown[:100]}...")


@pytest.mark.asyncio
async def test_mistral_local_pdf():
    """Test Mistral OCR with local PDF."""
    config = OCRConfig(
        file_path="./tests/data/receipt.pdf",
        provider="mistral",
        model="mistral-ocr-latest",
        api_key=os.getenv("MISTRAL_API_KEY")
    )

    result = await ocr(config)

    assert isinstance(result, MistralOCRResponse)
    assert len(result.pages) > 0
    assert len(result.pages[0].markdown) > 0
    print(f"Local PDF OCR result: {result.pages[0].markdown[:100]}...")

