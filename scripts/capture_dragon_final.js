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

    await win.webContents.executeJavaScript(`
        (() => {
            const g = window.gameEngine;
            g.spawnBoss('golden_dragon');
            const d = g.currentBoss;
            if (d) {
                d.t = 0.35;
                for (let k = 0; k < 30; k++) {
                    d.updatePosition();
                }
                d.syncPixiTransform();
            }
        })()
    `);

    // 给一帧渲染
    await new Promise(r => setTimeout(r, 400));
    const img = await win.capturePage();
    fs.writeFileSync(path.resolve(__dirname, '../screen_dragon_final.png'), img.toPNG());
    console.log('DRAGON_FINAL_SAVED');
    process.exit(0);
});
