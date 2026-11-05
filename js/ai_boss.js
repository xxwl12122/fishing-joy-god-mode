/**
 * 捕鱼达人 - AI 暴躁深海 BOSS 动态对话与语音朗读系统 (Renderer 进程)
 * 1. 监测玩家击中 BOSS 或分数突变事件，通过 IPC 请求主进程 DeepSeek API
 * 2. 使用浏览器原生 Web SpeechSynthesis API 将吐槽台词以暴躁语调读出
 * 3. 动态渲染美式街机/热血热漫风格的 BOSS 专属头顶咆哮气泡
 */

class AIBossDialogueManager {
    constructor() {
        this.lastTauntTime = 0;
        this.cooldownMs = 4500; // 防刷屏 CD：至少间隔 4.5 秒吐槽一次
        this.isRequesting = false;
        this.bubbleEl = null;
        this.bubbleTimer = null;
        this.lastScoreMilestone = 0;

        // 离线备用金句库 (针对非 Electron 纯网页环境或断网自愈)
        this.localFallbacks = [
            "就这刮痧破炮也想抓本王？！",
            "这点伤害是来给本尊修脚的？",
            "有种往我龙头上打，别挠痒痒！",
            "破炮声吵死龙了，吃我一口龙息！",
            "刮！接着刮！本王龙鳞都不掉一片！",
            "急了急了，打歪了你瞎啊？！",
            "你这网是漏风的吧？笑死本座了！",
            "就凭你这点金币，也想收买大海？",
            "这点火力？给本王当电风扇呢！",
            "你小子今天一条金币也别想拿！"
        ];

        this.initDOM();
    }

    initDOM() {
        let container = document.getElementById('ai-boss-bubble-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ai-boss-bubble-container';
            container.innerHTML = `
                <div id="ai-boss-bubble" class="ai-boss-bubble">
                    <div class="boss-bubble-header">
                        <span class="boss-icon">🐉</span>
                        <span id="boss-bubble-name" class="boss-name">远古金龙 (BOSS)</span>
                        <span class="boss-voice-wave">🔊 咆哮中...</span>
                    </div>
                    <div id="boss-bubble-text" class="boss-bubble-text">“就这挠痒痒的破炮？！”</div>
                </div>
            `;
            document.body.appendChild(container);
            this.bubbleEl = document.getElementById('ai-boss-bubble');
        }
    }

    // 玩家炮弹命中 BOSS
    onBossHit(boss, score) {
        if (!boss) return;
        const now = performance.now();
        if (this.isRequesting || now - this.lastTauntTime < this.cooldownMs) {
            return;
        }

        const hpPercent = Math.max(1, Math.round((boss.hp / (boss.maxHp || 1000)) * 100));
        let eventType = 'hit';
        if (hpPercent <= 30) eventType = 'enrage';

        this.requestAndBroadcastTaunt({
            bossName: boss.name || '深海领主',
            score: score || 0,
            eventType,
            bossHpPercent: hpPercent,
            posX: boss.x,
            posY: boss.y
        });
    }

    // 玩家分数达成特定里程碑 (例如每暴涨 10000 分)
    onScoreMilestone(score, boss) {
        if (!boss) return;
        if (score - this.lastScoreMilestone < 10000) return;
        this.lastScoreMilestone = score;

        const now = performance.now();
        if (this.isRequesting || now - this.lastTauntTime < 3000) return;

        this.requestAndBroadcastTaunt({
            bossName: boss.name || '深海领主',
            score,
            eventType: 'score',
            bossHpPercent: Math.max(1, Math.round((boss.hp / (boss.maxHp || 1000)) * 100)),
            posX: boss.x,
            posY: boss.y
        });
    }

    // 请求台词并播报
    async requestAndBroadcastTaunt({ bossName, score, eventType, bossHpPercent, posX, posY }) {
        this.isRequesting = true;
        this.lastTauntTime = performance.now();

        let tauntText = '';

        try {
            if (window.electronAPI && typeof window.electronAPI.requestBossTaunt === 'function') {
                tauntText = await window.electronAPI.requestBossTaunt({
                    bossName,
                    score,
                    eventType,
                    bossHpPercent
                });
            } else {
                tauntText = this.localFallbacks[Math.floor(Math.random() * this.localFallbacks.length)];
            }
        } catch (err) {
            console.warn('[AI Boss Renderer] Request taunt failed, use local fallback:', err);
            tauntText = this.localFallbacks[Math.floor(Math.random() * this.localFallbacks.length)];
        } finally {
            this.isRequesting = false;
        }

        if (!tauntText) {
            tauntText = this.localFallbacks[0];
        }

        // 1. 展现动感热血气泡
        this.showBubble(bossName, tauntText, posX, posY);

        // 2. 浏览器 SpeechSynthesis 原生语音合成朗读
        this.speakTaunt(tauntText);
    }

    // 浏览器 SpeechSynthesis 语音朗读
    speakTaunt(text) {
        if (!('speechSynthesis' in window)) return;

        try {
            window.speechSynthesis.cancel(); // 停止上一句

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.pitch = 0.82; // 沉稳浑厚、自带威严与粗暴感
            utterance.rate = 1.18;  // 略快语速，凸显暴躁、狂妄、机关枪式怼人
            utterance.volume = 1.0;

            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
                // 优先挑选中文男性或浑厚有力的音色
                const targetVoice = voices.find(v =>
                    v.lang.includes('zh') &&
                    (v.name.includes('Kangkang') || v.name.includes('Male') || v.name.includes('Yunxi') || v.name.includes('Chinese'))
                ) || voices.find(v => v.lang.includes('zh'));

                if (targetVoice) utterance.voice = targetVoice;
            }

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('[AI Boss Speech] Synthesis error:', e);
        }
    }

    // 屏幕/BOSS 气泡动效展示
    showBubble(bossName, text, x = null, y = null) {
        if (!this.bubbleEl) return;

        const nameEl = document.getElementById('boss-bubble-name');
        const textEl = document.getElementById('boss-bubble-text');

        if (nameEl) nameEl.textContent = `${bossName} [暴躁发作]`;
        if (textEl) textEl.textContent = `“${text}”`;

        // 位置自适应：如果在 3D 模式或无坐标，固定于顶部醒目位置；如有坐标则靠近 BOSS
        if (x !== null && y !== null && window.innerWidth) {
            const clampX = Math.max(120, Math.min(window.innerWidth - 320, x));
            const clampY = Math.max(90, Math.min(window.innerHeight - 150, y - 90));
            this.bubbleEl.style.left = `${clampX}px`;
            this.bubbleEl.style.top = `${clampY}px`;
            this.bubbleEl.style.transform = 'translate(-50%, -100%) scale(1)';
        } else {
            this.bubbleEl.style.left = '50%';
            this.bubbleEl.style.top = '110px';
            this.bubbleEl.style.transform = 'translate(-50%, 0) scale(1)';
        }

        this.bubbleEl.classList.remove('active');
        void this.bubbleEl.offsetWidth; // 触发 CSS 弹跳动画
        this.bubbleEl.classList.add('active');

        if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
        this.bubbleTimer = setTimeout(() => {
            if (this.bubbleEl) {
                this.bubbleEl.classList.remove('active');
            }
        }, 3800);
    }
}

// 挂载至全局
window.aiBoss = new AIBossDialogueManager();
