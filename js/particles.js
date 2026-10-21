/**
 * 捕鱼达人 - PixiJS (WebGL) 硬件加速粒子系统、震屏与打击视觉特效
 * 彻底告别 CPU 绘制与 GC 停顿，全量由 GPU 硬件渲染管线执行
 */

class ParticleSystem {
    constructor() {
        this.bubbles = [];
        this.coins = [];
        this.coinRain = [];
        this.hitSparks = [];
        this.scores = [];
        this.nets = [];
        this.explosions = [];
        this.lightnings = [];
        this.seaweeds = [];

        this.shakeTimer = 0;
        this.maxShakeTimer = 1;
        this.shakeIntensity = 0;
        this.freezeAlpha = 0;
        this.causticOffset = 0;

        this.coinSpritePool = [];

        this.initSeaweeds();
        this.initPixiDisplay();
    }

    initPixiDisplay() {
        if (typeof PIXI === 'undefined') return;

        // 背景图层 (承载水下乱流与丁达尔神光)
        this.bgGfx = new PIXI.Graphics();
        if (window.pixiLayers && window.pixiLayers.bg) {
            window.pixiLayers.bg.addChild(this.bgGfx);
        }

        // 水草图层
        this.seaweedGfx = new PIXI.Graphics();
        if (window.pixiLayers && window.pixiLayers.seaweed) {
            window.pixiLayers.seaweed.addChild(this.seaweedGfx);
        }

        // 渔网图层
        this.netGfx = new PIXI.Graphics();
        if (window.pixiLayers && window.pixiLayers.net) {
            window.pixiLayers.net.addChild(this.netGfx);
        }

        // 综合特效图层
        this.effectContainer = new PIXI.Container();
        this.bubbleGfx = new PIXI.Graphics();
        this.coinTrailGfx = new PIXI.Graphics();
        this.coinSpriteContainer = new PIXI.Container();
        this.coinRainGfx = new PIXI.Graphics();
        this.hitSparksGfx = new PIXI.Graphics();
        this.explosionGfx = new PIXI.Graphics();
        this.lightningGfx = new PIXI.Graphics();
        this.freezeGfx = new PIXI.Graphics();
        this.scoreContainer = new PIXI.Container();

        this.effectContainer.addChild(this.bubbleGfx);
        this.effectContainer.addChild(this.coinTrailGfx);
        this.effectContainer.addChild(this.coinSpriteContainer);
        this.effectContainer.addChild(this.coinRainGfx);
        this.effectContainer.addChild(this.hitSparksGfx);
        this.effectContainer.addChild(this.explosionGfx);
        this.effectContainer.addChild(this.lightningGfx);
        this.effectContainer.addChild(this.freezeGfx);
        this.effectContainer.addChild(this.scoreContainer);

        if (window.pixiLayers && window.pixiLayers.effect) {
            window.pixiLayers.effect.addChild(this.effectContainer);
        }
    }

    initSeaweeds() {
        const count = 12;
        this.seaweeds = [];
        for (let i = 0; i < count; i++) {
            this.seaweeds.push({
                x: 60 + i * 110 + (Math.random() - 0.5) * 40,
                height: 120 + Math.random() * 90,
                width: 14 + Math.random() * 10,
                speed: 1.2 + Math.random() * 0.8,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // 强化屏幕震动 (直接作用于 PixiJS Stage 坐标，0 毫秒 GPU 位移)
    shake(intensity = 15, duration = 25) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeTimer = Math.max(this.shakeTimer, duration);
        this.maxShakeTimer = Math.max(this.maxShakeTimer, this.shakeTimer);
    }

    addBubble(x, y, size = null) {
        if (this.bubbles.length >= 35) return;
        this.bubbles.push({
            x: x !== undefined ? x : Math.random() * window.innerWidth,
            y: y !== undefined ? y : window.innerHeight + 20,
            radius: size || (3 + Math.random() * 7),
            speed: 1 + Math.random() * 2,
            wobbleSpeed: 2 + Math.random() * 3,
            wobbleDist: 10 + Math.random() * 15,
            wobbleOffset: Math.random() * Math.PI * 2,
            opacity: 0.2 + Math.random() * 0.4
        });
    }

    addCoin(startX, startY, targetX, targetY, value = 10, count = 5) {
        if (this.coins.length >= 100) return;
        const coinCount = Math.min(Math.max(4, Math.floor(value / 6)), 16);
        for (let i = 0; i < coinCount; i++) {
            const spreadAngle = Math.random() * Math.PI * 2;
            const spreadDist = 25 + Math.random() * 75;
            const burstX = startX + Math.cos(spreadAngle) * spreadDist;
            const burstY = startY + Math.sin(spreadAngle) * spreadDist;

            this.coins.push({
                x: startX,
                y: startY,
                startX: startX,
                startY: startY,
                burstX: burstX,
                burstY: burstY,
                targetX: targetX,
                targetY: targetY,
                progress: 0,
                speed: 0.024 + Math.random() * 0.016,
                delay: i * 2.5,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: 0.18 + Math.random() * 0.12,
                size: 16 + (value >= 100 ? 8 : (value >= 50 ? 4 : 0)),
                isBig: value >= 60,
                soundIndex: i,
                trail: []
            });
        }
    }

    addCoinRain(count = 70) {
        if (window.soundManager) window.soundManager.playCoinRain();
        const sw = window.innerWidth || 1280;
        for (let i = 0; i < count; i++) {
            this.coinRain.push({
                x: Math.random() * sw,
                y: -30 - Math.random() * 250,
                vx: (Math.random() - 0.5) * 4,
                vy: 5 + Math.random() * 8,
                radius: 11 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.25,
                alpha: 1,
                life: 130
            });
        }
    }

    addHitSparks(x, y, colorNum = 0xffd700) {
        if (this.hitSparks.length > 80) return;
        const count = 5;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 6;
            this.hitSparks.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                colorNum,
                size: 2.5 + Math.random() * 3,
                alpha: 1,
                decay: 0.08 + Math.random() * 0.04
            });
        }
    }

    addNet(x, y, radius, color = '#00ffff') {
        const colorNum = parseInt(color.replace('#', '0x'), 16) || 0x00ffff;
        this.nets.push({
            x: x,
            y: y,
            maxRadius: radius,
            radius: 8,
            opacity: 1,
            color: color,
            colorNum: colorNum,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: 0.03,
            duration: 28,
            life: 28,
            ripples: [
                { r: 4, speed: radius * 0.058, max: radius * 1.35, alpha: 0.8 },
                { r: 2, speed: radius * 0.045, max: radius * 1.15, alpha: 0.95 },
                { r: 1, speed: radius * 0.032, max: radius * 0.9, alpha: 1 }
            ],
            sparks: Array.from({ length: 14 }, () => {
                const angle = Math.random() * Math.PI * 2;
                const spd = (radius * 0.04) * (0.6 + Math.random() * 0.8);
                return {
                    x: 0,
                    y: 0,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    size: 2.5 + Math.random() * 3.5,
                    alpha: 1
                };
            })
        });
    }

    addScore(x, y, score, isBoss = false) {
        this.scores.push({
            x: x,
            y: y,
            score: score,
            opacity: 1,
            scale: isBoss ? 1.8 : 1.1,
            velocityY: -2.2,
            life: 48,
            isBoss: isBoss
        });
    }

    addExplosion(x, y, radius = 90, color = '#ff3d00') {
        if (this.explosions.length >= 8) return;
        const colorNum = parseInt(color.replace('#', '0x'), 16) || 0xff3d00;
        const particleCount = 20;
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 6,
                colorNum: i % 2 === 0 ? colorNum : 0xffea00,
                alpha: 1,
                decay: 0.03 + Math.random() * 0.03
            });
        }
        this.explosions.push({
            x: x,
            y: y,
            radius: 10,
            maxRadius: radius,
            colorNum: colorNum,
            opacity: 1,
            particles: particles
        });
    }

    addLightningChain(points) {
        if (!points || points.length < 2) return;
        this.lightnings.push({
            points: points,
            alpha: 1,
            duration: 16
        });
    }

    update() {
        // 1. 震屏动力学更新 (直接控制 Pixi Stage 偏移)
        if (this.shakeTimer > 0) {
            const progress = this.shakeTimer / this.maxShakeTimer;
            const currentIntensity = this.shakeIntensity * progress;
            const shakeX = (Math.random() - 0.5) * currentIntensity * 1.5;
            const shakeY = (Math.random() - 0.5) * currentIntensity * 1.5;
            if (window.pixiApp && window.pixiApp.stage) {
                window.pixiApp.stage.x = shakeX;
                window.pixiApp.stage.y = shakeY;
            }
            this.shakeTimer--;
            if (this.shakeTimer <= 0) {
                if (window.pixiApp && window.pixiApp.stage) {
                    window.pixiApp.stage.x = 0;
                    window.pixiApp.stage.y = 0;
                }
                this.shakeIntensity = 0;
            }
        }

        // 2. 气泡
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y -= b.speed;
            b.x += Math.sin(b.y * 0.025 + b.wobbleOffset) * 0.6;
            if (b.y < -30) {
                this.bubbles.splice(i, 1);
            }
        }

        // 3. 渔网与冲击波
        for (let i = this.nets.length - 1; i >= 0; i--) {
            const n = this.nets[i];
            n.life--;
            n.rotation += n.rotSpeed;
            n.radius += (n.maxRadius - n.radius) * 0.18;
            n.opacity = Math.max(0, n.life / n.duration);

            for (const rip of n.ripples) {
                rip.r += rip.speed;
                rip.alpha = Math.max(0, 1 - rip.r / rip.max);
            }

            for (const sp of n.sparks) {
                sp.x += sp.vx;
                sp.y += sp.vy;
                sp.alpha = Math.max(0, sp.alpha - 0.04);
            }

            if (n.life <= 0) {
                this.nets.splice(i, 1);
            }
        }

        // 4. 金币
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            if (c.delay > 0) {
                c.delay--;
                continue;
            }
            c.progress += c.speed;
            c.rotation += c.rotSpeed;

            if (c.progress < 0.25) {
                const burstT = c.progress / 0.25;
                c.x = c.startX + (c.burstX - c.startX) * Math.sin(burstT * Math.PI * 0.5);
                c.y = c.startY + (c.burstY - c.startY) * Math.sin(burstT * Math.PI * 0.5);
            } else {
                const flyT = (c.progress - 0.25) / 0.75;
                const easeT = flyT * flyT * (3 - 2 * flyT);
                c.x = c.burstX + (c.targetX - c.burstX) * easeT;
                c.y = c.burstY + (c.targetY - c.burstY) * easeT;
            }

            if (c.progress >= 1) {
                if (window.soundManager) {
                    window.soundManager.playCoin(c.soundIndex || 0);
                }
                if (window.uiManager) {
                    window.uiManager.triggerCoinBounce();
                }
                this.coins.splice(i, 1);
            }
        }

        // 5. 爆炸
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const ex = this.explosions[i];
            ex.radius += (ex.maxRadius - ex.radius) * 0.2;
            ex.opacity -= 0.045;
            for (let j = ex.particles.length - 1; j >= 0; j--) {
                const p = ex.particles[j];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;
                if (p.alpha <= 0) ex.particles.splice(j, 1);
            }
            if (ex.opacity <= 0 && ex.particles.length === 0) {
                this.explosions.splice(i, 1);
            }
        }

        // 6. 闪电
        for (let i = this.lightnings.length - 1; i >= 0; i--) {
            const lt = this.lightnings[i];
            lt.alpha -= 1 / lt.duration;
            if (lt.alpha <= 0) {
                this.lightnings.splice(i, 1);
            }
        }

        // 7. 冰冻渐变
        if (window.gameEngine && window.gameEngine.isFrozen) {
            this.freezeAlpha = Math.min(0.35, this.freezeAlpha + 0.03);
        } else {
            this.freezeAlpha = Math.max(0, this.freezeAlpha - 0.03);
        }

        // 8. 金币暴雨物理步进
        const sh = window.innerHeight || 720;
        for (let i = this.coinRain.length - 1; i >= 0; i--) {
            const cr = this.coinRain[i];
            cr.y += cr.vy;
            cr.x += cr.vx;
            cr.rotation += cr.rotSpeed;
            cr.life--;
            if (cr.y > sh + 50 || cr.life <= 0) {
                this.coinRain.splice(i, 1);
            }
        }

        // 9. 受击火花粒子步进
        for (let i = this.hitSparks.length - 1; i >= 0; i--) {
            const hs = this.hitSparks[i];
            hs.x += hs.vx;
            hs.y += hs.vy;
            hs.alpha -= hs.decay;
            if (hs.alpha <= 0) {
                this.hitSparks.splice(i, 1);
            }
        }
    }

    // PixiJS WebGL 硬件同步渲染管线
    syncPixi(width, height, fishCount = 0) {
        if (!this.bgGfx) return;

        // 1. 深海丁达尔神光 (God Rays) 与水下乱流 (背景)
        this.bgGfx.clear();
        const t = performance.now() * 0.0007;
        const numRays = 7;
        for (let r = 0; r < numRays; r++) {
            const rayPhase = r * 0.95 + t;
            const sway = Math.sin(rayPhase) * 55;
            const alpha = 0.035 + Math.sin(t * 1.8 + r * 1.3) * 0.02;
            const topX = (width * (r + 0.5)) / numRays + sway * 0.4;
            const topW = 30 + Math.sin(t + r) * 12;
            const botX = topX + sway * 2.4;
            const botW = topW * 4.2;

            this.bgGfx.beginFill(0x80deea, alpha);
            this.bgGfx.drawPolygon([
                topX - topW * 0.5, 0,
                topX + topW * 0.5, 0,
                botX + botW * 0.5, height,
                botX - botW * 0.5, height
            ]);
            this.bgGfx.endFill();
        }

        if (fishCount > 50) {
            this.bgGfx.beginFill(0x0088cc, 0.06);
            this.bgGfx.drawRect(0, 0, width, height);
            this.bgGfx.endFill();
        }

        // 2. 摇曳海草
        if (this.seaweedGfx) {
            this.seaweedGfx.clear();
            const now = performance.now() * 0.001;
            for (const s of this.seaweeds) {
                const sway1 = Math.sin(now * s.speed + s.phase) * 25;
                const sway2 = Math.sin(now * s.speed * 1.3 + s.phase) * 40;
                const topY = height - s.height;
                const midY = height - s.height * 0.5;

                this.seaweedGfx.lineStyle(s.width, 0x2e7d32, 0.45);
                this.seaweedGfx.moveTo(s.x, height);
                this.seaweedGfx.bezierCurveTo(s.x, midY, s.x + sway1, midY, s.x + sway2, topY);
            }
        }

        // 3. 渔网与冲击波
        if (this.netGfx) {
            this.netGfx.clear();
            for (const n of this.nets) {
                // 冲击波
                for (const rip of n.ripples) {
                    if (rip.alpha <= 0.01) continue;
                    this.netGfx.lineStyle(3.5 * rip.alpha, n.colorNum, rip.alpha * 0.7);
                    this.netGfx.drawCircle(n.x, n.y, rip.r);
                }

                // 外部主网圈
                this.netGfx.lineStyle(3, n.colorNum, n.opacity);
                this.netGfx.drawCircle(n.x, n.y, n.radius);
                this.netGfx.lineStyle(1.8, n.colorNum, n.opacity * 0.75);
                this.netGfx.drawCircle(n.x, n.y, n.radius * 0.68);
                this.netGfx.drawCircle(n.x, n.y, n.radius * 0.36);

                // 经纬辐射线
                const spokes = 12;
                for (let k = 0; k < spokes; k++) {
                    const ang = n.rotation + (k * Math.PI * 2) / spokes;
                    this.netGfx.moveTo(n.x, n.y);
                    this.netGfx.lineTo(n.x + Math.cos(ang) * n.radius, n.y + Math.sin(ang) * n.radius);
                }

                // 飞溅火花
                for (const sp of n.sparks) {
                    if (sp.alpha <= 0.02) continue;
                    this.netGfx.beginFill(0xffffff, sp.alpha);
                    this.netGfx.drawCircle(n.x + sp.x, n.y + sp.y, sp.size);
                    this.netGfx.endFill();
                }
            }
        }

        // 4. 上升气泡
        if (this.bubbleGfx) {
            this.bubbleGfx.clear();
            for (const b of this.bubbles) {
                this.bubbleGfx.lineStyle(1.5, 0xb4f0ff, b.opacity);
                this.bubbleGfx.beginFill(0xdcfaff, b.opacity * 0.35);
                this.bubbleGfx.drawCircle(b.x, b.y, b.radius);
                this.bubbleGfx.endFill();
            }
        }

        // 5. 爆炸粒子
        if (this.explosionGfx) {
            this.explosionGfx.clear();
            for (const ex of this.explosions) {
                this.explosionGfx.beginFill(ex.colorNum, ex.opacity * 0.45);
                this.explosionGfx.drawCircle(ex.x, ex.y, ex.radius);
                this.explosionGfx.endFill();

                for (const p of ex.particles) {
                    this.explosionGfx.beginFill(p.colorNum, p.alpha);
                    this.explosionGfx.drawCircle(p.x, p.y, p.size);
                    this.explosionGfx.endFill();
                }
            }
        }

        // 6. 闪电链
        if (this.lightningGfx) {
            this.lightningGfx.clear();
            for (const lt of this.lightnings) {
                this.lightningGfx.lineStyle(3.5, 0x00ffff, lt.alpha);
                for (let i = 0; i < lt.points.length - 1; i++) {
                    const p1 = lt.points[i];
                    const p2 = lt.points[i + 1];
                    this.lightningGfx.moveTo(p1.x, p1.y);
                    this.lightningGfx.lineTo(p2.x, p2.y);
                }
            }
        }

        // 7. 全屏冰封滤镜
        if (this.freezeGfx) {
            this.freezeGfx.clear();
            if (this.freezeAlpha > 0) {
                this.freezeGfx.beginFill(0x00b0ff, this.freezeAlpha);
                this.freezeGfx.drawRect(0, 0, width, height);
                this.freezeGfx.endFill();
            }
        }

        // 8. 全屏金币暴雨渲染
        if (this.coinRainGfx) {
            this.coinRainGfx.clear();
            for (const cr of this.coinRain) {
                this.coinRainGfx.beginFill(0xffd700, cr.alpha * 0.95);
                this.coinRainGfx.drawCircle(cr.x, cr.y, cr.radius);
                this.coinRainGfx.endFill();

                this.coinRainGfx.lineStyle(2, 0xffea00, cr.alpha);
                this.coinRainGfx.drawCircle(cr.x, cr.y, cr.radius * 0.65);
            }
        }

        // 9. 受击火花喷溅渲染
        if (this.hitSparksGfx) {
            this.hitSparksGfx.clear();
            for (const hs of this.hitSparks) {
                this.hitSparksGfx.beginFill(hs.colorNum, hs.alpha);
                this.hitSparksGfx.drawCircle(hs.x, hs.y, hs.size);
                this.hitSparksGfx.endFill();
            }
        }

        // 10. 3D 旋转金币 Pixi 精灵同步
        this.syncPixiCoins();
    }

    syncPixiCoins() {
        if (!this.coinSpriteContainer) return;

        // 确保精灵池数量匹配
        while (this.coinSpritePool.length < this.coins.length) {
            const spr = new PIXI.Sprite();
            spr.anchor.set(0.5, 0.5);
            this.coinSpriteContainer.addChild(spr);
            this.coinSpritePool.push(spr);
        }

        for (let i = 0; i < this.coinSpritePool.length; i++) {
            const spr = this.coinSpritePool[i];
            if (i < this.coins.length) {
                const c = this.coins[i];
                if (c.delay > 0) {
                    spr.visible = false;
                    continue;
                }
                spr.visible = true;
                spr.x = c.x;
                spr.y = c.y;

                const textures = (window.pixiTextures && window.pixiTextures.coins) ? (c.isBig ? window.pixiTextures.coins.gold : window.pixiTextures.coins.silver) : null;
                if (textures && textures.length > 0) {
                    const frameIdx = Math.abs(Math.floor(c.rotation * 3.5)) % textures.length;
                    spr.texture = textures[frameIdx];
                    const cSize = c.size * 1.6;
                    spr.width = cSize;
                    spr.height = cSize;
                }
            } else {
                spr.visible = false;
            }
        }
    }

    // 2D 兼容占位
    renderBackground() {}
    renderForeground() {}
}

window.ParticleSystem = ParticleSystem;
window.particleSystem = new ParticleSystem();
