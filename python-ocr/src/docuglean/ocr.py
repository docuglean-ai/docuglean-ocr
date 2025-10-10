"""
OCR processing module for Docuglean Python SDK.
"""


from .providers.gemini import process_ocr_gemini
from .providers.huggingface import process_ocr_huggingface
from .providers.mistral import process_ocr_mistral
from .providers.openai import process_ocr_openai
from .providers.local import process_ocr_local, LocalOCRResponse
from .types import (
    GeminiOCRResponse,
    HuggingFaceOCRResponse,
    MistralOCRResponse,
    OCRConfig,
    OpenAIOCRResponse,
    validate_config,
)


async def ocr(config: OCRConfig) -> MistralOCRResponse | OpenAIOCRResponse | HuggingFaceOCRResponse | GeminiOCRResponse | LocalOCRResponse:
    """
    Processes a document using OCR with specified provider.

    Args:
        config: OCR configuration including provider, file path, and API key

    Returns:
        Processed text and metadata

    Raises:
        ValueError: If configuration is invalid
        Exception: If provider is not supported
    """
    # Default to mistral if no provider specified
    provider = config.provider or "mistral"

    # Validate configuration
    validate_config(config)

    # Route to correct provider
    if provider == "mistral":
        return await process_ocr_mistral(config)
    elif provider == "openai":
        return await process_ocr_openai(config)
    elif provider == "huggingface":
        return await process_ocr_huggingface(config)
    elif provider == "gemini":
        return await process_ocr_gemini(config)
    elif provider == "local":
        return await process_ocr_local(config.file_path)
    else:
        raise Exception(f"Provider {provider} not supported yet")
