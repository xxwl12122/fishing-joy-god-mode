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
        console.log(`[MSG ${level}] ${msg} (${src}:${line})`);
    });

    await win.loadFile(path.resolve(__dirname, '../index.html'));
    await new Promise(r => setTimeout(r, 1000));

    try {
        await win.webContents.executeJavaScript(`
            try {
                window.gameEngine.spawnBoss();
                const b = window.gameEngine.currentBoss;
                console.log('Boss spawned successfully:', b.type);
            } catch (err) {
                console.error('SPAWN_BOSS_ERROR:', err.stack || err);
            }
        `);
    } catch (err) {
        console.error('EXEC_ERR:', err);
    }

    await new Promise(r => setTimeout(r, 1000));
    process.exit(0);
});
