import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { OCRConfig, OpenAIOCRResponse, ExtractConfig, BaseStructuredOutput, StructuredExtractionResult } from '../types';
import { isURL, encodePdf, encodeImage, getFileType } from '../utils';
import path from 'path';

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
