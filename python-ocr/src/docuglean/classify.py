"""
Document classification module for Docuglean Python SDK.
"""

import asyncio
from collections import defaultdict
from typing import Any

from .parsers.pdf import parse_pdf
from .types import CategoryDescription, ClassifyConfig, ClassifyResult, Split, Partition


def _get_page_count(file_path: str) -> int:
    """Get the number of pages in a PDF."""
    try:
        import pypdf
        with open(file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            return len(reader.pages)
    except Exception:
        # Fallback: assume it needs chunking
        return 100


def _chunk_pages(total_pages: int, chunk_size: int) -> list[tuple[int, int]]:
    """Split page range into chunks. Returns list of (start_page, end_page) tuples (1-indexed)."""
    chunks = []
    for start in range(1, total_pages + 1, chunk_size):
        end = min(start + chunk_size - 1, total_pages)
        chunks.append((start, end))
    return chunks


def _merge_splits(chunk_results: list[ClassifyResult]) -> ClassifyResult:
    """Merge classification results from multiple chunks."""
    # Group splits by category name
    category_map: dict[str, dict[str, Any]] = defaultdict(lambda: {
        "pages": [],
        "conf": "high",
        "partitions": defaultdict(lambda: {"pages": [], "conf": "high"})
    })
    
    for result in chunk_results:
        for split in result.splits:
            cat = category_map[split.name]
            cat["pages"].extend(split.pages)
            
            # If any chunk has low confidence, mark the whole category as low
            if split.conf == "low":
                cat["conf"] = "low"
            
            # Merge partitions if present
            if split.partitions:
                for partition in split.partitions:
                    part = cat["partitions"][partition.name]
                    part["pages"].extend(partition.pages)
                    if partition.conf == "low":
                        part["conf"] = "low"
    
    # Convert to Split objects
    splits = []
    for name, data in category_map.items():
        # Sort and deduplicate pages
        pages = sorted(set(data["pages"]))
        
        # Build partitions if any exist
        partitions = None
        if data["partitions"]:
            partitions = [
                Partition(
                    name=part_name,
                    pages=sorted(set(part_data["pages"])),
                    conf=part_data["conf"]
                )
                for part_name, part_data in data["partitions"].items()
            ]
        
        splits.append(Split(
            name=name,
            pages=pages,
            conf=data["conf"],
            partitions=partitions
        ))
    
    return ClassifyResult(splits=splits)


async def classify(
    file_path: str,
    categories: list[CategoryDescription | dict[str, str]],
    api_key: str,
    provider: str = "mistral",
    model: str | None = None,
    chunk_size: int = 75,
    max_concurrent: int = 5
) -> ClassifyResult:
    """
    Classify a document into categories with page ranges.
    
    Args:
        file_path: Path to the PDF file
        categories: List of CategoryDescription objects or dicts with 'name' and 'description' keys
        api_key: API key for the provider
        provider: AI provider to use (mistral, openai, gemini)
        model: Optional model name
        chunk_size: Pages per chunk for large documents
        max_concurrent: Max parallel requests
        
    Returns:
        ClassifyResult with splits for each category
        
    Raises:
        ValueError: If configuration is invalid
        Exception: If provider is not supported
    """
    # Validate
    if not api_key or not api_key.strip():
        raise ValueError("Valid API key is required")
    if not file_path or not file_path.strip():
        raise ValueError("Valid file path is required")
    # Allow empty categories for auto-detect mode
    # if not categories:
    #     raise ValueError("At least one category is required")
    
    if provider not in ["mistral", "openai", "gemini"]:
        raise ValueError(f"Provider {provider} not supported for classification")
    
    # Convert to CategoryDescription objects if needed
    category_objs = []
    if categories:  # Only process if categories are provided
        for cat in categories:
            if isinstance(cat, CategoryDescription):
                category_objs.append(cat)
            else:
                category_objs.append(CategoryDescription(
                    name=cat["name"],
                    description=cat["description"],
                    partition_key=cat.get("partitionKey")
                ))
    
    # Create config object
    config = ClassifyConfig(
        file_path=file_path,
        api_key=api_key,
        provider=provider,
        model=model,
        categories=category_objs,
        chunk_size=chunk_size,
        max_concurrent=max_concurrent
    )
    
    # Get page count
    total_pages = _get_page_count(file_path)
    chunk_size = chunk_size or 75
    
    # Decide: single-shot or chunked
    if total_pages <= chunk_size:
        # Single-shot classification
        from .providers.mistral import process_classify_mistral
        from .providers.openai import process_classify_openai
        from .providers.gemini import process_classify_gemini
        
        if provider == "mistral":
            return await process_classify_mistral(config, page_range=(1, total_pages))
        elif provider == "openai":
            return await process_classify_openai(config, page_range=(1, total_pages))
        elif provider == "gemini":
            return await process_classify_gemini(config, page_range=(1, total_pages))
    else:
        # Chunked classification
        chunks = _chunk_pages(total_pages, chunk_size)
        
        # Import providers
        from .providers.mistral import process_classify_mistral
        from .providers.openai import process_classify_openai
        from .providers.gemini import process_classify_gemini
        
        # Create semaphore for concurrency control
        max_concurrent = config.max_concurrent or 5
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def classify_chunk(page_range: tuple[int, int]) -> ClassifyResult:
            async with semaphore:
                if provider == "mistral":
                    return await process_classify_mistral(config, page_range=page_range)
                elif provider == "openai":
                    return await process_classify_openai(config, page_range=page_range)
                elif provider == "gemini":
                    return await process_classify_gemini(config, page_range=page_range)
                else:
                    raise ValueError(f"Provider {provider} not supported")
        
        # Process all chunks concurrently
        tasks = [classify_chunk(chunk) for chunk in chunks]
        results = await asyncio.gather(*tasks)
        
        # Merge results
        return _merge_splits(results)
    
    raise ValueError(f"Provider {provider} not supported")

