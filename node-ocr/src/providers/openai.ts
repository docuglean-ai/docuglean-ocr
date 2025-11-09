import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { OCRConfig, OpenAIOCRResponse, ExtractConfig, BaseStructuredOutput, StructuredExtractionResult, ClassifyConfig, ClassifyResult, Split } from '../types';
import { isURL, encodePdf, encodeImage, getFileType } from '../utils';
import path from 'path';
import fs from 'fs';

type TextContent = {
  type: 'text';
  text: string;
};

type ImageContent = {
  type: 'image_url';
  image_url: {
    url: string;
  };
};

type FileContent = {
  type: 'file';
  file: {
    filename: string;
    file_data: string;
  };
};

type ContentPart = TextContent | ImageContent | FileContent;

export async function processOCROpenAI(config: OCRConfig): Promise<OpenAIOCRResponse> {
  const client = new OpenAI({ apiKey: config.apiKey });

  try {
    const fileType = getFileType(config.filePath);
    let content: ContentPart[];

    switch (fileType) {
      case 'image': {
        const imageUrl = isURL(config.filePath)
          ? config.filePath
          : `data:image/${path.extname(config.filePath).slice(1)};base64,${await encodeImage(config.filePath)}`;

        content = [
          {
            type: 'text',
            text: 'Extract and format all text content from this document.'
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          }
        ];
        break;
      }

      case 'pdf': {
        if (isURL(config.filePath)) {
          throw new Error('OpenAI models currently only support local files for PDFs, not URLs. Please provide a local file path.');
        }

        const documentUrl = await encodePdf(config.filePath);
        const filename = path.basename(config.filePath);

        content = [
          {
            type: 'file',
            file: {
              filename,
              file_data: documentUrl
            }
          },
          {
            type: 'text',
            text: 'Extract and format all text content from this document.'
          }
        ];
        break;
      }

      default:
        throw new Error(`Unsupported file type: ${path.extname(config.filePath)}`);
    }

    const response = await client.chat.completions.create({
      model: config.model || 'gpt-4.1-mini',
      messages: [
        {
          role: 'user',
          content: content as OpenAI.ChatCompletionContentPart[]
        }
      ]
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI OCR process');
    }

    return {
      text: response.choices[0].message.content,
      usage: response.usage ?? {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI OCR process failed: ${error.message}`);
    }
    throw new Error('OpenAI OCR process failed: Unknown error');
  }
}

export async function processDocExtractionOpenAI(config: ExtractConfig): Promise<StructuredExtractionResult<BaseStructuredOutput>> {
  const client = new OpenAI({ apiKey: config.apiKey });

  try {
    if (isURL(config.filePath)) {
      throw new Error('OpenAI models currently only support local files for PDFs, not URLs. Please provide a local file path.');
    }

    const documentUrl = await encodePdf(config.filePath);
    const filename = path.basename(config.filePath);

    const fileContent = [
      {
        type: 'file',
        file: {
          filename,
          file_data: documentUrl
        }
      },
      {
        type: 'text',
        text: config.prompt || 'Extract information from this document.'
      }
    ];

    const response = await client.beta.chat.completions.parse({
      model: config.model || 'gpt-4.1-mini',
      messages: [
        ...(config.systemPrompt ? [{
          role: 'system' as const,
          content: config.systemPrompt
        }] : []),
        {
          role: 'user' as const,
          content: fileContent as OpenAI.ChatCompletionContentPart[]
        }
      ],
      response_format: zodResponseFormat(config.responseFormat, 'extracted_data')
    });

    const parsed = response.choices[0].message.parsed as BaseStructuredOutput;
    return {
      raw: JSON.stringify(response.choices[0].message.content),
      parsed,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI document extraction failed: ${error.message}`);
    }
    throw new Error('OpenAI document extraction failed: Unknown error');
  }
}

export async function processClassifyOpenAI(
  config: ClassifyConfig,
  pageRange: [number, number]
): Promise<ClassifyResult> {
  const client = new OpenAI({ apiKey: config.apiKey });
  
  try {
    // Extract text from the specified page range
    const [startPage, endPage] = pageRange;
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(config.filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    // pdf-parse extracts all text; we'll include it with page range context
    const fullText = `--- Pages ${startPage} to ${endPage} ---\n${pdfData.text}`;
    
    // Build classification prompt
    const categoriesDesc = config.categories
      .map(cat => `- ${cat.name}: ${cat.description}`)
      .join('\n');
    
    const prompt = `Classify the following document pages into the appropriate categories. 
For each page, determine which category it belongs to based on the descriptions below.

Categories:
${categoriesDesc}

Document (pages ${startPage} to ${endPage}):
${fullText}

Return a JSON object with the following structure:
{
  "classifications": [
    {
      "page": <page_number>,
      "category": "<category_name>",
      "confidence": <0.0 to 1.0>
    }
  ]
}

Classify each page into exactly one category. Use confidence scores above 0.8 for clear matches.`;

    const response = await client.chat.completions.create({
      model: config.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    
    const messageContent = response?.choices?.[0]?.message?.content;
    if (!messageContent || typeof messageContent !== 'string') {
      throw new Error('No valid response from OpenAI classification');
    }
    
    // Parse the response
    const resultJson = JSON.parse(messageContent);
    const classifications = resultJson.classifications || [];
    
    // Group pages by category
    const categoryPages: Record<string, number[]> = {};
    const categoryConfidence: Record<string, number[]> = {};
    
    config.categories.forEach(cat => {
      categoryPages[cat.name] = [];
      categoryConfidence[cat.name] = [];
    });
    
    for (const classification of classifications) {
      const page = classification.page;
      const category = classification.category;
      const confidence = classification.confidence || 0.5;
      
      if (categoryPages[category] && page) {
        categoryPages[category].push(page);
        categoryConfidence[category].push(confidence);
      }
    }
    
    // Build splits
    const splits: Split[] = [];
    for (const cat of config.categories) {
      const pages = categoryPages[cat.name].sort((a, b) => a - b);
      if (pages.length > 0) {
        // Determine overall confidence
        const avgConf = categoryConfidence[cat.name].reduce((a, b) => a + b, 0) / categoryConfidence[cat.name].length || 0.5;
        const conf = avgConf >= 0.8 ? 'high' : 'low';
        
        splits.push({
          name: cat.name,
          pages,
          conf,
          partitions: null // TODO: Implement partition_key support
        });
      }
    }
    
    return { splits };
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI classification failed: ${error.message}`);
    }
    throw new Error('OpenAI classification failed: Unknown error');
  }
}
