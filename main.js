const { app, BrowserWindow, Menu, Tray, ipcMain, Notification, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// 单例模式 - 使用 Electron 官方 API
if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

app.on('second-instance', () => {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    }
});

// 性能优化配置（保守模式）

// 禁用不必要的功能
app.commandLine.appendSwitch('disable-service-worker');          // 禁用Service Worker（Electron有自己的离线机制）
app.commandLine.appendSwitch('disable-features', 'TranslateUI,PrintPreview'); // 禁用不必要的UI功能

// 启用硬件加速优化（保持原有功能）
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');    // 加速2D画布
app.commandLine.appendSwitch('enable-gpu-rasterization');         // GPU光栅化
app.commandLine.appendSwitch('enable-zero-copy');                 // 零拷贝渲染
app.commandLine.appendSwitch('ignore-gpu-blocklist');             // 忽略GPU黑名单

// 渲染优化
app.commandLine.appendSwitch('enable-smooth-scrolling');         // 启用平滑滚动
app.commandLine.appendSwitch('max-frame-rate', '60');            // 限制帧率为60帧

// 创建窗口
let mainWindow = null;
let tray = null;

// 更新状态
let updateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    progress: 0,
    version: ''
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        title: '🧰 教学工具箱',
        backgroundColor: '#0d0d1a',
        show: false, // 先隐藏窗口，等加载完成后再显示
        icon: path.join(__dirname, 'icon.ico'),
        frame: false, // 移除窗口边框和标题栏（原生体验）
        fullscreen: true, // 全屏显示
        useContentSize: true, // 使用内容尺寸而非窗口尺寸
        opacity: 1, // 不使用透明度
        enableLargerThanScreen: false, // 不允许超出屏幕
        autoHideMenuBar: true, // 自动隐藏菜单栏
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false,
            enableWebSQL: false, // 禁用WebSQL提升性能
            vmsCache: 'enabled', // 启用虚拟机缓存
            smoothScrolling: true // 平滑滚动
        }
    });

    // 禁止调整窗口大小和移动
    mainWindow.setResizable(false);
    
    // 禁止全屏切换（保持全屏状态）
    mainWindow.setFullScreenable(false);

    // 加载HTML文件
    const htmlPath = path.join(__dirname, '教学工具箱.html');
    mainWindow.loadFile(htmlPath);

    // 窗口准备好后显示（避免白屏闪烁）
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // 如果是首次运行，显示帮助提示
        if (!app.isPackaged) {
            console.log('开发模式：打开开发者工具请按 F12');
            mainWindow.webContents.openDevTools();
        }
    });

    // 窗口关闭时最小化到托盘
    mainWindow.on('close', (event) => {
        if (!global.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            if (tray) {
                tray.displayBalloon({
                    title: '教学工具箱',
                    content: '应用已最小化到托盘',
                    icon: path.join(__dirname, 'icon.ico')
                });
            }
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 创建菜单
    createMenu();
}

// 创建应用菜单
function createMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                {
                    label: '刷新',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: '强制刷新',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => {
                        mainWindow.webContents.reloadIgnoringCache();
                    }
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '全屏',
                    accelerator: 'F11',
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                },
                {
                    label: '放大',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        const zoom = mainWindow.webContents.getZoomFactor();
                        mainWindow.webContents.setZoomFactor(Math.min(zoom + 0.1, 2));
                    }
                },
                {
                    label: '缩小',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        const zoom = mainWindow.webContents.getZoomFactor();
                        mainWindow.webContents.setZoomFactor(Math.max(zoom - 0.1, 0.5));
                    }
                },
                {
                    label: '重置缩放',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        mainWindow.webContents.setZoomFactor(1);
                    }
                },
                { type: 'separator' },
                {
                    label: '开发者工具',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        },
        {
            label: '窗口',
            submenu: [
                {
                    label: '退出应用',
                    accelerator: 'Alt+F4',
                    click: () => {
                        app.quit();
                    }
                },
                { type: 'separator' },
                {
                    label: '置顶',
                    type: 'checkbox',
                    checked: false,
                    click: (menuItem) => {
                        mainWindow.setAlwaysOnTop(menuItem.checked);
                    }
                }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '关于教学工具箱',
                            message: '🧰 教学工具箱',
                            detail: '版本：1.0.0\n\n让课堂更有趣·让教学更高效\n\n卡牌点名器 | 趣味挑战\n\n© 2024 教学工具箱'
                        });
                    }
                },
                {
                    label: '访问官网',
                    click: () => {
                        shell.openExternal('https://example.com');
                    }
                }
            ]
        }
    ];

    // Mac系统菜单特殊处理
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// 创建系统托盘
function createTray() {
    const iconPath = path.join(__dirname, 'icon.ico');
    if (!fs.existsSync(iconPath)) {
        console.log('托盘图标不存在，跳过创建托盘');
        return;
    }
    
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '显示工具箱',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        {
            label: '卡牌点名器',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
                mainWindow.webContents.send('navigate', 'card');
            }
        },
        {
            label: '趣味挑战',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
                mainWindow.webContents.send('navigate', 'punishment');
            }
        },
        { type: 'separator' },
        {
            label: '置顶',
            type: 'checkbox',
            checked: mainWindow.isAlwaysOnTop(),
            click: (menuItem) => {
                mainWindow.setAlwaysOnTop(menuItem.checked);
            }
        },
        { type: 'separator' },
        {
            label: '退出',
            click: () => {
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('🧰 教学工具箱');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
    
    tray.on('double-click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

// 应用准备好时
app.whenReady().then(() => {
    createWindow();
    createTray();
    
    // 启动自动更新检查（打包后或测试模式下启用）
    const isTestMode = process.env.UPDATE_TEST_MODE === 'true';
    if (app.isPackaged || isTestMode) {
        setupAutoUpdater();
    }

    // macOS Dock点击行为
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

// 所有窗口关闭时
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 应用退出前
app.on('before-quit', () => {
    console.log('应用即将退出...');
});

// 捕获未处理的错误
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常：', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝：', reason);
});

// 设置开机自启动
function setupAutoLaunch() {
    app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false,
        path: app.getPath('exe'),
        args: []
    });
}

// 配置自动更新
function setupAutoUpdater() {
    // 检查是否为测试模式（通过环境变量控制）
    const isTestMode = process.env.UPDATE_TEST_MODE === 'true';
    
    if (isTestMode) {
        // 本地测试模式 - 使用本地更新服务器
        console.log('🔧 更新模式: 本地测试');
        console.log('📡 更新服务器: http://127.0.0.1:3000/');
        autoUpdater.setFeedURL({
            provider: 'generic',
            url: 'http://localhost:3000/',
            channel: 'latest'
        });
        // 禁用自动更新的缓存
        autoUpdater.autoDownload = false;
    } else {
        // 生产模式 - 使用Gitee Releases (generic provider)
        console.log('🔧 更新模式: 生产环境 (Gitee)');
        autoUpdater.setFeedURL({
            provider: 'generic',
            url: 'https://gitee.com/qwezasxf/teaching-toolbox/releases/download/v1.2.4/'
        });
        autoUpdater.autoDownload = false;
    }

    // 更新检查开始
    autoUpdater.on('checking-for-update', () => {
        updateStatus.checking = true;
        console.log('正在检查更新...');
        mainWindow?.webContents.send('update-status', updateStatus);
    });

    // 发现新版本
    autoUpdater.on('update-available', (info) => {
        updateStatus.checking = false;
        updateStatus.available = true;
        updateStatus.version = info.version;
        updateStatus.currentVersion = app.getVersion();
        console.log(`发现新版本: ${info.version}`);
        mainWindow?.webContents.send('update-status', updateStatus);
    });

    // 没有新版本
    autoUpdater.on('update-not-available', (info) => {
        updateStatus.checking = false;
        updateStatus.available = false;
        updateStatus.currentVersion = app.getVersion();
        console.log('当前已是最新版本');
        mainWindow?.webContents.send('update-status', updateStatus);
    });

    // 下载进度
    autoUpdater.on('download-progress', (progressObj) => {
        updateStatus.downloading = true;
        updateStatus.progress = Math.round(progressObj.percent);
        console.log(`下载进度: ${updateStatus.progress}%`);
        mainWindow?.webContents.send('update-progress', updateStatus.progress);
    });

    // 下载完成
    autoUpdater.on('update-downloaded', (info) => {
        updateStatus.downloading = false;
        updateStatus.downloaded = true;
        console.log('更新下载完成');
        mainWindow?.webContents.send('update-status', updateStatus);
    });

    // 更新错误
    autoUpdater.on('error', (error) => {
        updateStatus.checking = false;
        updateStatus.error = error.message;
        console.error('更新错误:', error);
        mainWindow?.webContents.send('update-status', updateStatus);
    });
}

// 手动检查更新
function checkForUpdatesManually() {
    if (!updateStatus.checking && !updateStatus.downloading) {
        autoUpdater.checkForUpdates();
    }
}

// IPC通信示例 - 发送通知
ipcMain.handle('show-notification', async (event, { title, body }) => {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: title,
            body: body,
            silent: false
        });
        notification.show();
        return true;
    }
    return false;
});

// IPC通信 - 获取应用信息
ipcMain.handle('get-app-info', async () => {
    return {
        version: app.getVersion(),
        name: app.getName(),
        platform: process.platform
    };
});

// IPC通信 - 保存数据到应用目录
ipcMain.handle('save-data-file', async (event, data) => {
    try {
        const exePath = app.getPath('exe');
        const appDir = path.dirname(exePath);
        const dataPath = path.join(appDir, '教学工具箱数据.json');
        
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true, path: dataPath };
    } catch (error) {
        console.error('保存数据文件失败:', error);
        return { success: false, error: error.message };
    }
});

// IPC通信 - 从应用目录读取数据
ipcMain.handle('load-data-file', async () => {
    try {
        const exePath = app.getPath('exe');
        const appDir = path.dirname(exePath);
        const dataPath = path.join(appDir, '教学工具箱数据.json');
        
        if (fs.existsSync(dataPath)) {
            const content = fs.readFileSync(dataPath, 'utf-8');
            return { success: true, data: JSON.parse(content) };
        }
        return { success: false, message: '数据文件不存在' };
    } catch (error) {
        console.error('读取数据文件失败:', error);
        return { success: false, error: error.message };
    }
});

// IPC通信 - 检查更新
ipcMain.handle('check-for-updates', async () => {
    checkForUpdatesManually();
    return updateStatus;
});

// IPC通信 - 下载更新
ipcMain.handle('download-update', async () => {
    autoUpdater.downloadUpdate();
    return { success: true };
});

// IPC通信 - 安装更新
ipcMain.handle('install-update', async () => {
    autoUpdater.quitAndInstall();
    return { success: true };
});

// IPC通信 - 获取更新状态
ipcMain.handle('get-update-status', async () => {
    return updateStatus;
});

// IPC通信 - 退出应用
ipcMain.handle('quit-app', async () => {
    global.isQuitting = true;
    app.quit();
});

// IPC通信 - 获取设备ID
ipcMain.handle('get-device-id', async () => {
    try {
        const os = require('os');
        const crypto = require('crypto');
        
        const cpuInfo = os.cpus()[0].model;
        const platform = os.platform();
        const totalMem = os.totalmem().toString();
        const hostname = os.hostname();
        
        const hash = crypto.createHash('sha256');
        hash.update(cpuInfo + platform + totalMem + hostname);
        const deviceId = hash.digest('hex').slice(0, 16);
        
        return { success: true, deviceId: deviceId };
    } catch (error) {
        console.error('获取设备ID失败:', error);
        return { success: false, deviceId: 'unknown_' + Date.now().toString(36) };
    }
});

// IPC通信 - 删除应用目录下的数据文件
ipcMain.handle('delete-app-data', async () => {
    try {
        const exePath = app.getPath('exe');
        const appDir = path.dirname(exePath);
        const dataPath = path.join(appDir, '教学工具箱数据.json');
        
        if (fs.existsSync(dataPath)) {
            fs.unlinkSync(dataPath);
            console.log('已删除应用目录下的数据文件:', dataPath);
            return { success: true };
        }
        return { success: true, message: '数据文件不存在' };
    } catch (error) {
        console.error('删除数据文件失败:', error);
        return { success: false, error: error.message };
    }
});

// IPC通信 - 保存文件
ipcMain.handle('save-file', async (event, { content, defaultPath, filters }) => {
    try {
        const defaultDir = app.getPath('documents');
        const fileName = defaultPath || '成绩统计.txt';
        const fullDefaultPath = require('path').join(defaultDir, fileName);
        
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: fullDefaultPath,
            filters: filters || [{ name: '文本文件', extensions: ['txt'] }],
            title: '保存文件'
        });
        
        if (mainWindow) {
            mainWindow.focus();
            mainWindow.webContents.focus();
        }
        
        if (!result.canceled && result.filePath) {
            const filePath = result.filePath;
            const dirPath = require('path').dirname(filePath);
            
            try {
                await fs.promises.access(dirPath, fs.constants.W_OK);
            } catch (accessError) {
                return { success: false, error: '权限不足，请选择其他文件夹（如文档或桌面）', code: 'EPERM' };
            }
            
            try {
                await fs.promises.writeFile(filePath, content, 'utf-8');
                return { success: true, filePath: filePath };
            } catch (writeError) {
                if (writeError.code === 'EPERM') {
                    return { success: false, error: '权限不足，请选择其他文件夹（如文档或桌面）', code: 'EPERM' };
                } else if (writeError.code === 'EACCES') {
                    return { success: false, error: '访问被拒绝，请选择其他文件夹', code: 'EACCES' };
                } else if (writeError.code === 'ENOENT') {
                    return { success: false, error: '目标文件夹不存在，请选择其他位置', code: 'ENOENT' };
                }
                return { success: false, error: '保存失败: ' + writeError.message, code: writeError.code };
            }
        }
        return { success: false, canceled: true };
    } catch (error) {
        console.error('保存文件失败:', error);
        return { success: false, error: error.message };
    }
});
