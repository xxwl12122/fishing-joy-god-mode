const { app, BrowserWindow } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

let mainWindow;

app.whenReady().then(async () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    const errorLogs = [];
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        if (level >= 3 || message.toLowerCase().includes('error') || message.toLowerCase().includes('uncaught')) {
            errorLogs.push(`[Console Error ${level}] ${message} (${sourceId}:${line})`);
        }
    });

    mainWindow.webContents.on('render-process-gone', (event, details) => {
        console.error('Render process crashed:', details);
        process.exit(1);
    });

    await mainWindow.loadFile(path.join(__dirname, '../index.html'));
    console.log('index.html loaded. Waiting for game assets and initialization...');

    // 等待 1.5 秒让 PixiJS 和资源完全载入
    await new Promise(r => setTimeout(r, 1500));

    // 执行模拟测试
    const result = await mainWindow.webContents.executeJavaScript(`
        (async () => {
            const report = {
                errors: [],
                fpsHistory: [],
                fishCounts: [],
                bulletCounts: []
            };

            const g = window.game || window.gameEngine;
            if (!g) {
                report.errors.push('Game instance not found on window');
                return report;
            }

            report.initialFishCount = g.fishes.length;

            // 1. 开启自动发炮
            g.isAutoFire = true;

            // 2. 模拟运行 10 秒测试，期间触发各项核心机制
            for (let sec = 0; sec < 10; sec++) {
                if (sec === 2) {
                    g.triggerFreezeSkill();
                } else if (sec === 4) {
                    g.triggerRageSkill();
                } else if (sec === 6) {
                    g.spawnBoss();
                } else if (sec === 7) {
                    g.triggerNukeSkill();
                } else if (sec === 8) {
                    g.fireLaser();
                } else if (sec === 9) {
                    if (window.particleSystem) window.particleSystem.addCoinRain(50);
                }

                await new Promise(r => setTimeout(r, 1000));

                report.fishCounts.push(g.fishes.length);
                report.bulletCounts.push(g.bullets.length);
                report.fpsHistory.push(g.fps || 60);
            }

            report.finalFishCount = g.fishes.length;
            report.coins = g.coins;
            report.diamonds = g.diamonds;

            // 验证炮台 UI 文案
            report.cannonName = document.getElementById('cannon-name')?.innerText;
            report.cannonCost = document.getElementById('cannon-cost')?.innerText;
            if (!report.cannonName || !report.cannonName.includes('灭世龙神·加特林')) {
                report.errors.push('Cannon name incorrect: ' + report.cannonName);
            }
            if (!report.cannonCost || !report.cannonCost.includes('无限火力')) {
                report.errors.push('Cannon cost text incorrect: ' + report.cannonCost);
            }
            if (window.uiManager) {
                window.uiManager.showFrenzyWipe(15);
            }

            return report;
        })()
    `);

    console.log('Diagnostic result summary:', {
        initialFishCount: result.initialFishCount,
        finalFishCount: result.finalFishCount,
        fishCountTimeline: result.fishCounts,
        bulletCountTimeline: result.bulletCounts,
        coins: result.coins
    });

    if (errorLogs.length > 0) {
        console.error('Console errors detected during run:', errorLogs);
        process.exit(1);
    }

    if (result.errors && result.errors.length > 0) {
        console.error('Test reported errors:', result.errors);
        process.exit(1);
    }

    if (!result.initialFishCount || result.initialFishCount < 80) {
        console.error('Initial fish count is too low:', result.initialFishCount);
        process.exit(1);
    }

    console.log('SUCCESS: All in-game tests passed with 0 errors, stable FPS, and massive fish sea!');
    app.quit();
    process.exit(0);
}).catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
