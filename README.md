# SwiftConvert 🚀 + AI/ML

A modern, production-ready file conversion web application built with React, Vite, Tailwind CSS, and Python Flask. Convert documents, images, and spreadsheets between 15 file formats effortlessly with **integrated AI/ML features** including OCR, Document Classification, Smart Recommendations, and Translation.

** Cloud-Optimized**: No LibreOffice dependency - deploys seamlessly to Render, Railway, AWS, and Netlify!

![SwiftConvert](https://img.shields.io/badge/Version-3.0.0--AI-blue)
![Python Version](https://img.shields.io/badge/Python-3.11-green)
![Node Version](https://img.shields.io/badge/Node-20.x-green)
![License](https://img.shields.io/badge/License-Proprietary-red)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![AI/ML](https://img.shields.io/badge/AI-Powered-purple)
![Cloud](https://img.shields.io/badge/Cloud-Ready-brightgreen)

---

##  Features

### Core Conversion Features
-  **Fast Conversions** - Lightning-speed processing using pdf2docx, reportlab, and Pillow
-  **15+ Formats** - PDF, DOCX, JPG, PNG, CSV, XLSX (cloud-optimized)
-  **Cloud-Ready** - No LibreOffice required! Deploys to any cloud platform
-  **Secure & Private** - Files automatically deleted after 24 hours
-  **Beautiful UI** - Modern, responsive design with Tailwind CSS
-  **Drag & Drop** - Easy file upload interface
-  **Progress Tracking** - Real-time conversion progress display
-  **Stripe Integration** - Secure payment processing for Pro plan (₹49/month)
-  **Production Ready** - Optimized Python Flask backend
-  **Full-Stack** - React frontend + Python backend
-  **Docker Support** - Easy deployment with Docker and Docker Compose

###  AI/ML Features (NEW!)

#### 1️⃣ OCR - Computer Vision + NLP
-  **Text Extraction** - Extract text from images and PDFs using EasyOCR/Tesseract (PDF pages are rendered to images before OCR)
-  **Per-page Confidence** - Returns confidence and word counts per page so you can identify low-quality pages
-  **High-quality OCR** - Optional high-DPI rendering (300 DPI) for better accuracy (slower)
-  **Multi-Language & Translation** - English, Hindi, Kannada support; post-OCR translation pipeline available
-  **Noise Handling** - Preprocessing with OpenCV to improve recognition
- **Stack**: EasyOCR, Tesseract, OpenCV, Pillow, PyMuPDF (for PDF rendering)

#### 2️⃣ Document Classification - NLP
-  **Auto-Detect Type** - Invoice, Resume, Research Paper, Legal Document
-  **TF-IDF + ML** - Feature extraction and classification
-  **Confidence Scores** - Probability distribution across categories
-  **Keyword-based + ML** - Hybrid approach for accuracy
- **Stack**: scikit-learn, TF-IDF, transformers (ready for BERT upgrade)

#### 3️⃣ Smart Format Recommendation
-  **AI Suggestions** - Best output format based on content analysis
-  **File Size Analysis** - Optimal format for compression
-  **Content-Aware** - Recommendations based on document type
-  **Confidence Ranking** - Multiple options with probability scores
- **Stack**: Rule-based ML + Content Analysis

#### 4️⃣ Quality Scoring - Regression
-  **Quality Prediction** - 0-100 score for conversion quality
-  **Size Ratio Analysis** - Input/output size correlation
-  **OCR Confidence** - Integration with OCR metrics
-  **Metrics Dashboard** - Detailed quality breakdown
- **Stack**: Statistical analysis + ML regression models

#### 5️⃣ Language Detection + Translation
-  **Auto-Detect Language** - langdetect with confidence scores
-  **Multi-Language Translation** - English, Hindi, Kannada, Tamil, Telugu, Spanish, French
-  **Confidence Metrics** - Probability for each detected language
-  **Post-OCR Translation** - Extract + Translate pipeline
- **Stack**: langdetect, deep-translator, Google Translate API

#### 6️⃣ Usage Analytics - ML Insights
-  **Conversion Tracking** - Success rates, popular formats
-  **Failure Pattern Analysis** - ML-based error prediction
-  **User Behavior Clustering** - Usage pattern identification
-  **Predictive Analytics** - Failure prediction models
- **Stack**: pandas, scikit-learn, JSON-based analytics

---

### OCR Notes & Troubleshooting
- **High-quality OCR:** Use the **"High quality OCR (slower)"** option in the **AI / ML Features** panel to enable 300 DPI rendering for PDFs. This improves recognition accuracy at the cost of additional CPU/memory and processing time.
- **Per-page results:** OCR responses include `ocr.per_page` with per-page confidence (0–1) and word counts so you can pinpoint problem pages.
- **Installation:** OCR requires `easyocr` and `PyMuPDF` (pymupdf). Install with: `pip install pymupdf easyocr reportlab`. For GPU acceleration (recommended for bulk processing), install a compatible PyTorch build via https://pytorch.org.
- **Common issues & fixes:**
  - **No text detected / low confidence:** Try the High-quality option, use clearer scans, or increase DPI for specific files.
  - **Permission errors on Windows:** Close the file in other apps before converting — the server retries deletions automatically when safe.
  - **ML features unavailable (503):** Ensure you ran the server inside your project virtualenv with ML packages installed (see Quick Start). The app still supports non-ML conversions without EasyOCR installed.

## 📦 Supported Formats (14)

### Documents
- **Input/Output**: PDF, DOCX, DOC, ODT, RTF, TXT, MD

### Spreadsheets
- **Input/Output**: XLSX, XLS, ODS, CSV

### Presentations
- **Input/Output**: PPTX, ODP

### Images
- **Input/Output**: JPG, JPEG, PNG

### Popular Conversions
- **PDF ↔ DOCX** (pdf2docx, reportlab)  
- **Image → PDF** (Pillow)  
- **CSV ↔ XLSX** (pandas)  
- **CSV → PDF** (reportlab)  
- **TXT/MD ↔ DOCX**, **TXT → PDF** (python-docx, reportlab)  
- **OCR (Image/PDF)** — per-page confidences and optional high-quality mode (selectable in UI) 

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** (create and use a virtualenv)
- **Node.js 20+**
- **PyMuPDF (pymupdf)** — used to render PDF pages for OCR (`pip install pymupdf`)
- **EasyOCR + PyTorch** — required for OCR features (CPU works; GPU recommended for faster processing)
- **reportlab** — PDF generation library (replaces LibreOffice-based workflows)
- **Docker & Docker Compose** (optional, for containerized deployment)

> Notes: OCR features depend on EasyOCR/PyTorch; if these packages are not installed, ML features will be disabled and the app will still run for standard conversions.

### Option 1: Traditional Setup

```bash
# 1. Clone the repository
git clone https://github.com/Cholarajarp/SwiftConvert.git
cd SwiftConvert

# 2. Install Python dependencies
pip install -r requirements.txt

# Optional (OCR / High-quality OCR support)
# If you plan to use OCR features or PDF rendering for OCR, ensure the following are installed:
# pip install pymupdf easyocr reportlab
# For GPU support (recommended for large workloads), install a CUDA-enabled PyTorch build from https://pytorch.org (follow the site instructions to pick the correct wheel for your CUDA version).

# 3. Install Node dependencies
npm install

# 4. Create environment file
cp .env.example .env
# Edit .env and add your Stripe keys

# 5. Start the backend (Python Flask)
python app.py

# 6. In another terminal, start the frontend
npm run dev
```

### Option 2: Docker Deployment (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/Cholarajarp/SwiftConvert.git
cd SwiftConvert

# 2. Create environment file
cp .env.example .env
# Edit .env and add your Stripe keys

# 3. Build and run with Docker Compose
docker-compose up --build

# To run in background
docker-compose up -d

# To stop
docker-compose down
```

**Docker URLs:**
- Frontend: **http://localhost**
- Backend API: **http://localhost:3001**

### Option 3: Azure (Beginner-friendly)
If you're new to cloud hosting, this is the simplest path: deploy the frontend to **Azure Static Web Apps** and the Python backend to **Azure App Service**. The two workflows below are included in `.github/workflows/` and will deploy when you push to `main` after adding the required GitHub Secrets.

Quick steps (beginner):
1. Create a Resource Group in your preferred region (e.g., `eastus`).
2. Create an **Azure Static Web App** (Frontend): connect it to this GitHub repo when prompted — the portal can generate the deployment token and will provide the `AZURE_STATIC_WEB_APPS_API_TOKEN` value. Configure the build: `app_location = /`, `output_location = dist`.
3. Create an **Azure Web App (App Service)** for the Python backend (Linux, Python 3.11). Note your Web App name and replace `swconvert-backend` in the workflow or set it via variables.
4. In the Web App -> Get Publish Profile and add it to your GitHub repository secrets as `AZURE_WEBAPP_PUBLISH_PROFILE`.
5. Add required environment variables to the Web App (or secure them in Key Vault):
   - `AZURE_STORAGE_CONNECTION_STRING` (for Blob uploads)
   - `DATABASE_URL` (Postgres/MySQL connection string if you use a DB)
   - `KEY_VAULT_URI` (if using Key Vault) or individual secrets in App Settings
6. Push to `main` — Static Web App will deploy the frontend, and the backend workflow will zip & deploy to App Service.

Required GitHub Secrets (add in repo Settings -> Secrets):
- `AZURE_STATIC_WEB_APPS_API_TOKEN` — token generated by Static Web App or from Azure
- `AZURE_WEBAPP_PUBLISH_PROFILE` — get from the Web App "Get publish profile" in the portal
- `AZURE_WEBAPP_NAME` — your Web App name (used by the backend deploy workflow)
- (optional) `AZURE_STORAGE_CONNECTION_STRING` — if you want to upload to Blob Storage from workflows or to set as an env secret

Notes & tips:
- The frontend uses Vite and builds into `dist/`. The Static Web App workflow in `.github/workflows/static-webapp.yml` is preconfigured for this repo.
- The backend workflow `.github/workflows/backend-deploy.yml` uses the publish profile method (simple for beginners). Replace `swconvert-backend` in the workflow with your real Web App name.
- For production file storage, use **Azure Blob Storage** instead of the local `uploads/` folder (App Service storage is ephemeral across scaled instances).
- To configure CORS: add `flask-cors` to your backend (`pip install flask-cors`) and allow your Static Web App origin, e.g.:

```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app, origins=["https://<your-static-site>.azurestaticapps.net"])
```

This prevents cross-origin errors when the frontend calls the backend.
- For advanced security, use **Key Vault** + Managed Identity to avoid storing secrets directly in App Settings.

**Traditional Setup URL:**
- Visit: **http://localhost:5173**

**Docker URLs:**
- Frontend: **http://localhost**
- Backend API: **http://localhost:3001**

**Traditional Setup URL:**
- Visit: **http://localhost:5173**

---

## 💳 Pricing

### Free Plan
-  5 conversions per day
-  15 file formats
-  Up to 50MB file size
-  Basic quality

### Pro Plan - ₹49/month ($0.60 USD)
-  Unlimited conversions
-  15 file formats
-  Up to 200MB file size
-  High quality conversions
-  Batch processing
-  Priority support

### Enterprise Plan - Custom
-  Custom pricing
-  API access
-  Dedicated support

---

## 📁 Project Structure

```
SwiftConvert-Vite-Scaffold/
├── app.py                   # Python Flask backend (main server)
├── converters.py            # 🆕 Core conversion logic module
├── ml_features.py           # 🆕 AI/ML Features Module
├── ocr_utils.py             # 🆕 OCR utilities (EasyOCR, Tesseract)
├── fs_utils.py              # 🆕 File system utilities
├── requirements.txt         # Python dependencies (with AI/ML libs)
├── package.json             # Node dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── index.html               # HTML entry point
├── .env.example             # Environment variables template
├── .env                     # Environment variables (git-ignored)
├── LICENSE                  # Proprietary License
├── README.md                # This file
├── Dockerfile               # Backend Docker image
├── Dockerfile.frontend      # Frontend Docker image
├── docker-compose.yml       # Docker Compose configuration
├── nginx.conf               # Nginx configuration for frontend
├── .dockerignore            # Docker ignore file
├── Procfile                 # 🆕 Heroku/Railway deployment config
├── runtime.txt              # 🆕 Python runtime version
├── render.yaml              # Render deployment configuration
├── railway.json             # Railway deployment configuration
├── netlify.toml             # Netlify deployment configuration
├── analytics.json           # 🆕 Usage analytics database
├── src/
│   ├── main.jsx            # React entry point
│   ├── index.css           # Global styles
│   ├── App.jsx             # React router setup
│   ├── SwiftConvert.jsx    # Main conversion component
│   ├── components/
│   │   ├── PageHeader.jsx     # Reusable header component
│   │   ├── PricingCard.jsx    # Reusable pricing card
│   │   ├── ContentSection.jsx # Reusable content section
│   │   ├── AIFeatures.jsx     # 🆕 AI/ML Features UI
│   │   └── HelpSupport.jsx    # 🆕 Help & Support component
│   └── pages/
│       ├── About.jsx       # About page
│       ├── Pricing.jsx     # Pricing page (with Stripe)
│       ├── Privacy.jsx     # Privacy policy
│       └── Terms.jsx       # Terms of service
├── tests/                  # 🆕 Test suite
│   ├── test_app_endpoints.py   # API endpoint tests
│   ├── test_converters.py      # Conversion logic tests
│   └── test_ocr_utils.py       # OCR functionality tests
├── uploads/                # Temporary upload directory (git-ignored)
├── converted/              # Temporary output directory (git-ignored)
├── dist/                   # Production build output (git-ignored)
└── __pycache__/            # Python cache (git-ignored)
```

---

##  API Endpoints

### Standard Conversion Endpoints

#### Health Check
```bash
GET /api/health
```

#### Convert File
```bash
POST /api/convert
Content-Type: multipart/form-data
Body: { file: <file>, toFormat: "docx" }
```

#### Download File
```bash
GET /api/download/{filename}
```

#### Create Payment
```bash
POST /api/create-checkout-session
Body: { "plan": "pro", "currency": "inr" }
```

###  AI/ML Endpoints (NEW!)

#### OCR - Extract Text from Image
```bash
POST /api/ocr
Content-Type: multipart/form-data
Body: { file: <image>, engine: "easyocr" }

Response: {
  "text": "Extracted text...",
  "confidence": 0.92,
  "language": "en",
  "word_count": 145,
  "blocks": [...]
}
```

#### Document Classification
```bash
POST /api/classify-document
Content-Type: application/json
Body: { "text": "document content..." }

Response: {
  "category": "resume",
  "confidence": 0.85,
  "scores": {
    "invoice": 0.1,
    "resume": 0.85,
    "research": 0.05
  }
}
```

#### Smart Format Recommendation
```bash
POST /api/recommend-format
Content-Type: multipart/form-data
Body: { file: <file> }

Response: {
  "recommendations": [
    {
      "format": "pdf",
      "reason": "Large image - PDF provides better compression",
      "confidence": 0.9
    }
  ]
}
```

#### Quality Scoring
```bash
POST /api/quality-score
Content-Type: application/json
Body: {
  "input_file": "input.pdf",
  "output_file": "output.docx",
  "conversion_type": "pdf_to_docx"
}

Response: {
  "quality_score": 85.3,
  "confidence": 0.75,
  "recommendation": "Good quality",
  "metrics": {...}
}
```

#### Language Detection
```bash
POST /api/detect-language
Content-Type: application/json
Body: { "text": "Hello world" }

Response: {
  "primary_language": "en",
  "confidence": 0.99,
  "all_languages": [...]
}
```

#### Text Translation
```bash
POST /api/translate
Content-Type: application/json
Body: {
  "text": "Hello",
  "target_language": "hi",
  "source_language": "en"
}

Response: {
  "translated": "नमस्ते",
  "original": "Hello",
  "success": true
}
```

#### OCR + Convert (Combined Pipeline)
```bash
POST /api/ocr-and-convert
Content-Type: multipart/form-data
Body: {
  file: <image>,
  toFormat: "docx",
  translate: true,
  targetLang: "en"
}

Response: {
  "success": true,
  "filename": "output.docx",
  "downloadUrl": "/api/download/output.docx",
  "ocr": {
    "confidence": 0.92,
    "word_count": 145,
    "language": "en"
  },
  "classification": {
    "category": "invoice",
    "confidence": 0.78
  },
  "translation": {...}
}
```

#### Usage Analytics
```bash
GET /api/analytics

Response: {
  "total_conversions": 1250,
  "success_rate": 94.5,
  "popular_conversions": {...},
  "failure_patterns": [...]
}
```

---

##  ML/AI Skills Demonstrated

### Computer Vision
-  Text extraction pipelines (OCR)
-  Image preprocessing (OpenCV)
-  Noise handling and enhancement
-  Multi-language support

### Natural Language Processing (NLP)
-  Document classification
-  Text embeddings (TF-IDF)
-  Language detection
-  Machine translation
-  Feature engineering

### Machine Learning
-  Classification models (document types)
-  Regression (quality scoring)
-  Recommendation systems
-  Confidence scoring
-  Model evaluation metrics

### Data Engineering
-  Usage analytics tracking
-  Pattern analysis
-  Failure prediction
-  Data pipeline design

### Production ML
-  Model deployment (Flask API)
-  Real-time inference
-  Error handling
-  Performance monitoring
-  Scalable architecture

**Tech Stack**:
- **Deep Learning**: Transformers, BERT (ready)
- **Traditional ML**: scikit-learn, TF-IDF
- **Computer Vision**: EasyOCR, Tesseract, OpenCV
- **NLP**: langdetect, deep-translator, NLTK
- **Framework**: Flask, PyTorch

---

##  Deployment

### Docker Production Deployment

```bash
# 1. Set environment variables
cp .env.example .env
# Edit .env with production Stripe keys

# 2. Build and run
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# 4. Scale if needed
docker-compose up -d --scale backend=2

# 5. Update deployment
docker-compose pull
docker-compose up -d --build
```

### Render.com Deployment

1. Push to GitHub
2. Create new Web Service on Render
3. Select **Python** runtime
4. Build command: `pip install -r requirements.txt && npm install && npm run build`
5. Start command: `python app.py`
6. Add environment variables:
   - `STRIPE_PUBLIC_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `PRO_PLAN_PRICE_INR=49`

### Docker Hub (Optional)

```bash
# Build images
docker build -t swiftconvert-backend:latest -f Dockerfile .
docker build -t swiftconvert-frontend:latest -f Dockerfile.frontend .

# Tag and push
docker tag swiftconvert-backend:latest yourusername/swiftconvert-backend:latest
docker tag swiftconvert-frontend:latest yourusername/swiftconvert-frontend:latest
docker push yourusername/swiftconvert-backend:latest
docker push yourusername/swiftconvert-frontend:latest
```

---

##  Cloud Deployment (No LibreOffice Required!)

SwiftConvert v3.0.0-AI is **optimized for cloud deployment** using only Python libraries!

###  Supported Platforms
-  **Render** - One-click deployment
-  **Railway** - Git push deployment  
-  **AWS Elastic Beanstalk** - Enterprise scale
-  **Netlify** - Frontend hosting
-  **Docker** - Any cloud provider

###  Cloud-Ready Features
-  No LibreOffice dependency
-  Pure Python conversions (reportlab, pdf2docx)
-  Lightweight Docker images
-  Gunicorn production server
-  Auto-scaling ready
-  Environment-based configuration

### 🔧 Quick Deploy Commands

**Render:**
```bash
# Push to GitHub, then deploy via Render dashboard
# Uses render.yaml for automatic configuration
```

**Railway:**
```bash
railway login && railway init && railway up
```

**AWS:**
```bash
eb init -p python-3.11 swiftconvert
eb create production
eb deploy
```

**Netlify (Frontend):**
```bash
netlify deploy --prod
```

## 🛠️ Development

```bash
# Backend
python app.py

# Frontend
npm run dev

# Build for production
npm run build
```

```bash
# Docker development
# Run with hot reload
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart backend

# Clean up
docker-compose down -v
```

---

## 📝 License

This project is licensed under a **Proprietary License** - see the [LICENSE](LICENSE) file for details.

### What this means:
 **Free to use** - Use the software for personal or commercial purposes at no charge  
 **Access source code** - View and learn from the code  
 **No copying** - Cannot copy or redistribute without permission  
 **No modification** - Cannot modify and redistribute as your own  
 **No commercial redistribution** - Cannot sell or distribute copies  
 **Permission required** - Contact owner for copying, redistribution, or derivative works  

**You are free to:**
- Use the software for any purpose (personal or commercial)
- Access the source code for learning purposes
- Deploy your own instance for your use

**You CANNOT do without permission:**
- Copy or redistribute the software
- Create and distribute modified versions
- Sell or sublicense the software
- Remove copyright notices

**To request permission:**  
Contact: ccholarajarp@gmail.com

**Copyright © 2025 Cholaraja R P. All Rights Reserved.**

---

## 👨‍💻 Author

**Cholaraja R P**
- GitHub: [@Cholarajarp](https://github.com/Cholarajarp)
- LinkedIn: [Cholaraja R P](https://www.linkedin.com/in/cholaraja-r-p-4128a624b)
- Email: ccholarajarp@gmail.com

---

## 📊 Status

 **Backend**: Python Flask - Fully operational  
 **Frontend**: React + Vite - Fully operational  
 **Conversions**: 15 formats - All working  
 **Payment**: Stripe integration - Ready  
 **Deployment**: Production-ready  
 **Docker**: Container support enabled  
 **License**: Proprietary - Usage allowed, copying restricted  
 **AI/ML**: 6 Features - OCR, Classification, Translation, Quality Scoring, Analytics  
 **ML Stack**: EasyOCR, scikit-learn, Transformers, PyTorch, OpenCV


## ⚠️ Security

- Files are automatically deleted after 24 hours
- All Stripe keys should be stored in `.env` file (never commit)
- Use HTTPS in production
- Update dependencies regularly: `npm audit fix` and `pip list --outdated`
- ML models run in isolated processes
- Input validation on all AI/ML endpoints

**Built with ❤️ using Python, React, and AI/ML technologies**