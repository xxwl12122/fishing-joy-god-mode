/**
 * 捕鱼达人 - PixiJS (WebGL) 核心游戏主引擎 (Game Engine)
 * 采用 PixiJS Application 和 Stage 替换原生 2D Canvas，支持满屏 100+ 条鱼与超高频子弹硬件级合批渲染
 */

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // 初始化 PixiJS WebGL 硬件加速引擎
        this.initPixiApp();

        // 玩家资产与状态 (无敌破解版：无限金币与钻石)
        this.coins = 999999999;
        this.diamonds = 99999;
        this.isFrozen = false;
        this.freezeTimer = 0;

        // 顿帧与打击连击系统
        this.hitstopTimer = 0;
        this.comboCount = 0;
        this.lastCatchTime = 0;

        // 技能开关与状态
        this.isLockMode = false;
        this.lockedFish = null;
        this.isAutoFire = false;
        this.isMouseDown = false;
        this.mousePos = { x: window.innerWidth / 2, y: 100 };

        // 游戏实体队列
        this.fishes = [];
        this.bullets = [];
        this.cannon = null;

        // 鱼群波次刷新计时 (支持满屏 100+ 条鱼狂野鱼海)
        this.spawnTick = 0;
        this.bossTimer = 0;
        this.bossInterval = 3600; // 约 60 秒刷新一次金龙 BOSS

        this.initCannon();
        this.initEvents();
        this.initInitialFishes();

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initPixiApp() {
        this.pixiApp = new PIXI.Application({
            view: this.canvas,
            width: this.width,
            height: this.height,
            backgroundColor: 0x011425,
            autoDensity: true,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            powerPreference: 'high-performance'
        });

        this.bgLayer = new PIXI.Container();
        this.seaweedLayer = new PIXI.Container();
        this.fishLayer = new PIXI.Container();
        this.netLayer = new PIXI.Container();
        this.bulletLayer = new PIXI.Container();
        this.cannonLayer = new PIXI.Container();
        this.laserLayer = new PIXI.Container();
        this.effectLayer = new PIXI.Container();
        this.hudGfx = new PIXI.Graphics();

        this.pixiApp.stage.addChild(this.bgLayer);
        this.pixiApp.stage.addChild(this.seaweedLayer);
        this.pixiApp.stage.addChild(this.fishLayer);
        this.pixiApp.stage.addChild(this.netLayer);
        this.pixiApp.stage.addChild(this.bulletLayer);
        this.pixiApp.stage.addChild(this.cannonLayer);
        this.pixiApp.stage.addChild(this.laserLayer);
        this.pixiApp.stage.addChild(this.effectLayer);
        this.pixiApp.stage.addChild(this.hudGfx);

        window.pixiApp = this.pixiApp;
        window.pixiLayers = {
            bg: this.bgLayer,
            seaweed: this.seaweedLayer,
            fish: this.fishLayer,
            net: this.netLayer,
            bullet: this.bulletLayer,
            cannon: this.cannonLayer,
            laser: this.laserLayer,
            effect: this.effectLayer,
            hud: this.hudGfx
        };

        if (window.gameAssets) {
            window.gameAssets.initPixiTextures();
        }
        if (window.particleSystem) {
            window.particleSystem.initPixiDisplay();
        }
    }

    initCanvasSize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        if (this.pixiApp && this.pixiApp.renderer) {
            this.pixiApp.renderer.resize(this.width, this.height);
        }
        if (this.cannon) {
            this.cannon.x = this.width / 2;
            this.cannon.y = this.height - 35;
        }
    }

    initCannon() {
        this.cannon = new window.Cannon(this.width / 2, this.height - 35);
        this.cannon.setLevel(9); // 无敌破解版：开局即满级【Lv.10 灭世龙神神圣炮】
        this.cannon.laserEnergy = 100;
        if (window.uiManager) {
            window.uiManager.updateCannon(this.cannon.getCurrentConfig());
            window.uiManager.updateCoins(this.coins, true);
            window.uiManager.updateDiamonds(this.diamonds);
            window.uiManager.updateLaser(100);
        }
    }

    initInitialFishes() {
        // 开局即爆发 120+ 条超狂暴鱼海，全屏纵深分布
        this.spawnSchool('yellow_fish', 26, 0.2);
        this.spawnSchool('clown_fish', 22, 0.4);
        this.spawnSchool('blue_tang', 18, 0.6);
        this.spawnSchool('puffer_fish', 14, 0.3);
        for (let i = 0; i < 40; i++) {
            const f = this.spawnRandomFish();
            if (f) {
                f.t = 0.05 + Math.random() * 0.8;
                f.updatePosition();
                f.syncPixiTransform();
            }
        }
    }

    initEvents() {
        window.addEventListener('resize', () => {
            this.initCanvasSize();
            if (window.particleSystem) {
                window.particleSystem.initSeaweeds();
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
            if (!this.lockedFish) {
                this.cannon.aimAt(e.clientX, e.clientY);
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.isMouseDown = true;
                this.tryFire();
            } else if (e.button === 2) {
                // 鼠标右键一键释放极速穿透毁灭激光
                e.preventDefault();
                this.triggerLaserSkill();
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // 滚轮调节炮台威力
        window.addEventListener('wheel', (e) => {
            if (e.deltaY < 0) {
                this.cannon.nextLevel();
            } else {
                this.cannon.prevLevel();
            }
            if (window.uiManager) {
                window.uiManager.updateCannon(this.cannon.getCurrentConfig());
            }
        }, { passive: true });

        // 键盘快捷键监听
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            switch (e.code) {
                case 'Space':
                    this.isMouseDown = true;
                    this.tryFire();
                    break;
                case 'Digit1':
                case 'Numpad1':
                    this.toggleLockSkill();
                    break;
                case 'Digit2':
                case 'Numpad2':
                    this.toggleAutoSkill();
                    break;
                case 'Digit3':
                case 'Numpad3':
                    this.toggleRageSkill();
                    break;
                case 'Digit4':
                case 'Numpad4':
                    this.toggleFreezeSkill();
                    break;
                case 'Digit5':
                case 'Numpad5':
                    this.triggerLaserSkill();
                    break;
                case 'Digit6':
                case 'Numpad6':
                    this.triggerNukeSkill();
                    break;
                case 'Equal':
                case 'NumpadAdd':
                case 'ArrowUp':
                    this.cannon.nextLevel();
                    if (window.uiManager) window.uiManager.updateCannon(this.cannon.getCurrentConfig());
                    break;
                case 'Minus':
                case 'NumpadSubtract':
                case 'ArrowDown':
                    this.cannon.prevLevel();
                    if (window.uiManager) window.uiManager.updateCannon(this.cannon.getCurrentConfig());
                    break;
                case 'KeyH':
                    if (window.uiManager) window.uiManager.openAlmanac();
                    break;
                case 'KeyM':
                    this.toggleMute();
                    break;
                case 'KeyF':
                    this.toggleFullscreen();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isMouseDown = false;
            }
        });

        // 按钮 UI 绑定
        const btnNext = document.getElementById('btn-cannon-next');
        const btnPrev = document.getElementById('btn-cannon-prev');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                this.cannon.nextLevel();
                if (window.uiManager) window.uiManager.updateCannon(this.cannon.getCurrentConfig());
            });
        }
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                this.cannon.prevLevel();
                if (window.uiManager) window.uiManager.updateCannon(this.cannon.getCurrentConfig());
            });
        }

        const skillLock = document.getElementById('skill-lock');
        const skillAuto = document.getElementById('skill-auto');
        const skillRage = document.getElementById('skill-rage');
        const skillFreeze = document.getElementById('skill-freeze');
        const skillLaser = document.getElementById('skill-laser');
        const skillNuke = document.getElementById('skill-nuke');

        if (skillLock) skillLock.addEventListener('click', () => this.toggleLockSkill());
        if (skillAuto) skillAuto.addEventListener('click', () => this.toggleAutoSkill());
        if (skillRage) skillRage.addEventListener('click', () => this.toggleRageSkill());
        if (skillFreeze) skillFreeze.addEventListener('click', () => this.toggleFreezeSkill());
        if (skillLaser) skillLaser.addEventListener('click', () => this.triggerLaserSkill());
        if (skillNuke) skillNuke.addEventListener('click', () => this.triggerNukeSkill());

        const btnAlmanac = document.getElementById('btn-almanac');
        const btnSound = document.getElementById('btn-sound');
        const btnSettings = document.getElementById('btn-settings');
        const btnFullscreen = document.getElementById('btn-fullscreen');

        if (btnAlmanac) btnAlmanac.addEventListener('click', () => window.uiManager.openAlmanac());
        if (btnSound) btnSound.addEventListener('click', () => this.toggleMute());
        if (btnSettings) btnSettings.addEventListener('click', () => window.uiManager.openSettings());
        if (btnFullscreen) btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

        const sfxSlider = document.getElementById('sfx-slider');
        const bgmSlider = document.getElementById('bgm-slider');
        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => {
                if (window.soundManager) window.soundManager.setSfxVolume(parseFloat(e.target.value));
            });
        }
        if (bgmSlider) {
            bgmSlider.addEventListener('input', (e) => {
                if (window.soundManager) window.soundManager.setBgmVolume(parseFloat(e.target.value));
            });
        }
    }

    toggleLockSkill() {
        this.isLockMode = !this.isLockMode;
        const el = document.getElementById('skill-lock');
        if (el) el.classList.toggle('active', this.isLockMode);
        if (!this.isLockMode) {
            this.lockedFish = null;
        } else if (!this.lockedFish) {
            this.lockedFish = this.findHighestValueFish();
        }
    }

    toggleAutoSkill() {
        this.isAutoFire = !this.isAutoFire;
        const el = document.getElementById('skill-auto');
        if (el) el.classList.toggle('active', this.isAutoFire);
    }

    toggleRageSkill() {
        this.cannon.isRageMode = !this.cannon.isRageMode;
        const el = document.getElementById('skill-rage');
        if (el) {
            el.classList.toggle('active', this.cannon.isRageMode);
        }
        if (this.cannon.isRageMode) {
            this.cannon.rageTimer = 99999999;
        } else {
            this.cannon.rageTimer = 0;
        }
    }

    toggleFreezeSkill() {
        this.isFrozen = !this.isFrozen;
        const el = document.getElementById('skill-freeze');
        if (el) {
            el.classList.toggle('active', this.isFrozen);
        }
        if (this.isFrozen) {
            this.freezeTimer = 99999999;
            if (window.soundManager) window.soundManager.playFreeze();
        } else {
            this.freezeTimer = 0;
        }
    }

    triggerFreezeSkill(duration = 480) {
        this.isFrozen = true;
        this.freezeTimer = duration;
        const el = document.getElementById('skill-freeze');
        if (el) el.classList.add('active');
        if (window.soundManager) window.soundManager.playFreeze();
    }

    triggerRageSkill(duration = 600) {
        this.cannon.isRageMode = true;
        this.cannon.rageTimer = duration;
        const el = document.getElementById('skill-rage');
        if (el) el.classList.add('active');
    }

    triggerLaserSkill() {
        this.cannon.isFiringLaser = true;
        this.cannon.laserTimer = this.cannon.laserDuration;
        this.cannon.laserEnergy = 100;
        if (window.soundManager) window.soundManager.playLaser();
        window.uiManager.updateLaser(100);
    }

    fireLaser() {
        return this.triggerLaserSkill();
    }

    // 终极灭世全屏核弹神技 (快捷键 6)
    triggerNukeSkill() {
        this.hitstopTimer = 8;
        if (window.particleSystem) {
            window.particleSystem.addExplosion(this.width / 2, this.height / 2, 600, '#ff0055');
            window.particleSystem.shake(50, 60);
            window.particleSystem.addCoinRain(70);
        }
        if (window.soundManager) {
            window.soundManager.playNuke();
        }

        let totalNukeCoins = 0;
        const currentCost = this.cannon ? this.cannon.getCurrentConfig().cost : 1000;
        for (const f of [...this.fishes]) {
            if (f.isDead || f.isDying) continue;
            if (f.type === 'golden_dragon') {
                f.takeHit(60);
                if (window.uiManager) window.uiManager.updateBossHp(f.hp, f.maxHp);
                if (f.hp <= 0) this.catchFish(f, currentCost);
            } else {
                f.takeHit(999);
                totalNukeCoins += f.score * 80;
                this.catchFish(f, currentCost);
            }
        }

        if (window.uiManager) {
            window.uiManager.showBigWin(Math.max(28888, totalNukeCoins));
        }
    }

    toggleMute() {
        if (window.soundManager) {
            const isMuted = window.soundManager.toggleMute();
            const btn = document.getElementById('btn-sound');
            if (btn) btn.innerText = isMuted ? '🔇' : '🔊';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }

    spawnFish(type, customCurve = null, startT = 0) {
        if (window.fishPool) {
            const fish = window.fishPool.get(type, this.width, this.height, customCurve, startT);
            this.fishes.push(fish);
            return fish;
        }
        const fish = new window.Fish(type, this.width, this.height, customCurve, startT);
        this.fishes.push(fish);
        return fish;
    }

    spawnRandomFish() {
        const types = [
            'yellow_fish', 'yellow_fish', 'yellow_fish',
            'clown_fish', 'clown_fish',
            'blue_tang', 'blue_tang',
            'puffer_fish', 'jellyfish',
            'turtle', 'swordfish',
            'manta_ray', 'hammerhead', 'shark'
        ];

        // 特殊鱼 15% 爆率
        if (Math.random() < 0.15) {
            const specials = ['bomb_fish', 'freeze_fish', 'lightning_eel'];
            const specialType = specials[Math.floor(Math.random() * specials.length)];
            return this.spawnFish(specialType);
        }

        const type = types[Math.floor(Math.random() * types.length)];
        return this.spawnFish(type);
    }

    spawnSchool(type, count = 12, startT = 0) {
        const fromLeft = Math.random() < 0.5;
        const startY = 80 + Math.random() * (this.height - 220);
        const endY = 80 + Math.random() * (this.height - 220);

        for (let i = 0; i < count; i++) {
            // 优化紧密队列，让鱼群更快、更密集地游入屏幕
            const offsetX = (Math.random() - 0.5) * 80 - (fromLeft ? i * 26 : -i * 26);
            const offsetY = (Math.random() - 0.5) * 60;

            const p0 = { x: fromLeft ? -120 + offsetX : this.width + 120 + offsetX, y: startY + offsetY };
            const p3 = { x: fromLeft ? this.width + 120 + offsetX : -120 + offsetX, y: endY + offsetY };
            const p1 = { x: this.width * 0.35, y: startY + (Math.random() - 0.5) * 180 };
            const p2 = { x: this.width * 0.65, y: endY + (Math.random() - 0.5) * 180 };

            this.spawnFish(type, { p0, p1, p2, p3 }, startT);
        }
    }

    spawnBoss() {
        // 清理 30% 低分小鱼
        let removeCount = Math.floor(this.fishes.length * 0.3);
        for (let i = this.fishes.length - 1; i >= 0 && removeCount > 0; i--) {
            if (this.fishes[i].score <= 7 && !this.fishes[i].isDying) {
                if (window.fishPool) window.fishPool.release(this.fishes[i]);
                this.fishes.splice(i, 1);
                removeCount--;
            }
        }

        if (window.soundManager) {
            if (typeof window.soundManager.playBossAlert === 'function') window.soundManager.playBossAlert();
            else if (typeof window.soundManager.playBossWarning === 'function') window.soundManager.playBossWarning();
        }
        if (window.particleSystem) window.particleSystem.shake(25, 45);

        const dragon = this.spawnFish('golden_dragon');
        this.currentBoss = dragon;
        if (window.uiManager) {
            window.uiManager.showBossBanner();
            window.uiManager.showBossHp(dragon.maxHp || 120);
        }

        // 召唤 10 条剑鱼护航编队
        this.spawnSchool('swordfish', 10);
    }

    findHighestValueFish() {
        let best = null;
        let maxScore = -1;
        for (const fish of this.fishes) {
            if (fish.isDead || fish.isDying) continue;
            if (fish.score > maxScore) {
                maxScore = fish.score;
                best = fish;
            }
        }
        return best;
    }

    tryFire() {
        if (!this.cannon) return;
        const cost = this.cannon.getCurrentConfig().cost;

        if (this.isLockMode && (!this.lockedFish || this.lockedFish.isDead || this.lockedFish.isDying)) {
            this.lockedFish = this.findHighestValueFish();
        }

        if (this.lockedFish) {
            this.cannon.aimAt(this.lockedFish.x, this.lockedFish.y);
        } else {
            this.cannon.aimAt(this.mousePos.x, this.mousePos.y);
        }

        const newBullets = this.cannon.shoot(this.lockedFish);
        if (newBullets && newBullets.length > 0) {
            this.bullets.push(...newBullets);
        }
    }

    catchFish(fish, cannonCost = 1) {
        if (fish.isDead || fish.isDying) return;

        fish.startDying();

        // 爽快顿帧
        if (fish.score >= 60 || fish.type === 'golden_dragon') {
            this.hitstopTimer = 3;
        }

        // Combo 连击判定
        const now = performance.now();
        if (now - this.lastCatchTime < 2200) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }
        this.lastCatchTime = now;
        if (window.uiManager) {
            window.uiManager.showCombo(this.comboCount);
        }

        // 金币收益
        const gainedCoins = fish.score * cannonCost;
        this.coins += gainedCoins;
        if (window.uiManager) {
            window.uiManager.updateCoins(this.coins);
        }

        // 震屏与金币飞行
        if (window.particleSystem) {
            const shakePower = Math.min(32, 10 + Math.sqrt(fish.score) * 2.2);
            window.particleSystem.shake(shakePower, 18);

            const targetPos = { x: 260, y: 35 };
            window.particleSystem.addCoin(fish.x, fish.y, targetPos.x, targetPos.y, gainedCoins, Math.min(16, Math.max(4, Math.floor(fish.score / 5))));
            window.particleSystem.addScore(fish.x, fish.y, `+${gainedCoins}`, fish.score >= 100);
        }

        // 远古金龙 BOSS 专属击破奖励：全屏金币暴雨与百万大奖
        if (fish.type === 'golden_dragon') {
            this.currentBoss = null;
            if (window.uiManager) {
                window.uiManager.hideBossHp();
                window.uiManager.showBigWin(38888);
            }
            if (window.particleSystem) {
                window.particleSystem.addCoinRain(85);
                window.particleSystem.shake(45, 60);
                window.particleSystem.addExplosion(fish.x, fish.y, 450, '#ffd700');
            }
        } else if (gainedCoins >= 3000 && window.uiManager) {
            window.uiManager.showBigWin(gainedCoins);
        }

        // 特殊功能鱼连锁
        if (fish.type === 'bomb_fish') {
            this.triggerBombChain(fish.x, fish.y);
        } else if (fish.type === 'freeze_fish') {
            // 彻底关闭被动冰封：捕获海星触发冰晶冲击波并奖励 2000 极寒宝藏金币，绝不打断游动节奏
            // 全屏冰封完全交由玩家按快捷键 4 或点击技能图标手动开启/解冻
            const bonusFreezeCoins = 2000;
            this.coins += bonusFreezeCoins;
            if (window.uiManager) window.uiManager.updateCoins(this.coins);
            if (window.particleSystem) {
                window.particleSystem.addExplosion(fish.x, fish.y, 220, '#00e5ff');
                window.particleSystem.addScore(fish.x, fish.y - 30, `+${bonusFreezeCoins} 极寒宝藏!`, true);
                window.particleSystem.shake(16, 20);
            }
            if (window.soundManager) window.soundManager.playFreeze();
        } else if (fish.type === 'lightning_eel') {
            this.triggerLightningChain(fish);
        }
    }

    triggerBombChain(bx, by) {
        this.hitstopTimer = 4;
        if (window.particleSystem) {
            window.particleSystem.addExplosion(bx, by, 320, '#ff1744');
            window.particleSystem.shake(35, 40);
        }
        if (window.soundManager) window.soundManager.playBomb();

        const bombRadius = 350;
        for (const f of this.fishes) {
            if (f.isDead || f.isDying) continue;
            const dist = Math.hypot(f.x - bx, f.y - by);
            if (dist <= bombRadius) {
                f.takeHit(999);
                this.catchFish(f, this.cannon.getCurrentConfig().cost);
            }
        }
    }

    triggerLightningChain(startFish) {
        const chainCount = 8;
        const struck = [startFish];
        let curr = startFish;

        for (let step = 0; step < chainCount; step++) {
            let next = null;
            let minDist = 400;
            for (const f of this.fishes) {
                if (f.isDead || f.isDying || struck.includes(f)) continue;
                const d = Math.hypot(f.x - curr.x, f.y - curr.y);
                if (d < minDist) {
                    minDist = d;
                    next = f;
                }
            }
            if (next) {
                struck.push(next);
                curr = next;
            } else {
                break;
            }
        }

        if (struck.length > 1) {
            const points = struck.map(f => ({ x: f.x, y: f.y }));
            if (window.particleSystem) window.particleSystem.addLightningChain(points);
            if (window.soundManager) window.soundManager.playCatch(50);

            for (const f of struck) {
                if (f !== startFish) {
                    f.takeHit(999);
                    this.catchFish(f, this.cannon.getCurrentConfig().cost);
                }
            }
        }
    }

    checkLaserCollisions() {
        const length = 1600;
        const laserAngle = this.cannon.angle;
        const x1 = this.cannon.x;
        const y1 = this.cannon.y;
        const x2 = x1 + Math.cos(laserAngle) * length;
        const y2 = y1 + Math.sin(laserAngle) * length;
        const laserWidth = 50;

        for (const fish of this.fishes) {
            if (fish.isDead || fish.isDying) continue;

            const dist = this.distToSegment(fish.x, fish.y, x1, y1, x2, y2);
            if (dist < (fish.width * 0.45 + laserWidth)) {
                if (window.particleSystem) {
                    window.particleSystem.addHitSparks(fish.x, fish.y, 0xff0055);
                }
                if (fish.type === 'golden_dragon') {
                    fish.takeHit(25);
                    if (window.uiManager) {
                        window.uiManager.updateBossHp(fish.hp, fish.maxHp);
                    }
                    if (window.particleSystem) {
                        window.particleSystem.addCoin(fish.x, fish.y, 260, 35, 600, 4);
                        window.particleSystem.addScore(fish.x, fish.y, '+600', false);
                    }
                    if (fish.hp <= 0) {
                        this.catchFish(fish, this.cannon.getCurrentConfig().cost);
                    }
                } else {
                    fish.takeHit(999);
                    this.catchFish(fish, this.cannon.getCurrentConfig().cost);
                }
            }
        }
    }

    distToSegment(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    }

    update() {
        if (this.isAutoFire || this.isMouseDown) {
            this.tryFire();
        }

        this.cannon.update();

        if (this.cannon.isFiringLaser) {
            this.checkLaserCollisions();
        }

        // 冰冻计时
        if (this.isFrozen && this.freezeTimer > 0 && this.freezeTimer < 90000000) {
            this.freezeTimer--;
            if (this.freezeTimer <= 0) {
                this.isFrozen = false;
                const el = document.getElementById('skill-freeze');
                if (el) el.classList.remove('active');
            }
        }

        if (window.particleSystem) {
            window.particleSystem.update(this.isFrozen);
        }

        // 鱼类状态更新
        for (let i = this.fishes.length - 1; i >= 0; i--) {
            const fish = this.fishes[i];
            fish.update(this.isFrozen);
            if (fish.isDead) {
                if (this.lockedFish === fish) {
                    this.lockedFish = this.isLockMode ? this.findHighestValueFish() : null;
                }
                if (window.fishPool) {
                    window.fishPool.release(fish);
                }
                this.fishes.splice(i, 1);
            }
        }

        // 子弹飞行与碰撞检测
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(this.width, this.height);

            if (b.isDead) {
                if (window.bulletPool) {
                    window.bulletPool.release(b);
                }
                this.bullets.splice(i, 1);
                continue;
            }

            let collided = false;
            for (const fish of this.fishes) {
                if (fish.isDead || fish.isDying) continue;
                if (b.targetFish && b.targetFish !== fish) continue;

                if (fish.isHit(b.x, b.y, b.radius)) {
                    collided = true;
                    b.isDead = true;

                    const netRadius = b.levelConfig.netRadius;
                    if (window.particleSystem) {
                        window.particleSystem.addNet(b.x, b.y, netRadius, b.color);
                    }
                    if (window.soundManager) {
                        window.soundManager.playNet();
                    }

                    for (const target of this.fishes) {
                        if (target.isDead || target.isDying) continue;
                        if (target.isHit(b.x, b.y, netRadius)) {
                            if (window.particleSystem) {
                                window.particleSystem.addHitSparks(target.x, target.y, b.colorNum);
                            }
                            if (target.type === 'golden_dragon') {
                                const bossDmg = b.levelConfig.level >= 10 ? 15 : (b.levelConfig.level >= 6 ? 9 : 5);
                                target.takeHit(bossDmg);
                                if (window.uiManager) {
                                    window.uiManager.updateBossHp(target.hp, target.maxHp);
                                }
                                if (window.particleSystem) {
                                    window.particleSystem.addCoin(target.x, target.y, 260, 35, 300, 3);
                                    window.particleSystem.addScore(target.x, target.y, '+300', false);
                                }
                                if (target.hp <= 0) {
                                    this.catchFish(target, b.levelConfig.cost);
                                }
                            } else {
                                target.takeHit(999);
                                this.catchFish(target, b.levelConfig.cost);
                            }
                        }
                    }
                    break;
                }
            }

            if (collided) {
                if (window.bulletPool) {
                    window.bulletPool.release(b);
                }
                this.bullets.splice(i, 1);
            }
        }

        // 鱼群波次刷新 (支持 180 条超狂暴鱼海极速满频生成)
        this.spawnTick++;
        if (this.spawnTick % 6 === 0 && this.fishes.length < 180) {
            this.spawnRandomFish();
        }
        if (this.spawnTick % 55 === 0 && this.fishes.length < 165) {
            const schoolCount = 14 + Math.floor(Math.random() * 10);
            const schoolType = ['yellow_fish', 'clown_fish', 'blue_tang', 'puffer_fish'][Math.floor(Math.random() * 4)];
            this.spawnSchool(schoolType, schoolCount);
        }
        // 应急补鱼机制：若大招或全屏炸弹清屏导致鱼数低于 90，快速补充鱼海
        if (this.fishes.length < 90 && this.spawnTick % 12 === 0) {
            this.spawnSchool(['yellow_fish', 'clown_fish', 'blue_tang'][Math.floor(Math.random() * 3)], 12);
        }

        // BOSS 刷新
        this.bossTimer++;
        if (this.bossTimer >= this.bossInterval) {
            this.bossTimer = 0;
            this.spawnBoss();
        }

        if (window.uiManager) {
            window.uiManager.step();
        }
    }

    renderLockReticle(fish) {
        if (!this.hudGfx) return;
        this.hudGfx.clear();
        if (!fish || fish.isDead) return;

        const isBoss = fish.score >= 100 || fish.type === 'golden_dragon';
        const color = isBoss ? 0xff1744 : 0x00e5ff;
        const r = Math.max(34, fish.width * 0.65);
        const now = Date.now() * 0.003;

        // 1. 激光引线
        this.hudGfx.lineStyle(1.8, color, 0.45);
        this.hudGfx.moveTo(this.cannon.x, this.cannon.y);
        this.hudGfx.lineTo(fish.x, fish.y);

        // 2. 旋转全息瞄准环
        this.hudGfx.lineStyle(2.5, color, 0.85);
        this.hudGfx.drawCircle(fish.x, fish.y, r + 8);

        // 齿轮凸起标记
        for (let i = 0; i < 4; i++) {
            const a = now + (i * Math.PI) / 2;
            this.hudGfx.moveTo(fish.x + Math.cos(a) * (r + 4), fish.y + Math.sin(a) * (r + 4));
            this.hudGfx.lineTo(fish.x + Math.cos(a) * (r + 14), fish.y + Math.sin(a) * (r + 14));
        }

        // 四角锁定括号 [ ]
        const bSize = r + 16;
        const bLen = 12;
        this.hudGfx.lineStyle(3, color, 0.95);
        this.hudGfx.moveTo(fish.x - bSize, fish.y - bSize + bLen);
        this.hudGfx.lineTo(fish.x - bSize, fish.y - bSize);
        this.hudGfx.lineTo(fish.x - bSize + bLen, fish.y - bSize);

        this.hudGfx.moveTo(fish.x + bSize - bLen, fish.y - bSize);
        this.hudGfx.lineTo(fish.x + bSize, fish.y - bSize);
        this.hudGfx.lineTo(fish.x + bSize, fish.y - bSize + bLen);

        this.hudGfx.moveTo(fish.x + bSize, fish.y + bSize - bLen);
        this.hudGfx.lineTo(fish.x + bSize, fish.y + bSize);
        this.hudGfx.lineTo(fish.x + bSize - bLen, fish.y + bSize);

        this.hudGfx.moveTo(fish.x - bSize + bLen, fish.y + bSize);
        this.hudGfx.lineTo(fish.x - bSize, fish.y + bSize);
        this.hudGfx.lineTo(fish.x - bSize, fish.y + bSize - bLen);
    }

    render() {
        if (window.particleSystem) {
            window.particleSystem.syncPixi(this.width, this.height, this.fishes.length);
        }

        if (this.isLockMode && this.lockedFish) {
            this.renderLockReticle(this.lockedFish);
        } else if (this.hudGfx) {
            this.hudGfx.clear();
        }
    }

    gameLoop(timestamp) {
        if (this.hitstopTimer > 0) {
            this.hitstopTimer--;
            this.render();
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        try {
            this.update();
            this.render();
        } catch (err) {
            console.error('Safe recovery from gameLoop error:', err);
        }
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
    window.game = window.gameEngine;

    const initAudioTrigger = () => {
        if (window.soundManager) {
            window.soundManager.init();
        }
        window.removeEventListener('click', initAudioTrigger);
        window.removeEventListener('keydown', initAudioTrigger);
    };
    window.addEventListener('click', initAudioTrigger);
    window.addEventListener('keydown', initAudioTrigger);
});
