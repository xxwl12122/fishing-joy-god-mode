/**
 * 捕鱼达人 - 官方街机正版鱼类精灵渲染系统与生态逻辑
 * 搭载全部 10 种经典鱼类 + 银鲨 + 金鲨的官方 Sprite Sheets 真实游动骨骼与濒死挣扎动画，
 * 配合远古金龙 BOSS 黄金神龙分节多动力学骨骼与三大特异功能鱼超凡粒子光效
 */

const FISH_CONFIGS = {
    yellow_fish: {
        name: '小黄鱼',
        score: 2,
        speed: 2.2,
        baseHp: 1,
        width: 48,
        height: 32,
        desc: '群居小型鱼类，数量众多，极易捕获。'
    },
    clown_fish: {
        name: '小丑鱼',
        score: 3,
        speed: 2.0,
        baseHp: 2,
        width: 58,
        height: 44,
        desc: '活泼好动的热带鱼，身披橙白相间的警戒条纹。'
    },
    blue_tang: {
        name: '蓝唐王鱼',
        score: 4,
        speed: 2.4,
        baseHp: 3,
        width: 62,
        height: 48,
        desc: '游速轻快，湛蓝的体色配以亮黄色尾鳍。'
    },
    puffer_fish: {
        name: '刺豚',
        score: 7,
        speed: 1.6,
        baseHp: 5,
        width: 66,
        height: 52,
        desc: '受到攻击时会瞬间膨胀鼓起尖刺。'
    },
    jellyfish: {
        name: '条纹神仙鱼',
        score: 10,
        speed: 1.3,
        baseHp: 7,
        width: 78,
        height: 86,
        desc: '体态优雅的深海神仙鱼，游动如梦幻舞蹈。'
    },
    turtle: {
        name: '千年海龟',
        score: 15,
        speed: 1.1,
        baseHp: 10,
        width: 82,
        height: 98,
        desc: '长寿的厚甲海龟，四肢优雅划水。'
    },
    swordfish: {
        name: '尖嘴剑鱼',
        score: 25,
        speed: 3.1,
        baseHp: 16,
        width: 120,
        height: 70,
        desc: '海中速度之王，尖利的长吻如利剑般穿梭。'
    },
    manta_ray: {
        name: '魔鬼蝠鲼',
        score: 35,
        speed: 1.4,
        baseHp: 22,
        width: 135,
        height: 110,
        desc: '巨大如飞翼的胸鳍在深海中优雅翱翔。'
    },
    hammerhead: {
        name: '银白狂鲨',
        score: 60,
        speed: 1.8,
        baseHp: 35,
        width: 175,
        height: 95,
        desc: '极具杀伤力的深海顶级巨鲨，浑身散发银白杀气。'
    },
    shark: {
        name: '霸王黄金大白鲨',
        score: 100,
        speed: 1.7,
        baseHp: 55,
        width: 210,
        height: 115,
        desc: '令人胆寒的黄金巨型掠食者，巨额金币悬赏！'
    },
    golden_dragon: {
        name: '远古金龙 (BOSS)',
        score: 300,
        speed: 1.4,
        baseHp: 120,
        width: 280,
        height: 90,
        desc: '神话中的东方神龙，吞吐祥瑞金光，击败可触发巨奖！'
    },
    bomb_fish: {
        name: '烈焰炸弹鱼',
        score: 50,
        speed: 1.5,
        baseHp: 20,
        width: 88,
        height: 72,
        desc: '背负高能水雷，捕获后引爆全屏消灭周围鱼群！'
    },
    freeze_fish: {
        name: '寒冰海星',
        score: 40,
        speed: 1.3,
        baseHp: 15,
        width: 74,
        height: 68,
        desc: '散发极寒冰晶，捕获后冻结全屏鱼群 8 秒！'
    },
    lightning_eel: {
        name: '电光鳗',
        score: 45,
        speed: 2.1,
        baseHp: 18,
        width: 90,
        height: 48,
        desc: '通体充盈高压电荷，捕获后释放闪电链连环电击！'
    }
};

// 官方正版精灵图动画元数据
const FISH_SPRITE_DEFS = {
    yellow_fish: {
        asset: 'fish1', w: 55, h: 37, swimFrames: 4, capFrames: 4, scale: 1.15, regX: 28, regY: 18, baseAngle: 0
    },
    clown_fish: {
        asset: 'fish2', w: 78, h: 64, swimFrames: 4, capFrames: 4, scale: 1.05, regX: 40, regY: 32, baseAngle: 0
    },
    blue_tang: {
        asset: 'fish4', w: 77, h: 59, swimFrames: 4, capFrames: 4, scale: 1.1, regX: 40, regY: 29, baseAngle: 0
    },
    puffer_fish: {
        asset: 'fish3', w: 72, h: 56, swimFrames: 4, capFrames: 4, scale: 1.2, regX: 36, regY: 28, baseAngle: 0
    },
    jellyfish: {
        asset: 'fish5', w: 107, h: 122, swimFrames: 4, capFrames: 4, scale: 0.95, regX: 53, regY: 61, baseAngle: 0
    },
    turtle: {
        asset: 'fish7', w: 92, h: 151, swimFrames: 6, capFrames: 4, scale: 1.1, regX: 46, regY: 75, baseAngle: Math.PI / 2
    },
    swordfish: {
        asset: 'fish10', w: 178, h: 187, swimFrames: 6, capFrames: 4, scale: 0.95, regX: 95, regY: 93, baseAngle: 0
    },
    manta_ray: {
        asset: 'fish9', w: 166, h: 183, swimFrames: 8, capFrames: 4, scale: 1.05, regX: 83, regY: 91, baseAngle: 0
    },
    hammerhead: {
        asset: 'shark1', w: 509, h: 270, swimFrames: 8, capFrames: 4, scale: 0.44, regX: 254, regY: 135, baseAngle: 0
    },
    shark: {
        asset: 'shark2', w: 516, h: 273, swimFrames: 8, capFrames: 4, scale: 0.52, regX: 258, regY: 136, baseAngle: 0
    },
    bomb_fish: {
        asset: 'fish8', w: 174, h: 126, swimFrames: 8, capFrames: 4, scale: 0.65, regX: 87, regY: 63, baseAngle: 0, special: 'bomb'
    },
    freeze_fish: {
        asset: 'fish6', w: 105, h: 79, swimFrames: 8, capFrames: 4, scale: 0.95, regX: 52, regY: 39, baseAngle: 0, special: 'freeze'
    },
    lightning_eel: {
        asset: 'fish6', w: 105, h: 79, swimFrames: 8, capFrames: 4, scale: 1.0, regX: 52, regY: 39, baseAngle: 0, special: 'lightning'
    },
    golden_dragon: {
        special: 'dragon'
    }
};

class Fish {
    constructor(type, spawnWidth, spawnHeight, customCurve = null) {
        this.reset(type, spawnWidth, spawnHeight, customCurve);
    }

    // 对象池复用重置接口
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
        this.swimTick = Math.floor(Math.random() * 60); // 游动帧计数器
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
            x: fromLeft ? -180 : sw + 180,
            y: 80 + Math.random() * (sh - 220)
        };
        const p3 = {
            x: fromLeft ? sw + 180 : -180,
            y: 80 + Math.random() * (sh - 220)
        };
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

        // 金龙身体分节跟随动力学
        if (this.type === 'golden_dragon' && this.segments) {
            this.segments[0].x = this.x;
            this.segments[0].y = this.y;
            this.segments[0].angle = this.angle;

            const segDist = 20;
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

        // 死亡濒死动画 (捕获挣扎帧播放 + 金光散逸)
        if (this.isDying) {
            this.deathProgress += 0.038;
            this.swimTick += 2;
            if (this.deathProgress >= 1) {
                this.isDead = true;
            }
            return;
        }

        if (isFrozen) return;

        this.swimTick++;
        this.phase += this.swimSpeed;
        this.t += this.tSpeed;

        if (this.hitFlash > 0) this.hitFlash--;
        if (this.pufferScale > 1) {
            this.pufferScale = Math.max(1, this.pufferScale - 0.04);
        }

        if (this.t >= 1) {
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

    isHit(x, y, radius) {
        if (this.isDead || this.isDying) return false;
        const dist = Math.hypot(this.x - x, this.y - y);
        return dist < (this.width * 0.48 + radius);
    }

    render(ctx) {
        if (this.isDead) return;

        const def = FISH_SPRITE_DEFS[this.type] || FISH_SPRITE_DEFS.yellow_fish;

        // 金龙特殊独立渲染
        if (def.special === 'dragon') {
            this.renderGoldenDragon(ctx);
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // 依据游动方向翻转 (向左游动时反转 Y 轴，保持鱼腹朝下)
        const facingLeft = Math.cos(this.angle) < 0;
        ctx.rotate(this.angle);
        if (facingLeft) {
            ctx.scale(1, -1);
        }

        // 修正特定生物（如海龟）的头部默认初始基准角
        if (def.baseAngle) {
            ctx.rotate(def.baseAngle);
        }

        // 刺豚受击膨胀动力学
        if (this.pufferScale > 1) {
            ctx.scale(this.pufferScale, this.pufferScale);
        }

        // 受击闪白红光滤镜
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(2.2) drop-shadow(0 0 12px #ff1744)';
        }

        // 濒死效果 (渐显金光收缩)
        if (this.isDying) {
            const scale = Math.max(0.1, 1 - this.deathProgress * 0.4);
            ctx.scale(scale, scale);
            ctx.globalAlpha = Math.max(0, 1 - this.deathProgress * 0.8);
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
        }

        // 渲染官方正版 Sprite Sheet 贴图
        const img = window.gameAssets ? window.gameAssets.get(def.asset) : null;
        if (img) {
            let frame = 0;
            if (this.isDying) {
                // 播放濒死捕获挣扎帧 (最后 4 帧)
                const capIdx = Math.floor((this.deathProgress * 12) % def.capFrames);
                frame = def.swimFrames + capIdx;
            } else {
                // 播放平滑游动尾鳍摆动帧
                frame = Math.floor(this.swimTick / 6) % def.swimFrames;
            }

            const sy = frame * def.h;
            const drawW = def.w * def.scale;
            const drawH = def.h * def.scale;
            const drawX = -def.regX * def.scale;
            const drawY = -def.regY * def.scale;

            ctx.drawImage(img, 0, sy, def.w, def.h, drawX, drawY, drawW, drawH);
        } else {
            // 备用极简回退
            this.renderFallbackFish(ctx, def);
        }

        // 渲染特异功能鱼光环 (炸弹、寒冰、电光)
        if (def.special) {
            this.renderSpecialAura(ctx, def.special);
        }

        ctx.restore();
    }

    // 渲染特异功能鱼炫酷光环
    renderSpecialAura(ctx, specialType) {
        if (specialType === 'bomb') {
            // 烈焰炸弹鱼：岩浆红炎波动与预警光环
            const pulse = (Math.sin(this.swimTick * 0.15) + 1) * 0.5;
            ctx.save();
            ctx.strokeStyle = '#ff3d00';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 18 + pulse * 12;
            ctx.beginPath();
            ctx.arc(0, 0, 36 + pulse * 6, 0, Math.PI * 2);
            ctx.stroke();

            // 炸药警告标
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', 0, -32);
            ctx.restore();
        } else if (specialType === 'freeze') {
            // 寒冰海星：极寒六芒冰晶阵
            const rot = this.swimTick * 0.03;
            ctx.save();
            ctx.rotate(rot);
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, 32, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❄️', 0, 0);
            ctx.restore();
        } else if (specialType === 'lightning') {
            // 电光鳗：高压电弧环绕
            ctx.save();
            ctx.strokeStyle = '#76ff03';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#76ff03';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            const arcTime = this.swimTick * 0.2;
            ctx.arc(0, 0, 30, arcTime, arcTime + Math.PI * 0.7);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 30, arcTime + Math.PI, arcTime + Math.PI * 1.7);
            ctx.stroke();
            ctx.restore();
        }
    }

    // 备用极简回退
    renderFallbackFish(ctx, def) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 14, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // 远古金龙 (BOSS) 东方神龙多节动力学渲染
    renderGoldenDragon(ctx) {
        if (!this.segments) return;

        // 1. 渲染龙身各节 (从龙尾到龙颈)
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const size = 30 - i * 1.3;
            const progress = i / this.segments.length;

            ctx.save();
            ctx.translate(seg.x, seg.y);
            ctx.rotate(seg.angle);

            // 龙鳞渐变体色
            const segGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, size);
            segGrad.addColorStop(0, '#fff59d');
            segGrad.addColorStop(0.5, '#ffd700');
            segGrad.addColorStop(0.85, '#ff8f00');
            segGrad.addColorStop(1, '#e65100');

            ctx.fillStyle = segGrad;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;

            // 龙身关节椭圆
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 1.1, size * 0.85, 0, 0, Math.PI * 2);
            ctx.fill();

            // 黄金背鳍
            ctx.fillStyle = '#ff6d00';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.85);
            ctx.lineTo(-size * 0.5, -size * 1.6);
            ctx.lineTo(size * 0.5, -size * 0.85);
            ctx.closePath();
            ctx.fill();

            // 龙尾神圣凤尾鳍
            if (i === this.segments.length - 1) {
                ctx.fillStyle = '#ff3d00';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(40, -30);
                ctx.lineTo(25, 0);
                ctx.lineTo(40, 30);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }

        // 2. 渲染霸气神龙头部与龙角龙须
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(2.2) drop-shadow(0 0 20px #ff1744)';
        }

        // 龙头底色
        const headGrad = ctx.createRadialGradient(5, 0, 5, 0, 0, 38);
        headGrad.addColorStop(0, '#ffffff');
        headGrad.addColorStop(0.4, '#ffd700');
        headGrad.addColorStop(0.8, '#ff9100');
        headGrad.addColorStop(1, '#d50000');
        ctx.fillStyle = headGrad;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 25;

        ctx.beginPath();
        ctx.ellipse(5, 0, 38, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        // 龙角 (鹿角形态)
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-5, -18);
        ctx.lineTo(-24, -42);
        ctx.lineTo(-14, -55);
        ctx.moveTo(-16, -35);
        ctx.lineTo(-30, -45);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-5, 18);
        ctx.lineTo(-24, 42);
        ctx.lineTo(-14, 55);
        ctx.moveTo(-16, 35);
        ctx.lineTo(-30, 45);
        ctx.stroke();

        // 龙眼 (赤红神圣耀斑)
        ctx.fillStyle = '#ff1744';
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(18, -11, 5, 0, Math.PI * 2);
        ctx.arc(18, 11, 5, 0, Math.PI * 2);
        ctx.fill();

        // 龙珠 (龙头前悬浮旋转的神圣龙珠)
        const pearlX = 48;
        const pearlPulse = Math.sin(this.swimTick * 0.1) * 4;
        const pearlGrad = ctx.createRadialGradient(pearlX, 0, 2, pearlX, 0, 16);
        pearlGrad.addColorStop(0, '#ffffff');
        pearlGrad.addColorStop(0.45, '#ffd700');
        pearlGrad.addColorStop(1, '#ff6d00');
        ctx.fillStyle = pearlGrad;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(pearlX + pearlPulse, 0, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ================= 对象池 (Fish Pool) =================
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
