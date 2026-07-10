const { createCanvas } = require('canvas');
const fs = require('fs');

const width = 300;
const height = 380;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, width, height);

ctx.fillStyle = '#f3f3f3';
ctx.fillRect(0, 0, width, 40);
ctx.fillStyle = '#1a1a1a';
ctx.font = '14px sans-serif';
ctx.fillText('下载', 20, 25);

ctx.fillStyle = '#2a2a2a';
ctx.fillRect(20, 60, width - 40, 280);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 16px sans-serif';
ctx.fillText('打开前请确保信任 TeachSack', 40, 100);
ctx.fillText('-Windows-v1.2.4.exe', 40, 125);

ctx.fillStyle = '#999999';
ctx.font = '12px sans-serif';
ctx.fillText('Microsoft Defender SmartScreen 无法验证此文件是否安全', 40, 155);
ctx.fillText('因为通常不会下载此文件。请确保在打开之前信任正在', 40, 175);
ctx.fillText('下载的文件或其源。', 40, 195);

ctx.fillStyle = '#ffffff';
ctx.font = '12px sans-serif';
ctx.fillText('名称: TeachSack-Windows-v1.2.4.exe', 40, 225);
ctx.fillText('发布者: 未知', 40, 245);

ctx.fillStyle = '#0066cc';
ctx.font = '13px sans-serif';
ctx.fillText('将此应用报告为安全', 40, 275);
ctx.fillText('了解更多信息', 40, 295);

ctx.fillStyle = '#e0e0e0';
ctx.fillRect(200, 320, 70, 32);
ctx.fillStyle = '#333333';
ctx.font = '13px sans-serif';
ctx.fillText('取消', 222, 340);

ctx.fillStyle = '#0066cc';
ctx.fillRect(280, 320, 80, 32);
ctx.fillStyle = '#ffffff';
ctx.font = '13px sans-serif';
ctx.fillText('删除', 305, 340);

ctx.fillStyle = '#0066cc';
ctx.fillRect(280, 350, 80, 28);
ctx.fillStyle = '#ffffff';
ctx.font = '12px sans-serif';
ctx.fillText('仍然保留', 300, 368);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('images/smartscreen-warning.png', buffer);
console.log('Screenshot generated: images/smartscreen-warning.png');