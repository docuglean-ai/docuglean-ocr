"""
OpenAI provider implementation for Docuglean OCR.
"""

import json

from ..types import (
    ClassifyConfig,
    ClassifyResult,
    ExtractConfig,
    OCRConfig,
    OpenAIOCRResponse,
    Split,
    StructuredExtractionResult,
)
from ..utils import encode_image, is_image_file, is_url


async def process_ocr_openai(config: OCRConfig) -> OpenAIOCRResponse:
    """
    Process OCR using OpenAI.

    Args:
        config: OCR configuration

    Returns:
        OpenAI OCR response

    Raises:
        Exception: If processing fails
    """
    from openai import OpenAI

    client = OpenAI(api_key=config.api_key)

    try:
        # Build the content based on file type and location
        content = [
            {
                "type": "input_text",
                "text": config.prompt or "Extract all text from this document using OCR."
            }
        ]

        # Handle different input types
        if is_url(config.file_path):
            if is_image_file(config.file_path):
                content.append({
                    "type": "input_image",
                    "image_url": config.file_path
                })
            else:
                content.append({
                    "type": "input_file",
                    "file_url": config.file_path
                })
        else:
            # Local file
            if is_image_file(config.file_path):
                # Encode image to base64 (reuse existing utility)
                encoded_image = encode_image(config.file_path)
                content.append({
                    "type": "input_image",
                    "image_url": encoded_image
                })
            else:
                # Upload PDF/document file
                file = client.files.create(
                    file=open(config.file_path, "rb"),
                    purpose="user_data"
                )
                content.append({
                    "type": "input_file",
                    "file_id": file.id
                })

        # Make the request
        response = client.responses.create(
            model=config.model or "gpt-4.1",
            input=[{
                "role": "user",
                "content": content
            }]
        )

        if not response or not response.output_text:
            raise Exception("No response from OpenAI OCR")

        # Convert to our OpenAIOCRResponse format
        return OpenAIOCRResponse(
            text=response.output_text,
            model_used=config.model or "gpt-4.1"
        )

    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"OpenAI OCR failed: {error!s}")
        raise Exception("OpenAI OCR failed: Unknown error")


async def process_doc_extraction_openai(config: ExtractConfig) -> StructuredExtractionResult:
    """
    Process document extraction using OpenAI.

    Args:
        config: Extraction configuration

    Returns:
        Extracted text or structured data

    Raises:
        Exception: If processing fails
    """
    from openai import OpenAI

    client = OpenAI(api_key=config.api_key)

    try:
        # Build the content based on file type and location
        content = [
            {
                "type": "input_text",
                "text": config.prompt or "Extract the main content from this document."
            }
        ]

        # Handle different input types
        if is_url(config.file_path):
            if is_image_file(config.file_path):
                content.append({
                    "type": "input_image",
                    "image_url": config.file_path
                })
            else:
                content.append({
                    "type": "input_file",
                    "file_url": config.file_path
                })
        else:
            # Local file
            if is_image_file(config.file_path):
                # Encode image to base64 (reuse existing utility)
                encoded_image = encode_image(config.file_path)
                content.append({
                    "type": "input_image",
                    "image_url": encoded_image
                })
            else:
                # Upload PDF/document file
                file = client.files.create(
                    file=open(config.file_path, "rb"),
                    purpose="user_data"
                )
                content.append({
                    "type": "input_file",
                    "file_id": file.id
                })

        # Build input messages
        input_messages = []
        if config.system_prompt:
            input_messages.append({
                "role": "system",
                "content": config.system_prompt
            })

        input_messages.append({
            "role": "user",
            "content": content
        })

        # Use structured output with Pydantic schema
        response = client.responses.parse(
            model=config.model or "gpt-4o-mini",
            input=input_messages,
            text_format=config.response_format
        )

        if not response:
            raise Exception("No response from OpenAI document extraction")

        return StructuredExtractionResult(
            raw=str(response.output_parsed),  # Convert parsed object to string
            parsed=response.output_parsed,
        )

    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"OpenAI document extraction failed: {error!s}")
        raise Exception("OpenAI document extraction failed: Unknown error")


async def process_classify_openai(
    config: ClassifyConfig,
    page_range: tuple[int, int]
) -> ClassifyResult:
    """
    Process document classification using OpenAI.
    
    Args:
        config: Classification configuration
        page_range: Tuple of (start_page, end_page) to classify (1-indexed)
        
    Returns:
        ClassifyResult with splits for each category
        
    Raises:
        Exception: If processing fails
    """
    from openai import OpenAI
    import pypdf
    
    client = OpenAI(api_key=config.api_key)
    
    try:
        # Extract text from the specified page range
        start_page, end_page = page_range
        page_texts = []
        
        with open(config.file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            for page_num in range(start_page - 1, end_page):  # Convert to 0-indexed
                if page_num < len(reader.pages):
                    page = reader.pages[page_num]
                    text = page.extract_text()
                    page_texts.append(f"--- Page {page_num + 1} ---\n{text}")
        
        full_text = "\n\n".join(page_texts)
        
        # Build classification prompt
        if config.categories:
            # User-specified categories
            categories_desc = "\n".join([
                f"- {cat.name}: {cat.description}"
                for cat in config.categories
            ])
            
            prompt = f"""Classify the following document pages into the appropriate categories. 
For each page, determine which category it belongs to based on the descriptions below.

Categories:
{categories_desc}

Document (pages {start_page} to {end_page}):
{full_text}

Return a JSON object with the following structure:
{{
  "classifications": [
    {{
      "page": <page_number>,
      "category": "<category_name>",
      "confidence": <0.0 to 1.0>
    }}
  ]
}}

Classify each page into exactly one category. Use confidence scores above 0.8 for clear matches."""
        else:
            # Auto-detect mode: let OpenAI determine categories
            prompt = f"""Analyze the following document pages and classify them into appropriate document types based on their content.
Use your knowledge to determine the most appropriate document category for each page (e.g., Invoice, Receipt, Contract, Report, Letter, Form, etc.).

Document (pages {start_page} to {end_page}):
{full_text}

Return a JSON object with the following structure:
{{
  "classifications": [
    {{
      "page": <page_number>,
      "category": "<category_name>",
      "confidence": <0.0 to 1.0>
    }}
  ]
}}

Classify each page into exactly one category. Use descriptive category names that accurately represent the document type. Use confidence scores above 0.8 for clear matches."""

        response = client.chat.completions.create(
            model=config.model or "gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        if not response or not response.choices or not response.choices[0].message:
            raise Exception("No valid response from OpenAI classification")
        
        # Parse the response
        result_json = json.loads(response.choices[0].message.content)
        classifications = result_json.get("classifications", [])
        
        if config.categories:
            # User-specified categories: group pages by predefined categories
            category_pages: dict[str, list[int]] = {cat.name: [] for cat in config.categories}
            category_confidence: dict[str, list[float]] = {cat.name: [] for cat in config.categories}
            
            for classification in classifications:
                page = classification.get("page")
                category = classification.get("category")
                confidence = classification.get("confidence", 0.5)
                
                if category in category_pages and page:
                    category_pages[category].append(page)
                    category_confidence[category].append(confidence)
            
            # Build splits
            splits = []
            for cat in config.categories:
                pages = sorted(category_pages[cat.name])
                if pages:
                    # Determine overall confidence
                    avg_conf = sum(category_confidence[cat.name]) / len(category_confidence[cat.name]) if category_confidence[cat.name] else 0.5
                    conf = "high" if avg_conf >= 0.8 else "low"
                    
                    splits.append(Split(
                        name=cat.name,
                        pages=pages,
                        conf=conf,
                        partitions=None  # TODO: Implement partition_key support
                    ))
        else:
            # Auto-detect mode: group pages by detected categories
            category_pages: dict[str, list[int]] = {}
            category_confidence: dict[str, list[float]] = {}
            
            for classification in classifications:
                page = classification.get("page")
                category = classification.get("category")
                confidence = classification.get("confidence", 0.5)
                
                if category and page:
                    if category not in category_pages:
                        category_pages[category] = []
                        category_confidence[category] = []
                    category_pages[category].append(page)
                    category_confidence[category].append(confidence)
            
            # Build splits from detected categories
            splits = []
            for category_name, pages in category_pages.items():
                pages = sorted(pages)
                if pages:
                    # Determine overall confidence
                    avg_conf = sum(category_confidence[category_name]) / len(category_confidence[category_name]) if category_confidence[category_name] else 0.5
                    conf = "high" if avg_conf >= 0.8 else "low"
                    
                    splits.append(Split(
                        name=category_name,
                        pages=pages,
                        conf=conf,
                        partitions=None
                    ))
        
        return ClassifyResult(splits=splits)
        
    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"OpenAI classification failed: {error!s}")
        raise Exception("OpenAI classification failed: Unknown error")
