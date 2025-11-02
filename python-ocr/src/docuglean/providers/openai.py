"""
OpenAI provider implementation for Docuglean OCR.
"""


from ..types import ExtractConfig, OCRConfig, OpenAIOCRResponse, StructuredExtractionResult
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
