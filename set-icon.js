const fs = require('fs');
const { createCanvas } = require('canvas');
const { execSync } = require('child_process');
const path = require('path');

const sizes = [256, 128, 64, 48, 32, 16];
const pngBuffers = [];

sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(0.5, '#8b5cf6');
    gradient.addColorStop(1, '#ec4899');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.25);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + (size * 0.47) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎓', size / 2, size / 2 + 5);
    
    pngBuffers.push(canvas.toBuffer('image/png'));
});

const pngToIco = require('png-to-ico');
pngToIco.default(pngBuffers).then(buf => {
    fs.writeFileSync('build/icon.ico', buf);
    console.log('ICO生成成功:', buf.length);
    
    const rceditPath = path.join(__dirname, 'node_modules', 'rcedit', 'bin', 'rcedit.exe');
    console.log('rcedit路径:', rceditPath);
    
    if (fs.existsSync(rceditPath)) {
        execSync(`"${rceditPath}" "downloads/TeachSack-Windows-v1.2.4.exe" --set-icon "build/icon.ico"`, { stdio: 'inherit' });
        console.log('图标设置成功');
    } else {
        console.log('rcedit不存在，尝试查找...');
        const rceditDir = path.join(__dirname, 'node_modules', 'rcedit');
        const files = fs.readdirSync(rceditDir);
        console.log('rcedit目录内容:', files);
    }
}).catch(err => {
    console.error('生成ICO失败:', err);
});