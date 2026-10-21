const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    // 隐藏默认菜单栏
    Menu.setApplicationMenu(null);

    // 游戏窗口与任务栏图标
    const appIcon = path.join(__dirname, 'assets', 'icon.ico');

    // 创建全屏游戏窗口
    const mainWindow = new BrowserWindow({
        title: '捕鱼达人 (Fishing Joy) - ⚡ 无敌破解版 (GOD MODE) ⚡',
        width: 1280,
        height: 720,
        fullscreen: true, // 启动时直接全屏
        autoHideMenuBar: true,
        backgroundColor: '#011425',
        icon: appIcon,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false // 确保后台不掉帧
        }
    });

    // 载入游戏主页
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // 页面准备好后再平滑展示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 快捷键支持：按 F11 切换全屏，按 ESC 退出全屏模式
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown') {
            if (input.key === 'F11') {
                mainWindow.setFullScreen(!mainWindow.isFullScreen());
                event.preventDefault();
            } else if (input.key === 'Escape' && mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(false);
                event.preventDefault();
            }
        }
    });
}

// 应用程序就绪后创建窗口
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 所有窗口关闭后退出程序
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
