<div align="center">
    <p align="center">
        <img src="./banner.png" />
    </p>
    <h2>Intelligent document processing using State of the Art AI models.</h2>
    <h4>If you find Docuglean helpful, please ⭐ this repository to show your support!</h4>
</div>



## What is Docuglean AI?

Docuglean is a unified SDK for intelligent document processing using State of the Art AI models. Docuglean provides multilingual and multimodal capabilities with plug-and-play APIs for document OCR, structured data extraction, annotation, classification, summarization, and translation. It also comes with inbuilt tools and supports different types of documents out of the box.

## Features
- 🚀 **Easy to Use**: Simple, intuitive API with detailed documentation. Just pass in a file and get markdown in response.
- 🔍 **OCR Capabilities**: Extract text from images and scanned documents
- 📊 **Structured Data Extraction**: Use Zod schemas for type-safe data extraction
- 📄 **Multimodal Support**: Process PDFs and images with ease
- 🤖 **Multiple AI Providers**: Support for OpenAI, Mistral, and Google Gemini, with more coming soon
- 🔒 **Type Safety**: Full TypeScript support with comprehensive types
- 📝 **Document Parsers**: Local parsing for DOC, DOCX, PPTX, XLSX, XLS, ODS, ODT, ODP, CSV, TSV, and PDF files (no API required)


## Coming Soon
- [ ] 📝 **summarize()**: TLDRs of long documents
- [ ] 🌐 **translate()**: Support for multilingual documents
- [ ] 🏷️ **classify()**: Document type classifier (receipt, ID, invoice, etc.)
- [ ] 🔍 **search(query)**: LLM-powered search across documents
- [ ] 🤖 **More Models. More Providers**: Integration with Meta's Llama, Together AI, OpenRouter and lots more.
- [ ] 🌍 **Multilingual**: Support for multiple languages (coming soon)
- [ ] 🎯 **Smart Classification**: Automatic document type detection (coming soon)


## Quick Start

### Installation

```bash
npm i docuglean-ocr
```

## Features in Detail

### OCR Function - Pure OCR Processing
Extracts text from documents and images. Returns text content with basic metadata (varies by provider).

```typescript
import { ocr, extract } from 'docuglean-ocr';

// Extract raw text from documents (supports URLs and local files)
const ocrResult = await ocr({
  filePath: 'https://arxiv.org/pdf/2302.12854',
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: 'your-api-key'
});

// Mistral OCR with local file
const mistralResult = await ocr({
  filePath: './document.pdf',
  provider: 'mistral',
  model: 'mistral-ocr-latest',
  apiKey: 'your-api-key'
});

// Local OCR (no API, PDFs only) using pdf2json
const localResult = await ocr({
  filePath: './document.pdf',
  provider: 'local',
  apiKey: 'local'
});
console.log('Local text:', (localResult as any).text.substring(0, 200) + '...');
```

### Extract Function - Document Analysis & Information Extraction
Structured extraction for analyzing document content and extracting specific information based on custom prompts.

```typescript
import { z } from 'zod';

// Define schema for structured extraction
const ReceiptSchema = z.object({
  date: z.string(),
  total: z.number(),
  items: z.array(z.object({
    name: z.string(),
    price: z.number()
  }))
});

// Extract structured data from documents
const extractResult = await extract({
  filePath: './receipt.pdf',
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: 'your-api-key',
  responseFormat: ReceiptSchema,
  prompt: 'Extract receipt details including date, total, and items'
});

// You can now access fields directly:
console.log('Date:', extractResult.date);
console.log('Total:', extractResult.total);
console.log('First item name:', extractResult.items[0]?.name);
```

### Provider Options
Currently supported providers and models:
- OpenAI:  `gpt-4.1-mini`, `gpt-4.1`, `gpt-4o-mini`, `gpt-4o`, `o1-mini`, `o1`, `o3`, `o4-mini`
- Mistral: `mistral-ocr-latest` for OCR. All currently available models except for codestral-mamba are supported for structured outputs.
- Google Gemini: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-flash`, `gemini-1.5-pro`
- Local: No API required - supports DOC, DOCX, PPTX, XLSX, XLS, ODS, ODT, ODP, CSV, TSV, and PDF files
- More coming soon: Together AI, OpenRouter, Anthropic etc

### Document Parsers (Local - No API Required)

Extract text from various document formats without any AI provider:

```typescript
import { parseDocumentLocal, parsePdf, parseDocx, parseCsv } from 'docuglean-ocr';

// Parse any supported document format
const result = await parseDocumentLocal('./document.pdf');
console.log(result.text);

// Or use specific parsers
const pdf = await parsePdf('./document.pdf');           // PDF
const docx = await parseDocx('./document.docx');        // DOCX (also supports DOC)
const pptx = await parsePptx('./presentation.pptx');    // PowerPoint
const xlsx = await parseSpreadsheet('./data.xlsx');     // Excel (XLSX, XLS)
const csv = await parseCsv('./data.csv');               // CSV/TSV
const odt = await parseOdt('./document.odt');           // OpenDocument Text
const odp = await parseOdp('./presentation.odp');       // OpenDocument Presentation
const ods = await parseOds('./spreadsheet.ods');        // OpenDocument Spreadsheet
```

**Supported Formats:**
- **Word**: DOC, DOCX (via mammoth)
- **PowerPoint**: PPTX (via officeparser)
- **Excel**: XLSX, XLS, ODS (via officeparser)
- **CSV/TSV**: CSV, TSV (via d3-dsv)
- **OpenDocument**: ODT, ODP, ODS (via officeparser)
- **PDF**: PDF (via pdf2json, or convert to images via pdf-poppler)

## Configuration

### OCR Configuration
```typescript
interface OCRConfig {
  filePath: string;
  provider?: 'openai' | 'mistral' | 'gemini';
  model?: string;
  apiKey: string;
  prompt?: string;
  options?: {
    mistral?: {
      includeImageBase64?: boolean;
    };
    openai?: {
      maxTokens?: number;
    };
    gemini?: {
      temperature?: number;
      topP?: number;
      topK?: number;
    };
  };
}
```

### Extraction Configuration
```typescript
interface ExtractConfig {
  filePath: string;
  apiKey: string;
  provider?: 'openai' | 'mistral' | 'gemini';
  model?: string;
  prompt?: string;
  responseFormat?: z.ZodType<any>;
  systemPrompt?: string;
}
```

### Additional Examples

```typescript
// Structured extraction with Gemini
const geminiReceipt = await extract({
  filePath: './receipt.pdf',
  provider: 'gemini',
  apiKey: 'your-gemini-api-key',
  responseFormat: ReceiptSchema,
  prompt: 'Extract receipt information including date, total, and all items'
});

// Structured extraction with different schema
const DocumentSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()),
  summary: z.string()
});

const documentInfo = await extract({
  filePath: './research-paper.pdf',
  provider: 'openai',
  apiKey: 'your-api-key',
  responseFormat: DocumentSchema,
  prompt: 'Extract document metadata and summary'
});

// Summarization via extract
const SummarySchema = z.object({
  title: z.string().optional(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
});
const summary = await extract({
  filePath: './long-report.pdf',
  provider: 'openai',
  apiKey: 'your-api-key',
  responseFormat: SummarySchema,
  prompt: 'Provide a concise 3-sentence summary of the document.'
});
console.log('Summary:', summary.summary);
```

Note: you can also use extract with a targeted "search" prompt (e.g., "Find all occurrences of X and return matching passages") to perform semantic search within a document.

Check out our [test folder](./test) for more comprehensive examples and use cases, including:
- Receipt parsing
- Document summarization
- Image OCR
- Structured data extraction
- Custom schema validation


## Stay Up to Date

⭐ Star this repo to get notified about new releases and updates!


## Contributing

We welcome contributions! Please refer to the CONTRIBUTING.md file for information about how to get involved. We welcome issues, questions, and pull requests.

## License

Apache 2.0 - see the [LICENSE](LICENSE) file for details.
