/**
 * 捕鱼达人 - 官方街机美术与 WebGL PixiJS 纹理管理器
 * 统一管理 DOM 预加载与 PixiJS GPU 硬件加速纹理切割
 */

(function(window) {
    'use strict';

    const ASSET_PATHS = {
        fish1: 'images/fish1.png',
        fish2: 'images/fish2.png',
        fish3: 'images/fish3.png',
        fish4: 'images/fish4.png',
        fish5: 'images/fish5.png',
        fish6: 'images/fish6.png',
        fish7: 'images/fish7.png',
        fish8: 'images/fish8.png',
        fish9: 'images/fish9.png',
        fish10: 'images/fish10.png',
        shark1: 'images/shark1.png',
        shark2: 'images/shark2.png',

        cannon1: 'images/cannon1.png',
        cannon2: 'images/cannon2.png',
        cannon3: 'images/cannon3.png',
        cannon4: 'images/cannon4.png',
        cannon5: 'images/cannon5.png',
        cannon6: 'images/cannon6.png',
        cannon7: 'images/cannon7.png',

        bottom: 'images/bottom.png',

        bullet: 'images/bullet.png',
        bullet1: 'images/bullet1.png',
        bullet2: 'images/bullet2.png',
        bullet3: 'images/bullet3.png',
        bullet4: 'images/bullet4.png',
        bullet5: 'images/bullet5.png',
        bullet6: 'images/bullet6.png',
        bullet7: 'images/bullet7.png',
        bullet8: 'images/bullet8.png',

        web: 'images/web.png',

        coinAni1: 'images/coinAni1.png',
        coinAni2: 'images/coinAni2.png'
    };

    class AssetManager {
        constructor() {
            this.images = {};
            this.loadedCount = 0;
            this.totalCount = Object.keys(ASSET_PATHS).length;
            this.isAllLoaded = false;
            this.callbacks = [];

            this.preloadAll();
        }

        preloadAll() {
            for (const [key, path] of Object.entries(ASSET_PATHS)) {
                const img = new Image();
                img.onload = () => {
                    this.loadedCount++;
                    if (this.loadedCount >= this.totalCount) {
                        this.isAllLoaded = true;
                        this.triggerCallbacks();
                    }
                };
                img.onerror = () => {
                    console.warn(`[AssetManager] 贴图加载失败: ${path}`);
                    this.loadedCount++;
                    if (this.loadedCount >= this.totalCount) {
                        this.isAllLoaded = true;
                        this.triggerCallbacks();
                    }
                };
                img.src = path;
                this.images[key] = img;
            }
        }

        get(key) {
            const img = this.images[key];
            if (img && img.complete && img.naturalWidth > 0) {
                return img;
            }
            return null;
        }

        onReady(cb) {
            if (this.isAllLoaded) {
                cb();
            } else {
                this.callbacks.push(cb);
            }
        }

        triggerCallbacks() {
            for (const cb of this.callbacks) {
                try { cb(); } catch (e) { console.error(e); }
            }
            this.callbacks = [];
        }

        // 初始化 PixiJS WebGL GPU 贴图缓存
        initPixiTextures() {
            if (typeof PIXI === 'undefined') return;

            window.pixiTextures = {
                fish: {},
                cannons: {},
                bullets: {},
                coins: { gold: [], silver: [] },
                web: null,
                bottom: null
            };

            // 1. 鱼类纹理切片
            const FISH_DEFS = window.FISH_SPRITE_DEFS || {};
            for (const [type, def] of Object.entries(FISH_DEFS)) {
                if (def.special === 'dragon') continue;
                const img = this.get(def.asset);
                if (!img) continue;

                const base = PIXI.BaseTexture.from(img);
                const swim = [];
                for (let i = 0; i < def.swimFrames; i++) {
                    swim.push(new PIXI.Texture(base, new PIXI.Rectangle(0, i * def.h, def.w, def.h)));
                }
                const capture = [];
                for (let i = 0; i < def.capFrames; i++) {
                    capture.push(new PIXI.Texture(base, new PIXI.Rectangle(0, (def.swimFrames + i) * def.h, def.w, def.h)));
                }

                window.pixiTextures.fish[type] = {
                    swim,
                    capture,
                    def
                };
            }

            // 2. 炮台纹理 (每套 5 帧真实机械后座切片)
            const CANNON_DATA = window.CANNON_SPRITE_DATA || [];
            for (let idx = 1; idx <= 7; idx++) {
                const data = CANNON_DATA[idx];
                if (!data) continue;
                const img = this.get(data.key);
                if (!img) continue;

                const base = PIXI.BaseTexture.from(img);
                const frames = [];
                for (let f = 0; f < 5; f++) {
                    frames.push(new PIXI.Texture(base, new PIXI.Rectangle(0, f * data.h, data.w, data.h)));
                }
                window.pixiTextures.cannons[idx] = { frames, data };
            }

            // 3. 炮台底座平台
            const bottomImg = this.get('bottom');
            if (bottomImg) {
                const base = PIXI.BaseTexture.from(bottomImg);
                window.pixiTextures.bottom = new PIXI.Texture(base, new PIXI.Rectangle(0, 0, 765, 72));
            }

            // 4. 子弹纹理
            for (let i = 1; i <= 8; i++) {
                const bImg = this.get(`bullet${i}`);
                if (bImg) {
                    window.pixiTextures.bullets[i] = PIXI.Texture.from(bImg);
                }
            }

            // 5. 3D 旋转金币与银币纹理 (各 10 帧切片)
            const coin1Img = this.get('coinAni1');
            if (coin1Img) {
                const base = PIXI.BaseTexture.from(coin1Img);
                for (let f = 0; f < 10; f++) {
                    window.pixiTextures.coins.gold.push(new PIXI.Texture(base, new PIXI.Rectangle(0, f * 60, 60, 60)));
                }
            }
            const coin2Img = this.get('coinAni2');
            if (coin2Img) {
                const base = PIXI.BaseTexture.from(coin2Img);
                for (let f = 0; f < 10; f++) {
                    window.pixiTextures.coins.silver.push(new PIXI.Texture(base, new PIXI.Rectangle(0, f * 60, 60, 60)));
                }
            }

            // 6. 渔网纹理
            const webImg = this.get('web');
            if (webImg) {
                window.pixiTextures.web = PIXI.Texture.from(webImg);
            }
        }
    }

    window.gameAssets = new AssetManager();
})(window);
