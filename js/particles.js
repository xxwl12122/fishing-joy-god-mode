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

        // 全屏光效与警报控制
        this.redAlertTimer = 0;
        this.goldFlashAlpha = 0;

        // 3D 金币对象池与高性能粒子缓存
        this.coinPool = [];
        this.coinSpritePool = [];
        this.coinRainSpritePool = [];
        this.coinAbsorbSparks = [];

        this.initSeaweeds();
        this.initPixiDisplay();
    }

    initPixiDisplay() {
        if (typeof PIXI === 'undefined') return;

        // 背景图层 (承载水下乱流与丁达尔神光，叠加在 bgSprite 之上)
        this.bgGfx = new PIXI.Graphics();
        this.bgGfx.zIndex = 10;
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

        // 综合特效图层 (各层深度与视觉通道精细排序)
        this.effectContainer = new PIXI.Container();
        this.bubbleGfx = new PIXI.Graphics();
        this.coinTrailGfx = new PIXI.Graphics();
        this.coinSpriteContainer = new PIXI.Container();
        this.coinRainContainer = new PIXI.Container();
        this.coinAbsorbGfx = new PIXI.Graphics();
        this.hitSparksGfx = new PIXI.Graphics();
        this.explosionGfx = new PIXI.Graphics();
        this.lightningGfx = new PIXI.Graphics();
        this.freezeGfx = new PIXI.Graphics();
        this.scoreContainer = new PIXI.Container();
        this.screenOverlayGfx = new PIXI.Graphics();

        this.effectContainer.addChild(this.bubbleGfx);
        this.effectContainer.addChild(this.coinTrailGfx);
        this.effectContainer.addChild(this.coinSpriteContainer);
        this.effectContainer.addChild(this.coinRainContainer);
        this.effectContainer.addChild(this.coinAbsorbGfx);
        this.effectContainer.addChild(this.hitSparksGfx);
        this.effectContainer.addChild(this.explosionGfx);
        this.effectContainer.addChild(this.lightningGfx);
        this.effectContainer.addChild(this.freezeGfx);
        this.effectContainer.addChild(this.scoreContainer);
        this.effectContainer.addChild(this.screenOverlayGfx);

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

    triggerRedAlert(duration = 75) {
        this.redAlertTimer = duration;
        this.shake(22, 45);
    }

    triggerGoldFlash(alpha = 0.8) {
        this.goldFlashAlpha = Math.max(this.goldFlashAlpha, alpha);
    }

    addCoin(startX, startY, targetX, targetY, value = 10, count = null) {
        if (this.coins.length >= 350) return;
        // 如果传入了固定数量则优先使用，否则按分数比例计算 (大鱼更多，但总量控制在极致流畅区间)
        const coinCount = count !== null ? count : Math.min(Math.max(5, Math.floor(value / 5)), 26);
        for (let i = 0; i < coinCount; i++) {
            const spreadAngle = Math.random() * Math.PI * 2;
            const spreadDist = 28 + Math.random() * 88;
            const burstX = startX + Math.cos(spreadAngle) * spreadDist;
            const burstY = startY + Math.sin(spreadAngle) * spreadDist;

            // 弧形二次贝塞尔曲线控制点：从爆破点到目标点添加向外/向上的抛物弧度
            const midX = (burstX + targetX) * 0.5;
            const midY = (burstY + targetY) * 0.5;
            const dx = targetX - burstX;
            const dy = targetY - burstY;
            const dist = Math.hypot(dx, dy) || 1;
            const normX = -dy / dist;
            const normY = dx / dist;
            const curveOffset = (Math.random() - 0.25) * 110;
            const ctrlX = midX + normX * curveOffset;
            const ctrlY = Math.min(midY - 55, midY + normY * curveOffset);

            const isBig = value >= 40;
            const baseScale = value >= 100 ? 0.72 : (value >= 40 ? 0.62 : 0.52);

            let c = this.coinPool.pop();
            if (!c) {
                c = {
                    x: startX, y: startY,
                    startX, startY,
                    burstX, burstY,
                    ctrlX, ctrlY,
                    targetX, targetY,
                    progress: 0,
                    speed: 0.024 + Math.random() * 0.014,
                    delay: i * 1.4,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: 0.24 + Math.random() * 0.16,
                    baseScale,
                    currentScale: baseScale,
                    isBig,
                    soundIndex: i % 12,
                    trail: []
                };
            } else {
                c.x = startX;
                c.y = startY;
                c.startX = startX;
                c.startY = startY;
                c.burstX = burstX;
                c.burstY = burstY;
                c.ctrlX = ctrlX;
                c.ctrlY = ctrlY;
                c.targetX = targetX;
                c.targetY = targetY;
                c.progress = 0;
                c.speed = 0.024 + Math.random() * 0.014;
                c.delay = i * 1.4;
                c.rotation = Math.random() * Math.PI * 2;
                c.rotSpeed = 0.24 + Math.random() * 0.16;
                c.baseScale = baseScale;
                c.currentScale = baseScale;
                c.isBig = isBig;
                c.soundIndex = i % 12;
                c.trail.length = 0;
            }

            this.coins.push(c);
        }
    }

    // 史诗级 BOSS 击杀全屏爆金币狂欢 (从中心向四周喷涌 + 全屏暴雨 + 磁吸飞向计分板)
    triggerBossMegaWinEruption(startX, startY, targetX, targetY) {
        this.triggerGoldFlash(0.85);
        this.shake(45, 60);
        this.addExplosion(startX, startY, 520, '#ffd700');
        this.addCoinRain(65);

        const sw = window.innerWidth || 1280;
        const sh = window.innerHeight || 720;
        const count = 75; // 精确平衡震撼视觉与 60 满帧性能

        for (let i = 0; i < count; i++) {
            const spreadAngle = Math.random() * Math.PI * 2;
            const spreadDist = 120 + Math.random() * (Math.min(sw, sh) * 0.42);
            const burstX = Math.max(60, Math.min(sw - 60, startX + Math.cos(spreadAngle) * spreadDist));
            const burstY = Math.max(60, Math.min(sh - 60, startY + Math.sin(spreadAngle) * spreadDist));

            const midX = (burstX + targetX) * 0.5;
            const midY = (burstY + targetY) * 0.5;
            const dx = targetX - burstX;
            const dy = targetY - burstY;
            const dist = Math.hypot(dx, dy) || 1;
            const normX = -dy / dist;
            const normY = dx / dist;
            const curveOffset = (Math.random() - 0.2) * 140;
            const ctrlX = midX + normX * curveOffset;
            const ctrlY = Math.min(midY - 70, midY + normY * curveOffset);

            let c = this.coinPool.pop();
            if (!c) {
                c = {
                    x: startX, y: startY,
                    startX, startY,
                    burstX, burstY,
                    ctrlX, ctrlY,
                    targetX, targetY,
                    progress: 0,
                    speed: 0.018 + Math.random() * 0.014,
                    delay: Math.floor(i * 1.1),
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: 0.25 + Math.random() * 0.18,
                    baseScale: 0.68,
                    currentScale: 0.68,
                    isBig: true,
                    soundIndex: i % 12,
                    trail: []
                };
            } else {
                c.x = startX;
                c.y = startY;
                c.startX = startX;
                c.startY = startY;
                c.burstX = burstX;
                c.burstY = burstY;
                c.ctrlX = ctrlX;
                c.ctrlY = ctrlY;
                c.targetX = targetX;
                c.targetY = targetY;
                c.progress = 0;
                c.speed = 0.018 + Math.random() * 0.014;
                c.delay = Math.floor(i * 1.1);
                c.rotation = Math.random() * Math.PI * 2;
                c.rotSpeed = 0.25 + Math.random() * 0.18;
                c.baseScale = 0.68;
                c.currentScale = 0.68;
                c.isBig = true;
                c.soundIndex = i % 12;
                c.trail.length = 0;
            }

            this.coins.push(c);
        }
    }

    // 全屏 3D 旋转金币雨
    addCoinRain(count = 50) {
        if (window.soundManager) window.soundManager.playCoinRain();
        const sw = window.innerWidth || 1280;
        const actualCount = Math.min(count, 55);
        for (let i = 0; i < actualCount; i++) {
            this.coinRain.push({
                x: Math.random() * sw,
                y: -30 - Math.random() * 260,
                vx: (Math.random() - 0.5) * 3,
                vy: 6.5 + Math.random() * 8.5,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: 0.22 + (Math.random() - 0.5) * 0.16,
                scale: 0.45 + Math.random() * 0.25,
                alpha: 1,
                life: 120
            });
        }
    }

    // 金币飞入 UI 计分板时产生的吸入吸收金色冲击星芒
    addCoinAbsorbSparks(x, y) {
        if (this.coinAbsorbSparks.length > 50) return;
        const count = 3;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3.5;
            this.coinAbsorbSparks.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2.5 + Math.random() * 2.5,
                alpha: 1,
                decay: 0.12 + Math.random() * 0.06
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

        // 4. 金币 (抛物线二次贝塞尔曲线 + 3D 旋转 + 距离透视缩放 + O(1) 池化回收)
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            if (c.delay > 0) {
                c.delay--;
                continue;
            }
            c.progress += c.speed;
            c.rotation += c.rotSpeed;

            if (c.progress < 0.25) {
                // 阶段 1：向外爆发散开 (带有真实物理爆发反冲缓动)
                const burstT = c.progress / 0.25;
                const easeOut = Math.sin(burstT * Math.PI * 0.5);
                c.x = c.startX + (c.burstX - c.startX) * easeOut;
                c.y = c.startY + (c.burstY - c.startY) * easeOut;
                c.currentScale = c.baseScale * (1 + easeOut * 0.35); // 爆开时金币迎面飞来变大
            } else {
                // 阶段 2：二次贝塞尔曲线抛物线弧形磁吸飞向左上角计分板
                const t = (c.progress - 0.25) / 0.75;
                const easeT = t * t * (3 - 2 * t); // Smoothstep 磁吸加速
                const invT = 1 - easeT;

                c.x = invT * invT * c.burstX + 2 * invT * easeT * c.ctrlX + easeT * easeT * c.targetX;
                c.y = invT * invT * c.burstY + 2 * invT * easeT * c.ctrlY + easeT * easeT * c.targetY;
                c.currentScale = c.baseScale * (1.35 - easeT * 0.55); // 飞向远端UI平滑距离缩放

                // 记录拖尾历史坐标 (取最近 4 个位置，形成华丽流星尾迹)
                if (c.trail.length >= 4) c.trail.shift();
                c.trail.push({ x: c.x, y: c.y });
            }

            if (c.progress >= 1) {
                if (window.soundManager) {
                    window.soundManager.playCoin(c.soundIndex || 0);
                }
                if (window.uiManager) {
                    window.uiManager.triggerCoinBounce();
                }

                // 终点金币吸入金色爆破火花
                this.addCoinAbsorbSparks(c.targetX, c.targetY);

                // O(1) 快速对象池回收，彻底根除 splice 导致的大数组内存重排与 GC 卡顿
                this.coinPool.push(c);
                const last = this.coins.pop();
                if (i < this.coins.length) {
                    this.coins[i] = last;
                }
            }
        }

        // 金币入池吸收星芒步进
        for (let i = this.coinAbsorbSparks.length - 1; i >= 0; i--) {
            const sp = this.coinAbsorbSparks[i];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.alpha -= sp.decay;
            if (sp.alpha <= 0) {
                const last = this.coinAbsorbSparks.pop();
                if (i < this.coinAbsorbSparks.length) {
                    this.coinAbsorbSparks[i] = last;
                }
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
                const last = this.coinRain.pop();
                if (i < this.coinRain.length) {
                    this.coinRain[i] = last;
                }
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

        // 10. 全屏光效步进
        if (this.redAlertTimer > 0) this.redAlertTimer--;
        if (this.goldFlashAlpha > 0) this.goldFlashAlpha = Math.max(0, this.goldFlashAlpha - 0.025);
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

        // 8. 绚丽金色星芒流光拖尾渲染 (Golden Particle Sparkle Trail)
        this.renderCoinTrails();

        // 9. 3D 旋转金币 Pixi 精灵同步 (带透视缩放与动态高光)
        this.syncPixiCoins();

        // 10. 金币飞入 UI 计分板入池吸入金色星芒爆破渲染
        this.renderCoinAbsorbSparks();

        // 11. 全屏 3D 旋转金币暴雨渲染 (真 3D 贴图翻滚下落，彻底告别单色小黄圆)
        this.syncPixiCoinRain();

        // 12. 受击火花喷溅渲染
        if (this.hitSparksGfx) {
            this.hitSparksGfx.clear();
            for (const hs of this.hitSparks) {
                this.hitSparksGfx.beginFill(hs.colorNum, hs.alpha);
                this.hitSparksGfx.drawCircle(hs.x, hs.y, hs.size);
                this.hitSparksGfx.endFill();
            }
        }

        // 13. 全屏红色预警脉冲与全屏金光闪烁渲染
        if (this.screenOverlayGfx) {
            this.screenOverlayGfx.clear();
            if (this.redAlertTimer > 0) {
                const pulse = (Math.sin(this.redAlertTimer * 0.28) + 1) * 0.5;
                const alertAlpha = 0.22 * pulse;
                // 全屏暗红警报闪光
                this.screenOverlayGfx.beginFill(0xb71c1c, alertAlpha);
                this.screenOverlayGfx.drawRect(0, 0, width, height);
                this.screenOverlayGfx.endFill();

                // 屏幕四周醒目红色警报框与暗角
                this.screenOverlayGfx.lineStyle(10, 0xff1744, 0.45 + 0.5 * pulse);
                this.screenOverlayGfx.drawRect(5, 5, width - 10, height - 10);
            }

            if (this.goldFlashAlpha > 0.01) {
                this.screenOverlayGfx.beginFill(0xffd700, this.goldFlashAlpha * 0.65);
                this.screenOverlayGfx.drawRect(0, 0, width, height);
                this.screenOverlayGfx.endFill();

                this.screenOverlayGfx.beginFill(0xffffff, this.goldFlashAlpha * 0.35);
                this.screenOverlayGfx.drawRect(0, 0, width, height);
                this.screenOverlayGfx.endFill();
            }
        }
    }

    // 绚丽金色流星拖尾 (彗星流线渐变衰减 + 核心炽白流光 + 尾尖星芒)
    renderCoinTrails() {
        if (!this.coinTrailGfx) return;
        this.coinTrailGfx.clear();

        for (let i = 0; i < this.coins.length; i++) {
            const c = this.coins[i];
            if (c.delay > 0 || c.progress < 0.22 || !c.trail || c.trail.length < 2) continue;

            const isGold = c.isBig;
            const glowColor = isGold ? 0xffd700 : 0x00e5ff;
            const segCount = c.trail.length;

            // 1. 金色渐变彗尾：从尾尖向币身逐渐加粗、透明度递增
            for (let j = 0; j < segCount - 1; j++) {
                const p1 = c.trail[j];
                const p2 = c.trail[j + 1];
                const ratio = (j + 1) / segCount; // 0.25 -> 1.0
                this.coinTrailGfx.lineStyle(1.0 + ratio * 3.0, glowColor, ratio * 0.45);
                this.coinTrailGfx.moveTo(p1.x, p1.y);
                this.coinTrailGfx.lineTo(p2.x, p2.y);
            }

            // 2. 衔接币身的核心炽白流光
            const lastPt = c.trail[segCount - 1];
            this.coinTrailGfx.lineStyle(2.2, 0xffffff, 0.8);
            this.coinTrailGfx.moveTo(lastPt.x, lastPt.y);
            this.coinTrailGfx.lineTo(c.x, c.y);

            // 3. 尾尖闪烁金色微粒星芒
            const tailPt = c.trail[0];
            this.coinTrailGfx.lineStyle(0);
            this.coinTrailGfx.beginFill(glowColor, 0.5);
            this.coinTrailGfx.drawCircle(tailPt.x, tailPt.y, 1.8);
            this.coinTrailGfx.endFill();
        }
    }

    // 金币吸入左上角计分板的金色爆破星芒
    renderCoinAbsorbSparks() {
        if (!this.coinAbsorbGfx) return;
        this.coinAbsorbGfx.clear();
        for (const sp of this.coinAbsorbSparks) {
            this.coinAbsorbGfx.beginFill(0xffd700, sp.alpha * 0.7);
            this.coinAbsorbGfx.drawCircle(sp.x, sp.y, sp.size * 1.5);
            this.coinAbsorbGfx.endFill();

            this.coinAbsorbGfx.beginFill(0xffffff, sp.alpha);
            this.coinAbsorbGfx.drawCircle(sp.x, sp.y, sp.size * 0.7);
            this.coinAbsorbGfx.endFill();
        }
    }

    // 3D 旋转金币 Pixi 精灵同步 (带透视缩放与动态高光)
    syncPixiCoins() {
        if (!this.coinSpriteContainer) return;

        // 精灵池根据活跃金币数量动态扩容并池化复用
        while (this.coinSpritePool.length < this.coins.length) {
            const spr = new PIXI.Sprite();
            spr.anchor.set(0.5, 0.5);
            this.coinSpriteContainer.addChild(spr);
            this.coinSpritePool.push(spr);
        }

        const bTex = window.pixiTextures && window.pixiTextures.coins;
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

                const textures = bTex ? (c.isBig ? bTex.gold : bTex.silver) : null;
                if (textures && textures.length > 0) {
                    const frameIdx = Math.abs(Math.floor(c.rotation * 3.6)) % textures.length;
                    spr.texture = textures[frameIdx];
                }

                // 直接设置 scale 替代设置 width/height，消除内部矩阵分解重算卡顿
                const s = c.currentScale || c.baseScale || 0.55;
                spr.scale.set(s, s);
            } else {
                spr.visible = false;
            }
        }
    }

    // 全屏 3D 金币暴雨 Pixi 精灵同步 (真·3D金币翻滚雨)
    syncPixiCoinRain() {
        if (!this.coinRainContainer) return;

        while (this.coinRainSpritePool.length < this.coinRain.length) {
            const spr = new PIXI.Sprite();
            spr.anchor.set(0.5, 0.5);
            this.coinRainContainer.addChild(spr);
            this.coinRainSpritePool.push(spr);
        }

        const bTex = window.pixiTextures && window.pixiTextures.coins;
        const goldTextures = bTex ? bTex.gold : null;

        for (let i = 0; i < this.coinRainSpritePool.length; i++) {
            const spr = this.coinRainSpritePool[i];
            if (i < this.coinRain.length) {
                const cr = this.coinRain[i];
                spr.visible = true;
                spr.x = cr.x;
                spr.y = cr.y;

                if (goldTextures && goldTextures.length > 0) {
                    const frameIdx = Math.abs(Math.floor(cr.rotation * 3.2)) % goldTextures.length;
                    spr.texture = goldTextures[frameIdx];
                }
                spr.scale.set(cr.scale, cr.scale);
                spr.alpha = Math.min(1, cr.life / 30);
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
