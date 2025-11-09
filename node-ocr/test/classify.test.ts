/// <reference types="jest" />
import { classify } from '../src/classify';
import path from 'path';

describe('Document Classification', () => {
  const testDataDir = path.join(__dirname, 'data');
  
  describe('classify', () => {
    it('should classify a document with basic categories', async () => {
      // Skip if no API key is set
      if (!process.env.MISTRAL_API_KEY) {
        console.log('Skipping test: MISTRAL_API_KEY not set');
        return;
      }

      const result = await classify(
        path.join(testDataDir, 'sample.pdf'),
        [
          {
            name: 'Technical Content',
            description: 'Pages containing technical documentation, code, or specifications'
          },
          {
            name: 'General Content',
            description: 'Pages with general information, introductions, or summaries'
          }
        ],
        process.env.MISTRAL_API_KEY,
        'mistral'
      );
      
      expect(result).toBeDefined();
      expect(result.splits).toBeDefined();
      expect(Array.isArray(result.splits)).toBe(true);
      
      // Check that we have at least one split
      if (result.splits.length > 0) {
        const split = result.splits[0];
        expect(split.name).toBeDefined();
        expect(split.pages).toBeDefined();
        expect(split.conf).toBeDefined();
        expect(['low', 'high']).toContain(split.conf);
        expect(Array.isArray(split.pages)).toBe(true);
      }
    }, 30000); // 30 second timeout for API calls

    it('should classify with OpenAI provider', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping test: OPENAI_API_KEY not set');
        return;
      }

      const result = await classify(
        path.join(testDataDir, 'sample.pdf'),
        [
          {
            name: 'Introduction',
            description: 'Introductory or overview pages'
          },
          {
            name: 'Main Content',
            description: 'Main body content pages'
          }
        ],
        process.env.OPENAI_API_KEY,
        'openai'
      );
      
      expect(result).toBeDefined();
      expect(result.splits).toBeDefined();
    }, 30000);

    it('should classify with Gemini provider', async () => {
      if (!process.env.GEMINI_API_KEY) {
        console.log('Skipping test: GEMINI_API_KEY not set');
        return;
      }

      const result = await classify(
        path.join(testDataDir, 'sample.pdf'),
        [
          {
            name: 'Header Pages',
            description: 'Pages with headers or titles'
          },
          {
            name: 'Content Pages',
            description: 'Pages with main content'
          }
        ],
        process.env.GEMINI_API_KEY,
        'gemini'
      );
      
      expect(result).toBeDefined();
      expect(result.splits).toBeDefined();
    }, 30000);

    it('should validate configuration correctly', async () => {
      await expect(classify(
        'test.pdf',
        [{ name: 'Test', description: 'Test category' }],
        ''
      )).rejects.toThrow('Valid API key is required');

      await expect(classify(
        '',
        [{ name: 'Test', description: 'Test category' }],
        'test-key'
      )).rejects.toThrow('Valid file path is required');

      await expect(classify(
        'test.pdf',
        [],
        'test-key'
      )).rejects.toThrow('At least one category is required');
    });

    it('should handle chunking for large documents', async () => {
      // This test would require a large PDF file
      // For now, we just test that the chunking logic doesn't break small files
      if (!process.env.MISTRAL_API_KEY) {
        console.log('Skipping test: MISTRAL_API_KEY not set');
        return;
      }

      const result = await classify(
        path.join(testDataDir, 'sample.pdf'),
        [
          {
            name: 'All Content',
            description: 'All pages in the document'
          }
        ],
        process.env.MISTRAL_API_KEY,
        'mistral',
        {
          chunkSize: 10 // Small chunk size to test chunking logic
        }
      );
      
      expect(result).toBeDefined();
      expect(result.splits).toBeDefined();
    }, 30000);
  });
});

