# FarmAssist AI – NLP-Based Agricultural Report Interpretation and Farmer Advisory System

FarmAssist AI is a web-based artificial intelligence system designed to interpret complex agricultural and soil lab reports using Natural Language Processing (NLP), Optical Character Recognition (OCR), and Sentence-BERT semantic similarity analysis. The platform translates unstructured soil test reports into actionable, structured farmer advisories—including crop suitability recommendations, fertilizer schedules, irrigation guidance, pest/disease alerts, and risk assessments.

---

## 🌾 Features

1. **Agricultural Report Upload**
   - Supports multi-page PDF soil test reports.
   - Supports scanned images (`.png`, `.jpg`, `.jpeg`, `.tiff`, `.webp`).
2. **Text Extraction & OCR**
   - Direct digital text extraction from PDFs via PyMuPDF (`fitz`).
   - OCR fallback for scanned reports using Tesseract OCR & EasyOCR.
3. **NLP Preprocessing Pipeline**
   - Lowercasing, noise reduction, and regex sanitization.
   - Word tokenization via spaCy and NLTK.
   - Stop-word filtering and agronomic lemmatization.
4. **Agronomic Information Extraction**
   - Rule-based & heuristic regex extraction of Soil pH, Nitrogen (N), Phosphorus (P), and Potassium (K) levels.
   - Automated detection of crop references, plant disease symptoms, and nutrient deficiencies.
5. **Sentence-BERT Semantic Analysis**
   - Generates dense sentence embeddings (`all-MiniLM-L6-v2`).
   - Computes Cosine Similarity against a curated Agronomic Knowledge Base.
   - Matches report context to semantically similar soil health and deficiency conditions.
6. **Structured Advisory Engine**
   - Generates standardized JSON advisories featuring:
     - Soil Health Analysis
     - Extracted NPK & pH parameters
     - Recommended Crops
     - Fertilizer Applications
     - Irrigation Schedules
     - Pest & Disease Alerts
     - Risk Factors & Final Summary
7. **Expert Review & Human-in-the-Loop**
   - Staging area for agricultural extension officers and experts to review AI-generated advisories.
   - Expert approval, rejection, or custom recommendation modification workflow.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React with TypeScript, Vite
- **UI & Styling**: Tailwind CSS, Lucide Icons
- **State & Router**: Modern React Hooks & Component View Architecture

### Backend
- **Framework**: Python 3.10+, FastAPI
- **Database & ORM**: PostgreSQL (with SQLite local fallback), SQLAlchemy 2.0, Pydantic v2
- **NLP & AI/ML**: spaCy, NLTK, Sentence-Transformers (`all-MiniLM-L6-v2`), scikit-learn
- **Document Processing & OCR**: PyMuPDF (`fitz`), pytesseract, EasyOCR, Pillow

---

## 📁 Folder Structure

```
FarmAssist-AI/
├── frontend/                 # Existing React + Vite TypeScript Web Interface
├── backend/                  # Python FastAPI Backend Service
│   ├── app/
│   │   ├── main.py           # FastAPI Application Entrypoint & CORS setup
│   │   ├── api/              # REST API Router & Endpoint Handlers
│   │   │   ├── routes/
│   │   │   │   ├── health.py   # System Health Check Endpoint
│   │   │   │   ├── reports.py  # Report Upload & Retrieval API
│   │   │   │   ├── analysis.py # NLP & Sentence-BERT Trigger API
│   │   │   │   ├── advisory.py # Structured Advisory Retrieval API
│   │   │   │   └── expert.py   # Expert Review & Approval API
│   │   │   └── router.py
│   │   ├── core/             # Configuration & Database Connection
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/           # SQLAlchemy ORM Database Models
│   │   │   ├── report.py
│   │   │   ├── advisory.py
│   │   │   └── user.py
│   │   ├── schemas/          # Pydantic Request/Response Validation Schemas
│   │   │   ├── report.py
│   │   │   ├── advisory.py
│   │   │   └── user.py
│   │   ├── services/         # Core NLP, Extraction & Advisory Services
│   │   │   ├── pdf_service.py
│   │   │   ├── ocr_service.py
│   │   │   ├── preprocessing_service.py
│   │   │   ├── extraction_service.py
│   │   │   ├── semantic_service.py
│   │   │   └── advisory_service.py
│   │   └── knowledge_base/   # Agronomic Knowledge Base & Reference Matrices
│   │       └── agricultural_kb.py
│   ├── uploads/              # Local Storage for Uploaded Soil Reports
│   ├── requirements.txt      # Python Package Dependencies
│   └── .env.example          # Environment Variables Template
├── .gitignore                # Root Git Ignore Configuration
└── README.md                 # Project Overview & Setup Instructions
```

---

## 🚀 Backend Setup Instructions

### Prerequisites
- Python 3.10+ installed
- PostgreSQL installed (optional; SQLite fallback enabled by default)

### Setup Steps
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux/macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Download spaCy English model:
   ```bash
   python -m spacy download en_core_web_sm
   ```
5. Configure Environment Variables:
   ```bash
   cp .env.example .env
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

---

## 💻 Frontend Setup Instructions

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Launch Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web dashboard at `http://localhost:5173`.

---

## 🔑 Environment Variables

The backend configuration is managed via `.env` in `backend/`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PROJECT_NAME` | `FarmAssist AI` | Application Name |
| `API_V1_STR` | `/api` | Base API Route Prefix |
| `DATABASE_URL` | `sqlite:///./farmassist.db` | Database connection string (PostgreSQL or SQLite) |
| `UPLOAD_DIR` | `./uploads` | Directory for uploaded PDF/Image reports |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:5173","http://localhost:3000"]` | Allowed CORS origins for Frontend integration |

---

## 📚 API Documentation

Once the FastAPI backend is running, live interactive OpenAPI Swagger documentation is available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Core API Endpoints:
- `GET /api/health` — Backend and database connectivity check.
- `POST /api/reports/upload` — Upload PDF or Image reports.
- `GET /api/reports/{report_id}` — View uploaded report & raw extracted text.
- `POST /api/analysis/{report_id}` — Execute NLP & Sentence-BERT semantic pipeline.
- `GET /api/advisories/{report_id}` — Retrieve structured farmer advisory JSON.
- `POST /api/expert/review` — Expert review (Approve / Modify / Reject) workflow.

---

## 📌 Current Development Status

- **Frontend UI/UX**: Completed in Figma and existing frontend project.
- **Backend**: Under development (Foundation & REST APIs functional).
- **NLP Semantic Analysis**: Under development (Sentence-BERT & Cosine Similarity pipeline integrated).
- **OCR**: Under development (PyMuPDF & Tesseract/EasyOCR fallback service active).
- **Dataset Integration**: In progress.
