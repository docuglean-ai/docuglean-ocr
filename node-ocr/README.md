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
npm i docuglean
```

## Features in Detail

### OCR Processing

```typescript
import { ocr } from 'docuglean';

// Mistral OCR
const result = await ocr({
  filePath: './document.pdf',
  provider: 'mistral',
  model: 'mistral-ocr-latest',
  apiKey: 'your-api-key'
});

// Google Gemini OCR
const geminiResult = await ocr({
  filePath: './document.pdf',
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  apiKey: 'your-gemini-api-key',
  prompt: 'Extract all text from this document'
});
```

### Provider Options
Currently supported providers and models:
- OpenAI:  `gpt-4.1-mini`, `gpt-4.1`, `gpt-4o-mini`, `gpt-4o`, `o1-mini`, `o1`, `o3`, `o4-mini`
- Mistral: `mistral-ocr-latest` for OCR. All currently available models except for codestral-mamba are supported for structured outputs.
- Google Gemini: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-flash`, `gemini-1.5-pro`
- More coming soon: Together AI, OpenRouter, Anthropic etc

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

### Basic Structured Output Usage

```typescript
import { extract } from 'docuglean';
import { z } from 'zod';

// Define your schema (for structured extraction)
const Receipt = z.object({
  date: z.string(),
  total: z.number(),
  items: z.array(z.object({
    name: z.string(),
    price: z.number()
  }))
});

// Unstructured extraction
const text = await extract({
  filePath: './document.pdf',
  provider: 'mistral',
  apiKey: 'your-api-key',
  prompt: 'Summarize this document'
});

// Structured extraction with OpenAI
const receipt = await extract({
  filePath: './receipt.pdf',
  provider: 'openai',
  apiKey: 'your-api-key',
  responseFormat: Receipt,
  prompt: 'Extract receipt information'
});

// Structured extraction with Gemini
const geminiReceipt = await extract({
  filePath: './receipt.pdf',
  provider: 'gemini',
  apiKey: 'your-gemini-api-key',
  responseFormat: Receipt,
  prompt: 'Extract receipt information including date, total, and all items'
});
```

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
