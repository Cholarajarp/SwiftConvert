# SwiftConvert 🚀

A modern, production-ready file conversion web application built with React, Vite, Tailwind CSS, and Python Flask. Convert documents, images, and spreadsheets between 15 file formats effortlessly with integrated Stripe payment processing.

![SwiftConvert](https://img.shields.io/badge/Version-2.0.0-blue)
![Python Version](https://img.shields.io/badge/Python-3.11-green)
![Node Version](https://img.shields.io/badge/Node-20.x-green)
![License](https://img.shields.io/badge/License-Proprietary-red)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

---

## 🎯 Features

- ⚡ **Fast Conversions** - Lightning-speed processing using pdf2docx, PIL, and LibreOffice
- 📁 **15+ Formats** - PDF, DOCX, DOC, ODT, RTF, TXT, MD, HTML, XLSX, XLS, ODS, CSV, PPTX, ODP, JPG, PNG
- 🔒 **Secure & Private** - Files automatically deleted after 24 hours
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
- 🎯 **Drag & Drop** - Easy file upload interface
- 📊 **Progress Tracking** - Real-time conversion progress display
- 💳 **Stripe Integration** - Secure payment processing for Pro plan (₹49/month)
- 🚀 **Production Ready** - Optimized Python Flask backend
- 🌐 **Full-Stack** - React frontend + Python backend
- 🐳 **Docker Support** - Easy deployment with Docker and Docker Compose

---

## 📦 Supported Formats (15)

### Documents
- **Input/Output**: PDF, DOCX, DOC, ODT, RTF, TXT, MD, HTML

### Spreadsheets
- **Input/Output**: XLSX, XLS, ODS, CSV

### Presentations
- **Input/Output**: PPTX, ODP

### Images
- **Input/Output**: JPG, JPEG, PNG

### Popular Conversions
✅ **PDF → DOCX** (using pdf2docx)  
✅ **DOCX → PDF** (using LibreOffice)  
✅ **JPG/PNG → PDF** (using Pillow)  
✅ **Image → Image** (JPG ↔ PNG)  
✅ **CSV → XLSX** (using pandas)  
✅ **XLSX → CSV**  
✅ **All document formats** (using LibreOffice)

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 20+**
- **LibreOffice** (optional, for advanced document conversions)
- **Docker & Docker Compose** (optional, for containerized deployment)

### Option 1: Traditional Setup

```bash
# 1. Clone the repository
git clone https://github.com/Cholarajarp/SwiftConvert.git
cd SwiftConvert

# 2. Install Python dependencies
pip install -r requirements.txt

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

**Traditional Setup URL:**
- Visit: **http://localhost:5173**

---

## 💳 Pricing

### Free Plan
- ✅ 5 conversions per day
- ✅ 15 file formats
- ✅ Up to 50MB file size
- ✅ Basic quality

### Pro Plan - ₹49/month ($0.60 USD)
- ✅ Unlimited conversions
- ✅ 15 file formats
- ✅ Up to 200MB file size
- ✅ High quality conversions
- ✅ Batch processing
- ✅ Priority support

### Enterprise Plan - Custom
- ✅ Custom pricing
- ✅ API access
- ✅ Dedicated support

---

## 📁 Project Structure

```
SwiftConvert/
├── app.py                   # Python Flask backend
├── requirements.txt         # Python dependencies
├── package.json             # Node dependencies
├── .env.example             # Environment variables template
├── LICENSE                  # MIT License
├── README.md                # This file
├── Dockerfile               # Backend Docker image
├── Dockerfile.frontend      # Frontend Docker image
├── docker-compose.yml       # Docker Compose configuration
├── nginx.conf               # Nginx configuration for frontend
├── .dockerignore            # Docker ignore file
├── src/
│   ├── App.jsx             # React router setup
│   ├── SwiftConvert.jsx    # Main conversion component
│   ├── components/
│   │   ├── PageHeader.jsx  # Reusable header component
│   │   ├── PricingCard.jsx # Reusable pricing card
│   │   └── ContentSection.jsx # Reusable content section
│   └── pages/
│       ├── About.jsx       # About page
│       ├── Pricing.jsx     # Pricing page (with Stripe)
│       ├── Privacy.jsx     # Privacy policy
│       └── Terms.jsx       # Terms of service
├── uploads/                # Temporary upload directory
└── converted/              # Temporary output directory
```

---

## 🔌 API Endpoints

### Health Check
```bash
GET /api/health
```

### Convert File
```bash
POST /api/convert
Content-Type: multipart/form-data
Body: { file: <file>, toFormat: "docx" }
```

### Download File
```bash
GET /api/download/{filename}
```

### Create Payment
```bash
POST /api/create-checkout-session
Body: { "plan": "pro", "currency": "inr" }
```

---

## 🚀 Deployment

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

## 🛠️ Development

```bash
# Traditional setup
# Run backend
python app.py

# Run frontend
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
✅ **Free to use** - Use the software for personal or commercial purposes at no charge  
✅ **Access source code** - View and learn from the code  
❌ **No copying** - Cannot copy or redistribute without permission  
❌ **No modification** - Cannot modify and redistribute as your own  
❌ **No commercial redistribution** - Cannot sell or distribute copies  
⚠️ **Permission required** - Contact owner for copying, redistribution, or derivative works  

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

✅ **Backend**: Python Flask - Fully operational  
✅ **Frontend**: React + Vite - Fully operational  
✅ **Conversions**: 15 formats - All working  
✅ **Payment**: Stripe integration - Ready  
✅ **Deployment**: Production-ready  

**Built with ❤️ using Python, React, and modern web technologies**
