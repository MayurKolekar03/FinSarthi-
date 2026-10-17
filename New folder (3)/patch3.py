src = open('research_evaluation.py', 'r', encoding='utf-8').read()

# Fix: use to_numpy() to avoid PyArrow Arrow array issues with sklearn
src = src.replace(
    'X = df["text"].values',
    'X = df["text"].astype(str).to_numpy()'
)
src = src.replace(
    'y = df["label_enc"].values',
    'y = df["label_enc"].to_numpy(dtype=int)'
)

open('research_evaluation.py', 'w', encoding='utf-8').write(src)
print("Patched .values -> .to_numpy()")

# Verify both replacements happened
if 'astype(str).to_numpy()' in src and 'to_numpy(dtype=int)' in src:
    print("Both patches confirmed in file.")
else:
    print("WARNING: patch may not have applied!")
