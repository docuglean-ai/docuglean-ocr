import { ClassifyConfig, ClassifyResult, Split, Partition } from './types';
import { pLimit } from './utils';

interface CategoryMap {
  pages: number[];
  conf: 'low' | 'high';
  partitions: Record<string, { pages: number[]; conf: 'low' | 'high' }>;
}

function getPageCount(filePath: string): number {
  try {
    const fs = require('fs');
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    // This is synchronous for simplicity; in production, consider async
    return pdfParse(dataBuffer).then((data: any) => data.numpages);
  } catch {
    // Fallback: assume it needs chunking
    return 100;
  }
}

function chunkPages(totalPages: number, chunkSize: number): Array<[number, number]> {
  const chunks: Array<[number, number]> = [];
  for (let start = 1; start <= totalPages; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, totalPages);
    chunks.push([start, end]);
  }
  return chunks;
}

function mergeSplits(chunkResults: ClassifyResult[]): ClassifyResult {
  // Group splits by category name
  const categoryMap: Record<string, CategoryMap> = {};

  for (const result of chunkResults) {
    for (const split of result.splits) {
      if (!categoryMap[split.name]) {
        categoryMap[split.name] = {
          pages: [],
          conf: 'high',
          partitions: {}
        };
      }

      const cat = categoryMap[split.name];
      cat.pages.push(...split.pages);

      // If any chunk has low confidence, mark the whole category as low
      if (split.conf === 'low') {
        cat.conf = 'low';
      }

      // Merge partitions if present
      if (split.partitions) {
        for (const partition of split.partitions) {
          if (!cat.partitions[partition.name]) {
            cat.partitions[partition.name] = { pages: [], conf: 'high' };
          }
          const part = cat.partitions[partition.name];
          part.pages.push(...partition.pages);
          if (partition.conf === 'low') {
            part.conf = 'low';
          }
        }
      }
    }
  }

  // Convert to Split objects
  const splits: Split[] = [];
  for (const [name, data] of Object.entries(categoryMap)) {
    // Sort and deduplicate pages
    const pages = Array.from(new Set(data.pages)).sort((a, b) => a - b);

    // Build partitions if any exist
    let partitions: Partition[] | null = null;
    if (Object.keys(data.partitions).length > 0) {
      partitions = Object.entries(data.partitions).map(([partName, partData]) => ({
        name: partName,
        pages: Array.from(new Set(partData.pages)).sort((a, b) => a - b),
        conf: partData.conf
      }));
    }

    splits.push({
      name,
      pages,
      conf: data.conf,
      partitions
    });
  }

  return { splits };
}

export async function classify(
  filePath: string,
  categories: Array<{ name: string; description: string; partitionKey?: string }>,
  apiKey: string,
  provider: 'mistral' | 'openai' | 'gemini' = 'mistral',
  options?: {
    model?: string;
    chunkSize?: number;
    maxConcurrent?: number;
  }
): Promise<ClassifyResult> {
  // Validate
  if (!apiKey?.trim()) {
    throw new Error('Valid API key is required');
  }
  if (!filePath?.trim()) {
    throw new Error('Valid file path is required');
  }
  if (!categories || categories.length === 0) {
    throw new Error('At least one category is required');
  }

  if (!['mistral', 'openai', 'gemini'].includes(provider)) {
    throw new Error(`Provider ${provider} not supported for classification`);
  }
  
  // Build config object
  const config: ClassifyConfig = {
    filePath,
    apiKey,
    provider,
    model: options?.model,
    categories,
    chunkSize: options?.chunkSize || 75,
    maxConcurrent: options?.maxConcurrent || 5
  };

  // Get page count (this should be async in production)
  const totalPages = await new Promise<number>((resolve) => {
    const fs = require('fs');
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(config.filePath);
    pdfParse(dataBuffer).then((data: any) => resolve(data.numpages)).catch(() => resolve(100));
  });

  const chunkSize = config.chunkSize || 75;

  // Decide: single-shot or chunked
  if (totalPages <= chunkSize) {
    // Single-shot classification
    const { processClassifyMistral } = await import('./providers/mistral');
    const { processClassifyOpenAI } = await import('./providers/openai');
    const { processClassifyGemini } = await import('./providers/gemini');

    if (provider === 'mistral') {
      return await processClassifyMistral(config, [1, totalPages]);
    } else if (provider === 'openai') {
      return await processClassifyOpenAI(config, [1, totalPages]);
    } else if (provider === 'gemini') {
      return await processClassifyGemini(config, [1, totalPages]);
    }
  } else {
    // Chunked classification
    const chunks = chunkPages(totalPages, chunkSize);

    // Import providers
    const { processClassifyMistral } = await import('./providers/mistral');
    const { processClassifyOpenAI } = await import('./providers/openai');
    const { processClassifyGemini } = await import('./providers/gemini');

    // Create concurrency limiter
    const maxConcurrent = config.maxConcurrent || 5;
    const limit = pLimit(maxConcurrent);

    const classifyChunk = async (pageRange: [number, number]): Promise<ClassifyResult> => {
      if (provider === 'mistral') {
        return await processClassifyMistral(config, pageRange);
      } else if (provider === 'openai') {
        return await processClassifyOpenAI(config, pageRange);
      } else if (provider === 'gemini') {
        return await processClassifyGemini(config, pageRange);
      } else {
        throw new Error(`Provider ${provider} not supported`);
      }
    };

    // Process all chunks concurrently with limit
    const tasks = chunks.map(chunk => limit(() => classifyChunk(chunk)));
    const results = await Promise.all(tasks);

    // Merge results
    return mergeSplits(results);
  }

  throw new Error(`Provider ${provider} not supported`);
}

