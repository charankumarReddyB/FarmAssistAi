# FarmAssist AI – Integrated Agricultural Intelligence System

FarmAssist AI is an intelligent agricultural decision-support web application that interprets soil lab reports, crop leaf disease images, and location-based climate context using Natural Language Processing (NLP), Deep Learning (PyTorch MobileNetV2), Sentence-BERT semantic similarity, and Supabase Cloud Infrastructure (PostgreSQL, Supabase Auth, Row Level Security, and Cloud File Storage).

---

## 🌾 Core System Features & Architecture

1. **Integrated Auth & Secure Database Roles**
   - **No Manual Role Selection**: Manual role picking is removed from user signup. All newly registered users (Email or Google OAuth) strictly default to the `farmer` role.
   - **Administrative Authorization**: `expert` and `admin` roles can only be explicitly assigned in the database by authorized system administrators.
   - **Google OAuth & Profile Sync**: Syncs `display_name`, `avatar_url`, `auth_provider`, `onboarding_completed`, and `village_or_city`.
   - **Automated Onboarding Flow**: New users complete Language Selection -> Location Confirmation -> Auth, and are seamlessly redirected to their role dashboard. Returning completed users navigate straight to their role dashboard.
2. **Public Landing Page Security**
   - Unauthenticated visitors see **ONLY** "Get Started" and "Sign In". Public links to the Expert Portal or authenticated CTA buttons ("Go to Dashboard", "My Farm") are hidden when unauthenticated.
3. **Per-User Location & Weather Agricultural Context**
   - Live weather and regional soil/crop suitability analysis are dynamically grounded in the authenticated user's location (`state`, `district`, `village_or_city`, `latitude`, `longitude`).
   - Location changes in profile automatically update live weather and regional disease risk analysis.
4. **FastAPI AI/ML Backend**
   - **NLP Soil Extraction**: PyMuPDF text extraction, OCR fallback, and regex parameter extraction for N, P, K, pH, EC, and Organic Carbon.
   - **Deep Learning Crop Classifier**: PyTorch MobileNetV2 model trained on crop leaf disease datasets.
   - **Sentence-BERT Semantic Matching**: Generates dense sentence embeddings (`all-MiniLM-L6-v2`) and computes Cosine Similarity against an Agronomic Knowledge Base.
   - **Location-Based Farm Intelligence**: Integration with Open-Meteo live weather API, Agro-Climatic zone matrices, and regional soil datasets.
5. **Role-Based Access Control (RBAC) & Row Level Security (RLS)**
   - **Farmer Portal**: Soil report upload, crop disease photo diagnosis, weather impact tracking, location-based farm intelligence, and structured advisories.
   - **Expert Review Portal**: Human-in-the-loop validation staging area where extension officers approve, modify, or reject AI advisories.
   - **Admin Governance Console**: System metrics, user account management, expert provisioning, and platform audit logs.

---

## 🏗 System Architecture Diagram

```
Frontend React + Vite (Port 8443 / 5173)
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
│   │   │   └── supabase.ts   # Supabase Client Instance & Auth Handlers
│   │   ├── components/       # TopBar, Navigation, UI Cards & Alerts
│   │   ├── views/            # Landing, Login, Dashboard, Soil, Crop, Expert & Admin Views
│   │   └── App.tsx           # App Shell, Auth Session Listener & Role Guard
│   └── .env.example          # Frontend Environment Template
├── backend/                  # Python FastAPI Backend Service
│   ├── app/
│   │   ├── main.py           # FastAPI Entrypoint & Middleware
│   │   ├── api/routes/       # REST Routes (auth, user, farm, reports, crop_analysis, expert, admin)
│   │   ├── core/             # Database, Security & Supabase Storage Client
│   │   ├── models/           # SQLAlchemy ORM Models (User, Report, CropImageAnalysis, Advisory)
│   │   └── services/         # AI, ML, NLP & Location Weather Services
│   ├── tests/
│   │   └── test_integrated_system.py # Comprehensive Automated System Test Suite
│   ├── supabase_schema.sql   # PostgreSQL DDL, RLS Policies, Triggers & Storage SQL
│   ├── requirements.txt      # Python Package Dependencies
│   └── .env.example          # Backend Environment Template
├── .gitignore                # Git Exclusions
└── README.md                 # Project Overview & Setup Instructions
```

---

## 🚀 Running the Application & Test Suite

### 1. Start the FastAPI Backend Server
Open a terminal in the project directory:

```bash
cd backend

# (Optional) Activate Virtual Environment
# On Windows:
python -m venv venv
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies if not already installed
pip install -r requirements.txt

# Run FastAPI Dev Server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

---

### 2. Start the Frontend Web Application
Open a second terminal window:

```bash
cd frontend

# Install Node dependencies (if needed)
npm install

# Run Vite Frontend Dev Server
npm run dev
```
- Web Application URL: `http://localhost:8443` (or `http://localhost:5173`)

---

### 3. Run Automated Integration & System Tests
To run the automated 22-point system verification test suite:

```bash
cd backend
python -m unittest tests.test_integrated_system
```

To run all backend unit tests:
```bash
cd backend
python -m unittest discover tests
```

To verify the frontend production build:
```bash
cd frontend
npm run build
```

---

## 🔒 Security & Role Authorization Summary

- **Farmer Role**: Access `/dashboard`, `/soil-analysis`, `/crop-analysis`, `/advisory`, `/reports`, `/settings`. Cannot access Expert or Admin routes.
- **Expert Role**: Access `/expert` review dashboard to inspect, approve, modify, or reject advisories. Cannot access Admin routes.
- **Admin Role**: Access `/admin` dashboard for user role management, expert provisioning, and system governance.
- **Backend Enforcer**: `get_current_user` decodes Supabase JWT tokens. Endpoints decorated with `Depends(require_roles(['admin']))` return `403 Forbidden` for unauthorized roles and `401 Unauthorized` for missing/invalid tokens.

