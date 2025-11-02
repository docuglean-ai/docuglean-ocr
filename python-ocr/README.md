# Docuglean OCR - Python SDK

A unified Python SDK for intelligent document processing using State of the Art AI models.

## Features

- 🚀 **Easy to Use**: Simple, intuitive API with detailed documentation
- 🔍 **OCR Capabilities**: Extract text from images and scanned documents  
- 📊 **Structured Data Extraction**: Use Pydantic models for type-safe data extraction
- 📄 **Multimodal Support**: Process PDFs and images with ease
- 🤖 **Multiple AI Providers**: Support for OpenAI, Mistral, Google Gemini, and Hugging Face
- 🔒 **Type Safety**: Full Python type hints with Pydantic validation
- 📦 **Permissive Licensing**: Uses pdftext (Apache/BSD) instead of PyMuPDF (AGPL) for commercial-friendly PDF processing
- 📝 **Document Parsers**: Built-in local parsers for DOCX, PPTX, XLSX, CSV, TSV, and PDF (no API required)

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

# Local OCR (no API, PDFs only) using pdftext
result = await ocr(
    file_path="./document.pdf",
    provider="local",
    api_key="local"
)
print("Local text:", result.text[:200] + "...")
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

# Summarization via extract
class Summary(BaseModel):
    title: str | None = None
    summary: str
    keyPoints: List[str]

summary = await extract(
    file_path="./long-report.pdf",
    provider="openai",
    api_key="your-api-key",
    response_format=Summary,
    prompt="Provide a concise 3-sentence summary of this document and 3–7 key points."
)
print("Summary:", summary.summary)
```

Note: you can also use extract with a targeted "search" prompt (e.g., "Find all occurrences of X and return matching passages") to perform semantic search within a document.

## Document Parsers (Local - No API Required)

Extract text from various document formats without any AI provider:

```python
from docuglean import (
    parse_docx,
    parse_pptx,
    parse_spreadsheet,
    parse_pdf,
    parse_csv,
    parse_document_local
)

# Parse DOCX files (returns HTML, Markdown, and raw text)
result = await parse_docx("./document.docx")
print(result["html"])      # HTML output
print(result["markdown"])  # Markdown output
print(result["raw_text"])  # Plain text
print(result["text"])      # Same as markdown

# Parse PPTX files
result = await parse_pptx("./presentation.pptx")
print(result["text"])

# Parse spreadsheets (XLSX, XLS)
result = await parse_spreadsheet("./data.xlsx")
print(result["text"])

# Parse CSV/TSV files
result = await parse_csv("./data.csv")
print(result["text"])
print(result["rows"])      # List of row dictionaries
print(result["columns"])   # List of column names

# Parse PDF files
result = await parse_pdf("./document.pdf")
print(result["text"])

# Auto-detect format and parse
result = await parse_document_local("./document.docx")
print(result["text"])
```

### Supported Document Formats

- **Word Documents**: DOC, DOCX
- **Presentations**: PPT, PPTX
- **Spreadsheets**: XLSX, XLS
- **Delimited Files**: CSV, TSV
- **PDFs**: PDF

All parsers return dictionaries with extracted content. The specific keys depend on the format:
- DOCX: `html`, `markdown`, `raw_text`, `text`
- PPTX/XLSX/PDF: `text`
- CSV/TSV: `text`, `rows`, `columns`

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
