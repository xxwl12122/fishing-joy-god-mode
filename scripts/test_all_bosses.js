const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    await win.loadFile(path.resolve(__dirname, '../index.html'));
    await new Promise(r => setTimeout(r, 1000));

    const res = await win.webContents.executeJavaScript(`
        (() => {
            const g = window.gameEngine;
            const bosses = ['golden_dragon', 'kraken', 'mecha_shark', 'phantom_dragon'];
            const results = {};
            for (const bType of bosses) {
                try {
                    g.spawnBoss(bType);
                    const b = g.currentBoss;
                    b.t = 0.5;
                    b.updatePosition();
                    b.syncPixiTransform();
                    window.pixiApp.renderer.render(window.pixiApp.stage);
                    results[bType] = 'OK';
                    g.currentBoss = null;
                } catch (e) {
                    results[bType] = e.stack || e.toString();
                }
            }
            return results;
        })()
    `);

    console.log('ALL_BOSS_RENDER_RESULTS:', JSON.stringify(res, null, 2));
    process.exit(0);
});
