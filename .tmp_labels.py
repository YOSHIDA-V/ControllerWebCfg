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
for idx,name in enumerate(labels):
    print(idx,name)
