import os
import numpy as np
from PIL import Image, ImageDraw

DATASET_DIR = os.path.join(os.path.dirname(__file__), "dataset4_images")
CLASSES = ["bacterial_leaf_blight", "brown_spot_blast", "leaf_smut_rust", "powdery_mildew", "healthy_crop"]


def generate_representative_leaf_dataset(samples_per_class=50):
    """
    Generates representative crop leaf images for the 5 Kaggle Dataset 4 classes (250 total images):
    1. bacterial_leaf_blight (yellowish-brown leaf margin lesions & streaks)
    2. brown_spot_blast (spindle-shaped diamond spots with grey centers)
    3. leaf_smut_rust (small reddish-brown pustules and dark spots)
    4. powdery_mildew (white powdery fungal patches on green foliage)
    5. healthy_crop (vibrant uniform green foliage)
    """
    os.makedirs(DATASET_DIR, exist_ok=True)
    np.random.seed(42)

    for c_idx, class_name in enumerate(CLASSES):
        class_dir = os.path.join(DATASET_DIR, class_name)
        os.makedirs(class_dir, exist_ok=True)

        for i in range(samples_per_class):
            # Base leaf image (green canvas with subtle variation)
            g_val = np.random.randint(100, 150)
            img = Image.new("RGB", (224, 224), color=(30, g_val, 60))
            draw = ImageDraw.Draw(img)

            # Draw leaf vein structure with slight variations
            draw.line([(112, 0), (112, 224)], fill=(20, 80, 40), width=4)
            draw.line([(112, 50), (40, 20)], fill=(20, 80, 40), width=2)
            draw.line([(112, 112), (180, 80)], fill=(20, 80, 40), width=2)
            draw.line([(112, 170), (30, 140)], fill=(20, 80, 40), width=2)

            # Class-specific visual features
            if class_name == "bacterial_leaf_blight":
                # Yellowish-white bacterial margin streaks along leaf edges
                w_margin = np.random.randint(30, 50)
                draw.rectangle([(0, 0), (w_margin, 224)], fill=(210, 180, 60))
                draw.rectangle([(224 - w_margin, 0), (224, 224)], fill=(210, 180, 60))
                draw.polygon([(0, 40), (60, 80), (0, 120)], fill=(160, 120, 30))

            elif class_name == "brown_spot_blast":
                # Diamond / oval spindle brown blast spots with grey centers
                num_spots = np.random.randint(5, 10)
                for _ in range(num_spots):
                    cx = np.random.randint(30, 190)
                    cy = np.random.randint(30, 190)
                    draw.ellipse([cx-15, cy-8, cx+15, cy+8], fill=(120, 40, 20))
                    draw.ellipse([cx-7, cy-4, cx+7, cy+4], fill=(180, 180, 180))

            elif class_name == "leaf_smut_rust":
                # Dark reddish-black rust pustules scattered on leaf surface
                num_pustules = np.random.randint(12, 20)
                for _ in range(num_pustules):
                    cx = np.random.randint(25, 195)
                    cy = np.random.randint(25, 195)
                    draw.ellipse([cx-5, cy-5, cx+5, cy+5], fill=(150, 30, 10))
                    draw.ellipse([cx-2, cy-2, cx+2, cy+2], fill=(20, 10, 5))

            elif class_name == "powdery_mildew":
                # White/grey flour-like powdery mildew patches
                num_patches = np.random.randint(4, 8)
                for _ in range(num_patches):
                    cx = np.random.randint(30, 190)
                    cy = np.random.randint(30, 190)
                    r = np.random.randint(20, 30)
                    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(235, 235, 230))
                    draw.ellipse([cx-r//2, cy-r//2, cx+r//2, cy+r//2], fill=(210, 210, 205))

            elif class_name == "healthy_crop":
                # Vibrant uniform green leaf without lesions
                draw.rectangle([(0, 0), (224, 224)], fill=(34, 139, 34))
                draw.line([(112, 0), (112, 224)], fill=(20, 100, 30), width=3)
                draw.line([(112, 60), (40, 30)], fill=(20, 100, 30), width=2)
                draw.line([(112, 140), (185, 110)], fill=(20, 100, 30), width=2)

            file_path = os.path.join(class_dir, f"leaf_{i+1:03d}.jpg")
            img.save(file_path, "JPEG")

    print(f"Generated {samples_per_class * len(CLASSES)} representative leaf images across {len(CLASSES)} classes in {DATASET_DIR}")


if __name__ == "__main__":
    generate_representative_leaf_dataset(samples_per_class=50)
