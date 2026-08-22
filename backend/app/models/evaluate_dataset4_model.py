import os
import sys
import logging
from collections import defaultdict
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "knowledge_base", "dataset4_images")
WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "weights")
MODEL_PATH = os.path.join(WEIGHTS_DIR, "crop_disease_mobilenet.pth")

CLASSES = ["bacterial_leaf_blight", "brown_spot_blast", "leaf_smut_rust", "powdery_mildew", "healthy_crop"]
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}


class CustomLeafDataset(Dataset):
    def __init__(self, file_paths, labels, transform=None):
        self.file_paths = file_paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.file_paths)

    def __getitem__(self, idx):
        img_path = self.file_paths[idx]
        image = Image.open(img_path).convert("RGB")
        label = self.labels[idx]

        if self.transform:
            image = self.transform(image)

        return image, label


class CropDiseaseClassifier(nn.Module):
    def __init__(self, num_classes=5, pretrained=True):
        super(CropDiseaseClassifier, self).__init__()
        weights = models.MobileNet_V2_Weights.DEFAULT if pretrained else None
        self.backbone = models.mobilenet_v2(weights=weights)
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.2),
            nn.Linear(in_features, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)


def stratified_dataset_split(dataset_dir, train_ratio=0.70, val_ratio=0.15, seed=42):
    """
    Performs clean stratified split ensuring equal class proportions across Train, Val, and Test.
    """
    np.random.seed(seed)
    class_files = defaultdict(list)

    for c_name in CLASSES:
        c_dir = os.path.join(dataset_dir, c_name)
        if not os.path.exists(c_dir):
            continue
        files = [os.path.join(c_dir, f) for f in os.listdir(c_dir) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
        np.random.shuffle(files)
        class_files[c_name] = files

    train_paths, val_paths, test_paths = [], [], []
    train_labels, val_labels, test_labels = [], [], []

    for c_name, files in class_files.items():
        n = len(files)
        n_train = int(train_ratio * n)
        n_val = int(val_ratio * n)

        t_files = files[:n_train]
        v_files = files[n_train:n_train+n_val]
        ts_files = files[n_train+n_val:]

        c_idx = CLASS_TO_IDX[c_name]

        train_paths.extend(t_files)
        train_labels.extend([c_idx] * len(t_files))

        val_paths.extend(v_files)
        val_labels.extend([c_idx] * len(v_files))

        test_paths.extend(ts_files)
        test_labels.extend([c_idx] * len(ts_files))

    return (train_paths, train_labels), (val_paths, val_labels), (test_paths, test_labels)


def compute_metrics(y_true, y_pred, num_classes=5):
    """Computes overall accuracy, macro & per-class Precision, Recall, F1-score, and 5x5 Confusion Matrix."""
    cm = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        cm[t][p] += 1

    per_class_precision = {}
    per_class_recall = {}
    per_class_f1 = {}

    for i in range(num_classes):
        tp = cm[i][i]
        fp = sum(cm[j][i] for j in range(num_classes) if j != i)
        fn = sum(cm[i][j] for j in range(num_classes) if j != i)

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        class_name = CLASSES[i]
        per_class_precision[class_name] = round(prec, 4)
        per_class_recall[class_name] = round(rec, 4)
        per_class_f1[class_name] = round(f1, 4)

    macro_precision = round(float(np.mean(list(per_class_precision.values()))), 4)
    macro_recall = round(float(np.mean(list(per_class_recall.values()))), 4)
    macro_f1 = round(float(np.mean(list(per_class_f1.values()))), 4)

    return {
        "macro_precision": macro_precision,
        "macro_recall": macro_recall,
        "macro_f1_score": macro_f1,
        "per_class_precision": per_class_precision,
        "per_class_recall": per_class_recall,
        "per_class_f1_score": per_class_f1,
        "confusion_matrix": cm.tolist()
    }


def train_and_evaluate_dataset4(epochs=8):
    """
    Executes fine-tuning and evaluation using a Stratified 70% Train / 15% Val / 15% Unseen Test split.
    Evaluates strictly on unseen Test images and outputs empirical metrics.
    """
    torch.manual_seed(42)
    np.random.seed(42)
    os.makedirs(WEIGHTS_DIR, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Stratified Split
    (tr_p, tr_l), (va_p, va_l), (ts_p, ts_l) = stratified_dataset_split(DATASET_DIR, train_ratio=0.70, val_ratio=0.15, seed=42)
    total_images = len(tr_p) + len(va_p) + len(ts_p)

    logger.info(f"Total Dataset 4 Images: {total_images} (50 per class)")
    logger.info(f"Stratified Split: Train={len(tr_p)} (35/class), Val={len(va_p)} (7-8/class), Unseen Test={len(ts_p)} (7-8/class)")

    # Transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_ds = CustomLeafDataset(tr_p, tr_l, transform=train_transform)
    val_ds = CustomLeafDataset(va_p, va_l, transform=eval_transform)
    test_ds = CustomLeafDataset(ts_p, ts_l, transform=eval_transform)

    train_loader = DataLoader(train_ds, batch_size=8, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=8, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=8, shuffle=False)

    # Model & Optimization
    model = CropDiseaseClassifier(num_classes=len(CLASSES), pretrained=True).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.0005)

    # Training Loop
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        train_correct = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            preds = torch.argmax(outputs, dim=1)
            train_correct += (preds == labels).sum().item()

        epoch_train_acc = train_correct / len(train_ds)

        # Validation Loop
        model.eval()
        val_correct = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                preds = torch.argmax(outputs, dim=1)
                val_correct += (preds == labels).sum().item()

        epoch_val_acc = val_correct / len(val_ds)
        logger.info(f"Epoch [{epoch+1}/{epochs}] Train Loss: {train_loss/len(train_ds):.4f} | Train Acc: {epoch_train_acc*100:.1f}% | Val Acc: {epoch_val_acc*100:.1f}%")

    # Save fine-tuned model weights
    torch.save(model.state_dict(), MODEL_PATH)
    logger.info(f"Saved fine-tuned PyTorch MobileNetV2 weights to: {MODEL_PATH}")

    # Empirical Testing on UNSEEN TEST SET (38 images)
    model.eval()
    test_correct = 0
    all_targets = []
    all_preds = []

    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            preds = torch.argmax(outputs, dim=1)
            test_correct += (preds == labels).sum().item()

            all_targets.extend(labels.cpu().numpy().tolist())
            all_preds.extend(preds.cpu().numpy().tolist())

    empirical_test_acc = round(test_correct / len(test_ds), 4)
    metrics_summary = compute_metrics(all_targets, all_preds, num_classes=len(CLASSES))

    results = {
        "total_dataset_images": total_images,
        "samples_per_class": total_images // len(CLASSES),
        "train_set_size": len(train_ds),
        "val_set_size": len(val_ds),
        "unseen_test_set_size": len(test_ds),
        "train_accuracy": round(epoch_train_acc, 4),
        "val_accuracy": round(epoch_val_acc, 4),
        "test_accuracy": empirical_test_acc,
        "macro_precision": metrics_summary["macro_precision"],
        "macro_recall": metrics_summary["macro_recall"],
        "macro_f1_score": metrics_summary["macro_f1_score"],
        "per_class_precision": metrics_summary["per_class_precision"],
        "per_class_recall": metrics_summary["per_class_recall"],
        "per_class_f1_score": metrics_summary["per_class_f1_score"],
        "confusion_matrix": metrics_summary["confusion_matrix"],
        "model_architecture": "MobileNetV2 (PyTorch Transfer Learning)",
        "class_mapping": CLASS_TO_IDX
    }

    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    res = train_and_evaluate_dataset4(epochs=8)
    print("\n==================================================")
    print("   STRATIFIED DATASET 4 EVALUATION AUDIT REPORT")
    print("==================================================")
    print(f"Total Dataset Images  : {res['total_dataset_images']} (50 per class)")
    print(f"Stratified Split      : Train={res['train_set_size']}, Val={res['val_set_size']}, Unseen Test={res['unseen_test_set_size']}")
    print(f"Training Accuracy     : {res['train_accuracy'] * 100:.1f}%")
    print(f"Validation Accuracy   : {res['val_accuracy'] * 100:.1f}%")
    print(f"Test Accuracy (Unseen): {res['test_accuracy'] * 100:.1f}% ({res['unseen_test_set_size']} unseen images)")
    print(f"Macro Precision       : {res['macro_precision']}")
    print(f"Macro Recall          : {res['macro_recall']}")
    print(f"Macro F1-Score        : {res['macro_f1_score']}")
    print("\n--- PER-CLASS PRECISION ---")
    for k, v in res['per_class_precision'].items():
        print(f"  {k:25s}: {v}")
    print("\n--- PER-CLASS RECALL ---")
    for k, v in res['per_class_recall'].items():
        print(f"  {k:25s}: {v}")
    print("\n--- PER-CLASS F1-SCORE ---")
    for k, v in res['per_class_f1_score'].items():
        print(f"  {k:25s}: {v}")
    print("\n--- 5x5 CONFUSION MATRIX ---")
    print(np.array(res['confusion_matrix']))
