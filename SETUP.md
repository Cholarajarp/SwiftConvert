# SwiftConvert - Production Setup Guide

## 🚀 Real Conversion System (OPTION 2)

This is a full-stack document conversion system using Node.js backend with Pandoc and LibreOffice integration.

## Prerequisites

### 1. Install Conversion Tools

#### On Windows:

**Pandoc:**
```bash
# Using Chocolatey
choco install pandoc

# Or download from: https://github.com/jgm/pandoc/releases
```

**LibreOffice:**
```bash
# Using Chocolatey
choco install libreoffice-fresh

# Or download from: https://www.libreoffice.org/download/
```

#### On macOS:

```bash
# Using Homebrew
brew install pandoc
brew install --cask libreoffice
```

#### On Linux (Ubuntu/Debian):

```bash
sudo apt-get install pandoc libreoffice
```

### 2. Verify Installation

```bash
pandoc --version
libreoffice --version
```

## Installation

### 1. Install Node Dependencies

```bash
npm install
```

This will install:
- **express**: Web framework
- **cors**: Cross-origin support
- **multer**: File upload handling
- **uuid**: Unique file naming
- **concurrently**: Run frontend and backend together

### 2. Start the System

#### Option A: Run both frontend and backend simultaneously
```bash
npm run dev:all
```

#### Option B: Run separately in different terminals
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

Backend runs on: `http://localhost:3001`
Frontend runs on: `http://localhost:5173` (or as Vite configures)

## Architecture

### Backend (`server.js`)

**Endpoints:**

1. **POST /api/convert**
   - Upload file and convert
   - Request: `multipart/form-data` with `file` and `toFormat`
   - Response: `{ success: true, fileName, downloadUrl }`
   - Supports: 20+ document, spreadsheet, and presentation formats

2. **GET /api/download/:filename**
   - Download converted file
   - Returns file attachment
   - Auto-deletes after download (5s timeout)

3. **GET /api/health**
   - Server health check
   - Response: `{ status: 'ok', message: '...' }`

4. **GET /api/formats**
   - List all supported formats
   - Response: `{ formats: [...] }`

### Supported Formats

| Category | Formats |
|----------|---------|
| **Documents** | PDF, DOCX, DOC, ODT, RTF, TXT, MD, HTML |
| **Spreadsheets** | XLSX, XLS, ODS, CSV |
| **Presentations** | PPTX, PPT, ODP |

### Conversion Priority

1. **Pandoc** (for documents): Lightweight, fast
2. **LibreOffice** (fallback): More comprehensive format support

## Frontend Implementation

The frontend component handles:
- File upload with drag-and-drop
- Format selection
- Upload progress tracking
- File download

See: `src/SwiftConvert.jsx`

## File Structure

```
├── server.js                 # Backend server
├── src/
│   ├── SwiftConvert.jsx      # Main conversion component
│   ├── pages/                # Route pages
│   └── ...
├── uploads/                  # Temp upload directory (auto-created)
├── converted/                # Output directory (auto-created)
└── package.json              # Dependencies
```

## Usage Example

### Frontend to Backend Flow:

1. User selects file (e.g., document.pdf)
2. Chooses target format (e.g., .docx)
3. Frontend POSTs to `/api/convert` with file + format
4. Backend processes conversion:
   - Tries Pandoc first
   - Falls back to LibreOffice if needed
5. Returns download link
6. User downloads converted file
7. Backend auto-cleans up files

## Error Handling

- **File too large**: Returns 400 (max 100MB)
- **Format unsupported**: Returns 500 with error message
- **Conversion failed**: Returns 500 with tool error details
- **Tool not installed**: Catches error and provides feedback

## Environment Variables

Optional configuration in `.env`:

```env
PORT=3001
NODE_ENV=production
```

## Performance Optimization

- Files stored temporarily, cleaned up after download
- Supports parallel conversions
- 100MB file size limit (configurable)
- Streaming downloads for large files

## Security Features

- ✅ CORS enabled for frontend requests
- ✅ Path traversal prevention on downloads
- ✅ File name sanitization
- ✅ Unique file naming with UUID
- ✅ Temporary file cleanup

## Troubleshooting

### "Pandoc not found"
```bash
# Verify installation
which pandoc
# or
where pandoc  # Windows
```

### "LibreOffice not found"
```bash
# Verify installation
which libreoffice
# or
where libreoffice.exe  # Windows
```

### File upload size limit
Modify in `server.js`:
```javascript
limits: { fileSize: 500 * 1024 * 1024 } // 500MB
```

### Port already in use
Change PORT:
```bash
PORT=3002 npm run server
```

## Deployment

### For Production:

1. Set `NODE_ENV=production`
2. Ensure Pandoc and LibreOffice are installed on server
3. Configure proper file cleanup strategy
4. Use PM2 or similar for process management
5. Consider using Docker for consistency

### Docker Setup:

```dockerfile
FROM node:18-alpine
RUN apk add --no-cache pandoc libreoffice
WORKDIR /app
COPY . .
RUN npm install --production
EXPOSE 3001
CMD ["node", "server.js"]
```

## Next Steps

1. Install conversion tools (Pandoc + LibreOffice)
2. Run `npm install` to install dependencies
3. Start with `npm run dev:all`
4. Test conversion via UI at `http://localhost:5173`
5. Deploy to production with proper infrastructure

---

**SwiftConvert**: Production-grade document conversion 🚀
