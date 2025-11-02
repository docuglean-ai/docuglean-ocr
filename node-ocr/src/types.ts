import { z } from 'zod';

export type Provider = 'openai' | 'mistral' | 'gemini' | 'local';

export const validateConfig = (config: OCRConfig | ExtractConfig) => {
  if (!config.apiKey?.trim()) {
    throw new Error('Valid API key is required');
  }
  if (!config.filePath?.trim()) {
    throw new Error('Valid file path is required');
  }
  if (config.provider && !['mistral', 'openai', 'gemini', 'local'].includes(config.provider)) {
    throw new Error(`Provider ${config.provider} not supported`);
  }
};

interface MistralOCRImage {
  id: string;
  topLeftX: number | null;
  topLeftY: number | null;
  bottomRightX: number | null;
  bottomRightY: number | null;
  imageBase64?: string | null;
}

interface MistralOCRPage {
  index: number;
  markdown: string;
  images: MistralOCRImage[];
  dimensions: {
    dpi: number;
    height: number;
    width: number;
  } | null;
}

export interface MistralOCRResponse {
  pages: MistralOCRPage[];
}

export interface OpenAIOCRResponse {
  text: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GeminiOCRResponse {
  text: string;
  model_used: string;
}

export interface OCRPage {
    index: number;
    markdown: string;
}

export interface OCRConfig {
  filePath: string;
  provider?: Provider;
  model?: string;
  apiKey: string;
  options?: {
    // Provider specific
    mistral?: {
      includeImageBase64?: boolean;
    };
    openai?: {
      maxTokens?: number;
    };
    gemini?: {
      temperature?: number;
      topP?: number;
      topK?: number;
    };
    local?: {
      /** Force local parsing; only PDFs supported */
      pdf?: boolean;
    };
  };
  prompt?: string;
}

export interface LocalOCRResponse {
  text: string;
}

export interface ExtractConfig {
  filePath: string;
  apiKey: string;
  provider?: Provider;
  model?: string;
  prompt?: string;
  responseFormat: z.ZodType<any>;
  systemPrompt?: string;
}

export interface BaseStructuredOutput {
  [key: string]: any;
}

export interface StructuredExtractionResult<T extends BaseStructuredOutput> {
  raw: string;
  parsed: T;
}

export interface OCRResult {
  markdown: string;
  images: any[];
  rawResponse: MistralOCRResponse;
}