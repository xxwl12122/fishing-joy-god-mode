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
    // 等待 2 秒让鱼群与炮台完全初始化游动
    await new Promise(r => setTimeout(r, 2000));

    const image = await win.capturePage();
    const savePath = path.resolve(__dirname, '../screen_verify.png');
    fs.writeFileSync(savePath, image.toPNG());
    console.log('SCREENSHOT_SAVED:', savePath);
    process.exit(0);
});
