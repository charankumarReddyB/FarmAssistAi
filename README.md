# FarmAssist AI – Integrated Agricultural Intelligence System

FarmAssist AI is an intelligent agricultural decision-support web application that interprets soil lab reports, crop leaf disease images, and location-based climate context using Natural Language Processing (NLP), Deep Learning (PyTorch MobileNetV2), Sentence-BERT semantic similarity, and Supabase Cloud Infrastructure (PostgreSQL, Supabase Auth, Row Level Security, and Cloud File Storage).

---

## 🌾 Core System Features & Architecture

1. **Integrated Auth & Secure Database Roles**
   - **No Manual Role Selection**: All public registrations (Email/Password or Google OAuth) strictly default to the `farmer` role.
   - **Administrative Authorization**: `expert` and `admin` roles can only be explicitly assigned by an authorized system administrator.
   - **Predefined Initial Administrator**: Auto-bootstrapped initial admin account for system governance.
   - **Google OAuth & Profile Sync**: Syncs `display_name`, `avatar_url`, `auth_provider`, `onboarding_completed`, and `village_or_city`.
   - **Dynamic Location Detection**: Automatic browser GPS detection and reverse geocoding to State, District, and Village/City with manual fallback. (Admins/Experts automatically bypass location onboarding).
2. **Public Landing Page Security**
   - Unauthenticated visitors see **ONLY** "Get Started" and "Sign In". Public links to the Expert Portal or authenticated CTA buttons ("Go to Dashboard", "My Farm") are hidden when unauthenticated.
3. **Dynamic Profile → My Farm Live Synchronization**
   - My Farm telemetry (crop, soil type, irrigation, farm size, sowing date, stage, survey number) is dynamically bound to the database.
   - Updates in Profile, My Farm, or Settings immediately synchronize across TopBar, Sidebar, Dashboard, and My Farm in real time without page refreshes.
4. **FastAPI AI/ML Backend**
   - **NLP Soil Extraction**: PyMuPDF text extraction, OCR fallback, and regex parameter extraction for N, P, K, pH, EC, and Organic Carbon.
   - **Deep Learning Crop Classifier**: PyTorch MobileNetV2 model trained on crop leaf disease datasets.
   - **Sentence-BERT Semantic Matching**: Generates dense sentence embeddings (`all-MiniLM-L6-v2`) and computes Cosine Similarity against an Agronomic Knowledge Base.
   - **Location-Based Farm Intelligence**: Integration with Open-Meteo live weather API, Agro-Climatic zone matrices, and regional soil datasets.
5. **Role-Based Access Control (RBAC) & Row Level Security (RLS)**
   - **Farmer Portal**: Soil report upload, crop disease photo diagnosis, weather impact tracking, location-based farm intelligence, and structured advisories.
   - **Expert Review Portal**: Human-in-the-loop validation staging area where extension officers approve, modify, or reject AI advisories.
   - **Admin Governance Console**: System metrics, real-time user management, privileged expert/admin creation, and account activation/deactivation.

---

## 🏗 System Architecture Diagram

```
Frontend React + Vite (Port 8443)
        │
        ├──► Supabase Auth (Google OAuth, Email/Password, JWT Session)
        │
        ├──► Supabase PostgreSQL (Profiles, Farm Profiles, RLS, Advisories, Soil Reports)
        │
        └──► FastAPI AI/ML Backend (Port 8000)
                 ├── PyMuPDF & Tesseract OCR
                 ├── PyTorch MobileNetV2 Crop Model
                 ├── Sentence-BERT Semantic Matcher
                 ├── Open-Meteo Weather API & Agro-Climatic KB
                 └── SQLite Database (farmassist.db) & Supabase Storage Client
```

---

## 📁 Repository Structure

```
FarmAssistAi/
├── frontend/                 # React + Vite + TypeScript Frontend Application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts        # Central API Client & Error Translation
│   │   │   ├── location.ts   # Browser Geolocation & Reverse Geocoding
│   │   │   └── supabase.ts   # Supabase Client Instance & Auth Handlers
│   │   ├── components/       # TopBar, Sidebar, Navigation, UI Cards & Alerts
│   │   ├── views/            # Landing, Login, Dashboard, MyFarm, Soil, Crop, Expert & Admin Views
│   │   └── App.tsx           # App Shell, Auth Session State Machine & Role Guard
│   └── .env                  # Frontend Environment Variables
├── backend/                  # Python FastAPI Backend Service
│   ├── app/
│   │   ├── main.py           # FastAPI Entrypoint, Seed Data & Middleware
│   │   ├── api/routes/       # REST Routes (auth, user, farm, reports, crop_analysis, expert, admin)
│   │   ├── core/             # Database, Security & Config
│   │   ├── models/           # SQLAlchemy Models (User, FarmProfile, Report, CropImageAnalysis, Advisory)
│   │   ├── schemas/          # Pydantic Schemas (User, Farm, Report, Crop, Advisory)
│   │   └── services/         # AI, ML, NLP & Location Weather Services
│   ├── tests/
│   │   └── test_integrated_system.py # Comprehensive Automated System Test Suite (25 Test Points)
│   ├── supabase_schema.sql   # PostgreSQL DDL, RLS Policies, Triggers & Storage SQL
│   ├── requirements.txt      # Python Package Dependencies
│   └── .env                  # Backend Environment Variables
├── .gitignore                # Git Exclusions
└── README.md                 # Project Overview & Setup Instructions
```

---

## 🚀 Running the Application

### 1. Start the FastAPI Backend Server
Open a terminal in the `backend/` directory:

#### Option A: Windows PowerShell (Using Python Virtual Environment)
```powershell
cd backend

# Allow PowerShell script execution if restricted
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Activate venv
.\venv\Scripts\Activate.ps1

# Install requirements (first time setup)
pip install -r requirements.txt

# Start backend dev server with auto-reload
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Option B: Direct Python Execution (No activation required)
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Option C: Linux / macOS
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Backend API Base URL**: `http://127.0.0.1:8000`
- **Interactive OpenAPI (Swagger) Docs**: `http://127.0.0.1:8000/docs`
- **Health Check Endpoint**: `http://127.0.0.1:8000/api/health`

---

### 2. Start the Frontend Application
Open a second terminal in the `frontend/` directory:

#### Windows PowerShell / CMD
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

#### Linux / macOS
```bash
cd frontend
npm install
npm run dev
```

- **Frontend Web Application URL**: `http://localhost:8443`

---

## 🔑 Default Credentials

| Role | Email | Password | Destination |
|---|---|---|---|
| **Administrator** | `charankumarreddybantrothula@gmail.com` | `Charan@123` | Administrator Console (`/admin`) |
| **Agricultural Expert** | `expert@farmassist.ai` | `Expert@123456` | Expert Review Portal (`/expert`) |
| **Farmer (Demo)** | `farmer@farmassist.ai` | `Farmer@123456` | Farmer Dashboard (`/dashboard`) |

> **Note**: Any newly registered account via Email or Google OAuth automatically receives `role = farmer`.

---

## 🧪 Running Automated Tests & Production Build

### 1. Run Backend Automated Test Suite
Executes the comprehensive test suite covering authentication, RBAC, weather, farm profile sync, and multilingual assistant:

```powershell
cd backend
.\venv\Scripts\python.exe -m unittest discover tests
```

### 2. Verify Frontend Production Build
Validates TypeScript types and generates the optimized production bundle:

```powershell
cd frontend
npm.cmd run build
```

---

## ☁️ Supabase Cloud Database Setup

1. Copy the SQL schema from [backend/supabase_schema.sql](file:///c:/Charan/Farm%20Assist%20Ai/backend/supabase_schema.sql).
2. Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/vdadfdqqqtofnhfhdkvh/sql/new).
3. Paste and click **Run** to provision tables, triggers, and Row Level Security (RLS) policies.
4. Set your keys in `frontend/.env` and `backend/.env`.

---

## 🔒 Security & Role Authorization Summary

- **Farmer Role**: Access `/dashboard`, `/soil`, `/crop`, `/advisory`, `/reports`, `/farm`, `/voice`, `/settings`. Cannot access Expert or Admin routes.
- **Expert Role**: Access `/expert` review dashboard to inspect, approve, modify, or reject AI-generated advisories. Cannot access Admin routes.
- **Admin Role**: Access `/admin` dashboard for user role management, privileged expert/admin creation, and system governance.
- **Backend Enforcer**: `get_current_user` extracts and validates Bearer JWT tokens. Endpoints with `require_roles(['admin'])` strictly reject unauthorized callers with `403 Forbidden`.

