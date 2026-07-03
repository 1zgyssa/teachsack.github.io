# -*- coding: utf-8 -*-
import os

# 读取便携版 exe 并查找 asar 内容
with open(r'D:\桌面\教学工具箱_新版.exe.exe', 'rb') as f:
    data = f.read()

print(f'文件大小: {len(data)}')

# 查找 asar 标记
idx = data.find(b'app.asar')
print(f'app.asar 位置: {idx}')

# 查找 .html 文件 UTF-8 编码位置
html_name = '教学工具箱.html'.encode('utf-8')
idx2 = data.find(html_name)
print(f'教学工具箱.html 位置: {idx2}')

# 查找 asar 魔术字节 (4字节pickle大小 + 4字节header大小 + pickle)
# asar 文件以 pickle 格式的 header 开始
# 通过查找 __dirname = "app" 等特征字符串
features = [b'__proto__', b'files', b'default', b'package.json']
for feat in features:
    pos = data.rfind(feat, len(data) - 5000000)
    if pos > 0:
        print(f'特征 {feat} 在位置: {pos}')
        # 向前看
        # asar 头结构: <4字节pickle大小> <4字节header大小> <pickle header>
        # 向前查找 pickle 大小
        break
