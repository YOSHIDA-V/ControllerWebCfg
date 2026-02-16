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
content = text[text.index('export const btnList = [') + len('export const btnList = ['):]
# stop before closing ];
end = content.index('\n];')
content = content[:end]
rows=[]
in_row=False
in_string=False
string_buf=''
current=[]
in_block_comment=False
in_line_comment=False
i=0
while i<len(content):
    ch=content[i]
    nxt=content[i+1] if i+1<len(content) else ''
    if in_block_comment:
        if ch=='*' and nxt=='/':
            in_block_comment=False
            i+=2
            continue
        i+=1
        continue
    if in_line_comment:
        if ch=='\n':
            in_line_comment=False
        i+=1
        continue
    if not in_string:
        if ch=='/' and nxt=='*':
            in_block_comment=True
            i+=2
            continue
        if ch=='/' and nxt=='/':
            in_line_comment=True
            i+=2
            continue
    if in_row:
        if in_string:
            if ch=='\\' and nxt:
                string_buf+=nxt
                i+=2
                continue
            if ch=='\'' :
                current.append(string_buf)
                string_buf=''
                in_string=False
            else:
                string_buf+=ch
        else:
            if ch=='\'':
                in_string=True
            elif ch==']':
                rows.append(current)
                current=[]
                in_row=False
            else:
                pass
    else:
        if ch=='[':
            in_row=True
            current=[]
    i+=1
print('rows', len(rows))
psx_entries=[row[psx_idx] if psx_idx < len(row) else '' for row in rows]
print('non-empty', sum(1 for x in psx_entries if x))
for idx,name in enumerate(psx_entries):
    if name:
        print(f"{idx:03}: {name}")
