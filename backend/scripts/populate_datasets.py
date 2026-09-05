import os
import csv
import random

BASE_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# ---------------------------------------------------------
# DATASET 1: Crop Recommendation Dataset
# Expected fields: Nitrogen, Phosphorus, Potassium, temperature, humidity, pH, rainfall, label
# ---------------------------------------------------------
CROP_DATA_RULES = [
    {"label": "rice", "n": (60, 120), "p": (35, 60), "k": (35, 45), "ph": (5.0, 7.8), "temp": (20, 27), "humidity": (80, 90), "rainfall": (150, 300)},
    {"label": "maize", "n": (60, 100), "p": (35, 60), "k": (15, 25), "ph": (5.5, 7.5), "temp": (18, 27), "humidity": (55, 75), "rainfall": (60, 110)},
    {"label": "chickpea", "n": (20, 60), "p": (55, 80), "k": (75, 85), "ph": (6.0, 8.5), "temp": (17, 22), "humidity": (14, 20), "rainfall": (65, 95)},
    {"label": "kidneybeans", "n": (15, 40), "p": (55, 80), "k": (15, 25), "ph": (5.5, 6.0), "temp": (15, 24), "humidity": (18, 25), "rainfall": (60, 150)},
    {"label": "pigeonpeas", "n": (15, 40), "p": (55, 80), "k": (15, 25), "ph": (4.5, 7.5), "temp": (18, 38), "humidity": (30, 70), "rainfall": (90, 200)},
    {"label": "mothbeans", "n": (0, 40), "p": (35, 60), "k": (15, 25), "ph": (3.5, 10.0), "temp": (24, 32), "humidity": (40, 65), "rainfall": (30, 70)},
    {"label": "mungbean", "n": (15, 40), "p": (35, 60), "k": (15, 25), "ph": (6.2, 7.2), "temp": (27, 30), "humidity": (80, 90), "rainfall": (35, 60)},
    {"label": "blackgram", "n": (40, 60), "p": (55, 80), "k": (15, 25), "ph": (6.5, 7.5), "temp": (25, 35), "humidity": (60, 70), "rainfall": (60, 75)},
    {"label": "lentil", "n": (15, 40), "p": (55, 80), "k": (15, 25), "ph": (5.5, 7.0), "temp": (18, 30), "humidity": (60, 70), "rainfall": (40, 55)},
    {"label": "pomegranate", "n": (15, 40), "p": (10, 30), "k": (35, 45), "ph": (5.5, 7.2), "temp": (18, 25), "humidity": (85, 95), "rainfall": (100, 110)},
    {"label": "banana", "n": (80, 120), "p": (70, 95), "k": (45, 55), "ph": (5.5, 6.5), "temp": (25, 30), "humidity": (75, 85), "rainfall": (90, 120)},
    {"label": "mango", "n": (15, 40), "p": (15, 40), "k": (25, 35), "ph": (4.5, 7.0), "temp": (27, 36), "humidity": (45, 55), "rainfall": (80, 100)},
    {"label": "grapes", "n": (15, 40), "p": (120, 145), "k": (195, 205), "ph": (5.5, 6.5), "temp": (8, 42), "humidity": (80, 85), "rainfall": (60, 75)},
    {"label": "watermelon", "n": (80, 120), "p": (5, 30), "k": (45, 55), "ph": (6.0, 7.0), "temp": (24, 27), "humidity": (80, 90), "rainfall": (40, 60)},
    {"label": "muskmelon", "n": (80, 120), "p": (5, 30), "k": (45, 55), "ph": (6.0, 6.8), "temp": (27, 30), "humidity": (90, 95), "rainfall": (20, 30)},
    {"label": "apple", "n": (0, 40), "p": (120, 145), "k": (195, 205), "ph": (5.5, 6.5), "temp": (21, 24), "humidity": (90, 95), "rainfall": (100, 125)},
    {"label": "orange", "n": (0, 40), "p": (5, 30), "k": (5, 15), "ph": (6.0, 7.5), "temp": (10, 35), "humidity": (90, 95), "rainfall": (100, 120)},
    {"label": "papaya", "n": (30, 70), "p": (45, 70), "k": (45, 55), "ph": (6.5, 7.0), "temp": (23, 44), "humidity": (90, 95), "rainfall": (140, 250)},
    {"label": "coconut", "n": (15, 40), "p": (5, 30), "k": (25, 35), "ph": (5.5, 6.5), "temp": (25, 29), "humidity": (95, 100), "rainfall": (130, 225)},
    {"label": "cotton", "n": (100, 140), "p": (35, 60), "k": (15, 25), "ph": (6.0, 8.0), "temp": (22, 26), "humidity": (75, 85), "rainfall": (60, 90)},
    {"label": "jute", "n": (60, 100), "p": (35, 60), "k": (35, 45), "ph": (6.0, 7.5), "temp": (23, 26), "humidity": (70, 85), "rainfall": (150, 200)},
    {"label": "coffee", "n": (80, 120), "p": (15, 40), "k": (25, 35), "ph": (6.0, 7.5), "temp": (23, 28), "humidity": (50, 70), "rainfall": (115, 190)}
]

def generate_crop_recommendation_csv():
    target_path = os.path.join(BASE_DATA_DIR, "crop_recommendation", "crop_recommendation.csv")
    random.seed(42)
    rows = []
    headers = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall", "label"]

    for rule in CROP_DATA_RULES:
        # Generate 100 realistic samples per crop
        for _ in range(100):
            n = round(random.uniform(*rule["n"]), 2)
            p = round(random.uniform(*rule["p"]), 2)
            k = round(random.uniform(*rule["k"]), 2)
            temp = round(random.uniform(*rule["temp"]), 2)
            humidity = round(random.uniform(*rule["humidity"]), 2)
            ph = round(random.uniform(*rule["ph"]), 2)
            rainfall = round(random.uniform(*rule["rainfall"]), 2)
            rows.append([n, p, k, temp, humidity, ph, rainfall, rule["label"]])

    with open(target_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    print(f"Generated Crop Recommendation Dataset at {target_path} ({len(rows)} records).")


# ---------------------------------------------------------
# DATASET 2: Fertilizer Prediction Dataset
# Expected fields: Temparature, Humidity, Moisture, Soil Type, Crop Type, Nitrogen, Potassium, Phosphorous, Fertilizer Name
# ---------------------------------------------------------
SOIL_TYPES = ["Sandy", "Loamy", "Black", "Red", "Clayey"]
FERTILIZER_RULES = [
    {"name": "Urea", "min_n": 0, "max_n": 45, "min_p": 0, "max_p": 60, "min_k": 0, "max_k": 60, "soils": ["Loamy", "Sandy", "Clayey", "Black", "Red"], "crops": ["Rice", "Maize", "Cotton", "Sugarcane", "Wheat", "Millets", "Tobacco"]},
    {"name": "DAP", "min_n": 20, "max_n": 100, "min_p": 0, "max_p": 25, "min_k": 0, "max_k": 60, "soils": ["Black", "Red", "Clayey", "Loamy"], "crops": ["Rice", "Wheat", "Chickpea", "Kidneybeans", "Cotton", "Groundnut"]},
    {"name": "14-35-14", "min_n": 30, "max_n": 90, "min_p": 10, "max_p": 35, "min_k": 10, "max_k": 40, "soils": ["Red", "Sandy", "Loamy"], "crops": ["Pulses", "Oil seeds", "Cotton", "Maize", "Groundnut"]},
    {"name": "28-28", "min_n": 20, "max_n": 60, "min_p": 20, "max_p": 50, "min_k": 20, "max_k": 60, "soils": ["Clayey", "Loamy", "Black"], "crops": ["Sugarcane", "Rice", "Cotton", "Wheat"]},
    {"name": "17-17-17", "min_n": 30, "max_n": 80, "min_p": 20, "max_p": 50, "min_k": 20, "max_k": 60, "soils": ["Sandy", "Loamy", "Red"], "crops": ["Millets", "Pulses", "Barley", "Tobacco", "Paddy"]},
    {"name": "20-20", "min_n": 25, "max_n": 70, "min_p": 25, "max_p": 60, "min_k": 15, "max_k": 50, "soils": ["Clayey", "Black", "Loamy"], "crops": ["Rice", "Cotton", "Sugarcane"]},
    {"name": "10-26-26", "min_n": 10, "max_n": 40, "min_p": 20, "max_p": 60, "min_k": 0, "max_k": 35, "soils": ["Red", "Black", "Clayey"], "crops": ["Groundnut", "Pulses", "Oil seeds", "Chickpea"]},
    {"name": "MOP", "min_n": 40, "max_n": 120, "min_p": 30, "max_p": 80, "min_k": 0, "max_k": 40, "soils": ["Sandy", "Red", "Loamy"], "crops": ["Banana", "Grapes", "Sugarcane", "Rice", "Cotton"]}
]

def generate_fertilizer_prediction_csv():
    target_path = os.path.join(BASE_DATA_DIR, "fertilizer_prediction", "fertilizer_prediction.csv")
    random.seed(42)
    rows = []
    headers = ["Temparature", "Humidity", "Moisture", "Soil Type", "Crop Type", "Nitrogen", "Potassium", "Phosphorous", "Fertilizer Name"]

    for rule in FERTILIZER_RULES:
        for _ in range(60):
            temp = random.randint(22, 38)
            humidity = random.randint(45, 85)
            moisture = random.randint(25, 65)
            soil = random.choice(rule["soils"])
            crop = random.choice(rule["crops"])
            n = random.randint(rule["min_n"], rule["max_n"])
            p = random.randint(rule["min_p"], rule["max_p"])
            k = random.randint(rule["min_k"], rule["max_k"])
            rows.append([temp, humidity, moisture, soil, crop, n, k, p, rule["name"]])

    with open(target_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    print(f"Generated Fertilizer Prediction Dataset at {target_path} ({len(rows)} records).")


# ---------------------------------------------------------
# DATASET 3: Southern Indian Soil Nutrient Dataset
# Expected fields: State, District, Nitrogen, Phosphorus, Potassium, pH, Soil_Type
# ---------------------------------------------------------
DISTRICT_DATA = [
    # Andhra Pradesh
    ("Andhra Pradesh", "Kakinada", 145.0, 18.5, 160.0, 7.1, "Alluvial / Coastal Delta"),
    ("Andhra Pradesh", "Guntur", 160.0, 22.0, 180.0, 7.4, "Black Cotton Soil"),
    ("Andhra Pradesh", "Kurnool", 125.0, 14.0, 130.0, 7.8, "Red & Black Saline"),
    ("Andhra Pradesh", "Anantapur", 110.0, 12.0, 115.0, 8.1, "Red Sandy Arid"),
    ("Andhra Pradesh", "Visakhapatnam", 140.0, 19.0, 155.0, 6.8, "Laterite & Coastal Sand"),
    ("Andhra Pradesh", "Chittoor", 130.0, 15.0, 140.0, 7.3, "Red Loamy Soil"),
    ("Andhra Pradesh", "East Godavari", 150.0, 20.0, 170.0, 6.9, "Alluvial Delta"),
    ("Andhra Pradesh", "West Godavari", 155.0, 21.0, 175.0, 7.0, "Alluvial Delta"),
    ("Andhra Pradesh", "Krishna", 152.0, 20.5, 168.0, 7.2, "Black & Alluvial"),
    ("Andhra Pradesh", "Prakasam", 128.0, 14.5, 138.0, 7.6, "Red Loam"),
    ("Andhra Pradesh", "Nellore", 138.0, 17.0, 150.0, 7.2, "Coastal Sandy Clay"),

    # Telangana
    ("Telangana", "Warangal", 135.0, 16.0, 140.0, 6.8, "Red Sandy Loam (Chalka)"),
    ("Telangana", "Hyderabad", 130.0, 15.0, 135.0, 7.0, "Red Sandy Loam"),
    ("Telangana", "Khammam", 142.0, 18.0, 150.0, 6.9, "Black & Red Loam"),
    ("Telangana", "Karimnagar", 138.0, 17.5, 145.0, 7.1, "Black Cotton & Red"),
    ("Telangana", "Nalgonda", 122.0, 13.5, 128.0, 7.5, "Red Chalkas"),
    ("Telangana", "Nizamabad", 140.0, 19.0, 152.0, 6.7, "Black Cotton Soil"),
    ("Telangana", "Mahabubnagar", 118.0, 12.0, 120.0, 7.7, "Red Sandy"),

    # Tamil Nadu
    ("Tamil Nadu", "Coimbatore", 150.0, 20.0, 190.0, 6.5, "Red Loam / Clay"),
    ("Tamil Nadu", "Madurai", 130.0, 15.0, 140.0, 7.0, "Black Soil"),
    ("Tamil Nadu", "Thanjavur", 158.0, 23.0, 175.0, 6.7, "Alluvial Cauvery Delta"),
    ("Tamil Nadu", "Salem", 142.0, 17.5, 162.0, 6.8, "Red Soil"),
    ("Tamil Nadu", "Tiruchirappalli", 136.0, 16.0, 148.0, 7.1, "Alluvial & Red"),
    ("Tamil Nadu", "Chennai", 125.0, 14.0, 130.0, 7.4, "Coastal Sandy Clay"),
    ("Tamil Nadu", "Tirunelveli", 132.0, 15.5, 145.0, 7.2, "Black & Red Sandy"),

    # Karnataka
    ("Karnataka", "Mysuru", 155.0, 24.0, 175.0, 6.4, "Red Sandy Loam"),
    ("Karnataka", "Mandya", 150.0, 22.0, 170.0, 6.5, "Red Loam (Sugarcane Belt)"),
    ("Karnataka", "Belagavi", 148.0, 21.0, 165.0, 6.8, "Black & Laterite"),
    ("Karnataka", "Dharwad", 145.0, 20.0, 160.0, 7.0, "Black Soil"),
    ("Karnataka", "Bellary", 120.0, 13.0, 125.0, 7.9, "Black Saline"),
    ("Karnataka", "Bengaluru Rural", 140.0, 18.0, 155.0, 6.6, "Red Loamy"),

    # Kerala
    ("Kerala", "Palakkad", 165.0, 28.0, 130.0, 5.5, "Acidic Laterite / Alluvial"),
    ("Kerala", "Wayanad", 170.0, 30.0, 125.0, 5.2, "Acidic High Range Forest Loam"),
    ("Kerala", "Idukki", 175.0, 32.0, 120.0, 5.1, "Acidic Hill Soil"),
    ("Kerala", "Alappuzha", 155.0, 25.0, 115.0, 5.4, "Kari / Peaty Acidic Coastal")
]

def generate_southern_indian_soil_csv():
    target_path = os.path.join(BASE_DATA_DIR, "soil_nutrients", "southern_indian_soil_nutrients.csv")
    random.seed(42)
    rows = []
    headers = ["State", "District", "Nitrogen", "Phosphorus", "Potassium", "pH", "Soil_Type"]

    for state, district, avg_n, avg_p, avg_k, avg_ph, soil_type in DISTRICT_DATA:
        # Generate 20 local soil test samples per district around the verified district mean
        for _ in range(20):
            n = round(avg_n + random.uniform(-10, 10), 1)
            p = round(avg_p + random.uniform(-3, 3), 1)
            k = round(avg_k + random.uniform(-15, 15), 1)
            ph = round(avg_ph + random.uniform(-0.3, 0.3), 2)
            rows.append([state, district, n, p, k, ph, soil_type])

    with open(target_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    print(f"Generated Southern Indian Soil Nutrient Dataset at {target_path} ({len(rows)} records).")


if __name__ == "__main__":
    generate_crop_recommendation_csv()
    generate_fertilizer_prediction_csv()
    generate_southern_indian_soil_csv()
