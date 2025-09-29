import { ExtractConfig, BaseStructuredOutput, StructuredExtractionResult, validateConfig } from './types';
import { processDocExtractionMistral } from './providers/mistral';
import { processDocExtractionOpenAI } from './providers/openai';
import { processDocExtractionGemini } from './providers/gemini';

/**
 * Extracts structured information from a document using specified provider
 * @param config Extraction configuration including provider, file path, API key, and response format schema
 * @returns Structured data according to the provided schema
 */
export async function extract<T extends BaseStructuredOutput>(config: ExtractConfig): Promise<T> {
  // Default to mistral if no provider specified
  const provider = config.provider || 'mistral';

  // Validate configuration
  validateConfig(config);

  // Route to correct provider
  switch (provider) {
    case 'mistral':
      const mistralResult = await processDocExtractionMistral(config);
      return mistralResult.parsed as T;
    case 'openai':
      return await processDocExtractionOpenAI(config) as T;
    case 'gemini':
      const geminiResult = await processDocExtractionGemini(config);
      return geminiResult.parsed as T;
    default:
      throw new Error(`Provider ${provider} not supported yet`);
  }
}
