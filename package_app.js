const packager = require('electron-packager');
const fs = require('fs');
const path = require('path');

// 严格白名单：只允许核心运行时代码与资源进入 asar
const allowedPrefixes = [
  '/index.html',
  '/main.js',
  '/package.json',
  '/css',
  '/js',
  '/images',
  '/assets'
];

function shouldIgnore(file) {
  if (!file || file === '' || file === '/' || file === '\\') {
    return false; // 保留根目录
  }
  const norm = file.replace(/\\/g, '/');
  const allowed = allowedPrefixes.some(p => norm === p || norm.startsWith(p + '/'));
  return !allowed;
}

async function bundle() {
  try {
    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      console.log('Cleaning existing dist directory...');
      fs.rmSync(distDir, { recursive: true, force: true });
    }

    console.log('Packaging lightweight FishingJoy (Windows x64)...');
    const appPaths = await packager({
      dir: '.',
      name: 'FishingJoy',
      platform: 'win32',
      arch: 'x64',
      icon: path.join(__dirname, 'assets', 'icon.ico'),
      out: 'dist',
      overwrite: true,
      asar: true,
      prune: true,
      ignore: shouldIgnore
    });

    console.log('Packaging complete! Output paths:', appPaths);

    const asarPath = path.join(appPaths[0], 'resources', 'app.asar');
    if (fs.existsSync(asarPath)) {
      const stats = fs.statSync(asarPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`Verified app.asar size: ${sizeMB} MB (${stats.size} bytes)`);
    } else {
      console.warn('Warning: app.asar not found at', asarPath);
    }
  } catch (err) {
    console.error('Packaging failed:', err);
    process.exit(1);
  }
}

bundle();
