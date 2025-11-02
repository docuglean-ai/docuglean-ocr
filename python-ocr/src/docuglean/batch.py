"""
Batch processing module for Docuglean Python SDK.
"""

import asyncio
from typing import Any, TypedDict

from .extract import extract
from .ocr import ocr
from .types import (
    ExtractConfig,
    GeminiOCRResponse,
    HuggingFaceOCRResponse,
    MistralOCRResponse,
    OCRConfig,
    OpenAIOCRResponse,
)


class BatchOCRSuccess(TypedDict):
    """Successful batch OCR result."""
    success: bool  # Always True
    result: MistralOCRResponse | OpenAIOCRResponse | HuggingFaceOCRResponse | GeminiOCRResponse


class BatchOCRFailure(TypedDict):
    """Failed batch OCR result."""
    success: bool  # Always False
    error: str
    file: str


BatchOCRResult = BatchOCRSuccess | BatchOCRFailure


class BatchExtractSuccess(TypedDict):
    """Successful batch extraction result."""
    success: bool  # Always True
    result: Any


class BatchExtractFailure(TypedDict):
    """Failed batch extraction result."""
    success: bool  # Always False
    error: str
    file: str


BatchExtractResult = BatchExtractSuccess | BatchExtractFailure


async def _process_ocr_single(config: OCRConfig) -> BatchOCRResult:
    """Process a single OCR config and return result."""
    try:
        result = await ocr(config)
        return {"success": True, "result": result}  # type: ignore
    except Exception as error:
        return {
            "success": False,
            "error": str(error),
            "file": config.file_path
        }


async def _process_extract_single(config: ExtractConfig) -> BatchExtractResult:
    """Process a single extraction config and return result."""
    try:
        result = await extract(config)
        return {"success": True, "result": result}  # type: ignore
    except Exception as error:
        return {
            "success": False,
            "error": str(error),
            "file": config.file_path
        }


async def batch_ocr(configs: list[OCRConfig]) -> list[BatchOCRResult]:
    """Process multiple documents using OCR concurrently."""
    tasks = [_process_ocr_single(config) for config in configs]
    return await asyncio.gather(*tasks)


async def batch_extract(configs: list[ExtractConfig]) -> list[BatchExtractResult]:
    """Extract structured information from multiple documents concurrently."""
    tasks = [_process_extract_single(config) for config in configs]
    return await asyncio.gather(*tasks)

