# TeachSack 后端架构说明与清理记录

> 修订日期：2026-07-11
> ⚠️ 修订说明：本文档最初写的是"把根 `server.js` 部署到云端、删除 `server-deploy/`"的方案。
> 但在实际核对代码后发现该方案**会搞挂线上支付**（原因见下方"重要更正"），
> 因此改为**保留两套、各司其职 + 清理残留**的正确方案。本文件现为准确版本。

---

## 一、先说结论：这两套其实不是重复，是各司其职

| 部分 | 文件 | 技术 | 干什么 | 给谁用 |
|---|---|---|---|---|
| **桌面端本地后端** | 根目录 `server.js` | Express + 本地文件 | 离线校验激活码（基于本地 `license-data.json`） | 打包进软件 `.exe` 里，跑在 `localhost:3000` |
| **云端后端（线上）** | `server-deploy/functions/` | Cloudflare Pages Functions + KV 绑定 `FEEDBACKS` | 收网站反馈、支付记录、管理员查看/清空 | 官网 `index.html`、管理后台 `admin.html` |

**为什么必须分开？**
- 桌面端要在**没网、没服务器**时也能校验激活码，所以激活逻辑必须打包在本地、用本地文件。
- 网站的反馈/支付需要**公网能访问、数据集中存**，所以用 Cloudflare 云端。
- 两者技术不同（Node 本地文件 vs Cloudflare 无硬盘的云函数），本就适合分开。

→ 所以"双后端"不是 bug，是正确架构。之前担心的"逻辑分叉"风险，实际上只有**云端那个 `validate.js` 是半成品**（写死 3 个测试码），已修复。

---

## 二、重要更正：原计划为什么不能做

最初计划"把 `server.js` 传上云端、删掉 `server-deploy/`"，执行前发现两个致命问题：

1. **`server.js`（Express + 本地文件）在 Cloudflare 云端跑不起来** —— 云端没有本地硬盘，`fs.readFileSync` 一启动就崩。
2. **`server-deploy/` 才是正在服役的云端后端**（`master.teachsack-api.pages.dev` 现在就靠它收支付）。删了它、又没成功部署替代，支付立刻中断。

→ 因此改为：**保留 `server-deploy/functions/` 作为云端后端，只清理里面的旧方案尸体。**

---

## 三、本次实际做了什么（安全、可恢复）

### 1. 修复云端半成品 `server-deploy/functions/api/validate.js`
- 原来：写死 3 个测试码（`8QW6UUL2D6QZ-P895` 等），任意别的码都报"不存在"。
- 现在：改成与桌面端 `server.js` **完全一致的格式校验算法**。
- 说明：云端只校验"格式是否合法"，真正的激活码库校验在桌面端本地完成（刻意不放到公网，避免安全风险）。

### 2. 清理 `server-deploy/` 里三套旧方案的残留（移到可恢复备份区）
`server-deploy/` 里混了 Vercel+MongoDB、`server.js` Node 服务、Cloudflare Pages Functions 三套方案的残骸。
已移动到 `D:\jxgj\_cleanup_backup\server-deploy_leftovers\`（**未真正删除，随时可还原**）：

| 移走的文件 | 它是什么 |
|---|---|
| `server.js`（根） | 旧 Node http 服务，写死测试码，版本 1.7.0，已废弃 |
| `api/` | Vercel 风格处理函数（配 `.vercel/`），已废弃 |
| `package.json` | 指向已废弃的 `server.js` |
| `DEPLOY.md` | 写"推荐 Vercel + MongoDB"，与实际（Cloudflare Pages）不符，已过时 |
| `DEPLOY_TIMESTAMP.md` / `REDEPLOY.md` | 自动生成的部署触发垃圾文件 |
| `.env.example` | 写 MongoDB 连接串，但云端实际用 KV，从未用到 |
| `.vercel/` | Vercel 部署缓存，废弃方案残留 |

### 3. `server-deploy/` 清理后剩下的（都是活跃项）
```
server-deploy/
├── functions/      ✅ 真正在跑的云端接口（Pages Functions）
│   └── api/
│       ├── validate.js   （已修复）
│       ├── feedback.js / feedbacks.js
│       ├── payment.js / payments.js / payment/status.js
│       ├── clear.js
│       └── health.js
├── wrangler.toml   ✅ Cloudflare 部署配置（KV 绑定 FEEDBACKS）
├── admin.html      ✅ 管理后台（指向云端地址）
├── .git/ .gitignore .wrangler/   （仓库与部署缓存，保留）
```

---

## 四、以后怎么更新云端后端（给你留的笔记）

当你想改云端接口并重新发布时，只需在 `server-deploy/` 目录下（需要你自己登录 Cloudflare）：

```bash
wrangler login          # 浏览器里登录你的 Cloudflare 账号（这一步只能你自己做）
wrangler pages deploy   # 把 functions/ 部署上去
```

部署后验证（返回的 kvEnabled 应为 true）：
```bash
curl https://master.teachsack-api.pages.dev/api/health
```

> 注意：我（AI）无法替你登录 Cloudflare，所以"按回车部署"这步只能你来。
> 平时不动云端时，什么都不用做，现在的状态已经能正常工作。

---

## 五、根目录 `server.js` 的状态
- 它是**桌面端本地后端**，打包进 `.exe`，跑在 `localhost:3000`，负责离线激活校验。
- 上一轮我给它补了反馈/支付/清空接口（写 Cloudflare KV 或本地回退），这是"以防将来想让桌面端也直连云端"的预留，**不影响它现在作为本地后端正常工作**。
- **不要把它部署到云端**（见第二节），它和 `server-deploy/functions/` 是两套独立运行的东西。
