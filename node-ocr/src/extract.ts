import { ExtractConfig, BaseStructuredOutput, validateConfig } from './types';
import { processDocExtractionMistral } from './providers/mistral';
import { processDocExtractionOpenAI } from './providers/openai';
import { processDocExtractionGemini } from './providers/gemini';
import { parseDocumentLocal } from './providers/local';

/**
 * Extracts structured information from a document using AI providers or local parsing
 * @param config Extraction configuration including provider, file path, API key, and response format schema
 * @returns Structured data according to the provided schema
 */
export async function extract<T extends BaseStructuredOutput>(config: ExtractConfig): Promise<T> {
  const provider = config.provider || 'mistral';

  // Local provider doesn't need API key validation
  if (provider !== 'local') {
    validateConfig(config);
  }

  switch (provider) {
    case 'mistral': {
      const result = await processDocExtractionMistral(config);
      return result.parsed as T;
    }
    
    case 'openai': {
      const result = await processDocExtractionOpenAI(config);
      return result.parsed as T;
    }
    
    case 'gemini': {
      const result = await processDocExtractionGemini(config);
      return result.parsed as T;
    }
    
    case 'local': {
      const result = await parseDocumentLocal(config.filePath);
      return result as unknown as T;
    }
    
    default:
      throw new Error(`Provider ${provider} not supported: ${provider}`);
  }
}
