"""
Document extraction module for Docuglean Python SDK.
"""


from .providers.gemini import process_doc_extraction_gemini
from .providers.huggingface import process_doc_extraction_huggingface
from .providers.mistral import process_doc_extraction_mistral
from .providers.openai import process_doc_extraction_openai
from .types import ExtractConfig, StructuredExtractionResult, validate_config


async def extract(config: ExtractConfig) -> str | StructuredExtractionResult:
    """
    Extracts structured or unstructured information from a document using specified provider.

    Args:
        config: Extraction configuration including provider, file path, and API key

    Returns:
        Extracted information either as string or structured data

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
        return await process_doc_extraction_mistral(config)
    elif provider == "openai":
        return await process_doc_extraction_openai(config)
    elif provider == "huggingface":
        return await process_doc_extraction_huggingface(config)
    elif provider == "gemini":
        return await process_doc_extraction_gemini(config)
    else:
        raise Exception(f"Provider {provider} not supported yet")
