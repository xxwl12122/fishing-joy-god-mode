const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    await win.loadFile(path.resolve(__dirname, '../index.html'));
    await new Promise(r => setTimeout(r, 1200));

    // 强制把 BOSS 推进到屏幕正中央 (t = 0.45) 拍摄验证画面
    await win.webContents.executeJavaScript(`
        (() => {
            const g = window.gameEngine;
            g.spawnBoss();
            if (g.currentBoss) {
                g.currentBoss.t = 0.45;
                g.currentBoss.updatePosition();
                g.currentBoss.syncPixiTransform();
            }
        })()
    `);

    await new Promise(r => setTimeout(r, 200));
    const image = await win.capturePage();
    const savePath = path.resolve(__dirname, '../screen_dragon_centered.png');
    fs.writeFileSync(savePath, image.toPNG());
    console.log('DRAGON_CENTERED_SAVED:', savePath);
    process.exit(0);
});
