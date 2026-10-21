/**
 * 捕鱼达人 - 核心游戏主引擎 (Game Engine)
 * 整合碰撞检测、捕获概率概率学运算、鱼群生态波次调度与特技连锁
 */

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

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

        // 鱼群波次刷新计时
        this.spawnTick = 0;
        this.bossTimer = 0;
        this.bossInterval = 3600; // 约 60 秒刷新一次金龙 BOSS

        this.initCanvasSize();
        this.initCannon();
        this.initEvents();
        this.initInitialFishes();

        // 启动主循环
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initCanvasSize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

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
        // 开局狂野鱼海：直接生成 2 大编队鱼群与巡游大鱼
        this.spawnSchool('yellow_fish', 12);
        this.spawnSchool('clown_fish', 10);
        for (let i = 0; i < 15; i++) {
            this.spawnRandomFish();
        }
    }

    // 事件监听绑定
    initEvents() {
        window.addEventListener('resize', () => {
            this.initCanvasSize();
            if (window.particleSystem) {
                window.particleSystem.initSeaweeds();
            }
        });

        // 鼠标移动瞄准
        this.canvas.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
            if (!this.lockedFish) {
                this.cannon.aimAt(e.clientX, e.clientY);
            }
        });

        // 鼠标按下发射
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // 仅左键
            this.isMouseDown = true;

            // 如果处于锁定模式，检查是否点击到了具体鱼进行锁定
            if (this.isLockMode) {
                const clickedFish = this.getFishAt(e.clientX, e.clientY);
                if (clickedFish) {
                    this.lockedFish = clickedFish;
                    return;
                }
            }

            this.tryFire();
        });

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // 滚轮切换炮台威力
        window.addEventListener('wheel', (e) => {
            if (e.deltaY < 0) {
                this.cannon.nextLevel();
            } else {
                this.cannon.prevLevel();
            }
            window.uiManager.updateCannon(this.cannon.getCurrentConfig());
        }, { passive: true });

        // 键盘快捷键监听
        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case ' ':
                    this.tryFire();
                    break;
                case '+':
                case '=':
                case 'ArrowUp':
                case 'ArrowRight':
                    this.cannon.nextLevel();
                    window.uiManager.updateCannon(this.cannon.getCurrentConfig());
                    break;
                case '-':
                case '_':
                case 'ArrowDown':
                case 'ArrowLeft':
                    this.cannon.prevLevel();
                    window.uiManager.updateCannon(this.cannon.getCurrentConfig());
                    break;
                case '1':
                    this.toggleLockSkill();
                    break;
                case '2':
                    this.toggleAutoSkill();
                    break;
                case '3':
                    this.toggleRageSkill();
                    break;
                case '4':
                    this.toggleFreezeSkill();
                    break;
                case '5':
                    this.triggerLaserSkill();
                    break;
                case 'm':
                case 'M':
                    this.toggleMute();
                    break;
                case 'f':
                case 'F':
                    this.toggleFullscreen();
                    break;
                case 'h':
                case 'H':
                    window.uiManager.openAlmanac();
                    break;
            }
        });

        // 移动端触摸支持
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            if (touch) {
                this.mousePos.x = touch.clientX;
                this.mousePos.y = touch.clientY;
                if (!this.lockedFish) {
                    this.cannon.aimAt(touch.clientX, touch.clientY);
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            if (touch) {
                this.mousePos.x = touch.clientX;
                this.mousePos.y = touch.clientY;
                this.cannon.aimAt(touch.clientX, touch.clientY);
                this.tryFire();
            }
        });

        // UI 按钮绑定
        this.bindUIButtons();
    }

    bindUIButtons() {
        const btnPrev = document.getElementById('btn-cannon-prev');
        const btnNext = document.getElementById('btn-cannon-next');
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                this.cannon.prevLevel();
                window.uiManager.updateCannon(this.cannon.getCurrentConfig());
            });
        }
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                this.cannon.nextLevel();
                window.uiManager.updateCannon(this.cannon.getCurrentConfig());
            });
        }

        // 技能按钮
        const skillLock = document.getElementById('skill-lock');
        const skillAuto = document.getElementById('skill-auto');
        const skillRage = document.getElementById('skill-rage');
        const skillFreeze = document.getElementById('skill-freeze');
        const skillLaser = document.getElementById('skill-laser');

        if (skillLock) skillLock.addEventListener('click', () => this.toggleLockSkill());
        if (skillAuto) skillAuto.addEventListener('click', () => this.toggleAutoSkill());
        if (skillRage) skillRage.addEventListener('click', () => this.toggleRageSkill());
        if (skillFreeze) skillFreeze.addEventListener('click', () => this.toggleFreezeSkill());
        if (skillLaser) skillLaser.addEventListener('click', () => this.triggerLaserSkill());

        // 顶部按钮
        const btnAlmanac = document.getElementById('btn-almanac');
        const btnSound = document.getElementById('btn-sound');
        const btnSettings = document.getElementById('btn-settings');
        const btnFullscreen = document.getElementById('btn-fullscreen');

        if (btnAlmanac) btnAlmanac.addEventListener('click', () => window.uiManager.openAlmanac());
        if (btnSound) btnSound.addEventListener('click', () => this.toggleMute());
        if (btnSettings) btnSettings.addEventListener('click', () => window.uiManager.openSettings());
        if (btnFullscreen) btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

        // 救济金领取
        const btnClaim = document.getElementById('btn-claim-rescue');
        if (btnClaim) {
            btnClaim.addEventListener('click', () => {
                this.coins += 300;
                window.uiManager.updateCoins(this.coins);
                window.uiManager.closeRescueModal();
                if (window.soundManager) {
                    window.soundManager.playCatch(20);
                }
            });
        }

        // 音量滑块
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
            // 默认自动锁屏上最高分值的鱼
            this.lockedFish = this.findHighestValueFish();
        }
    }

    toggleAutoSkill() {
        this.isAutoFire = !this.isAutoFire;
        const el = document.getElementById('skill-auto');
        if (el) el.classList.toggle('active', this.isAutoFire);
    }

    toggleRageSkill() {
        // 无敌破解版：狂暴模式开关切换 (开启 / 随时取消)
        this.cannon.isRageMode = !this.cannon.isRageMode;
        const el = document.getElementById('skill-rage');
        if (el) {
            el.classList.toggle('active', this.cannon.isRageMode);
        }
        if (this.cannon.isRageMode) {
            this.cannon.rageTimer = 99999999; // 常驻持续
        } else {
            this.cannon.rageTimer = 0; // 立即取消狂暴
        }
    }

    triggerRageSkill() {
        this.toggleRageSkill();
    }

    toggleFreezeSkill() {
        // 无敌破解版：极寒冰封开关切换 (冰封 / 随时解冻取消)
        this.isFrozen = !this.isFrozen;
        const el = document.getElementById('skill-freeze');
        if (el) {
            el.classList.toggle('active', this.isFrozen);
        }
        if (this.isFrozen) {
            this.freezeTimer = 99999999; // 常驻冰封
            if (window.soundManager) window.soundManager.playFreeze();
        } else {
            this.freezeTimer = 0; // 立即解冻恢复
        }
    }

    triggerFreezeSkill() {
        this.toggleFreezeSkill();
    }

    triggerLaserSkill() {
        // 无敌破解版：毁灭激光无限无冷却发射
        this.cannon.isFiringLaser = true;
        this.cannon.laserTimer = this.cannon.laserDuration;
        this.cannon.laserEnergy = 100;
        if (window.soundManager) window.soundManager.playLaser();
        window.uiManager.updateLaser(100);
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

    findHighestValueFish() {
        let best = null;
        let maxScore = -1;
        for (const f of this.fishes) {
            if (!f.isDead && !f.isDying && f.score > maxScore) {
                maxScore = f.score;
                best = f;
            }
        }
        return best;
    }

    getFishAt(x, y) {
        for (let i = this.fishes.length - 1; i >= 0; i--) {
            const f = this.fishes[i];
            if (!f.isDead && !f.isDying && f.isHit(x, y, 15)) {
                return f;
            }
        }
        return null;
    }

    tryFire() {
        const cfg = this.cannon.getCurrentConfig();

        // 跟踪锁定目标
        if (this.lockedFish) {
            if (this.lockedFish.isDead || this.lockedFish.isDying) {
                this.lockedFish = this.isLockMode ? this.findHighestValueFish() : null;
            }
            if (this.lockedFish) {
                this.cannon.aimAt(this.lockedFish.x, this.lockedFish.y);
            }
        }

        const newBullets = this.cannon.shoot(this.lockedFish);
        if (newBullets && newBullets.length > 0) {
            // 无敌破解版：开炮不扣除金币，金币永远无限
            this.bullets.push(...newBullets);
        }
    }

    // 生成随机单只鱼 (使用对象池复用，特殊鱼爆率提升到 15%)
    spawnRandomFish() {
        const roll = Math.random() * 100;
        let type = 'yellow_fish';

        if (roll < 35) type = 'yellow_fish';
        else if (roll < 52) type = 'clown_fish';
        else if (roll < 66) type = 'blue_tang';
        else if (roll < 76) type = 'puffer_fish';
        else if (roll < 84) type = 'jellyfish';
        else if (roll < 90) type = 'turtle';
        else if (roll < 95) type = 'swordfish';
        else type = 'manta_ray';

        // 稀有特殊功能鱼生成概率提升到 15% (炸弹鱼、寒冰海星、电光鳗，连环爆炸清屏极度爽快！)
        if (Math.random() < 0.15) {
            const specials = ['bomb_fish', 'freeze_fish', 'lightning_eel'];
            type = specials[Math.floor(Math.random() * specials.length)];
        }

        const fish = window.fishPool ? window.fishPool.get(type, this.width, this.height) : new window.Fish(type, this.width, this.height);
        this.fishes.push(fish);
    }

    // 生成鱼群编队游动 (数量倍增为 10~15 条，使用对象池)
    spawnSchool(type = 'yellow_fish', count = 12) {
        const fromLeft = Math.random() < 0.5;
        const baseY = 100 + Math.random() * (this.height - 250);
        const baseCurve = {
            p0: { x: fromLeft ? -120 : this.width + 120, y: baseY },
            p1: { x: fromLeft ? this.width * 0.35 : this.width * 0.65, y: baseY + (Math.random() - 0.5) * 200 },
            p2: { x: fromLeft ? this.width * 0.65 : this.width * 0.35, y: baseY + (Math.random() - 0.5) * 200 },
            p3: { x: fromLeft ? this.width + 120 : -120, y: baseY }
        };

        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 45 - i * 35;
            const offsetY = (Math.random() - 0.5) * 35;
            const curve = {
                p0: { x: baseCurve.p0.x + offsetX, y: baseCurve.p0.y + offsetY },
                p1: { x: baseCurve.p1.x + offsetX, y: baseCurve.p1.y + offsetY },
                p2: { x: baseCurve.p2.x + offsetX, y: baseCurve.p2.y + offsetY },
                p3: { x: baseCurve.p3.x + offsetX, y: baseCurve.p3.y + offsetY }
            };
            const fish = window.fishPool ? window.fishPool.get(type, this.width, this.height, curve) : new window.Fish(type, this.width, this.height, curve);
            this.fishes.push(fish);
        }
    }

    spawnBoss() {
        window.uiManager.showBossBanner('远古金龙');
        if (window.particleSystem) {
            window.particleSystem.shake(22, 38);
        }

        // BOSS 出场排场：清空当前 30% 低分小鱼，为巨龙腾出视觉舞台
        const lowFishes = this.fishes.filter(f => !f.isDead && !f.isDying && f.score <= 4);
        const clearCount = Math.floor(lowFishes.length * 0.3);
        for (let i = 0; i < clearCount; i++) {
            lowFishes[i].startDying();
            if (window.particleSystem) {
                window.particleSystem.addBubble(lowFishes[i].x, lowFishes[i].y, 6);
            }
        }

        const boss = window.fishPool ? window.fishPool.get('golden_dragon', this.width, this.height) : new window.Fish('golden_dragon', this.width, this.height);
        this.fishes.push(boss);
        if (this.isLockMode) {
            this.lockedFish = boss;
        }

        // 巨龙亲卫队：同时召唤 10 条尖嘴剑鱼护航编队伴随游动！
        for (let i = 0; i < 10; i++) {
            const escortCurve = {
                p0: { x: boss.curve.p0.x + (Math.random() - 0.5) * 160, y: boss.curve.p0.y + (i - 5) * 28 },
                p1: { x: boss.curve.p1.x + (Math.random() - 0.5) * 160, y: boss.curve.p1.y + (i - 5) * 28 },
                p2: { x: boss.curve.p2.x + (Math.random() - 0.5) * 160, y: boss.curve.p2.y + (i - 5) * 28 },
                p3: { x: boss.curve.p3.x + (Math.random() - 0.5) * 160, y: boss.curve.p3.y + (i - 5) * 28 }
            };
            const escort = window.fishPool ? window.fishPool.get('swordfish', this.width, this.height, escortCurve) : new window.Fish('swordfish', this.width, this.height, escortCurve);
            this.fishes.push(escort);
        }
    }

    // 激光扫射碰撞检测
    checkLaserCollisions() {
        const length = 1600;
        const lx1 = this.cannon.x;
        const ly1 = this.cannon.y;
        const lx2 = lx1 + Math.cos(this.cannon.angle) * length;
        const ly2 = ly1 + Math.sin(this.cannon.angle) * length;

        for (const fish of this.fishes) {
            if (fish.isDead || fish.isDying) continue;

            // 点到线段距离检测
            const dist = this.distToSegment({ x: fish.x, y: fish.y }, { x: lx1, y: ly1 }, { x: lx2, y: ly2 });
            if (dist < fish.width * 0.5 + 40) {
                fish.takeHit(999);
                // 激光贯穿大鱼时触发顿帧与打击震颤
                if (fish.score >= 100 || fish.type === 'golden_dragon') {
                    this.triggerHitstop(3);
                    if (window.particleSystem) window.particleSystem.shake(25, 30);
                }
                this.catchFish(fish, this.cannon.getCurrentConfig().cost * 5); // 激光触碰瞬间必抓
            }
        }
    }

    distToSegment(p, v, w) {
        const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }

    // 街机爽快顿帧效果 (瞬间停滞几帧再爆出特效)
    triggerHitstop(frames = 3) {
        this.hitstopTimer = Math.max(this.hitstopTimer, frames);
    }

    // 捕获成功结算
    catchFish(fish, cannonCost) {
        if (fish.isDying || fish.isDead) return;

        fish.startDying();
        const reward = fish.score * cannonCost;
        this.coins += reward;
        window.uiManager.updateCoins(this.coins);

        // 连击计时 (2.2秒内连续捕获触发 Combo 累加)
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

        // 极限打击震颤与顿帧 (根据分值动态缩放)
        if (fish.score >= 300) {
            // 远古金龙 BOSS 绝杀：剧烈地震感与顿帧
            if (window.particleSystem) window.particleSystem.shake(44, 46);
            this.triggerHitstop(4);
        } else if (fish.score >= 100) {
            // 霸王大白鲨
            if (window.particleSystem) window.particleSystem.shake(28, 34);
            this.triggerHitstop(3);
        } else if (fish.score >= 60) {
            // 黄金锤头鲨
            if (window.particleSystem) window.particleSystem.shake(18, 25);
            this.triggerHitstop(2);
        }

        // 积累激光充能槽
        const energyGain = fish.score >= 100 ? 25 : (fish.score >= 30 ? 10 : 3);
        this.cannon.addLaserEnergy(energyGain);
        window.uiManager.updateLaser(this.cannon.laserEnergy);

        // 特效表现
        if (window.particleSystem) {
            window.particleSystem.addScore(fish.x, fish.y, reward, fish.score >= 60);
            window.particleSystem.addCoin(fish.x, fish.y, this.cannon.x, this.cannon.y, reward);
        }

        // 音效表现
        if (window.soundManager) {
            window.soundManager.playCatch(fish.score);
        }

        // 大奖全屏横幅庆祝
        if (fish.score >= 60) {
            window.uiManager.showBigWin(reward);
        }

        // 特殊鱼连锁机制
        if (fish.type === 'bomb_fish') {
            this.triggerBombChain(fish.x, fish.y, cannonCost);
        } else if (fish.type === 'freeze_fish') {
            this.isFrozen = true;
            this.freezeTimer = 480; // 8秒冰封
            if (window.soundManager) window.soundManager.playFreeze();
        } else if (fish.type === 'lightning_eel') {
            this.triggerLightningChain(fish, cannonCost);
        }
    }

    // 炸弹鱼核爆连锁
    triggerBombChain(bx, by, cannonCost) {
        if (window.soundManager) window.soundManager.playBomb();
        if (window.particleSystem) {
            window.particleSystem.addExplosion(bx, by, 340);
            window.particleSystem.shake(36, 40);
        }
        this.triggerHitstop(4); // 核爆瞬间顿帧停顿

        const radius = 340;
        for (const f of this.fishes) {
            if (!f.isDead && !f.isDying && f.type !== 'golden_dragon') {
                const d = Math.hypot(f.x - bx, f.y - by);
                if (d < radius) {
                    this.catchFish(f, cannonCost);
                }
            }
        }
    }

    // 闪电鳗闪电链
    triggerLightningChain(startFish, cannonCost) {
        if (window.soundManager) window.soundManager.playLightning();

        const points = [{ x: startFish.x, y: startFish.y }];
        let currentTarget = startFish;
        let chainCount = 0;
        const maxChains = 7;

        for (const f of this.fishes) {
            if (chainCount >= maxChains) break;
            if (f !== currentTarget && !f.isDead && !f.isDying && f.type !== 'golden_dragon') {
                const dist = Math.hypot(f.x - currentTarget.x, f.y - currentTarget.y);
                if (dist < 320) {
                    points.push({ x: f.x, y: f.y });
                    this.catchFish(f, cannonCost);
                    currentTarget = f;
                    chainCount++;
                }
            }
        }

        if (points.length > 1 && window.particleSystem) {
            window.particleSystem.addLightning(points);
        }
    }

    // 主更新逻辑
    update() {
        // 冰冻倒计时 (若为特殊鱼触发的倒计时，正常倒数；若为手动常开，则由玩家再次点击取消)
        if (this.isFrozen && this.freezeTimer > 0 && this.freezeTimer < 90000000) {
            this.freezeTimer--;
            if (this.freezeTimer <= 0) {
                this.isFrozen = false;
                const el = document.getElementById('skill-freeze');
                if (el) el.classList.remove('active');
            }
        }

        // 自动连发 / 鼠标按住连续开火
        if (this.isAutoFire || this.isMouseDown) {
            this.tryFire();
        }

        // 炮台状态与后坐力
        this.cannon.update();

        // 激光扫射
        if (this.cannon.isFiringLaser) {
            this.checkLaserCollisions();
        }

        // 粒子更新
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
                // 对象池回收复用
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
                // 子弹对象池回收复用
                if (window.bulletPool) {
                    window.bulletPool.release(b);
                }
                this.bullets.splice(i, 1);
                continue;
            }

            // 碰撞检测：遍历当前所有鱼
            let collided = false;
            for (const fish of this.fishes) {
                if (fish.isDead || fish.isDying) continue;

                // 若有锁定目标，优先只与锁定目标判定碰撞
                if (b.targetFish && b.targetFish !== fish) {
                    continue;
                }

                if (fish.isHit(b.x, b.y, b.radius)) {
                    collided = true;
                    b.isDead = true;

                    // 展开渔网
                    const netRadius = b.levelConfig.netRadius;
                    if (window.particleSystem) {
                        window.particleSystem.addNet(b.x, b.y, netRadius, b.color);
                    }
                    if (window.soundManager) {
                        window.soundManager.playNet();
                    }

                    // 渔网 AOE 结算 (无敌破解版：触网 100% 必定捕获秒杀)
                    for (const target of this.fishes) {
                        if (target.isDead || target.isDying) continue;
                        if (target.isHit(b.x, b.y, netRadius)) {
                            target.takeHit(999); // 瞬间巨额伤害
                            this.catchFish(target, b.levelConfig.cost); // 100% 必抓
                        }
                    }

                    break;
                }
            }

            if (collided) {
                this.bullets.splice(i, 1);
            }
        }

        // 鱼群波次刷新调度 (狂野鱼海爆发生成：同屏上限提升到 85 条，刷新频率大幅提速)
        this.spawnTick++;
        if (this.spawnTick % 22 === 0 && this.fishes.length < 85) {
            this.spawnRandomFish();
        }
        if (this.spawnTick % 160 === 0 && this.fishes.length < 75) {
            const schoolCount = 10 + Math.floor(Math.random() * 6); // 10 ~ 15 条
            this.spawnSchool(['yellow_fish', 'clown_fish', 'blue_tang'][Math.floor(Math.random() * 3)], schoolCount);
        }

        // BOSS 刷新
        this.bossTimer++;
        if (this.bossTimer >= this.bossInterval) {
            this.bossTimer = 0;
            this.spawnBoss();
        }

        // UI 平滑计数值更新
        if (window.uiManager) {
            window.uiManager.step();
        }
    }

    // 渲染游戏全部画面
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 极限打击非线性震屏与视角晃动
        const shake = window.particleSystem ? window.particleSystem.getShakeOffset() : { x: 0, y: 0, rot: 0 };
        this.ctx.save();
        this.ctx.translate(this.width / 2 + shake.x, this.height / 2 + shake.y);
        this.ctx.rotate(shake.rot || 0);
        this.ctx.translate(-this.width / 2, -this.height / 2);

        // 1. 动态海水底层背景与光芒 (传入鱼群数量，超过50条激活更耀眼的狂野洋流)
        if (window.particleSystem) {
            window.particleSystem.renderBackground(this.ctx, this.width, this.height, this.fishes.length);
        }

        // 2. 绘制所有生动的鱼类
        for (const fish of this.fishes) {
            fish.render(this.ctx);
        }

        // 3. 若有锁定目标，绘制未来高科技动态旋转锁定准星与连线
        if (this.lockedFish && !this.lockedFish.isDead && !this.lockedFish.isDying) {
            this.renderLockReticle(this.ctx, this.lockedFish);
        }

        // 4. 绘制所有飞行的子弹
        for (const b of this.bullets) {
            b.render(this.ctx);
        }

        // 5. 绘制前景粒子 (渔网、金币、爆炸、文字)
        if (window.particleSystem) {
            window.particleSystem.renderForeground(this.ctx, this.width, this.height);
        }

        // 6. 冰封极寒滤镜覆盖
        if (this.isFrozen) {
            this.renderFrozenOverlay(this.ctx);
        }

        // 7. 炮台基座与炮管
        this.cannon.render(this.ctx);

        this.ctx.restore();
    }

    // 绘制高科技动态旋转准星 (BOSS 红色高危警告锁定)
    renderLockReticle(ctx, fish) {
        const isBoss = fish.score >= 100 || fish.type === 'golden_dragon';
        const color = isBoss ? '#ff1744' : '#00e5ff';
        const glow = isBoss ? '#ff0033' : '#00b0ff';

        // 1. 绘制从炮台炮口到目标的动态虚线激光指示器
        ctx.save();
        ctx.strokeStyle = isBoss ? 'rgba(255, 23, 68, 0.45)' : 'rgba(0, 229, 255, 0.35)';
        ctx.lineWidth = isBoss ? 2 : 1.5;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -Date.now() * 0.035;
        ctx.beginPath();
        ctx.moveTo(this.cannon.x, this.cannon.y);
        ctx.lineTo(fish.x, fish.y);
        ctx.stroke();
        ctx.restore();

        // 2. 目标周围高科技全息多环瞄准框
        ctx.save();
        ctx.translate(fish.x, fish.y);

        const r = Math.max(32, fish.width * 0.65);
        const now = Date.now() * 0.003;

        // BOSS 目标闪烁警报
        if (isBoss) {
            const flash = Math.sin(Date.now() * 0.015) > 0;
            ctx.shadowColor = glow;
            ctx.shadowBlur = flash ? 25 : 12;
        } else {
            ctx.shadowColor = glow;
            ctx.shadowBlur = 14;
        }

        // 外层顺时针旋转齿轮网环
        ctx.save();
        ctx.rotate(now);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
        ctx.stroke();

        // 齿轮凸起标记
        for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4));
            ctx.lineTo(Math.cos(a) * (r + 14), Math.sin(a) * (r + 14));
            ctx.stroke();
        }
        ctx.restore();

        // 中层逆时针虚线环
        ctx.save();
        ctx.rotate(-now * 1.4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 四角锁定括号 [ ]
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        const bSize = r + 18;
        const bLen = 12;
        // 左上
        ctx.beginPath();
        ctx.moveTo(-bSize, -bSize + bLen); ctx.lineTo(-bSize, -bSize); ctx.lineTo(-bSize + bLen, -bSize);
        // 右上
        ctx.moveTo(bSize - bLen, -bSize); ctx.lineTo(bSize, -bSize); ctx.lineTo(bSize, -bSize + bLen);
        // 右下
        ctx.moveTo(bSize, bSize - bLen); ctx.lineTo(bSize, bSize); ctx.lineTo(bSize - bLen, bSize);
        // 左下
        ctx.moveTo(-bSize + bLen, bSize); ctx.lineTo(-bSize, bSize); ctx.lineTo(-bSize, bSize - bLen);
        ctx.stroke();

        // 准星正中十字
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
        ctx.moveTo(0, -6); ctx.lineTo(0, 6);
        ctx.stroke();

        // 目标警报文字标签
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = isBoss ? '#ff1744' : '#00e5ff';
        const labelText = isBoss ? '⚠️ [LOCKED: BOSS] ⚠️' : `LOCKED [x${fish.score}]`;
        ctx.fillText(labelText, 0, -r - 18);

        ctx.restore();
    }

    renderFrozenOverlay(ctx) {
        ctx.save();
        const grad = ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.width * 0.25,
            this.width / 2, this.height / 2, this.width * 0.65
        );
        grad.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
        grad.addColorStop(0.8, 'rgba(0, 180, 255, 0.35)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.65)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }

    gameLoop(timestamp) {
        // 街机爽快顿帧停顿 (Hitstop Crunch)
        if (this.hitstopTimer > 0) {
            this.hitstopTimer--;
            this.render(); // 顿帧时只做静态定格绘制，暂停物理位移
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        this.update();
        this.render();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// 页面加载完成后自动启动
window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();

    // 用户首次点击页面时激活 Web Audio 上下文 (突破浏览器自动播放策略)
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
