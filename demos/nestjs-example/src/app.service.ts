import { Injectable, BadRequestException } from '@nestjs/common';
import { extract } from 'docuglean-ocr';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// Define schema for document extraction
const DocumentSchema = z.object({
  title: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  metadata: z
    .object({
      pageCount: z.number().optional().nullable(),
      author: z.string().optional().nullable(),
      date: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async processDocument(
    file: Express.Multer.File,
    apiKey: string,
    provider: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!apiKey) {
      throw new BadRequestException('API key is required');
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save uploaded file temporarily
    const tempFilePath = path.join(
      tempDir,
      `${Date.now()}-${file.originalname}`,
    );
    fs.writeFileSync(tempFilePath, file.buffer);

    try {
      // Process document with Docuglean
      const result = await extract({
        filePath: tempFilePath,
        provider: (provider as any) || 'openai',
        apiKey: apiKey,
        responseFormat: DocumentSchema,
        prompt:
          'Extract the document content including title, summary, and any relevant metadata. Be comprehensive and detailed.',
      });

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      return {
        success: true,
        data: result,
        filename: file.originalname,
      };
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      throw new BadRequestException(
        `Failed to process document: ${error.message || 'Unknown error'}`,
      );
    }
  }
}
