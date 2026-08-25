# FarmAssist AI – NLP-Based Agricultural Report Interpretation and Cloud Farm Intelligence System

FarmAssist AI is an intelligent agricultural decision-support web application that interprets complex soil lab reports, crop leaf disease images, and location-based climate context using Natural Language Processing (NLP), Deep Learning (PyTorch MobileNetV2), Sentence-BERT semantic similarity, and Supabase Cloud Infrastructure (PostgreSQL, Supabase Auth, Row Level Security, and File Storage).

---

## 🌾 Features & Architecture

1. **Supabase Cloud Backend Integration**
   - **PostgreSQL Database**: Relational storage for user profiles, farms, soil test reports, crop analyses, structured advisories, and expert audit trails.
   - **Supabase Auth**: Unified authentication provider supporting Google OAuth 2.0, Email & Password Registration, JWT Session management, and password hashing.
   - **Row Level Security (RLS)**: Database-enforced isolation ensuring farmers can only read/update their own private farm data while experts and admins have authorized cross-tenant review capabilities.
   - **Supabase Cloud Storage**: Public and private cloud buckets for uploading soil test reports (`soil-reports`) and crop leaf images (`crop-images`).
2. **FastAPI AI/ML Backend**
   - **NLP Soil Extraction**: PyMuPDF text extraction, Tesseract/EasyOCR fallback, and spaCy/NLTK regex parameter extraction for N, P, K, pH, EC, and Organic Carbon.
   - **Deep Learning Crop Disease Classifier**: PyTorch MobileNetV2 model trained on crop disease datasets for multi-class leaf disease diagnosis.
   - **Sentence-BERT Semantic Matching**: Generates dense sentence embeddings (`all-MiniLM-L6-v2`) and computes Cosine Similarity against an Agronomic Knowledge Base.
   - **Location-Based Farm Intelligence**: Integration with Open-Meteo live weather API, Agro-Climatic zone matrices, regional soil datasets, and disease risk assessment.
3. **Role-Based Access Control (RBAC)**
   - **Farmer Portal**: Soil report upload, crop disease photo diagnosis, weather impact tracking, Farm Intelligence dashboard, and structured advisories.
   - **Expert Review Portal**: Human-in-the-loop validation staging area where agricultural extension officers approve, modify, or reject AI-generated advisories.
   - **Admin Governance Dashboard**: System metrics, user account management, expert provisioning, and platform monitoring.

---

## 🏗 System Architecture Diagram

```
Frontend React + Vite
        │
        ├──► Supabase Auth (Google OAuth, Email/Password, JWT Session)
        │
        ├──► Supabase PostgreSQL (Profiles, RLS, Advisories, Soil Reports)
        │
        └──► FastAPI AI/ML Backend (Port 8000)
                 ├── PyMuPDF & Tesseract OCR
                 ├── PyTorch MobileNetV2 Crop Model
                 ├── Sentence-BERT Semantic Matcher
                 ├── Open-Meteo Weather API & Agro-Climatic KB
                 └── Supabase Storage Upload (soil-reports, crop-images)
```

---

## 📁 Repository Structure

```
FarmAssistAi/
├── frontend/                 # React + Vite + TypeScript Frontend Application
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.ts   # Supabase Client Instance
│   │   ├── components/       # UI Components & Navigation
│   │   ├── views/            # Dashboard, Login, Soil, Crop, Expert & Admin Views
│   │   └── App.tsx           # App Shell, Auth State Listener & Role Guard
│   └── .env.example          # Frontend Environment Template
├── backend/                  # Python FastAPI Backend Service
│   ├── app/
│   │   ├── main.py           # FastAPI Entrypoint & Middleware
│   │   ├── api/routes/       # REST Routes (auth, user, reports, crop_analysis, expert, admin)
│   │   ├── core/             # Database, Security & Supabase Storage Client
│   │   ├── models/           # SQLAlchemy ORM Models
│   │   └── services/         # AI, ML, NLP & Weather Services
│   ├── scripts/
│   │   └── migrate_sqlite_to_supabase.py # SQLite to Supabase Migration Utility
│   ├── supabase_schema.sql   # PostgreSQL DDL, RLS Policies & Storage SQL
│   ├── requirements.txt      # Python Package Dependencies
│   └── .env.example          # Backend Environment Template
├── .gitignore                # Git Exclusions
└── README.md                 # Project Overview & Setup Instructions
```

---

## ⚡ Manual Supabase Setup Required

To connect FarmAssist AI to your production Supabase Cloud project, complete the following steps in the Supabase Dashboard:

1. **Create Supabase Project**
   - Sign in to [Supabase Console](https://database.new) and create a new project.
   - Note down your **Project URL**, **Anon API Key**, **Service Role Key**, and **JWT Secret**.

2. **Apply Database Schema & Security**
   - Open the **SQL Editor** in your Supabase Dashboard.
   - Copy and paste the contents of `backend/supabase_schema.sql`.
   - Click **Run** to create the tables (`profiles`, `farms`, `soil_reports`, `crop_analyses`, `advisories`, `expert_reviews`), database triggers, RLS policies, and storage buckets (`soil-reports`, `crop-images`).

3. **Configure Google OAuth Provider**
   - Go to Google Cloud Console -> **APIs & Services** -> **Credentials**.
   - Create an **OAuth 2.0 Client ID** (Web application).
   - Add Authorized Redirect URI: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`.
   - Copy your **Client ID** and **Client Secret**.
   - In Supabase Dashboard, go to **Authentication** -> **Providers** -> **Google**.
   - Enable Google provider, paste **Client ID** and **Client Secret**, and save.

4. **Set Environment Variables**
   - Copy `frontend/.env.example` to `frontend/.env`:
     ```env
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - Copy `backend/.env.example` to `backend/.env`:
     ```env
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_ANON_KEY=your-anon-key-here
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
     SUPABASE_JWT_SECRET=your-jwt-secret-here
     DATABASE_URL=postgresql://postgres.your-ref:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
     ```

---

## 📦 SQLite to Supabase Data Migration

To migrate existing local data from `farmassist.db` into Supabase PostgreSQL:

```bash
cd backend
python scripts/migrate_sqlite_to_supabase.py
```

---

## 🚀 Local Development Startup

### 1. Backend Startup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
FastAPI Swagger Documentation will be live at `http://localhost:8000/docs`.

### 2. Frontend Startup
```bash
cd frontend
npm install
npm run dev
```
Access the FarmAssist AI Web Interface at `http://localhost:5173`.

---

## 🔒 Security & Role Authorization Summary

- **Farmer Role**: Access `/dashboard`, `/soil-analysis`, `/crop-analysis`, `/advisory`, `/reports`, `/settings`. Cannot access Expert or Admin routes.
- **Expert Role**: Access `/expert` review dashboard to inspect and validate advisories. Cannot access Admin routes.
- **Admin Role**: Access `/admin` dashboard for user role management, system metrics, and governance.
- **Backend Enforcer**: `get_current_user` decodes Supabase JWT tokens. Endpoints decorated with `@require_roles(['admin'])` return `403 Forbidden` for unauthorized roles and `401 Unauthorized` for missing/invalid tokens.
