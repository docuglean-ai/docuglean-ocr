const mammoth = require('mammoth');

export async function parseDocx(filePath: string) {
  if (!filePath) return { html: '', markdown: '', rawText: '' };
  
  const htmlResult = await mammoth.convertToHtml({ path: filePath });
  const markdownResult = await mammoth.convertToMarkdown({ path: filePath });
  const rawTextResult = await mammoth.extractRawText({ path: filePath });

  const markdown = markdownResult.value || '';
  
  return {
    html: htmlResult.value || '',
    markdown,
    rawText: rawTextResult.value || '',
    text: markdown,
  };
}


