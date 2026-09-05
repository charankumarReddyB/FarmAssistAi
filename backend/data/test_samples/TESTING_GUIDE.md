# FarmAssist AI – Comprehensive Feature Testing Guide & Sample Data

This directory contains ready-to-use sample files and data to thoroughly test every single feature in FarmAssist AI.

---

## 📁 Sample Files in `test-samples/`

| Filename | Format | Purpose / Feature | What it Tests |
|---|---|---|---|
| `soil_report_anantapur.pdf` | PDF Document | **Soil Analysis** (PDF Upload) | Low Nitrogen, High Potassium, Alkaline pH 7.8, Soil Health Card format |
| `soil_report_anantapur.jpg` | High-res Image | **Soil Analysis** (Image OCR) | Same report in image format to test OCR extraction |
| `soil_report_kurnool.pdf` | PDF Document | **Soil Analysis** (PDF Upload) | Acidic red soil, Low Phosphorus, Private AgriLab format |
| `soil_report_kurnool.jpg` | High-res Image | **Soil Analysis** (Image OCR) | Image OCR test for Kurnool AgriLab format |
| `crop_bacterial_leaf_blight.jpg` | Leaf Photo | **Crop Disease Analysis** | Tests detection of *Bacterial Leaf Blight* (Xanthomonas oryzae) on Rice leaf |
| `crop_brown_spot.jpg` | Leaf Photo | **Crop Disease Analysis** | Tests detection of *Brown Spot* (Helminthosporium oryzae) disease |
| `crop_healthy_leaf.jpg` | Leaf Photo | **Crop Disease Analysis** | Tests healthy leaf classification (No disease detected) |

---

## 🧪 Feature-by-Feature Testing Walkthrough

### 1. 🧪 Soil Analysis (`/soil-analysis`)

#### Option A: Upload Test Files
- Click **Upload Lab Report**
- Drag and drop or browse to select:
  - `test-samples/soil_report_anantapur.pdf` OR
  - `test-samples/soil_report_anantapur.jpg`
- The system will run OCR and extract the parameters, then provide AI fertilizer recommendations and crop suitability.

#### Option B: Manual Values (Quick Test Cases)
If testing manual input fields:

**Test Case 1: Low Nitrogen & Micronutrient Deficient (Paddy / Rice)**
- **Nitrogen (N):** `140` kg/ha *(Low - deficient)*
- **Phosphorus (P):** `18` kg/ha *(Medium)*
- **Potassium (K):** `290` kg/ha *(High)*
- **pH:** `7.8` *(Slightly Alkaline)*
- **Electrical Conductivity (EC):** `0.45` dS/m *(Normal)*
- **Organic Carbon (OC):** `0.38` % *(Low)*
- **Target Crop:** Rice / Paddy
- *Expected Output:* High Urea recommendation, bio-fertilizer advice (Azospirillum), organic manure addition.

**Test Case 2: Acidic Soil with Low Phosphorus (Groundnut / Cotton)**
- **Nitrogen (N):** `260` kg/ha *(Medium)*
- **Phosphorus (P):** `9.5` kg/ha *(Very Low)*
- **Potassium (K):** `180` kg/ha *(Medium)*
- **pH:** `5.6` *(Acidic)*
- **Electrical Conductivity (EC):** `0.30` dS/m *(Normal)*
- **Organic Carbon (OC):** `0.62` % *(Medium)*
- **Target Crop:** Groundnut
- *Expected Output:* Liming recommendation (agricultural lime/dolomite), Single Super Phosphate (SSP) for phosphorus.

---

### 2. 🌿 Crop Disease Diagnosis (`/crop-analysis`)

1. Go to **Crop Disease** page.
2. Select Crop Type: **Rice / Paddy** (or Auto-Detect).
3. Upload either:
   - `test-samples/crop_bacterial_leaf_blight.jpg`
     - *Expected Result:* Bacterial Leaf Blight detected with treatment measures (Streptocycline + Copper Oxychloride spray).
   - `test-samples/crop_brown_spot.jpg`
     - *Expected Result:* Brown Spot detected with fungicide advice (Mancozeb / Tricyclazole).
   - `test-samples/crop_healthy_leaf.jpg`
     - *Expected Result:* Healthy plant, preventive maintenance tips.

---

### 3. 🎙️ AI Voice & Chat Assistant (`/assistant`)

Test the conversational AI assistant with these sample farmer questions in English or Telugu:

**English queries:**
- *"My tomato leaves have yellow spots with curling edges, what should I spray?"*
- *"What is the best fertilizer schedule for 45-day-old cotton crop in red soil?"*
- *"Current market price trends and weather precautions for chilli crop in Guntur?"*

**Telugu queries:**
- *"వరి పంటలో ఆకు ఎండు తెగులు వచ్చింది, ఏ మందు పిచికారీ చేయాలి?"*
- *"ఎర్ర నేలల్లో వేరుశనగ పంటకి ఎంత మోతాదులో ఎరువులు వేయాలి?"*

---

### 4. 🚜 My Farm Management (`/my-farm`)

Create a test farm profile:
- **Farm Name:** Sri Balaji Farms
- **Location:** Anantapur, Andhra Pradesh (or your current location via GPS)
- **Total Area:** 5.5 Acres
- **Soil Type:** Red Sandy Loam
- **Irrigation Source:** Borewell / Drip Irrigation
- **Primary Crops:** Groundnut (Kharif), Sweet Orange / Mosambi

---

### 5. 👑 Admin Dashboard (`/admin`)

Test the admin controls (**Admin access is strictly and exclusively restricted to this account**):
- **Login:** `charankumarreddybantrothula@gmail.com`
- **Password:** `Charan@123`
- *What to test:*
  - Verify total registered users count.
  - View logged soil and crop analysis records.
  - Check system health metrics and API connectivity.
  - Confirm role protection: only this email possesses Administrator rights.

---

### 6. 🧑‍🔬 Expert Portal (`/expert`)

Test agricultural expert workflow:
- **Login:** `expert@farmassist.ai`
- **Password:** `Expert@123456`
- *What to test:*
  - View flagged or uncertain AI diagnoses submitted by farmers.
  - Add official expert remarks and approve agronomy prescription.
