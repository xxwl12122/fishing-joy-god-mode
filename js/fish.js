/**
 * 捕鱼达人 - PixiJS (WebGL) 硬件加速鱼类渲染系统与生态逻辑
 * 搭载全部 12 款正版鱼类 GPU 批量合批精灵 (Sprite / WebGL)，
 * 保留原有平滑三次贝塞尔游动动力学与碰撞检测，性能满帧 60FPS
 */

const FISH_CONFIGS = {
    yellow_fish: {
        name: '小黄鱼',
        score: 2,
        speed: 2.85,
        baseHp: 1,
        width: 48,
        height: 32,
        desc: '群居小型鱼类，数量众多，极易捕获。'
    },
    clown_fish: {
        name: '小丑鱼',
        score: 3,
        speed: 2.7,
        baseHp: 2,
        width: 58,
        height: 44,
        desc: '活泼好动的热带鱼，身披橙白相间的警戒条纹。'
    },
    blue_tang: {
        name: '蓝唐王鱼',
        score: 4,
        speed: 3.2,
        baseHp: 3,
        width: 62,
        height: 48,
        desc: '游速轻快，湛蓝的体色配以亮黄色尾鳍。'
    },
    puffer_fish: {
        name: '刺豚',
        score: 7,
        speed: 2.3,
        baseHp: 5,
        width: 66,
        height: 52,
        desc: '受到攻击时会瞬间膨胀鼓起尖刺。'
    },
    jellyfish: {
        name: '条纹神仙鱼',
        score: 10,
        speed: 1.85,
        baseHp: 7,
        width: 78,
        height: 86,
        desc: '体态优雅的深海神仙鱼，游动如梦幻舞蹈。'
    },
    turtle: {
        name: '千年海龟',
        score: 15,
        speed: 1.7,
        baseHp: 10,
        width: 82,
        height: 98,
        desc: '长寿的厚甲海龟，四肢优雅划水。'
    },
    swordfish: {
        name: '尖嘴剑鱼',
        score: 25,
        speed: 4.3,
        baseHp: 16,
        width: 120,
        height: 70,
        desc: '海中速度之王，尖利的长吻如利剑般穿梭。'
    },
    manta_ray: {
        name: '魔鬼蝠鲼',
        score: 35,
        speed: 2.1,
        baseHp: 22,
        width: 135,
        height: 110,
        desc: '巨大如飞翼的胸鳍在深海中优雅翱翔。'
    },
    hammerhead: {
        name: '银白狂鲨',
        score: 60,
        speed: 2.5,
        baseHp: 35,
        width: 175,
        height: 95,
        desc: '极具杀伤力的深海顶级巨鲨，浑身散发银白杀气。'
    },
    shark: {
        name: '霸王黄金大白鲨',
        score: 100,
        speed: 2.4,
        baseHp: 55,
        width: 210,
        height: 115,
        desc: '令人胆寒的黄金巨型掠食者，巨额金币悬赏！'
    },
    golden_dragon: {
        name: '远古金龙 (BOSS)',
        score: 500,
        speed: 1.6,
        baseHp: 650,
        width: 520,
        height: 140,
        desc: '神话中的东方神龙，吞吐祥瑞金光，击败可触发巨额全屏爆金币！'
    },
    bomb_fish: {
        name: '烈焰炸弹鱼',
        score: 50,
        speed: 2.3,
        baseHp: 20,
        width: 88,
        height: 72,
        desc: '背负高能水雷，捕获后引爆全屏消灭周围鱼群！'
    },
    freeze_fish: {
        name: '寒冰海星',
        score: 40,
        speed: 2.0,
        baseHp: 15,
        width: 74,
        height: 68,
        desc: '散发极寒冰晶的稀有海星，捕获后绽放极寒冰环并奖励 2000 巨额金币！'
    },
    lightning_eel: {
        name: '电光鳗',
        score: 45,
        speed: 3.0,
        baseHp: 18,
        width: 90,
        height: 48,
        desc: '通体充盈高压电荷，捕获后释放闪电链连环电击！'
    }
};

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
    constructor(type, spawnWidth, spawnHeight, customCurve = null, startT = 0) {
        this.initPixiDisplay();
        this.reset(type, spawnWidth, spawnHeight, customCurve, startT);
    }

    // 初始化 PixiJS WebGL 显示对象
    initPixiDisplay() {
        if (typeof PIXI === 'undefined') return;
        this.view = new PIXI.Container();

        this.sprite = new PIXI.Sprite();
        this.sprite.anchor.set(0.5, 0.5);
        this.view.addChild(this.sprite);

        this.specialGfx = new PIXI.Graphics();
        this.view.addChild(this.specialGfx);

        this.dragonGfx = new PIXI.Graphics();
        this.view.addChild(this.dragonGfx);
    }

    // 对象池复用重置接口
    reset(type, spawnWidth, spawnHeight, customCurve = null, startT = 0) {
        this.type = type;
        this.config = FISH_CONFIGS[type] || FISH_CONFIGS.yellow_fish;
        this.def = FISH_SPRITE_DEFS[type] || FISH_SPRITE_DEFS.yellow_fish;
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
        this.swimTick = Math.floor(Math.random() * 60);
        this.swimSpeed = 0.11 + Math.random() * 0.05;
        this.t = startT || 0;
        this.tSpeed = 0.00085 * this.config.speed;

        this.isDead = false;
        this.isDying = false;
        this.deathProgress = 0;
        this.hitFlash = 0;
        this.pufferScale = 1;

        if (this.type === 'golden_dragon') {
            if (!this.segments) {
                this.segments = [];
                for (let i = 0; i < 22; i++) {
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

        // 挂载到 PixiJS fish 图层
        if (this.view) {
            if (window.pixiLayers && window.pixiLayers.fish && this.view.parent !== window.pixiLayers.fish) {
                window.pixiLayers.fish.addChild(this.view);
            }
            this.view.visible = true;
            this.view.alpha = 1;
            if (this.sprite) {
                this.sprite.visible = this.def.special !== 'dragon';
                this.sprite.tint = 0xffffff;
            }
            if (this.dragonGfx) {
                this.dragonGfx.visible = this.def.special === 'dragon';
                this.dragonGfx.clear();
            }
            if (this.specialGfx) {
                this.specialGfx.clear();
            }
        }

        this.updatePosition();
    }

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

        if (this.type === 'golden_dragon' && this.segments) {
            this.segments[0].x = this.x;
            this.segments[0].y = this.y;
            this.segments[0].angle = this.angle;

            const segDist = 25;
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

        if (this.isDying) {
            this.deathProgress += 0.038;
            this.swimTick += 2;
            if (this.deathProgress >= 1) {
                this.isDead = true;
                if (this.view) this.view.visible = false;
            } else {
                this.syncPixiTransform();
            }
            return;
        }

        if (isFrozen) {
            this.syncPixiTransform();
            return;
        }

        this.swimTick++;
        this.phase += this.swimSpeed;
        this.t += this.tSpeed;

        if (this.hitFlash > 0) this.hitFlash--;
        if (this.pufferScale > 1) {
            this.pufferScale = Math.max(1, this.pufferScale - 0.04);
        }

        // 远古金龙游动时释放祥瑞金色拖尾粒子
        if (this.type === 'golden_dragon' && this.segments && this.swimTick % 3 === 0) {
            if (window.particleSystem) {
                const tailIdx = Math.min(this.segments.length - 1, 16);
                window.particleSystem.addHitSparks(this.segments[tailIdx].x, this.segments[tailIdx].y, 0xffd700);
                if (this.swimTick % 6 === 0) {
                    window.particleSystem.addHitSparks(this.segments[6].x, this.segments[6].y, 0xffea00);
                }
            }
        }

        if (this.t >= 1) {
            this.isDead = true;
            if (this.view) this.view.visible = false;
            return;
        }

        this.updatePosition();
        this.syncPixiTransform();
    }

    // 将物理位置与动作实时同步到 PixiJS WebGL 容器
    syncPixiTransform() {
        if (!this.view) return;

        this.view.x = this.x;
        this.view.y = this.y;

        if (this.def.special === 'dragon') {
            this.renderPixiDragon();
            return;
        }

        const facingLeft = Math.cos(this.angle) < 0;
        let rot = this.angle;
        if (this.def.baseAngle) rot += this.def.baseAngle;
        this.view.rotation = rot;

        // 翻转与缩放
        const scaleX = this.def.scale * this.pufferScale;
        const scaleY = (facingLeft ? -this.def.scale : this.def.scale) * this.pufferScale;

        // 受击变色与濒死渐隐
        if (this.hitFlash > 0) {
            this.sprite.tint = 0xff2244;
        } else if (this.isDying) {
            this.sprite.tint = 0xffd700;
            this.view.alpha = Math.max(0, 1 - this.deathProgress * 0.8);
            this.sprite.scale.set(scaleX * (1 - this.deathProgress * 0.3), scaleY * (1 - this.deathProgress * 0.3));
        } else {
            this.sprite.tint = 0xffffff;
            this.view.alpha = 1;
            this.sprite.scale.set(scaleX, scaleY);
        }

        // WebGL 贴图帧切换
        const texData = window.pixiTextures && window.pixiTextures.fish ? window.pixiTextures.fish[this.type] : null;
        if (texData) {
            if (this.isDying && texData.capture && texData.capture.length > 0) {
                const capIdx = Math.floor((this.deathProgress * 12) % texData.capture.length);
                this.sprite.texture = texData.capture[capIdx];
            } else if (texData.swim && texData.swim.length > 0) {
                const swimIdx = Math.floor(this.swimTick / 6) % texData.swim.length;
                this.sprite.texture = texData.swim[swimIdx];
            }
        }

        // 特异功能鱼 WebGL 光环渲染
        if (this.def.special && this.specialGfx) {
            this.renderPixiSpecialAura(this.def.special);
        }
    }

    renderPixiSpecialAura(specialType) {
        const gfx = this.specialGfx;
        gfx.clear();

        if (specialType === 'bomb') {
            const pulse = (Math.sin(this.swimTick * 0.15) + 1) * 0.5;
            gfx.lineStyle(3, 0xff3d00, 0.85);
            gfx.drawCircle(0, 0, 36 + pulse * 6);
        } else if (specialType === 'freeze') {
            const rot = this.swimTick * 0.03;
            gfx.rotation = rot;
            gfx.lineStyle(2.5, 0x00e5ff, 0.9);
            gfx.drawCircle(0, 0, 32);
        } else if (specialType === 'lightning') {
            const arcTime = this.swimTick * 0.2;
            gfx.lineStyle(2.5, 0x76ff03, 0.9);
            gfx.arc(0, 0, 30, arcTime, arcTime + Math.PI * 0.7);
        }
    }

    // PixiJS WebGL 远古金龙东方神龙分节多动力学渲染
    renderPixiDragon() {
        if (!this.segments || !this.dragonGfx) return;
        const gfx = this.dragonGfx;
        gfx.clear();

        const isFlashing = this.hitFlash > 0;
        const mainColor = isFlashing ? 0xffffff : 0xffd700;
        const darkColor = isFlashing ? 0xffea00 : 0xff8f00;
        const spineColor = isFlashing ? 0xffffff : 0xff1744;

        // 1. 龙身多关节与鳞片渲染 (从龙尾到龙颈)
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const size = 35 - i * 0.95;
            const relX = seg.x - this.x;
            const relY = seg.y - this.y;

            // 龙背祥瑞火焰鳍
            const spineAng = seg.angle + Math.PI / 2;
            const spineLen = size * 1.5;
            gfx.beginFill(spineColor, 0.85);
            gfx.drawPolygon([
                relX - Math.cos(seg.angle) * (size * 0.5), relY - Math.sin(seg.angle) * (size * 0.5),
                relX + Math.cos(spineAng) * spineLen, relY + Math.sin(spineAng) * spineLen,
                relX + Math.cos(seg.angle) * (size * 0.5), relY + Math.sin(seg.angle) * (size * 0.5)
            ]);
            gfx.endFill();

            // 龙爪 (分布于第 5、12 节)
            if (i === 5 || i === 12) {
                const clawAng1 = seg.angle + Math.PI * 0.6;
                const clawAng2 = seg.angle - Math.PI * 0.6;
                const cLen = size * 1.8;
                gfx.lineStyle(4, darkColor, 0.9);
                gfx.moveTo(relX, relY);
                gfx.lineTo(relX + Math.cos(clawAng1) * cLen, relY + Math.sin(clawAng1) * cLen);
                gfx.moveTo(relX, relY);
                gfx.lineTo(relX + Math.cos(clawAng2) * cLen, relY + Math.sin(clawAng2) * cLen);
            }

            // 龙身外层祥云金环
            gfx.beginFill(darkColor, 0.9);
            gfx.drawCircle(relX, relY, size * 0.95);
            gfx.endFill();

            // 龙身主体黄金球
            gfx.beginFill(mainColor, 0.98);
            gfx.drawCircle(relX, relY, size * 0.68);
            gfx.endFill();

            // 龙鳞高光
            gfx.beginFill(0xffffff, 0.85);
            gfx.drawCircle(relX - size * 0.2, relY - size * 0.2, size * 0.25);
            gfx.endFill();
        }

        // 2. 龙头装配 (严格沿 this.angle 旋转)
        const cosA = Math.cos(this.angle);
        const sinA = Math.sin(this.angle);
        const rot = (px, py) => ({
            x: px * cosA - py * sinA,
            y: px * sinA + py * cosA
        });

        // 龙角 (鹿角分叉造型)
        gfx.lineStyle(4.5, isFlashing ? 0xffffff : 0xffea00, 1);
        const h1 = rot(-10, -22), h2 = rot(-36, -52), h3 = rot(-24, -68), h4 = rot(-46, -60);
        gfx.moveTo(h1.x, h1.y); gfx.lineTo(h2.x, h2.y); gfx.lineTo(h3.x, h3.y);
        gfx.moveTo(h2.x, h2.y); gfx.lineTo(h4.x, h4.y);

        const h1b = rot(-10, 22), h2b = rot(-36, 52), h3b = rot(-24, 68), h4b = rot(-46, 60);
        gfx.moveTo(h1b.x, h1b.y); gfx.lineTo(h2b.x, h2b.y); gfx.lineTo(h3b.x, h3b.y);
        gfx.moveTo(h2b.x, h2b.y); gfx.lineTo(h4b.x, h4b.y);

        // 头部主轮廓
        const headPoints = [
            rot(45, 0),
            rot(30, -22),
            rot(-5, -28),
            rot(-32, -18),
            rot(-32, 18),
            rot(-5, 28),
            rot(30, 22)
        ];
        gfx.beginFill(mainColor, 1);
        gfx.drawPolygon(headPoints.flatMap(p => [p.x, p.y]));
        gfx.endFill();

        // 龙吻与下颌
        const snout = rot(28, 0);
        gfx.beginFill(darkColor, 1);
        gfx.drawCircle(snout.x, snout.y, 14);
        gfx.endFill();

        // 威严赤红龙眼
        const eye1 = rot(10, -15);
        const eye2 = rot(10, 15);
        gfx.beginFill(0xff1744, 1);
        gfx.drawCircle(eye1.x, eye1.y, 6.5);
        gfx.drawCircle(eye2.x, eye2.y, 6.5);
        gfx.endFill();
        gfx.beginFill(0xffffff, 1);
        gfx.drawCircle(eye1.x + cosA * 2, eye1.y + sinA * 2, 2.2);
        gfx.drawCircle(eye2.x + cosA * 2, eye2.y + sinA * 2, 2.2);
        gfx.endFill();

        // 飘逸灵动龙须 (随游动水流柔美起伏)
        const whiskerWave1 = Math.sin(this.swimTick * 0.12) * 14;
        const whiskerWave2 = Math.cos(this.swimTick * 0.12) * 14;
        gfx.lineStyle(2.5, 0xffea00, 0.95);
        const wBase1 = rot(38, -8);
        const wMid1 = rot(70, -24 + whiskerWave1);
        const wTip1 = rot(110, -32 + whiskerWave2);
        gfx.moveTo(wBase1.x, wBase1.y);
        gfx.bezierCurveTo(wMid1.x, wMid1.y, wMid1.x, wMid1.y, wTip1.x, wTip1.y);

        const wBase2 = rot(38, 8);
        const wMid2 = rot(70, 24 - whiskerWave1);
        const wTip2 = rot(110, 32 - whiskerWave2);
        gfx.moveTo(wBase2.x, wBase2.y);
        gfx.bezierCurveTo(wMid2.x, wMid2.y, wMid2.x, wMid2.y, wTip2.x, wTip2.y);

        // 祥瑞吞吐龙珠
        const pearlPulse = Math.sin(this.swimTick * 0.14) * 6;
        const pearlPos = rot(72 + pearlPulse, 0);

        gfx.beginFill(0xffea00, 0.45);
        gfx.drawCircle(pearlPos.x, pearlPos.y, 22 + Math.abs(pearlPulse));
        gfx.endFill();

        gfx.beginFill(0xffffff, 1);
        gfx.drawCircle(pearlPos.x, pearlPos.y, 13);
        gfx.endFill();

        gfx.lineStyle(2, 0x00e5ff, 0.9);
        gfx.drawCircle(pearlPos.x, pearlPos.y, 16);
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
        if (this.type === 'golden_dragon' && this.segments) {
            if (Math.hypot(this.x - x, this.y - y) < (50 + radius)) return true;
            for (let i = 0; i < this.segments.length; i += 2) {
                const seg = this.segments[i];
                if (Math.hypot(seg.x - x, seg.y - y) < (36 + radius)) return true;
            }
            return false;
        }
        const dist = Math.hypot(this.x - x, this.y - y);
        return dist < (this.width * 0.48 + radius);
    }

    // 鱼类图鉴 2D 静态渲染兼容接口
    renderStatic2D(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const img = window.gameAssets ? window.gameAssets.get(this.def.asset) : null;
        if (img) {
            ctx.drawImage(img, 0, 0, this.def.w, this.def.h, -this.def.regX * this.def.scale, -this.def.regY * this.def.scale, this.def.w * this.def.scale, this.def.h * this.def.scale);
        } else {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.ellipse(0, 0, 24, 14, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// ================= 对象池 (Fish Pool) =================
class FishPool {
    constructor() {
        this.pool = [];
    }

    get(type, spawnWidth, spawnHeight, customCurve = null, startT = 0) {
        if (this.pool.length > 0) {
            const fish = this.pool.pop();
            fish.reset(type, spawnWidth, spawnHeight, customCurve, startT);
            return fish;
        }
        return new Fish(type, spawnWidth, spawnHeight, customCurve, startT);
    }

    release(fish) {
        if (fish.view) fish.view.visible = false;
        if (this.pool.length < 500) {
            this.pool.push(fish);
        }
    }
}

window.fishPool = new FishPool();
window.FISH_CONFIGS = FISH_CONFIGS;
window.FISH_SPRITE_DEFS = FISH_SPRITE_DEFS;
window.Fish = Fish;
