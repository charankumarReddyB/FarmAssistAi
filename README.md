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
│   ├── vercel.json           # Vercel SPA rewrite rules
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
│   ├── main.py               # Vercel Python Entrypoint
│   └── .env                  # Backend Environment Variables
├── vercel.json               # Vercel multi-service deployment config
├── .gitignore                # Git Exclusions
└── README.md                 # Project Overview & Setup Instructions
```

---

## 🚀 Running Locally

### ⚡ Quick Start Command Cheat Sheet

Open **two separate terminals** in the project root:

| Component | First-Time Setup | Daily Run Command | URL |
|---|---|---|---|
| **Backend** (FastAPI) | `cd backend` <br> `python -m venv venv` <br> `.\venv\Scripts\pip install -r requirements.txt` | `cd backend` <br> `.\venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` | `http://127.0.0.1:8000` |
| **Frontend** (React + Vite) | `cd frontend` <br> `npm install` | `cd frontend` <br> `npm run dev` | `http://localhost:8443` |

---

### Prerequisites
- **Python 3.10+** (ensure `python` is added to your PATH)
- **Node.js 18+** with `npm`
- **Git**

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/charankumarReddyB/FarmAssistAi.git
cd FarmAssistAi
```

---

### Step 2: Set Up & Run the Backend (Terminal 1)

The backend runs on **FastAPI**, **Uvicorn**, and **SQLite/Supabase** on port **8000**.

#### Option A: Windows (PowerShell)
```powershell
cd backend

# If PowerShell blocks scripts, bypass for this session:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 1. Create virtual environment (first time only)
python -m venv venv

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 3. Install dependencies (first time only)
pip install -r requirements.txt

# 4. Start the FastAPI server with auto-reload
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Option B: Windows (Direct / CMD — No Script Activation Needed)
```cmd
cd backend

:: 1. Create virtual environment (first time only)
python -m venv venv

:: 2. Install dependencies (first time only)
.\venv\Scripts\pip.exe install -r requirements.txt

:: 3. Run FastAPI server directly
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Option C: Linux / macOS
```bash
cd backend

# 1. Create virtual environment (first time only)
python3 -m venv venv

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install dependencies (first time only)
pip install -r requirements.txt

# 4. Start the FastAPI server with auto-reload
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

✅ **Backend Verification:**
- Backend API Root: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Interactive Swagger Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- System Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Step 3: Set Up & Run the Frontend (Terminal 2)

The frontend runs on **React 18**, **Vite**, and **Tailwind CSS** on port **8443**.

Open a **new terminal window** in the `FarmAssistAi` directory:

#### Windows & Linux / macOS
```bash
cd frontend

# 1. Install NPM dependencies (first time only)
npm install

# 2. Start Vite development server
npm run dev
```

✅ **Frontend Verification:**
- Web Application: [http://localhost:8443](http://localhost:8443) (or `http://127.0.0.1:8443`)

---

### Step 4: Configure Environment Variables

**Frontend** — create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://vdadfdqqqtofnhfhdkvh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYWRmZHFxcXRvZm5oZmhka3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDgyMjksImV4cCI6MjEwMzIyNDIyOX0.JaQHTxmAvLD1hOb7rHlkecoOkohgYweb614-1at8-tE
```

**Backend** — create `backend/.env`:
```env
SUPABASE_URL=https://vdadfdqqqtofnhfhdkvh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYWRmZHFxcXRvZm5oZmhka3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDgyMjksImV4cCI6MjEwMzIyNDIyOX0.JaQHTxmAvLD1hOb7rHlkecoOkohgYweb614-1at8-tE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYWRmZHFxcXRvZm5oZmhka3ZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0ODIyOSwiZXhwIjoyMTAzMjI0MjI5fQ.x1SSFotDr6xfHN8YUUjBMbB4AkMa2dvfwDhksv3GjKA
SECRET_KEY=farmassist_ai_jwt_secret_key_2026_production
DATABASE_URL=sqlite:///./farmassist.db
```

---

## 🔑 User Roles & Login Credentials

All sample accounts are **auto-seeded on backend startup** — ready for immediate testing:

| Role | Email | Password | Access / Permissions |
|---|---|---|---|
| 👑 **System Administrator** *(One & Only Admin)* | `charankumarreddybantrothula@gmail.com` | `Charan@123` | Full `/admin` console, user management, promoting roles, system telemetry |
| 🌿 **Agricultural Expert** | `expert@farmassist.ai` | `Expert@123456` | `/expert` review portal, advisory verification, modification & approvals |
| 🌾 **Farmer (Sample/Demo)** | `farmer@farmassist.ai` | `Farmer@123456` | `/dashboard`, `/soil`, `/crop`, `/advisory`, farm profile & weather intelligence |

> ⚠️ **Admin Policy**: Only `charankumarreddybantrothula@gmail.com` possesses the master Administrator privilege.
> 
> ℹ️ **Farmer Registration**: Any newly registered user (via Email or Google OAuth) automatically defaults to `role = farmer`. Admins can promote users to `expert` via the Admin Console.

---

## 🧪 Running Automated Tests & Production Build

### 1. Run Backend Automated Test Suite
```powershell
cd backend
.\venv\Scripts\python.exe -m unittest discover tests
```

### 2. Verify Frontend Production Build
```powershell
cd frontend
npm run build
```

---

## ☁️ Supabase Cloud Database Setup

1. Copy the SQL schema from `backend/supabase_schema.sql`.
2. Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/vdadfdqqqtofnhfhdkvh/sql/new).
3. Paste and click **Run** to provision tables, triggers, and Row Level Security (RLS) policies.
4. Set your keys in `frontend/.env` and `backend/.env`.

### Supabase OAuth Redirect URLs
In **Supabase Dashboard → Authentication → URL Configuration**, add these Redirect URLs:
```
http://localhost:8443
http://localhost:3000
http://localhost:5173
https://farm-assist-ai.vercel.app
https://*.vercel.app
```

---

## 🔒 Security & Role Authorization Summary

- **Farmer Role**: Access `/dashboard`, `/soil`, `/crop`, `/advisory`, `/reports`, `/farm`, `/voice`, `/settings`. Cannot access Expert or Admin routes.
- **Expert Role**: Access `/expert` review dashboard to inspect, approve, modify, or reject AI-generated advisories. Cannot access Admin routes.
- **Admin Role**: Access `/admin` dashboard for user role management, privileged expert/admin creation, and system governance.
- **Backend Enforcer**: `get_current_user` extracts and validates Bearer JWT tokens. Endpoints with `require_roles(['admin'])` strictly reject unauthorized callers with `403 Forbidden`.

---

## ⚡ Deploying to Vercel (Full Stack)

### Method 1: Deploy via Vercel Web Dashboard (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: configure vercel deployment"
   git push origin main
   ```

2. **Import Project into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and log in.
   - Click **Import** next to repository `charankumarReddyB/FarmAssistAi`.

3. **Configure Project Settings**:
   - **Application Preset**: `Other`
   - **Root Directory**: `./` (leave as default)
   - **Build Command** (Toggle ON): `cd frontend && npm install && npm run build`
   - **Output Directory** (Toggle ON): `frontend/dist`

4. **Add Environment Variables** (paste all at once in Vercel's env section):
   ```env
   VITE_SUPABASE_URL=https://vdadfdqqqtofnhfhdkvh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYWRmZHFxcXRvZm5oZmhka3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDgyMjksImV4cCI6MjEwMzIyNDIyOX0.JaQHTxmAvLD1hOb7rHlkecoOkohgYweb614-1at8-tE
   SUPABASE_URL=https://vdadfdqqqtofnhfhdkvh.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYWRmZHFxcXRvZm5oZmhka3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDgyMjksImV4cCI6MjEwMzIyNDIyOX0.JaQHTxmAvLD1hOb7rHlkecoOkohgYweb614-1at8-tE
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYWRmZHFxcXRvZm5oZmhka3ZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0ODIyOSwiZXhwIjoyMTAzMjI0MjI5fQ.x1SSFotDr6xfHN8YUUjBMbB4AkMa2dvfwDhksv3GjKA
   SECRET_KEY=farmassist_ai_jwt_secret_key_2026_production
   PROJECT_NAME=FarmAssist AI
   ```

5. **Deploy** → Click the white **Deploy** button!

---

### Method 2: Deploy via Vercel CLI

```bash
cd frontend
npx vercel --prod
```
