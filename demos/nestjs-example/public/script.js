const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const fileUpload = document.getElementById('fileUpload');
const fileName = document.getElementById('fileName');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const resultContent = document.getElementById('resultContent');

// File upload handling
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    fileName.textContent = `Selected: ${file.name}`;
    fileName.style.display = 'block';
  }
});

// Drag and drop
fileUpload.addEventListener('dragover', (e) => {
  e.preventDefault();
  fileUpload.classList.add('dragover');
});

fileUpload.addEventListener('dragleave', () => {
  fileUpload.classList.remove('dragover');
});

fileUpload.addEventListener('drop', (e) => {
  e.preventDefault();
  fileUpload.classList.remove('dragover');

  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    const file = e.dataTransfer.files[0];
    fileName.textContent = `Selected: ${file.name}`;
    fileName.style.display = 'block';
  }
});

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  error.classList.remove('active');
  submitBtn.disabled = true;
  loading.classList.add('active');
  resultContent.innerHTML =
    '<p style="color: #999; text-align: center; padding: 40px 0;">Processing...</p>';

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('apiKey', document.getElementById('apiKey').value);
  formData.append('provider', document.getElementById('provider').value);

  try {
    const response = await fetch('/process-document', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to process document');
    }

    displayResult(data);
  } catch (err) {
    error.textContent =
      err.message || 'An error occurred while processing the document';
    error.classList.add('active');
    resultContent.innerHTML =
      '<p style="color: #999; text-align: center; padding: 40px 0;">Upload a document to see the extracted data here</p>';
  } finally {
    submitBtn.disabled = false;
    loading.classList.remove('active');
  }
});

function displayResult(data) {
  const jsonString = JSON.stringify(data.data, null, 2);

  resultContent.innerHTML = `
                <div class="success-badge">✓ Document processed successfully</div>
                <button class="copy-btn" onclick="copyToClipboard()">Copy JSON</button>
                <div class="result-container">
                    <pre id="jsonOutput">${escapeHtml(jsonString)}</pre>
                </div>
            `;
}

function copyToClipboard() {
  const jsonOutput = document.getElementById('jsonOutput').textContent;
  navigator.clipboard.writeText(jsonOutput).then(() => {
    const btn = document.querySelector('.copy-btn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
