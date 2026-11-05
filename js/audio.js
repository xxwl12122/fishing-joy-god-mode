/**
 * 捕鱼达人 - Web Audio API & 高保真音频系统
 * 支持本地高品质免版权音频文件 (BGM + 真实 SFX) 与 Web Audio API 硬件级低延迟并发播放
 * 内置防爆音动态压缩器、金币音调阶梯算法、浏览器自动播放策略自适应解锁
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        // 默认音量设置为舒适水平 0.5
        this.sfxVolume = 0.5;
        this.bgmVolume = 0.5;
        this.isMuted = false;
        this.isBgmPlaying = false;
        this.initialized = false;
        this.userInteracted = false;

        // 音频缓存与实例池
        this.audioBuffers = {};
        this.audioPaths = {
            bgm: 'src/assets/audio/bgm.mp3',
            shoot: 'src/assets/audio/shoot.mp3',
            coin: 'src/assets/audio/coin.mp3',
            catch: 'src/assets/audio/catch.mp3',
            catch_bonus: 'src/assets/audio/catch_bonus.mp3'
        };
        this.fallbackAudioPaths = {
            bgm: 'assets/audio/bgm.mp3',
            shoot: 'assets/audio/shoot.mp3',
            coin: 'assets/audio/coin.mp3',
            catch: 'assets/audio/catch.mp3',
            catch_bonus: 'assets/audio/catch_bonus.mp3'
        };

        // BGM 播放器 (HTMLAudioElement，长音乐循环播放无内存压力)
        this.bgmAudio = null;
        this.bgmSourceNode = null;

        // 连击与频次控制
        this.lastShootSoundTime = 0;
        this.lastCatchSoundTime = 0;
        this.coinStreak = 0;
        this.lastCoinTime = 0;

        // 自动绑定用户首次交互解锁音频
        this.bindUserInteractionUnlock();
    }

    // 绑定用户点击/按键任意交互，破除浏览器自动播放限制 (Autoplay Policy)
    bindUserInteractionUnlock() {
        const unlock = () => {
            if (this.userInteracted) return;
            this.userInteracted = true;
            this.init();
            this.resume();
            if (!this.isMuted && !this.isBgmPlaying) {
                this.startBgm();
            }
            window.removeEventListener('pointerdown', unlock, true);
            window.removeEventListener('keydown', unlock, true);
            window.removeEventListener('touchstart', unlock, true);
        };

        window.addEventListener('pointerdown', unlock, true);
        window.addEventListener('keydown', unlock, true);
        window.addEventListener('touchstart', unlock, true);
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // 动态压缩器 (DynamicsCompressor) 杜绝高频极速发炮与全屏爆金币时的破音爆音
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
            this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
            this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
            this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
            this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

            // 主音量增益
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);

            // 音效增益 (默认 0.5)
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);

            // 背景音乐增益 (默认 0.5)
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);

            // 连接拓扑: [SFX, BGM] -> compressor -> masterGain -> destination
            this.sfxGain.connect(this.compressor);
            this.bgmGain.connect(this.compressor);
            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);

            this.initialized = true;

            // 预加载所有音效文件为 AudioBuffer
            this.preloadAudioBuffers();

            // 初始化背景音乐播放器
            this.initBgmAudio();
        } catch (e) {
            console.warn("Web Audio initialization error:", e);
        }
    }

    resume() {
        if (!this.ctx) {
            this.init();
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    // 预加载 SFX 音频文件并解码为 Web Audio Buffer
    preloadAudioBuffers() {
        const sfxKeys = ['shoot', 'coin', 'catch', 'catch_bonus'];
        sfxKeys.forEach(key => {
            this.loadAudioBuffer(key, this.audioPaths[key], this.fallbackAudioPaths[key]);
        });
    }

    async loadAudioBuffer(key, primaryUrl, fallbackUrl) {
        if (!this.ctx) return;
        const fetchAndDecode = async (url) => {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const arrayBuf = await resp.arrayBuffer();
            return await this.ctx.decodeAudioData(arrayBuf);
        };

        try {
            this.audioBuffers[key] = await fetchAndDecode(primaryUrl);
        } catch (e1) {
            try {
                this.audioBuffers[key] = await fetchAndDecode(fallbackUrl);
            } catch (e2) {
                console.warn(`Failed to load audio file for ${key}:`, e2.message);
            }
        }
    }

    // 初始化 BGM 实例
    initBgmAudio() {
        if (this.bgmAudio) return;
        this.bgmAudio = new Audio();
        this.bgmAudio.src = this.audioPaths.bgm;
        this.bgmAudio.loop = true;
        this.bgmAudio.crossOrigin = 'anonymous';

        this.bgmAudio.addEventListener('error', () => {
            // 回退到备用路径
            if (this.bgmAudio.src !== this.fallbackAudioPaths.bgm) {
                this.bgmAudio.src = this.fallbackAudioPaths.bgm;
            }
        });

        // 将 HTMLAudio 接入 Web Audio 拓扑管道，享受统一增益与压缩器
        if (this.ctx && !this.bgmSourceNode) {
            try {
                this.bgmSourceNode = this.ctx.createMediaElementSource(this.bgmAudio);
                this.bgmSourceNode.connect(this.bgmGain);
            } catch (e) {
                // 如果受到浏览器跨域安全限制，直接使用 HTMLAudio 自身的 volume
                this.bgmAudio.volume = this.isMuted ? 0 : this.bgmVolume;
            }
        }
    }

    // 启动背景音乐播放 (欢快、轻松、休闲风格循环)
    startBgm() {
        this.resume();
        this.initBgmAudio();
        if (this.bgmAudio) {
            this.isBgmPlaying = true;
            this.bgmAudio.play().catch(err => {
                // 等待下次交互再试
                this.isBgmPlaying = false;
            });
        }
    }

    stopBgm() {
        this.isBgmPlaying = false;
        if (this.bgmAudio) {
            this.bgmAudio.pause();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
        }
        if (this.bgmAudio) {
            if (!this.bgmSourceNode) {
                this.bgmAudio.volume = this.isMuted ? 0 : this.bgmVolume;
            }
            if (this.isMuted) {
                this.bgmAudio.pause();
            } else if (this.isBgmPlaying) {
                this.bgmAudio.play().catch(() => {});
            }
        }
        return this.isMuted;
    }

    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        }
    }

    setBgmVolume(val) {
        this.bgmVolume = Math.max(0, Math.min(1, val));
        if (this.bgmGain && this.ctx) {
            this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
        }
        if (this.bgmAudio && !this.bgmSourceNode) {
            this.bgmAudio.volume = this.isMuted ? 0 : this.bgmVolume;
        }
    }

    // 播放 Web Audio Buffer 音效 (极速低延迟、可调节变调与音量)
    playBuffer(key, pitchRate = 1.0, gainScale = 1.0) {
        if (!this.ctx || this.isMuted) return false;
        const buffer = this.audioBuffers[key];
        if (!buffer) return false;

        try {
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.setValueAtTime(pitchRate, this.ctx.currentTime);

            if (gainScale !== 1.0) {
                const tempGain = this.ctx.createGain();
                tempGain.gain.setValueAtTime(gainScale, this.ctx.currentTime);
                source.connect(tempGain);
                tempGain.connect(this.sfxGain);
            } else {
                source.connect(this.sfxGain);
            }

            source.start(0);
            return true;
        } catch (e) {
            return false;
        }
    }

    // 1. 发射炮弹音效 (绑定真实 shoot.mp3，根据火炮等级微调变调，智能限频防爆音)
    playShoot(level = 1) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = performance.now();
        // 限制发射声最小触发间隔为 50ms，防止无敌急速模式爆音
        if (now - this.lastShootSoundTime < 50) return;
        this.lastShootSoundTime = now;

        // 根据炮台等级 (1-10) 进行微幅音调上扬，带来强烈的进阶打击感
        const pitchRate = 0.96 + Math.min(level, 10) * 0.025;
        const played = this.playBuffer('shoot', pitchRate, 0.85);

        // 若 Buffer 尚未加载完成，调用备用程序合成发炮音
        if (!played) {
            this.fallbackSynthShoot(level);
        }
    }

    // 2. 金币掉落 / 得分音效 (绑定真实 coin.mp3，连续拾取时音阶自然递增)
    playCoin(index = 0) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = performance.now();
        // 限制发声最小间隔为 26ms，既能保证老虎机般的高速连珠清脆感，又杜绝密集堆叠爆音
        if (this.lastCoinSoundTime && now - this.lastCoinSoundTime < 26) return;
        this.lastCoinSoundTime = now;

        if (now - this.lastCoinTime < 800) {
            this.coinStreak++;
        } else {
            this.coinStreak = 0;
        }
        this.lastCoinTime = now;

        // 音阶梯度上扬，产生清脆爽快的“叮叮当当”连续拾取金币感
        const pitchStep = (this.coinStreak % 12) * 0.045 + (index % 4) * 0.02;
        const pitchRate = 1.0 + pitchStep;
        const played = this.playBuffer('coin', pitchRate, 0.85);

        if (!played) {
            this.fallbackSynthCoin(index);
        }
    }

    // 3. 鱼被捕获音效 (绑定真实 catch.mp3 与 catch_bonus.mp3)
    playCatch(multiplier = 2) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = performance.now();
        if (now - this.lastCatchSoundTime < 40) return;
        this.lastCatchSoundTime = now;

        // 大鱼 / 高分鱼 (score >= 30) 或多倍奖励播放高能 catch_bonus 音效
        if (multiplier >= 30) {
            const played = this.playBuffer('catch_bonus', 1.0, 0.95);
            if (!played) this.fallbackSynthCatch(multiplier);
        } else {
            const played = this.playBuffer('catch', 1.0 + Math.random() * 0.1, 0.85);
            if (!played) this.fallbackSynthCatch(multiplier);
        }
    }

    // 捕鱼渔网张开音效
    playNet() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    // 漫天金币雨音效
    playCoinRain() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                this.playCoin(i);
            }, i * 65);
        }
    }

    // 特殊技能：炸弹鱼核爆
    playBomb() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        this.playNoiseThump(0.55, 0.7);
    }

    // 特殊技能：全屏核弹灭世
    playNuke() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        this.playNoiseThump(1.0, 0.95);
    }

    // 特殊技能：冰封万里
    playFreeze() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.35);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    // 特殊技能：闪电连锁
    playLightning() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.18);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    // 特殊技能：毁灭激光炮
    playLaser() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.28);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.28);
    }

    // 史诗级 BOSS 降临警报
    playBossAlert() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const time = now + i * 0.42;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, time);
            osc.frequency.linearRampToValueAtTime(480, time + 0.2);

            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.38, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(time);
            osc.stop(time + 0.35);
        }
    }

    playBossHit() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        this.playNoiseThump(0.09, 0.4);
    }

    // MEGA WIN 爆金币狂欢盛典
    playMegaWin() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const time = now + idx * 0.09;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.35, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(time);
            osc.stop(time + 0.45);
        });

        for (let i = 0; i < 24; i++) {
            setTimeout(() => {
                this.playCoin(i % 8);
            }, 300 + i * 50);
        }
    }

    // 爆炸重低音噪音合成器
    playNoiseThump(duration = 0.5, vol = 0.7) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const bufSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(now);
    }

    // 备用兜底：发炮合成音
    fallbackSynthShoot(level) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startFreq = 220 + level * 25;
        const endFreq = 65;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.09);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    // 备用兜底：金币合成音
    fallbackSynthCoin(index) {
        const now = this.ctx.currentTime;
        const f1 = 987.77 + (index % 8) * 65;
        const f2 = 1318.51 + (index % 8) * 85;

        [f1, f2].forEach((freq, offsetIdx) => {
            const time = now + offsetIdx * 0.045;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.18, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(time);
            osc.stop(time + 0.16);
        });
    }

    // 备用兜底：捕获合成音
    fallbackSynthCatch(multiplier) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const startFreq = 260 + Math.min(multiplier, 50) * 8;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.linearRampToValueAtTime(startFreq * 1.5, now + 0.14);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }
}

window.soundManager = new SoundManager();
