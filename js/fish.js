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
        icon: '🐉',
        isBoss: true,
        score: 500,
        speed: 1.5,
        baseHp: 650,
        width: 520,
        height: 140,
        desc: '神话中的东方神龙，吞吐祥瑞金光，击败可触发巨额全屏爆金币！'
    },
    kraken: {
        name: '深海巨妖·克拉肯 (BOSS)',
        icon: '🐙',
        isBoss: true,
        score: 550,
        speed: 1.3,
        baseHp: 750,
        width: 460,
        height: 220,
        desc: '盘踞深渊的远古章鱼巨兽，无数触手狂卷狂舞，击败爆发海量金币！'
    },
    mecha_shark: {
        name: '机械泰坦·终结巨鲨 (BOSS)',
        icon: '🦈',
        isBoss: true,
        score: 600,
        speed: 1.7,
        baseHp: 800,
        width: 490,
        height: 180,
        desc: '重装赛博核能钢鲨，装甲加身等离子推进，击破触发全屏超级狂欢！'
    },
    phantom_dragon: {
        name: '幽冥骨龙·九幽魔煞 (BOSS)',
        icon: '💀',
        isBoss: true,
        score: 650,
        speed: 1.5,
        baseHp: 720,
        width: 530,
        height: 150,
        desc: '不死白骨魔龙，通体缠绕幽蓝冥火，击破释放漫天金币暴雨！'
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
        asset: 'bossDragon',
        w: 1000, h: 1000, regX: 500, regY: 500, scale: 0.16,
        special: 'dragon',
        theme: 'gold'
    },
    phantom_dragon: {
        asset: 'bossPhantom',
        w: 1000, h: 1000, regX: 500, regY: 500, scale: 0.16,
        special: 'dragon',
        theme: 'phantom'
    },
    kraken: {
        asset: 'bossKraken',
        w: 1260, h: 620, regX: 630, regY: 310, scale: 0.22,
        special: 'kraken'
    },
    mecha_shark: {
        asset: 'bossMechaShark',
        w: 1240, h: 590, regX: 620, regY: 295, scale: 0.22,
        special: 'mecha_shark'
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

        // BOSS 底层特效 (如机械巨鲨尾部等离子火箭喷焰、深海巨妖魔瘴暗雾)
        this.bossBackGfx = new PIXI.Graphics();
        this.view.addChild(this.bossBackGfx);

        this.sprite = new PIXI.Sprite();
        this.sprite.anchor.set(0.5, 0.5);
        this.view.addChild(this.sprite);

        // BOSS 顶层特效 (如机械巨鲨红外激光战术扫描视锥、深海巨妖摄魂金瞳神芒)
        this.bossForeGfx = new PIXI.Graphics();
        this.view.addChild(this.bossForeGfx);

        this.specialGfx = new PIXI.Graphics();
        this.view.addChild(this.specialGfx);

        // 神龙 3D 骨肉系统专属容器 (多图层分级：尾羽 -> 24节龙躯鳞甲 -> 4爪 -> 灵气 -> 龙首 -> 龙珠)
        this.dragonContainer = new PIXI.Container();
        this.dragonContainer.visible = false;
        this.view.addChild(this.dragonContainer);

        // 1. 龙尾精灵 (底层尾鳍)
        this.dragonTailSprite = new PIXI.Sprite();
        this.dragonTailSprite.anchor.set(0.82, 0.5);
        this.dragonContainer.addChild(this.dragonTailSprite);

        // 2. 4 只飞腾龙爪 (位于身体下方，使肩胛关节自然隐藏于龙躯后)
        this.dragonClawSprites = [];
        for (let i = 0; i < 4; i++) {
            const clawSpr = new PIXI.Sprite();
            clawSpr.anchor.set(0.15, 0.25);
            this.dragonContainer.addChild(clawSpr);
            this.dragonClawSprites.push(clawSpr);
        }

        // 3. 龙躯 24 节 3D 鳞甲关节池 (自下而上覆盖龙爪根部)
        this.dragonBodySprites = [];
        for (let i = 0; i < 24; i++) {
            const segSpr = new PIXI.Sprite();
            segSpr.anchor.set(0.5, 0.5);
            this.dragonContainer.addChild(segSpr);
            this.dragonBodySprites.push(segSpr);
        }

        this.dragonGfx = new PIXI.Graphics();
        this.dragonContainer.addChild(this.dragonGfx);

        this.dragonHeadSprite = new PIXI.Sprite();
        this.dragonHeadSprite.anchor.set(0.28, 0.5);
        this.dragonHeadSprite.visible = false;
        this.dragonContainer.addChild(this.dragonHeadSprite);

        this.dragonPearlSprite = new PIXI.Sprite();
        this.dragonPearlSprite.anchor.set(0.5, 0.5);
        this.dragonPearlSprite.visible = false;
        this.dragonContainer.addChild(this.dragonPearlSprite);
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
        const isBoss = !!this.config.isBoss;
        // BOSS 平缓巡航 35~45 秒，保证玩家充分享受 BOSS 战
        this.tSpeed = isBoss ? (0.00035 * this.config.speed) : (0.00085 * this.config.speed);

        this.isDead = false;
        this.isDying = false;
        this.deathProgress = 0;
        this.hitFlash = 0;
        this.pufferScale = 1;

        if (customCurve) {
            this.curve = customCurve;
        } else {
            this.generateRandomCurve(spawnWidth, spawnHeight);
        }

        this.updatePosition();

        if (this.type === 'golden_dragon' || this.type === 'phantom_dragon') {
            if (!this.segments) {
                this.segments = [];
                for (let i = 0; i < 24; i++) {
                    this.segments.push({
                        x: this.x - Math.cos(this.angle) * (i * 20),
                        y: this.y - Math.sin(this.angle) * (i * 20),
                        angle: this.angle
                    });
                }
            } else {
                for (let i = 0; i < this.segments.length; i++) {
                    this.segments[i].x = this.x - Math.cos(this.angle) * (i * 20);
                    this.segments[i].y = this.y - Math.sin(this.angle) * (i * 20);
                    this.segments[i].angle = this.angle;
                }
            }
        } else {
            this.segments = null;
        }

        // 挂载到 PixiJS fish 图层
        if (this.view) {
            if (window.pixiLayers && window.pixiLayers.fish && this.view.parent !== window.pixiLayers.fish) {
                window.pixiLayers.fish.addChild(this.view);
            }
            this.view.visible = true;
            this.view.alpha = 1;
            if (this.sprite) {
                this.sprite.visible = !isBoss;
                this.sprite.tint = 0xffffff;
            }
            if (this.dragonGfx) {
                this.dragonGfx.visible = isBoss;
                this.dragonGfx.clear();
            }
            if (this.bossBackGfx) {
                this.bossBackGfx.clear();
            }
            if (this.bossForeGfx) {
                this.bossForeGfx.clear();
            }
            if (this.specialGfx) {
                this.specialGfx.clear();
            }
            if (this.dragonHeadSprite) {
                this.dragonHeadSprite.visible = false;
            }
        }
    }

    generateRandomCurve(sw, sh) {
        const isBoss = !!(this.config && this.config.isBoss);
        const fromLeft = Math.random() < 0.5;
        const offset = isBoss ? 60 : 180;
        const p0 = {
            x: fromLeft ? -offset : sw + offset,
            y: 80 + Math.random() * (sh - 220)
        };
        const p3 = {
            x: fromLeft ? sw + offset : -offset,
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

        if ((this.type === 'golden_dragon' || this.type === 'phantom_dragon') && this.segments) {
            this.segments[0].x = this.x;
            this.segments[0].y = this.y;
            this.segments[0].angle = this.angle;

            const segDist = 20;
            for (let i = 1; i < this.segments.length; i++) {
                const prev = this.segments[i - 1];
                const curr = this.segments[i];
                const dx = prev.x - curr.x;
                const dy = prev.y - curr.y;
                curr.angle = Math.atan2(dy, dx);
                curr.x = prev.x - Math.cos(curr.angle) * segDist;
                curr.y = prev.y - Math.sin(curr.angle) * segDist;
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

        // 四大史诗级 BOSS 专属动态水下粒子流
        if (this.config.isBoss && !this.isDying && this.swimTick % 3 === 0 && window.particleSystem) {
            if (this.type === 'golden_dragon' && this.segments) {
                const tailIdx = Math.min(this.segments.length - 1, 16);
                window.particleSystem.addHitSparks(this.segments[tailIdx].x, this.segments[tailIdx].y, 0xffd700);
            } else if (this.type === 'phantom_dragon' && this.segments) {
                const tailIdx = Math.min(this.segments.length - 1, 16);
                window.particleSystem.addHitSparks(this.segments[tailIdx].x, this.segments[tailIdx].y, 0x00e5ff);
            } else if (this.type === 'kraken') {
                window.particleSystem.addBubble(this.x, this.y, 8);
                window.particleSystem.addHitSparks(this.x, this.y, 0xaa00ff);
            } else if (this.type === 'mecha_shark') {
                const tailX = this.x - Math.cos(this.angle) * 130;
                const tailY = this.y - Math.sin(this.angle) * 130;
                window.particleSystem.addHitSparks(tailX, tailY, 0x00e5ff);
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

        // 四大史诗级 BOSS WebGL 专属程序化渲染
        if (this.config.isBoss) {
            if (this.def.special === 'dragon') {
                this.renderPixiDragon(this.def.theme || 'gold');
            } else if (this.def.special === 'kraken') {
                this.renderPixiKraken();
            } else if (this.def.special === 'mecha_shark') {
                this.renderPixiMechaShark();
            }
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

    // PixiJS WebGL 史诗级神龙 3D 骨肉动力学渲染 (支持远古五爪金龙与九幽魔煞幽冥骨龙)
    renderPixiDragon(theme = 'gold') {
        if (!this.segments || !this.view) return;
        const isPhantom = theme === 'phantom';
        const isFlashing = this.hitFlash > 0;
        const bTex = window.pixiTextures && window.pixiTextures.bosses;
        if (!bTex) return;

        if (this.sprite) this.sprite.visible = false;
        if (this.dragonContainer) this.dragonContainer.visible = true;
        if (this.bossBackGfx) this.bossBackGfx.clear();
        if (this.bossForeGfx) this.bossForeGfx.clear();

        const textures = isPhantom ? {
            head: bTex.phantom,
            body: bTex.phantomBody,
            claw: bTex.phantomClaw,
            tail: bTex.phantomTail,
            pearl: bTex.phantomPearl
        } : {
            head: bTex.dragon,
            body: bTex.dragonBody,
            claw: bTex.dragonClaw,
            tail: bTex.dragonTail,
            pearl: bTex.dragonPearl
        };

        const segCount = this.segments.length;
        const pts = [];
        for (let i = 0; i < segCount; i++) {
            const s = this.segments[i];
            pts.push({
                x: s.x - this.x,
                y: s.y - this.y,
                angle: s.angle
            });
        }

        const tint = isFlashing ? 0xff2244 : 0xffffff;
        const alpha = this.isDying ? Math.max(0, 1 - this.deathProgress * 0.8) : 1;

        // 1. 飘逸 3D 凤羽龙尾 / 幽冥骨刃尾鳍 (Attached to segments[segCount - 1])
        if (this.dragonTailSprite && textures.tail) {
            const tailPt = pts[segCount - 1];
            const tailPre = pts[segCount - 2] || tailPt;
            const tAngle = Math.atan2(tailPt.y - tailPre.y, tailPt.x - tailPre.x);
            const tailWave = Math.sin(this.swimTick * 0.22) * 0.18;

            this.dragonTailSprite.visible = true;
            this.dragonTailSprite.texture = textures.tail;
            this.dragonTailSprite.x = tailPt.x;
            this.dragonTailSprite.y = tailPt.y;
            this.dragonTailSprite.rotation = tAngle + tailWave;
            this.dragonTailSprite.scale.set(0.92, 0.92);
            this.dragonTailSprite.tint = tint;
            this.dragonTailSprite.alpha = alpha;
        }

        // 2. 真实 3D 龙躯鳞甲关节 (24 节 3D 鳞甲骨肉，由尾至首分层叠盖)
        if (this.dragonBodySprites && textures.body) {
            for (let i = segCount - 1; i >= 1; i--) {
                const spr = this.dragonBodySprites[i];
                if (!spr) continue;
                const p = pts[i];
                const prog = i / segCount;
                const baseScale = (1.05 * (1 - prog * 0.52));
                const breath = 1 + Math.sin(this.swimTick * 0.18 - i * 0.35) * 0.04;
                const s = baseScale * breath;

                spr.visible = true;
                spr.texture = textures.body;
                spr.x = p.x;
                spr.y = p.y;
                spr.rotation = p.angle;
                spr.scale.set(s, s);
                spr.tint = tint;
                spr.alpha = alpha;
            }
        }

        // 3. 真实 3D 霸气五爪龙足 (前肢在 segment 4, 后肢在 segment 14，左右划水动效)
        if (this.dragonClawSprites && textures.claw) {
            const limbConfigs = [
                { idx: 4, side: -1, clawIndex: 0 },
                { idx: 4, side: 1, clawIndex: 1 },
                { idx: 14, side: -1, clawIndex: 2 },
                { idx: 14, side: 1, clawIndex: 3 }
            ];

            for (const cfg of limbConfigs) {
                const spr = this.dragonClawSprites[cfg.clawIndex];
                if (!spr || cfg.idx >= segCount) continue;
                const p = pts[cfg.idx];
                const nx = -Math.sin(p.angle);
                const ny = Math.cos(p.angle);
                const stroke = Math.sin(this.swimTick * 0.18 + cfg.idx * 0.6 + cfg.side * 1.5) * 0.32;

                const prog = cfg.idx / segCount;
                const clawScale = (0.72 * (1 - prog * 0.42));
                const lateralDist = 34 * (1 - prog * 0.3);

                spr.visible = true;
                spr.texture = textures.claw;
                spr.x = p.x + nx * (cfg.side * lateralDist);
                spr.y = p.y + ny * (cfg.side * lateralDist);
                spr.rotation = p.angle + (cfg.side < 0 ? -0.45 : 0.45) + stroke;
                spr.scale.set(clawScale, cfg.side < 0 ? -clawScale : clawScale);
                spr.tint = tint;
                spr.alpha = alpha;
            }
        }

        // 4. WebGL 加速神圣光辉与灵气粒子 (Dragon Divine Aura in dragonGfx)
        const gfx = this.dragonGfx;
        if (gfx) {
            gfx.clear();
            gfx.alpha = alpha;
            const auraColor = isFlashing ? 0xffffff : (isPhantom ? 0x00e5ff : 0xffd54f);
            gfx.lineStyle(8, auraColor, 0.28);
            gfx.moveTo(pts[1].x, pts[1].y);
            for (let i = 2; i < segCount; i++) {
                gfx.lineTo(pts[i].x, pts[i].y);
            }
        }

        // 5. 霸气龙首贴图 (Head Sprite at segment 0)
        if (this.dragonHeadSprite && textures.head) {
            const headPt = pts[0];
            this.dragonHeadSprite.visible = true;
            this.dragonHeadSprite.texture = textures.head;
            this.dragonHeadSprite.x = headPt.x;
            this.dragonHeadSprite.y = headPt.y;
            this.dragonHeadSprite.rotation = headPt.angle;

            const targetHeadW = 210;
            const headScale = targetHeadW / (textures.head.width || 800);
            const headPulse = 1 + Math.sin(this.swimTick * 0.15) * 0.03;
            this.dragonHeadSprite.scale.set(headScale * headPulse, headScale * headPulse);
            this.dragonHeadSprite.tint = tint;
            this.dragonHeadSprite.alpha = alpha;
        }

        // 6. 真实 3D 炽盛神龙宝珠 (Celestial Pearl / Nether Core ahead of head)
        if (this.dragonPearlSprite && textures.pearl) {
            const headPt = pts[0];
            const pearlDist = 138;
            const pearlBob = Math.sin(this.swimTick * 0.14) * 16;
            const pearlX = headPt.x + Math.cos(headPt.angle) * pearlDist - Math.sin(headPt.angle) * pearlBob;
            const pearlY = headPt.y + Math.sin(headPt.angle) * pearlDist + Math.cos(headPt.angle) * pearlBob;

            this.dragonPearlSprite.visible = true;
            this.dragonPearlSprite.texture = textures.pearl;
            this.dragonPearlSprite.x = pearlX;
            this.dragonPearlSprite.y = pearlY;
            this.dragonPearlSprite.rotation = this.swimTick * 0.05;

            const pulse = 1 + Math.sin(this.swimTick * 0.2) * 0.06;
            this.dragonPearlSprite.scale.set(0.75 * pulse, 0.75 * pulse);
            this.dragonPearlSprite.tint = tint;
            this.dragonPearlSprite.alpha = alpha;
        }
    }

    // PixiJS WebGL 深海巨妖克拉肯专属渲染 (八荒狂触 + 摄魂巨眼 + 远古深渊头冠)
    renderPixiKraken() {
        if (!this.view) return;
        if (this.dragonContainer) this.dragonContainer.visible = false;
        if (this.dragonHeadSprite) this.dragonHeadSprite.visible = false;

        const backGfx = this.bossBackGfx;
        const foreGfx = this.bossForeGfx;
        if (backGfx) backGfx.clear();
        if (foreGfx) foreGfx.clear();

        const isFlashing = this.hitFlash > 0;
        const facingLeft = Math.cos(this.angle) < 0;
        const alpha = this.isDying ? Math.max(0, 1 - this.deathProgress * 0.8) : 1;

        // 设置精灵贴图
        if (this.sprite && window.pixiTextures && window.pixiTextures.bosses && window.pixiTextures.bosses.kraken) {
            this.sprite.visible = true;
            this.sprite.texture = window.pixiTextures.bosses.kraken;

            // 原始图片呈现宽度 460px 巨型深渊章鱼
            const targetWidth = 460;
            const baseScale = targetWidth / (this.sprite.texture.width || 1260);

            // 头足类专属喷射式呼吸韵律：头冠收缩扩张 + 触手延展
            const pulse = Math.sin(this.swimTick * 0.11);
            const scaleX = baseScale * (1 + pulse * 0.05);
            const scaleY = (facingLeft ? -baseScale : baseScale) * (1 - pulse * 0.04);

            this.sprite.scale.set(scaleX, scaleY);
            this.sprite.tint = isFlashing ? 0xff2244 : 0xffffff;
            this.sprite.alpha = alpha;
        }

        this.view.rotation = this.angle;

        if (backGfx) {
            backGfx.alpha = alpha;
            // 1. 深渊魔瘴与暗影墨雾光环 (Abyssal Ink Aura) - 位于底层
            const inkPulse = (Math.sin(this.swimTick * 0.09) + 1) * 0.5;
            backGfx.beginFill(0x1a0033, 0.35 + inkPulse * 0.15);
            backGfx.drawEllipse(30, 0, 160 + inkPulse * 20, 110 + inkPulse * 15);
            backGfx.endFill();

            // 2. 远古深渊发光符文阵波动 (Pulsing Bioluminescent Rune Corona)
            backGfx.lineStyle(2.5, 0xe040fb, 0.45 + inkPulse * 0.45);
            backGfx.drawEllipse(45, 0, 95 + inkPulse * 12, 65 + inkPulse * 8);

            backGfx.lineStyle(2, 0x00e5ff, 0.6 + inkPulse * 0.35);
            backGfx.drawEllipse(55, 0, 60, 42);
        }

        if (foreGfx) {
            foreGfx.alpha = alpha;
            const inkPulse = (Math.sin(this.swimTick * 0.09) + 1) * 0.5;
            // 3. 巨妖摄魂金瞳高能神芒 (Predator Eye Flare) - 位于顶层
            const eyeX = 42;
            const eyeY = facingLeft ? 45 : -45;
            foreGfx.beginFill(0xffd700, 0.5 + inkPulse * 0.4);
            foreGfx.drawCircle(eyeX, eyeY, 14 + inkPulse * 6);
            foreGfx.endFill();
            foreGfx.beginFill(0xffffff, 0.95);
            foreGfx.drawCircle(eyeX, eyeY, 4.5);
            foreGfx.endFill();
        }
    }

    // PixiJS WebGL 机械泰坦终结巨鲨渲染 (重装赛博装甲 + 背部电磁轨道炮 + 核反应堆 + 等离子火箭推进)
    renderPixiMechaShark() {
        if (!this.view) return;
        if (this.dragonContainer) this.dragonContainer.visible = false;
        if (this.dragonHeadSprite) this.dragonHeadSprite.visible = false;

        const backGfx = this.bossBackGfx;
        const foreGfx = this.bossForeGfx;
        if (backGfx) backGfx.clear();
        if (foreGfx) foreGfx.clear();

        const isFlashing = this.hitFlash > 0;
        const facingLeft = Math.cos(this.angle) < 0;
        const alpha = this.isDying ? Math.max(0, 1 - this.deathProgress * 0.8) : 1;

        // 设置精灵贴图
        if (this.sprite && window.pixiTextures && window.pixiTextures.bosses && window.pixiTextures.bosses.mechaShark) {
            this.sprite.visible = true;
            this.sprite.texture = window.pixiTextures.bosses.mechaShark;

            // 原始图片呈现长 490px 霸气巨鲨
            const targetWidth = 490;
            const baseScale = targetWidth / (this.sprite.texture.width || 1240);

            // 掠食者游动微幅呼吸与背鳍波浪摆动
            const swimPulse = 1 + Math.sin(this.swimTick * 0.14) * 0.025;
            const scaleX = baseScale * swimPulse;
            const scaleY = (facingLeft ? -baseScale : baseScale) * (2 - swimPulse);

            this.sprite.scale.set(scaleX, scaleY);
            this.sprite.tint = isFlashing ? 0xff2244 : 0xffffff;
            this.sprite.alpha = alpha;
        }

        // 巨鲨旋转朝向与微幅体态倾斜 (Predatory Banking)
        const bankAngle = Math.sin(this.swimTick * 0.12) * 0.04;
        this.view.rotation = this.angle + (facingLeft ? -bankAngle : bankAngle);

        if (backGfx) {
            backGfx.alpha = alpha;
            // 1. 等离子火箭尾焰动态渲染 (Cyan / Blue Ion Thruster Exhaust) - 位于底层
            const exhaustPulse = (Math.sin(this.swimTick * 0.35) + 1) * 0.5;
            const flameLen = 65 + exhaustPulse * 45;
            const flameThick = 18 + exhaustPulse * 6;
            const tailX = -190;
            const tailY = 0;

            // 外层等离子光晕
            backGfx.beginFill(0x00e5ff, 0.45);
            backGfx.drawPolygon([
                tailX, tailY - flameThick * 1.5,
                tailX - flameLen * 1.25, tailY,
                tailX, tailY + flameThick * 1.5
            ]);
            backGfx.endFill();

            // 核心高亮青蓝喷焰
            backGfx.beginFill(0x2979ff, 0.85);
            backGfx.drawPolygon([
                tailX, tailY - flameThick,
                tailX - flameLen, tailY,
                tailX, tailY + flameThick
            ]);
            backGfx.endFill();

            // 马赫环炽白核心 (Shock Diamond)
            backGfx.beginFill(0xffffff, 0.95);
            backGfx.drawPolygon([
                tailX, tailY - 6,
                tailX - flameLen * 0.45, tailY,
                tailX, tailY + 6
            ]);
            backGfx.endFill();
        }

        if (foreGfx) {
            foreGfx.alpha = alpha;
            // 2. 掠食者全息红外扫描视锥 (Crimson Laser Visor Sweeping Cone) - 位于顶层
            const scanAngle = Math.sin(this.swimTick * 0.08) * 0.22;
            const scanDist = 180;
            const eyeX = 175;
            const eyeY = facingLeft ? 14 : -14;

            foreGfx.lineStyle(1.8, 0xff1744, 0.85);
            foreGfx.moveTo(eyeX, eyeY);
            foreGfx.lineTo(eyeX + Math.cos(scanAngle - 0.25) * scanDist, eyeY + Math.sin(scanAngle - 0.25) * scanDist);
            foreGfx.moveTo(eyeX, eyeY);
            foreGfx.lineTo(eyeX + Math.cos(scanAngle + 0.25) * scanDist, eyeY + Math.sin(scanAngle + 0.25) * scanDist);

            // 扫描视锥半透明填充
            foreGfx.beginFill(0xff1744, 0.12 + Math.abs(scanAngle) * 0.08);
            foreGfx.drawPolygon([
                eyeX, eyeY,
                eyeX + Math.cos(scanAngle - 0.25) * scanDist, eyeY + Math.sin(scanAngle - 0.25) * scanDist,
                eyeX + Math.cos(scanAngle + 0.25) * scanDist, eyeY + Math.sin(scanAngle + 0.25) * scanDist
            ]);
            foreGfx.endFill();

            // 3. 聚变反应堆与能量槽微弱呼吸光环
            const auraPulse = (Math.sin(this.swimTick * 0.2) + 1) * 0.5;
            foreGfx.lineStyle(2, 0x00e5ff, 0.35 + auraPulse * 0.4);
            foreGfx.drawCircle(-25, 0, 32 + auraPulse * 8);
        }
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
        if (this.config && this.config.isBoss) {
            if (this.segments) {
                if (Math.hypot(this.x - x, this.y - y) < (55 + radius)) return true;
                for (let i = 0; i < this.segments.length; i += 2) {
                    const seg = this.segments[i];
                    if (Math.hypot(seg.x - x, seg.y - y) < (38 + radius)) return true;
                }
                return false;
            }
            return Math.hypot(this.x - x, this.y - y) < (this.width * 0.45 + radius);
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
