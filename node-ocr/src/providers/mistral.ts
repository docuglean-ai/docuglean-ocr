import { Mistral } from '@mistralai/mistralai';
import { OCRConfig, MistralOCRResponse, ExtractConfig, BaseStructuredOutput, StructuredExtractionResult } from '../types';
import { isURL, encodePdf, encodeImage, getSignedMistralUrl } from '../utils';
import path from 'path';

type DocumentURLChunk = {
  type: 'document_url';
  documentUrl: string;
};

type ImageURLChunk = {
  type: 'image_url';
  imageUrl: string;
};

type TextChunk = {
  type: 'text';
  text: string;
};

type MessageContent = (DocumentURLChunk | ImageURLChunk | TextChunk)[];

export async function processOCRMistral(config: OCRConfig): Promise<MistralOCRResponse> {
  const client = new Mistral({ apiKey: config.apiKey });
  
  try {
    const fileExtension = path.extname(config.filePath).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(fileExtension);

    let document: DocumentURLChunk | ImageURLChunk;

    // Step 1: if the file is a URL, use the URL, otherwise get the signed URL
    if (isURL(config.filePath)) {
      document = isImage 
        ? { type: 'image_url', imageUrl: config.filePath }
        : { type: 'document_url', documentUrl: config.filePath };
    } else {
      // Step 2: if the file is an image, encode it to base64, otherwise encode the PDF
      if (isImage) {
        const base64Image = await encodeImage(config.filePath);
        document = {
          type: 'image_url',
          imageUrl: `data:image/${fileExtension.slice(1)};base64,${base64Image}`
        };
      } else {
        const encodedPdf = await encodePdf(config.filePath);
        document = {
          type: 'document_url',
          documentUrl: encodedPdf
        };
      }
    }

    const ocrResponse = await client.ocr.process({
      model: config.model || 'mistral-ocr-latest',
      document,
      includeImageBase64: config.options?.mistral?.includeImageBase64
    });

    if (!ocrResponse) {
      throw new Error('No response from Mistral OCR');
    }

    return ocrResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Mistral OCR failed: ${error.message}`);
    }
    throw new Error('Mistral OCR failed: Unknown error');
  }
}

export async function processDocExtractionMistral(
  config: ExtractConfig
): Promise<StructuredExtractionResult<BaseStructuredOutput>> {
  const client = new Mistral({ apiKey: config.apiKey });
  
  try {
    let documentUrl: string;

    // Step 1: if the file is a URL, use the URL, otherwise get the signed URL
    if (isURL(config.filePath)) {
      documentUrl = config.filePath;
    } else {
      documentUrl = await getSignedMistralUrl(config.filePath, config.apiKey);
    }

    const content: MessageContent = [
      {
        type: 'text',
        text: config.prompt || 'Extract the main content from this document.'
      },
      {
        type: 'document_url',
        documentUrl
      }
    ];

    const messages = [
      ...(config.systemPrompt ? [{
        role: 'system' as const,
        content: config.systemPrompt
      }] : []),
      {
        role: 'user' as const,
        content
      }
    ];

    // Use structured output with Zod schema
    const response = await client.chat.parse({
      model: config.model || 'mistral-small-latest',
      messages,
      responseFormat: config.responseFormat,
      temperature: 0 // Better for structured output
    });

    if (!response?.choices?.[0]?.message) {
      throw new Error('No valid response from Mistral document extraction');
    }

    return {
      raw: response.choices[0].message.content as string, // raw output from Mistral
      parsed: response.choices[0].message.parsed as BaseStructuredOutput,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Mistral document extraction failed: ${error.message}`);
    }
    throw new Error('Mistral document extraction failed: Unknown error');
  }
} 