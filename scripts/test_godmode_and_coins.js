const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { callDeepSeekTaunt } = require('../ai_boss_service');

ipcMain.handle('ai-boss-taunt', async (event, data) => {
    return await callDeepSeekTaunt(data);
});

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.resolve(__dirname, '../preload.js'),
            backgroundThrottling: false
        }
    });

    const consoleErrors = [];
    win.webContents.on('console-message', (e, level, message) => {
        if (level >= 3) {
            console.error('[Browser Console Error]', message);
            consoleErrors.push(message);
        }
    });

    await win.loadFile(path.resolve(__dirname, '../index.html'));
    await new Promise(r => setTimeout(r, 2000));

    const result = await win.webContents.executeJavaScript(`
        (async () => {
            const report = {
                step1_initial_coins: 0,
                step1_ui_coins_text: '',
                step2_2d_boss_one_shot: false,
                step2_coins_after_kill: 0,
                step3_coins_particles_generated: false,
                step4_3d_mode_active: false,
                step4_3d_one_shot: false,
                step4_3d_coins_updated: false,
                errors: []
            };

            try {
                // 1. 验证初始金币
                report.step1_initial_coins = window.gameEngine.coins;
                report.step1_ui_coins_text = document.getElementById('coin-count').innerText;

                // 2. 召唤 2D BOSS 并发射 1 发子弹测试一枪秒杀
                window.gameEngine.spawnBoss('golden_dragon');
                const boss = window.gameEngine.currentBoss;
                boss.t = 0.5; // 移动到屏幕中心
                boss.updatePosition();

                const initialCoins = window.gameEngine.coins;

                // 瞄准 BOSS 并在 BOSS 当前实际坐标放置子弹
                const bullet = new window.Bullet(boss.x, boss.y, 0, window.gameEngine.cannon.getCurrentConfig(), boss);
                window.gameEngine.bullets.push(bullet);

                // 推进一帧碰撞
                window.gameEngine.update();

                // 验证 BOSS 是否 1 发即死
                if (boss.hp <= 0 && boss.isDying) {
                    report.step2_2d_boss_one_shot = true;
                }
                report.step2_coins_after_kill = window.gameEngine.coins;

                // 验证是否有金币粒子生成
                if (window.particleSystem && window.particleSystem.coins.length > 0) {
                    report.step3_coins_particles_generated = true;
                }

                // 3. 测试 3D 模式一枪秒杀与金币
                if (window.deepSea3D) {
                    window.deepSea3D.activate();
                    await new Promise(r => setTimeout(r, 600));
                    report.step4_3d_mode_active = window.deepSea3D.isActive;

                    const target3D = window.deepSea3D.fishes[0];
                    if (target3D) {
                        const before3DCoins = window.gameEngine.coins;
                        window.deepSea3D.onFishHit(target3D, { x: 0, y: 15, z: 0 });
                        if (target3D.hp <= 0) {
                            report.step4_3d_one_shot = true;
                        }
                        if (window.gameEngine.coins > before3DCoins) {
                            report.step4_3d_coins_updated = true;
                        }
                    }
                }
            } catch (err) {
                report.errors.push(err.message + '\\n' + err.stack);
            }

            return report;
        })()
    `);

    console.log('TEST_RESULT_JSON:' + JSON.stringify({ result, consoleErrors }));
    app.quit();
});
