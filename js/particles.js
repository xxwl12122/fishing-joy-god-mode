/**
 * 捕鱼达人 - 粒子特效、水下氛围与视觉渲染系统
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
        this.shakeTimer = 0;
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

    // 触发屏幕震动
    shake(intensity = 10, duration = 20) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    // 添加气泡
    addBubble(x, y, size = null) {
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

    // 添加金币飞行动画 (从鱼儿死掉的位置飞向炮台金币栏)
    addCoin(startX, startY, targetX, targetY, value = 10, count = 5) {
        const coinCount = Math.min(Math.max(3, Math.floor(value / 5)), 18);
        for (let i = 0; i < coinCount; i++) {
            const spreadAngle = Math.random() * Math.PI * 2;
            const spreadDist = 20 + Math.random() * 60;
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
                speed: 0.02 + Math.random() * 0.015,
                delay: i * 3,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: 0.15 + Math.random() * 0.1,
                size: 16 + (value >= 100 ? 6 : 0),
                isBig: value >= 100,
                soundIndex: i
            });
        }
    }

    // 添加渔网展开特效
    addNet(x, y, radius, color = '#00ffff') {
        this.nets.push({
            x: x,
            y: y,
            maxRadius: radius,
            radius: 5,
            opacity: 1,
            color: color,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: 0.02,
            duration: 25,
            life: 25
        });
    }

    // 添加漂浮数值
    addScore(x, y, score, isBoss = false) {
        this.scores.push({
            x: x,
            y: y,
            score: score,
            opacity: 1,
            scale: isBoss ? 1.6 : 1.0,
            velocityY: -1.8,
            life: 45,
            isBoss: isBoss
        });
    }

    // 爆炸特效
    addExplosion(x, y, radius = 220) {
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: radius,
            opacity: 1,
            particles: Array.from({ length: 40 }, () => ({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.5) * 14,
                size: 3 + Math.random() * 7,
                color: ['#ff4400', '#ffcc00', '#ffffff', '#ff0055'][Math.floor(Math.random() * 4)],
                life: 35
            }))
        });
        this.shake(18, 30);
    }

    // 闪电链特效
    addLightning(points) {
        this.lightnings.push({
            points: points,
            alpha: 1,
            life: 20
        });
    }

    update(isFrozen = false) {
        // 屏幕震动衰减
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
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

        // 渔网更新
        for (let i = this.nets.length - 1; i >= 0; i--) {
            const n = this.nets[i];
            n.life--;
            n.radius += (n.maxRadius - n.radius) * 0.28;
            n.rotation += n.rotSpeed;
            n.opacity = n.life / n.duration;
            if (n.life <= 0) {
                this.nets.splice(i, 1);
            }
        }

        // 金币更新 (两段式贝塞尔飞行动画：先向四周炸开，再加速吸向金币栏)
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            if (c.delay > 0) {
                c.delay--;
                continue;
            }

            c.progress += c.speed;
            c.rotation += c.rotSpeed;

            if (c.progress < 0.3) {
                // 第一阶段：向外爆发
                const p = c.progress / 0.3;
                c.x = c.startX + (c.burstX - c.startX) * Math.sin(p * Math.PI * 0.5);
                c.y = c.startY + (c.burstY - c.startY) * Math.sin(p * Math.PI * 0.5);
            } else {
                // 第二阶段：二次贝塞尔加速吸入
                const t = (c.progress - 0.3) / 0.7;
                const easeT = t * t; // 加速度曲线
                const midX = (c.burstX + c.targetX) * 0.5 + 80;
                const midY = (c.burstY + c.targetY) * 0.5 - 60;
                
                c.x = (1 - easeT) * (1 - easeT) * c.burstX + 2 * (1 - easeT) * easeT * midX + easeT * easeT * c.targetX;
                c.y = (1 - easeT) * (1 - easeT) * c.burstY + 2 * (1 - easeT) * easeT * midY + easeT * easeT * c.targetY;
            }

            if (c.progress >= 1) {
                // 击中金币栏，播放清脆声
                if (window.soundManager) {
                    window.soundManager.playCoin(c.soundIndex % 4);
                }
                this.coins.splice(i, 1);
            }
        }

        // 漂浮分值
        for (let i = this.scores.length - 1; i >= 0; i--) {
            const s = this.scores[i];
            s.y += s.velocityY;
            s.life--;
            s.opacity = Math.max(0, s.life / 45);
            if (s.life <= 0) {
                this.scores.splice(i, 1);
            }
        }

        // 爆炸
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const ex = this.explosions[i];
            ex.radius += (ex.maxRadius - ex.radius) * 0.22;
            ex.opacity *= 0.92;
            for (const p of ex.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.94;
                p.vy *= 0.94;
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
            lt.alpha = lt.life / 20;
            if (lt.life <= 0) {
                this.lightnings.splice(i, 1);
            }
        }

        this.causticOffset += 0.02;
    }

    renderBackground(ctx, width, height) {
        // 1. 深海渐变底色
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
        oceanGrad.addColorStop(0, '#02182b');
        oceanGrad.addColorStop(0.3, '#032b4d');
        oceanGrad.addColorStop(0.7, '#013861');
        oceanGrad.addColorStop(1, '#001a33');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. 顶部照射而下的动态阳光束 (God Rays / Caustics)
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 6; i++) {
            const rayX = width * (0.15 + i * 0.16) + Math.sin(this.causticOffset + i) * 60;
            const rayWidth = 100 + Math.sin(this.causticOffset * 0.5 + i) * 40;
            const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + 80, height * 0.85);
            rayGrad.addColorStop(0, 'rgba(100, 220, 255, 0.18)');
            rayGrad.addColorStop(0.5, 'rgba(50, 180, 230, 0.08)');
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

            // 气泡高光小圆点
            ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.8})`;
            ctx.beginPath();
            ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    renderForeground(ctx, width, height) {
        // 渲染渔网
        for (const n of this.nets) {
            ctx.save();
            ctx.translate(n.x, n.y);
            ctx.rotate(n.rotation);
            ctx.globalAlpha = n.opacity;

            // 外部冲击光环
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = n.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
            ctx.stroke();

            // 内部同心圆网
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, n.radius * 0.65, 0, Math.PI * 2);
            ctx.arc(0, 0, n.radius * 0.35, 0, Math.PI * 2);
            ctx.stroke();

            // 辐射网格经纬线
            const spokes = 12;
            for (let i = 0; i < spokes; i++) {
                const angle = (i * Math.PI * 2) / spokes;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * n.radius, Math.sin(angle) * n.radius);
                ctx.stroke();
            }

            // 交叉菱形网节点发光圆点
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < spokes; i++) {
                const angle = (i * Math.PI * 2) / spokes;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * n.radius * 0.65, Math.sin(angle) * n.radius * 0.65, 3, 0, Math.PI * 2);
                ctx.arc(Math.cos(angle) * n.radius, Math.sin(angle) * n.radius, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // 渲染爆炸特效
        for (const ex of this.explosions) {
            ctx.save();
            ctx.globalAlpha = ex.opacity;

            // 冲击波
            const grad = ctx.createRadialGradient(ex.x, ex.y, ex.radius * 0.2, ex.x, ex.y, ex.radius);
            grad.addColorStop(0, 'rgba(255, 230, 150, 0.8)');
            grad.addColorStop(0.5, 'rgba(255, 100, 30, 0.5)');
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
            ctx.fill();

            // 飞散碎片火花
            for (const p of ex.particles) {
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
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
            ctx.shadowBlur = 14;
            ctx.lineWidth = 3;

            for (let i = 0; i < lt.points.length - 1; i++) {
                const p1 = lt.points[i];
                const p2 = lt.points[i + 1];
                this.drawJaggedLine(ctx, p1.x, p1.y, p2.x, p2.y);
            }
            ctx.restore();
        }

        // 渲染 3D 旋转金币
        for (const c of this.coins) {
            if (c.delay > 0) continue;
            ctx.save();
            ctx.translate(c.x, c.y);
            const scaleX = Math.cos(c.rotation); // 模拟 3D 旋转翻转
            ctx.scale(scaleX, 1);

            // 金币外圆
            const coinGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, c.size);
            coinGrad.addColorStop(0, '#fff6a9');
            coinGrad.addColorStop(0.4, '#ffd700');
            coinGrad.addColorStop(0.85, '#d49b00');
            coinGrad.addColorStop(1, '#8f5c00');

            ctx.fillStyle = coinGrad;
            ctx.beginPath();
            ctx.arc(0, 0, c.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // 内部方孔或金币图案
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-c.size * 0.35, -c.size * 0.35, c.size * 0.7, c.size * 0.7);

            ctx.restore();
        }

        // 渲染漂浮分值
        for (const s of this.scores) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.scale(s.scale, s.scale);
            ctx.globalAlpha = s.opacity;

            ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 发光边框
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 5;
            ctx.lineJoin = 'round';
            const text = (s.isBoss ? '👑 +' : '+') + s.score;
            ctx.strokeText(text, 0, 0);

            // 金光渐变填充
            const grad = ctx.createLinearGradient(0, -15, 0, 15);
            if (s.isBoss) {
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.5, '#ff3366');
                grad.addColorStop(1, '#ffea00');
            } else {
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.4, '#ffea00');
                grad.addColorStop(1, '#ff8800');
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

    // 获取当前震动偏移
    getShakeOffset() {
        if (this.shakeTimer <= 0) return { x: 0, y: 0 };
        const intensity = (this.shakeTimer / 20) * this.shakeIntensity;
        return {
            x: (Math.random() - 0.5) * intensity * 2,
            y: (Math.random() - 0.5) * intensity * 2
        };
    }
}

window.particleSystem = new ParticleSystem();
