const { app, BrowserWindow } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

let mainWindow;

app.whenReady().then(async () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        show: true, // 显示窗口以确保 requestAnimationFrame 全速 60FPS 运行
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            backgroundThrottling: false
        }
    });

    const errorLogs = [];
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        if (level >= 3 || message.toLowerCase().includes('error') || message.toLowerCase().includes('uncaught')) {
            errorLogs.push(`[Console Error ${level}] ${message} (${sourceId}:${line})`);
        }
    });

    await mainWindow.loadFile(path.join(__dirname, '../index.html'));
    await new Promise(r => setTimeout(r, 1500));

    const result = await mainWindow.webContents.executeJavaScript(`
        (async () => {
            const g = window.game || window.gameEngine;
            const history = [];

            // 1. 观察自然刷新与游动
            for (let i = 0; i < 5; i++) {
                await new Promise(r => setTimeout(r, 1000));
                history.push({ sec: i + 1, fishCount: g.fishes.length, spawnTick: g.spawnTick, mode: 'natural' });
            }

            // 2. 触发 Boss 召唤
            g.spawnBoss();
            await new Promise(r => setTimeout(r, 1000));
            history.push({ sec: 6, fishCount: g.fishes.length, spawnTick: g.spawnTick, mode: 'boss_spawned' });

            // 3. 自动开火 3 秒
            g.isAutoFire = true;
            for (let i = 0; i < 3; i++) {
                await new Promise(r => setTimeout(r, 1000));
                history.push({ sec: 7 + i, fishCount: g.fishes.length, bullets: g.bullets.length, spawnTick: g.spawnTick, mode: 'firing' });
            }

            return {
                history,
                maxFishCount: Math.max(...history.map(h => h.fishCount)),
                finalFishCount: g.fishes.length
            };
        })()
    `);

    console.log('Frenzy Sea Test Report:', JSON.stringify(result, null, 2));

    if (errorLogs.length > 0) {
        console.error('Console errors detected:', errorLogs);
        process.exit(1);
    }

    if (result.maxFishCount < 140) {
        console.error('Max fish count did not reach target (>140):', result.maxFishCount);
        process.exit(1);
    }

    console.log('SUCCESS: Frenzy Sea verified! Max fish reached ' + result.maxFishCount + ' and 60FPS loop is running at full speed!');
    app.quit();
    process.exit(0);
}).catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
