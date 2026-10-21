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

    win.webContents.on('console-message', (e, level, msg, line, sourceId) => {
        console.log(`[LEVEL ${level}] ${msg} (${sourceId}:${line})`);
    });

    try {
        await win.loadFile(path.resolve(__dirname, '../index.html'));
    } catch (err) {
        console.error('loadFile failed:', err);
    }

    setTimeout(() => {
        process.exit(0);
    }, 2500);
});
