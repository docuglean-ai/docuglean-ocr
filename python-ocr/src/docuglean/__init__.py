"""
Docuglean OCR - Python SDK for intelligent document processing.
"""

__version__ = "1.0.0"

from .extract import extract
from .ocr import ocr
from .batch import batch_ocr, batch_extract, BatchOCRResult, BatchExtractResult
from .classify import classify
from .types import (
    CategoryDescription,
    ClassifyConfig,
    ClassifyResult,
    ExtractConfig,
    GeminiOCRResponse,
    HuggingFaceOCRResponse,
    MistralOCRResponse,
    OCRConfig,
    OpenAIOCRResponse,
    Partition,
    Provider,
    Split,
)

# Export document parser utilities
from .parsers import (
    parse_docx,
    parse_pptx,
    parse_spreadsheet,
    parse_pdf,
    parse_csv,
)
from .providers.local import parse_document_local

__all__ = [
    "ExtractConfig",
    "GeminiOCRResponse",
    "HuggingFaceOCRResponse",
    "MistralOCRResponse",
    "OCRConfig",
    "OpenAIOCRResponse",
    "Provider",
    "__version__",
    "extract",
    "ocr",
    "batch_ocr",
    "batch_extract",
    "BatchOCRResult",
    "BatchExtractResult",
    "classify",
    "CategoryDescription",
    "ClassifyConfig",
    "ClassifyResult",
    "Partition",
    "Split",
    # Parser utilities
    "parse_docx",
    "parse_pptx",
    "parse_spreadsheet",
    "parse_pdf",
    "parse_csv",
    "parse_document_local",
]
