/**
 * 捕鱼达人 - 顶级街机视觉粒子系统、震屏、金币轨迹与多重冲击波渔网
 */

class ParticleSystem {
    constructor() {
        this.bubbles = [];
        this.coins = [];
        this.scores = [];
        this.nets = [];
        this.explosions = [];
        this.lightnings = [];
        this.seaweeds = [];
        this.sparkles = [];

        this.shakeTimer = 0;
        this.maxShakeTimer = 1;
        this.shakeIntensity = 0;
        this.freezeAlpha = 0;
        this.causticOffset = 0;

        this.initSeaweeds();
    }

    initSeaweeds() {
        const count = 12;
        this.seaweeds = [];
        for (let i = 0; i < count; i++) {
            this.seaweeds.push({
                x: 60 + i * 110 + (Math.random() - 0.5) * 40,
                height: 120 + Math.random() * 90,
                width: 14 + Math.random() * 10,
                color: i % 2 === 0 ? 'rgba(34, 139, 34, 0.45)' : 'rgba(46, 139, 87, 0.4)',
                speed: 1.2 + Math.random() * 0.8,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // 强化屏幕震动 (根据鱼种分值动态缩放)
    shake(intensity = 15, duration = 25) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeTimer = Math.max(this.shakeTimer, duration);
        this.maxShakeTimer = Math.max(this.maxShakeTimer, this.shakeTimer);
    }

    // 添加气泡 (限制最大同屏数量，保护性能)
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

    // 强化金币飞行动画 (限制并发最大粒子，防止连锁爆炸卡顿)
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
                trail: [] // 金币拖尾光粒
            });
        }
    }

    // 添加华丽多层光环扩散渔网与水波纹
    addNet(x, y, radius, color = '#00ffff') {
        this.nets.push({
            x: x,
            y: y,
            maxRadius: radius,
            radius: 8,
            opacity: 1,
            color: color,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: 0.03,
            duration: 28,
            life: 28,
            // 多层冲击波光环
            ripples: [
                { r: 4, speed: radius * 0.058, max: radius * 1.35, alpha: 0.8 },
                { r: 2, speed: radius * 0.045, max: radius * 1.15, alpha: 0.95 },
                { r: 1, speed: radius * 0.032, max: radius * 0.9, alpha: 1 }
            ],
            // 能量飞溅粒子
            sparks: Array.from({ length: 16 }, () => {
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

    // 添加漂浮数值
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

    // 爆炸特效 (限制并发上限与碎片粒子，防止连锁爆炸崩溃显卡)
    addExplosion(x, y, radius = 240) {
        if (this.explosions.length >= 8) {
            this.explosions.shift();
        }
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: radius,
            opacity: 1,
            particles: Array.from({ length: 22 }, () => ({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.5) * 16,
                size: 3 + Math.random() * 7,
                color: ['#ff4400', '#ffcc00', '#ffffff', '#ff0055', '#ff9100'][Math.floor(Math.random() * 5)],
                life: 32
            }))
        });
        this.shake(32, 38);
    }

    // 闪电链特效
    addLightning(points) {
        this.lightnings.push({
            points: points,
            alpha: 1,
            life: 22
        });
    }

    update(isFrozen = false) {
        // 屏幕震动非线性衰减
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            if (this.shakeTimer === 0) {
                this.shakeIntensity = 0;
            }
        }

        // 自然生成上升气泡
        if (Math.random() < 0.35) {
            this.addBubble();
        }

        // 气泡更新
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y -= b.speed;
            b.x += Math.sin(b.y * 0.02 + b.wobbleOffset) * 0.8;
            if (b.y < -30) {
                this.bubbles.splice(i, 1);
            }
        }

        // 渔网多层冲击波与粒子更新
        for (let i = this.nets.length - 1; i >= 0; i--) {
            const n = this.nets[i];
            n.life--;
            n.radius += (n.maxRadius - n.radius) * 0.26;
            n.rotation += n.rotSpeed;
            n.opacity = n.life / n.duration;

            // 扩展光环
            for (const rip of n.ripples) {
                rip.r += rip.speed;
                rip.alpha = Math.max(0, 1 - (rip.r / rip.max));
            }

            // 火花粒子飞散
            for (const sp of n.sparks) {
                sp.x += sp.vx;
                sp.y += sp.vy;
                sp.vx *= 0.95;
                sp.vy *= 0.95;
                sp.alpha = n.opacity;
            }

            if (n.life <= 0) {
                this.nets.splice(i, 1);
            }
        }

        // 金币更新 (两段式贝塞尔飞行动画 + 璀璨尾迹)
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            if (c.delay > 0) {
                c.delay--;
                continue;
            }

            // 保存光效拖尾
            c.trail.push({ x: c.x, y: c.y, alpha: 0.85, size: c.size * 0.45 });
            if (c.trail.length > 8) {
                c.trail.shift();
            }
            for (const tr of c.trail) {
                tr.alpha *= 0.82;
            }

            c.progress += c.speed;
            c.rotation += c.rotSpeed;

            if (c.progress < 0.28) {
                const p = c.progress / 0.28;
                c.x = c.startX + (c.burstX - c.startX) * Math.sin(p * Math.PI * 0.5);
                c.y = c.startY + (c.burstY - c.startY) * Math.sin(p * Math.PI * 0.5);
            } else {
                const t = (c.progress - 0.28) / 0.72;
                const easeT = t * t * t; // 强力加速度向 UI 栏飞吸
                const midX = (c.burstX + c.targetX) * 0.5 + 90;
                const midY = (c.burstY + c.targetY) * 0.5 - 80;

                c.x = (1 - easeT) * (1 - easeT) * c.burstX + 2 * (1 - easeT) * easeT * midX + easeT * easeT * c.targetX;
                c.y = (1 - easeT) * (1 - easeT) * c.burstY + 2 * (1 - easeT) * easeT * midY + easeT * easeT * c.targetY;
            }

            if (c.progress >= 1) {
                // 击中金币栏：触发金币音调音效 + UI 弹性受击缩放反馈！
                if (window.soundManager) {
                    window.soundManager.playCoin(c.soundIndex % 8);
                }
                if (window.uiManager) {
                    window.uiManager.triggerCoinBounce();
                }
                this.coins.splice(i, 1);
            }
        }

        // 漂浮分值
        for (let i = this.scores.length - 1; i >= 0; i--) {
            const s = this.scores[i];
            s.y += s.velocityY;
            s.life--;
            s.opacity = Math.max(0, s.life / 48);
            if (s.life <= 0) {
                this.scores.splice(i, 1);
            }
        }

        // 爆炸
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const ex = this.explosions[i];
            ex.radius += (ex.maxRadius - ex.radius) * 0.25;
            ex.opacity *= 0.91;
            for (const p of ex.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.93;
                p.vy *= 0.93;
                p.life--;
            }
            if (ex.opacity < 0.05) {
                this.explosions.splice(i, 1);
            }
        }

        // 闪电
        for (let i = this.lightnings.length - 1; i >= 0; i--) {
            const lt = this.lightnings[i];
            lt.life--;
            lt.alpha = lt.life / 22;
            if (lt.life <= 0) {
                this.lightnings.splice(i, 1);
            }
        }

        this.causticOffset += 0.02;
    }

    renderBackground(ctx, width, height, fishCount = 0) {
        // 当同屏鱼群超过 50 条时，激活深海狂野乱流光影 (更加明亮活跃的洋流涌动)
        const isFrenzy = fishCount > 50;
        const frenzyMultiplier = isFrenzy ? Math.min(1.8, 1 + (fishCount - 50) * 0.02) : 1;

        // 1. 深海渐变底色
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (isFrenzy) {
            oceanGrad.addColorStop(0, '#022442');
            oceanGrad.addColorStop(0.3, '#043b6b');
            oceanGrad.addColorStop(0.7, '#024b85');
            oceanGrad.addColorStop(1, '#012547');
        } else {
            oceanGrad.addColorStop(0, '#02182b');
            oceanGrad.addColorStop(0.3, '#032b4d');
            oceanGrad.addColorStop(0.7, '#013861');
            oceanGrad.addColorStop(1, '#001a33');
        }
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. 顶部照射而下的动态阳光束
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 6; i++) {
            const rayX = width * (0.15 + i * 0.16) + Math.sin(this.causticOffset + i) * 60;
            const rayWidth = 100 + Math.sin(this.causticOffset * 0.5 + i) * 40;
            const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + 80, height * 0.85);
            rayGrad.addColorStop(0, `rgba(120, 235, 255, ${0.18 * frenzyMultiplier})`);
            rayGrad.addColorStop(0.5, `rgba(60, 200, 255, ${0.09 * frenzyMultiplier})`);
            rayGrad.addColorStop(1, 'rgba(0, 50, 100, 0)');

            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(rayX - 30, 0);
            ctx.lineTo(rayX + rayWidth + 30, 0);
            ctx.lineTo(rayX + rayWidth * 2.2 + 80, height);
            ctx.lineTo(rayX - rayWidth * 0.8 - 40, height);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // 3. 底部海底沙滩礁石
        const sandGrad = ctx.createLinearGradient(0, height - 70, 0, height);
        sandGrad.addColorStop(0, 'rgba(20, 60, 60, 0.2)');
        sandGrad.addColorStop(0.5, '#052b36');
        sandGrad.addColorStop(1, '#02171e');
        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, height - 40);
        for (let x = 0; x <= width; x += 80) {
            const cy = height - 40 + Math.sin(x * 0.015) * 15;
            ctx.lineTo(x, cy);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // 4. 摇曳的海草
        const now = Date.now() * 0.002;
        for (const s of this.seaweeds) {
            ctx.save();
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(s.x, height);

            const sway1 = Math.sin(now * s.speed + s.phase) * 25;
            const sway2 = Math.sin(now * s.speed * 1.3 + s.phase) * 40;
            const midY = height - s.height * 0.5;
            const topY = height - s.height;

            ctx.quadraticCurveTo(s.x + sway1, midY, s.x + sway2, topY);
            ctx.stroke();
            ctx.restore();
        }

        // 5. 渲染上升气泡
        for (const b of this.bubbles) {
            ctx.save();
            ctx.strokeStyle = `rgba(180, 240, 255, ${b.opacity})`;
            ctx.fillStyle = `rgba(220, 250, 255, ${b.opacity * 0.35})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.8})`;
            ctx.beginPath();
            ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    renderForeground(ctx, width, height) {
        // 渲染华丽多重冲击波渔网与水波纹扩散
        for (const n of this.nets) {
            ctx.save();
            ctx.translate(n.x, n.y);

            // 1. 水波纹冲击波扩散热浪 (Water Distortion Ripples)
            for (const rip of n.ripples) {
                if (rip.alpha <= 0.01) continue;
                ctx.save();
                ctx.strokeStyle = `rgba(0, 240, 255, ${rip.alpha * 0.6})`;
                ctx.lineWidth = 4 * rip.alpha;
                ctx.shadowColor = n.color;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(0, 0, rip.r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // 2. 飞散火花闪光
            for (const sp of n.sparks) {
                if (sp.alpha <= 0.01) continue;
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = n.color;
                ctx.shadowBlur = 12;
                ctx.globalAlpha = sp.alpha;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // 3. 几何能量菱形光网
            ctx.rotate(n.rotation);
            ctx.globalAlpha = n.opacity;

            // 中心耀斑
            const centerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, n.radius * 0.5);
            centerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
            centerGrad.addColorStop(0.5, n.color);
            centerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = centerGrad;
            ctx.beginPath();
            ctx.arc(0, 0, n.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // 外部主光环
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 3.5;
            ctx.shadowColor = n.color;
            ctx.shadowBlur = 22;
            ctx.beginPath();
            ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
            ctx.stroke();

            // 内部同心圆网
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 0, n.radius * 0.68, 0, Math.PI * 2);
            ctx.arc(0, 0, n.radius * 0.36, 0, Math.PI * 2);
            ctx.stroke();

            // 辐射网格经纬线
            const spokes = 14;
            for (let i = 0; i < spokes; i++) {
                const angle = (i * Math.PI * 2) / spokes;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * n.radius, Math.sin(angle) * n.radius);
                ctx.stroke();
            }

            // 交叉网格节点发光圆点
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < spokes; i++) {
                const angle = (i * Math.PI * 2) / spokes;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * n.radius * 0.68, Math.sin(angle) * n.radius * 0.68, 3.5, 0, Math.PI * 2);
                ctx.arc(Math.cos(angle) * n.radius, Math.sin(angle) * n.radius, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // 渲染爆炸特效
        for (const ex of this.explosions) {
            ctx.save();
            ctx.globalAlpha = ex.opacity;

            const grad = ctx.createRadialGradient(ex.x, ex.y, ex.radius * 0.2, ex.x, ex.y, ex.radius);
            grad.addColorStop(0, 'rgba(255, 230, 150, 0.85)');
            grad.addColorStop(0.5, 'rgba(255, 100, 30, 0.6)');
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
            ctx.fill();

            for (const p of ex.particles) {
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 渲染闪电链
        for (const lt of this.lightnings) {
            ctx.save();
            ctx.globalAlpha = lt.alpha;
            ctx.strokeStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 16;
            ctx.lineWidth = 3.5;

            for (let i = 0; i < lt.points.length - 1; i++) {
                const p1 = lt.points[i];
                const p2 = lt.points[i + 1];
                this.drawJaggedLine(ctx, p1.x, p1.y, p2.x, p2.y);
            }
            ctx.restore();
        }

        // 渲染 3D 旋转金币与光效拖尾
        for (const c of this.coins) {
            if (c.delay > 0) continue;

            // 绘制金色粒子尾迹
            if (c.trail && c.trail.length > 0) {
                for (let t = 0; t < c.trail.length; t++) {
                    const tr = c.trail[t];
                    ctx.save();
                    ctx.globalAlpha = tr.alpha * 0.6;
                    ctx.fillStyle = '#ffd700';
                    ctx.shadowColor = '#ffea00';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(tr.x, tr.y, tr.size * (0.4 + (t / c.trail.length) * 0.6), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // 金币本体
            ctx.save();
            ctx.translate(c.x, c.y);
            const scaleX = Math.cos(c.rotation);
            ctx.scale(scaleX, 1);

            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 14;

            const coinGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, c.size);
            coinGrad.addColorStop(0, '#fff6a9');
            coinGrad.addColorStop(0.35, '#ffd700');
            coinGrad.addColorStop(0.85, '#d49b00');
            coinGrad.addColorStop(1, '#8f5c00');

            ctx.fillStyle = coinGrad;
            ctx.beginPath();
            ctx.arc(0, 0, c.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 1.6;
            ctx.strokeRect(-c.size * 0.35, -c.size * 0.35, c.size * 0.7, c.size * 0.7);

            ctx.restore();
        }

        // 渲染漂浮分值
        for (const s of this.scores) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.scale(s.scale, s.scale);
            ctx.globalAlpha = s.opacity;

            ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 6;
            ctx.lineJoin = 'round';
            const text = (s.isBoss ? '👑 +' : '+') + s.score;
            ctx.strokeText(text, 0, 0);

            const grad = ctx.createLinearGradient(0, -15, 0, 15);
            if (s.isBoss) {
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.4, '#ff1744');
                grad.addColorStop(1, '#ffea00');
            } else {
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.4, '#ffea00');
                grad.addColorStop(1, '#ff6d00');
            }
            ctx.fillStyle = grad;
            ctx.fillText(text, 0, 0);

            ctx.restore();
        }
    }

    drawJaggedLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const dist = Math.hypot(x2 - x1, y2 - y1);
        const segments = Math.max(3, Math.floor(dist / 35));
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;

        for (let i = 1; i < segments; i++) {
            const jag = (Math.random() - 0.5) * 30;
            ctx.lineTo(x1 + dx * i + jag, y1 + dy * i + jag);
        }
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // 强化非线性震屏偏移 (支持轻微旋转晃动，带来极具临场感的大地震颤)
    getShakeOffset() {
        if (this.shakeTimer <= 0) return { x: 0, y: 0, rot: 0 };
        const progress = this.shakeTimer / this.maxShakeTimer;
        // 二次方非线性衰减
        const power = progress * progress * this.shakeIntensity;
        return {
            x: (Math.random() - 0.5) * power * 2.2,
            y: (Math.random() - 0.5) * power * 2.2,
            rot: (Math.random() - 0.5) * (power * 0.0015)
        };
    }
}

window.particleSystem = new ParticleSystem();
