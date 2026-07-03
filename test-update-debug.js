const https = require('https');

console.log('🔍 自动更新功能调试工具');
console.log('='.repeat(50));

// 检查当前版本
const packageJson = require('./package.json');
console.log(`📦 当前版本: ${packageJson.version}`);

// 检查 Gitee 配置
console.log('\n🔧 Gitee 配置:');
console.log('   - owner: qwezasxf');
console.log('   - repo: teaching-toolbox');

// 获取 Gitee 最新版本
console.log('\n📡 正在获取 Gitee 最新版本...');

const url = 'https://gitee.com/api/v5/repos/qwezasxf/teaching-toolbox/releases/latest';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const release = JSON.parse(data);
            const latestVersion = release.tag_name.replace('v', '');
            
            console.log(`✅ Gitee 最新版本: ${release.tag_name}`);
            console.log(`📝 发布标题: ${release.name}`);
            console.log(`📅 发布时间: ${release.created_at}`);
            
            // 版本比较
            console.log('\n📊 版本对比:');
            console.log(`   - 当前版本: ${packageJson.version}`);
            console.log(`   - Gitee版本: ${latestVersion}`);
            
            const current = packageJson.version.split('.').map(Number);
            const latest = latestVersion.split('.').map(Number);
            
            let hasUpdate = false;
            for (let i = 0; i < 3; i++) {
                if (latest[i] > current[i]) {
                    hasUpdate = true;
                    break;
                } else if (latest[i] < current[i]) {
                    break;
                }
            }
            
            if (hasUpdate) {
                console.log('\n🎉 发现新版本！');
                console.log(`   建议上传新版本 ${packageJson.version} 到 Gitee`);
            } else if (packageJson.version === latestVersion) {
                console.log('\n⚠️ 当前版本与 Gitee 版本相同');
                console.log('   需要上传更高版本才能测试自动更新');
            } else {
                console.log('\n🔄 当前版本高于 Gitee 版本');
                console.log('   这是正常的开发状态');
            }
            
            // 检查安装包
            if (release.assets && release.assets.length > 0) {
                console.log('\n📥 可用安装包:');
                release.assets.forEach((asset, index) => {
                    console.log(`   ${index + 1}. ${asset.name}`);
                    console.log(`      URL: ${asset.browser_download_url}`);
                });
            } else {
                console.log('\n❌ Gitee 上没有上传安装包');
            }
            
        } catch (error) {
            console.log('\n❌ 解析失败:', error.message);
            console.log('📄 响应内容:', data.substring(0, 500));
        }
    });
}).on('error', (error) => {
    console.log('\n❌ 连接失败:', error.message);
    console.log('💡 可能的原因:');
    console.log('   1. 网络连接问题');
    console.log('   2. Gitee API 访问限制');
    console.log('   3. 仓库配置错误');
});