/**
 * 捕鱼达人 - UI 交互控制器与视图表现系统
 */

class UIManager {
    constructor() {
        this.coinEl = document.getElementById('coin-count');
        this.coinPillEl = document.getElementById('coin-pill');
        this.diamondEl = document.getElementById('diamond-count');
        this.cannonNameEl = document.getElementById('cannon-name');
        this.cannonCostEl = document.getElementById('cannon-cost');
        this.laserFillEl = document.getElementById('laser-fill');
        this.bossBannerEl = document.getElementById('boss-banner');
        this.bossHpContainerEl = document.getElementById('boss-hp-container');
        this.bossHpFillEl = document.getElementById('boss-hp-fill');
        this.bossHpTextEl = document.getElementById('boss-hp-text');
        this.frenzyWipeBannerEl = document.getElementById('frenzy-wipe-banner');
        this.frenzyWipeTitleEl = document.getElementById('frenzy-wipe-title');
        this.frenzyTimer = null;
        this.bigWinOverlayEl = document.getElementById('big-win-overlay');
        this.bigWinCoinsEl = document.getElementById('big-win-coins');
        this.comboContainerEl = document.getElementById('combo-container');
        this.comboCountEl = document.getElementById('combo-count');
        this.comboTitleEl = document.getElementById('combo-title');
        this.comboTimer = null;

        // 模态弹窗
        this.almanacModal = document.getElementById('almanac-modal');
        this.rescueModal = document.getElementById('rescue-modal');
        this.settingsModal = document.getElementById('settings-modal');

        this.displayedCoins = 0;
        this.targetCoins = 1000;
        this.displayedDiamonds = 50;

        // 点击遮罩背景关闭弹窗
        [this.almanacModal, this.settingsModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('open');
                    }
                });
            }
        });

        this.initAlmanacCards();
    }

    updateCoins(amount, instant = false) {
        this.targetCoins = amount;
        if (instant) {
            this.displayedCoins = amount;
            if (this.coinEl) this.coinEl.innerText = this.displayedCoins.toLocaleString();
        }
    }

    updateDiamonds(amount) {
        this.displayedDiamonds = amount;
        if (this.diamondEl) this.diamondEl.innerText = this.displayedDiamonds.toLocaleString();
    }

    updateCannon(config) {
        if (this.cannonNameEl) {
            const levelLabel = config.level >= 10 ? 'Lv.MAX' : `Lv.${config.level}`;
            this.cannonNameEl.innerText = `${levelLabel} ${config.name}`;
        }
        if (this.cannonCostEl) {
            this.cannonCostEl.innerHTML = `<span class="cannon-cost-god">♾️ 无限火力 (0 消耗)</span>`;
        }
    }

    // 屏幕居中大号狂热清屏播报 (COMBO >= 10 时震撼呈现)
    showFrenzyWipe(count) {
        if (!this.frenzyWipeBannerEl || !this.frenzyWipeTitleEl) return;
        this.frenzyWipeTitleEl.innerText = `COMBO x${count}! 狂热清屏!`;
        this.frenzyWipeBannerEl.classList.remove('show');
        void this.frenzyWipeBannerEl.offsetWidth;
        this.frenzyWipeBannerEl.classList.add('show');

        clearTimeout(this.frenzyTimer);
        this.frenzyTimer = setTimeout(() => {
            if (this.frenzyWipeBannerEl) {
                this.frenzyWipeBannerEl.classList.remove('show');
            }
        }, 1800);
    }

    updateLaser(progress) {
        if (this.laserFillEl) {
            this.laserFillEl.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
    }

    // 逐帧数字平滑滚动滚动效果
    step() {
        if (this.displayedCoins !== this.targetCoins) {
            const diff = this.targetCoins - this.displayedCoins;
            const step = Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) * 0.15));
            this.displayedCoins += step;
            if (this.coinEl) {
                this.coinEl.innerText = this.displayedCoins.toLocaleString();
            }
        }
    }

    // 金币飞入 UI 栏受击弹性缩放震颤反馈
    triggerCoinBounce() {
        if (!this.coinPillEl) return;
        this.coinPillEl.classList.remove('bounce-hit');
        void this.coinPillEl.offsetWidth; // 触发回流重绘
        this.coinPillEl.classList.add('bounce-hit');
    }

    // 屏幕上方连击数 (Combo) 炫酷展示
    showCombo(count) {
        if (count < 2) return;
        if (!this.comboContainerEl || !this.comboCountEl || !this.comboTitleEl) return;

        this.comboCountEl.innerText = `COMBO x${count}`;

        const titles = [
            { min: 15, text: '🔥 灭世超神 UNSTOPPABLE! 🔥' },
            { min: 10, text: '💥 疯狂大满贯 MEGA WIN! 💥' },
            { min: 6, text: '✨ 连战连捷 GREAT! ✨' },
            { min: 2, text: '⚡ 精彩连击 NICE! ⚡' }
        ];
        const matched = titles.find(t => count >= t.min);
        this.comboTitleEl.innerText = matched ? matched.text : '连击捕获!';

        this.comboContainerEl.classList.remove('show');
        void this.comboContainerEl.offsetWidth;
        this.comboContainerEl.classList.add('show');

        clearTimeout(this.comboTimer);
        this.comboTimer = setTimeout(() => {
            if (this.comboContainerEl) {
                this.comboContainerEl.classList.remove('show');
            }
        }, 2200);
    }

    showBossBanner(name = '远古金龙') {
        if (!this.bossBannerEl) return;
        this.bossBannerEl.classList.add('show');
        if (window.soundManager) {
            window.soundManager.playBossAlert();
        }
        setTimeout(() => {
            this.bossBannerEl.classList.remove('show');
        }, 4500);
        this.showBossHp(120);
    }

    showBossHp(maxHp = 120) {
        if (!this.bossHpContainerEl) return;
        this.bossHpContainerEl.classList.add('show');
        this.updateBossHp(maxHp, maxHp);
    }

    updateBossHp(hp, maxHp = 120) {
        if (!this.bossHpFillEl || !this.bossHpTextEl) return;
        const pct = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));
        this.bossHpFillEl.style.width = `${pct}%`;
        this.bossHpTextEl.innerText = `${pct}% (${Math.max(0, hp)}/${maxHp})`;
        if (pct <= 0) {
            setTimeout(() => this.hideBossHp(), 1000);
        }
    }

    hideBossHp() {
        if (this.bossHpContainerEl) {
            this.bossHpContainerEl.classList.remove('show');
        }
    }

    showBigWin(score) {
        if (!this.bigWinOverlayEl || !this.bigWinCoinsEl) return;
        this.bigWinCoinsEl.innerText = `+${score.toLocaleString()} 金币`;
        this.bigWinOverlayEl.classList.add('show');
        setTimeout(() => {
            this.bigWinOverlayEl.classList.remove('show');
        }, 2200);
    }

    showRescueModal() {
        if (this.rescueModal) {
            this.rescueModal.classList.add('open');
        }
    }

    closeRescueModal() {
        if (this.rescueModal) {
            this.rescueModal.classList.remove('open');
        }
    }

    openAlmanac() {
        if (this.almanacModal) {
            this.almanacModal.classList.add('open');
            this.renderAlmanacFishPreviews();
        }
    }

    closeAlmanac() {
        if (this.almanacModal) {
            this.almanacModal.classList.remove('open');
        }
    }

    openSettings() {
        if (this.settingsModal) {
            this.settingsModal.classList.add('open');
        }
    }

    closeSettings() {
        if (this.settingsModal) {
            this.settingsModal.classList.remove('open');
        }
    }

    initAlmanacCards() {
        const grid = document.getElementById('almanac-grid');
        if (!grid || !window.FISH_CONFIGS) return;

        grid.innerHTML = '';
        for (const [key, cfg] of Object.entries(window.FISH_CONFIGS)) {
            const card = document.createElement('div');
            card.className = 'almanac-card';

            const canvas = document.createElement('canvas');
            canvas.width = 180;
            canvas.height = 100;
            canvas.id = `almanac-canvas-${key}`;

            const name = document.createElement('div');
            name.className = 'almanac-fish-name';
            name.innerText = cfg.name;

            const score = document.createElement('div');
            score.className = 'almanac-fish-score';
            score.innerText = `倍率: ${cfg.score} 倍`;

            const desc = document.createElement('div');
            desc.className = 'almanac-fish-desc';
            desc.innerText = cfg.desc;

            card.appendChild(canvas);
            card.appendChild(name);
            card.appendChild(score);
            card.appendChild(desc);
            grid.appendChild(card);
        }
    }

    renderAlmanacFishPreviews() {
        if (!window.FISH_CONFIGS) return;
        for (const [key, cfg] of Object.entries(window.FISH_CONFIGS)) {
            const canvas = document.getElementById(`almanac-canvas-${key}`);
            if (!canvas) continue;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 构造虚拟鱼进行静态渲染
            const dummy = new window.Fish(key, canvas.width, canvas.height);
            if (dummy.view) dummy.view.visible = false;
            dummy.x = canvas.width / 2;
            dummy.y = canvas.height / 2;
            dummy.angle = 0;

            dummy.renderStatic2D(ctx);
        }
    }
}

window.uiManager = new UIManager();
