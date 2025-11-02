import { GoogleGenAI } from "@google/genai";
import { OCRConfig, GeminiOCRResponse, ExtractConfig, BaseStructuredOutput, StructuredExtractionResult } from '../types';
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
