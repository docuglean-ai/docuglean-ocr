import { ocr } from './ocr';
import { extract } from './extract';
import { OCRConfig, ExtractConfig, MistralOCRResponse, OpenAIOCRResponse, GeminiOCRResponse, LocalOCRResponse, BaseStructuredOutput } from './types';

/**
 * Result of a batch operation for a single file
 */
export type BatchOCRResult = 
  | { success: true; result: MistralOCRResponse | OpenAIOCRResponse | GeminiOCRResponse | LocalOCRResponse }
  | { success: false; error: string; file: string };

export type BatchExtractResult<T = any> = 
  | { success: true; result: T }
  | { success: false; error: string; file: string };

/**
 * Process multiple documents using OCR concurrently
 * @param configs Array of OCR configurations
 * @returns Array of results in the same order as input configs
 */
export async function batchOcr(configs: OCRConfig[]): Promise<BatchOCRResult[]> {
  const promises = configs.map(async (config): Promise<BatchOCRResult> => {
    try {
      const result = await ocr(config);
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage,
        file: config.filePath 
      };
    }
  });

  return Promise.all(promises);
}

/**
 * Extract structured information from multiple documents concurrently
 * @param configs Array of extraction configurations
 * @returns Array of results in the same order as input configs
 */
export async function batchExtract<T extends BaseStructuredOutput>(
  configs: ExtractConfig[]
): Promise<BatchExtractResult<T>[]> {
  const promises = configs.map(async (config): Promise<BatchExtractResult<T>> => {
    try {
      const result = await extract<T>(config);
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage,
        file: config.filePath 
      };
    }
  });

  return Promise.all(promises);
}

