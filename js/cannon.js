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
    { level: 10, name: '灭世龙神神圣歼灭炮', cost: 1000, netRadius: 230, speed: 29, color: '#ff0055', barrels: 4, spriteIndex: 7 }
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
        this.laserDuration = 200;

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

        // 1. 底座机台
        this.pedestalSprite = new PIXI.Sprite();
        this.pedestalSprite.anchor.set(0.5, 0.25);
        this.view.addChild(this.pedestalSprite);

        // 2. 全息战术激光瞄准线
        this.aimGfx = new PIXI.Graphics();
        this.view.addChild(this.aimGfx);

        // 3. 旋转炮台机身
        this.turret = new PIXI.Container();
        this.view.addChild(this.turret);

        // 3.1 机甲侧翼
        this.wingsGfx = new PIXI.Graphics();
        this.turret.addChild(this.wingsGfx);

        // 3.2 官方炮台贴图
        this.barrelSprite = new PIXI.Sprite();
        this.turret.addChild(this.barrelSprite);

        // 3.3 旋转能环与核心
        this.ringsGfx = new PIXI.Graphics();
        this.turret.addChild(this.ringsGfx);

        this.coreGfx = new PIXI.Graphics();
        this.turret.addChild(this.coreGfx);

        // 3.4 炮口闪光
        this.muzzleFlashGfx = new PIXI.Graphics();
        this.turret.addChild(this.muzzleFlashGfx);

        // 4. 激光束
        this.laserGfx = new PIXI.Graphics();
        this.view.addChild(this.laserGfx);

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
        this.recoil = 15;
        this.recoilFrame = 1;
        this.recoilFrameTimer = 0;
        this.muzzleFlash = 1.0;

        const cfg = this.getCurrentConfig();
        const barrelLength = 54 - this.recoil * 0.5;
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
            const offset = 8;
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
            this.recoil *= 0.8;
            if (this.recoil < 0.2) this.recoil = 0;
        }

        if (this.recoilFrame > 0) {
            this.recoilFrameTimer++;
            if (this.recoilFrameTimer >= 2) {
                this.recoilFrameTimer = 0;
                this.recoilFrame++;
                if (this.recoilFrame >= 5) {
                    this.recoilFrame = 0;
                }
            }
        }

        if (this.muzzleFlash > 0) {
            this.muzzleFlash = Math.max(0, this.muzzleFlash - 0.18);
        }

        this.ringRotation += 0.025;
        this.corePulse += 0.08;

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

        // 1. 底盘贴图
        if (this.pedestalSprite && window.pixiTextures && window.pixiTextures.bottom) {
            this.pedestalSprite.texture = window.pixiTextures.bottom;
            this.pedestalSprite.y = -10;
        }

        // 2. 全息战术激光瞄准线
        if (this.aimGfx) {
            this.aimGfx.clear();
            const maxDist = 900;
            const targetX = Math.cos(this.angle) * maxDist;
            const targetY = Math.sin(this.angle) * maxDist;
            this.aimGfx.lineStyle(2, colorNum, 0.45);
            this.aimGfx.moveTo(Math.cos(this.angle) * 55, Math.sin(this.angle) * 55);
            this.aimGfx.lineTo(targetX, targetY);
        }

        // 3. 炮台主轴旋转
        if (this.turret) {
            this.turret.rotation = this.angle + Math.PI / 2;

            // 侧翼液压外扩
            if (this.wingsGfx) {
                this.wingsGfx.clear();
                const flare = this.recoil * 0.35;
                this.wingsGfx.beginFill(0x263238, 0.95);
                this.wingsGfx.lineStyle(2, colorNum, 0.85);

                this.wingsGfx.drawPolygon([
                    -28 - flare, 15,
                    -52 - flare * 1.5, 5,
                    -44 - flare * 1.5, -25,
                    -24 - flare, -15
                ]);
                this.wingsGfx.drawPolygon([
                    28 + flare, 15,
                    52 + flare * 1.5, 5,
                    44 + flare * 1.5, -25,
                    24 + flare, -15
                ]);
                this.wingsGfx.endFill();
            }

            // 炮管贴图
            const spriteIdx = cfg.spriteIndex || 1;
            const cannonPack = window.pixiTextures && window.pixiTextures.cannons ? window.pixiTextures.cannons[spriteIdx] : null;
            if (cannonPack && this.barrelSprite) {
                const frameIdx = Math.min(4, Math.max(0, this.recoilFrame));
                this.barrelSprite.texture = cannonPack.frames[frameIdx];
                this.barrelSprite.anchor.set(cannonPack.data.regX / cannonPack.data.w, cannonPack.data.regY / cannonPack.data.h);
            }

            // 核心反应堆与双重旋转能环
            if (this.coreGfx) {
                this.coreGfx.clear();
                this.coreGfx.beginFill(0x263238, 1);
                this.coreGfx.lineStyle(2, colorNum, 0.8);
                this.coreGfx.drawCircle(0, 0, 22);
                this.coreGfx.endFill();

                const breath = (Math.sin(this.corePulse * 2.5) + 1) * 0.5;
                this.coreGfx.beginFill(colorNum, 0.9);
                this.coreGfx.drawCircle(0, 0, 8 + breath * 4);
                this.coreGfx.endFill();

                this.coreGfx.beginFill(0xffffff, 1);
                this.coreGfx.drawCircle(0, 0, 4);
                this.coreGfx.endFill();
            }

            // 炮口等离子烈焰
            if (this.muzzleFlashGfx) {
                this.muzzleFlashGfx.clear();
                if (this.muzzleFlash > 0) {
                    this.muzzleFlashGfx.beginFill(0xffffff, this.muzzleFlash);
                    this.muzzleFlashGfx.drawPolygon([
                        0, -65 - 30 * this.muzzleFlash,
                        -16 * this.muzzleFlash, -65,
                        16 * this.muzzleFlash, -65
                    ]);
                    this.muzzleFlashGfx.endFill();
                }
            }
        }

        // 4. 巨型贯穿激光
        if (this.laserGfx) {
            this.laserGfx.clear();
            if (this.isFiringLaser) {
                const len = 1600;
                const endX = Math.cos(this.angle) * len;
                const endY = Math.sin(this.angle) * len;

                this.laserGfx.lineStyle(42, 0xff0055, 0.5);
                this.laserGfx.moveTo(0, 0);
                this.laserGfx.lineTo(endX, endY);

                this.laserGfx.lineStyle(16, 0xffffff, 0.95);
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
        if (this.pool.length < 300) {
            this.pool.push(bullet);
        }
    }
}

window.bulletPool = new BulletPool();
window.CANNON_LEVELS = CANNON_LEVELS;
window.CANNON_SPRITE_DATA = CANNON_SPRITE_DATA;
window.Cannon = Cannon;
window.Bullet = Bullet;
