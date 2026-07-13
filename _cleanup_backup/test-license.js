const SECRET_KEY = 'T3@chS@ck!2024#K3y';
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function computeChecksum(body) {
    let hash = 0;
    for (let i = 0; i < body.length; i++) {
        hash = ((hash << 5) - hash) + body.charCodeAt(i);
        hash |= 0;
    }
    for (let i = 0; i < SECRET_KEY.length; i++) {
        hash = ((hash << 5) - hash) + SECRET_KEY.charCodeAt(i);
        hash |= 0;
    }
    hash = Math.abs(hash);
    
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += CHARS[hash % CHARS.length];
        hash = Math.floor(hash / CHARS.length);
    }
    return result;
}

function generateLicense() {
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    const checksum = computeChecksum(code);
    return code + checksum;
}

function validateLicense(key) {
    if (!key) return false;
    
    const upperKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (upperKey.length !== 16) return false;
    
    const body = upperKey.slice(0, 12);
    const checksum = upperKey.slice(12);
    const computed = computeChecksum(body);
    
    return checksum === computed;
}

console.log('=== 激活码系统测试 ===\n');

const testCodes = [
    generateLicense(),
    generateLicense(),
    generateLicense()
];

console.log('生成的测试激活码:');
testCodes.forEach((code, index) => {
    const formatted = code.slice(0, 4) + '-' + code.slice(4, 8) + '-' + code.slice(8, 12) + '-' + code.slice(12);
    console.log(`${index + 1}. ${formatted}`);
});

console.log('\n验证结果:');
testCodes.forEach((code, index) => {
    const isValid = validateLicense(code);
    console.log(`${index + 1}. ${code} -> ${isValid ? '✅ 有效' : '❌ 无效'}`);
});

const invalidCodes = [
    'ABCD-EFGH-IJKL-MNOP',
    'TEST123456789012',
    '123456789012345',
    ''
];

console.log('\n无效激活码验证:');
invalidCodes.forEach((code, index) => {
    const isValid = validateLicense(code);
    console.log(`${index + 1}. "${code || '(空)'}" -> ${isValid ? '✅ 有效' : '❌ 无效'}`);
});

console.log('\n=== 测试完成 ===');
console.log(`SECRET_KEY: ${SECRET_KEY}`);
console.log(`密钥长度: ${SECRET_KEY.length}`);