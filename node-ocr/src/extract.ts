import { ExtractConfig, BaseStructuredOutput, StructuredExtractionResult, validateConfig } from './types';
import { processDocExtractionMistral } from './providers/mistral';
import { processDocExtractionOpenAI } from './providers/openai';
import { processDocExtractionGemini } from './providers/gemini';

/**
 * Extracts structured or unstructured information from a document using specified provider
 * @param config Extraction configuration including provider, file path, and API key
 * @returns Extracted information either as string or structured data
 */
export async function extract(config: ExtractConfig): Promise<string | StructuredExtractionResult<BaseStructuredOutput>> {
  // Default to mistral if no provider specified
  const provider = config.provider || 'mistral';

  // Validate configuration
  validateConfig(config);

  // Route to correct provider
  switch (provider) {
    case 'mistral':
      return processDocExtractionMistral(config);
    case 'openai':
      return processDocExtractionOpenAI(config);
    case 'gemini':
      return processDocExtractionGemini(config);
    default:
      throw new Error(`Provider ${provider} not supported yet`);
  }
}
