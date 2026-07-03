Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              🧪 教学工具箱 - 自动更新测试工具               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 步骤1/3: 启动本地更新服务器..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "update-server.js" -WindowStyle Hidden
Write-Host "          ✅ 更新服务器已启动" -ForegroundColor Green
Write-Host "          📍 地址: http://127.0.0.1:3000"
Write-Host ""

Write-Host "⏳ 等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host ""

Write-Host "🚀 步骤2/3: 启动教学工具箱（测试模式）..." -ForegroundColor Green
$env:UPDATE_TEST_MODE = "true"
Start-Process -FilePath "npx" -ArgumentList "electron ." -WorkingDirectory "."
Write-Host "          ✅ 应用已启动" -ForegroundColor Green
Write-Host "          🔧 更新模式: 本地测试"
Write-Host ""

Write-Host "📝 步骤3/3: 查看更新日志" -ForegroundColor Green
Write-Host "          请按 F12 打开开发者工具，切换到 Console 查看更新日志"
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ 测试流程:                                                    ║" -ForegroundColor Cyan
Write-Host "║  1. 应用启动后会自动检查更新                                 ║" -ForegroundColor Cyan
Write-Host "║  2. 如果检测到新版本(1.2.0)，会弹出更新提示                  ║" -ForegroundColor Cyan
Write-Host "║  3. 点击'立即更新'开始下载                                   ║" -ForegroundColor Cyan
Write-Host "║  4. 下载完成后会提示安装                                     ║" -ForegroundColor Cyan
Write-Host "║                                                             ║" -ForegroundColor Cyan
Write-Host "║ 注意: 测试使用的是模拟安装包，不会真正安装更新                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Read-Host "按 Enter 键继续..."