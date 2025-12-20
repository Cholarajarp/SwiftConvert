import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist folder in production
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Setup storage for uploads
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'converted');

[uploadDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Helper function to get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Helper function to convert with Pandoc
const convertWithPandoc = (inputPath, outputPath, fromFormat, toFormat) => {
  return new Promise((resolve, reject) => {
    const pandocProcess = spawn('pandoc', [
      inputPath,
      '-f', fromFormat,
      '-t', toFormat,
      '-o', outputPath
    ]);

    let stderrOutput = '';

    pandocProcess.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    pandocProcess.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`Pandoc conversion failed: ${stderrOutput}`));
      }
    });

    pandocProcess.on('error', (err) => {
      reject(err);
    });
  });
};

// Helper function to convert with LibreOffice
const convertWithLibreOffice = (inputPath, outputDir, toFormat) => {
  return new Promise((resolve, reject) => {
    const formatMap = {
      'pdf': 'writer_pdf_Export',
      'docx': 'Office Open XML Text',
      'doc': 'MS Word 97',
      'odt': 'writer8',
      'rtf': 'Rich Text Format',
      'txt': 'Text - txt - csv (StarCalc)',
      'xlsx': 'Calc Office Open XML',
      'xls': 'MS Excel 97',
      'ods': 'calc8',
      'pptx': 'Impress Office Open XML',
      'ppt': 'MS PowerPoint 97',
      'odp': 'impress8'
    };

    const filterName = formatMap[toFormat] || toFormat;

    const libreProcess = spawn('libreoffice', [
      '--headless',
      '--convert-to', `${toFormat}:${filterName}`,
      '--outdir', outputDir,
      inputPath
    ]);

    let stderrOutput = '';

    libreProcess.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    libreProcess.on('close', (code) => {
      if (code === 0) {
        const baseName = path.basename(inputPath, path.extname(inputPath));
        const outputFile = path.join(outputDir, `${baseName}.${toFormat}`);
        
        if (fs.existsSync(outputFile)) {
          resolve(outputFile);
        } else {
          reject(new Error('Converted file not found'));
        }
      } else {
        reject(new Error(`LibreOffice conversion failed: ${stderrOutput}`));
      }
    });

    libreProcess.on('error', (err) => {
      reject(err);
    });
  });
};

// Format support mapping
const formatSupport = {
  // Documents
  'pdf': { pandoc: 'pdf', libreoffice: true },
  'docx': { pandoc: 'docx', libreoffice: true },
  'doc': { pandoc: 'doc', libreoffice: true },
  'odt': { pandoc: 'odt', libreoffice: true },
  'rtf': { pandoc: 'rtf', libreoffice: true },
  'txt': { pandoc: 'plain', libreoffice: true },
  'md': { pandoc: 'markdown', libreoffice: false },
  'html': { pandoc: 'html', libreoffice: true },
  // Spreadsheets
  'xlsx': { pandoc: false, libreoffice: true },
  'xls': { pandoc: false, libreoffice: true },
  'ods': { pandoc: false, libreoffice: true },
  'csv': { pandoc: false, libreoffice: true },
  // Presentations
  'pptx': { pandoc: false, libreoffice: true },
  'ppt': { pandoc: false, libreoffice: true },
  'odp': { pandoc: false, libreoffice: true }
};

// Conversion endpoint
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { toFormat } = req.body;
    
    if (!toFormat) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Target format not specified' });
    }

    const inputPath = req.file.path;
    const inputExt = getFileExtension(req.file.originalname).slice(1).toLowerCase();
    const outputFileName = `${path.basename(inputPath, path.extname(inputPath))}.${toFormat}`;
    const outputPath = path.join(outputDir, outputFileName);

    // Determine conversion method
    let convertedFile;
    const canUsePandoc = formatSupport[inputExt]?.pandoc && formatSupport[toFormat]?.pandoc;
    const canUseLibreOffice = formatSupport[inputExt]?.libreoffice && formatSupport[toFormat]?.libreoffice;

    if (canUsePandoc) {
      // Try Pandoc first for documents
      try {
        convertedFile = await convertWithPandoc(
          inputPath,
          outputPath,
          formatSupport[inputExt].pandoc,
          formatSupport[toFormat].pandoc
        );
      } catch (pandocError) {
        if (!canUseLibreOffice) {
          throw pandocError;
        }
        // Fall back to LibreOffice
        convertedFile = await convertWithLibreOffice(inputPath, outputDir, toFormat);
      }
    } else if (canUseLibreOffice) {
      convertedFile = await convertWithLibreOffice(inputPath, outputDir, toFormat);
    } else {
      throw new Error(`Conversion from ${inputExt} to ${toFormat} is not supported`);
    }

    // Clean up input file
    fs.unlinkSync(inputPath);

    res.json({
      success: true,
      fileName: outputFileName,
      downloadUrl: `/api/download/${outputFileName}`
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: error.message || 'Conversion failed'
    });
  }
});

// Download endpoint
app.get('/api/download/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename); // Security: prevent directory traversal
    const filePath = path.join(outputDir, filename);

    // Verify file exists and is in the output directory
    const resolvedPath = path.resolve(filePath);
    const resolvedOutputDir = path.resolve(outputDir);

    if (!resolvedPath.startsWith(resolvedOutputDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, filename, (err) => {
      if (!err) {
        // Clean up file after download (optional)
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Supported formats endpoint
app.get('/api/formats', (req, res) => {
  res.json({ formats: Object.keys(formatSupport) });
});

// Serve SPA catch-all in production
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 SwiftConvert Backend running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
});
