Start-Process -FilePath "node" -ArgumentList "update-server.js"
Start-Sleep -Seconds 2
$env:UPDATE_TEST_MODE = "true"
Start-Process -FilePath "npx" -ArgumentList "electron ." -WorkingDirectory "."
Write-Host "Test started. Check the app for update dialog."