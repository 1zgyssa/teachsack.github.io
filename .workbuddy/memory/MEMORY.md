# TeachSack 官网（teachsack.github.io）项目长期笔记

## 技术架构
- **部署形态**：GitHub Pages 单文件 `index.html`（根目录），自定义域名 `teachsack.cn`（CNAME）。
- **背景方案（已定稿）**：Vite 单文件打包 `@shadergradient/react` 真·组件，three.js + shader 全部构建时内联，**运行时零 CDN/零网络请求**（用 `control="props"` 直传配置，组件代码无 `fetch()`）。彻底规避早期 esm.sh 境外 CDN 被墙问题。
- **工程目录**：`app/` 为 Vite 源码工程（package.json / vite.config.js / index.html / src/main.jsx）；`npm run build` 用 `vite-plugin-singlefile` 产出 `app/dist/index.html`，`npm run deploy` 复制至根 `index.html`。

## 关键文件
- `app/src/main.jsx`：背景 ShaderGradient 全部参数入口（配色 `color1/2/3`、形态 `type`、流速 `uSpeed` 等）。当前定稿：`type="waterPlane"` + 水蓝配色 `#80d4e6/#0092b3/#effbff` + `grain="off"` + `uSpeed=0.4`。
- `app/index.html`：站点全部 HTML/CSS/JS 源码（背景 CSS 在 ~95 行 `#shader-bg`；区块背景在 ~340-1290 行）。
- `serve.py`：零依赖本地预览（`python serve.py`，用 `http://localhost:8000` 看，避免 `file://` 白屏）。

## 设计约束（用户已确认满意，勿随意改动）
- 全站动态水波背景贯穿（body / 各 section 均为 `transparent`，仅卡片保留半透明面板）。
- 顶部导航栏透明；hero「免费下载」为文字链接风格（去框去底）。
- 调性：冷白 + 珊瑚克制，圆体展示字（Google Fonts 已移除，回退系统字体栈）。

## 部署流程（每次改背景/样式后）
1. `cd app && npm run deploy`（构建+复制单文件到根 index.html）
2. `git add index.html app && git commit -m "..."`
3. `git push origin main`（GitHub Pages 约 1 分钟缓存生效）
4. 用户侧需 `Ctrl+Shift+R` 硬刷新。

## 易踩坑（已验证）
- 本地双击 `file://` 打开会因 WebGL 安全限制白屏 → 必须用 `http://localhost` 或线上。
- `app/index.html` 改完必须重新 `npm run deploy`，否则根 `index.html` 不更新。
- git 偶发 `git add` 未暂存但 commit 已创建（本地领先 origin 1）→ 直接 `git push origin main` 即可。
- 配色/类型修改只动 `main.jsx`；区块透明/边框修改只动 `app/index.html` 的 CSS。
