"""
Hugging Face tests for Docuglean Python SDK.
Tests for local vision-language models using transformers.
"""

import pytest

from docuglean import ExtractConfig, HuggingFaceOCRResponse, OCRConfig, extract, ocr

# Test URLs
TEST_IMAGE_URL = "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png"

# Skip tests if required dependencies not available
try:
    import importlib.util
    HF_AVAILABLE = importlib.util.find_spec("transformers") is not None
except ImportError:
    HF_AVAILABLE = False

pytestmark = pytest.mark.skipif(
    not HF_AVAILABLE,
    reason="transformers not installed"
)


@pytest.mark.asyncio
async def test_huggingface_ocr_url_image():
    """Test Hugging Face OCR with URL image."""
    config = OCRConfig(
        file_path=TEST_IMAGE_URL,
        provider="huggingface",
        model="HuggingFaceTB/SmolVLM-Instruct",  # Fast, small model for testing
        prompt="Extract all text from this image."
    )

    result = await ocr(config)

    assert isinstance(result, HuggingFaceOCRResponse)
    assert len(result.text) > 0
    assert result.model_used == "HuggingFaceTB/SmolVLM-Instruct"
    print(f"HuggingFace OCR URL image result: {result.text[:100]}...")


@pytest.mark.asyncio
async def test_huggingface_ocr_local_image():
    """Test Hugging Face OCR with local image."""
    config = OCRConfig(
        file_path="./tests/data/testocr.png",
        provider="huggingface",
        model="HuggingFaceTB/SmolVLM-Instruct",  # Fast, small model for testing
        prompt="Extract all text from this image using OCR."
    )

    result = await ocr(config)

    assert isinstance(result, HuggingFaceOCRResponse)
    assert len(result.text) > 0
    assert result.model_used == "HuggingFaceTB/SmolVLM-Instruct"
    print(f"HuggingFace OCR local image result: {result.text[:100]}...")


@pytest.mark.asyncio
async def test_huggingface_ocr_base64_image():
    """Test Hugging Face OCR with base64 encoded image."""
    # Create a base64 encoded version of our test image
    import base64

    # Load and encode the test image
    with open("./tests/data/testocr.png", "rb") as f:
        image_data = f.read()

    base64_image = base64.b64encode(image_data).decode('utf-8')
    data_url = f"data:image/png;base64,{base64_image}"

    config = OCRConfig(
        file_path=data_url,
        provider="huggingface",
        model="HuggingFaceTB/SmolVLM-Instruct",
        prompt="Extract all text from this image."
    )

    result = await ocr(config)

    assert isinstance(result, HuggingFaceOCRResponse)
    assert len(result.text) > 0
    print(f"HuggingFace OCR base64 image result: {result.text[:100]}...")


@pytest.mark.asyncio
async def test_huggingface_extract_structured():
    """Test Hugging Face structured extraction."""
    from pydantic import BaseModel
    
    class DocumentInfo(BaseModel):
        objects: list[str]
        text: str
        description: str
    
    config = ExtractConfig(
        file_path=TEST_IMAGE_URL,
        provider="huggingface",
        model="HuggingFaceTB/SmolVLM-Instruct",
        response_format=DocumentInfo,
        prompt="Analyze this document and extract key information."
    )

    result = await extract(config)

    assert hasattr(result, 'raw')
    assert hasattr(result, 'parsed')
    assert len(result.raw) > 0
    print(f"HuggingFace extraction result - Raw: {result.raw[:200]}...")
    print(f"HuggingFace extraction result - Parsed: {result.parsed}")


@pytest.mark.asyncio
async def test_huggingface_default_model():
    """Test Hugging Face with default model."""
    config = OCRConfig(
        file_path=TEST_IMAGE_URL,
        provider="huggingface",
        # No model specified, should use default
        prompt="What text is in this image?"
    )

    result = await ocr(config)

    assert isinstance(result, HuggingFaceOCRResponse)
    assert len(result.text) > 0
    assert result.model_used == "HuggingFaceTB/SmolVLM-Instruct"  # Default model
    print(f"HuggingFace default model result: {result.text[:100]}...")
