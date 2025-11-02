"""Simple document parsers for Docuglean Python SDK."""

from .docx import parse_docx
from .pptx import parse_pptx
from .spreadsheet import parse_spreadsheet
from .pdf import parse_pdf
from .csv import parse_csv

__all__ = [
    "parse_docx",
    "parse_pptx",
    "parse_spreadsheet",
    "parse_pdf",
    "parse_csv",
]



