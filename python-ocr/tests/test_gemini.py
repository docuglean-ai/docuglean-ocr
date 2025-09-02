"""
Tests for Google Gemini provider in Docuglean OCR Python SDK.
"""

import os
import pytest

from docuglean import ExtractConfig, GeminiOCRResponse, OCRConfig, extract, ocr
from docuglean.providers.gemini import process_doc_extraction_gemini, process_ocr_gemini


def test_gemini_imports():
    """Test that Gemini functions can be imported."""
    assert process_ocr_gemini is not None
    assert process_doc_extraction_gemini is not None
    assert GeminiOCRResponse is not None


def test_gemini_ocr_config():
    """Test Gemini OCR configuration."""
    config = OCRConfig(
        file_path="test.pdf",
        api_key="test-key",
        provider="gemini",
        model="gemini-2.5-flash"
    )
    
    assert config.provider == "gemini"
    assert config.model == "gemini-2.5-flash"
    assert config.api_key == "test-key"


def test_gemini_extract_config():
    """Test Gemini extraction configuration."""
    config = ExtractConfig(
        file_path="test.pdf",
        api_key="test-key",
        provider="gemini",
        model="gemini-2.5-flash",
        prompt="Extract invoice data"
    )
    
    assert config.provider == "gemini"
    assert config.model == "gemini-2.5-flash"
    assert config.prompt == "Extract invoice data"


@pytest.mark.skipif(
    not os.getenv("GEMINI_API_KEY"),
    reason="GEMINI_API_KEY environment variable not set"
)
@pytest.mark.asyncio
async def test_gemini_ocr_with_real_api():
    """Test Gemini OCR with real API (requires GEMINI_API_KEY)."""
    config = OCRConfig(
        file_path="tests/data/testocr.png",
        api_key=os.getenv("GEMINI_API_KEY"),
        provider="gemini",
        model="gemini-2.5-flash"
    )
    
    result = await ocr(config)
    
    assert isinstance(result, GeminiOCRResponse)
    assert result.text is not None
    assert len(result.text) > 0
    assert result.model_used == "gemini-2.5-flash"


@pytest.mark.skipif(
    not os.getenv("GEMINI_API_KEY"),
    reason="GEMINI_API_KEY environment variable not set"
)
@pytest.mark.asyncio
async def test_gemini_extract_with_real_api():
    """Test Gemini extraction with real API (requires GEMINI_API_KEY)."""
    config = ExtractConfig(
        file_path="tests/data/receipt.pdf",
        api_key=os.getenv("GEMINI_API_KEY"),
        provider="gemini",
        model="gemini-2.5-flash",
        prompt="Extract the total amount from this receipt"
    )
    
    result = await extract(config)
    
    assert isinstance(result, str)
    assert len(result) > 0


def test_gemini_response_model():
    """Test GeminiOCRResponse model."""
    response = GeminiOCRResponse(
        text="Extracted text content",
        model_used="gemini-2.5-flash"
    )
    
    assert response.text == "Extracted text content"
    assert response.model_used == "gemini-2.5-flash"
