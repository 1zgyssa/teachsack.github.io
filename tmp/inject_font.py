import base64, pathlib

woff2 = pathlib.Path(r'C:\Users\35809\AppData\Local\Temp\zcool.woff2').read_bytes()
b64 = base64.b64encode(woff2).decode('ascii')
print('base64 len =', len(b64))

html_path = pathlib.Path(r'D:\jxgj\app\index.html')
html = html_path.read_text(encoding='utf-8')

style_tag = (
    '<style id="self-fonts">\n'
    "@font-face{font-family:'ZCOOL KuaiLe';"
    "src:url(data:font/woff2;base64," + b64 + ") format('woff2');"
    "font-weight:400;font-style:normal;font-display:swap;}\n"
    '</style>\n'
)

marker = '</head>'
assert marker in html, 'no </head> found'
if 'id="self-fonts"' in html:
    print('already injected, skip')
else:
    html = html.replace(marker, style_tag + marker, 1)
    html_path.write_text(html, encoding='utf-8')
    print('injected OK, new size =', len(html))
