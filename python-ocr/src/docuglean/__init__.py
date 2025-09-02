"""
Docuglean OCR - Python SDK for intelligent document processing.
"""

__version__ = "1.0.0"

from .extract import extract
from .ocr import ocr
from .types import (
    ExtractConfig,
    GeminiOCRResponse,
    HuggingFaceOCRResponse,
    MistralOCRResponse,
    OCRConfig,
    OpenAIOCRResponse,
    Provider,
)

__all__ = ["ExtractConfig", "GeminiOCRResponse", "HuggingFaceOCRResponse", "MistralOCRResponse", "OCRConfig", "OpenAIOCRResponse", "Provider", "__version__", "extract", "ocr"]
