const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 发送通知
    showNotification: (title, body) => {
        return ipcRenderer.invoke('show-notification', { title, body });
    },
    
    // 获取应用信息
    getAppInfo: () => {
        return ipcRenderer.invoke('get-app-info');
    },
    
    // 保存数据到应用目录
    saveDataFile: (data) => {
        return ipcRenderer.invoke('save-data-file', data);
    },
    
    // 从应用目录读取数据
    loadDataFile: () => {
        return ipcRenderer.invoke('load-data-file');
    },
    
    // 监听导航事件（从主进程）
    onNavigate: (callback) => {
        ipcRenderer.on('navigate', (event, page) => {
            callback(page);
        });
    },
    
    // 平台信息
    platform: process.platform,
    
    // 是否是Electron环境
    isElectron: true,
    
    // 手动检查更新
    checkForUpdates: () => {
        return ipcRenderer.invoke('check-for-updates');
    },
    
    // 下载更新
    downloadUpdate: () => {
        return ipcRenderer.invoke('download-update');
    },
    
    // 安装更新
    installUpdate: () => {
        return ipcRenderer.invoke('install-update');
    },
    
    // 获取更新状态
    getUpdateStatus: () => {
        return ipcRenderer.invoke('get-update-status');
    },
    
    // 监听更新状态变化
    onUpdateStatus: (callback) => {
        ipcRenderer.on('update-status', (event, status) => {
            callback(status);
        });
    },
    
    // 监听下载进度
    onUpdateProgress: (callback) => {
        ipcRenderer.on('update-progress', (event, progress) => {
            callback(progress);
        });
    },
    
    // 退出应用
    quitApp: () => {
        return ipcRenderer.invoke('quit-app');
    },
    
    // 保存文件
    saveFile: (content, defaultPath, filters) => {
        return ipcRenderer.invoke('save-file', { content, defaultPath, filters });
    },
    
    // 获取设备ID
    getDeviceId: () => {
        return ipcRenderer.invoke('get-device-id');
    },
    
    // 删除应用目录下的数据文件
    deleteAppData: () => {
        return ipcRenderer.invoke('delete-app-data');
    }
});

// 向控制台输出信息
console.log('✅ Electron预加载脚本已加载');
console.log('平台:', process.platform);
