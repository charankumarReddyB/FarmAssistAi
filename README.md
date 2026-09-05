# FARMAssist AI – Agricultural Report Interpretation and Farmer Advisory System

FARMAssist AI is a production-grade, AI-driven agricultural decision-support web platform. It bridges the gap between complex agricultural science and everyday farming by interpreting soil lab reports (PDF/scans), diagnosing crop leaf diseases via computer vision, factoring in live hyper-local weather conditions, and generating actionable, localized agronomic advisories validated through a human-in-the-loop expert review workflow.

---

## 🌾 1. Project Overview & Key Features

FARMAssist AI provides an end-to-end advisory pipeline with distinct portals for **Farmers**, **Agricultural Experts**, and **System Administrators**.

### Working Core Features
- **Intelligent Soil Report Interpretation**: Ingests soil test laboratory reports (PDF or images) via dual-engine OCR (PyMuPDF vector extraction + Tesseract OCR fallback) and extracts primary soil chemical metrics (pH, Nitrogen, Phosphorus, Potassium, Organic Carbon, Electrical Conductivity).
- **Computer Vision Crop Disease Diagnosis**: Detects foliar plant pathogens using a fine-tuned **PyTorch MobileNetV2** deep learning model trained on curated leaf disease datasets with high empirical accuracy.
- **Dataset-Grounded Recommendation Engines**:
  - Recommends the top-5 suitable crops based on multi-parameter distance scoring across 2,200 real records.
  - Generates specific fertilizer formulations and dosage instructions based on 480 verified agronomic records.
  - Compares test parameters against regional soil baselines derived from 700 Southern Indian district-level records.
- **Semantic Agronomic Knowledge Matching**: Matches extracted report text and deficiency symptoms against an Agronomic Knowledge Base using dense vector embeddings (**Sentence-BERT `all-MiniLM-L6-v2`**) and Cosine Similarity scoring.
- **Live Hyper-Local Weather Integration**: Fetches real-time temperature, humidity, wind speed, and rain probability from the Open-Meteo API using browser geolocation coordinates or district-level lookups, dynamically alerting farmers about weather impacts (e.g. delaying irrigation before anticipated rain).
- **Human-in-the-Loop Expert Verification Portal**: Extension specialists can inspect pending AI advisories, review extracted parameters, and choose to **Approve**, **Modify** (with custom notes and adjusted dosages), or **Reject** with reasons before final farmer delivery.
- **System Governance & Admin Console**: Live metrics monitoring, user management, and secure role provisioning (Farmers, Agricultural Experts, Admins).
- **Multi-Language Accessibility (i18n)**: Full localization across 6 languages: English, Telugu (తెలుగు), Hindi (हिंदी), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), and Malayalam (മലയാളം).

---

## 🏛️ 2. System Architecture

```
                                  ┌────────────────────────────────────────┐
                                  │      Client (React 18 + Vite SPA)      │
                                  │   Desktop & Mobile Responsive (i18n)   │
                                  └───────────────────┬────────────────────┘
                                                      │
                                   HTTPS / REST API   │ JWT Bearer Auth
                                                      ▼
                                  ┌────────────────────────────────────────┐
                                  │       FastAPI AI/ML Application        │
                                  │             (Port 8000)                │
                                  └───────┬───────────────┬──────────────┬─┘
                                          │               │              │
                     ┌────────────────────┴──┐            │              │
                     ▼                       ▼            │              ▼
     ┌────────────────────────┐  ┌────────────────────┐   │  ┌───────────────────────┐
     │   OCR & NLP Pipeline   │  │ PyTorch MobileNet  │   │  │ Live Weather Service  │
     │  PyMuPDF + Tesseract   │  │   V2 Classifier    │   │  │  Open-Meteo REST API  │
     └───────────────┬────────┘  └─────────┬──────────┘   │  └───────────┬───────────┘
                     │                     │              │              │
                     └───────────────┬─────┘              │              │
                                     ▼                    ▼              ▼
                     ┌────────────────────────────────────────────────────────┐
                     │      Dataset-Driven Scoring & Advisory Engine          │
                     │  - Kaggle Crop Recommendation (2,200 records)          │
                     │  - Fertilizer Prediction (480 records)                 │
                     │  - Southern Indian Soil Nutrients (700 records)        │
                     │  - Sentence-BERT Semantic Matcher (MiniLM-L6)          │
                     └───────────────────────────┬────────────────────────────┘
                                                 │
                                                 ▼
                     ┌────────────────────────────────────────────────────────┐
                     │            Persistence & Realtime Storage              │
                     │  - SQLite Database (SQLAlchemy ORM)                    │
                     │  - Supabase Cloud PostgreSQL Sync (Profiles & RLS)     │
                     └────────────────────────────────────────────────────────┘
```

---

## 📊 3. Four Integrated Datasets

The system's recommendation and diagnosis components are coupled directly to 4 official, verified datasets located in `backend/data/`:

| # | Dataset Name | Location | Records | Primary Features / Attributes | System Usage |
|---|---|---|---|---|---|
| **1** | **Crop Recommendation Dataset** | `backend/data/crop_recommendation/crop_recommendation.csv` | 2,200 | N, P, K, Temperature, Humidity, pH, Rainfall, Label (22 crops) | Evaluates soil test metrics against optimal crop growing conditions to recommend the top-5 best suited crops. |
| **2** | **Fertilizer Prediction Dataset** | `backend/data/fertilizer_prediction/fertilizer_prediction.csv` | 480 | Soil Type, Crop Type, Nitrogen, Potassium, Phosphorous, Fertilizer Name (7 formulations: Urea, DAP, 14-35-14, 28-28, 17-17-17, 20-20, 10-26-26) | Determines precise chemical/organic fertilizer requirements based on nutrient deficits. |
| **3** | **Soil Nutrient Dataset of Southern Indian States** | `backend/data/soil_nutrients/southern_indian_soil_nutrients.csv` | 700 | State, District, Nitrogen, Phosphorus, Potassium, pH, Soil Type (Andhra Pradesh, Telangana, Karnataka, Tamil Nadu; 14 districts) | Benchmarks farmer's test parameters against district and state baseline averages to provide regional context. |
| **4** | **Plant Disease Leaf Image Dataset** | `backend/data/crop_diseases/dataset4_images/` | 250 | 50 images per class across 5 disease categories: Bacterial Leaf Blight, Brown Spot, Leaf Smut / Rust, Powdery Mildew, Healthy Crop | Trains and validates the PyTorch MobileNetV2 image classification model for foliar disease diagnosis. |

---

## 🔍 4. OCR & NLP Extraction Pipeline

When a farmer uploads a soil health card or lab report (PDF or scanned image):

1. **Digital Vector PDF Processing (`PyMuPDF / fitz`)**: Direct text stream extraction parses digital PDFs with 100% character fidelity and near-zero latency.
2. **Optical Character Recognition Fallback (`pytesseract` / Tesseract OCR)**: Scanned paper certificates, mobile camera captures, and image formats (JPEG/PNG) are preprocessed and parsed using Tesseract OCR.
3. **Structured Parameter Regex Extraction**: Robust regular expressions identify and normalize agronomic parameters regardless of laboratory report layout variations:
   - **pH Level** (e.g. `pH: 6.5`, `Soil Reaction: 7.2`)
   - **Available Nitrogen (N)** in kg/ha or lbs/acre
   - **Available Phosphorus (P₂O₅)** in kg/ha
   - **Available Potassium (K₂O)** in kg/ha
   - **Organic Carbon (OC)** in percentage (%)
   - **Electrical Conductivity (EC)** in dS/m (salinity measure)
4. **Data Normalization & Sanitization**: Values are validated against agronomic boundaries, flags are set for high salinity or extreme acidity/alkalinity, and the structured entity is persisted in the database.

---

## 🧠 5. Semantic Analysis Pipeline

In addition to exact parameter parsing, agricultural reports often contain qualitative observations (e.g., *"stunted vegetative growth"*, *"interveinal chlorosis observed"*, *"poor drainage"*).

1. **Dense Vector Embeddings**: Extracted qualitative text is tokenized and transformed into 384-dimensional dense vectors using the **Sentence-BERT (`sentence-transformers/all-MiniLM-L6-v2`)** model.
2. **Agronomic Knowledge Base**: A curated corpus of deficiency symptoms, pathogen risk profiles, and soil condition remedies is pre-indexed with corresponding embeddings.
3. **Cosine Similarity Matching**: The system computes Cosine Similarity between user report vectors and knowledge base vectors.
4. **Context Enrichment**: Matches with similarity $\ge 0.55$ inject domain-specific risk alerts and corrective guidance directly into the generated advisory. If sentence-transformers is offline or loading, an automated keyword/ngram semantic fallback ensures zero downtime.

---

## 🔬 6. Crop Disease Diagnosis Model (PyTorch MobileNetV2)

- **Architecture**: MobileNetV2 with custom classification head (`Dropout(0.2)` $\rightarrow$ `Linear(1280, 5)`), leveraging transfer learning from ImageNet.
- **Model Path**: `backend/app/models/weights/crop_disease_mobilenet.pth`
- **Class Labels**:
  1. `bacterial_leaf_blight` (*Xanthomonas oryzae*)
  2. `brown_spot_blast` (*Bipolaris oryzae / Magnaporthe oryzae*)
  3. `leaf_smut_rust` (*Entyloma oryzae / Puccinia*)
  4. `powdery_mildew` (*Erysiphales*)
  5. `healthy_crop` (Control / Uninfected)
- **Validation Methodology**: Stratified dataset split (70% Train, 15% Validation, 15% Unseen Test) ensuring equal class distribution.
- **Performance Metrics (on unseen test images)**:
  - **Empirical Accuracy**: **92.1%**
  - **Macro Precision**: **0.93**
  - **Macro Recall**: **0.92**
  - **Macro F1-Score**: **0.92**
- **Inference Pipeline**: Accepts uploaded leaf photos, applies standard ImageNet normalization (`Resize(224, 224)`, `ToTensor()`, `Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])`), computes Softmax class probabilities, identifies the disease condition, and supplies organic and chemical control treatments.

---

## ⚙️ 7. Recommendation Engine Mechanics

1. **Crop Suitability Scoring**:
   - Compares the farmer's soil NPK, pH, and local weather conditions against optimal crop centroids in `crop_recommendation.csv`.
   - Computes weighted Euclidean feature distances:
     $$Score(c) = \sum_{f} w_f \cdot \left(\frac{val_f - \mu_{c,f}}{\sigma_{c,f}}\right)^2$$
   - Returns the top-5 ranking crops with confidence scores and environmental suitability notes.
2. **Fertilizer Formulation Selection**:
   - Analyzes nutrient deficits ($N_{deficit}, P_{deficit}, K_{deficit}$) relative to target crop requirements.
   - Queries `fertilizer_prediction.csv` to match closest candidate fertilizers (e.g. Urea for primary N deficits, DAP for phosphorus needs, MOP for potassium, or balanced NPK 20-20-0).
   - Generates dosage guidelines in kg/acre with application timing (basal vs. split vegetative stages).
3. **Regional Soil Baselines**:
   - Cross-references the farmer's district/state against `southern_indian_soil_nutrients.csv`.
   - Informs the farmer whether their field is higher or lower than the regional baseline average.

---

## 🌦️ 8. Location & Live Weather Integration

- **Automatic GPS Detection**: Farmer's browser requests HTML5 Geolocation API permission; latitude and longitude are captured and reverse geocoded to district and state.
- **Manual Fallback**: If GPS permission is denied, farmers can select their district and state via searchable dropdowns.
- **Open-Meteo Live Forecast**: The backend queries `https://api.open-meteo.com/v1/forecast` with the farmer's coordinates to retrieve:
  - Current ambient temperature (°C)
  - Relative humidity (%)
  - Wind speed (km/h)
  - Precipitation probability (%)
- **Actionable Farming Alerts**:
  - If precipitation probability $> 50\%$, an advisory alert suggests: *"Delay irrigation and foliar fertilizer application — rain expected tomorrow."*
  - If temperature $> 36^\circ\text{C}$ and humidity $< 40\%$, drought/heat stress warnings recommend mulching and moisture conservation.

---

## 🔒 9. Authentication & Role-Based Workflows

### Authentication Architecture
- **Dual Support**: Email/Password authentication and Supabase Google OAuth.
- **Role Determination**: Strict database persistence. The login and registration screens **never** display role selection dropdowns.
- **Default Assignment**: All public registrations default strictly to the `farmer` role.
- **Privileged Roles**: `expert` and `admin` roles can only be provisioned by existing administrators.

### Role-Based Workflows
1. **Farmer Persona**:
   - Registers/logs in, completes one-time onboarding (language + farm details + location).
   - Uploads soil test reports or crop leaf photos.
   - Views AI-generated advisory marked as *"Under Review by Agricultural Specialist"*.
   - Receives updated advisory once verified by an expert.
2. **Agricultural Expert Persona**:
   - Logs in with expert credentials; bypasses farmer onboarding directly into the **Expert Portal**.
   - Filters pending advisories across soil reports and crop disease analyses.
   - Inspects farmer telemetry, extracted parameters, AI recommendations, and risk levels.
   - **Approves**, **Modifies** (adjusts advisory content, adds regional warnings), or **Rejects** (with reason).
   - Timestamp, expert ID, and notes are logged to the database.
3. **System Administrator Persona**:
   - Logs into the **Admin Console**.
   - Inspects real-time system metrics (total farmers, active experts, pending/approved advisories).
   - Creates new Expert and Admin accounts.
   - Toggles user account status (active/inactive) or adjusts role permissions.

---

## 💻 10. Technology Stack

### Frontend
- **Framework**: React 18 with Vite build tooling
- **Language**: TypeScript (strict type checking)
- **Styling**: Tailwind CSS with custom agro-color tokens (`leaf`, `sprout`, `earth`, `harvest`, `meadow`, `sage`)
- **Icons**: Lucide React
- **Internationalization (i18n)**: Native React translation provider covering English, Telugu, Hindi, Tamil, Kannada, Malayalam
- **Client Deployment**: Vercel Single-Page Application (SPA)

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM & Storage**: SQLAlchemy with SQLite (`farmassist.db`) and Supabase PostgreSQL synchronization
- **Machine Learning**: PyTorch (`torch`, `torchvision`) for MobileNetV2 disease classification
- **NLP & Embeddings**: PyMuPDF (`fitz`), Tesseract OCR (`pytesseract`), Sentence-Transformers (`sentence-transformers/all-MiniLM-L6-v2`), NumPy, Scikit-learn
- **External APIs**: Open-Meteo Free Weather API, OpenStreetMap Nominatim Geocoding
- **Testing**: Python `unittest` suite

---

## 🛠️ 11. Complete Installation & Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher with `npm`
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/charankumarReddyB/FarmAssistAi.git
cd FarmAssistAi
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Populate official datasets (if not already present)
python scripts/populate_datasets.py

# Verify / Run unit tests
python -m unittest discover -s tests -p "test_*.py"

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend API interactive docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend

# Install Node dependencies
npm install

# Run frontend build verification
npm run build

# Start frontend development server
npm run dev
```
Frontend Web UI: `http://localhost:8443` or `http://localhost:5173`

---

## ⚙️ 12. Environment Variables Reference

### Backend (`backend/.env`)
```ini
DATABASE_URL=sqlite:///./farmassist.db
SECRET_KEY=farmassist-ai-production-super-secret-key-32chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:8443,http://localhost:5173,http://127.0.0.1:8443,http://127.0.0.1:5173
PORT=8000
HOST=127.0.0.1
ENVIRONMENT=development

# Supabase Cloud Integration (Optional/Hybrid)
SUPABASE_URL=https://vdadfdqqqtofnhfhdkvh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_SUPABASE_URL=https://vdadfdqqqtofnhfhdkvh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 13. REST API Endpoint Directory

### Authentication & Profiles
- `POST /api/auth/register` – Register new farmer account (defaults role to `farmer`)
- `POST /api/auth/login` – Login with email & password, returns JWT token & role
- `GET  /api/user/profile` – Retrieve authenticated user's profile and farm location
- `PUT  /api/user/profile` – Update farmer profile, coordinates, and farm parameters
- `POST /api/user/complete-onboarding` – Mark onboarding as finished

### Soil Reports & NLP Analysis
- `POST /api/reports/upload` – Upload PDF or scanned image report for OCR extraction
- `GET  /api/reports` – List farmer's past uploaded reports
- `GET  /api/reports/{id}` – View report details and extracted NPK/pH metrics

### Crop Disease Diagnosis
- `POST /api/crop-analysis/analyze` – Upload leaf photo for PyTorch MobileNetV2 inference
- `GET  /api/crop-analysis/history` – Retrieve past crop disease analyses

### Farmer Advisories & Weather
- `GET  /api/advisories` – List generated advisories
- `GET  /api/advisories/{id}` – Get comprehensive structured advisory by ID
- `GET  /api/weather/current` – Get live weather & farming alerts for coordinates/district
- `GET  /api/farm/location-analysis` – Regional soil and climate intelligence

### Expert Portal (RBAC: `expert`, `admin`)
- `GET  /api/expert/advisories` – List advisories waiting for human validation
- `GET  /api/expert/advisories/{id}` – Get advisory details for expert inspection
- `POST /api/expert/advisories/{id}/approve` – Approve AI advisory without changes
- `POST /api/expert/advisories/{id}/modify` – Modify recommendations and add expert notes
- `POST /api/expert/advisories/{id}/reject` – Reject advisory with specific rationale

### Admin Governance (RBAC: `admin`)
- `GET   /api/admin/stats` – System-wide counts of users, advisories, and status breakdown
- `GET   /api/admin/users` – List all system users with role/search filtering
- `POST  /api/admin/users` – Provision new Expert or Admin account
- `PATCH /api/admin/users/{id}/status` – Activate or deactivate user account
- `PATCH /api/admin/users/{id}/role` – Update user permission role

---

## 🧪 14. Testing & Verification Results

The test suite runs using standard Python `unittest`:

```bash
cd backend
.\venv\Scripts\python -m unittest discover -s tests -p "test_*.py"
```

### Test Suite Execution Summary:
- **Total Automated Tests**: 20 integration tests across all workflows.
- **Pass Rate**: **100% (20/20 passed)**.
- **Coverage Areas**:
  - `test_integrated_system.py`: User registration, JWT authentication, farm profile updating, weather integration, crop analysis, location analysis, and admin role security.
  - `test_expert_review_lifecycle.py`: Complete lifecycle from soil report creation $\rightarrow$ initial AI advisory (`pending_review`) $\rightarrow$ expert modification $\rightarrow$ farmer advisory consumption with updated status and notes.
- **Frontend Production Build**: Vite build executed cleanly with 0 TypeScript or packaging errors (`dist/assets/index-*.js`, `dist/assets/index-*.css`).

---

## 🗄️ 15. Database Schema Summary

The relational database (`farmassist.db`) defines 5 core models:

1. **`User`**: `id`, `email`, `hashed_password`, `full_name`, `role` (`farmer`/`expert`/`admin`), `country`, `state`, `district`, `village_or_city`, `latitude`, `longitude`, `preferred_language`, `onboarding_completed`, `is_active`, `created_at`.
2. **`FarmProfile`**: `id`, `user_id` (foreign key $\rightarrow$ `User`), `farm_name`, `farm_size`, `current_crop`, `soil_type`, `irrigation_method`, `sowing_date`, `crop_stage`, `experience_years`, `water_source`, `survey_number`.
3. **`Report`**: `id`, `farmer_id`, `filename`, `file_type`, `file_path`, `raw_text`, `extracted_data` (JSON: N, P, K, pH, EC, OC), `status`, `created_at`.
4. **`CropImageAnalysis`**: `id`, `farmer_id`, `image_url`, `disease_name`, `confidence`, `severity`, `symptoms`, `treatment`, `preventive_measures`, `created_at`.
5. **`Advisory`**: `id`, `report_id`, `crop_analysis_id`, `farmer_id`, `farmer_name`, `farmer_location`, `source_type`, `report_summary`, `soil_health_analysis`, `crop_recommendations` (JSON), `fertilizer_recommendations` (JSON), `irrigation_suggestions` (JSON), `risk_level`, `weather_impact`, `original_ai_advisory`, `final_advisory`, `status` (`pending_review`/`under_review`/`approved`/`modified`/`rejected`), `reviewed_by`, `expert_id`, `expert_notes`, `created_at`, `reviewed_at`.

---

## 🎯 16. Presentation Talking Points (For Tomorrow's Defense)

When demonstrating FARMAssist AI to examiners and evaluators:

1. **Highlight the Core Problem**: Smallholder farmers receive scientific soil test certificates that are filled with technical chemical units (kg/ha, ppm, dS/m) they cannot interpret, while access to human agronomists is scarce.
2. **Demonstrate the Dual-Engine OCR**: Show how uploading a sample PDF (e.g. `test-samples/soil_report_kurnool.pdf`) immediately extracts primary metrics (pH 7.4, Nitrogen 145 kg/ha, Phosphorus 22 kg/ha, Potassium 190 kg/ha) with zero manual entry.
3. **Demonstrate Grounded Dataset Intelligence**: Point out that crop recommendations are not hallucinated by an LLM; they are mathematically computed from 2,200 Kaggle crop records and 700 Southern Indian soil baseline records.
4. **Walk Through Crop Disease Diagnosis**: Upload a leaf photo (e.g. `test-samples/crop_bacterial_leaf_blight.jpg`) and show the PyTorch MobileNetV2 model identifying the disease at 92.1% accuracy with immediate organic and chemical remedy recommendations.
5. **Emphasize the Human-in-the-Loop Safeguard**: Show the advisory status as *"Under Review by Agricultural Specialist"*, switch accounts to the Expert Portal, demonstrate the expert modifying the fertilizer dosage, and show how the farmer's dashboard updates in real time with the expert's name and notes.
6. **Showcase Location & Weather Adaptability**: Point out how the live Open-Meteo weather integration alerts farmers against over-irrigating before rainfall.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
