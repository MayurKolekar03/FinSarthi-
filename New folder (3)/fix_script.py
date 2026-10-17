src = open('research_evaluation.py', 'r', encoding='utf-8').read()
lines = src.split('\n')
# Find and fix line 70 (index 69)
for i, line in enumerate(lines):
    if 'Loaded' in line and 'CLASS_NAMES' in line and not line.rstrip().endswith(')'):
        lines[i] = 'print(f"[1/6] Loaded " + str(len(df)) + " rows | " + str(len(CLASS_NAMES)) + " classes: " + str(CLASS_NAMES))'
        print(f"Fixed line {i+1}: {lines[i]}")
        break
open('research_evaluation.py', 'w', encoding='utf-8').write('\n'.join(lines))
print("Done.")
