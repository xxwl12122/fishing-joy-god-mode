/**
 * 捕鱼达人 - Web Audio API 音效与音乐合成器
 * 100% 纯前端程序合成，无需任何外部音频文件，永不丢失资源
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.sfxVolume = 0.8;
        this.bgmVolume = 0.35;
        this.isMuted = false;
        this.isBgmPlaying = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
            this.bgmGain.connect(this.masterGain);

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

    // 发炮音效 (根据炮台等级有不同质感)
    playShoot(level = 1) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 炮弹低音冲击 + 激光/能量滑音
        const baseFreq = 160 + level * 25;
        osc.type = level > 5 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        gain.gain.setValueAtTime(0.35 + Math.min(level * 0.03, 0.3), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.14);

        // 如果是大炮，加一层噪声轰鸣
        if (level >= 4) {
            this.playNoiseThump(0.08, 0.2);
        }
    }

    playNoiseThump(duration = 0.1, vol = 0.2) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + duration);

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
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    // 金币清脆掉落声音
    playCoin(index = 0) {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime + index * 0.04;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';

        // 清脆金币频段 (约 1800Hz - 2600Hz)
        const freqs = [1975, 2349, 2793, 3135, 3520];
        const f = freqs[Math.min(index, freqs.length - 1)];
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    // 捕获鱼儿奖励音效 (琶音和弦)
    playCatch(multiplier = 2) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const notes = multiplier >= 50 ? [523.25, 659.25, 783.99, 1046.5, 1318.5] :
                      multiplier >= 15 ? [523.25, 659.25, 783.99, 1046.5] :
                      [659.25, 783.99];

        const baseTime = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = baseTime + idx * 0.06;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.25);
        });
    }

    // 炸弹爆炸音效
    playBomb() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        // 超重低音震动
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.6);

        // 巨响噪声
        this.playNoiseThump(0.5, 0.6);
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
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.4);
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

            gain.gain.setValueAtTime(0.3, t);
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
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
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

        // 五声音阶带来宁静空灵的大海意境 (F调五声: F, G, A, C, D)
        const scale = [174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00, 523.25];
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
            padGain.gain.linearRampToValueAtTime(0.12, now + 0.8);
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
                noteGain.gain.linearRampToValueAtTime(0.06, noteTime + 0.1);
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
