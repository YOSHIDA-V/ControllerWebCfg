from pathlib import Path
import re
text = Path("utils/constants.js").read_text(encoding="utf-8")
label_block = re.search(r"export const labelName = \[(.*?)\];", text, re.S)
labels=[]
if label_block:
    block=label_block.group(1)
    i=0
    n=len(block)
    while i<n:
        if block[i]=='"':
            j=i+1
            while j<n and block[j]!='"':
                j+=1
            labels.append(block[i+1:j])
            i=j+1
        else:
            i+=1
psx_idx = labels.index('PSX / PS2')
btn_block = re.search(r"export const btnList = \[(.*)\n\];", text, re.S)
psx_entries=[]
if btn_block:
    content = btn_block.group(1)
    for row_match in re.finditer(r"\[(.*?)\]", content, re.S):
        row_text = row_match.group(1)
        row_text = re.sub(r"//.*", "", row_text)
        tokens=[]
        i=0
        n=len(row_text)
        while i<n:
            if row_text[i]=="'":
                j=i+1
                while j<n and row_text[j]!="'":
                    j+=1
                tokens.append(row_text[i+1:j])
                i=j+1
            else:
                i+=1
        if psx_idx < len(tokens):
            psx_entries.append(tokens[psx_idx])
        else:
            psx_entries.append('')
print('rows', len(psx_entries))
print('non-empty', sum(1 for x in psx_entries if x))
for idx,name in enumerate(psx_entries):
    if name:
        print(f"{idx:03}: {name}")
