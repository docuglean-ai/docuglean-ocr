import path from 'path';
import os from 'os';
import fs from 'fs';
import PDFParser from 'pdf2json';

const pdfPoppler = require('pdf-poppler');

export async function parsePdf(filePath: string) {
  if (!filePath) return { text: '' };
  
  return new Promise<{ text: string }>((resolve, reject) => {
    const pdfParser = new (PDFParser as any)();

    pdfParser.on('pdfParser_dataError', (errData: any) => 
      reject(new Error(errData.parserError))
    );
    
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        const pages = pdfData?.formImage?.Pages || [];
        const texts: string[] = [];
        
        for (const page of pages) {
          for (const text of page.Texts || []) {
            for (const run of text.R || []) {
              try {
                const decoded = decodeURIComponent(run.T || '');
                texts.push(decoded);
              } catch {
                // If decoding fails, use raw text
                texts.push(run.T || '');
              }
            }
          }
          texts.push('\n');
        }
        
        resolve({ text: texts.join(' ') });
      } catch (e: any) {
        reject(new Error(`Failed to parse PDF: ${e.message || e}`));
      }
    });

    pdfParser.loadPDF(filePath);
  });
}

export async function pdfToImages(filePath: string, opts?: {
  format?: 'jpeg' | 'png';
  outDir?: string;
  outPrefix?: string;
}) {
  if (!filePath) return [];
  
  const format = opts?.format || 'png';
  const outDir = opts?.outDir || fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-images-'));
  const outPrefix = opts?.outPrefix || path.basename(filePath, path.extname(filePath));

  const options = {
    format,
    out_dir: outDir,
    out_prefix: outPrefix,
    page: null,
  };

  await pdfPoppler.convert(filePath, options);

  const files = fs.readdirSync(outDir);
  return files
    .filter(f => f.startsWith(outPrefix))
    .sort()
    .map(f => path.join(outDir, f));
}



