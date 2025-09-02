import { extract } from '../src';
import { z } from 'zod';

// Define example schemas for structured extraction
const Receipt = z.object({
  date: z.string(),
  total: z.number(),
  items: z.array(z.object({
    name: z.string(),
    price: z.number()
  }))
});

// 1. Mistral Unstructured PDF Test
async function testMistralUnstructuredPdf() {
  console.log('\nTesting Mistral unstructured extraction with PDF URL...');
  const response = await extract({
    filePath: 'https://arxiv.org/pdf/2302.12854',
    provider: 'mistral',
    model: 'mistral-small-latest',
    apiKey: process.env.MISTRAL_API_KEY!,
    prompt: 'Summarize the main findings of this research paper.'
  });

  console.log('Mistral Unstructured PDF Result:', response);
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

  if (typeof response !== 'string') {
    console.log('Mistral Structured PDF (Receipt) Result:', {
      parsed: response.parsed,
      raw: response.raw
    });
  }
}

// 3. OpenAI Unstructured Response Format PDF Test
async function testOpenAIUnstructuredPdf() {
  console.log('\nTesting OpenAI unstructured extraction with Local PDF...');
  const response = await extract({
    filePath: './test/data/receipt.pdf',
    provider: 'openai',
    model: 'gpt-4.1-mini',
    apiKey: process.env.OPENAI_API_KEY!,
    prompt: 'Extract and summarize the receipt details.'
  });

  console.log('OpenAI Unstructured PDF Result:', response);
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

  console.log('OpenAI Structured PDF (Receipt) Result:', JSON.stringify(response, null, 2));
}

// 5. Gemini Unstructured PDF Test
async function testGeminiUnstructuredPdf() {
  console.log('\nTesting Gemini unstructured extraction with Local PDF...');
  try {
    const response = await extract({
      filePath: './test/data/receipt.pdf',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY!,
      prompt: 'Extract and summarize the receipt details.'
    });

    console.log('Gemini Unstructured PDF Result:', response);
  } catch (error) {
    console.log('Gemini Unstructured PDF Test:', error);
  }
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

    if (typeof response !== 'string') {
      console.log('Gemini Structured PDF (Receipt) Result:', {
        parsed: response.parsed,
        raw: response.raw
      });
    }
  } catch (error) {
    console.log('Gemini Structured PDF Test:', error);
  }
}

// Main test runner for extraction tests
export async function runExtractionTests() {
  try {
    // mistral tests
    await testMistralUnstructuredPdf();
    await testMistralStructuredPdfBook();
    
    // OpenAI tests
    await testOpenAIUnstructuredPdf();
    await testOpenAIStructuredPdf();

    // Gemini tests
    await testGeminiUnstructuredPdf();
    await testGeminiStructuredPdf();
  } catch (error) {
    console.error('Extraction Tests failed:', error);
    throw error;
  }
}
