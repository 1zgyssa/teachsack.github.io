module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (pathname === '/api/health') {
        res.status(200).json({ 
            success: true, 
            message: '服务器正常运行',
            timestamp: new Date().toISOString(),
            version: '1.5.1'
        });
        return;
    }

    if (pathname === '/api/validate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { key, deviceId } = JSON.parse(body);
                if (!key || !deviceId) {
                    res.status(200).json({ success: false, message: '参数错误' });
                    return;
                }
                
                const testCodes = ['8QW6UUL2D6QZ-P895', '2K78J3KL9MNP-X2R7', '4F92G5MN3PQR-T4B8'];
                const upperKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
                
                if (!testCodes.some(c => c.toUpperCase().replace(/[^A-Z0-9]/g, '') === upperKey)) {
                    res.status(200).json({ success: false, message: '激活码不存在' });
                    return;
                }
                
                res.status(200).json({ success: true, message: '激活成功' });
                
            } catch (e) {
                res.status(200).json({ success: false, message: '请求解析失败' });
            }
        });
        return;
    }

    if (pathname === '/api/feedback' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const feedback = JSON.parse(body);
                console.log('收到反馈:', feedback);
                
                res.status(200).json({ success: true, message: '反馈已收到' });
            } catch (e) {
                res.status(200).json({ success: false, message: '请求解析失败' });
            }
        });
        return;
    }

    res.status(404).json({ success: false, message: '未找到' });
};