src = open('research_evaluation.py', 'r', encoding='utf-8').read()

old = """df = (df.groupby("label", group_keys=False)
        .apply(lambda g: g.sample(min(1500, len(g)), random_state=RANDOM_STATE))
        .reset_index(drop=True))"""

new = """parts = []
for lbl in df["label"].unique():
    g = df[df["label"] == lbl]
    parts.append(g.sample(min(1500, len(g)), random_state=RANDOM_STATE))
df = pd.concat(parts, ignore_index=True)[["text", "label"]]"""

if old in src:
    src = src.replace(old, new)
    open('research_evaluation.py', 'w', encoding='utf-8').write(src)
    print("Patched groupby -> concat loop")
else:
    print("Pattern not found! Searching...")
    for i,line in enumerate(src.split('\n')):
        if 'groupby' in line:
            print(f"  Line {i+1}: {line}")
