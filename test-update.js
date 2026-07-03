const https = require('https');

console.log('🔧 测试自动更新功能...');
console.log('📡 正在连接 Gitee 仓库...');

const url = 'https://gitee.com/api/v5/repos/qwezasxf/teaching-toolbox/releases/latest';

https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const release = JSON.parse(data);
            console.log('✅ 成功连接到 Gitee 仓库');
            console.log(`📦 最新版本: ${release.tag_name}`);
            console.log(`📝 发布标题: ${release.name}`);
            console.log(`📥 下载链接: ${release.assets[0]?.browser_download_url || '暂无'}`);
            console.log('\n🎉 自动更新配置测试成功！');
        } catch (error) {
            console.log('❌ 解析失败:', error.message);
            console.log('📄 响应内容:', data);
        }
    });
}).on('error', (error) => {
    console.log('❌ 连接失败:', error.message);
});