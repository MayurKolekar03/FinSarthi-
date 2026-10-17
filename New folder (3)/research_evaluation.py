"""
research_evaluation.py
======================
Research-grade evaluation pipeline for SetFit transaction categorisation.

Outputs (./results/)
-------
  classification_report.txt  -- per-class P / R / F1
  cv_summary.txt             -- 5-fold CV mean +- std
  model_comparison.txt       -- SetFit vs TF-IDF baselines
  confusion_matrix_setfit.png
  confusion_matrix_baselines.png
"""

import os, re, random, warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, f1_score)
from datasets import Dataset
from setfit import SetFitModel, Trainer, TrainingArguments

warnings.filterwarnings("ignore")
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.makedirs("results", exist_ok=True)

RANDOM_STATE = 42
random.seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)

# ============================================================
# 1. LOAD DATA
# ============================================================
print("=" * 60)
print("  RESEARCH-GRADE EVALUATION PIPELINE")
print("  SetFit Transaction Categorisation")
print("=" * 60)

csv_path = ("dataset.csv" if os.path.exists("dataset.csv")
            else "financial_transaction_train (2).csv")
df = pd.read_csv(csv_path)
df.columns = [c.strip() for c in df.columns]
rename_map = {}
for col in df.columns:
    if col.lower() in ("transaction_text", "text"):
        rename_map[col] = "text"
    elif col.lower() in ("label", "category"):
        rename_map[col] = "label"
df.rename(columns=rename_map, inplace=True)
df = df[["text", "label"]].dropna().reset_index(drop=True)

parts = []
for lbl in df["label"].unique():
    g = df[df["label"] == lbl]
    parts.append(g.sample(min(1500, len(g)), random_state=RANDOM_STATE))
df = pd.concat(parts, ignore_index=True)[["text", "label"]]

le = LabelEncoder()
df["label_enc"] = le.fit_transform(df["label"])
CLASS_NAMES = list(le.classes_)
print(f"\n[1/6] Loaded {len(df)} rows | {len(CLASS_NAMES)} classes: {CLASS_NAMES}")

# ============================================================
# 2. REALISTIC TEXT PERTURBATION
# ============================================================
MERCHANT_ABBREVS = {
    "Swiggy":         ["SWGY", "SWG", "SWIGGY-Q"],
    "Zomato":         ["ZMT", "ZOMATO-D", "ZOM"],
    "Dominos":        ["DOM-PIZZA", "DOMINOS*"],
    "McDonald":       ["MCD", "MCDNLDS"],
    "Grocery":        ["GROC", "SUPERMART"],
    "Restaurant":     ["REST", "DINE"],
    "Ola":            ["OLA-CAB", "OLAxRIDE"],
    "IndiGo":         ["6E", "INDIGO-AIR"],
    "MakeMyTrip":     ["MMT", "MAKEMYTRIP*"],
    "RedBus":         ["RDBS", "REDBUS*"],
    "Petrol":         ["PETROL-PMP", "FUEL"],
    "Flipkart":       ["FK", "FLIPKART*", "FLK"],
    "Amazon":         ["AMZN", "AMZ*"],
    "IKEA":           ["IKEA-STR"],
    "Reliance":       ["RIL-DIG", "RLNC"],
    "Zerodha":        ["ZRDHA", "ZRD"],
    "Groww":          ["GRWW", "GRW-INV"],
    "PPF":            ["PPF-CONTRIB"],
    "SIP":            ["SIP-MF"],
    "Fixed deposit":  ["FD", "FIXD-DEP"],
    "mutual fund":    ["MF", "MUTUALFUND"],
    "ETF":            ["ETF-INV"],
    "loan":           ["LN", "LOAN-EMI"],
    "EMI":            ["EMI-DED", "EQI"],
    "credit card":    ["CC", "CCARD"],
    "transfer":       ["TRF", "XFER"],
    "sent to":        ["TO"],
}

UPI_PREFIXES  = ["UPI/DR/{ref}/", "UPI-{mer}-{ref}@ok", "UPIDR{ref}"]
NEFT_PREFIXES = ["NEFT/{ref}/", "NEFT CR-{ref}"]
POS_PREFIXES  = ["POS {ref}*", "POS/{ref}/"]

def _rref():
    return str(random.randint(100000, 999999))

def perturb(text, noise_prob=0.70):
    if random.random() > noise_prob:
        return text
    for merchant, abbrevs in MERCHANT_ABBREVS.items():
        if merchant.lower() in text.lower():
            abbr = random.choice(abbrevs)
            text = re.sub(re.escape(merchant), abbr, text, flags=re.IGNORECASE)
    text = re.sub(r"\s*\|.*$", "", text).strip()
    style = random.choice(["upi", "neft", "pos", "raw"])
    ref   = _rref()
    mer   = text.split()[0] if text.split() else "TXN"
    if style == "upi":
        text = random.choice(UPI_PREFIXES).format(ref=ref, mer=mer) + text
    elif style == "neft":
        text = random.choice(NEFT_PREFIXES).format(ref=ref) + " " + text
    elif style == "pos":
        text = random.choice(POS_PREFIXES).format(ref=ref) + text
    if random.random() < 0.3:
        text = text.upper()
    return text

print("[2/6] Applying realistic text perturbations ...")
df["text"] = df["text"].apply(perturb)
print("   Sample perturbations:")
for _, row in df.sample(3, random_state=1).iterrows():
    print(f"   [{row['label']}] {row['text'][:80]}")

# ============================================================
# 3. TRAIN / TEST SPLIT
# ============================================================
print("\n[3/6] 80/20 stratified split ...")
X = df["text"].astype(str).to_numpy()
y = df["label_enc"].to_numpy(dtype=int)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y)
print(f"   Train: {len(X_train)} | Test: {len(X_test)}")

# ============================================================
# 4. BASELINES
# ============================================================
print("\n[4/6] Training baselines ...")
baselines = {
    "TF-IDF + Logistic Regression": Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1,2), max_features=30000, sublinear_tf=True)),
        ("clf",   LogisticRegression(max_iter=1000, C=5, random_state=RANDOM_STATE)),
    ]),
    "TF-IDF + Linear SVM": Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1,2), max_features=30000, sublinear_tf=True)),
        ("clf",   LinearSVC(max_iter=2000, C=1, random_state=RANDOM_STATE)),
    ]),
}
baseline_results = {}
for name, pipe in baselines.items():
    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)
    acc   = accuracy_score(y_test, preds)
    f1    = f1_score(y_test, preds, average="weighted")
    baseline_results[name] = {"accuracy": acc, "f1_weighted": f1, "preds": preds}
    print(f"   {name}: Acc={acc:.4f}  F1={f1:.4f}")

# ============================================================
# 5. SETFIT 5-FOLD CV
# ============================================================
print("\n[5/6] SetFit 5-fold stratified CV ...")
print("   (ETA: ~15-20 min on CPU)")

N_SHOT  = 16
N_FOLDS = 5
skf     = StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=RANDOM_STATE)

cv_accuracies, cv_f1s = [], []
all_true, all_pred    = [], []

for fold, (tr_idx, val_idx) in enumerate(skf.split(X, y), 1):
    print(f"\n   -- Fold {fold}/{N_FOLDS} --")
    X_tr, X_val = X[tr_idx], X[val_idx]
    y_tr, y_val = y[tr_idx], y[val_idx]

    few_parts = []
    for lbl in np.unique(y_tr):
        idxs   = np.where(y_tr == lbl)[0]
        chosen = np.random.choice(idxs, min(N_SHOT, len(idxs)), replace=False)
        few_parts.append(pd.DataFrame({"text": X_tr[chosen], "label": y_tr[chosen]}))
    few_df = pd.concat(few_parts, ignore_index=True)

    train_ds = Dataset.from_pandas(few_df)
    val_ds   = Dataset.from_pandas(pd.DataFrame({"text": X_val, "label": y_val}))

    model = SetFitModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
    args  = TrainingArguments(
        batch_size=8, num_epochs=2, num_iterations=20,
        output_dir=f"./results/fold_{fold}", show_progress_bar=False)
    trainer = Trainer(
        model=model, args=args,
        train_dataset=train_ds, eval_dataset=val_ds,
        column_mapping={"text": "text", "label": "label"})
    trainer.train()

    preds = np.array(model.predict(X_val.tolist()))
    acc   = accuracy_score(y_val, preds)
    f1    = f1_score(y_val, preds, average="weighted")
    cv_accuracies.append(acc)
    cv_f1s.append(f1)
    all_true.extend(y_val.tolist())
    all_pred.extend(preds.tolist())
    print(f"   Fold {fold} -> Accuracy: {acc:.4f}  F1: {f1:.4f}")

setfit_acc    = np.mean(cv_accuracies)
setfit_acc_sd = np.std(cv_accuracies)
setfit_f1     = np.mean(cv_f1s)
setfit_f1_sd  = np.std(cv_f1s)
print(f"\n   SetFit CV Accuracy : {setfit_acc:.4f} +/- {setfit_acc_sd:.4f}")
print(f"   SetFit CV F1       : {setfit_f1:.4f} +/- {setfit_f1_sd:.4f}")

# ============================================================
# 6. SAVE RESULTS
# ============================================================
print("\n[6/6] Saving publication-ready results ...")

# 6a. CV Summary
cv_lines = [
    "5-FOLD CROSS-VALIDATION SUMMARY -- SetFit (all-MiniLM-L6-v2)",
    "="*60, ""]
for i,(a,f) in enumerate(zip(cv_accuracies, cv_f1s),1):
    cv_lines.append(f"  Fold {i}: Accuracy={a:.4f}  F1={f:.4f}")
cv_lines += ["","-"*60,
    f"  Mean Accuracy : {setfit_acc:.4f} +/- {setfit_acc_sd:.4f}",
    f"  Mean F1 (wtd) : {setfit_f1:.4f} +/- {setfit_f1_sd:.4f}"]
with open("results/cv_summary.txt", "w", encoding="utf-8") as fh:
    fh.write("\n".join(cv_lines))
print("   Saved: results/cv_summary.txt")

# 6b. Classification report
report = classification_report(all_true, all_pred,
                               target_names=CLASS_NAMES, digits=4)
with open("results/classification_report.txt", "w", encoding="utf-8") as fh:
    fh.write("SETFIT CLASSIFICATION REPORT (5-fold aggregated)\n")
    fh.write("="*60+"\n")
    fh.write(report)
print("   Saved: results/classification_report.txt")
print("\n" + report)

# 6c. Model comparison
comp = [
    "MODEL COMPARISON TABLE", "="*60, "",
    f"  {'Model':<35} {'Accuracy':>10}  {'F1 (wtd)':>10}",
    "  " + "-"*55]
for name, res in baseline_results.items():
    comp.append(f"  {name:<35} {res['accuracy']:>10.4f}  {res['f1_weighted']:>10.4f}")
comp.append(f"  {'SetFit (5-fold CV mean)':<35} {setfit_acc:>10.4f}  {setfit_f1:>10.4f}")
comp.append(f"  {'SetFit (5-fold CV std)':<35} {setfit_acc_sd:>10.4f}  {setfit_f1_sd:>10.4f}")
with open("results/model_comparison.txt", "w", encoding="utf-8") as fh:
    fh.write("\n".join(comp))
print("   Saved: results/model_comparison.txt")
print("\n" + "\n".join(comp))

# 6d. Confusion matrix -- SetFit
def plot_cm(y_true, y_pred, title, filepath, labels):
    cm   = confusion_matrix(y_true, y_pred)
    cm_n = cm.astype(float) / cm.sum(axis=1, keepdims=True)
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    for ax, data, fmt, sub in zip(axes, [cm, cm_n], ["d", ".2f"],
                                   ["Raw counts", "Normalised (row %)"]):
        sns.heatmap(data, annot=True, fmt=fmt, cmap="Blues",
                    xticklabels=labels, yticklabels=labels,
                    linewidths=0.5, ax=ax, annot_kws={"size": 9})
        ax.set_xlabel("Predicted label", fontsize=11)
        ax.set_ylabel("True label", fontsize=11)
        ax.set_title(sub, fontsize=11)
        ax.tick_params(axis="x", rotation=35, labelsize=8)
        ax.tick_params(axis="y", rotation=0,  labelsize=8)
    fig.suptitle(title, fontsize=14, fontweight="bold", y=1.01)
    plt.tight_layout()
    plt.savefig(filepath, dpi=180, bbox_inches="tight")
    plt.close()
    print(f"   Saved: {filepath}")

plot_cm(all_true, all_pred,
        "SetFit Confusion Matrix (5-fold CV, perturbed data)",
        "results/confusion_matrix_setfit.png", CLASS_NAMES)

# 6e. Baseline confusion matrices
fig, axes = plt.subplots(1, 2, figsize=(18, 7))
for ax, (name, res) in zip(axes, baseline_results.items()):
    cm_n = confusion_matrix(y_test, res["preds"]).astype(float)
    cm_n = cm_n / cm_n.sum(axis=1, keepdims=True)
    sns.heatmap(cm_n, annot=True, fmt=".2f", cmap="Oranges",
                xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES,
                linewidths=0.5, ax=ax, annot_kws={"size": 8})
    ax.set_title(name, fontsize=10, fontweight="bold")
    ax.set_xlabel("Predicted", fontsize=9)
    ax.set_ylabel("True", fontsize=9)
    ax.tick_params(axis="x", rotation=35, labelsize=7)
    ax.tick_params(axis="y", rotation=0,  labelsize=7)
fig.suptitle("Baseline Models -- Normalised Confusion Matrices", fontsize=13, fontweight="bold")
plt.tight_layout()
plt.savefig("results/confusion_matrix_baselines.png", dpi=180, bbox_inches="tight")
plt.close()
print("   Saved: results/confusion_matrix_baselines.png")

print("\n" + "="*60)
print("  FINAL RESULTS SUMMARY")
print("="*60)
for name, res in baseline_results.items():
    print(f"  {name}: Acc={res['accuracy']:.4f}  F1={res['f1_weighted']:.4f}")
print(f"  SetFit (CV mean +/- std):  Acc={setfit_acc:.4f}+/-{setfit_acc_sd:.4f}  F1={setfit_f1:.4f}+/-{setfit_f1_sd:.4f}")
print("="*60)
print("\nAll output files saved to ./results/")
print("Pipeline complete.")
