import re

path = r"D:\jxgj\教学工具箱.html"
html = open(path, encoding="utf-8").read()

# 提取主 <style> 块（第一个）
m = re.search(r"<style>(.*?)</style>", html, re.S)
style = m.group(1)
opens = style.count("{")
closes = style.count("}")
balance_ok = opens == closes

# 检查 .tool-icon 块内是否还含 background
icon_match = re.search(r"\.tool-icon\s*\{([^}]*)\}", html)
icon_block = icon_match.group(1) if icon_match else ""
has_bg = "background" in icon_block

lines = []
lines.append(f"style_braces_open={opens} close={closes} balance_ok={balance_ok}")
lines.append(f"tool_icon_has_background={has_bg}")
lines.append(f"tool_icon_block={icon_block.strip()}")

with open(r"D:\jxgj\_css_out7.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

# 退出码：平衡且无背景 -> 0
import sys
sys.exit(0 if (balance_ok and not has_bg) else 1)
