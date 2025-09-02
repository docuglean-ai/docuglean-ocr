"""
Basic tests for Docuglean OCR Python SDK.
"""

from docuglean import ExtractConfig, OCRConfig, extract, ocr


def test_imports():
    """Test that all main functions can be imported."""
    assert ocr is not None
    assert extract is not None
    assert OCRConfig is not None
    assert ExtractConfig is not None


def test_config_creation():
    """Test configuration creation."""
    ocr_config = OCRConfig(file_path="test.pdf", api_key="key")
    extract_config = ExtractConfig(file_path="test.pdf", api_key="key")

    assert ocr_config.file_path == "test.pdf"
    assert extract_config.api_key == "key"
