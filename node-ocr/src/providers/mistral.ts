import { Mistral } from '@mistralai/mistralai';
import { OCRConfig, MistralOCRResponse, ExtractConfig, BaseStructuredOutput, StructuredExtractionResult, ClassifyConfig, ClassifyResult, Split } from '../types';
import { isURL, encodePdf, encodeImage, getSignedMistralUrl } from '../utils';
import path from 'path';
import fs from 'fs';

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

export async function processClassifyMistral(
  config: ClassifyConfig,
  pageRange: [number, number]
): Promise<ClassifyResult> {
  const client = new Mistral({ apiKey: config.apiKey });
  
  try {
    // Extract text from the specified page range
    const [startPage, endPage] = pageRange;
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(config.filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    // pdf-parse extracts all text; we'll include it with page range context
    // For better per-page extraction, consider using pdf-lib or pdfjs-dist
    const fullText = `--- Pages ${startPage} to ${endPage} ---\n${pdfData.text}`;
    
    // Build classification prompt
    const categoriesDesc = config.categories
      .map(cat => `- ${cat.name}: ${cat.description}`)
      .join('\n');
    
    const prompt = `Classify the following document pages into the appropriate categories. 
For each page, determine which category it belongs to based on the descriptions below.

Categories:
${categoriesDesc}

Document (pages ${startPage} to ${endPage}):
${fullText}

Return a JSON object with the following structure:
{
  "classifications": [
    {
      "page": <page_number>,
      "category": "<category_name>",
      "confidence": <0.0 to 1.0>
    }
  ]
}

Classify each page into exactly one category. Use confidence scores above 0.8 for clear matches.`;

    const response = await client.chat.complete({
      model: config.model || 'mistral-small-latest',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      responseFormat: { type: 'json_object' },
      temperature: 0.3
    });
    
    const messageContent = response?.choices?.[0]?.message?.content;
    if (!messageContent || typeof messageContent !== 'string') {
      throw new Error('No valid response from Mistral classification');
    }
    
    // Parse the response
    const resultJson = JSON.parse(messageContent);
    const classifications = resultJson.classifications || [];
    
    // Group pages by category
    const categoryPages: Record<string, number[]> = {};
    const categoryConfidence: Record<string, number[]> = {};
    
    config.categories.forEach(cat => {
      categoryPages[cat.name] = [];
      categoryConfidence[cat.name] = [];
    });
    
    for (const classification of classifications) {
      const page = classification.page;
      const category = classification.category;
      const confidence = classification.confidence || 0.5;
      
      if (categoryPages[category] && page) {
        categoryPages[category].push(page);
        categoryConfidence[category].push(confidence);
      }
    }
    
    // Build splits
    const splits: Split[] = [];
    for (const cat of config.categories) {
      const pages = categoryPages[cat.name].sort((a, b) => a - b);
      if (pages.length > 0) {
        // Determine overall confidence
        const avgConf = categoryConfidence[cat.name].reduce((a, b) => a + b, 0) / categoryConfidence[cat.name].length || 0.5;
        const conf = avgConf >= 0.8 ? 'high' : 'low';
        
        splits.push({
          name: cat.name,
          pages,
          conf,
          partitions: null // TODO: Implement partition_key support
        });
      }
    }
    
    return { splits };
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Mistral classification failed: ${error.message}`);
    }
    throw new Error('Mistral classification failed: Unknown error');
  }
} 