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

        // 1. 全息战术激光瞄准线
        this.aimGfx = new PIXI.Graphics();
        this.view.addChild(this.aimGfx);

        // 2. 激光束
        this.laserGfx = new PIXI.Graphics();
        this.view.addChild(this.laserGfx);

        // 3. 旋转炮台机身总成 (围绕 (0, 0) 精准旋转)
        this.turret = new PIXI.Container();
        this.view.addChild(this.turret);

        // 3.1 真实高清去底神级炮台贴图 (Sprite)
        const cannonTex = (window.pixiTextures && window.pixiTextures.cannonTexture) || PIXI.Texture.from('assets/cannon.png');
        this.cannonSprite = new PIXI.Sprite(cannonTex);
        // 关键对齐：锚点 X=0.5 (中轴), Y=0.7037 (旋转中心轴，完美对齐底盘转盘)
        this.cannonSprite.anchor.set(0.5, 0.7037);
        // 缩放到高清街机黄金比例：宽度 94px，高度 144px
        this.cannonSprite.width = 94;
        this.cannonSprite.height = 144;
        this.turret.addChild(this.cannonSprite);

        // 3.2 炮口高能等离子开火激波
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
        this.recoil = 16;
        this.muzzleFlash = 1.0;

        const cfg = this.getCurrentConfig();
        // 视觉精准对齐：贴图高度 144px，anchorY = 0.7037，中心轴到炮口的距离为 144 * 0.7037 = 101.3px
        const currentMuzzleDist = 101.3 - this.recoil * 0.45;
        const muzzleX = this.x + Math.cos(this.angle) * currentMuzzleDist;
        const muzzleY = this.y + Math.sin(this.angle) * currentMuzzleDist;

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
            this.recoil *= 0.76;
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

        // 1. 全息战术激光瞄准线 (起点严格对齐炮口尖端 102px)
        if (this.aimGfx) {
            this.aimGfx.clear();
            const maxDist = 950;
            const startDist = 102;
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

        // 2. 旋转炮台机身 (围绕中心轴顺畅旋转)
        if (this.turret) {
            this.turret.rotation = this.angle + Math.PI / 2;

            // 2.1 炮台贴图后坐力缩放与轴向位移
            if (this.cannonSprite) {
                // 动态绑定最新材质
                if (window.pixiTextures && window.pixiTextures.cannonTexture && this.cannonSprite.texture !== window.pixiTextures.cannonTexture) {
                    this.cannonSprite.texture = window.pixiTextures.cannonTexture;
                }

                // 物理后座力：向后滑动 + 弹性缩放 (Squash & Stretch)
                const baseW = 94;
                const baseH = 144;
                const recoilCompress = this.recoil * 0.45;
                this.cannonSprite.y = recoilCompress;
                // 开火时横向微展，纵向后坐压缩
                this.cannonSprite.width = baseW * (1 + this.recoil * 0.005);
                this.cannonSprite.height = baseH * (1 - this.recoil * 0.008);
            }

            // 2.2 炮口开火等离子激波与火焰 (精准附着于炮口 tip Y = -101.3 + recoilCompress)
            if (this.muzzleFlashGfx) {
                this.muzzleFlashGfx.clear();
                if (this.muzzleFlash > 0) {
                    const mY = -101.3 + this.recoil * 0.45;

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

        // 3. 绚丽彩虹贯穿激光 (Rainbow Laser Beam)
        if (this.laserGfx) {
            this.laserGfx.clear();
            if (this.isFiringLaser) {
                const len = 1750;
                const startDist = 101.3;
                const startX = Math.cos(this.angle) * startDist;
                const startY = Math.sin(this.angle) * startDist;
                const endX = Math.cos(this.angle) * len;
                const endY = Math.sin(this.angle) * len;
                const pulse = Math.sin(performance.now() * 0.02) * 6;
                const now = performance.now() * 0.005;

                // 动态彩虹七色外层高能等离子流晕
                const rainbowColors = [0xff0055, 0xff9100, 0xffea00, 0x00e676, 0x00e5ff, 0x2979ff, 0xd500f9];
                const activeColor = rainbowColors[Math.floor(now * 3) % rainbowColors.length];

                // 超广角彩虹等离子光晕 (外层)
                this.laserGfx.lineStyle(68 + pulse, activeColor, 0.4);
                this.laserGfx.moveTo(startX, startY);
                this.laserGfx.lineTo(endX, endY);

                // 彩虹中层高能束 (青蓝金交织)
                this.laserGfx.lineStyle(42 + pulse * 0.5, 0x00e5ff, 0.65);
                this.laserGfx.moveTo(startX, startY);
                this.laserGfx.lineTo(endX, endY);

                this.laserGfx.lineStyle(26, 0xffd700, 0.85);
                this.laserGfx.moveTo(startX, startY);
                this.laserGfx.lineTo(endX, endY);

                // 纯白炽光高密核心束
                this.laserGfx.lineStyle(12, 0xffffff, 0.98);
                this.laserGfx.moveTo(startX, startY);
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
