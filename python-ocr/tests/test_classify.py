"""
Tests for document classification functionality.
"""

import os
import pytest
from docuglean import classify


@pytest.mark.asyncio
async def test_classify_basic():
    """Test basic classification with a sample PDF."""
    # Skip if no API key is set
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        pytest.skip("MISTRAL_API_KEY not set")
    
    test_pdf = os.path.join(os.path.dirname(__file__), "data", "sample.pdf")
    
    result = await classify(
        file_path=test_pdf,
        categories=[
            {
                "name": "Technical Content",
                "description": "Pages containing technical documentation, code, or specifications"
            },
            {
                "name": "General Content",
                "description": "Pages with general information, introductions, or summaries"
            }
        ],
        api_key=api_key,
        provider="mistral"
    )
    
    assert result is not None
    assert hasattr(result, "splits")
    assert isinstance(result.splits, list)
    
    # Check that we have at least one split
    if len(result.splits) > 0:
        split = result.splits[0]
        assert hasattr(split, "name")
        assert hasattr(split, "pages")
        assert hasattr(split, "conf")
        assert split.conf in ["low", "high"]
        assert isinstance(split.pages, list)


@pytest.mark.asyncio
async def test_classify_openai():
    """Test classification with OpenAI provider."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        pytest.skip("OPENAI_API_KEY not set")
    
    test_pdf = os.path.join(os.path.dirname(__file__), "data", "sample.pdf")
    
    result = await classify(
        file_path=test_pdf,
        categories=[
            {
                "name": "Introduction",
                "description": "Introductory or overview pages"
            },
            {
                "name": "Main Content",
                "description": "Main body content pages"
            }
        ],
        api_key=api_key,
        provider="openai"
    )
    
    assert result is not None
    assert hasattr(result, "splits")


@pytest.mark.asyncio
async def test_classify_gemini():
    """Test classification with Gemini provider."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        pytest.skip("GEMINI_API_KEY not set")
    
    test_pdf = os.path.join(os.path.dirname(__file__), "data", "sample.pdf")
    
    result = await classify(
        file_path=test_pdf,
        categories=[
            {
                "name": "Header Pages",
                "description": "Pages with headers or titles"
            },
            {
                "name": "Content Pages",
                "description": "Pages with main content"
            }
        ],
        api_key=api_key,
        provider="gemini"
    )
    
    assert result is not None
    assert hasattr(result, "splits")


@pytest.mark.asyncio
async def test_classify_validation():
    """Test that validation works correctly."""
    with pytest.raises(ValueError, match="Valid API key is required"):
        await classify(
            file_path="test.pdf",
            categories=[{"name": "Test", "description": "Test category"}],
            api_key=""
        )
    
    with pytest.raises(ValueError, match="Valid file path is required"):
        await classify(
            file_path="",
            categories=[{"name": "Test", "description": "Test category"}],
            api_key="test-key"
        )
    
    with pytest.raises(ValueError, match="At least one category is required"):
        await classify(
            file_path="test.pdf",
            categories=[],
            api_key="test-key"
        )

