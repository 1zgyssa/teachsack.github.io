const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/api/health') {
        res.statusCode = 200;
        res.end(JSON.stringify({ 
            success: true, 
            message: '服务器正常运行',
            timestamp: new Date().toISOString(),
            version: '1.7.0'
        }));
        return;
    }

    if (url.pathname === '/api/validate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { key, deviceId } = JSON.parse(body);
                if (!key || !deviceId) {
                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: false, message: '参数错误' }));
                    return;
                }
                
                const testCodes = ['8QW6UUL2D6QZ-P895', '2K78J3KL9MNP-X2R7', '4F92G5MN3PQR-T4B8'];
                const upperKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
                
                if (!testCodes.some(c => c.toUpperCase().replace(/[^A-Z0-9]/g, '') === upperKey)) {
                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: false, message: '激活码不存在' }));
                    return;
                }
                
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, message: '激活成功' }));
                
            } catch (e) {
                res.statusCode = 200;
                res.end(JSON.stringify({ success: false, message: '请求解析失败' }));
            }
        });
        return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ success: false, message: '未找到' }));
});

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});