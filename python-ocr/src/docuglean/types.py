"""
Type definitions for Docuglean OCR Python SDK.
"""

from typing import Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Field

Provider = Literal["openai", "mistral", "huggingface", "gemini"]


def validate_config(config: Union["OCRConfig", "ExtractConfig"]) -> None:
    """Validate configuration parameters."""
    # API key is optional for Hugging Face (can use local models)
    if config.provider != "huggingface" and (not config.api_key or not config.api_key.strip()):
        raise ValueError("Valid API key is required")
    if not config.file_path or not config.file_path.strip():
        raise ValueError("Valid file path is required")
    if config.provider and config.provider not in ["mistral", "openai", "huggingface", "gemini"]:
        raise ValueError(f"Provider {config.provider} not supported")


class MistralOCRImage(BaseModel):
    """Mistral OCR image data."""
    id: str
    top_left_x: float | None = Field(alias="topLeftX")
    top_left_y: float | None = Field(alias="topLeftY")
    bottom_right_x: float | None = Field(alias="bottomRightX")
    bottom_right_y: float | None = Field(alias="bottomRightY")
    image_base64: str | None = Field(alias="imageBase64", default=None)


class MistralOCRDimensions(BaseModel):
    """Page dimensions from Mistral OCR."""
    dpi: int
    height: int
    width: int


class MistralOCRPage(BaseModel):
    """Mistral OCR page data."""
    index: int
    markdown: str
    images: list[MistralOCRImage]
    dimensions: MistralOCRDimensions | None = None


class MistralOCRResponse(BaseModel):
    """Mistral OCR response structure."""
    pages: list[MistralOCRPage]


class OpenAIUsage(BaseModel):
    """OpenAI usage statistics."""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class OpenAIOCRResponse(BaseModel):
    """OpenAI OCR response structure."""
    text: str
    model_used: str | None = None


class HuggingFaceOCRResponse(BaseModel):
    """Hugging Face OCR response structure."""
    text: str
    model_used: str
    confidence: float | None = None


class GeminiOCRResponse(BaseModel):
    """Google Gemini OCR response structure."""
    text: str
    model_used: str


class OCRPage(BaseModel):
    """Generic OCR page structure."""
    index: int
    markdown: str


class MistralOptions(BaseModel):
    """Mistral-specific options."""
    include_image_base64: bool = Field(alias="includeImageBase64", default=False)


class OpenAIOptions(BaseModel):
    """OpenAI-specific options."""
    max_tokens: int | None = Field(alias="maxTokens", default=None)


class GeminiOptions(BaseModel):
    """Gemini-specific options."""
    temperature: float | None = None
    top_p: float | None = Field(alias="topP", default=None)
    top_k: int | None = Field(alias="topK", default=None)


class OCROptions(BaseModel):
    """OCR provider-specific options."""
    mistral: MistralOptions | None = None
    openai: OpenAIOptions | None = None
    gemini: GeminiOptions | None = None


class OCRConfig(BaseModel):
    """OCR configuration."""
    file_path: str = Field(alias="filePath")
    provider: Provider | None = None
    model: str | None = None
    api_key: str | None = Field(alias="apiKey", default=None)  # Optional for HuggingFace
    prompt: str | None = None
    options: OCROptions | None = None

    model_config = ConfigDict(validate_by_name=True)


class ExtractConfig(BaseModel):
    """Extraction configuration."""
    file_path: str = Field(alias="filePath")
    api_key: str | None = Field(alias="apiKey", default=None)  # Optional for HuggingFace
    provider: Provider | None = None
    model: str | None = None
    prompt: str | None = None
    response_format: Any | None = Field(alias="responseFormat", default=None)
    system_prompt: str | None = Field(alias="systemPrompt", default=None)

    model_config = ConfigDict(validate_by_name=True)


class BaseStructuredOutput(BaseModel):
    """Base class for structured outputs."""
    pass


class StructuredExtractionResult(BaseModel):
    """Result of structured extraction."""
    raw: str
    parsed: Any


class OCRResult(BaseModel):
    """OCR processing result."""
    markdown: str
    images: list[Any]
    raw_response: MistralOCRResponse = Field(alias="rawResponse")
