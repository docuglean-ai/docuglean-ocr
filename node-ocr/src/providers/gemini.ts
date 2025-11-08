import { GoogleGenAI } from "@google/genai";
import { OCRConfig, GeminiOCRResponse, ExtractConfig, BaseStructuredOutput, StructuredExtractionResult, ClassifyConfig, ClassifyResult, Split } from '../types';
import { isURL, encodePdf, encodeImage, getFileType } from '../utils';
import * as fs from 'fs';
import path from 'path';

export async function processOCRGemini(config: OCRConfig): Promise<GeminiOCRResponse> {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });

  try {
    const fileType = getFileType(config.filePath);
    let contents: any[];

    switch (fileType) {
      case 'image': {
        if (isURL(config.filePath)) {
          // For URLs, we need to fetch the image first
          const response = await fetch(config.filePath);
          const arrayBuffer = await response.arrayBuffer();
          
          contents = [
            { text: config.prompt || "Extract all text from this image using OCR." },
            {
              inlineData: {
                mimeType: response.headers.get('content-type') || 'image/jpeg',
                data: Buffer.from(arrayBuffer).toString("base64")
              }
            }
          ];
        } else {
          // Local image file
          const imageData = fs.readFileSync(config.filePath);
          const mimeType = `image/${path.extname(config.filePath).slice(1)}`;
          
          contents = [
            { text: config.prompt || "Extract all text from this image using OCR." },
            {
              inlineData: {
                mimeType,
                data: imageData.toString("base64")
              }
            }
          ];
        }
        break;
      }

      case 'pdf': {
        if (isURL(config.filePath)) {
          // For PDF URLs, fetch and encode
          const response = await fetch(config.filePath);
          const arrayBuffer = await response.arrayBuffer();
          
          contents = [
            { text: config.prompt || "Extract all text from this PDF document using OCR." },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: Buffer.from(arrayBuffer).toString("base64")
              }
            }
          ];
        } else {
          // Local PDF file
          const pdfData = fs.readFileSync(config.filePath);
          
          contents = [
            { text: config.prompt || "Extract all text from this PDF document using OCR." },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfData.toString("base64")
              }
            }
          ];
        }
        break;
      }

      default:
        throw new Error(`Unsupported file type: ${path.extname(config.filePath)}`);
    }

    const response = await ai.models.generateContent({
      model: config.model || "gemini-2.5-flash",
      contents: contents
    });

    if (!response.text) {
      throw new Error('No response from Gemini OCR process');
    }

    return {
      text: response.text,
      model_used: config.model || "gemini-2.5-flash"
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Gemini OCR process failed: ${error.message}`);
    }
    throw new Error('Gemini OCR process failed: Unknown error');
  }
}

export async function processDocExtractionGemini(config: ExtractConfig): Promise<StructuredExtractionResult<BaseStructuredOutput>> {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });

  try {
    const fileType = getFileType(config.filePath);
    let contents: any[];

    switch (fileType) {
      case 'image': {
        if (isURL(config.filePath)) {
          // For URLs, we need to fetch the image first
          const response = await fetch(config.filePath);
          const arrayBuffer = await response.arrayBuffer();
          
          contents = [
            { text: config.prompt || "Extract information from this image." },
            {
              inlineData: {
                mimeType: response.headers.get('content-type') || 'image/jpeg',
                data: Buffer.from(arrayBuffer).toString("base64")
              }
            }
          ];
        } else {
          // Local image file
          const imageData = fs.readFileSync(config.filePath);
          const mimeType = `image/${path.extname(config.filePath).slice(1)}`;
          
          contents = [
            { text: config.prompt || "Extract information from this image." },
            {
              inlineData: {
                mimeType,
                data: imageData.toString("base64")
              }
            }
          ];
        }
        break;
      }

      case 'pdf': {
        if (isURL(config.filePath)) {
          // For PDF URLs, fetch and encode
          const response = await fetch(config.filePath);
          const arrayBuffer = await response.arrayBuffer();
          
          contents = [
            { text: config.prompt || "Extract information from this PDF document." },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: Buffer.from(arrayBuffer).toString("base64")
              }
            }
          ];
        } else {
          // Local PDF file
          const pdfData = fs.readFileSync(config.filePath);
          
          contents = [
            { text: config.prompt || "Extract information from this PDF document." },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfData.toString("base64")
              }
            }
          ];
        }
        break;
      }

      default:
        throw new Error(`Unsupported file type: ${path.extname(config.filePath)}`);
    }

    // For structured output, we need to use the schema in the config
    const structuredConfig = {
      responseMimeType: "application/json",
      responseSchema: config.responseFormat
    };

    const response = await ai.models.generateContent({
      model: config.model || "gemini-2.5-flash",
      contents: contents,
      config: structuredConfig
    });

    if (!response.text) {
      throw new Error('No response from Gemini document extraction');
    }

    try {
      const parsed = JSON.parse(response.text);
      return {
        raw: response.text,
        parsed: parsed,
      };
    } catch (parseError) {
      throw new Error(`Failed to parse structured response from Gemini: ${parseError}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Gemini document extraction failed: ${error.message}`);
    }
    throw new Error('Gemini document extraction failed: Unknown error');
  }
}

export async function processClassifyGemini(
  config: ClassifyConfig,
  pageRange: [number, number]
): Promise<ClassifyResult> {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  
  try {
    // Extract text from the specified page range
    const [startPage, endPage] = pageRange;
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(config.filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    // pdf-parse extracts all text; we'll include it with page range context
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

    const response = await ai.models.generateContent({
      model: config.model || 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });
    
    if (!response?.text) {
      throw new Error('No valid response from Gemini classification');
    }
    
    // Parse the response
    const resultJson = JSON.parse(response.text);
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
      throw new Error(`Gemini classification failed: ${error.message}`);
    }
    throw new Error('Gemini classification failed: Unknown error');
  }
}
