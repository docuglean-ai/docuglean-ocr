import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';
import { LocalOCRResponse, OCRConfig } from '../types';

export async function processOCRLocal(config: OCRConfig): Promise<LocalOCRResponse> {
  const ext = path.extname(config.filePath).toLowerCase();
  if (ext !== '.pdf') {
    throw new Error('Local OCR currently supports only local PDF files');
  }
  if (config.filePath.startsWith('http://') || config.filePath.startsWith('https://')) {
    throw new Error('Local OCR requires a local file path');
  }
  await fs.promises.access(config.filePath, fs.constants.R_OK);

  return new Promise<LocalOCRResponse>((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(/* cMap, cMapPack not required here */);

    pdfParser.on('pdfParser_dataError', (errData: any) => reject(new Error(errData.parserError)));
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        const pages = pdfData?.formImage?.Pages || [];
        const texts: string[] = [];
        for (const page of pages) {
          for (const text of page.Texts || []) {
            // Each Text contains an array of R (runs) with T (encoded text)
            for (const run of text.R || []) {
              const decoded = decodeURIComponent(run.T || '');
              texts.push(decoded);
            }
          }
          texts.push('\n');
        }
        resolve({ text: texts.join(' ') });
      } catch (e: any) {
        reject(new Error(`Failed to parse PDF: ${e.message || e}`));
      }
    });

    pdfParser.loadPDF(config.filePath);
  });
}


