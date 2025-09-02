import { OCRConfig, MistralOCRResponse, OpenAIOCRResponse, GeminiOCRResponse, validateConfig } from './types';
import { processOCRMistral } from './providers/mistral';
import { processOCROpenAI } from './providers/openai';
import { processOCRGemini } from './providers/gemini';

/**
 * Processes a document using OCR with specified provider
 * @param config OCR configuration including provider, file path, and API key
 * @returns Processed text and metadata
 */

export async function ocr(config: OCRConfig): Promise<MistralOCRResponse | OpenAIOCRResponse | GeminiOCRResponse> {
  // Default to mistral if no provider specified
  const provider = config.provider || 'mistral';

  // Validate configuration
  validateConfig(config);

  // Route to correct provider
  switch (provider) {
    case 'mistral':
      return processOCRMistral(config);
    case 'openai':
      return processOCROpenAI(config);
    case 'gemini':
      return processOCRGemini(config);
    default:
      throw new Error(`Provider ${provider} not supported yet`);
  }
} 