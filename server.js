const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'license-data.json');

function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (e) {
            return { licenses: {}, usedLicenses: {}, adminPassword: '4681a15d0e51191f28d8d3e0a2dbb53a6968889624e13a217024f47bfa6ba15b' };
        }
    }
    return { licenses: {}, usedLicenses: {}, adminPassword: '4681a15d0e51191f28d8d3e0a2dbb53a6968889624e13a217024f47bfa6ba15b' };
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let licenseData = loadData();

function validateLicenseFormat(key) {
    if (!key) return false;
    const upperKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (upperKey.length !== 16) return false;
    
    const SECRET_KEY = 'T3@chS@ck!2024#K3y';
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
    
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    
    if (hash === licenseData.adminPassword) {
        return res.json({ success: true, message: '登录成功' });
    }
    
    return res.json({ success: false, message: '密码错误' });
});

app.post('/api/admin/add', (req, res) => {
    const { password, codes } = req.body;
    
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    
    if (hash !== licenseData.adminPassword) {
        return res.json({ success: false, message: '密码错误' });
    }
    
    if (!codes || !Array.isArray(codes)) {
        return res.json({ success: false, message: '参数错误' });
    }
    
    let added = 0;
    codes.forEach(code => {
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
    
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    
    if (hash !== licenseData.adminPassword) {
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
    
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    
    if (hash !== licenseData.adminPassword) {
        return res.json({ success: false, message: '密码错误' });
    }
    
    const list = Object.keys(licenseData.licenses).map(code => ({
        code: code.slice(0, 4) + '-' + code.slice(4, 8) + '-' + code.slice(8, 12) + '-' + code.slice(12),
        created: licenseData.licenses[code].created,
        used: !!licenseData.usedLicenses[code],
        deviceId: licenseData.usedLicenses[code] || null
    }));
    
    return res.json({ success: true, data: list });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: '服务器正常运行' });
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`管理面板: http://localhost:${PORT}/admin.html`);
});