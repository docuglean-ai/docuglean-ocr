<div align="center">
    <p align="center">
        <img src="./banner.png" />
    </p>
    <h2>Intelligent document processing using State of the Art AI models.</h2>
    <h4>If you find Docuglean helpful, please ⭐ this repository to show your support!</h4>
</div>

## What is Docuglean?

Docuglean is a unified SDK for intelligent document processing using State of the Art AI models. Docuglean provides multilingual and multimodal capabilities with plug-and-play APIs for document OCR, structured data extraction, annotation, classification, summarization, and translation. It also comes with inbuilt tools and supports different types of documents out of the box.

## Features
- 🚀 **Easy to Use**: Simple, intuitive API with detailed documentation. Just pass in a file and get markdown in response.
- 🔍 **OCR Capabilities**: Extract text from images and scanned documents
- 📊 **Structured Data Extraction**: Use Zod schemas for type-safe data extraction
- 📄 **Multimodal Support**: Process PDFs and images with ease
- 🤖 **Multiple AI Providers**: Support for OpenAI, Mistral, and Google Gemini, with more coming soon
- 🔒 **Type Safety**: Full TypeScript support with comprehensive types

## Available SDKs

### 📦 Node.js/TypeScript SDK
**Package:** `docuglean-ocr`

```bash
npm install docuglean-ocr
```

**Repository:** [node-ocr/](./node-ocr/)

**Quick Start:**
```typescript
import { ocr, extract } from 'docuglean-ocr';

const result = await ocr({
  filePath: './document.pdf',
  provider: 'mistral',
  model: 'mistral-ocr-latest',
  apiKey: 'your-api-key'
});
```

### 🐍 Python SDK
**Package:** `docuglean-ocr`

```bash
pip install docuglean-ocr
```

**Repository:** [python-ocr/](./python-ocr/)

**Quick Start:**
```python
from docuglean import ocr, extract

result = await ocr(
    file_path="./document.pdf",
    provider="mistral",
    model="mistral-ocr-latest",
    api_key="your-api-key"
)
```

## Coming Soon

- [ ] 📝 **summarize()**: TLDRs of long documents
- [ ] 🌐 **translate()**: Support for multilingual documents
- [ ] 🏷️ **classify()**: Document type classifier (receipt, ID, invoice, etc.)
- [ ] 🔍 **search(query)**: LLM-powered search across documents
- [ ] 🤖 **More Models. More Providers**: Integration with Meta's Llama, Together AI, OpenRouter and lots more.
- [ ] 🌍 **Multilingual**: Support for multiple languages
- [ ] 🎯 **Smart Classification**: Automatic document type detection

## Provider Options

Currently supported providers and models:
- **OpenAI**: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`, `o1-mini`, `o1-preview`
- **Mistral**: `mistral-ocr-latest`, `mistral-small-latest`, `ministral-8b-latest`
- **Google Gemini**: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-flash`, `gemini-1.5-pro`
- **Hugging Face**: `Qwen/Qwen2.5-VL-3B-Instruct` and other vision-language models (Python only)

## Development

### Node.js SDK
```bash
cd node-ocr
npm install
npm run build
npm test
```

### Python SDK
```bash
cd python-ocr
uv sync
uv run pytest
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./node-ocr/CONTRIBUTING.md) for details.

## License

Apache 2.0 - see the [LICENSE](./LICENSE) file for details.

## Stay Up to Date

⭐ Star this repo to get notified about new releases and updates!
