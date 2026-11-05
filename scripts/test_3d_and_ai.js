const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { callDeepSeekTaunt } = require('../ai_boss_service');

ipcMain.handle('ai-boss-taunt', async (event, data) => {
    return await callDeepSeekTaunt(data);
});

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: true,
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
            console.error('[Browser Error]', message);
            consoleErrors.push(message);
        } else {
            console.log('[Browser Log]', message);
        }
    });

    await win.loadFile(path.resolve(__dirname, '../index.html'));
    await new Promise(r => setTimeout(r, 1800));

    const testReport = await win.webContents.executeJavaScript(`
        (async () => {
            const report = {
                electronApiReady: false,
                aiBossTauntResult: null,
                speechSynthesisAvailable: false,
                threeLoaded: false,
                sceneCreated: false,
                fishCount3D: 0,
                hasBoss3D: false,
                projectileFired: false,
                fps3D: 0,
                errors: []
            };

            try {
                // 1. 验证 IPC 通信与 AI 暴躁 BOSS 服务
                if (window.electronAPI && typeof window.electronAPI.requestBossTaunt === 'function') {
                    report.electronApiReady = true;
                    const taunt = await window.electronAPI.requestBossTaunt({
                        bossName: '远古金龙',
                        score: 88888,
                        eventType: 'hit',
                        bossHpPercent: 75
                    });
                    report.aiBossTauntResult = taunt;
                }

                // 2. 验证 SpeechSynthesis 与气泡
                report.speechSynthesisAvailable = ('speechSynthesis' in window);
                if (window.aiBoss) {
                    window.aiBoss.showBubble('远古金龙 (BOSS)', report.aiBossTauntResult || '测试吐槽台词', 640, 200);
                    window.aiBoss.speakTaunt(report.aiBossTauntResult || '测试吐槽台词');
                }

                // 3. 验证 Three.js 核心库
                if (typeof window.THREE !== 'undefined' && typeof window.THREE.Scene === 'function') {
                    report.threeLoaded = true;
                }

                // 4. 激活 3D 第一人称场景
                const d3 = window.deepSea3D;
                if (!d3) throw new Error("window.deepSea3D missing");

                d3.activate();
                await new Promise(r => setTimeout(r, 300));

                if (d3.scene && d3.camera && d3.renderer) {
                    report.sceneCreated = true;
                    report.fishCount3D = d3.fishes.length;
                    report.hasBoss3D = !!d3.boss3D;
                }

                // 5. 视角正对前方游动的 3D 鱼群与远古金龙
                d3.yaw = 0.0;
                d3.pitch = 0.02;
                d3.updateCameraRotation();

                d3.fireProjectile();
                if (d3.projectiles.length > 0) {
                    report.projectileFired = true;
                }

                // 6. 运行 40 帧 3D 渲染并采样性能
                let t0 = performance.now();
                for (let f = 0; f < 30; f++) {
                    await new Promise(r => setTimeout(r, 16));
                }
                let dt = performance.now() - t0;
                report.fps3D = Math.round(30 / (dt / 1000));

            } catch (err) {
                report.errors.push(err.message + "\\n" + err.stack);
            }

            return report;
        })()
    `);

    console.log('--- 3D & AI BOSS TEST REPORT ---');
    console.log(JSON.stringify(testReport, null, 2));

    await new Promise(r => setTimeout(r, 500));
    const image = await win.capturePage();
    const screenshotPath = path.resolve(__dirname, '../screen_3d_verify.png');
    fs.writeFileSync(screenshotPath, image.toPNG());
    console.log('Screenshot saved to:', screenshotPath);

    if (consoleErrors.length > 0 || (testReport.errors && testReport.errors.length > 0)) {
        console.error('Test finished with errors!');
        process.exit(1);
    } else {
        console.log('3D FIRST-PERSON SCENE & AI BOSS TAUNT TEST PASSED!');
        process.exit(0);
    }
});
