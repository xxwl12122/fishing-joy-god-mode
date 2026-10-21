/**
 * 捕鱼达人 - 官方街机正版高清美术资源管理器
 * 统一预加载并管理所有鱼类精灵、炮台、炮弹、渔网、旋转金币与底盘贴图
 */

(function(window) {
    'use strict';

    const ASSET_PATHS = {
        // 鱼类精灵图 (Sprite Sheets: 含游动帧与受击捕获挣扎帧)
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

        // 炮台精灵图 (1~7 级经典重金属炮台，每套含 5 帧强劲后坐力动作)
        cannon1: 'images/cannon1.png',
        cannon2: 'images/cannon2.png',
        cannon3: 'images/cannon3.png',
        cannon4: 'images/cannon4.png',
        cannon5: 'images/cannon5.png',
        cannon6: 'images/cannon6.png',
        cannon7: 'images/cannon7.png',

        // 炮台底座机台与配件
        bottom: 'images/bottom.png',

        // 真实高阶子弹贴图
        bullet: 'images/bullet.png',
        bullet1: 'images/bullet1.png',
        bullet2: 'images/bullet2.png',
        bullet3: 'images/bullet3.png',
        bullet4: 'images/bullet4.png',
        bullet5: 'images/bullet5.png',
        bullet6: 'images/bullet6.png',
        bullet7: 'images/bullet7.png',
        bullet8: 'images/bullet8.png',

        // 经典街机渔网
        web: 'images/web.png',

        // 3D 旋转金币与银币 (10 帧立体旋转)
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
    }

    window.gameAssets = new AssetManager();
})(window);
