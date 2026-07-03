const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = '127.0.0.1';

// 模拟更新信息
const latestVersion = '1.2.0';
const fileName = `toolbox-setup-${latestVersion}.exe`;
const updateInfo = {
    version: latestVersion,
    files: [
        {
            url: `http://${HOST}:${PORT}/${fileName}`,
            name: fileName,
            size: 50000000
        }
    ],
    path: fileName,
    sha512: 'abc123',
    releaseDate: new Date().toISOString()
};

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] 请求: ${req.method} ${req.url}`);
    console.log(`  来源: ${req.headers.host || 'unknown'}`);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 返回更新信息
    if (req.url === '/latest.yml' || req.url === '/latest.yaml') {
        res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
        const fileName = `toolbox-setup-${latestVersion}.exe`;
        const yamlContent = `version: ${latestVersion}
files:
  - url: http://${HOST}:${PORT}/${fileName}
    name: ${fileName}
    sha512: abc123
    size: 50000000
path: ${fileName}
sha512: abc123
releaseDate: ${updateInfo.releaseDate}
`;
        res.writeHead(200);
        res.end(yamlContent, 'utf8');
        return;
    }
    
    // 返回更新JSON信息
    if (req.url === '/update.json') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(updateInfo, null, 2));
        return;
    }
    
    // 模拟下载安装包（返回空文件）
    if (req.url.includes('.exe')) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="教学工具箱 Setup ${latestVersion}.exe"`);
        res.writeHead(200);
        // 返回一个小文件用于测试
        res.end(Buffer.alloc(1024));
        return;
    }
    
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, HOST, () => {
    console.log(`\n🚀 本地更新服务器已启动`);
    console.log(`📍 地址: http://${HOST}:${PORT}`);
    console.log(`📋 可用接口:`);
    console.log(`  - GET /latest.yml    → 更新信息(YAML格式)`);
    console.log(`  - GET /update.json   → 更新信息(JSON格式)`);
    console.log(`  - GET /*.exe         → 下载安装包`);
    console.log(`\n💡 提示：先运行此服务器，再启动应用进行测试`);
});