const fs = require('fs');
const crypto = require('crypto');

function sha512Of(file) {
  const buf = fs.readFileSync(file);
  return { hash: crypto.createHash('sha512').update(buf).digest('base64'), size: buf.length };
}

// 本地打包元数据
const localYml = fs.readFileSync('dist_newest/latest.yml', 'utf8').trim();
const localVersion = (localYml.match(/version:\s*([\d.]+)/) || [])[1];
const localSha = (localYml.match(/sha512:\s*([A-Za-z0-9+/=]+)/) || [])[1];
const localSize = parseInt((localYml.match(/size:\s*(\d+)/) || [])[1], 10);

// 线上 latest 目录的 latest.yml（自动更新权威源）
const latestDirYml = fs.readFileSync('./_remote_latest_dir.yml', 'utf8').trim();
const latestDirVersion = (latestDirYml.match(/version:\s*([\d.]+)/) || [])[1];
const latestDirSha = (latestDirYml.match(/sha512:\s*([A-Za-z0-9+/=]+)/) || [])[1];
const latestDirSize = parseInt((latestDirYml.match(/size:\s*(\d+)/) || [])[1], 10);

// 线上 v1.2.7 目录的 latest.yml（官网下载源对应）
const v127Yml = fs.readFileSync('./_remote_v127.yml', 'utf8').trim();
const v127Version = (v127Yml.match(/version:\s*([\d.]+)/) || [])[1];

// 线上下载下来的 exe（来自 latest 目录，自动更新实际下载的包）
const dl = sha512Of('./_dl_latest_exe.exe');

console.log('=== 元数据比对 ===');
console.log('本地最新版(latest.yml):     version=' + localVersion + '  size=' + localSize + '  sha512=' + localSha);
console.log('线上 latest 目录 latest.yml: version=' + latestDirVersion + '  size=' + latestDirSize + '  sha512=' + latestDirSha);
console.log('线上 v1.2.7  目录 latest.yml: version=' + v127Version);
console.log('');
console.log('=== 下载的 exe（来自 latest 目录）===');
console.log('落地 size=' + dl.size + '  sha512=' + dl.hash);
console.log('');

let ok = true;
function check(label, cond) { console.log((cond ? '✅ ' : '❌ ') + label); if (!cond) ok = false; }

check('线上 latest dir 的 latest.yml 版本=1.2.7', latestDirVersion === '1.2.7');
check('线上 v1.2.7  dir 的 latest.yml 版本=1.2.7', v127Version === '1.2.7');
check('线上 latest dir 的 sha512 == 本地打包 sha512', latestDirSha === localSha);
check('线上 latest dir 的 size   == 本地打包 size', latestDirSize === localSize);
check('线上下载的 exe sha512 == 本地打包 sha512（逐字节一致）', dl.hash === localSha);
check('线上下载的 exe size  == 本地打包 size', dl.size === localSize);

console.log('');
console.log(ok ? '🎉 全部通过：用户实际下载/自动更新拿到的就是修复后的 1.2.7 真包' : '⚠️ 存在不一致项，见上');
