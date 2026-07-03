const fs = require('fs');
const { createCanvas } = require('canvas');
const pngToIcoModule = require('png-to-ico');

async function generateIcon() {
  const pngToIco = pngToIcoModule.default || pngToIcoModule;
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngFiles = [];
  
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#4a3f6b';
    ctx.fillRect(0, 0, size, size);
    
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = Math.max(1, size / 25);
    ctx.lineCap = 'round';
    
    const centerX = size / 2;
    const centerY = size / 2;
    
    const outerRadius = size * 0.38;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    const innerRadius = size * 0.12;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#00d4ff';
    ctx.fill();
    
    const orbitRadius = size * 0.3;
    const numPoints = 3;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * Math.PI * 2) / numPoints - Math.PI / 2;
      const px = centerX + Math.cos(angle) * orbitRadius;
      const py = centerY + Math.sin(angle) * orbitRadius;
      
      ctx.beginPath();
      ctx.arc(px, py, size * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();
    }
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI / 6);
    
    const ellipseRadiusX = size * 0.25;
    const ellipseRadiusY = size * 0.15;
    ctx.beginPath();
    ctx.ellipse(0, 0, ellipseRadiusX, ellipseRadiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    const pngBuffer = canvas.toBuffer('image/png');
    pngFiles.push(pngBuffer);
  }
  
  const icoBuffer = await pngToIco(pngFiles);
  return icoBuffer;
}

if (require.main === module) {
  generateIcon().then(icoData => {
    fs.writeFileSync('icon.ico', icoData);
    console.log('✅ 图标生成成功: icon.ico');
  }).catch(error => {
    console.error('❌ 图标生成失败:', error.message);
  });
}

module.exports = generateIcon;
