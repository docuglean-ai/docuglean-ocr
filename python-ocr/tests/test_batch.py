"""Tests for batch processing functionality."""

import os
import pytest
from pydantic import BaseModel

from docuglean import batch_ocr, batch_extract
from docuglean.types import OCRConfig, ExtractConfig

TEST_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


@pytest.mark.asyncio
async def test_batch_ocr_success():
    """Test successful batch OCR processing."""
    configs = [
        OCRConfig(file_path=os.path.join(TEST_DATA_DIR, "sample.pdf"), provider="local", api_key="local"),
        OCRConfig(file_path=os.path.join(TEST_DATA_DIR, "sample2.pdf"), provider="local", api_key="local")
    ]
    results = await batch_ocr(configs)
    
    assert len(results) == 2
    assert results[0]["success"]
    assert results[1]["success"]


@pytest.mark.asyncio
async def test_batch_ocr_with_errors():
    """Test batch OCR handles errors gracefully."""
    configs = [
        OCRConfig(file_path=os.path.join(TEST_DATA_DIR, "sample.pdf"), provider="local", api_key="local"),
        OCRConfig(file_path="non-existent.pdf", provider="local", api_key="local"),
        OCRConfig(file_path=os.path.join(TEST_DATA_DIR, "sample2.pdf"), provider="local", api_key="local")
    ]
    results = await batch_ocr(configs)
    
    assert len(results) == 3
    assert results[0]["success"] is True
    assert results[1]["success"] is False
    assert results[1]["file"] == "non-existent.pdf"
    assert results[2]["success"] is True


@pytest.mark.asyncio
async def test_batch_extract_success():
    """Test successful batch extraction."""
    class Schema(BaseModel):
        text: str
    
    configs = [
        ExtractConfig(file_path=os.path.join(TEST_DATA_DIR, "sample.pdf"), provider="local", api_key="local", response_format=Schema),
        ExtractConfig(file_path=os.path.join(TEST_DATA_DIR, "sample2.pdf"), provider="local", api_key="local", response_format=Schema)
    ]
    results = await batch_extract(configs)
    
    assert len(results) == 2
    assert results[0]["success"]
    assert results[1]["success"]


@pytest.mark.asyncio
async def test_batch_extract_with_errors():
    """Test batch extraction handles errors gracefully."""
    class Schema(BaseModel):
        text: str
    
    configs = [
        ExtractConfig(file_path=os.path.join(TEST_DATA_DIR, "sample.pdf"), provider="local", api_key="local", response_format=Schema),
        ExtractConfig(file_path="non-existent.pdf", provider="local", api_key="local", response_format=Schema)
    ]
    results = await batch_extract(configs)
    
    assert len(results) == 2
    assert results[0]["success"] is True
    assert results[1]["success"] is False
    assert results[1]["file"] == "non-existent.pdf"

