import { processOCRMistral } from './mistral';
import { processOCROpenAI } from './openai';
import { processOCRGemini } from './gemini';
import { processOCRLocal } from './local';

export const providers = {
  openai: {
    models: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o', 'o1-mini', 'o1', 'o3', 'o4-mini'],
    defaultModel: 'gpt-4.1-mini'
  },
  mistral: {
    models: ['mistral-ocr-latest', 'mistral-small-latest', 'ministral-8b-latest'],
    defaultModel: 'mistral-ocr-latest'
  },
  gemini: {
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    defaultModel: 'gemini-2.5-flash'
  }
};


export { processOCRMistral, processOCROpenAI, processOCRGemini };

export { processOCRLocal };

