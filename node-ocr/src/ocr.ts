import { OCRConfig, MistralOCRResponse, OpenAIOCRResponse, GeminiOCRResponse, LocalOCRResponse, validateConfig } from './types';
import { processOCRMistral } from './providers/mistral';
import { processOCROpenAI } from './providers/openai';
import { processOCRGemini } from './providers/gemini';
import { processOCRLocal } from './providers/local';

/**
 * Processes a document using OCR with specified provider
 * @param config OCR configuration including provider, file path, and API key
 * @returns Processed text and metadata
 */

export async function ocr(config: OCRConfig): Promise<MistralOCRResponse | OpenAIOCRResponse | GeminiOCRResponse | LocalOCRResponse> {
  // Default to mistral if no provider specified
  const provider = config.provider || 'mistral';

  // Local provider doesn't need API key validation
  if (provider !== 'local') {
    validateConfig(config);
  }

  // Route to correct provider
  switch (provider) {
    case 'mistral':
      return processOCRMistral(config);
    case 'openai':
      return processOCROpenAI(config);
    case 'gemini':
      return processOCRGemini(config);
    case 'local':
      return processOCRLocal(config);
    default:
      throw new Error(`Provider ${provider} not supported yet`);
  }
} 