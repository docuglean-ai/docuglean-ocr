declare module 'pdf2json' {
  export default class PDFParser {
    on(event: 'pdfParser_dataError', callback: (errData: any) => void): void;
    on(event: 'pdfParser_dataReady', callback: (pdfData: any) => void): void;
    loadPDF(filePath: string): void;
  }
}
