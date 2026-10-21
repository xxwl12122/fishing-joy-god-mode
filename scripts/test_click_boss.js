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

    win.webContents.on('console-message', (e, level, msg, line, src) => {
        console.log(`[LOG ${level}] ${msg} (${src}:${line})`);
    });

    await win.loadFile(path.resolve(__dirname, '../index.html'));
    await new Promise(r => setTimeout(r, 2000));

    // 点击召唤 BOSS
    console.log('Simulating click on #skill-boss...');
    await win.webContents.executeJavaScript(`
        document.getElementById('skill-boss').click();
    `);

    // 等待 3.5 秒进入画面
    await new Promise(r => setTimeout(r, 3500));

    const img = await win.capturePage();
    fs.writeFileSync(path.resolve(__dirname, '../screen_click_boss.png'), img.toPNG());
    console.log('SCREEN_CLICK_BOSS_SAVED');
    process.exit(0);
});
