const fs = require('fs');
const path = require('path');

const DATA_KEYS = [
    'classRoster', 'statsScores', 'punishmentList', 'settings', 
    'quizCustomQuestions', 'calledStudents', 'theme', 'animationSpeed',
    'license_list', 'trial_license', 'trial_count'
];
const LICENSE_KEYS_PATTERN = /^license_device_/;

let mockLocalStorage = {};
let mockAppDirData = null;

function getItem(key) {
    return mockLocalStorage[key] || null;
}

function setItem(key, value) {
    mockLocalStorage[key] = value;
    autoSaveToAppDir();
}

function removeItem(key) {
    delete mockLocalStorage[key];
}

function keys() {
    return Object.keys(mockLocalStorage);
}

function autoSaveToAppDir() {
    const backupData = {
        version: '1.2.4',
        exportTime: new Date().toISOString(),
        data: {}
    };

    DATA_KEYS.forEach(key => {
        const value = getItem(key);
        if (value !== null) {
            backupData.data[key] = value;
        }
    });
    
    for (const key of keys()) {
        if (key && LICENSE_KEYS_PATTERN.test(key)) {
            backupData.data[key] = getItem(key);
        }
    }
    
    mockAppDirData = backupData;
}

function autoLoadFromAppDir() {
    if (mockAppDirData && mockAppDirData.data) {
        let loadedCount = 0;
        const originalSetItem = setItem;
        setItem = function(key, value) {
            mockLocalStorage[key] = value;
        };
        
        DATA_KEYS.forEach(key => {
            if (mockAppDirData.data[key] !== undefined) {
                setItem(key, mockAppDirData.data[key]);
                loadedCount++;
            }
        });
        Object.keys(mockAppDirData.data).forEach(key => {
            if (LICENSE_KEYS_PATTERN.test(key)) {
                setItem(key, mockAppDirData.data[key]);
                loadedCount++;
            }
        });
        
        setItem = originalSetItem;
        
        console.log(`从应用目录加载了 ${loadedCount} 项数据`);
    }
}

function setupTestData() {
    const rosterData = JSON.stringify([
        { id: 1, name: '张三', gender: '男' },
        { id: 2, name: '李四', gender: '女' },
        { id: 3, name: '王五', gender: '男' },
        { id: 4, name: '赵六', gender: '女' }
    ]);
    
    setItem('classRoster', rosterData);
    setItem('trial_license', 'TEST');
    setItem('trial_count', '0');
    setItem('license_device_TEST', 'test_device_12345');
    setItem('theme', '"dark"');
    setItem('settings', JSON.stringify({ volume: 0.8, animationSpeed: 'normal' }));
    
    console.log('\n📦 步骤1：设置模拟数据完成！');
    console.log('模拟的应用目录数据:', JSON.stringify(mockAppDirData, null, 2));
}

function checkStatus(label) {
    console.log(`\n📊 ${label}:`);
    console.log('localStorage 内容:', JSON.stringify(mockLocalStorage, null, 2));
    console.log('应用目录数据存在:', mockAppDirData ? '是' : '否');
}

function executeReset() {
    console.log('\n🗑️ 步骤3：执行重置数据');
    
    const licenseData = {};
    DATA_KEYS.forEach(key => {
        if (key === 'trial_license' || key === 'trial_count' || key === 'license_list') {
            const value = getItem(key);
            if (value !== null) {
                licenseData[key] = value;
            }
        }
    });
    for (const key of keys()) {
        if (key && LICENSE_KEYS_PATTERN.test(key)) {
            licenseData[key] = getItem(key);
        }
    }
    
    console.log('备份的激活码数据:', JSON.stringify(licenseData, null, 2));
    
    mockAppDirData = null;
    
    const allKeys = keys();
    allKeys.forEach(key => {
        removeItem(key);
    });
    
    Object.keys(licenseData).forEach(key => {
        setItem(key, licenseData[key]);
    });
    
    console.log('重置后的应用目录数据:', JSON.stringify(mockAppDirData, null, 2));
}

function verifyResult() {
    console.log('\n✅ 步骤4：验证结果');
    
    const result = {
        classRoster: getItem('classRoster'),
        trialLicense: getItem('trial_license'),
        trialCount: getItem('trial_count'),
        licenseDevice: getItem('license_device_TEST'),
        otherData: {}
    };

    DATA_KEYS.forEach(key => {
        if (key !== 'classRoster' && key !== 'trial_license' && key !== 'trial_count') {
            result.otherData[key] = getItem(key);
        }
    });
    
    console.log('验证数据:', JSON.stringify(result, null, 2));
    
    let summary = '\n验证结果:\n\n';
    let allPassed = true;

    if (!result.classRoster) {
        summary += '✅ 学生名单已清空\n';
    } else {
        summary += '❌ 学生名单未清空！\n';
        allPassed = false;
    }

    if (result.trialLicense === 'TEST') {
        summary += '✅ 激活码已保留\n';
    } else {
        summary += '❌ 激活码丢失！\n';
        allPassed = false;
    }

    if (result.trialCount === '0') {
        summary += '✅ 试用次数已保留\n';
    } else {
        summary += '❌ 试用次数丢失！\n';
        allPassed = false;
    }

    if (result.licenseDevice === 'test_device_12345') {
        summary += '✅ 设备绑定已保留\n';
    } else {
        summary += '❌ 设备绑定丢失！\n';
        allPassed = false;
    }

    const otherKeys = Object.keys(result.otherData).filter(k => result.otherData[k] !== null);
    if (otherKeys.length === 0) {
        summary += '✅ 其他数据已清空\n';
    } else {
        summary += '❌ 以下数据未清空: ' + otherKeys.join(', ') + '\n';
        allPassed = false;
    }

    summary += '\n' + (allPassed ? '🎉 所有测试通过！' : '⚠️ 部分测试未通过！');
    
    console.log(summary);
    
    return allPassed;
}

function testWithAppDirRestore() {
    console.log('\n\n========================================');
    console.log('测试场景：重置后重启应用（模拟应用目录恢复）');
    console.log('========================================');
    
    mockLocalStorage = {};
    mockAppDirData = null;
    
    setupTestData();
    checkStatus('重置前状态');
    executeReset();
    checkStatus('重置后状态');
    
    console.log('\n🔄 模拟重启应用，从应用目录恢复数据...');
    mockLocalStorage = {};
    autoLoadFromAppDir();
    
    checkStatus('重启后状态');
    verifyResult();
}

console.log('========================================');
console.log('重置数据功能测试');
console.log('========================================');

testWithAppDirRestore();