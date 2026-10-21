/**
 * 捕鱼达人 - 鱼类生态与生物动态渲染系统
 * 包含 14 种形态各异的深海生物、逼真游动骨骼动画与特殊功能鱼
 */

const FISH_CONFIGS = {
    yellow_fish: {
        name: '小黄鱼',
        score: 2,
        speed: 2.2,
        baseHp: 1,
        width: 32,
        height: 18,
        desc: '群居小型鱼类，数量众多，极易捕获。'
    },
    clown_fish: {
        name: '小丑鱼',
        score: 3,
        speed: 2.0,
        baseHp: 2,
        width: 42,
        height: 24,
        desc: '活泼好动的热带鱼，身披橙白相间的警戒条纹。'
    },
    blue_tang: {
        name: '蓝唐王鱼',
        score: 4,
        speed: 2.4,
        baseHp: 3,
        width: 48,
        height: 28,
        desc: '游速轻快，湛蓝的体色配以亮黄色尾鳍。'
    },
    puffer_fish: {
        name: '刺豚',
        score: 7,
        speed: 1.6,
        baseHp: 5,
        width: 52,
        height: 38,
        desc: '受到攻击时会瞬间膨胀鼓起尖刺。'
    },
    jellyfish: {
        name: '发光水母',
        score: 10,
        speed: 1.2,
        baseHp: 7,
        width: 55,
        height: 55,
        desc: '半透明伞状游动，散发梦幻水母荧光。'
    },
    turtle: {
        name: '千年海龟',
        score: 15,
        speed: 1.1,
        baseHp: 10,
        width: 72,
        height: 54,
        desc: '长寿的厚甲海龟，四肢优雅划水。'
    },
    swordfish: {
        name: '尖嘴剑鱼',
        score: 25,
        speed: 3.1,
        baseHp: 16,
        width: 95,
        height: 36,
        desc: '海中速度之王，尖利的长吻如利剑般穿梭。'
    },
    manta_ray: {
        name: '魔鬼蝠鲼',
        score: 35,
        speed: 1.4,
        baseHp: 22,
        width: 105,
        height: 80,
        desc: '巨大如飞翼的胸鳍在深海中优雅翱翔。'
    },
    hammerhead: {
        name: '黄金锤头鲨',
        score: 60,
        speed: 1.8,
        baseHp: 35,
        width: 125,
        height: 56,
        desc: '头部两侧突出的深海霸主，披覆厚重黄金鳞甲。'
    },
    shark: {
        name: '霸王大白鲨',
        score: 100,
        speed: 1.7,
        baseHp: 55,
        width: 150,
        height: 70,
        desc: '令人胆寒的顶级掠食者，巨额金币悬赏！'
    },
    golden_dragon: {
        name: '远古金龙 (BOSS)',
        score: 300,
        speed: 1.4,
        baseHp: 120,
        width: 260,
        height: 80,
        desc: '神话中的东方神龙，吞吐祥瑞金光，击败可触发巨奖！'
    },
    bomb_fish: {
        name: '烈焰炸弹鱼',
        score: 50,
        speed: 1.5,
        baseHp: 20,
        width: 56,
        height: 48,
        desc: '背负高能水雷，捕获后引爆全屏消灭周围鱼群！'
    },
    freeze_fish: {
        name: '寒冰海星',
        score: 40,
        speed: 1.3,
        baseHp: 15,
        width: 54,
        height: 54,
        desc: '散发极寒冰晶，捕获后冻结全屏鱼群 8 秒！'
    },
    lightning_eel: {
        name: '电光鳗',
        score: 45,
        speed: 2.1,
        baseHp: 18,
        width: 80,
        height: 25,
        desc: '通体充盈高压电荷，捕获后释放闪电链连环电击！'
    }
};

// ================= 离屏 Canvas 预渲染小鱼精灵贴图缓存 (极大降低 CPU/GPU 负担) =================
const SPRITE_CACHE = {};
function initFishSprites() {
    if (typeof document === 'undefined') return;

    // 1. 小黄鱼身体离屏缓存
    const yC = document.createElement('canvas');
    yC.width = 36; yC.height = 20;
    const yCtx = yC.getContext('2d');
    const yGrad = yCtx.createRadialGradient(22, 8, 2, 18, 10, 16);
    yGrad.addColorStop(0, '#fff45c');
    yGrad.addColorStop(0.7, '#ffb300');
    yGrad.addColorStop(1, '#e67e00');
    yCtx.fillStyle = yGrad;
    yCtx.beginPath();
    yCtx.ellipse(18, 10, 16, 9, 0, 0, Math.PI * 2);
    yCtx.fill();
    yCtx.fillStyle = '#ffffff';
    yCtx.beginPath();
    yCtx.arc(26, 7, 3.2, 0, Math.PI * 2);
    yCtx.fill();
    yCtx.fillStyle = '#000000';
    yCtx.beginPath();
    yCtx.arc(27, 7, 1.6, 0, Math.PI * 2);
    yCtx.fill();
    SPRITE_CACHE.yellow_fish = yC;

    // 2. 小丑鱼身体离屏缓存
    const cC = document.createElement('canvas');
    cC.width = 44; cC.height = 26;
    const cCtx = cC.getContext('2d');
    const cGrad = cCtx.createLinearGradient(2, 13, 42, 13);
    cGrad.addColorStop(0, '#e64a19');
    cGrad.addColorStop(0.5, '#ff7043');
    cGrad.addColorStop(1, '#ff5722');
    cCtx.fillStyle = cGrad;
    cCtx.beginPath();
    cCtx.ellipse(22, 13, 20, 12, 0, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.fillStyle = '#ffffff';
    cCtx.strokeStyle = '#222';
    cCtx.lineWidth = 1.2;
    cCtx.beginPath();
    cCtx.ellipse(17, 13, 3.5, 11, 0, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.stroke();
    cCtx.beginPath();
    cCtx.ellipse(28, 13, 3, 10, 0, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.stroke();
    cCtx.fillStyle = '#ffffff';
    cCtx.beginPath();
    cCtx.arc(33, 9, 3.8, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.fillStyle = '#000000';
    cCtx.beginPath();
    cCtx.arc(34.5, 9, 2, 0, Math.PI * 2);
    cCtx.fill();
    SPRITE_CACHE.clown_fish = cC;

    // 3. 蓝唐王鱼身体离屏缓存
    const bC = document.createElement('canvas');
    bC.width = 52; bC.height = 32;
    const bCtx = bC.getContext('2d');
    const bGrad = bCtx.createRadialGradient(31, 12, 4, 26, 16, 24);
    bGrad.addColorStop(0, '#2979ff');
    bGrad.addColorStop(0.6, '#1565c0');
    bGrad.addColorStop(1, '#0d47a1');
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.ellipse(26, 16, 24, 15, 0, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.fillStyle = '#111827';
    bCtx.beginPath();
    bCtx.arc(22, 14, 12, 0, Math.PI);
    bCtx.fill();
    bCtx.fillStyle = '#ffffff';
    bCtx.beginPath();
    bCtx.arc(39, 11, 4, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.fillStyle = '#000000';
    bCtx.beginPath();
    bCtx.arc(40.5, 11, 2, 0, Math.PI * 2);
    bCtx.fill();
    SPRITE_CACHE.blue_tang = bC;
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initFishSprites);
}

class Fish {
    constructor(type, spawnWidth, spawnHeight, customCurve = null) {
        this.reset(type, spawnWidth, spawnHeight, customCurve);
    }

    // 对象池复用重置接口 (避免高频 GC 垃圾回收导致卡顿)
    reset(type, spawnWidth, spawnHeight, customCurve = null) {
        this.type = type;
        this.config = FISH_CONFIGS[type] || FISH_CONFIGS.yellow_fish;
        this.name = this.config.name;
        this.score = this.config.score;
        this.hp = this.config.baseHp;
        this.maxHp = this.config.baseHp;
        this.width = this.config.width;
        this.height = this.config.height;

        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.phase = Math.random() * Math.PI * 2;
        this.swimSpeed = 0.08 + Math.random() * 0.04;
        this.t = 0;
        this.tSpeed = 0.0006 * this.config.speed;

        this.isDead = false;
        this.isDying = false;
        this.deathProgress = 0;
        this.hitFlash = 0;
        this.pufferScale = 1;

        if (this.type === 'golden_dragon') {
            if (!this.segments) {
                this.segments = [];
                for (let i = 0; i < 14; i++) {
                    this.segments.push({ x: 0, y: 0, angle: 0 });
                }
            }
        } else {
            this.segments = null;
        }

        if (customCurve) {
            this.curve = customCurve;
        } else {
            this.generateRandomCurve(spawnWidth, spawnHeight);
        }

        this.updatePosition();
    }

    // 生成平滑的三次贝塞尔游动路径
    generateRandomCurve(sw, sh) {
        const fromLeft = Math.random() < 0.5;
        const p0 = {
            x: fromLeft ? -150 : sw + 150,
            y: 80 + Math.random() * (sh - 220)
        };
        const p3 = {
            x: fromLeft ? sw + 150 : -150,
            y: 80 + Math.random() * (sh - 220)
        };
        // 控制点制造曲线起伏
        const p1 = {
            x: fromLeft ? sw * 0.33 : sw * 0.67,
            y: Math.max(50, Math.min(sh - 120, p0.y + (Math.random() - 0.5) * 350))
        };
        const p2 = {
            x: fromLeft ? sw * 0.67 : sw * 0.33,
            y: Math.max(50, Math.min(sh - 120, p3.y + (Math.random() - 0.5) * 350))
        };

        this.curve = { p0, p1, p2, p3 };
    }

    // 计算贝塞尔曲线上任意一点
    getBezierPoint(t, p0, p1, p2, p3) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        return {
            x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
            y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
        };
    }

    updatePosition() {
        const p = this.getBezierPoint(this.t, this.curve.p0, this.curve.p1, this.curve.p2, this.curve.p3);
        const nextP = this.getBezierPoint(Math.min(1, this.t + 0.005), this.curve.p0, this.curve.p1, this.curve.p2, this.curve.p3);

        this.x = p.x;
        this.y = p.y;
        this.angle = Math.atan2(nextP.y - p.y, nextP.x - p.x);

        // 如果是金龙，更新身体每一节的跟随动力学
        if (this.type === 'golden_dragon' && this.segments) {
            this.segments[0].x = this.x;
            this.segments[0].y = this.y;
            this.segments[0].angle = this.angle;

            const segDist = 18;
            for (let i = 1; i < this.segments.length; i++) {
                const prev = this.segments[i - 1];
                const curr = this.segments[i];
                const dx = curr.x - prev.x;
                const dy = curr.y - prev.y;
                curr.angle = Math.atan2(dy, dx);
                curr.x = prev.x + Math.cos(curr.angle) * segDist;
                curr.y = prev.y + Math.sin(curr.angle) * segDist;
            }
        }
    }

    update(isFrozen = false) {
        if (this.isDead) return;

        // 死亡濒死动画：旋转、变亮、散逸气泡后消散
        if (this.isDying) {
            this.deathProgress += 0.05;
            this.angle += 0.25;
            if (this.deathProgress >= 1) {
                this.isDead = true;
            }
            return;
        }

        // 冰冻状态下停止移动
        if (isFrozen) {
            return;
        }

        this.phase += this.swimSpeed;
        this.t += this.tSpeed;

        if (this.hitFlash > 0) this.hitFlash--;
        if (this.pufferScale > 1) {
            this.pufferScale = Math.max(1, this.pufferScale - 0.04);
        }

        if (this.t >= 1) {
            // 游出屏幕范围，标记移除
            this.isDead = true;
            return;
        }

        this.updatePosition();
    }

    takeHit(damage = 1) {
        this.hitFlash = 6;
        this.hp -= damage;
        if (this.type === 'puffer_fish') {
            this.pufferScale = 1.45;
        }
    }

    startDying() {
        this.isDying = true;
        this.deathProgress = 0;
    }

    // 碰撞检测：圆柱/圆球包围盒
    isHit(x, y, radius) {
        if (this.isDead || this.isDying) return false;
        const dist = Math.hypot(this.x - x, this.y - y);
        return dist < (this.width * 0.45 + radius);
    }

    // 绘制鱼类
    render(ctx) {
        if (this.isDead) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 濒死效果 (旋转 + 缩放 + 透明度渐变)
        if (this.isDying) {
            const scale = Math.max(0.1, 1 - this.deathProgress * 0.7);
            ctx.scale(scale, scale);
            ctx.globalAlpha = Math.max(0, 1 - this.deathProgress);
        }

        // 受击闪白效果
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(2.2) drop-shadow(0 0 10px #ff3333)';
        }

        // 依据鱼类类型调用专门的动态向量绘制
        this.drawFishBody(ctx);

        ctx.restore();

        // 独立绘制金龙的各节骨骼（金龙需要按节渲染）
        if (this.type === 'golden_dragon' && !this.isDead) {
            this.renderGoldenDragonSegments(ctx);
        }
    }

    drawFishBody(ctx) {
        const wiggle = Math.sin(this.phase) * 6;
        const finWiggle = Math.cos(this.phase * 1.5) * 0.25;

        switch (this.type) {
            case 'yellow_fish':
                this.drawYellowFish(ctx, wiggle);
                break;
            case 'clown_fish':
                this.drawClownFish(ctx, wiggle);
                break;
            case 'blue_tang':
                this.drawBlueTang(ctx, wiggle);
                break;
            case 'puffer_fish':
                this.drawPufferFish(ctx, wiggle);
                break;
            case 'jellyfish':
                this.drawJellyfish(ctx);
                break;
            case 'turtle':
                this.drawTurtle(ctx, finWiggle);
                break;
            case 'swordfish':
                this.drawSwordfish(ctx, wiggle);
                break;
            case 'manta_ray':
                this.drawMantaRay(ctx, finWiggle);
                break;
            case 'hammerhead':
                this.drawHammerhead(ctx, wiggle);
                break;
            case 'shark':
                this.drawShark(ctx, wiggle);
                break;
            case 'golden_dragon':
                this.drawDragonHead(ctx);
                break;
            case 'bomb_fish':
                this.drawBombFish(ctx, wiggle);
                break;
            case 'freeze_fish':
                this.drawFreezeFish(ctx);
                break;
            case 'lightning_eel':
                this.drawLightningEel(ctx, wiggle);
                break;
            default:
                this.drawYellowFish(ctx, wiggle);
        }
    }

    // 1. 小黄鱼
    drawYellowFish(ctx, wiggle) {
        // 动态尾鳍
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-24, -10 + wiggle);
        ctx.lineTo(-20, wiggle);
        ctx.lineTo(-24, 10 + wiggle);
        ctx.closePath();
        ctx.fill();

        // 身体 (离屏贴图预渲染直接贴图，极大节省百万级运算)
        if (SPRITE_CACHE.yellow_fish) {
            ctx.drawImage(SPRITE_CACHE.yellow_fish, -18, -10);
        } else {
            const grad = ctx.createRadialGradient(4, -2, 2, 0, 0, 16);
            grad.addColorStop(0, '#fff45c');
            grad.addColorStop(0.7, '#ffb300');
            grad.addColorStop(1, '#e67e00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(8, -3, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(9, -3, 1.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 2. 小丑鱼 (橙白条纹)
    drawClownFish(ctx, wiggle) {
        // 动态尾鳍
        ctx.fillStyle = '#ff5500';
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(-28, -12 + wiggle);
        ctx.lineTo(-24, wiggle);
        ctx.lineTo(-28, 12 + wiggle);
        ctx.closePath();
        ctx.fill();

        // 身体
        if (SPRITE_CACHE.clown_fish) {
            ctx.drawImage(SPRITE_CACHE.clown_fish, -22, -13);
        } else {
            const bodyGrad = ctx.createLinearGradient(-20, 0, 20, 0);
            bodyGrad.addColorStop(0, '#e64a19');
            bodyGrad.addColorStop(0.5, '#ff7043');
            bodyGrad.addColorStop(1, '#ff5722');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(-5, 0, 3.5, 11, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(6, 0, 3, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(11, -4, 3.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(12.5, -4, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 3. 蓝唐王鱼
    drawBlueTang(ctx, wiggle) {
        // 亮黄尾鳍
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-32, -14 + wiggle);
        ctx.lineTo(-26, wiggle);
        ctx.lineTo(-32, 14 + wiggle);
        ctx.closePath();
        ctx.fill();

        // 宝蓝身体
        if (SPRITE_CACHE.blue_tang) {
            ctx.drawImage(SPRITE_CACHE.blue_tang, -26, -16);
        } else {
            const grad = ctx.createRadialGradient(5, -4, 4, 0, 0, 24);
            grad.addColorStop(0, '#2979ff');
            grad.addColorStop(0.6, '#1565c0');
            grad.addColorStop(1, '#0d47a1');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 24, 15, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.arc(-4, -2, 12, 0, Math.PI);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(13, -5, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(14.5, -5, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 4. 刺豚 (河豚 - 受击剧烈膨胀带尖刺)
    drawPufferFish(ctx, wiggle) {
        const scale = this.pufferScale;
        ctx.scale(scale, scale);

        // 尖刺
        if (scale > 1.1) {
            ctx.fillStyle = '#f57f17';
            for (let i = 0; i < 16; i++) {
                const a = (i * Math.PI * 2) / 16;
                const r1 = 20;
                const r2 = 28;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a - 0.1) * r1, Math.sin(a - 0.1) * r1);
                ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
                ctx.lineTo(Math.cos(a + 0.1) * r1, Math.sin(a + 0.1) * r1);
                ctx.fill();
            }
        }

        // 尾巴
        ctx.fillStyle = '#fbc02d';
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(-26, -8 + wiggle);
        ctx.lineTo(-26, 8 + wiggle);
        ctx.closePath();
        ctx.fill();

        // 腹部球体
        const grad = ctx.createRadialGradient(-3, -4, 4, 0, 0, 20);
        grad.addColorStop(0, '#fff9c4');
        grad.addColorStop(0.5, '#fbc02d');
        grad.addColorStop(1, '#f57f17');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // 斑点
        ctx.fillStyle = '#bf360c';
        ctx.beginPath();
        ctx.arc(-6, -8, 2.5, 0, Math.PI * 2);
        ctx.arc(2, -10, 2.5, 0, Math.PI * 2);
        ctx.arc(-8, 6, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // 大大呆萌的眼睛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(10, -6, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(11.5, -6, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 发光水母
    drawJellyfish(ctx) {
        const pulse = Math.sin(this.phase * 1.5) * 4;

        // 触须
        ctx.strokeStyle = 'rgba(230, 100, 255, 0.6)';
        ctx.lineWidth = 1.8;
        for (let i = -3; i <= 3; i++) {
            const tx = i * 4.5;
            ctx.beginPath();
            ctx.moveTo(tx - 10, 0);
            const sway = Math.sin(this.phase + i) * 8;
            ctx.quadraticCurveTo(tx - 25, 6 + sway, tx - 42, sway * 1.5);
            ctx.stroke();
        }

        // 半透明伞盖
        const grad = ctx.createRadialGradient(0, 0, 3, 0, 0, 22 + pulse);
        grad.addColorStop(0, 'rgba(255, 230, 255, 0.9)');
        grad.addColorStop(0.5, 'rgba(216, 27, 96, 0.65)');
        grad.addColorStop(1, 'rgba(156, 39, 176, 0.25)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 22 + pulse, -Math.PI * 0.5, Math.PI * 0.5, false);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // 6. 千年海龟
    drawTurtle(ctx, finWiggle) {
        // 四肢鳍足
        ctx.fillStyle = '#558b2f';
        // 前鳍 (大)
        ctx.save();
        ctx.translate(14, -16);
        ctx.rotate(-0.4 + finWiggle);
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(14, 16);
        ctx.rotate(0.4 - finWiggle);
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 头部
        ctx.fillStyle = '#689f38';
        ctx.beginPath();
        ctx.ellipse(28, 0, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // 龟眼
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(31, -3, 1.8, 0, Math.PI * 2);
        ctx.arc(31, 3, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // 坚硬龟壳
        const shellGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 25);
        shellGrad.addColorStop(0, '#8d6e63');
        shellGrad.addColorStop(0.7, '#4e342e');
        shellGrad.addColorStop(1, '#33211d');
        ctx.fillStyle = shellGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 19, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d7ccc8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 龟壳六角纹理
        ctx.strokeStyle = 'rgba(255, 235, 59, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-8, -6, 16, 12);
    }

    // 7. 尖嘴剑鱼
    drawSwordfish(ctx, wiggle) {
        // 长长尖吻 (利剑)
        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.lineTo(68, 0);
        ctx.stroke();

        // 大尾鳍
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.moveTo(-35, 0);
        ctx.lineTo(-52, -22 + wiggle);
        ctx.lineTo(-44, wiggle);
        ctx.lineTo(-52, 22 + wiggle);
        ctx.closePath();
        ctx.fill();

        // 背鳍 (像一面帆)
        ctx.fillStyle = '#1e88e5';
        ctx.beginPath();
        ctx.moveTo(-8, -12);
        ctx.lineTo(10, -26);
        ctx.lineTo(18, -10);
        ctx.closePath();
        ctx.fill();

        // 流线型身体
        const grad = ctx.createLinearGradient(0, -14, 0, 14);
        grad.addColorStop(0, '#0d47a1');
        grad.addColorStop(0.4, '#1976d2');
        grad.addColorStop(1, '#e0e0e0');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(5, 0, 40, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(26, -4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(28, -4, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // 8. 魔鬼蝠鲼 (Manta Ray)
    drawMantaRay(ctx, finWiggle) {
        const wingScale = 1 + finWiggle * 0.25;

        // 细长尾巴 (鞭状)
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.quadraticCurveTo(-45, 5, -65, 0);
        ctx.stroke();

        // 菱形飞翼身体
        ctx.save();
        ctx.scale(1, wingScale);
        const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, 45);
        grad.addColorStop(0, '#37474f');
        grad.addColorStop(0.7, '#212121');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(35, 0); // 嘴部
        ctx.lineTo(8, -38); // 左翼尖
        ctx.lineTo(-24, 0); // 尾部根
        ctx.lineTo(8, 38);  // 右翼尖
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 腹部浅色花纹与鳃裂
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(4, 0, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // 9. 黄金锤头鲨
    drawHammerhead(ctx, wiggle) {
        // 尾鳍
        ctx.fillStyle = '#c5a059';
        ctx.beginPath();
        ctx.moveTo(-45, 0);
        ctx.lineTo(-65, -28 + wiggle);
        ctx.lineTo(-55, wiggle);
        ctx.lineTo(-65, 18 + wiggle);
        ctx.closePath();
        ctx.fill();

        // 巨大背鳍
        ctx.beginPath();
        ctx.moveTo(-10, -16);
        ctx.lineTo(8, -36);
        ctx.lineTo(18, -14);
        ctx.closePath();
        ctx.fill();

        // 黄金锤形头部 (横向宽阔突起)
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(36, -26, 16, 52, 6);
        } else {
            ctx.rect(36, -26, 16, 52);
        }
        ctx.fill();

        // 鲨鱼身体
        const grad = ctx.createLinearGradient(0, -20, 0, 20);
        grad.addColorStop(0, '#d4af37');
        grad.addColorStop(0.5, '#f3e5ab');
        grad.addColorStop(1, '#aa8c2c');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 48, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头部两侧的冷峻眼神
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(42, -22, 2.8, 0, Math.PI * 2);
        ctx.arc(42, 22, 2.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // 10. 霸王大白鲨
    drawShark(ctx, wiggle) {
        // 强劲月牙尾鳍
        ctx.fillStyle = '#455a64';
        ctx.beginPath();
        ctx.moveTo(-55, 0);
        ctx.lineTo(-80, -38 + wiggle);
        ctx.lineTo(-68, wiggle);
        ctx.lineTo(-78, 28 + wiggle);
        ctx.closePath();
        ctx.fill();

        // 标志性锋利大背鳍
        ctx.beginPath();
        ctx.moveTo(-15, -20);
        ctx.lineTo(10, -48);
        ctx.lineTo(24, -18);
        ctx.closePath();
        ctx.fill();

        // 凶猛胸鳍
        ctx.beginPath();
        ctx.moveTo(12, 16);
        ctx.lineTo(2, 38);
        ctx.lineTo(24, 20);
        ctx.closePath();
        ctx.fill();

        // 霸气灰白双色身体
        const grad = ctx.createLinearGradient(0, -22, 0, 22);
        grad.addColorStop(0, '#263238');
        grad.addColorStop(0.48, '#546e7a');
        grad.addColorStop(0.52, '#eceff1');
        grad.addColorStop(1, '#cfd8dc');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(5, 0, 60, 23, 0, 0, Math.PI * 2);
        ctx.fill();

        // 鳃裂 (5条暗色缝隙)
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(12 - i * 5, -8);
            ctx.lineTo(10 - i * 5, 8);
            ctx.stroke();
        }

        // 露出尖锐锯齿的血盆大口
        ctx.fillStyle = '#b71c1c';
        ctx.beginPath();
        ctx.moveTo(42, 5);
        ctx.lineTo(58, 8);
        ctx.lineTo(46, 12);
        ctx.closePath();
        ctx.fill();

        // 白森森利齿
        ctx.fillStyle = '#ffffff';
        for (let t = 44; t < 56; t += 3) {
            ctx.beginPath();
            ctx.moveTo(t, 6);
            ctx.lineTo(t + 1.5, 9);
            ctx.lineTo(t + 3, 6);
            ctx.fill();
        }

        // 漆黑冷酷猎手之眼
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(46, -6, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(47.2, -7.2, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // 11. 远古金龙 (BOSS) - 龙头
    drawDragonHead(ctx) {
        // 龙头金冠与金光环
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;

        // 龙角 (鹿角形态)
        ctx.fillStyle = '#ff6f00';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(-15, -45);
        ctx.lineTo(-8, -48);
        ctx.lineTo(12, -22);
        ctx.closePath();
        ctx.fill();

        // 龙嘴与额头
        const headGrad = ctx.createRadialGradient(10, 0, 5, 0, 0, 35);
        headGrad.addColorStop(0, '#fff59d');
        headGrad.addColorStop(0.5, '#ffd700');
        headGrad.addColorStop(1, '#ff8f00');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(12, 0, 32, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // 飘逸金须
        const whiskerSway = Math.sin(this.phase * 2) * 12;
        ctx.strokeStyle = '#ffe082';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(35, -4);
        ctx.quadraticCurveTo(65, -18 + whiskerSway, 85, -6 + whiskerSway);
        ctx.moveTo(35, 4);
        ctx.quadraticCurveTo(65, 18 - whiskerSway, 85, 6 - whiskerSway);
        ctx.stroke();

        // 威严龙眼 (红金双瞳)
        ctx.fillStyle = '#d50000';
        ctx.beginPath();
        ctx.arc(16, -7, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd600';
        ctx.beginPath();
        ctx.arc(17.5, -7, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0; // 重置
    }

    // 金龙长躯与龙爪
    renderGoldenDragonSegments(ctx) {
        if (!this.segments) return;
        const now = this.phase;

        for (let i = this.segments.length - 1; i >= 1; i--) {
            const seg = this.segments[i];
            const size = 26 - i * 0.9;
            ctx.save();
            ctx.translate(seg.x, seg.y);
            ctx.rotate(seg.angle);

            // 龙躯金鳞光晕
            ctx.shadowColor = '#ffc107';
            ctx.shadowBlur = 8;

            const segGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, size);
            segGrad.addColorStop(0, '#fff9c4');
            segGrad.addColorStop(0.5, '#fbc02d');
            segGrad.addColorStop(1, '#f57f17');
            ctx.fillStyle = segGrad;

            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();

            // 龙背鬃毛火焰
            if (i % 2 === 0) {
                const maneHeight = 12 + Math.sin(now + i) * 6;
                ctx.fillStyle = '#e65100';
                ctx.beginPath();
                ctx.moveTo(-6, -size * 0.8);
                ctx.lineTo(0, -size * 0.8 - maneHeight);
                ctx.lineTo(6, -size * 0.8);
                ctx.closePath();
                ctx.fill();
            }

            // 尾部龙尾鳍
            if (i === this.segments.length - 1) {
                ctx.fillStyle = '#ff6f00';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(30, -22);
                ctx.lineTo(20, 0);
                ctx.lineTo(30, 22);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // 12. 烈焰炸弹鱼
    drawBombFish(ctx, wiggle) {
        // 炸药引信火花
        const spark = Math.random() < 0.5;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(8, -26);
        ctx.stroke();

        ctx.fillStyle = spark ? '#ffff00' : '#ff0000';
        ctx.beginPath();
        ctx.arc(8, -26, 4, 0, Math.PI * 2);
        ctx.fill();

        // 黑色球形水雷身体
        const bombGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 20);
        bombGrad.addColorStop(0, '#e53935');
        bombGrad.addColorStop(0.7, '#b71c1c');
        bombGrad.addColorStop(1, '#212121');
        ctx.fillStyle = bombGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // 骷髅或火药图案
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 2);
    }

    // 13. 寒冰海星
    drawFreezeFish(ctx) {
        // 冰晶光晕
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;

        const points = 5;
        const outer = 24;
        const inner = 11;

        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outer : inner;
            const a = (i * Math.PI) / points;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // 白色冰芒雪花
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄️', 0, 1);
        ctx.shadowBlur = 0;
    }

    // 14. 闪电电鳗
    drawLightningEel(ctx, wiggle) {
        // 蛇形游动
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.quadraticCurveTo(0, wiggle * 1.5, -35, -wiggle * 1.5);
        ctx.stroke();

        // 高压闪电发光核心
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#76ff03';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // 头部电击发光眼睛
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(32, -3, 3, 0, Math.PI * 2);
        ctx.arc(32, 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ================= 对象池 (Object Pooling) 内存与性能管理 =================
class FishPool {
    constructor() {
        this.pool = [];
    }

    get(type, spawnWidth, spawnHeight, customCurve = null) {
        if (this.pool.length > 0) {
            const fish = this.pool.pop();
            fish.reset(type, spawnWidth, spawnHeight, customCurve);
            return fish;
        }
        return new Fish(type, spawnWidth, spawnHeight, customCurve);
    }

    release(fish) {
        if (this.pool.length < 250) {
            this.pool.push(fish);
        }
    }
}

window.fishPool = new FishPool();
window.FISH_CONFIGS = FISH_CONFIGS;
window.Fish = Fish;
