const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    win.webContents.on('console-message', (e, level, msg, line, src) => {
        console.log(`[CONSOLE ${level}] ${msg} (${src}:${line})`);
    });

    await win.loadFile(path.resolve(__dirname, '../index.html'));
    await new Promise(r => setTimeout(r, 1000));

    const err = await win.webContents.executeJavaScript(`
        (() => {
            const g = window.gameEngine;
            g.spawnBoss('golden_dragon');
            const d = g.currentBoss;
            try {
                d.t = 0.5;
                d.updatePosition();
                d.syncPixiTransform();
                // 强制触发一次 pixi 渲染
                window.pixiApp.renderer.render(window.pixiApp.stage);
                return 'SUCCESS_RENDER';
            } catch (e) {
                return e.stack || e.toString();
            }
        })()
    `);

    console.log('RENDER_RESULT:', err);
    process.exit(0);
});
