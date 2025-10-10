import { extract } from '../src';
import { z } from 'zod';

// Define example schemas for structured extraction
const Receipt = z.object({
  date: z.string().describe('The date on the receipt'),
  total: z.number().describe('The total amount on the receipt'),
  items: z.array(z.object({
    name: z.string().describe('The name of the item'),
    price: z.number().describe('The price of the item')
  }))
});

// 1. Mistral Structured PDF Test
async function testMistralStructuredPdf() {
  console.log('\nTesting Mistral structured extraction with PDF URL...');
  const response = await extract({
    filePath: 'https://arxiv.org/pdf/2302.12854',
    provider: 'mistral',
    model: 'mistral-small-latest',
    apiKey: process.env.MISTRAL_API_KEY!,
    responseFormat: Receipt,
    prompt: 'Extract key information from this research paper including title, authors, and main findings.'
  });

  console.log('Mistral Structured PDF Result:', response);
}

// 2. Mistral Structured PDF Test (Book -> structured Zod schema)
async function testMistralStructuredPdfBook() {
  console.log('\nTesting Mistral structured extraction (Book) with Local PDF...');
  const response = await extract({
    filePath: './test/data/receipt.pdf',
    provider: 'mistral',
    model: 'mistral-small-latest',
    apiKey: process.env.MISTRAL_API_KEY!,
    responseFormat: Receipt,
    systemPrompt: 'Extract receipt information from the document in a structured format.',
    prompt: 'Please extract the receipt details including date, total amount, and itemized list with prices.'
  });

  console.log('Mistral Structured PDF (Receipt) Result:', response);
}


// 4. OpenAI Structured PDF Test (Receipt)
async function testOpenAIStructuredPdf() {
  console.log('\nTesting OpenAI structured extraction (Receipt) with Local PDF...');
  const response = await extract({
    filePath: './test/data/receipt.pdf',
    provider: 'openai',
    model: 'gpt-4.1-mini',
    apiKey: process.env.OPENAI_API_KEY!,
    responseFormat: Receipt,
    systemPrompt: 'Extract receipt information from the document in a structured format.',
    prompt: 'Please extract the receipt details including date, total amount, and itemized list with prices.'
  });

  console.log('OpenAI Structured PDF (Receipt) Result:', response);
}


// 6. Gemini Structured PDF Test (Receipt)
async function testGeminiStructuredPdf() {
  console.log('\nTesting Gemini structured extraction (Receipt) with Local PDF...');
  try {
    const response = await extract({
      filePath: './test/data/receipt.pdf',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY!,
      responseFormat: Receipt,
      systemPrompt: 'Extract receipt information from the document in a structured format.',
      prompt: 'Please extract the receipt details including date, total amount, and itemized list with prices.'
    });

    console.log('Gemini Structured PDF (Receipt) Result:', response);
  } catch (error) {
    console.log('Gemini Structured PDF Test:', error);
  }
}

// Main test runner for extraction tests
export async function runExtractionTests() {
  try {
    // mistral tests
    await testMistralStructuredPdf();
    await testMistralStructuredPdfBook();
    
    // OpenAI tests
    await testOpenAIStructuredPdf();

    // Gemini tests
    await testGeminiStructuredPdf();
  } catch (error) {
    console.error('Extraction Tests failed:', error);
    throw error;
  }
}
