import { runOCRTests } from './ocr.test';
import { runExtractionTests } from './extract.test';

async function runAllTests() {
  try {
    console.log('Running OCR Tests...\n');
    await runOCRTests();
    
    console.log('\nRunning Extraction Tests...');
    await runExtractionTests();

  } catch (error) {
    console.error('Tests failed:', error);
    process.exit(1);
  }
}

// Run all tests
runAllTests(); 