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

    const check = await win.webContents.executeJavaScript(`
        (() => {
            const g = window.gameEngine;
            g.spawnBoss();
            const b = g.currentBoss;
            return {
                currentBoss: b ? {
                    type: b.type,
                    x: b.x,
                    y: b.y,
                    t: b.t,
                    isDead: b.isDead,
                    isDying: b.isDying,
                    viewVisible: b.view ? b.view.visible : null,
                    parent: b.view && b.view.parent ? b.view.parent.constructor.name : null,
                    dragonGfxVisible: b.dragonGfx ? b.dragonGfx.visible : null,
                    segments: b.segments ? b.segments.length : null,
                    curve: b.curve
                } : null
            };
        })()
    `);

    console.log('CHECK BOSS RESULT:', JSON.stringify(check, null, 2));
    process.exit(0);
});
