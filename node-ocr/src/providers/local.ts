import path from 'path';
import { parseDocx } from '../parsers/docx';
import { parsePptx } from '../parsers/pptx';
import { parseSpreadsheet } from '../parsers/spreadsheet';
import { parseOdt } from '../parsers/odt';
import { parseOdp } from '../parsers/odp';
import { parseOds } from '../parsers/ods';
import { parseCsv } from '../parsers/csv';
import { parsePdf } from '../parsers/pdf';
import { OCRConfig, LocalOCRResponse } from '../types';

export async function parseDocumentLocal(filePath: string) {
  if (!filePath) return { text: '' };

  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.doc':
    case '.docx':
      return parseDocx(filePath);
    
    case '.ppt':
    case '.pptx':
      return parsePptx(filePath);
    
    case '.xlsx':
    case '.xls':
      return parseSpreadsheet(filePath);
    
    case '.odt':
      return parseOdt(filePath);
    
    case '.odp':
      return parseOdp(filePath);
    
    case '.ods':
      return parseOds(filePath);
    
    case '.csv':
    case '.tsv':
      return parseCsv(filePath);
    
    case '.pdf':
      return parsePdf(filePath);
    
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

export async function processOCRLocal(config: OCRConfig): Promise<LocalOCRResponse> {
  const result: any = await parseDocumentLocal(config.filePath);
  
  // Handle different return types from parsers
  if (result.text) {
    return { text: result.text };
  }
  if (result.rawText) {
    return { text: result.rawText };
  }
  if (result.markdown) {
    return { text: result.markdown };
  }
  
  // Fallback: return empty string instead of stringified object
  return { text: '' };
}


