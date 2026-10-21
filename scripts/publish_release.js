const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

function getGitHubToken() {
    try {
        const out = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n' }).toString();
        const match = out.match(/password=(.+)/);
        if (match && match[1]) {
            return match[1].trim();
        }
    } catch (e) {
        console.error('Failed to get token from git credential:', e);
    }
    return process.env.GITHUB_TOKEN || null;
}

function curlApi(url, method = 'GET', data = null, extraHeaders = []) {
    const token = getGitHubToken();
    const args = [
        '--proxy', 'http://127.0.0.1:7897',
        '-s', '-S',
        '-X', method,
        '-H', `Authorization: Bearer ${token}`,
        '-H', 'User-Agent: Release-Manager',
        '-H', 'Accept: application/vnd.github.v3+json',
        ...extraHeaders
    ];

    if (data) {
        args.push('-H', 'Content-Type: application/json');
        args.push('-d', JSON.stringify(data));
    }
    args.push(url);

    try {
        const out = execFileSync('curl.exe', args).toString();
        if (!out || out.trim() === '') return {};
        return JSON.parse(out);
    } catch (e) {
        console.error(`curlApi error:`, e.message);
        throw e;
    }
}

async function main() {
    const token = getGitHubToken();
    if (!token) {
        console.error('Error: GitHub token not found.');
        process.exit(1);
    }

    const owner = 'xxwl12122';
    const repo = 'fishing-joy-god-mode';
    const pkg = require('../package.json');
    const tag = `v${pkg.version || '1.0.0'}`;
    const zipName = `FishingJoy-${tag}-Windows-x64.zip`;
    const zipPath = path.resolve(__dirname, '..', zipName);

    console.log(`Checking package: ${zipName}...`);
    if (fs.existsSync(zipPath)) {
        console.log(`Removing old zip file: ${zipName}...`);
        fs.unlinkSync(zipPath);
    }
    console.log(`Packaging lightweight zip from dist/FishingJoy-win32-x64...`);
    execSync(`tar -acf "${zipName}" -C "dist/FishingJoy-win32-x64" .`, { stdio: 'inherit' });
    const zipStats = fs.statSync(zipPath);
    console.log(`New slim zip created: ${(zipStats.size / (1024 * 1024)).toFixed(2)} MB`);

    console.log(`Fetching release for ${tag}...`);
    let release;
    try {
        release = curlApi(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`);
        if (!release || !release.id) throw new Error('Not found');
    } catch {
        console.log(`Creating release ${tag}...`);
        release = curlApi(`https://api.github.com/repos/${owner}/${repo}/releases`, 'POST', {
            tag_name: tag,
            target_commitish: 'main',
            name: `${tag} - 捕鱼达人 (Fishing Joy) ⚡ 无限无敌破解版 (Windows EXE)`,
            body: `## 🌊 捕鱼达人 (Fishing Joy) - ⚡ 无限无敌破解版 (GOD MODE)

### 🎮 Windows 桌面绿色免安装版
- 下载下方 **Assets** 中的 \`${zipName}\`
- 解压后双击 \`FishingJoy.exe\` 或 \`捕鱼达人.exe\` 即可直接全屏畅玩！无需安装任何环境！`,
            draft: false,
            prerelease: false
        });
    }

    console.log(`Release ready (id: ${release.id}). Checking existing assets...`);
    if (release.assets && release.assets.length > 0) {
        for (const asset of release.assets) {
            if (asset.name === zipName) {
                console.log(`Deleting existing release asset ${asset.name} (id: ${asset.id})...`);
                try {
                    curlApi(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset.id}`, 'DELETE');
                    console.log(`Old asset deleted.`);
                } catch (e) {
                    console.warn(`Failed to delete old asset:`, e.message);
                }
            }
        }
    }

    console.log(`Uploading asset ${zipName} (${(zipStats.size / (1024 * 1024)).toFixed(2)} MB)...`);
    const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(zipName)}`;

    const uploadArgs = [
        '--proxy', 'http://127.0.0.1:7897',
        '-s', '-S',
        '-X', 'POST',
        '-H', `Authorization: Bearer ${token}`,
        '-H', 'Content-Type: application/zip',
        '-H', 'Accept: application/vnd.github.v3+json',
        '-T', zipPath,
        uploadUrl
    ];

    const result = execFileSync('curl.exe', uploadArgs, { maxBuffer: 1024 * 1024 * 50 }).toString();
    console.log(`Upload complete!`);
    const assetJson = JSON.parse(result);
    console.log(`New asset online: ID ${assetJson.id}, Size: ${(assetJson.size / (1024 * 1024)).toFixed(2)} MB`);
}

main().catch(console.error);
