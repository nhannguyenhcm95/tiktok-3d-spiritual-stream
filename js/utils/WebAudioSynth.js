/**
 * WebAudioSynth.js — Bộ tổng hợp âm thanh tâm linh thuần Web Audio API
 * Tự động tạo toàn bộ tiếng chuông chùa, mõ gỗ, tiếng niệm Phật trầm,
 * chuông Kim Cang khi Kết Ấn và âm thanh gió nước mà không cần file MP3 ngoài.
 */

export class WebAudioSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.isMuted = false;
    this.isUnlocked = false;

    // Ambient loop nodes
    this.ambientNodes = [];
  }

  init() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('[WebAudioSynth] Trình duyệt không hỗ trợ Web Audio API.');
      return;
    }
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.ambientGain.connect(this.masterGain);
  }

  unlockAudio() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
        this.startAmbient();
        console.log('[WebAudioSynth] AudioContext đã được kích hoạt.');
      });
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
      this.startAmbient();
    }
  }

  toggleMute() {
    return this.setMuted(!this.isMuted);
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * 1. Tiếng Mõ Gỗ ("Cốc!") — Âm gỗ gõ giòn, decay nhanh, cộng hưởng thân gỗ
   */
  playWoodenFish() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(940, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, t);
    filter.Q.setValueAtTime(3.5, t);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * 2. Tiếng Đại Hồng Chung (Chuông U Minh ngân vang rền khắp chánh điện)
   */
  playGreatBell() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Hòa âm chuông đồng: Tần số cơ bản 146Hz (D3) + các bội âm inharmonic
    const freqs = [146.8, 294.2, 442.5, 592.1, 888.6, 1184.2];
    const decayTimes = [6.5, 5.0, 4.2, 3.2, 2.5, 1.8];
    const gains = [0.8, 0.55, 0.35, 0.25, 0.15, 0.08];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      // Rung chuông nhẹ (Detune vibrato)
      osc.frequency.linearRampToValueAtTime(freq * 0.996, t + decayTimes[idx]);

      gain.gain.setValueAtTime(gains[idx] * 0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decayTimes[idx]);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + decayTimes[idx]);
    });

    // Tiếng chạm chày gỗ vào chuông (Thump bass)
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(85, t);
    thump.frequency.exponentialRampToValueAtTime(30, t + 0.25);
    thumpGain.gain.setValueAtTime(0.9, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    thump.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thump.start(t);
    thump.stop(t + 0.3);
  }

  /**
   * 3. Tiếng Chuông Khánh / Chuông Gia Trì (Thanh thoát, êm dịu)
   */
  playSingingBowl() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const freqs = [587.3, 1178.5, 1774.2];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime((0.45 / (idx + 1)), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 3.6);
    });
  }

  /**
   * 4. Tiếng Chuông Kim Cang (Vajra Bell khi Kết Ấn thành công)
   * Ngân cao, linh thiêng, sóng năng lượng bừng nở
   */
  playVajraBell() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Chuỗi hòa âm kim cang cao vút
    const freqs = [880, 1320, 1760, 2640, 3520];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.linearRampToValueAtTime(f * 1.01, t + 2.8);

      gain.gain.setValueAtTime(0.3 / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 3.3);
    });
  }

  /**
   * 5. Tiếng Niệm Phật Trầm Ấm ("A Di Đà Phật")
   */
  playChantDrone() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const fundamental = 110; // A2
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(fundamental, t);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(fundamental * 2, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(2.5, t);

    // Envelope mô phỏng tiếng ngân tụng
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 2.5);
    osc2.stop(t + 2.5);
  }

  /**
   * 6. Tiếng Môi Trường Chùa (Gió xào xạc lá bồ đề & Nước hồ sen)
   */
  startAmbient() {
    if (!this.ctx || this.ambientNodes.length > 0) return;

    // Buffer tiếng gió bằng Noise generator
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Pink-ish noise
      lastOut = output[i];
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // LFO điều chế tần số gió xào xạc
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);

    whiteNoise.connect(windFilter);
    windFilter.connect(this.ambientGain);

    whiteNoise.start();
    lfo.start();

    this.ambientNodes.push(whiteNoise, lfo, windFilter);
  }
}

