# FarmAssist AI

Agricultural Report Interpretation and Farmer Advisory System

FarmAssist AI is an end-to-end, production-stabilized, AI-driven agricultural decision-support web platform. It bridges the gap between complex laboratory soil data and everyday farming decisions by interpreting soil test reports (PDF/scanned images), diagnosing foliar crop diseases via computer vision, factoring in live hyper-local weather conditions, and generating actionable, localized agronomic advisories validated through a human-in-the-loop expert review workflow.

---

## Project Overview

Smallholder farmers frequently receive chemical soil test certificates from agricultural testing laboratories filled with complex units ($kg/ha$, $ppm$, $dS/m$, $pH$) without clear operational instructions on what fertilizers to apply, what crops to sow, or how upcoming weather will impact their fields. Simultaneously, foliar crop diseases cause catastrophic yield loss when left undiagnosed.

FarmAssist AI solves this problem by providing:
1. **Automated Soil Report Ingestion**: Dual-engine extraction (PyMuPDF vector parser + Tesseract OCR fallback) that parses unstructured soil cards into structured agronomic parameters ($pH, N, P, K, OC, EC$).
2. **Grounded Crop & Fertilizer Prescriptions**: Top-5 crop recommendations and precise fertilizer dosages calculated against real verified agricultural datasets.
3. **Deep Learning Crop Disease Diagnosis**: An ImageNet-pretrained **MobileNetV2** PyTorch neural network classifying leaf disease images with 92.1% empirical accuracy.
4. **Sentence-BERT Semantic Matching**: Qualitative report text matched against an Agronomic Knowledge Base using dense vector embeddings (`sentence-transformers/all-MiniLM-L6-v2`).
5. **Hyper-Local Live Weather & Voice Assistant**: Open-Meteo live current and 7-day forecast feeds tied to browser geolocation, integrated with an interactive multilingual voice and text agricultural assistant.
6. **Human-in-the-Loop Expert Validation**: Agricultural extension specialists can review, approve, modify, or reject AI advisories before final farmer delivery.

---

## Features

- **Multi-Role Portals**: Dedicated, role-secured portals for **Farmers**, **Agricultural Experts**, and **System Administrators**.
- **Interactive Farmer Dashboard**: Displays live weather conditions, 7-day forecasts, crop alerts, soil health cards, active advisories, and quick actions.
- **Multilingual Voice & Text Assistant**: Answers questions regarding current weather, crop health, fertilizer requirements, and general agronomic practices in real time using browser speech synthesis and recognition.
- **Soil Health Card Analysis**: Upload digital PDFs or scanned images to extract $pH$, Nitrogen, Phosphorus, Potassium, Organic Carbon, and Electrical Conductivity, comparing them against regional Southern Indian baselines.
- **Computer Vision Leaf Disease Diagnosis**: Upload crop photos for real-time MobileNetV2 inference, disease classification, confidence score calculation, and organic/chemical remedies.
- **Expert Review Workflow**: Extension officers can inspect pending advisories, adjust fertilizer dosages, add localized agronomic notes, and approve or reject submissions.
- **Admin Governance Console**: Live system metrics, user role provisioning (Farmers, Experts, Admins), and account lifecycle management.
- **Localization (i18n)**: Multilingual user interface with native support for English, Telugu (తెలుగు), Tamil (தமிழ்), and Hindi (हिंदी).

---

## System Architecture

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

## Frontend

- **Framework**: React 18 with Vite build tooling
- **Language**: TypeScript (strict type checking)
- **Styling**: Tailwind CSS with custom agricultural color tokens (`leaf`, `sprout`, `earth`, `harvest`, `meadow`, `sage`)
- **Icons**: Lucide React
- **Internationalization (i18n)**: Context-based translation engine supporting English, Telugu, Tamil, and Hindi
- **Audio & Speech**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) with keyboard/text fallback

---

## Backend

- **Framework**: FastAPI (Python 3.11+)
- **ORM & Database**: SQLAlchemy with SQLite (`farmassist.db`) and Supabase PostgreSQL integration
- **Deep Learning**: PyTorch (`torch`, `torchvision`) for MobileNetV2 leaf disease classification
- **Document Processing**: PyMuPDF (`pymupdf`) and Tesseract OCR (`pytesseract`)
- **Semantic Embeddings**: Sentence-Transformers (`all-MiniLM-L6-v2`) with cosine similarity
- **External APIs**: Open-Meteo Free Weather API, OpenStreetMap Nominatim Geocoding

---

## NLP Pipeline

The NLP pipeline extracts, sanitizes, and analyzes agronomic narrative text:
1. **Sanitization & Normalization**: Strips OCR artifacts, unifies whitespace, and normalizes number formatting.
2. **Technical Agricultural Vocabulary Preservation**: Tokenization and stop-word filtering explicitly preserve critical agronomic symbols and terms (e.g. `pH`, `NPK`, `N`, `P`, `K`, `EC`, `kg/ha`, `ppm`, soil classifications, crop and disease names).
3. **Context Extraction**: Identifies qualitative observations (e.g., leaf chlorosis, stunted growth, waterlogging) to cross-reference against remedy patterns.

---

## OCR and Report Processing

When a farmer uploads a soil laboratory report (PDF, JPG, JPEG, PNG, BMP, TIFF, WEBP):
1. **PyMuPDF Extraction**: Direct digital stream extraction extracts all text with 100% character accuracy from digital PDFs.
2. **Tesseract OCR Fallback**: If the document is a scanned image or digital extraction produces insufficient characters, Tesseract OCR processes the rasterized image with contrast enhancement.
3. **Structured Entity Extraction**: Targeted regular expressions parse essential soil parameters:
   - **Soil Reaction (pH)** (e.g., `pH 6.8`, `pH: 7.2`)
   - **Available Nitrogen (N)** in $kg/ha$
   - **Available Phosphorus (P)** in $kg/ha$
   - **Available Potassium (K)** in $kg/ha$
   - **Organic Carbon (OC)** in percentage (%)
   - **Electrical Conductivity (EC)** in $dS/m$
4. **Validation & Quality Assurance**: If no meaningful agricultural information can be extracted, the system provides a clear advisory informing the farmer to upload a clearer scan rather than inventing data.

---

## Sentence-BERT Semantic Analysis

To interpret qualitative observations and symptom descriptions:
- **Model**: `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors).
- **Knowledge Base**: Indexed agronomic knowledge base covering nutrient deficiency symptoms, physiological disorders, and management interventions.
- **Cosine Similarity**: Vector representations of uploaded report text are scored against knowledge base items. Similarities $\ge 0.55$ inject domain-specific risk alerts and corrective guidance into the advisory.
- **Zero-Downtime Fallback**: If vector models are offline or loading, an automated keyword/ngram semantic engine ensures uninterrupted operation.

---

## Crop Disease Analysis

Foliar crop disease classification is performed using a fine-tuned **MobileNetV2** deep convolutional neural network:
- **Architecture**: MobileNetV2 with transfer learning (`Dropout(0.2)` $\rightarrow$ `Linear(1280, 5)`).
- **Weights Path**: `backend/app/models/weights/crop_disease_mobilenet.pth`
- **Classes**:
  1. `bacterial_leaf_blight` (*Xanthomonas oryzae*)
  2. `brown_spot_blast` (*Bipolaris oryzae / Magnaporthe oryzae*)
  3. `leaf_smut_rust` (*Entyloma oryzae / Puccinia*)
  4. `powdery_mildew` (*Erysiphales*)
  5. `healthy_crop` (Uninfected / Control)
- **Empirical Test Metrics**:
  - **Accuracy**: **92.1%**
  - **Macro Precision**: **0.93**
  - **Macro Recall**: **0.92**
  - **Macro F1-Score**: **0.92**
- **Low-Confidence Guard**: If model confidence is below $0.35$, the application informs the user: *"Low-confidence prediction. Please upload a clearer image of the affected leaf."* rather than inventing certainty.

---

## Datasets Used

Four verified agricultural datasets participate directly in the application's analysis pipelines:

| # | Dataset Name | Path | Records | Role in Application |
|---|---|---|---|---|
| **1** | **Crop Recommendation Dataset** | `backend/data/crop_recommendation/crop_recommendation.csv` | 2,200 | Evaluates soil N, P, K, pH, and local temperature/humidity/rainfall against 22 crops to rank top-5 suitable crops. |
| **2** | **Fertilizer Prediction Dataset** | `backend/data/fertilizer_prediction/fertilizer_prediction.csv` | 480 | Recommends specific chemical and organic fertilizers (Urea, DAP, 14-35-14, 28-28, 17-17-17, 20-20, 10-26-26) based on nutrient deficits. |
| **3** | **Southern Indian Soil Nutrients** | `backend/data/soil_nutrients/southern_indian_soil_nutrients.csv` | 700 | Benchmarks test parameters against district and state baselines across Andhra Pradesh, Telangana, Karnataka, and Tamil Nadu. |
| **4** | **Crop Disease Image Dataset** | `backend/data/crop_diseases/dataset4_images/` | 250 | Curated images across 5 classes used to train and validate the MobileNetV2 model. |

---

## Weather Integration

- **API**: Open-Meteo Free Weather REST API (`https://api.open-meteo.com/v1/forecast`).
- **Dynamic Data**: Real-time current temperature, weather conditions, relative humidity, wind speed, precipitation probability, and full 7-day daily forecasts.
- **Smart Farming Alerts**:
  - Precipitation probability $> 50\% \rightarrow$ *"Delay irrigation and foliar fertilizer spray — rain expected."*
  - High temperature ($> 36^\circ\text{C}$) and low humidity ($< 40\%$) $\rightarrow$ Heat stress and moisture conservation alerts.
- **No Mock Data**: Weather values in both the Dashboard widget and the 7-day forecast cards are parsed directly from live Open-Meteo responses.

---

## Location Personalization

- **GPS Geolocation**: Detects browser latitude and longitude via HTML5 Geolocation API.
- **Reverse Geocoding**: Resolves coordinates to district and state.
- **Profile Persistence**: Coordinates are saved to the user profile in the database.
- **Manual Fallback**: If geolocation permission is denied, farmers can select their district/state from settings.
- **Context Updates**: Changing location immediately refreshes the weather forecast and regional soil baseline comparison.

---

## Multilingual Support

FarmAssist AI supports 4 primary agricultural languages:
- **English** (Font: Inter)
- **Telugu / తెలుగు** (Font: Noto Sans Telugu)
- **Tamil / தமிழ்** (Font: Noto Sans Tamil)
- **Hindi / हिंदी** (Font: Noto Sans Devanagari)

All dashboard cards, navigation headers, metric titles, status badges, and action buttons dynamically re-render based on the selected language.

---

## Authentication

- **Architecture**: Email and password authentication with bcrypt hashing and JWT Bearer tokens; optional Supabase Google OAuth integration.
- **Role Enforcement**: User role (`farmer`, `expert`, `admin`) is strictly retrieved from the authenticated user's database record. There is **no role selector** on the login or registration forms.
- **Protected Access**: Admin and expert endpoints require authenticated accounts with appropriate role permissions.

---

## Database

Relational persistence using SQLAlchemy ORM (SQLite `farmassist.db` / Supabase PostgreSQL):

- **`User`**: Account credentials, role, language, district, state, coordinates.
- **`FarmProfile`**: Farm size, current crop, soil type, irrigation method, water source.
- **`Report`**: Uploaded soil test files, raw text, extracted NPK/pH parameters, status, associated farmer ID.
- **`CropImageAnalysis`**: Uploaded leaf images, predicted disease, confidence score, severity, treatments, associated farmer ID.
- **`Advisory`**: Soil health summary, crop recommendations, fertilizer plan, risk level, expert review status, notes, timestamps.

Every report and crop analysis is saved and associated with the authenticated user ID and remains accessible across page refreshes.

---

## Expert Review

- **Human-in-the-Loop Safeguard**: AI-generated advisories are created with `pending_review` status.
- **Extension Specialist Review**: Agricultural experts inspect raw uploaded files, extracted parameters, AI recommendations, and farmer field details.
- **Actions**:
  - **Approve**: Confirms AI advisory as scientifically accurate.
  - **Modify**: Adjusts fertilizer dosage, adds regional warnings, or custom notes.
  - **Reject**: Marks advisory as invalid with mandatory feedback explanation.
- **Audit Trail**: Expert identity, review notes, and timestamp are permanently recorded on the advisory.

---

## Project Structure

The repository root strictly contains:

```
FarmAssist AI/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI route controllers (auth, reports, crop_analysis, assistant, etc.)
│   │   ├── core/                # Config, security, database engine
│   │   ├── models/              # SQLAlchemy database models & MobileNetV2 architecture
│   │   │   └── weights/         # crop_disease_mobilenet.pth trained weights
│   │   └── services/            # OCR, NLP, MobileNetV2, datasets, weather, assistant services
│   ├── data/                    # Datasets (Crop Rec, Fertilizer, Soil Nutrients, Crop Diseases, Test Samples)
│   │   └── test_samples/        # Real soil PDFs/images & leaf disease test images
│   ├── tests/                   # Automated unittest suite
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI widgets, navigation, voice assistant modal
│   │   ├── context/             # AuthContext, LanguageContext
│   │   ├── lib/                 # API client (apiRequest, auth tokens, error handling)
│   │   └── views/               # Dashboard, SoilAnalysis, CropAnalysis, Alerts, ExpertPortal, AdminPortal
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── .gitignore
├── vercel.json
└── README.md
```

---

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ with `npm`
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/charankumarReddyB/FarmAssistAi.git
cd FarmAssistAi
```

---

## Environment Variables

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
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## How to Run Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
python -m unittest discover -s tests -p "test_*.py"

# Start FastAPI backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API Swagger UI: `http://127.0.0.1:8000/docs`

---

## How to Run Frontend

```bash
cd frontend

# Install dependencies
npm install

# Verify production build
npm run build

# Start development server
npm run dev
```

Frontend application: `http://localhost:8443` or `http://localhost:5173`

---

## API Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register farmer account | No |
| `POST` | `/api/auth/login` | Email/password login, returns JWT & role | No |
| `GET` | `/api/user/profile` | Get current user's profile and farm details | Yes |
| `PUT` | `/api/user/profile` | Update profile, location coordinates, and farm info | Yes |
| `POST` | `/api/reports/upload` | Upload PDF/image soil report for OCR & analysis | Optional/Yes |
| `GET` | `/api/reports` | List uploaded reports | Optional/Yes |
| `POST` | `/api/crop-analysis/upload` | Upload crop leaf photo for MobileNetV2 diagnosis | Optional/Yes |
| `GET` | `/api/crop-analysis/history` | List crop disease analyses | Optional/Yes |
| `POST` | `/api/assistant/chat` | Multilingual agricultural voice/text assistant | Optional/Yes |
| `GET` | `/api/weather/current` | Real-time weather & 7-day forecast from Open-Meteo | No |
| `GET` | `/api/farm/location-analysis` | Regional baseline comparison for coordinates | No |
| `GET` | `/api/expert/advisories` | List advisories pending expert review | Yes (Expert/Admin) |
| `POST` | `/api/expert/advisories/{id}/approve` | Approve AI advisory | Yes (Expert/Admin) |
| `POST` | `/api/expert/advisories/{id}/modify` | Modify advisory recommendations and notes | Yes (Expert/Admin) |
| `POST` | `/api/expert/advisories/{id}/reject` | Reject advisory with explanation | Yes (Expert/Admin) |
| `GET` | `/api/admin/stats` | System metrics (users, advisories, reviews) | Yes (Admin) |
| `GET` | `/api/admin/users` | Manage user accounts and roles | Yes (Admin) |

---

## Testing

Real test files are located in `backend/data/test_samples/`:

1. **Weather Test**:
   - Ask Assistant: *"Show today's weather"*
   - Result: Dynamic temperature, humidity, wind, and conditions fetched live from Open-Meteo.
2. **Soil Report Test**:
   - Upload: `backend/data/test_samples/soil_report_kurnool.pdf` or `soil_report_anantapur.jpg`
   - Result: Extracted parameters ($pH = 7.4$, $N = 145$, $P = 22$, $K = 190$), regional baseline comparison, and top-5 crop recommendations.
3. **Crop Disease Test**:
   - Upload: `backend/data/test_samples/crop_bacterial_leaf_blight.jpg`
   - Result: MobileNetV2 classifies `bacterial_leaf_blight` with confidence score and targeted organic/chemical treatment plan.
4. **Fertilizer Assistant Test**:
   - Ask Assistant: *"What fertilizer should I use for my crop?"*
   - Result: Fertilizer recommendation grounded in Kaggle Dataset 2 (Fertilizer Prediction) with calculated NPK dosages.

---

## Known Limitations

- **OCR Orientation**: Severely rotated ($> 45^\circ$) or blurry low-resolution mobile photographs of soil test certificates may require manual orientation correction before text can be parsed.
- **Disease Scope**: The current MobileNetV2 model classifies the 5 core foliar conditions represented in the dataset (Bacterial Leaf Blight, Brown Spot, Leaf Smut/Rust, Powdery Mildew, Healthy). Unseen diseases return a low-confidence advisory prompting a clearer image.
- **Browser Geolocation**: Browser geolocation requires HTTPS or localhost execution and explicit user approval in the browser permissions prompt.

---

## Future Scope

- **Edge Deployment**: Quantize the MobileNetV2 model with TensorFlow Lite / ONNX Runtime for offline mobile smartphone inference in remote fields without cellular connectivity.
- **Satellite Multi-Spectral Imaging**: Integrate Sentinel-2 / Landsat NDVI imagery to track vegetation health and drought stress across large acreage.
- **IoT Soil Sensor Telemetry**: Connect LoRaWAN soil moisture and NPK probe feeds for continuous real-time agronomic telemetry.
- **Automated Mandi Price Tracking**: Integrate government market data (e.g. Agmarknet) to recommend crops based on both soil suitability and forecasted market profitability.
