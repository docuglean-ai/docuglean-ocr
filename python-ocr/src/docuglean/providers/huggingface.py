"""
Hugging Face provider implementation for Docuglean OCR.
Uses AutoModelForVision2Seq for universal VLM support.
"""

import json
import re

from ..types import ExtractConfig, HuggingFaceOCRResponse, OCRConfig, StructuredExtractionResult
from ..utils import encode_image, is_url


def _process_single_image_basic(model_name: str, file_path: str, prompt: str, use_pipeline: bool = True) -> str:
    """Process single image with any VLM model."""
    from transformers import AutoModelForVision2Seq, AutoProcessor, pipeline

    # Handle image path - URL directly, local file encode to base64
    if is_url(file_path) or file_path.startswith("data:image"):
        image_input = {"type": "image", "url": file_path}
    else:
        # Encode local file to base64
        encoded = encode_image(file_path)
        image_input = {"type": "image", "url": f"data:image/jpeg;base64,{encoded}"}

    # Build messages
    messages = [{
        "role": "user",
        "content": [
            image_input,
            {"type": "text", "text": prompt}
        ]
    }]

    if use_pipeline:
        # Use pipeline (faster, simpler)
        pipe = pipeline("image-text-to-text", model=model_name)
        result = pipe(messages)

        # Extract text from pipeline result
        if isinstance(result, list) and len(result) > 0:
            # Get the generated text from the result
            item = result[0]
            if isinstance(item, dict):
                # Look for common response keys
                text = item.get("generated_text") or item.get("text") or str(item)
                return text
            elif isinstance(item, str):
                return item
        elif isinstance(result, str):
            return result

        # Fallback: convert to string
        return str(result)
    else:
        # Use manual model loading (more control)
        model = AutoModelForVision2Seq.from_pretrained(model_name)
        processor = AutoProcessor.from_pretrained(model_name)

        # Process with model
        inputs = processor.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt"
        )

        # Generate response
        outputs = model.generate(**inputs, max_new_tokens=512)
        result = processor.decode(outputs[0][inputs["input_ids"].shape[-1]:])

        return result


async def process_ocr_huggingface(config: OCRConfig) -> HuggingFaceOCRResponse:
    """
    Process OCR using Hugging Face vision-language models.

    Args:
        config: OCR configuration

    Returns:
        Hugging Face OCR response

    Raises:
        Exception: If processing fails
    """
    try:
        # Default model if none specified (use smaller, faster model)
        model_name = config.model or "HuggingFaceTB/SmolVLM-Instruct"

        # Prepare prompt
        prompt = config.prompt or "Extract all text from this image using OCR. Return only the text content."

        # Use shared function with manual approach (pipeline has issues)
        result = _process_single_image_basic(model_name, config.file_path, prompt, use_pipeline=False)

        return HuggingFaceOCRResponse(
            text=result,
            model_used=model_name,
            confidence=None
        )

    except ImportError as e:
        raise Exception(f"Required dependencies not installed: {e}. Please install with: uv add transformers")
    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"Hugging Face OCR failed: {error!s}")
        raise Exception("Hugging Face OCR failed: Unknown error")


async def process_doc_extraction_huggingface(config: ExtractConfig) -> StructuredExtractionResult:
    """
    Process document extraction using Hugging Face vision-language models.

    Args:
        config: Extraction configuration

    Returns:
        Extracted text or structured data

    Raises:
        Exception: If processing fails
    """
    try:
        # Default model if none specified (use smaller, faster model)
        model_name = config.model or "HuggingFaceTB/SmolVLM-Instruct"

        # Prepare prompt for structured output
        structured_prompt = f"""{config.prompt or "Extract all information from this document"}

        Return response as valid JSON only. Example format:
        {{
            "objects": ["detected objects"],
            "text": "any text in document",
            "description": "brief description"
        }}"""

        # Use shared function with manual approach (pipeline has issues)
        result = _process_single_image_basic(model_name, config.file_path, structured_prompt, use_pipeline=False)

        # Handle structured output
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                parsed_json = json.loads(json_match.group())
                return StructuredExtractionResult(
                    raw=result,
                    parsed=parsed_json
                )
        except (json.JSONDecodeError, AttributeError) as e:
            raise Exception(f"Failed to parse structured response from HuggingFace: {e}")

        # Fallback: return raw response if JSON parsing fails
        return StructuredExtractionResult(
            raw=result,
            parsed={"raw_response": result}
        )

    except ImportError as e:
        raise Exception(f"Required dependencies not installed: {e}. Please install with: uv add transformers")
    except Exception as error:
        if isinstance(error, Exception):
            raise Exception(f"Hugging Face document extraction failed: {error!s}")
        raise Exception("Hugging Face document extraction failed: Unknown error")
