/**
 * 捕鱼达人 - PixiJS (WebGL) 硬件加速机甲炮台、正版子弹与量子能量系统
 * 采用 WebGL GPU 渲染管线，支持百发子弹超高频同屏弹射与极速开火
 */

const CANNON_LEVELS = [
    { level: 1, name: '青铜单管机甲炮', cost: 1, netRadius: 75, speed: 19, color: '#00e5ff', barrels: 1, spriteIndex: 1 },
    { level: 2, name: '白银强袭双联炮', cost: 2, netRadius: 85, speed: 20, color: '#2979ff', barrels: 1, spriteIndex: 2 },
    { level: 3, name: '黄金重装磁轨炮', cost: 5, netRadius: 95, speed: 21, color: '#ffd700', barrels: 2, spriteIndex: 3 },
    { level: 4, name: '翡翠爆裂聚能炮', cost: 10, netRadius: 105, speed: 22, color: '#00e676', barrels: 2, spriteIndex: 4 },
    { level: 5, name: '紫晶脉冲湮灭炮', cost: 20, netRadius: 120, speed: 23, color: '#d500f9', barrels: 2, spriteIndex: 5 },
    { level: 6, name: '赤焰极速三管炮', cost: 50, netRadius: 135, speed: 24, color: '#ff3d00', barrels: 3, spriteIndex: 6 },
    { level: 7, name: '极光等离子重炮', cost: 100, netRadius: 155, speed: 25, color: '#00b0ff', barrels: 3, spriteIndex: 7 },
    { level: 8, name: '泰坦黄金四联重炮', cost: 200, netRadius: 175, speed: 26, color: '#ffea00', barrels: 4, spriteIndex: 7 },
    { level: 9, name: '虚空暗物质终结炮', cost: 500, netRadius: 200, speed: 27, color: '#7c4dff', barrels: 4, spriteIndex: 7 },
    { level: 10, name: '灭世龙神·加特林', cost: 0, netRadius: 230, speed: 29, color: '#ff0055', barrels: 5, spriteIndex: 7 }
];

const CANNON_SPRITE_DATA = [
    null,
    { key: 'cannon1', w: 74, h: 74, regX: 37, regY: 45 },
    { key: 'cannon2', w: 74, h: 76, regX: 37, regY: 46 },
    { key: 'cannon3', w: 74, h: 76, regX: 37, regY: 46 },
    { key: 'cannon4', w: 74, h: 83, regX: 37, regY: 52 },
    { key: 'cannon5', w: 74, h: 85, regX: 37, regY: 55 },
    { key: 'cannon6', w: 74, h: 90, regX: 37, regY: 58 },
    { key: 'cannon7', w: 74, h: 94, regX: 37, regY: 60 }
];

class Bullet {
    constructor(x, y, angle, levelConfig, targetFish = null) {
        this.initPixiDisplay();
        this.reset(x, y, angle, levelConfig, targetFish);
    }

    initPixiDisplay() {
        if (typeof PIXI === 'undefined') return;
        this.view = new PIXI.Container();

        this.trailGfx = new PIXI.Graphics();
        this.view.addChild(this.trailGfx);

        this.sprite = new PIXI.Sprite();
        this.sprite.anchor.set(0.5, 0.5);
        this.view.addChild(this.sprite);
    }

    reset(x, y, angle, levelConfig, targetFish = null) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.levelConfig = levelConfig;
        this.targetFish = targetFish;

        this.speed = levelConfig.speed;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        this.radius = 8 + Math.min(levelConfig.level * 0.8, 8);
        this.color = levelConfig.color;
        this.colorNum = parseInt(this.color.replace('#', '0x'), 16) || 0x00e5ff;
        this.bounces = 0;
        this.maxBounces = 5;
        this.isDead = false;
        this.trail = [];
        this.isHighTier = levelConfig.level >= 6;

        if (this.view) {
            if (window.pixiLayers && window.pixiLayers.bullet && this.view.parent !== window.pixiLayers.bullet) {
                window.pixiLayers.bullet.addChild(this.view);
            }
            this.view.visible = true;

            const bulletIdx = Math.min(8, Math.max(1, this.levelConfig.level));
            if (window.pixiTextures && window.pixiTextures.bullets && window.pixiTextures.bullets[bulletIdx]) {
                this.sprite.texture = window.pixiTextures.bullets[bulletIdx];
            }
            if (this.trailGfx) this.trailGfx.clear();
        }
    }

    update(screenWidth, screenHeight) {
        if (this.isDead) return;

        const maxTrailLength = this.isHighTier ? 8 : 4;
        this.trail.push({ x: this.x, y: this.y, alpha: 0.85 });
        if (this.trail.length > maxTrailLength) {
            this.trail.shift();
        }
        for (const t of this.trail) {
            t.alpha *= 0.85;
        }

        if (this.targetFish && !this.targetFish.isDead) {
            const targetAngle = Math.atan2(this.targetFish.y - this.y, this.targetFish.x - this.x);
            let angleDiff = targetAngle - this.angle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            this.angle += angleDiff * 0.14;

            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // 边界反弹
        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx = -this.vx;
            this.angle = Math.atan2(this.vy, this.vx);
            this.bounces++;
        } else if (this.x > screenWidth - this.radius) {
            this.x = screenWidth - this.radius;
            this.vx = -this.vx;
            this.angle = Math.atan2(this.vy, this.vx);
            this.bounces++;
        }

        if (this.y < this.radius) {
            this.y = this.radius;
            this.vy = -this.vy;
            this.angle = Math.atan2(this.vy, this.vx);
            this.bounces++;
        }

        if (this.bounces > this.maxBounces || this.y > screenHeight + 50) {
            this.isDead = true;
            if (this.view) this.view.visible = false;
            return;
        }

        this.syncPixiTransform();
    }

    syncPixiTransform() {
        if (!this.view) return;
        this.view.x = this.x;
        this.view.y = this.y;
        this.view.rotation = this.angle + Math.PI / 2;

        if (this.trailGfx) {
            this.trailGfx.clear();
            if (this.trail.length > 1) {
                this.trailGfx.lineStyle(this.radius * 0.9, this.colorNum, 0.45);
                this.trailGfx.moveTo(0, 0);
                this.trailGfx.lineTo(0, this.isHighTier ? 24 : 14);
            }
        }
    }
}

class Cannon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 2;
        this.targetAngle = -Math.PI / 2;

        this.levelIndex = 0;
        this.recoil = 0;
        this.recoilFrame = 0;
        this.recoilFrameTimer = 0;

        this.isRageMode = false;
        this.rageTimer = 0;

        this.laserEnergy = 0;
        this.isFiringLaser = false;
        this.laserTimer = 0;
        this.laserDuration = 260; // 增强激光判定时长，贯穿超持久爽快体验

        this.lastFireTime = 0;
        this.fireInterval = 90;

        this.ringRotation = 0;
        this.corePulse = 0;
        this.muzzleFlash = 0;

        this.initPixiDisplay();
    }

    initPixiDisplay() {
        if (typeof PIXI === 'undefined') return;

        this.view = new PIXI.Container();

        // 1. 底部重装战术旋转底盘 (固定在基座地面上)
        this.baseRingGfx = new PIXI.Graphics();
        this.view.addChild(this.baseRingGfx);

        // 2. 全息战术激光瞄准线
        this.aimGfx = new PIXI.Graphics();
        this.view.addChild(this.aimGfx);

        // 3. 激光束
        this.laserGfx = new PIXI.Graphics();
        this.view.addChild(this.laserGfx);

        // 4. 旋转炮台机身总成 (围绕 (0, 0) 精准旋转)
        this.turret = new PIXI.Container();
        this.view.addChild(this.turret);

        // 4.1 重型机甲机匣与液压后座阻尼器
        this.chassisGfx = new PIXI.Graphics();
        this.turret.addChild(this.chassisGfx);

        // 4.2 复合加特林重金属四联炮管群
        this.barrelGfx = new PIXI.Graphics();
        this.turret.addChild(this.barrelGfx);

        // 4.3 超能等离子反应堆核心与双向旋转流光能环
        this.coreGfx = new PIXI.Graphics();
        this.turret.addChild(this.coreGfx);

        // 4.4 炮口高能等离子开火激波
        this.muzzleFlashGfx = new PIXI.Graphics();
        this.turret.addChild(this.muzzleFlashGfx);

        if (window.pixiLayers && window.pixiLayers.cannon) {
            window.pixiLayers.cannon.addChild(this.view);
        }
    }

    getCurrentConfig() {
        return CANNON_LEVELS[this.levelIndex];
    }

    setLevel(index) {
        this.levelIndex = Math.max(0, Math.min(CANNON_LEVELS.length - 1, index));
    }

    nextLevel() {
        this.levelIndex = (this.levelIndex + 1) % CANNON_LEVELS.length;
    }

    prevLevel() {
        this.levelIndex = (this.levelIndex - 1 + CANNON_LEVELS.length) % CANNON_LEVELS.length;
    }

    addLaserEnergy(amount) {
        this.laserEnergy = 100;
    }

    fireLaser() {
        if (this.isFiringLaser) return false;
        this.isFiringLaser = true;
        this.laserTimer = this.laserDuration;
        this.laserEnergy = 100;
        if (window.soundManager) {
            window.soundManager.playLaser();
        }
        return true;
    }

    aimAt(targetX, targetY) {
        let desired = Math.atan2(targetY - this.y, targetX - this.x);
        if (desired > -0.15 && desired <= Math.PI / 2) desired = -0.15;
        if (desired < -Math.PI + 0.15 || desired > Math.PI / 2) desired = -Math.PI + 0.15;
        this.angle = desired;
    }

    canFire() {
        const now = performance.now();
        const interval = this.isRageMode ? this.fireInterval * 0.45 : this.fireInterval;
        return (now - this.lastFireTime) >= interval && !this.isFiringLaser;
    }

    shoot(targetFish = null) {
        if (!this.canFire()) return null;

        this.lastFireTime = performance.now();
        this.recoil = 18;
        this.muzzleFlash = 1.0;

        const cfg = this.getCurrentConfig();
        // 精确对齐：炮管物理长度 68px，后座力时向内滑动
        const barrelLength = 68 - this.recoil * 0.6;
        const muzzleX = this.x + Math.cos(this.angle) * barrelLength;
        const muzzleY = this.y + Math.sin(this.angle) * barrelLength;

        if (window.soundManager) {
            window.soundManager.playShoot(cfg.level);
        }

        const getB = (bx, by, bAngle) => {
            if (window.bulletPool) {
                return window.bulletPool.get(bx, by, bAngle, cfg, targetFish);
            }
            return new Bullet(bx, by, bAngle, cfg, targetFish);
        };

        const bullets = [];
        if (cfg.barrels === 1) {
            bullets.push(getB(muzzleX, muzzleY, this.angle));
        } else if (cfg.barrels === 2) {
            const offset = 7;
            const perpAngle = this.angle + Math.PI / 2;
            const b1X = muzzleX + Math.cos(perpAngle) * offset;
            const b1Y = muzzleY + Math.sin(perpAngle) * offset;
            const b2X = muzzleX - Math.cos(perpAngle) * offset;
            const b2Y = muzzleY - Math.sin(perpAngle) * offset;
            bullets.push(getB(b1X, b1Y, this.angle - 0.03));
            bullets.push(getB(b2X, b2Y, this.angle + 0.03));
        } else if (cfg.barrels === 3) {
            bullets.push(getB(muzzleX, muzzleY, this.angle - 0.08));
            bullets.push(getB(muzzleX, muzzleY, this.angle));
            bullets.push(getB(muzzleX, muzzleY, this.angle + 0.08));
        } else if (cfg.level >= 10 || this.isRageMode) {
            // Lv.10 灭世龙神·加特林：五联强力扇形弹幕！
            bullets.push(getB(muzzleX, muzzleY, this.angle - 0.16));
            bullets.push(getB(muzzleX, muzzleY, this.angle - 0.08));
            bullets.push(getB(muzzleX, muzzleY, this.angle));
            bullets.push(getB(muzzleX, muzzleY, this.angle + 0.08));
            bullets.push(getB(muzzleX, muzzleY, this.angle + 0.16));
        } else {
            bullets.push(getB(muzzleX, muzzleY, this.angle - 0.12));
            bullets.push(getB(muzzleX, muzzleY, this.angle - 0.04));
            bullets.push(getB(muzzleX, muzzleY, this.angle + 0.04));
            bullets.push(getB(muzzleX, muzzleY, this.angle + 0.12));
        }

        return bullets;
    }

    update() {
        if (this.recoil > 0) {
            this.recoil *= 0.78;
            if (this.recoil < 0.2) this.recoil = 0;
        }

        if (this.muzzleFlash > 0) {
            this.muzzleFlash = Math.max(0, this.muzzleFlash - 0.22);
        }

        this.ringRotation += 0.025;
        this.corePulse += 0.06;

        if (this.isRageMode && this.rageTimer > 0 && this.rageTimer < 90000000) {
            this.rageTimer--;
            if (this.rageTimer <= 0) {
                this.isRageMode = false;
                const el = document.getElementById('skill-rage');
                if (el) el.classList.remove('active');
            }
        }

        if (this.isFiringLaser) {
            this.laserTimer--;
            if (this.laserTimer <= 0) {
                this.isFiringLaser = false;
            }
        }

        this.syncPixiTransform();
    }

    syncPixiTransform() {
        if (!this.view) return;
        this.view.x = this.x;
        this.view.y = this.y;

        const cfg = this.getCurrentConfig();
        const colorNum = parseInt(cfg.color.replace('#', '0x'), 16) || 0x00e5ff;

        // 1. 底部重装战术旋转底盘 (在 this.view 局部坐标 (0, 0))
        if (this.baseRingGfx) {
            this.baseRingGfx.clear();

            // 1.1 重型钛合金底座基盘 (多层金属高光)
            this.baseRingGfx.beginFill(0x0b1320, 0.95);
            this.baseRingGfx.lineStyle(2, 0x1e293b, 1);
            this.baseRingGfx.drawCircle(0, 0, 50);
            this.baseRingGfx.endFill();

            // 1.2 慢速旋转的机械战术齿轮刻度环
            const gearCount = 12;
            const rot = this.ringRotation * 0.4;
            this.baseRingGfx.lineStyle(2, 0x00e5ff, 0.7);
            for (let i = 0; i < gearCount; i++) {
                const a = rot + (i * Math.PI * 2) / gearCount;
                const r1 = 43;
                const r2 = (i % 3 === 0) ? 49 : 46;
                this.baseRingGfx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
                this.baseRingGfx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
            }

            // 1.3 发光蓝色能量同心环 (呼吸流光)
            const pulse = (Math.sin(this.corePulse * 1.8) + 1) * 0.5;
            this.baseRingGfx.lineStyle(2.5, 0x00b0ff, 0.4 + pulse * 0.3);
            this.baseRingGfx.drawCircle(0, 0, 42);

            this.baseRingGfx.lineStyle(1.2, 0xe0f7fa, 0.6 + pulse * 0.35);
            this.baseRingGfx.drawCircle(0, 0, 37);

            // 1.4 基座 4 颗重型内六角固定螺栓
            for (let b = 0; b < 4; b++) {
                const ba = (b * Math.PI) / 2 + Math.PI / 4;
                const bx = Math.cos(ba) * 38;
                const by = Math.sin(ba) * 38;
                this.baseRingGfx.beginFill(0x334155, 1);
                this.baseRingGfx.lineStyle(1, 0x64748b, 0.9);
                this.baseRingGfx.drawCircle(bx, by, 3);
                this.baseRingGfx.endFill();
            }
        }

        // 2. 全息战术激光瞄准线 (起点严格对齐枪口尖端 70px)
        if (this.aimGfx) {
            this.aimGfx.clear();
            const maxDist = 950;
            const startDist = 70;
            const startX = Math.cos(this.angle) * startDist;
            const startY = Math.sin(this.angle) * startDist;
            const targetX = Math.cos(this.angle) * maxDist;
            const targetY = Math.sin(this.angle) * maxDist;

            this.aimGfx.lineStyle(1.5, 0x00e5ff, 0.45);
            this.aimGfx.moveTo(startX, startY);
            this.aimGfx.lineTo(targetX, targetY);

            // 准星辅助微光点
            const dotDist = startDist + (performance.now() * 0.08) % (maxDist - startDist);
            this.aimGfx.beginFill(0x00e5ff, 0.7);
            this.aimGfx.drawCircle(Math.cos(this.angle) * dotDist, Math.sin(this.angle) * dotDist, 2.5);
            this.aimGfx.endFill();
        }

        // 3. 炮台主轴机身 (围绕中心 (0, 0) 精准旋转)
        if (this.turret) {
            this.turret.rotation = this.angle + Math.PI / 2;

            const recoilOffset = this.recoil * 0.6; // 后座力向后偏移 (+Y)

            // 3.1 重型机甲机匣与液压后座阻尼器 (Chassis & Armor Wings)
            if (this.chassisGfx) {
                this.chassisGfx.clear();

                // 侧面左右双联液压阻尼器 (带开火活塞受力压缩动画)
                const pistonP = Math.max(0, this.recoil * 0.45);
                this.chassisGfx.beginFill(0x64748b, 1);
                this.chassisGfx.drawRect(-31, 0, 4, 28 - pistonP);
                this.chassisGfx.drawRect(27, 0, 4, 28 - pistonP);
                this.chassisGfx.endFill();

                // 侧翼主装甲 (带高光倒角切面与科幻青色装甲缝)
                this.chassisGfx.beginFill(0x151f2e, 1);
                this.chassisGfx.lineStyle(1.5, 0x00e5ff, 0.85);
                this.chassisGfx.drawPolygon([
                    -20, 16,
                    -46, 26,
                    -40, -12,
                    -18, -4
                ]);
                this.chassisGfx.drawPolygon([
                    20, 16,
                    46, 26,
                    40, -12,
                    18, -4
                ]);
                this.chassisGfx.endFill();

                // 侧翼内部层次高光
                this.chassisGfx.beginFill(0x243247, 0.9);
                this.chassisGfx.lineStyle(1, 0x475569, 0.7);
                this.chassisGfx.drawPolygon([
                    -22, 12,
                    -38, 20,
                    -34, -6,
                    -20, -2
                ]);
                this.chassisGfx.drawPolygon([
                    22, 12,
                    38, 20,
                    34, -6,
                    20, -2
                ]);
                this.chassisGfx.endFill();

                // 机匣主体多边形重型装甲板
                this.chassisGfx.beginFill(0x1e293b, 1);
                this.chassisGfx.lineStyle(2, 0x00e5ff, 0.9);
                this.chassisGfx.drawPolygon([
                    -22, 28,
                    22, 28,
                    24, -14,
                    14, -26,
                    -14, -26,
                    -24, -14
                ]);
                this.chassisGfx.endFill();

                // 机匣中层金属加强盖板
                this.chassisGfx.beginFill(0x334155, 1);
                this.chassisGfx.lineStyle(1, 0x94a3b8, 0.85);
                this.chassisGfx.drawPolygon([
                    -16, 22,
                    16, 22,
                    17, -10,
                    10, -20,
                    -10, -20,
                    -17, -10
                ]);
                this.chassisGfx.endFill();

                // 左右两侧散热格栅排气孔 (发光青色)
                this.chassisGfx.lineStyle(1.5, 0x00e5ff, 0.8);
                for (let v = 0; v < 3; v++) {
                    const vy = 4 + v * 6;
                    this.chassisGfx.moveTo(-15, vy);
                    this.chassisGfx.lineTo(-8, vy);
                    this.chassisGfx.moveTo(8, vy);
                    this.chassisGfx.lineTo(15, vy);
                }
            }

            // 3.2 复合加特林重金属四联炮管群 (带有后座回跳动画与精密机械套箍)
            if (this.barrelGfx) {
                this.barrelGfx.clear();

                const by0 = -12 + recoilOffset; // 炮管后部起点
                const mLenCenter = 68 - recoilOffset; // 主炮管长度
                const mLenOuter = 56 - recoilOffset;  // 副炮管长度

                // 外侧双联副炮管 (X = -17, +17)
                [-17, 17].forEach((bx) => {
                    this.barrelGfx.beginFill(0x0f172a, 1);
                    this.barrelGfx.lineStyle(1, 0x334155, 1);
                    this.barrelGfx.drawRect(bx - 3.5, -mLenOuter, 7, mLenOuter + by0);
                    this.barrelGfx.endFill();

                    // 炮管中心高光倒角拉丝
                    this.barrelGfx.lineStyle(1, 0x94a3b8, 0.6);
                    this.barrelGfx.moveTo(bx, by0);
                    this.barrelGfx.lineTo(bx, -mLenOuter + 4);

                    // 枪口多孔制退消焰器
                    this.barrelGfx.beginFill(0x1e293b, 1);
                    this.barrelGfx.lineStyle(1.5, 0x00e5ff, 0.9);
                    this.barrelGfx.drawRect(bx - 5, -mLenOuter, 10, 6);
                    this.barrelGfx.endFill();

                    // 枪口内焰发光凹槽
                    this.barrelGfx.beginFill(0x00e5ff, 0.85);
                    this.barrelGfx.drawRect(bx - 2, -mLenOuter, 4, 3);
                    this.barrelGfx.endFill();
                });

                // 中间双联主加特林重炮管 (X = -7, +7, 笔直延伸至 -68)
                [-7, 7].forEach((bx) => {
                    this.barrelGfx.beginFill(0x1e293b, 1);
                    this.barrelGfx.lineStyle(1.5, 0x475569, 1);
                    this.barrelGfx.drawRect(bx - 4.5, -mLenCenter, 9, mLenCenter + by0);
                    this.barrelGfx.endFill();

                    // 金属圆柱反光光泽 (银白高光拉丝)
                    this.barrelGfx.lineStyle(1.2, 0xcfd8dc, 0.8);
                    this.barrelGfx.moveTo(bx - 1, by0);
                    this.barrelGfx.lineTo(bx - 1, -mLenCenter + 8);

                    // 枪身强化金属套箍环 (Breech Sleeve Collars)
                    [-24 + recoilOffset, -44 + recoilOffset].forEach((ry) => {
                        this.barrelGfx.beginFill(0x334155, 1);
                        this.barrelGfx.lineStyle(1, 0xffd700, 0.85);
                        this.barrelGfx.drawRect(bx - 5.5, ry, 11, 4);
                        this.barrelGfx.endFill();
                    });

                    // 重型枪口制退消焰器 (Muzzle Brake)
                    this.barrelGfx.beginFill(0x0f172a, 1);
                    this.barrelGfx.lineStyle(1.8, 0x00e5ff, 1);
                    this.barrelGfx.drawRect(bx - 6, -mLenCenter, 12, 8);
                    this.barrelGfx.endFill();

                    // 枪口内部高能等离子膛线发光口
                    this.barrelGfx.beginFill(0x00e5ff, 0.95);
                    this.barrelGfx.drawRect(bx - 3, -mLenCenter, 6, 4);
                    this.barrelGfx.endFill();
                });

                // 炮管横向机械固定连接锁扣 (Bridge Stabilizer)
                this.barrelGfx.beginFill(0x1e293b, 1);
                this.barrelGfx.lineStyle(1.2, 0x00e5ff, 0.8);
                this.barrelGfx.drawRect(-14, -34 + recoilOffset, 28, 5);
                this.barrelGfx.endFill();
            }

            // 3.3 超能等离子反应堆核心与双向旋转流光能环
            if (this.coreGfx) {
                this.coreGfx.clear();

                // 核心重型防爆约束环底座
                this.coreGfx.beginFill(0x0b1320, 1);
                this.coreGfx.lineStyle(2, 0x475569, 1);
                this.coreGfx.drawCircle(0, 0, 24);
                this.coreGfx.endFill();

                // 外层能量导流环 (顺时针旋转，3 段电弧)
                const arcRot1 = this.ringRotation * 2.0;
                this.coreGfx.lineStyle(2.5, 0x00b0ff, 0.9);
                for (let a = 0; a < 3; a++) {
                    const startA = arcRot1 + (a * Math.PI * 2) / 3;
                    this.coreGfx.arc(0, 0, 19, startA, startA + 1.3);
                }

                // 内层能量聚束环 (逆时针反向高速旋转，3 段电弧)
                const arcRot2 = this.ringRotation * -2.6;
                this.coreGfx.lineStyle(2, 0x00e5ff, 0.95);
                for (let a = 0; a < 3; a++) {
                    const startA = arcRot2 + (a * Math.PI * 2) / 3;
                    this.coreGfx.arc(0, 0, 14, startA, startA + 1.2);
                }

                // 反应堆中心超载高能脉冲球 (随开火与呼吸脉动)
                const coreBreath = (Math.sin(this.corePulse * 3.0) + 1) * 0.5;
                const fireFlash = this.recoil * 0.25;

                // 等离子外晕
                this.coreGfx.beginFill(0x0091ea, 0.45);
                this.coreGfx.drawCircle(0, 0, 11 + coreBreath * 3 + fireFlash);
                this.coreGfx.endFill();

                // 等离子聚能球
                this.coreGfx.beginFill(0x00e5ff, 0.9);
                this.coreGfx.drawCircle(0, 0, 7 + coreBreath * 2 + fireFlash);
                this.coreGfx.endFill();

                // 核心超高温白炽光斑 (Singularity)
                this.coreGfx.beginFill(0xffffff, 1);
                this.coreGfx.drawCircle(0, 0, 3.5 + coreBreath);
                this.coreGfx.endFill();
            }

            // 3.4 枪口开火等离子激波与火焰
            if (this.muzzleFlashGfx) {
                this.muzzleFlashGfx.clear();
                if (this.muzzleFlash > 0) {
                    const mY = -68 + recoilOffset;

                    // 枪口横向扩散等离子激波
                    this.muzzleFlashGfx.lineStyle(2, 0x00e5ff, this.muzzleFlash);
                    this.muzzleFlashGfx.moveTo(-24 * this.muzzleFlash, mY);
                    this.muzzleFlashGfx.lineTo(24 * this.muzzleFlash, mY);

                    // 耀眼菱形激波 (Shock Diamond)
                    this.muzzleFlashGfx.beginFill(0xffffff, this.muzzleFlash);
                    this.muzzleFlashGfx.drawPolygon([
                        0, mY - 26 * this.muzzleFlash,
                        10 * this.muzzleFlash, mY - 6,
                        0, mY + 6,
                        -10 * this.muzzleFlash, mY - 6
                    ]);
                    this.muzzleFlashGfx.endFill();

                    // 外层金青等离子烈焰
                    this.muzzleFlashGfx.beginFill(0x00e5ff, this.muzzleFlash * 0.6);
                    this.muzzleFlashGfx.drawCircle(0, mY - 8, 14 * this.muzzleFlash);
                    this.muzzleFlashGfx.endFill();
                }
            }
        }

        // 4. 绚丽彩虹贯穿激光 (Rainbow Laser Beam)
        if (this.laserGfx) {
            this.laserGfx.clear();
            if (this.isFiringLaser) {
                const len = 1750;
                const endX = Math.cos(this.angle) * len;
                const endY = Math.sin(this.angle) * len;
                const pulse = Math.sin(performance.now() * 0.02) * 6;
                const now = performance.now() * 0.005;

                // 动态彩虹七色外层高能等离子流晕
                const rainbowColors = [0xff0055, 0xff9100, 0xffea00, 0x00e676, 0x00e5ff, 0x2979ff, 0xd500f9];
                const activeColor = rainbowColors[Math.floor(now * 3) % rainbowColors.length];

                // 超广角彩虹等离子光晕 (外层)
                this.laserGfx.lineStyle(68 + pulse, activeColor, 0.4);
                this.laserGfx.moveTo(0, 0);
                this.laserGfx.lineTo(endX, endY);

                // 彩虹中层高能束 (青蓝金交织)
                this.laserGfx.lineStyle(42 + pulse * 0.5, 0x00e5ff, 0.65);
                this.laserGfx.moveTo(0, 0);
                this.laserGfx.lineTo(endX, endY);

                this.laserGfx.lineStyle(26, 0xffd700, 0.85);
                this.laserGfx.moveTo(0, 0);
                this.laserGfx.lineTo(endX, endY);

                // 纯白炽光高密核心束
                this.laserGfx.lineStyle(12, 0xffffff, 0.98);
                this.laserGfx.moveTo(0, 0);
                this.laserGfx.lineTo(endX, endY);
            }
        }
    }
}

// ================= 子弹对象池 (Bullet Pooling) =================
class BulletPool {
    constructor() {
        this.pool = [];
    }

    get(x, y, angle, levelConfig, targetFish = null) {
        if (this.pool.length > 0) {
            const b = this.pool.pop();
            b.reset(x, y, angle, levelConfig, targetFish);
            return b;
        }
        return new Bullet(x, y, angle, levelConfig, targetFish);
    }

    release(bullet) {
        if (bullet.view) bullet.view.visible = false;
        if (this.pool.length < 500) {
            this.pool.push(bullet);
        }
    }
}

window.bulletPool = new BulletPool();
window.CANNON_LEVELS = CANNON_LEVELS;
window.CANNON_SPRITE_DATA = CANNON_SPRITE_DATA;
window.Cannon = Cannon;
window.Bullet = Bullet;
