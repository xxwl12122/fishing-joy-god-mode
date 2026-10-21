const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

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

    await win.loadFile(path.resolve(__dirname, '../index.html'));
    // 等待 6 秒让 BOSS 降临
    await new Promise(r => setTimeout(r, 6000));

    const image = await win.capturePage();
    const savePath = path.resolve(__dirname, '../screen_boss_verify.png');
    fs.writeFileSync(savePath, image.toPNG());
    console.log('BOSS_SCREENSHOT_SAVED:', savePath);
    process.exit(0);
});
