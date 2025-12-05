# Docuglean Demo – Intelligent Document Processing (NestJS + OCR)

This project is a lightweight demo application built with **NestJS** and a simple **HTML/JS frontend** for uploading and processing PDF documents using **Docuglean OCR** with multiple AI providers (OpenAI, Mistral, Gemini).

Users can upload a PDF, provide their API key, select a provider, and receive rich extracted document data (title, summary, metadata, content, etc.).

---

## 🚀 Features

- PDF upload with drag & drop support  
- AI provider selection (OpenAI, Mistral, Gemini)  
- Secure processing: API keys are **not stored**, only used per request  
- Uses **Docuglean OCR** for intelligent extraction  
- Clean JSON results view + "Copy JSON" button  
- 10MB PDF upload limit  
- Fully local-capable (no external backend needed beyond your machine)

---

## 📦 Tech Stack

**Backend:**  
- NestJS  
- docuglean-ocr  
- Zod (schema validation)  
- Multer (file upload)  
- ServeStatic for frontend

**Frontend:**  
- Plain HTML/CSS/JS (no frameworks)  
- Fetch API form submission

---

# 🛠️ Installation & Setup

Follow these steps to clone, install, and run the project.

---

## 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
````

---

## 2️⃣ Install dependencies

Use any Node package manager. Example using **pnpm** (recommended by Nest):

```bash
pnpm install
```

Or using npm:

```bash
npm install
```

Or yarn:

```bash
yarn install
```

---

## 3️⃣ Create an environment file (optional)

The app supports `.env` for defining a custom port.

Create a `.env` file:

```bash
PORT=3000
```

If omitted, it defaults to **3000**.

---

## 4️⃣ Run the application

### Development mode (auto-reload)

```bash
pnpm start:dev
```

### Standard start

```bash
pnpm start
```

### Production build

```bash
pnpm build
pnpm start:prod
```

---

# 🧪 Running Tests

```bash
pnpm test       # unit tests
pnpm test:e2e   # e2e tests
pnpm test:cov   # coverage
```

---

# 🖥️ Using the App (What to do after installation)

Once the server is running, open:

```
http://localhost:3000
```

You will see the frontend interface.

### How to use it:

1. **Select an AI provider**

   * OpenAI
   * Mistral
   * Google Gemini

2. **Enter your API key**

   * The backend uses this key only for your request
   * It is *never stored or logged*

3. **Upload a PDF document**

   * Must be ≤ 10MB
   * Drag & drop or click to upload
   * Only `.pdf` files accepted

4. **Click “Process Document”**

The backend will:

* Store the file temporarily
* Pass it to `docuglean-ocr`
* Apply the Zod schema
* Return extracted structured JSON
* Delete the temp file

The results then appear on the right side, where you can:

✔ View formatted JSON
✔ Copy JSON to clipboard
✔ See success/error messages

---

# 🔧 API Route Details

### `POST /process-document`

Form-data fields:

| Field    | Type        | Description           |           |          |
| -------- | ----------- | --------------------- | --------- | -------- |
| file     | file (.pdf) | PDF file to process   |           |          |
| apiKey   | string      | Your provider API key |           |          |
| provider | string      | "openai"              | "mistral" | "gemini" |

Backend validates:

* File existence
* Key provided
* Max size 10MB (via Multer)

Returns:

```json
{
  "success": true,
  "data": { ...extracted fields... },
  "filename": "your-file.pdf"
}
```

Errors return:

```json
{
  "statusCode": 400,
  "message": "Failed to process document: ..."
}
```

---

# 📁 Project Structure

```
public/        → Frontend (HTML, CSS, JS)
src/           → NestJS backend
temp/          → Temporary uploaded files (auto-created)
```

