import os
import warnings
warnings.filterwarnings("ignore")
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

import pandas as pd
from sklearn.model_selection import train_test_split
from datasets import Dataset
from setfit import SetFitModel, Trainer, TrainingArguments
from sklearn.preprocessing import LabelEncoder

# ──────────────────────────────────────────────
# 1. Load & clean dataset
# ──────────────────────────────────────────────
print("[1/6] Loading dataset...")
csv_path = "dataset.csv" if os.path.exists("dataset.csv") else "financial_transaction_train (2).csv"
df = pd.read_csv(csv_path)

# Normalise column names
df.columns = [c.strip() for c in df.columns]
rename_map = {}
for col in df.columns:
    if col.lower() in ("transaction_text", "text"):
        rename_map[col] = "text"
    elif col.lower() in ("label", "category"):
        rename_map[col] = "label"
df.rename(columns=rename_map, inplace=True)
df = df[["text", "label"]].dropna()
print(f"   Dataset loaded: {len(df)} rows, {df['label'].nunique()} unique labels")

# ──────────────────────────────────────────────
# 2. CRITICAL RAM FIX – sample to 2000 rows
# ──────────────────────────────────────────────
print("[2/6] Sampling 2000 rows for low-resource training...")
df = df.sample(n=2000, random_state=42).reset_index(drop=True)

# Encode labels to integers (SetFit requires integer labels)
le = LabelEncoder()
df["label"] = le.fit_transform(df["label"])
print(f"   Label classes: {list(le.classes_)}")

# ──────────────────────────────────────────────
# 3. 80/20 train-test split
# ──────────────────────────────────────────────
print("[3/6] Splitting data (80/20)...")
train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["label"])
print(f"   Full train: {len(train_df)} | Test: {len(test_df)}")

# ── FEW-SHOT SUBSAMPLE FOR SETFIT CONTRASTIVE PHASE ──────────────────────────
# SetFit is a few-shot framework. Using all 1600 samples generates millions of
# contrastive pairs. We sample 16 examples per class for the sentence-transformer
# fine-tuning phase — keeps step count to ~480 (completes in ~2 min on CPU).
N_SHOT = 16
few_shot_parts = []
for lbl in train_df["label"].unique():
    group = train_df[train_df["label"] == lbl]
    few_shot_parts.append(group.sample(min(N_SHOT, len(group)), random_state=42))
few_shot_df = pd.concat(few_shot_parts, ignore_index=True)[["text", "label"]]
print(f"   Few-shot contrastive subset: {len(few_shot_df)} samples ({N_SHOT}/class)")
print(f"   Few-shot columns: {few_shot_df.columns.tolist()}")

# ──────────────────────────────────────────────
# 4. Convert to HuggingFace Datasets
# ──────────────────────────────────────────────
print("[4/6] Converting to HuggingFace Dataset objects...")
train_dataset = Dataset.from_pandas(few_shot_df)    # few-shot for ST fine-tuning
test_dataset  = Dataset.from_pandas(test_df.reset_index(drop=True))

# ──────────────────────────────────────────────
# 5. Initialise SetFit model + training args
# ──────────────────────────────────────────────
print("[5/6] Initialising SetFit model (all-MiniLM-L6-v2)...")
model = SetFitModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")

args = TrainingArguments(
    batch_size=8,
    num_epochs=2,
    num_iterations=20,      # 20 pos/neg pairs per example × 96 samples = ~480 pairs
                            # Steps = (20 * 96 * 2) / 8 = 480 → ~2 min on CPU
    output_dir="./saved_setfit_model",
)

# ──────────────────────────────────────────────
# 6. Train, evaluate & save
# ──────────────────────────────────────────────
print("[6/6] Starting training...")
trainer = Trainer(
    model=model,
    args=args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    column_mapping={"text": "text", "label": "label"},
)
trainer.train()

print("\n Evaluating on test set...")
metrics = trainer.evaluate()
print("\n" + "="*50)
print("  FINAL EVALUATION RESULTS")
print("="*50)
for k, v in metrics.items():
    print(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")
print("="*50)

print("\n Saving model to ./saved_setfit_model ...")
model.save_pretrained("./saved_setfit_model")
print("Model saved successfully!")
print("\nTraining pipeline complete.")
