import { batchOcr, batchExtract } from '../src/batch';
import { z } from 'zod';
import path from 'path';

describe('Batch Processing', () => {
  const testDataDir = path.join(__dirname, 'data');
  
  describe('batchOcr', () => {
    it('should process multiple files successfully', async () => {
      const configs = [
        {
          filePath: path.join(testDataDir, 'sample.pdf'),
          provider: 'local' as const,
          apiKey: 'not-needed-for-local'
        },
        {
          filePath: path.join(testDataDir, 'sample2.pdf'),
          provider: 'local' as const,
          apiKey: 'not-needed-for-local'
        }
      ];

      const results = await batchOcr(configs);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBeDefined();
      expect(results[1].success).toBeDefined();
    });

    it('should handle errors gracefully and continue processing', async () => {
      const configs = [
        {
          filePath: path.join(testDataDir, 'sample.pdf'),
          provider: 'local' as const,
          apiKey: 'not-needed-for-local'
        },
        {
          filePath: 'non-existent-file.pdf',
          provider: 'local' as const,
          apiKey: 'not-needed-for-local'
        },
        {
          filePath: path.join(testDataDir, 'sample2.pdf'),
          provider: 'local' as const,
          apiKey: 'not-needed-for-local'
        }
      ];

      const results = await batchOcr(configs);
      
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      if (!results[1].success) {
        expect(results[1].error).toBeDefined();
        expect(results[1].file).toBe('non-existent-file.pdf');
      }
      expect(results[2].success).toBe(true);
    });
  });

  describe('batchExtract', () => {
    it('should extract structured data from multiple files', async () => {
      const schema = z.object({
        text: z.string(),
        summary: z.string().optional()
      });

      const configs = [
        {
          filePath: path.join(testDataDir, 'sample.pdf'),
          provider: 'local' as const,
          apiKey: 'not-needed-for-local',
          responseFormat: schema
        },
        {
          filePath: path.join(testDataDir, 'sample2.pdf'),
          provider: 'local' as const,
          apiKey: 'not-needed-for-local',
          responseFormat: schema
        }
      ];

      const results = await batchExtract(configs);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBeDefined();
      expect(results[1].success).toBeDefined();
    });

    it('should handle extraction errors gracefully', async () => {
      const schema = z.object({
        text: z.string()
      });

      const configs = [
        {
          filePath: path.join(testDataDir, 'sample.pdf'),
          provider: 'local' as const,
          apiKey: 'not-needed-for-local',
          responseFormat: schema
        },
        {
          filePath: 'non-existent-file.pdf',
          provider: 'local' as const,
          apiKey: 'not-needed-for-local',
          responseFormat: schema
        }
      ];

      const results = await batchExtract(configs);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      if (!results[1].success) {
        expect(results[1].error).toBeDefined();
        expect(results[1].file).toBe('non-existent-file.pdf');
      }
    });
  });
});

