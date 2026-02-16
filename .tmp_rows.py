from pathlib import Path
import re
text = Path("utils/constants.js").read_text(encoding="utf-8")
btn_block = re.search(r"export const btnList = \[(.*)\n\];", text, re.S)
if btn_block:
    content = btn_block.group(1)
    for idx,row_match in enumerate(re.finditer(r"\[(.*?)\]", content, re.S)):
        row_text = row_match.group(1)
        if idx>5:
            break
        print('ROW', idx)
        print(row_text.split("',")[:5])
