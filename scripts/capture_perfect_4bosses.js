const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:/Users/31328/.gemini/antigravity/brain/ea1a7f2b-4983-4ee3-9ecd-0f158960a196';

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    await win.loadFile(path.resolve(__dirname, '../index.html'));
    await new Promise(r => setTimeout(r, 2200));

    const bossList = [
        { id: 'golden_dragon', name: '远古五爪金龙' },
        { id: 'phantom_dragon', name: '九幽魔煞幽冥骨龙' },
        { id: 'mecha_shark', name: '机械泰坦·终结巨鲨' },
        { id: 'kraken', name: '深海巨妖·克拉肯' }
    ];

    for (const b of bossList) {
        console.log(`Setting up ${b.name} (${b.id})...`);

        await win.webContents.executeJavaScript(`
            (() => {
                const g = window.gameEngine;
                g.spawnRandomFish = () => {};
                g.spawnSchool = () => {};
                g.spawnTimer = -999999;
                g.bossTimer = -999999;

                // 彻底清空 fish 图层中所有遗留的 Pixi 显示对象
                if (window.pixiLayers && window.pixiLayers.fish) {
                    window.pixiLayers.fish.removeChildren();
                }
                g.fishes = [];
                g.currentBoss = null;

                let curve, startT, steps;
                if ('${b.id}' === 'golden_dragon' || '${b.id}' === 'phantom_dragon') {
                    curve = {
                        p0: { x: -60,  y: 380 },
                        p1: { x: 380,  y: 260 },
                        p2: { x: 760,  y: 440 },
                        p3: { x: 1280, y: 320 }
                    };
                    startT = 0.22;
                    steps = 70;
                } else if ('${b.id}' === 'kraken') {
                    curve = {
                        p0: { x: 100,  y: 360 },
                        p1: { x: 450,  y: 340 },
                        p2: { x: 800,  y: 360 },
                        p3: { x: 1180, y: 340 }
                    };
                    startT = 0.40;
                    steps = 30;
                } else {
                    // mecha_shark
                    curve = {
                        p0: { x: 100,  y: 380 },
                        p1: { x: 450,  y: 320 },
                        p2: { x: 800,  y: 380 },
                        p3: { x: 1180, y: 340 }
                    };
                    startT = 0.40;
                    steps = 30;
                }

                const boss = g.spawnFish('${b.id}', curve, startT);
                g.currentBoss = boss;

                for (let s = 0; s < steps; s++) {
                    boss.swimTick += 1;
                    boss.t += 0.003;
                    boss.updatePosition();
                    boss.syncPixiTransform();
                }

                // 强制 PixiJS 立即重绘当前帧
                if (window.pixiApp) {
                    window.pixiApp.render();
                }
            })()
        `);

        await new Promise(r => setTimeout(r, 600));

        const img = await win.capturePage();
        const outPath = path.join(brainDir, `perfect_boss_${b.id}.png`);
        fs.writeFileSync(outPath, img.toPNG());
        console.log(`Captured perfect_boss_${b.id}.png`);
    }

    console.log('All 4 bosses captured perfectly!');
    process.exit(0);
});
