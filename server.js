/**
 * TeachSack 统一后端 (v2.0.0)
 * ---------------------------------------------------------------
 * 这是 TeachSack 唯一的后端服务，合并了原先分散的两套实现：
 *   1) 根目录旧 server.js   —— 真实授权库 + 管理员接口
 *   2) server-deploy/ 云函数 —— 反馈 / 支付 / 清空（Cloudflare KV）
 *
 * 现在所有接口都由本文件提供，授权与反馈/支付使用同一份配置、同一个
 * 管理员密码（070515），彻底消除"两套后端逻辑分叉"的隐患。
 *
 * 存储说明：
 *   - 授权数据：本地文件 license-data.json（原逻辑不变）
 *   - 反馈/支付：Cloudflare KV（沿用旧云版命名空间，key 格式与返回结构
 *     完全兼容，已有数据可继续读取）
 *
 * 部署：
 *   - 作为标准 Node 服务运行（VPS / 容器 / Cloudflare Workers Node 兼容）。
 *   - 反馈/支付需要以下环境变量（缺失时自动回退到本地 JSON 文件，方便本地开发）：
 *       CF_API_TOKEN       Cloudflare API Token（需 KV 编辑权限）
 *       CF_ACCOUNT_ID      Cloudflare 账户 ID
 *       KV_NAMESPACE_ID    KV 命名空间 ID（默认 8e93d84339c74c57957b7f2423bd81de）
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============================================================
// 配置
// ============================================================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '070515'; // 与旧云版 / 旧 server.js 保持一致；生产环境请用环境变量 ADMIN_PASSWORD 覆盖
const DATA_FILE = path.join(__dirname, 'license-data.json');
const DATA_DIR = path.join(__dirname, 'data');

// KV 配置（缺失则回退本地文件）
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '';
const KV_NAMESPACE_ID = process.env.KV_NAMESPACE_ID || '8e93d84339c74c57957b7f2423bd81de';
const KV_CONFIGURED = !!(CF_API_TOKEN && CF_ACCOUNT_ID);

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const checkAdmin = (password) => sha256(password) === sha256(ADMIN_PASSWORD);

// ============================================================
// 授权数据（本地文件，逻辑保持不变）
// ============================================================
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (e) {
            return { licenses: {}, usedLicenses: {}, adminPassword: sha256(ADMIN_PASSWORD) };
        }
    }
    return { licenses: {}, usedLicenses: {}, adminPassword: sha256(ADMIN_PASSWORD) };
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let licenseData = loadData();

function validateLicenseFormat(key) {
    if (!key) return false;
    const upperKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (upperKey.length !== 16) return false;

    const SECRET_KEY = process.env.SECRET_KEY || 'T3@chS@ck!2024#K3y';
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    const body = upperKey.slice(0, 12);
    const checksum = upperKey.slice(12);

    let hash = 0;
    for (let i = 0; i < body.length; i++) {
        hash = ((hash << 5) - hash) + body.charCodeAt(i);
        hash |= 0;
    }
    for (let i = 0; i < SECRET_KEY.length; i++) {
        hash = ((hash << 5) - hash) + SECRET_KEY.charCodeAt(i);
        hash |= 0;
    }
    hash = Math.abs(hash);

    let computed = '';
    for (let i = 0; i < 4; i++) {
        computed += CHARS[hash % CHARS.length];
        hash = Math.floor(hash / CHARS.length);
    }

    return checksum === computed;
}

// ============================================================
// 反馈 / 支付 存储抽象（Cloudflare KV，回退本地文件）
// 保持与旧云版完全一致的 key 格式：feedback:<id> / payment:<id>
// ============================================================
function localDataFile(prefix) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    return path.join(DATA_DIR, prefix + '.json');
}

function readLocalList(prefix) {
    const f = localDataFile(prefix);
    if (!fs.existsSync(f)) return [];
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return []; }
}

function writeLocalList(prefix, list) {
    const f = localDataFile(prefix);
    fs.writeFileSync(f, JSON.stringify(list, null, 2));
}

async function kvPut(key, value) {
    if (KV_CONFIGURED) {
        const r = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`,
            { method: 'PUT', headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'text/plain' }, body: value }
        );
        return r.ok;
    }
    // 回退：本地文件
    const prefix = key.split(':')[0];
    const list = readLocalList(prefix);
    const item = JSON.parse(value);
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    writeLocalList(prefix, list);
    return true;
}

async function kvGet(key) {
    if (KV_CONFIGURED) {
        const r = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`,
            { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
        );
        if (!r.ok) return null;
        return await r.text();
    }
    const prefix = key.split(':')[0];
    const list = readLocalList(prefix);
    const item = list.find((x) => x.id === key.split(':')[1]);
    return item ? JSON.stringify(item) : null;
}

async function kvList(prefix) {
    if (KV_CONFIGURED) {
        const r = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/keys?prefix=${encodeURIComponent(prefix)}`,
            { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
        );
        const j = await r.json();
        return (j.result || []).map((k) => k.name).sort((a, b) => b.localeCompare(a));
    }
    const base = prefix.replace(':', '');
    return readLocalList(base).map((x) => `${base}:${x.id}`).sort((a, b) => b.localeCompare(a));
}

async function kvDelete(key) {
    if (KV_CONFIGURED) {
        const r = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
        );
        return r.ok;
    }
    const prefix = key.split(':')[0];
    const list = readLocalList(prefix).filter((x) => x.id !== key.split(':')[1]);
    writeLocalList(prefix, list);
    return true;
}

// ============================================================
// 授权接口
// ============================================================
app.post('/api/validate', async (req, res) => {
    const { key, deviceId } = req.body;

    if (!key || !deviceId) {
        return res.json({ success: false, message: '参数错误' });
    }

    const upperKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!validateLicenseFormat(upperKey)) {
        return res.json({ success: false, message: '激活码格式无效' });
    }

    if (!licenseData.licenses[upperKey]) {
        return res.json({ success: false, message: '激活码不存在或已失效' });
    }

    if (licenseData.usedLicenses[upperKey]) {
        if (licenseData.usedLicenses[upperKey] !== deviceId) {
            return res.json({ success: false, message: '激活码已被其他设备使用' });
        }
        return res.json({ success: true, message: '验证成功' });
    }

    licenseData.usedLicenses[upperKey] = deviceId;
    saveData(licenseData);

    return res.json({ success: true, message: '激活成功' });
});

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (checkAdmin(password)) {
        return res.json({ success: true, message: '登录成功' });
    }
    return res.json({ success: false, message: '密码错误' });
});

app.post('/api/admin/add', (req, res) => {
    const { password, codes } = req.body;
    if (!checkAdmin(password)) {
        return res.json({ success: false, message: '密码错误' });
    }
    if (!codes || !Array.isArray(codes)) {
        return res.json({ success: false, message: '参数错误' });
    }
    let added = 0;
    codes.forEach((code) => {
        const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (validateLicenseFormat(upperCode) && !licenseData.licenses[upperCode]) {
            licenseData.licenses[upperCode] = { created: new Date().toISOString(), used: false };
            added++;
        }
    });
    saveData(licenseData);
    return res.json({ success: true, message: `成功添加 ${added} 个激活码`, added });
});

app.post('/api/admin/delete', (req, res) => {
    const { password, code } = req.body;
    if (!checkAdmin(password)) {
        return res.json({ success: false, message: '密码错误' });
    }
    if (!code) {
        return res.json({ success: false, message: '参数错误' });
    }
    const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (licenseData.licenses[upperCode]) {
        delete licenseData.licenses[upperCode];
        if (licenseData.usedLicenses[upperCode]) {
            delete licenseData.usedLicenses[upperCode];
        }
        saveData(licenseData);
        return res.json({ success: true, message: '删除成功' });
    }
    return res.json({ success: false, message: '激活码不存在' });
});

app.post('/api/admin/list', (req, res) => {
    const { password } = req.body;
    if (!checkAdmin(password)) {
        return res.json({ success: false, message: '密码错误' });
    }
    const list = Object.keys(licenseData.licenses).map((code) => ({
        code: code.slice(0, 4) + '-' + code.slice(4, 8) + '-' + code.slice(8, 12) + '-' + code.slice(12),
        created: licenseData.licenses[code].created,
        used: !!licenseData.usedLicenses[code],
        deviceId: licenseData.usedLicenses[code] || null
    }));
    return res.json({ success: true, data: list });
});

// ============================================================
// 反馈接口
// ============================================================
app.post('/api/feedback', async (req, res) => {
    try {
        const body = req.body || {};
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const feedback = {
            id,
            ...body,
            timestamp: new Date().toISOString(),
            ip: req.headers['cf-connecting-ip'] || req.ip || 'unknown'
        };
        await kvPut(`feedback:${id}`, JSON.stringify(feedback));
        return res.json({ success: true, message: '反馈已收到' });
    } catch (e) {
        console.log('记录反馈失败:', e);
        return res.json({ success: false, message: '请求解析失败' });
    }
});

app.get('/api/feedbacks', async (req, res) => {
    try {
        const keys = await kvList('feedback:');
        const feedbacks = [];
        for (const key of keys) {
            const raw = await kvGet(key);
            if (raw) feedbacks.push(JSON.parse(raw));
        }
        return res.json({ success: true, data: feedbacks, count: feedbacks.length });
    } catch (e) {
        console.log('读取反馈失败:', e);
        return res.json({ success: true, data: [], count: 0 });
    }
});

// ============================================================
// 支付接口
// ============================================================
app.post('/api/payment', async (req, res) => {
    try {
        const body = req.body || {};
        const { email, phone, amount, screenshot } = body;

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email || !emailRegex.test(email)) {
            return res.json({ success: false, message: '请输入有效的邮箱地址' });
        }
        if (screenshot && screenshot.length > 100 * 1024) {
            return res.json({ success: false, message: '截图文件过大，请压缩后重试' });
        }

        const paymentId = 'payment_' + Math.random().toString(36).substr(2, 15);
        const paymentData = JSON.stringify({
            id: paymentId,
            email: email || '',
            phone: phone || '',
            amount: parseFloat(amount) || 0,
            screenshot: screenshot,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });

        await kvPut(`payment:${paymentId}`, paymentData);
        return res.json({ success: true, message: '付款信息已记录', id: paymentId });
    } catch (e) {
        console.log('记录付款失败:', e);
        return res.json({ success: false, message: '记录失败' });
    }
});

app.get('/api/payments', async (req, res) => {
    try {
        const keys = await kvList('payment:');
        const payments = [];
        for (const key of keys) {
            const raw = await kvGet(key);
            if (raw) payments.push(JSON.parse(raw));
        }
        return res.json({ success: true, data: payments, count: payments.length });
    } catch (e) {
        console.log('读取付款记录失败:', e);
        return res.json({ success: true, data: [], count: 0 });
    }
});

app.post('/api/payment/status', async (req, res) => {
    try {
        const { id, status } = req.body || {};
        if (!id || !status) {
            return res.json({ success: false, message: '参数错误' });
        }
        if (!['completed', 'cancelled', 'pending'].includes(status)) {
            return res.json({ success: false, message: '无效的状态值' });
        }
        const key = id.startsWith('payment:') ? id : `payment:${id}`;
        const existing = await kvGet(key);
        if (!existing) {
            return res.json({ success: false, message: '订单不存在' });
        }
        const paymentData = JSON.parse(existing);
        paymentData.status = status;
        paymentData.updatedAt = new Date().toISOString();
        await kvPut(key, JSON.stringify(paymentData));
        return res.json({ success: true, message: '状态已更新' });
    } catch (e) {
        console.log('更新订单状态失败:', e);
        return res.json({ success: false, message: '更新失败' });
    }
});

app.post('/api/clear', async (req, res) => {
    try {
        const { password } = req.body || {};
        if (password !== ADMIN_PASSWORD) {
            return res.json({ success: false, message: '密码错误' });
        }
        const prefixes = ['payment:', 'feedback:'];
        let deletedCount = 0;
        for (const prefix of prefixes) {
            const keys = await kvList(prefix);
            for (const key of keys) {
                await kvDelete(key);
                deletedCount++;
            }
        }
        return res.json({ success: true, message: `成功删除 ${deletedCount} 条记录` });
    } catch (e) {
        console.log('清空记录失败:', e);
        return res.json({ success: false, message: '清空失败' });
    }
});

// ============================================================
// 健康检查
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器正常运行',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        kvEnabled: KV_CONFIGURED
    });
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`TeachSack 统一后端运行在 http://localhost:${PORT}`);
    console.log(`管理面板: http://localhost:${PORT}/admin.html`);
    console.log(`KV 存储: ${KV_CONFIGURED ? '已启用 (namespace ' + KV_NAMESPACE_ID + ')' : '未配置，回退本地文件'}`);
});
