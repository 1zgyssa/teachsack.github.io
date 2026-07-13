# TeachSack API 部署指南

## 🚀 部署到 Vercel（推荐）

### 前提条件
1. 拥有 GitHub 账号
2. 已购买域名 teachsack.cn

### 步骤

#### 1. 创建 GitHub 仓库
- 在 GitHub 创建新仓库 `teachsack-api`
- 将 `server-deploy` 目录下的所有文件推送到仓库

#### 2. 连接 Vercel
- 访问 https://vercel.com
- 使用 GitHub 账号登录
- 点击 "Add New" → "Project"
- 选择 `teachsack-api` 仓库

#### 3. 配置项目
- **Framework**: Other
- **Build Command**: 留空
- **Output Directory**: 留空
- **Install Command**: `npm install`

#### 4. 部署
- 点击 "Deploy" 按钮
- 等待部署完成

#### 5. 配置域名
- 在 Vercel 项目设置中找到 "Domains"
- 添加 `api.teachsack.cn`
- 在域名解析中添加 CNAME 记录指向 Vercel 提供的域名

## ✅ 验证部署

```bash
# 健康检查
curl https://api.teachsack.cn/api/health

# 应该返回：{"success":true,"message":"服务器正常运行"}
```

## 🔑 默认管理员密码

密码：070515

## 📁 项目结构

```
server-deploy/
├── server.js        # 后端API服务
├── admin.html       # 管理面板
├── package.json     # 依赖配置
└── DEPLOY.md        # 部署说明
```

## 🎯 API 接口

| 接口 | 方法 | 描述 |
|------|------|------|
| /api/validate | POST | 验证激活码和设备绑定 |
| /api/admin/login | POST | 管理员登录 |
| /api/admin/add | POST | 添加激活码 |
| /api/admin/delete | POST | 删除激活码 |
| /api/admin/list | POST | 激活码列表 |
| /api/health | GET | 健康检查 |