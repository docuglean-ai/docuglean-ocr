import fs from 'fs';
import { csvParse, tsvParse } from 'd3-dsv';

export async function parseCsv(filePath: string) {
  if (!filePath) return { text: '', rows: [] };
  
  const content = await fs.promises.readFile(filePath, 'utf8');
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  // Parse based on file extension
  const parsed = extension === 'tsv' ? tsvParse(content) : csvParse(content);
  
  // Convert rows to text format
  const text = parsed.map((row: Record<string, string>) => 
    Object.keys(row)
      .map((key: string) => `${key}: ${row[key]}`)
      .join('\n')
  ).join('\n\n');
  
  return {
    text,
    rows: parsed,
    columns: parsed.columns
  };
}

