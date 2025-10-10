import { ocr } from '../src';
import { handleMistralOCRResponse } from '../src/utils';
import { MistralOCRResponse, OpenAIOCRResponse, GeminiOCRResponse, LocalOCRResponse } from '../src/types';

// 1. Mistral URL Image Test
async function testMistralUrlImage() {
  console.log('Testing Mistral OCR with URL image...');
  const response = await ocr({
    filePath: 'https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png',
    provider: 'mistral',
    model: 'mistral-ocr-latest',
    apiKey: process.env.MISTRAL_API_KEY!,
    options: {
      mistral: {
        includeImageBase64: true
      }
    }
  });
  
  const result = handleMistralOCRResponse(response as MistralOCRResponse);
  console.log('Mistral URL Image Result:', {
    markdown: result.markdown.substring(0, 200) + '...',
    imageCount: result.images.length
  });
}

// 2. Mistral Local Image Test
async function testMistralLocalImage() {
  console.log('\nTesting Mistral OCR with local image...');
  const response = await ocr({
    filePath: './test/data/testocr.png',
    provider: 'mistral',
    model: 'mistral-ocr-latest',
    apiKey: process.env.MISTRAL_API_KEY!,
    options: {
      mistral: {
        includeImageBase64: true
      }
    }
  });

  const result = handleMistralOCRResponse(response as MistralOCRResponse);
  console.log('Mistral Local Image Result:', {
    markdown: result.markdown.substring(0, 200) + '...',
    imageCount: result.images.length
  });
}

// 3. Mistral URL PDF Test
async function testMistralUrlPdf() {
  console.log('\nTesting Mistral OCR with URL PDF...');
  const response = await ocr({
    filePath: 'https://arxiv.org/pdf/2302.12854',
    provider: 'mistral',
    model: 'mistral-ocr-latest',
    apiKey: process.env.MISTRAL_API_KEY!
  });
  
  const result = handleMistralOCRResponse(response as MistralOCRResponse);
  console.log('Mistral URL PDF Result:', {
    markdown: result.markdown.substring(0, 200) + '...',
    imageCount: result.images.length
  });
}

// 4. Mistral Local PDF Test
async function testMistralLocalPdf() {
  console.log('\nTesting Mistral OCR with local PDF...');
  const response = await ocr({
    filePath: './test/data/statement.pdf',
    provider: 'mistral',
    model: 'mistral-ocr-latest',
    apiKey: process.env.MISTRAL_API_KEY!
  });

  const result = handleMistralOCRResponse(response as MistralOCRResponse);
  console.log('Mistral Local PDF Result:', {
    markdown: result.markdown.substring(0, 200) + '...',
    imageCount: result.images.length
  });
}

// 5. OpenAI URL Image Test
async function testOpenAIUrlImage() {
  console.log('\nTesting OpenAI OCR with URL image...');
  const response = await ocr({
    filePath: 'https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png',
    provider: 'openai',
    model: 'gpt-4.1-mini',
    apiKey: process.env.OPENAI_API_KEY!
  });

  const result = response as OpenAIOCRResponse;
  console.log('OpenAI URL Image Result:', {
    text: result.text.substring(0, 200) + '...',
    usage: result.usage
  });
}

// 6. OpenAI Local Image Test
async function testOpenAILocalImage() {
  console.log('\nTesting OpenAI OCR with local image...');
  const response = await ocr({
    filePath: './test/data/testocr.png',
    provider: 'openai',
    model: 'gpt-4.1-mini',
    apiKey: process.env.OPENAI_API_KEY!
  });

  const result = response as OpenAIOCRResponse;
  console.log('OpenAI Local Image Result:', {
    text: result.text.substring(0, 200) + '...',
    usage: result.usage
  });
}

// 7. OpenAI Local PDF Test
async function testOpenAILocalPdf() {
  console.log('\nTesting OpenAI OCR with local PDF...');
  try {
    const response = await ocr({
      filePath: './test/data/statement.pdf',
      provider: 'openai',
      model: 'gpt-4.1-mini',
      apiKey: process.env.OPENAI_API_KEY!
    });

    const result = response as OpenAIOCRResponse;
    console.log('OpenAI Local PDF Result:', {
      text: result.text.substring(0, 200) + '...',
      usage: result.usage
    });
  } catch (error) {
    console.log('OpenAI Local PDF Test:', error);
  }
}

// 8. OpenAI URL PDF Test - should fail
async function testOpenAIUrlPdf() {
  console.log('\nTesting OpenAI OCR with URL PDF (should fail)...');
  try {
    await ocr({
      filePath: 'https://arxiv.org/pdf/2302.12854',
      provider: 'openai',
      model: 'gpt-4.1-mini',
      apiKey: process.env.OPENAI_API_KEY!
    });
  } catch (error) {
    console.log('OpenAI URL PDF Test (Expected Error):', error);
  }
}

// 9. Gemini URL Image Test
async function testGeminiUrlImage() {
  console.log('\nTesting Gemini OCR with URL image...');
  try {
    const response = await ocr({
      filePath: 'https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY!,
      prompt: 'Extract all text from this image using OCR.'
    });

    const result = response as GeminiOCRResponse;
    console.log('Gemini URL Image Result:', {
      text: result.text.substring(0, 200) + '...',
      model_used: result.model_used
    });
  } catch (error) {
    console.log('Gemini URL Image Test:', error);
  }
}

// 10. Gemini Local Image Test
async function testGeminiLocalImage() {
  console.log('\nTesting Gemini OCR with local image...');
  try {
    const response = await ocr({
      filePath: './test/data/testocr.png',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY!,
      prompt: 'Extract all text from this image using OCR.'
    });

    const result = response as GeminiOCRResponse;
    console.log('Gemini Local Image Result:', {
      text: result.text.substring(0, 200) + '...',
      model_used: result.model_used
    });
  } catch (error) {
    console.log('Gemini Local Image Test:', error);
  }
}

// Main test runner for OCR tests
export async function runOCRTests() {
  try {
    // mistral tests
    await testMistralUrlImage();
    await testMistralLocalImage();
    await testMistralUrlPdf();
    await testMistralLocalPdf();

    // OpenAI Tests
    await testOpenAIUrlImage();
    await testOpenAILocalImage();
    await testOpenAILocalPdf();
    await testOpenAIUrlPdf();

    // Gemini Tests
    await testGeminiUrlImage();
    await testGeminiLocalImage();

    // Local parsing test (PDF only)
    const localResp = await ocr({
      filePath: './test/data/receipt.pdf',
      provider: 'local',
      apiKey: 'local'
    });
    const local = localResp as LocalOCRResponse;
    console.log('Local OCR Result (first 200 chars):', local.text.substring(0, 200) + '...');
  } catch (error) {
    console.error('OCR Tests failed:', error);
    throw error;
  }
}
