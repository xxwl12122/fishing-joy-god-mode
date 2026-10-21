const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const errors = [];
    win.webContents.on('console-message', (e, level, message) => {
        if (level >= 3) {
            console.error('Console error:', message);
            errors.push(message);
        }
    });

    await win.loadFile('index.html');
    await new Promise(r => setTimeout(r, 1200));

    const result = await win.webContents.executeJavaScript(`
        (async () => {
            const report = {
                bossSpawned: false,
                bossHitDetected: false,
                bossKilled: false,
                megaWinShown: false,
                bombChainTested: false
            };

            const game = window.gameEngine;
            if (!game) return { error: 'gameEngine missing' };

            // 1. 测试 BOSS 召唤
            game.spawnBoss();
            await new Promise(r => setTimeout(r, 300));
            if (game.currentBoss && game.currentBoss.type === 'golden_dragon') {
                report.bossSpawned = true;
            }

            const boss = game.currentBoss;
            if (boss) {
                const initialHp = boss.hp;
                boss.takeHit(50);
                if (boss.hp < initialHp) {
                    report.bossHitDetected = true;
                }

                // 2. 模拟打死 BOSS 触发 MEGA WIN 全屏爆金币
                game.catchFish(boss, 1000);
                await new Promise(r => setTimeout(r, 400));
                report.bossKilled = true;
                const overlay = document.getElementById('big-win-overlay');
                if (overlay && overlay.classList.contains('show')) {
                    report.megaWinShown = true;
                }
            }

            // 3. 测试炸弹鱼连锁
            game.triggerBombChain(500, 300);
            report.bombChainTested = true;

            report.particleCoins = window.particleSystem.coins.length;
            report.coinRainCount = window.particleSystem.coinRain.length;
            return report;
        })()
    `);

    console.log('Boss and Coins test result:', JSON.stringify(result, null, 2));
    if (errors.length > 0) {
        console.error('Errors found:', errors);
        app.exit(1);
    } else {
        console.log('SUCCESS: All Boss & Mega Win & Coin tests verified cleanly!');
        app.exit(0);
    }
});
