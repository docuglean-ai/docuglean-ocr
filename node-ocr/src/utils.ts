import fs from 'fs';
import path from 'path';
import { MistralOCRResponse, OCRResult } from './types';
import { Mistral } from '@mistralai/mistralai';

// Export document parsers as utilities
export { 
  parseDocx,
  parsePptx, 
  parseSpreadsheet,
  parseOdt,
  parseOdp,
  parseOds,
  parseCsv,
  parsePdf,
  pdfToImages
} from './parsers/index';
export { parseDocumentLocal } from './providers/local';

export function isURL(filePath: string): boolean {
  return filePath.startsWith('http://') || filePath.startsWith('https://');
}

export function getFileType(filePath: string): 'image' | 'pdf' | 'unknown' {
  const extension = path.extname(filePath).toLowerCase();
  
  switch (extension) {
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.webp':
      return 'image';
    case '.pdf':
      return 'pdf';
    default:
      return 'unknown';
  }
}

export async function encodePdf(filePath: string): Promise<string> {
  try {
    // Read the PDF file as a buffer
    const pdfBuffer = fs.readFileSync(filePath);
    
    // Convert the buffer to a Base64-encoded string
    const base64Pdf = pdfBuffer.toString('base64');
    return `data:application/pdf;base64,${base64Pdf}`;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to encode PDF: ${error.message}`);
    }
    throw new Error('Failed to encode PDF: Unknown error');
  }
}

export async function encodeImage(filePath: string): Promise<string> {
  try {
    // Read the image file as a buffer
    const imageBuffer = fs.readFileSync(filePath);

    // Convert the buffer to a Base64-encoded string
    const base64Image = imageBuffer.toString('base64');
    return base64Image;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to encode image: ${error.message}`);
    }
    throw new Error('Failed to encode image: Unknown error');
  }
}

export function handleMistralOCRResponse(response: MistralOCRResponse): OCRResult {
  if (!response.pages || response.pages.length === 0) {
    throw new Error('No pages found in OCR response');
  }

  // Get markdown content from all pages
  const markdownContent = response.pages
    .sort((a, b) => a.index - b.index)
    .map(page => page.markdown)
    .join('\n\n');

  // Get image information
  const images = response.pages.flatMap(page => page.images);

  return {
    markdown: markdownContent,
    images,
    rawResponse: response
  };
}

export async function getSignedMistralUrl(filePath: string, apiKey: string): Promise<string> {
  try {
    const client = new Mistral({ apiKey });
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const uploadedFile = await client.files.upload({
      file: {
        fileName,
        content: fileContent,
      },
      purpose: "ocr"
    });

    const signedUrl = await client.files.getSignedUrl({
      fileId: uploadedFile.id,
    });

    return signedUrl.url;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }
    throw new Error('Failed to get signed URL: Unknown error');
  }
} 