/**
 * 捕鱼达人 - Web Audio API 音效与音乐合成器
 * 100% 纯前端程序合成，内置动态压缩器防爆音、音调递增连击音效
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.sfxVolume = 0.8;
        this.bgmVolume = 0.3;
        this.isMuted = false;
        this.isBgmPlaying = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.initialized = false;

        // 连击音调系统
        this.comboCatchCount = 0;
        this.lastCatchSoundTime = 0;
        this.lastShootSoundTime = 0;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // 动态压缩器 (DynamicsCompressor) 杜绝高频极速发炮时声音重叠导致的破音/爆音
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
            this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
            this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
            this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
            this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);

            // 连接拓扑: [SFX, BGM] -> compressor -> masterGain -> destination
            this.sfxGain.connect(this.compressor);
            this.bgmGain.connect(this.compressor);
            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);

            this.initialized = true;
            this.startBgm();
        } catch (e) {
            console.warn("Web Audio not supported or blocked", e);
        }
    }

    resume() {
        if (!this.ctx) {
            this.init();
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
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
    }

    // 发炮音效 (极速狂暴下智能限频防爆音，保持清脆机械律动)
    playShoot(level = 1) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = performance.now();
        // 限制发声最小间隔为 65ms，即使无敌版 35ms 连发也不出现杂音重叠
        if (now - this.lastShootSoundTime < 65) {
            return;
        }
        this.lastShootSoundTime = now;

        const ctxTime = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 炮弹低音冲击 + 激光/能量滑音
        const baseFreq = 160 + level * 20;
        osc.type = level > 5 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(baseFreq, ctxTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctxTime + 0.1);

        gain.gain.setValueAtTime(0.28, ctxTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctxTime + 0.11);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(ctxTime);
        osc.stop(ctxTime + 0.11);

        // 高阶炮附加低频气动声
        if (level >= 6) {
            this.playNoiseThump(0.06, 0.18);
        }
    }

    playNoiseThump(duration = 0.08, vol = 0.18) {
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start();
    }

    // 渔网张开音效
    playNet() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // 金币清脆掉落声音 (带递增连击音调)
    playCoin(index = 0) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime + index * 0.035;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';

        // 连击音调阶梯 (五声音阶升调)
        const scale = [1975.53, 2217.46, 2489.02, 2793.83, 3135.96, 3520.00, 3951.07, 4434.92];
        const pitchIdx = (this.comboCatchCount + index) % scale.length;
        const f = scale[pitchIdx];

        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // 捕获鱼儿奖励音效 (琶音和弦 + 音调累加)
    playCatch(multiplier = 2) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const nowPerf = performance.now();
        if (nowPerf - this.lastCatchSoundTime < 2000) {
            this.comboCatchCount++;
        } else {
            this.comboCatchCount = 0;
        }
        this.lastCatchSoundTime = nowPerf;

        const pitchShift = Math.min(10, this.comboCatchCount) * 40;

        const notes = multiplier >= 50 ? [523.25, 659.25, 783.99, 1046.5, 1318.5] :
                      multiplier >= 15 ? [523.25, 659.25, 783.99, 1046.5] :
                      [659.25, 783.99];

        const baseTime = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = baseTime + idx * 0.05;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq + pitchShift, t);

            gain.gain.setValueAtTime(0.24, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.22);
        });
    }

    // 炸弹爆炸音效 (带重低音与轰鸣)
    playBomb() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.65);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.65);

        this.playNoiseThump(0.55, 0.7);
    }

    // 冰封音效
    playFreeze() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(2600, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.45);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.45);
    }

    // 闪电链音效
    playLightning() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + i * 0.05;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800 + Math.random() * 600, t);
            osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);

            gain.gain.setValueAtTime(0.28, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.08);
        }
    }

    // 激光毁灭充能/发射
    playLaser() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(1400, now + 0.35);
        osc.frequency.exponentialRampToValueAtTime(100, now + 1.2);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 1.2);
    }

    // BOSS 来袭警报
    playBossAlert() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        for (let i = 0; i < 2; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + i * 0.4;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, t);
            osc.frequency.linearRampToValueAtTime(880, t + 0.18);
            osc.frequency.linearRampToValueAtTime(440, t + 0.35);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.38);
        }
    }

    // 自动循环悠扬的海底环境合成 BGM
    startBgm() {
        if (this.isBgmPlaying) return;
        this.isBgmPlaying = true;
        this.scheduleBgmLoop();
    }

    scheduleBgmLoop() {
        if (!this.isBgmPlaying) return;

        const chords = [
            [174.61, 220.00, 261.63, 349.23], // F major
            [146.83, 174.61, 220.00, 293.66], // D minor
            [130.81, 164.81, 196.00, 261.63], // C major
            [164.81, 196.00, 246.94, 329.63]  // A minor
        ];

        const playMeasure = () => {
            if (!this.ctx || this.isMuted || !this.isBgmPlaying) {
                this.bgmTimer = setTimeout(playMeasure, 2400);
                return;
            }

            const currentChord = chords[this.bgmStep % chords.length];
            const now = this.ctx.currentTime;

            // 柔和低音垫底 (Pad)
            const padOsc = this.ctx.createOscillator();
            const padGain = this.ctx.createGain();
            padOsc.type = 'sine';
            padOsc.frequency.setValueAtTime(currentChord[0] * 0.5, now);
            padGain.gain.setValueAtTime(0.001, now);
            padGain.gain.linearRampToValueAtTime(0.1, now + 0.8);
            padGain.gain.linearRampToValueAtTime(0.001, now + 2.3);

            padOsc.connect(padGain);
            padGain.connect(this.bgmGain);
            padOsc.start(now);
            padOsc.stop(now + 2.3);

            // 琶音流水泡泡旋律
            for (let i = 0; i < 4; i++) {
                const noteTime = now + i * 0.55 + Math.random() * 0.05;
                const noteOsc = this.ctx.createOscillator();
                const noteGain = this.ctx.createGain();
                noteOsc.type = 'sine';

                const noteFreq = currentChord[i % currentChord.length];
                noteOsc.frequency.setValueAtTime(noteFreq, noteTime);

                noteGain.gain.setValueAtTime(0.001, noteTime);
                noteGain.gain.linearRampToValueAtTime(0.05, noteTime + 0.1);
                noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

                noteOsc.connect(noteGain);
                noteGain.connect(this.bgmGain);
                noteOsc.start(noteTime);
                noteOsc.stop(noteTime + 0.6);
            }

            this.bgmStep++;
            this.bgmTimer = setTimeout(playMeasure, 2200);
        };

        playMeasure();
    }
}

window.soundManager = new SoundManager();
