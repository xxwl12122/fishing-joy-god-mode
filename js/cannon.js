/**
 * 捕鱼达人 - 炮台、子弹发射、弹射反射与激光能量炮系统
 */

const CANNON_LEVELS = [
    { level: 1, name: '青铜单管炮', cost: 1, netRadius: 70, speed: 18, color: '#00e5ff', barrels: 1 },
    { level: 2, name: '白银强化炮', cost: 2, netRadius: 80, speed: 19, color: '#2979ff', barrels: 1 },
    { level: 3, name: '黄金双联炮', cost: 5, netRadius: 90, speed: 20, color: '#ffd700', barrels: 2 },
    { level: 4, name: '翡翠爆裂炮', cost: 10, netRadius: 100, speed: 21, color: '#00e676', barrels: 2 },
    { level: 5, name: '紫晶充能炮', cost: 20, netRadius: 115, speed: 22, color: '#d500f9', barrels: 2 },
    { level: 6, name: '赤焰三管炮', cost: 50, netRadius: 130, speed: 23, color: '#ff3d00', barrels: 3 },
    { level: 7, name: '极光等离子炮', cost: 100, netRadius: 150, speed: 24, color: '#00b0ff', barrels: 3 },
    { level: 8, name: '泰坦四联重炮', cost: 200, netRadius: 170, speed: 25, color: '#ffea00', barrels: 4 },
    { level: 9, name: '虚空毁灭巨炮', cost: 500, netRadius: 190, speed: 26, color: '#651fff', barrels: 4 },
    { level: 10, name: '灭世龙神神圣炮', cost: 1000, netRadius: 220, speed: 28, color: '#ff0055', barrels: 4 }
];

class Bullet {
    constructor(x, y, angle, levelConfig, targetFish = null) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.levelConfig = levelConfig;
        this.targetFish = targetFish;

        this.speed = levelConfig.speed;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        this.radius = 6 + Math.min(levelConfig.level * 0.7, 7);
        this.color = levelConfig.color;
        this.bounces = 0;
        this.maxBounces = 5;
        this.isDead = false;
        this.trail = [];
        this.isHighTier = levelConfig.level >= 6; // 高阶神级炮台标识
        this.sparkParticles = [];
    }

    update(screenWidth, screenHeight) {
        if (this.isDead) return;

        // 保存拖尾 (高阶炮台更长更粗)
        const maxTrailLength = this.isHighTier ? 12 : 6;
        this.trail.push({ x: this.x, y: this.y, alpha: 0.85 });
        if (this.trail.length > maxTrailLength) {
            this.trail.shift();
        }
        for (const t of this.trail) {
            t.alpha *= 0.85;
        }

        // 高阶炮台生成火焰与电弧火花粒子
        if (this.isHighTier && Math.random() < 0.75) {
            this.sparkParticles.push({
                x: this.x + (Math.random() - 0.5) * 8,
                y: this.y + (Math.random() - 0.5) * 8,
                vx: -this.vx * 0.2 + (Math.random() - 0.5) * 3,
                vy: -this.vy * 0.2 + (Math.random() - 0.5) * 3,
                size: 2 + Math.random() * 3,
                alpha: 1,
                color: this.levelConfig.level >= 9 ? '#ff0055' : (this.levelConfig.level >= 8 ? '#ffea00' : '#ff3d00')
            });
        }

        // 更新火花粒子
        for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
            const p = this.sparkParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.08;
            if (p.alpha <= 0) {
                this.sparkParticles.splice(i, 1);
            }
        }

        // 若开启锁定目标，子弹智能微调追踪锁定鱼
        if (this.targetFish && !this.targetFish.isDead) {
            const targetAngle = Math.atan2(this.targetFish.y - this.y, this.targetFish.x - this.x);
            // 平滑插值转弯
            let angleDiff = targetAngle - this.angle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            this.angle += angleDiff * 0.12;

            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // 经典捕鱼弹射反弹机制 (撞击边界不浪费子弹)
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

        // 超过反弹次数或穿过底部
        if (this.bounces > this.maxBounces || this.y > screenHeight + 30) {
            this.isDead = true;
        }
    }

    render(ctx) {
        if (this.isDead) return;

        // 1. 渲染高阶火花与电弧粒子
        if (this.sparkParticles && this.sparkParticles.length > 0) {
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

        // 2. 渲染高能发光拖尾 (高阶炮台多层烈焰等离子光晕)
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

        // 3. 渲染弹丸本体 (高阶炮台带有能量光环与电弧)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.isHighTier ? 22 : 12;

        if (this.isHighTier) {
            // 外层能量激波环
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
            ctx.stroke();

            // 旋转电弧
            const arcTime = Date.now() * 0.01;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.8, arcTime, arcTime + Math.PI * 0.8);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.8, arcTime + Math.PI, arcTime + Math.PI * 1.8);
            ctx.stroke();
        }

        // 椭圆流光弹丸
        const grad = ctx.createRadialGradient(2, 0, 1, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, this.color);
        grad.addColorStop(1, '#000033');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * (this.isHighTier ? 1.6 : 1.4), this.radius * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();

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
        this.recoil = 0; // 后坐力回弹距离
        this.isRageMode = false; // 极速狂暴模式
        this.rageTimer = 0;

        // 激光蓄能系统 (0 ~ 100)
        this.laserEnergy = 0;
        this.isFiringLaser = false;
        this.laserTimer = 0;
        this.laserDuration = 200; // 帧数

        this.lastFireTime = 0;
        this.fireInterval = 90; // 无敌破解版：基础射速大幅翻倍提升
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
        this.laserEnergy = 100; // 无敌破解版：保持满蓄能状态
    }

    fireLaser() {
        if (this.isFiringLaser) return false;
        this.isFiringLaser = true;
        this.laserTimer = this.laserDuration;
        this.laserEnergy = 100; // 无敌破解版：激光发射完毕后瞬间充满
        if (window.soundManager) {
            window.soundManager.playLaser();
        }
        return true;
    }

    aimAt(targetX, targetY) {
        let desired = Math.atan2(targetY - this.y, targetX - this.x);
        // 限制仰角：不能朝向底盘下方开火 (限制在 -170° 到 -10° 之间)
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
        this.recoil = 14; // 触发炮管强劲后坐力

        const cfg = this.getCurrentConfig();

        // 炮口位置计算
        const barrelLength = 48 - this.recoil;
        const muzzleX = this.x + Math.cos(this.angle) * barrelLength;
        const muzzleY = this.y + Math.sin(this.angle) * barrelLength;

        // 播放发炮音效
        if (window.soundManager) {
            window.soundManager.playShoot(cfg.level);
        }

        // 根据炮管数量发射子弹 (单发、双发微散布、三联发)
        const bullets = [];
        if (cfg.barrels === 1) {
            bullets.push(new Bullet(muzzleX, muzzleY, this.angle, cfg, targetFish));
        } else if (cfg.barrels === 2) {
            // 双管左右微偏移
            const offset = 7;
            const perpAngle = this.angle + Math.PI / 2;
            const b1X = muzzleX + Math.cos(perpAngle) * offset;
            const b1Y = muzzleY + Math.sin(perpAngle) * offset;
            const b2X = muzzleX - Math.cos(perpAngle) * offset;
            const b2Y = muzzleY - Math.sin(perpAngle) * offset;
            bullets.push(new Bullet(b1X, b1Y, this.angle - 0.03, cfg, targetFish));
            bullets.push(new Bullet(b2X, b2Y, this.angle + 0.03, cfg, targetFish));
        } else if (cfg.barrels === 3) {
            bullets.push(new Bullet(muzzleX, muzzleY, this.angle - 0.08, cfg, targetFish));
            bullets.push(new Bullet(muzzleX, muzzleY, this.angle, cfg, targetFish));
            bullets.push(new Bullet(muzzleX, muzzleY, this.angle + 0.08, cfg, targetFish));
        } else {
            // 四联重炮
            bullets.push(new Bullet(muzzleX, muzzleY, this.angle - 0.12, cfg, targetFish));
            bullets.push(new Bullet(muzzleX, muzzleY, this.angle - 0.04, cfg, targetFish));
            bullets.push(new Bullet(muzzleX, muzzleY, this.angle + 0.04, cfg, targetFish));
            bullets.push(new Bullet(muzzleX, muzzleY, this.angle + 0.12, cfg, targetFish));
        }

        return bullets;
    }

    update() {
        // 后坐力平滑回弹
        if (this.recoil > 0) {
            this.recoil *= 0.82;
            if (this.recoil < 0.2) this.recoil = 0;
        }

        // 狂暴模式倒计时 (若为手动常开，则等待玩家手动取消)
        if (this.isRageMode && this.rageTimer > 0 && this.rageTimer < 90000000) {
            this.rageTimer--;
            if (this.rageTimer <= 0) {
                this.isRageMode = false;
                const el = document.getElementById('skill-rage');
                if (el) el.classList.remove('active');
            }
        }

        // 激光发射持续更新
        if (this.isFiringLaser) {
            this.laserTimer--;
            if (this.laserTimer <= 0) {
                this.isFiringLaser = false;
            }
        }
    }

    render(ctx) {
        const cfg = this.getCurrentConfig();

        // 1. 底座旋转机台 (Base Pedestal)
        ctx.save();
        ctx.translate(this.x, this.y);

        // 底座外发光圆环
        const ringGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 52);
        ringGrad.addColorStop(0, '#37474f');
        ringGrad.addColorStop(0.7, '#263238');
        ringGrad.addColorStop(1, '#102027');
        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, Math.PI * 2);
        ctx.fill();

        // 动态能量光环
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 44, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // 2. 旋转炮台机身与炮管
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2); // 调整朝向以 12 点钟方向对齐

        const barrelOffset = -this.recoil;

        // 根据炮台等级与管数绘制不同形态的炫酷炮管
        this.drawBarrels(ctx, cfg, barrelOffset);

        // 炮塔中心机械旋转转盘
        const coreGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
        coreGrad.addColorStop(0, '#eceff1');
        coreGrad.addColorStop(0.5, '#78909c');
        coreGrad.addColorStop(1, '#37474f');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();

        // 炮心发光水晶
        ctx.fillStyle = cfg.color;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 3. 如果正在发射毁灭激光，绘制全屏穿透激光束
        if (this.isFiringLaser) {
            this.renderLaserBeam(ctx);
        }
    }

    drawBarrels(ctx, cfg, recoil) {
        ctx.fillStyle = '#cfd8dc';
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;

        const barrelLength = 46 + recoil;

        if (cfg.barrels === 1) {
            // 单管重炮
            const grad = ctx.createLinearGradient(-10, 0, 10, 0);
            grad.addColorStop(0, '#546e7a');
            grad.addColorStop(0.5, '#b0bec5');
            grad.addColorStop(1, '#37474f');
            ctx.fillStyle = grad;
            ctx.fillRect(-8, -barrelLength, 16, barrelLength);

            // 炮口加固圈
            ctx.fillStyle = cfg.color;
            ctx.fillRect(-10, -barrelLength, 20, 8);
        } else if (cfg.barrels === 2) {
            // 双管联装
            const grad = ctx.createLinearGradient(-16, 0, 16, 0);
            grad.addColorStop(0, '#455a64');
            grad.addColorStop(0.5, '#cfd8dc');
            grad.addColorStop(1, '#263238');
            ctx.fillStyle = grad;

            ctx.fillRect(-14, -barrelLength, 10, barrelLength);
            ctx.fillRect(4, -barrelLength, 10, barrelLength);

            ctx.fillStyle = cfg.color;
            ctx.fillRect(-15, -barrelLength, 12, 7);
            ctx.fillRect(3, -barrelLength, 12, 7);
        } else if (cfg.barrels === 3) {
            // 三管加特林/三叉戟
            ctx.fillStyle = '#78909c';
            ctx.fillRect(-18, -barrelLength + 6, 9, barrelLength - 6);
            ctx.fillRect(-4.5, -barrelLength, 9, barrelLength);
            ctx.fillRect(9, -barrelLength + 6, 9, barrelLength - 6);

            ctx.fillStyle = cfg.color;
            ctx.fillRect(-19, -barrelLength + 6, 11, 7);
            ctx.fillRect(-5.5, -barrelLength, 11, 7);
            ctx.fillRect(8, -barrelLength + 6, 11, 7);
        } else {
            // 四联装灭世神炮
            ctx.fillStyle = '#b0bec5';
            ctx.fillRect(-22, -barrelLength + 4, 8, barrelLength - 4);
            ctx.fillRect(-11, -barrelLength, 9, barrelLength);
            ctx.fillRect(2, -barrelLength, 9, barrelLength);
            ctx.fillRect(14, -barrelLength + 4, 8, barrelLength - 4);

            ctx.fillStyle = cfg.color;
            ctx.shadowColor = cfg.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(-23, -barrelLength + 4, 10, 8);
            ctx.fillRect(-12, -barrelLength, 11, 8);
            ctx.fillRect(1, -barrelLength, 11, 8);
            ctx.fillRect(13, -barrelLength + 4, 10, 8);
        }
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

window.CANNON_LEVELS = CANNON_LEVELS;
window.Cannon = Cannon;
window.Bullet = Bullet;
