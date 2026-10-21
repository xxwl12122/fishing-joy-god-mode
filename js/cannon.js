/**
 * 捕鱼达人 - 顶级街机高科技机甲炮台、正版子弹与量子聚能能量系统
 * 集成真实街机 1~7 级重装金属炮台（5 帧真实机械后坐力动画）、全息激光战术瞄准、
 * 双重机械反重力旋转能环、重装机械机动侧翼、量子方舟核心与灭世龙神超限形态
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
        this.reset(x, y, angle, levelConfig, targetFish);
    }

    // 对象池复用重置接口
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
        this.bounces = 0;
        this.maxBounces = 5;
        this.isDead = false;
        this.trail = [];
        this.isHighTier = levelConfig.level >= 6;
        this.sparkParticles = [];
    }

    update(screenWidth, screenHeight) {
        if (this.isDead) return;

        // 1. 保存拖尾光粒
        const maxTrailLength = this.isHighTier ? 12 : 7;
        this.trail.push({ x: this.x, y: this.y, alpha: 0.9 });
        if (this.trail.length > maxTrailLength) {
            this.trail.shift();
        }
        for (const t of this.trail) {
            t.alpha *= 0.85;
        }

        // 2. 高阶炮台生成等离子火花与电弧飞屑
        if (this.isHighTier && Math.random() < 0.85) {
            this.sparkParticles.push({
                x: this.x + (Math.random() - 0.5) * 8,
                y: this.y + (Math.random() - 0.5) * 8,
                vx: -this.vx * 0.18 + (Math.random() - 0.5) * 3,
                vy: -this.vy * 0.18 + (Math.random() - 0.5) * 3,
                size: 2 + Math.random() * 3,
                alpha: 1,
                color: this.levelConfig.level >= 9 ? '#d500f9' : (this.levelConfig.level >= 8 ? '#ffea00' : '#ff3d00')
            });
        }

        // 3. 更新火花粒子
        for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
            const p = this.sparkParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.09;
            if (p.alpha <= 0) {
                this.sparkParticles.splice(i, 1);
            }
        }

        // 4. 锁定目标自动追踪微调
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

        // 5. 经典弹射反弹机制
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
        }
    }

    render(ctx) {
        if (this.isDead) return;

        // 1. 渲染粒子飞屑
        if (this.sparkParticles.length > 0) {
            for (const sp of this.sparkParticles) {
                ctx.save();
                ctx.globalAlpha = sp.alpha;
                ctx.fillStyle = sp.color;
                ctx.shadowColor = sp.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // 2. 渲染高能发光拖尾
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const ratio = i / this.trail.length;
            ctx.save();
            ctx.globalAlpha = t.alpha * (this.isHighTier ? 0.75 : 0.5);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = this.isHighTier ? 16 : 8;

            const trailRadius = this.radius * (this.isHighTier ? (0.5 + ratio * 0.9) : (0.3 + ratio * 0.7));
            ctx.beginPath();
            ctx.arc(t.x, t.y, trailRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 3. 渲染真实子弹贴图与高能光环
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2); // 贴图默认朝上

        const bulletIdx = Math.min(8, Math.max(1, this.levelConfig.level));
        const bulletImg = window.gameAssets ? window.gameAssets.get(`bullet${bulletIdx}`) : null;

        if (bulletImg) {
            // 贴图光晕
            ctx.shadowColor = this.color;
            ctx.shadowBlur = this.isHighTier ? 18 : 10;
            const bw = bulletImg.width * 1.15;
            const bh = bulletImg.height * 1.15;
            ctx.drawImage(bulletImg, -bw / 2, -bh / 2, bw, bh);

            // 高阶炮台增加电弧能量外环
            if (this.isHighTier) {
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, bw * 0.75, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else {
            // 矢量优雅备用回退
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 14;
            const grad = ctx.createRadialGradient(2, 0, 1, 0, 0, this.radius);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, this.color);
            grad.addColorStop(1, '#001030');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 0.9, this.radius * 1.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Cannon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 2; // 默认朝正上方
        this.targetAngle = -Math.PI / 2;

        this.levelIndex = 0; // 0 ~ 9
        this.recoil = 0; // 机械位移后坐力
        this.recoilFrame = 0; // 0 ~ 4 官方贴图帧后坐力序列
        this.recoilFrameTimer = 0;

        this.isRageMode = false;
        this.rageTimer = 0;

        // 激光蓄能系统
        this.laserEnergy = 0;
        this.isFiringLaser = false;
        this.laserTimer = 0;
        this.laserDuration = 200;

        this.lastFireTime = 0;
        this.fireInterval = 90; // 无敌破解版极致开火间隔

        // 高级感动画参数：反重力机甲能量环旋转角
        this.ringRotation = 0;
        this.corePulse = 0;
        this.muzzleFlash = 0; // 炮口火焰闪光爆发
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
        this.recoilFrame = 1; // 启动贴图 5 帧后坐力动画
        this.recoilFrameTimer = 0;
        this.muzzleFlash = 1.0; // 激发炮口烈焰

        const cfg = this.getCurrentConfig();

        // 炮口位置计算
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
            // 四联重炮
            bullets.push(getB(muzzleX, muzzleY, this.angle - 0.12));
            bullets.push(getB(muzzleX, muzzleY, this.angle - 0.04));
            bullets.push(getB(muzzleX, muzzleY, this.angle + 0.04));
            bullets.push(getB(muzzleX, muzzleY, this.angle + 0.12));
        }

        return bullets;
    }

    update() {
        // 后坐力平滑回弹
        if (this.recoil > 0) {
            this.recoil *= 0.8;
            if (this.recoil < 0.2) this.recoil = 0;
        }

        // 官方 5 帧真实后坐力贴图推进
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

        // 炮口烈焰衰减
        if (this.muzzleFlash > 0) {
            this.muzzleFlash = Math.max(0, this.muzzleFlash - 0.18);
        }

        // 反重力机甲能量环旋转
        this.ringRotation += 0.025;
        this.corePulse += 0.08;

        // 狂暴模式
        if (this.isRageMode && this.rageTimer > 0 && this.rageTimer < 90000000) {
            this.rageTimer--;
            if (this.rageTimer <= 0) {
                this.isRageMode = false;
                const el = document.getElementById('skill-rage');
                if (el) el.classList.remove('active');
            }
        }

        // 激光发射
        if (this.isFiringLaser) {
            this.laserTimer--;
            if (this.laserTimer <= 0) {
                this.isFiringLaser = false;
            }
        }
    }

    render(ctx) {
        const cfg = this.getCurrentConfig();

        // 1. 渲染底部全息激光战术瞄准线 (Tactical Holographic Laser Sight)
        this.renderHolographicAiming(ctx, cfg);

        // 2. 渲染经典街机控制底座 (Arcade Pedestal & Chassis)
        this.renderChassisPlatform(ctx, cfg);

        // 3. 渲染旋转炮台机体与高科技侧翼
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2); // 以朝上为基准旋转

        // 3.1 渲染重装机械机动侧翼 (Pneumatic Mecha Stabilizer Wings)
        this.renderMechaWings(ctx, cfg);

        // 3.2 渲染官方正版重金属炮台贴图 (含 5 帧真实机械后座动作)
        this.renderCannonSprite(ctx, cfg);

        // 3.3 渲染量子方舟核心 (Quantum Ark Core)
        this.renderQuantumCore(ctx, cfg);

        // 3.4 渲染炮口等离子烈焰爆发 (Muzzle Flash)
        if (this.muzzleFlash > 0) {
            this.renderMuzzleFlash(ctx, cfg);
        }

        ctx.restore();

        // 4. 激光发射射线
        if (this.isFiringLaser) {
            this.renderLaserBeam(ctx);
        }
    }

    // 渲染全息激光战术瞄准系统
    renderHolographicAiming(ctx, cfg) {
        ctx.save();
        const maxDist = 900;
        const targetX = this.x + Math.cos(this.angle) * maxDist;
        const targetY = this.y + Math.sin(this.angle) * maxDist;

        // 瞄准激光光轨 (虚线科技流光)
        ctx.strokeStyle = cfg.color;
        ctx.globalAlpha = 0.35 + Math.sin(this.corePulse * 1.5) * 0.15;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -performance.now() * 0.04;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(this.x + Math.cos(this.angle) * 55, this.y + Math.sin(this.angle) * 55);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.restore();
    }

    // 渲染街机控制平台底座
    renderChassisPlatform(ctx, cfg) {
        const bottomImg = window.gameAssets ? window.gameAssets.get('bottom') : null;
        if (bottomImg) {
            ctx.save();
            // bottom.png 的标准底座截取
            const bW = 765;
            const bH = 72;
            ctx.drawImage(bottomImg, 0, 0, bW, bH, this.x - bW / 2, this.y - 18, bW, bH);
            ctx.restore();
        }

        // 双重反重力机甲能量环 (Dual Rotating Tech Rings)
        ctx.save();
        ctx.translate(this.x, this.y);

        // 外部合金机甲环
        const baseGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 56);
        baseGrad.addColorStop(0, '#37474f');
        baseGrad.addColorStop(0.65, '#212121');
        baseGrad.addColorStop(1, '#0d1b2a');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 52, 0, Math.PI * 2);
        ctx.fill();

        // 外层机械齿轮刻度环 (顺时针旋转)
        ctx.save();
        ctx.rotate(this.ringRotation);
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, Math.PI * 2);
        ctx.stroke();

        const ticks = 12;
        for (let i = 0; i < ticks; i++) {
            const a = (i / ticks) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 44, Math.sin(a) * 44);
            ctx.lineTo(Math.cos(a) * 50, Math.sin(a) * 50);
            ctx.stroke();
        }
        ctx.restore();

        // 内层符文能量环 (逆时针旋转)
        ctx.save();
        ctx.rotate(-this.ringRotation * 1.5);
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.5 + Math.sin(this.corePulse) * 0.3;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }

    // 渲染重装机械机动侧翼
    renderMechaWings(ctx, cfg) {
        ctx.save();
        const wingFlare = this.recoil * 0.3; // 发炮时机翼外扩液压缓冲
        ctx.fillStyle = '#263238';
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 8;

        // 左翼板
        ctx.beginPath();
        ctx.moveTo(-28 - wingFlare, 15);
        ctx.lineTo(-52 - wingFlare * 1.5, 5);
        ctx.lineTo(-44 - wingFlare * 1.5, -25);
        ctx.lineTo(-24 - wingFlare, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 右翼板
        ctx.beginPath();
        ctx.moveTo(28 + wingFlare, 15);
        ctx.lineTo(52 + wingFlare * 1.5, 5);
        ctx.lineTo(44 + wingFlare * 1.5, -25);
        ctx.lineTo(24 + wingFlare, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 翼板上的高能荧光导流线
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-34 - wingFlare, 8);
        ctx.lineTo(-44 - wingFlare * 1.3, -15);
        ctx.moveTo(34 + wingFlare, 8);
        ctx.lineTo(44 + wingFlare * 1.3, -15);
        ctx.stroke();

        ctx.restore();
    }

    // 渲染官方正版重金属炮台贴图
    renderCannonSprite(ctx, cfg) {
        const spriteIdx = cfg.spriteIndex || 1;
        const spriteMeta = CANNON_SPRITE_DATA[spriteIdx] || CANNON_SPRITE_DATA[1];
        const cannonImg = window.gameAssets ? window.gameAssets.get(spriteMeta.key) : null;

        if (cannonImg) {
            const frameY = this.recoilFrame * spriteMeta.h;
            ctx.save();
            ctx.shadowColor = cfg.color;
            ctx.shadowBlur = 10;

            // 绘制当前后坐力帧
            ctx.drawImage(
                cannonImg,
                0, frameY, spriteMeta.w, spriteMeta.h,
                -spriteMeta.regX, -spriteMeta.regY, spriteMeta.w, spriteMeta.h
            );

            // 超限神炮额外光效装甲强化 (Lv.8, 9, 10)
            if (cfg.level >= 8) {
                this.renderTitanGodArmor(ctx, cfg);
            }

            ctx.restore();
        } else {
            // 备用矢量重装炮管
            this.renderVectorBarrels(ctx, cfg);
        }
    }

    // 泰坦/神圣歼灭炮超限神级外装装甲
    renderTitanGodArmor(ctx, cfg) {
        ctx.save();
        // 磁轨加速光环
        const pulse = Math.sin(this.corePulse * 2) * 3;
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 18;

        // 黄金巨龙 / 暗物质神级加速器导轨
        ctx.beginPath();
        ctx.arc(0, -42, 26 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // 龙神神圣角饰
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(-18, -25);
        ctx.lineTo(-32, -60);
        ctx.lineTo(-12, -45);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(18, -25);
        ctx.lineTo(32, -60);
        ctx.lineTo(12, -45);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // 渲染量子方舟反应堆核心
    renderQuantumCore(ctx, cfg) {
        ctx.save();

        // 核心金属约束环
        const chamberGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
        chamberGrad.addColorStop(0, '#eceff1');
        chamberGrad.addColorStop(0.45, '#607d8b');
        chamberGrad.addColorStop(1, '#263238');
        ctx.fillStyle = chamberGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // 等离子呼吸能量球
        const breath = (Math.sin(this.corePulse * 2.5) + 1) * 0.5;
        const coreRadius = 8 + breath * 4;

        ctx.fillStyle = cfg.color;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 18 + breath * 10;
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // 核心白炽耀斑
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // 渲染炮口烈焰爆发
    renderMuzzleFlash(ctx, cfg) {
        ctx.save();
        const flashY = -62;
        ctx.translate(0, flashY);

        ctx.globalAlpha = this.muzzleFlash;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 25;

        // 锥形激波火焰
        ctx.beginPath();
        ctx.moveTo(0, -35 * this.muzzleFlash);
        ctx.lineTo(-18 * this.muzzleFlash, 5);
        ctx.lineTo(18 * this.muzzleFlash, 5);
        ctx.closePath();
        ctx.fill();

        // 环形冲击激波
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 24 * this.muzzleFlash, 8 * this.muzzleFlash, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // 矢量备用炮管
    renderVectorBarrels(ctx, cfg) {
        const barrelLength = 48 - this.recoil;
        const grad = ctx.createLinearGradient(-12, 0, 12, 0);
        grad.addColorStop(0, '#37474f');
        grad.addColorStop(0.5, '#cfd8dc');
        grad.addColorStop(1, '#263238');
        ctx.fillStyle = grad;
        ctx.fillRect(-9, -barrelLength, 18, barrelLength);
        ctx.fillStyle = cfg.color;
        ctx.fillRect(-11, -barrelLength, 22, 9);
    }

    renderLaserBeam(ctx) {
        ctx.save();
        const length = 1600;
        const endX = this.x + Math.cos(this.angle) * length;
        const endY = this.y + Math.sin(this.angle) * length;

        // 巨型激光外晕
        ctx.strokeStyle = 'rgba(255, 0, 80, 0.45)';
        ctx.lineWidth = 48 + Math.sin(Date.now() * 0.05) * 8;
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 激光内芯
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 16 + Math.sin(Date.now() * 0.08) * 4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.restore();
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
        if (this.pool.length < 300) {
            this.pool.push(bullet);
        }
    }
}

window.bulletPool = new BulletPool();
window.CANNON_LEVELS = CANNON_LEVELS;
window.Cannon = Cannon;
window.Bullet = Bullet;
