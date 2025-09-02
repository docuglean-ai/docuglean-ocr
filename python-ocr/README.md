# Docuglean OCR - Python SDK

A unified Python SDK for intelligent document processing using State of the Art AI models.

## Features

- 🚀 **Easy to Use**: Simple, intuitive API with detailed documentation
- 🔍 **OCR Capabilities**: Extract text from images and scanned documents  
- 📊 **Structured Data Extraction**: Use Pydantic models for type-safe data extraction
- 📄 **Multimodal Support**: Process PDFs and images with ease
- 🤖 **Multiple AI Providers**: Support for OpenAI, Mistral, Google Gemini, and Hugging Face
- 🔒 **Type Safety**: Full Python type hints with Pydantic validation

## Installation

```bash
pip install docuglean-ocr
```

## Quick Start

### OCR Processing

```python
from docuglean import ocr

# Mistral OCR
result = await ocr(
    file_path="./document.pdf",
    provider="mistral",
    model="mistral-ocr-latest",
    api_key="your-api-key"
)

# Google Gemini OCR
result = await ocr(
    file_path="./document.pdf",
    provider="gemini",
    model="gemini-2.5-flash",
    api_key="your-gemini-api-key",
    prompt="Extract all text from this document"
)

# Hugging Face OCR (no API key needed)
result = await ocr(
    file_path="https://example.com/image.jpg",  # Supports URLs, local files, base64
    provider="huggingface",
    model="Qwen/Qwen2.5-VL-3B-Instruct",
    prompt="Extract all text from this image"
)
```

### Structured Data Extraction

```python
from docuglean import extract
from pydantic import BaseModel
from typing import List

class ReceiptItem(BaseModel):
    name: str
    price: float

class Receipt(BaseModel):
    date: str
    total: float
    items: List[ReceiptItem]

# Extract structured data with OpenAI
receipt = await extract(
    file_path="./receipt.pdf",
    provider="openai",
    api_key="your-api-key",
    response_format=Receipt,
    prompt="Extract receipt information"
)

# Extract structured data with Gemini
receipt = await extract(
    file_path="./receipt.pdf",
    provider="gemini",
    api_key="your-gemini-api-key",
    response_format=Receipt,
    prompt="Extract receipt information including date, total, and all items"
)
```

## Development

### Setup

```bash
# Install with UV
uv sync
```

### Testing

```bash
# Run all tests
uv run pytest tests/ -v

# Run specific test files
uv run pytest tests/test_basic.py -v                    # Basic tests only
uv run pytest tests/test_ocr.py tests/test_extract.py -v  # Mistral tests (requires MISTRAL_API_KEY)
uv run pytest tests/test_openai.py -v                   # OpenAI tests (requires OPENAI_API_KEY)

# Run with output (shows print statements)
uv run pytest tests/ -v -s

# Run specific test function
uv run pytest tests/test_openai.py::test_openai_extract_unstructured_pdf -v -s

# Set API keys for real testing
export MISTRAL_API_KEY=your_mistral_key_here
export OPENAI_API_KEY=your_openai_key_here
export GEMINI_API_KEY=your_gemini_key_here
uv run pytest tests/ -v -s
```

### Code Quality

```bash
# Run linting and type checking
uv run ruff check src/ tests/

# Fix linting issues automatically
uv run ruff check src/ tests/ --fix

# Format code
uv run ruff format src/ tests/
```

## License

Apache 2.0 - see the [LICENSE](LICENSE) file for details.
