"""
Utility functions for Docuglean OCR Python SDK.
"""

import base64
from pathlib import Path
from urllib.parse import urlparse


def is_url(path: str) -> bool:
    """Check if a path is a URL."""
    try:
        result = urlparse(path)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def encode_pdf(pdf_path: str) -> str:
    """
    Encode a PDF file to base64.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Base64 encoded PDF with data URL prefix

    Raises:
        FileNotFoundError: If the PDF file is not found
        Exception: If encoding fails
    """
    try:
        with open(pdf_path, "rb") as pdf_file:
            base64_pdf = base64.b64encode(pdf_file.read()).decode('utf-8')
            return f"data:application/pdf;base64,{base64_pdf}"
    except FileNotFoundError:
        raise FileNotFoundError(f"Error: The file {pdf_path} was not found.")
    except Exception as e:
        raise Exception(f"Error encoding PDF: {e}")


def encode_image(image_path: str) -> str:
    """
    Encode an image file to base64.

    Args:
        image_path: Path to the image file

    Returns:
        Base64 encoded image with data URL prefix

    Raises:
        FileNotFoundError: If the image file is not found
        Exception: If encoding fails
    """
    try:
        # Get file extension for MIME type
        file_extension = Path(image_path).suffix.lower().lstrip('.')

        # Map common extensions to MIME types
        mime_types = {
            'jpg': 'jpeg',
            'jpeg': 'jpeg',
            'png': 'png',
            'gif': 'gif',
            'webp': 'webp',
            'bmp': 'bmp'
        }

        mime_type = mime_types.get(file_extension, 'jpeg')

        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            return f"data:image/{mime_type};base64,{base64_image}"
    except FileNotFoundError:
        raise FileNotFoundError(f"Error: The file {image_path} was not found.")
    except Exception as e:
        raise Exception(f"Error encoding image: {e}")


async def get_signed_mistral_url(file_path: str, api_key: str) -> str:
    """
    Upload a file to Mistral and get a signed URL.

    Args:
        file_path: Path to the file to upload
        api_key: Mistral API key

    Returns:
        Signed URL for the uploaded file

    Raises:
        Exception: If upload or URL generation fails
    """
    from mistralai import Mistral

    try:
        client = Mistral(api_key=api_key)

        # Upload the file
        with open(file_path, "rb") as file:
            uploaded_file = client.files.upload(
                file={
                    "file_name": Path(file_path).name,
                    "content": file,
                },
                purpose="ocr"
            )

        # Get signed URL
        signed_url = client.files.get_signed_url(file_id=uploaded_file.id)
        return signed_url.url

    except Exception as e:
        raise Exception(f"Error uploading file to Mistral: {e}")


def get_file_extension(file_path: str) -> str:
    """Get the file extension from a file path."""
    return Path(file_path).suffix.lower()


def is_image_file(file_path: str) -> bool:
    """Check if a file is an image based on its extension."""
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.avif'}
    return get_file_extension(file_path) in image_extensions


def get_mime_type_from_extension(file_path: str) -> str:
    """
    Get MIME type from file extension.

    Args:
        file_path: Path to the file

    Returns:
        MIME type string
    """
    ext = Path(file_path).suffix.lower()

    if is_image_file(file_path):
        return {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.gif': 'image/gif',
            '.webp': 'image/webp', '.bmp': 'image/bmp',
            '.tiff': 'image/tiff', '.tif': 'image/tiff',
            '.avif': 'image/avif'
        }.get(ext, 'image/jpeg')
    else:
        return 'application/pdf'
