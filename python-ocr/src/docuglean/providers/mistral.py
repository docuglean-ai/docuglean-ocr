"""
Mistral AI provider implementation for Docuglean OCR.
"""

import json

from typing_extensions import TypedDict

from ..types import (
    ClassifyConfig,
    ClassifyResult,
    ExtractConfig,
    MistralOCRResponse,
    OCRConfig,
    Partition,
    Split,
    StructuredExtractionResult,
)
from ..utils import encode_image, encode_pdf, get_signed_mistral_url, is_image_file, is_url


class DocumentURLChunk(TypedDict):
    """Document URL chunk for Mistral OCR."""
    type: str  # Literal["document_url"]
    document_url: str


class ImageURLChunk(TypedDict):
    """Image URL chunk for Mistral OCR."""
    type: str  # Literal["image_url"]
    image_url: str


async def process_ocr_mistral(config: OCRConfig) -> MistralOCRResponse:
    """
    Process OCR using Mistral AI.

    Args:
        config: OCR configuration

    Returns:
        Mistral OCR response

    Raises:
        Exception: If processing fails
    """
    from mistralai import Mistral

    client = Mistral(api_key=config.api_key)

    try:
        is_image = is_image_file(config.file_path)
        document: DocumentURLChunk | ImageURLChunk

        # Step 1: if the file is a URL, use the URL, otherwise encode to base64
        if is_url(config.file_path):
            if is_image:
                document = ImageURLChunk(
                    type="image_url",
                    image_url=config.file_path
                )
            else:
                document = DocumentURLChunk(
                    type="document_url",
                    document_url=config.file_path
                )
        else:
            # Step 2: if the file is an image, encode it to base64, otherwise encode the PDF
            if is_image:
                encoded_image = encode_image(config.file_path)
                document = ImageURLChunk(
                    type="image_url",
                    image_url=encoded_image
                )
            else:
                encoded_pdf = encode_pdf(config.file_path)
                document = DocumentURLChunk(
                    type="document_url",
                    document_url=encoded_pdf
                )

        # Process OCR with Mistral
        ocr_response = client.ocr.process(
            model=config.model or "mistral-ocr-latest",
            document=document,
            include_image_base64=config.options.mistral.include_image_base64 if config.options and config.options.mistral else True
        )

        if not ocr_response:
            raise Exception("No response from Mistral OCR")

        # Convert the response to our MistralOCRResponse format
        return MistralOCRResponse.model_validate(ocr_response.model_dump())

    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"Mistral OCR failed: {error!s}")
        raise Exception("Mistral OCR failed: Unknown error")


async def process_doc_extraction_mistral(config: ExtractConfig) -> StructuredExtractionResult:
    """
    Process document extraction using Mistral AI.

    Args:
        config: Extraction configuration

    Returns:
        Extracted text or structured data

    Raises:
        Exception: If processing fails
    """
    from mistralai import Mistral

    client = Mistral(api_key=config.api_key)

    try:
        # Step 1: if the file is a URL, use the URL, otherwise get the signed URL
        if is_url(config.file_path):
            document_url = config.file_path
        else:
            document_url = await get_signed_mistral_url(config.file_path, config.api_key)

        # Step 2: Build the content for the message
        content = [
            {
                "type": "text",
                "text": config.prompt or "Extract the main content from this document."
            },
            {
                "type": "document_url",
                "document_url": document_url
            }
        ]

        # Step 3: Build messages array with optional system prompt
        messages = []
        if config.system_prompt:
            messages.append({
                "role": "system",
                "content": config.system_prompt
            })

        messages.append({
            "role": "user",
            "content": content
        })

        # Use structured output with Pydantic schema
        response = client.chat.complete(
            model=config.model or "mistral-small-latest",
            messages=messages,
            response_format={
                "type": "json_object"
            },
            temperature=0  # Better for structured output
        )

        if not response or not response.choices or not response.choices[0].message:
            raise Exception("No valid response from Mistral document extraction")

        # For structured output, we need to parse the JSON response
        try:
            parsed_data = json.loads(response.choices[0].message.content)
            return StructuredExtractionResult(
                raw=response.choices[0].message.content,
                parsed=parsed_data,
            )
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse structured response from Mistral: {e}")

    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"Mistral document extraction failed: {error!s}")
        raise Exception("Mistral document extraction failed: Unknown error")


async def process_classify_mistral(
    config: ClassifyConfig,
    page_range: tuple[int, int]
) -> ClassifyResult:
    """
    Process document classification using Mistral AI.
    
    Args:
        config: Classification configuration
        page_range: Tuple of (start_page, end_page) to classify (1-indexed)
        
    Returns:
        ClassifyResult with splits for each category
        
    Raises:
        Exception: If processing fails
    """
    from mistralai import Mistral
    import pypdf
    
    client = Mistral(api_key=config.api_key)
    
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

        response = client.chat.complete(
            model=config.model or "mistral-small-latest",
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
            raise Exception("No valid response from Mistral classification")
        
        # Parse the response
        result_json = json.loads(response.choices[0].message.content)
        classifications = result_json.get("classifications", [])
        
        # Group pages by category
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
        
        return ClassifyResult(splits=splits)
        
    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"Mistral classification failed: {error!s}")
        raise Exception("Mistral classification failed: Unknown error")
