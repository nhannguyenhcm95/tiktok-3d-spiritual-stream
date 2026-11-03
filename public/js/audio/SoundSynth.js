/**
 * Web Audio API Synthesizer (SoundSynth)
 * Tự tổng hợp âm thanh không gian chùa Việt cổ:
 * - Gió xào xạc, tiếng chim hót, tiếng tụng kinh rì rầm từ xa
 * - Tiếng Đại Hồng Chung ngân vang rung chấn
 * - Tiếng Mõ gỗ trầm ấm thanh tịnh
 * - Tiếng chuông khánh dâng hương, thả hoa đăng
 * - Tiếng lắc ống xăm tre
 * - Đại hòa tấu linh thiêng khi nổ cúng dường lớn
 */

export class SoundSynth {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.ambientStarted = false;
    this.lastPlayTime = 0;

    this._onTikTokAction = this._onTikTokAction.bind(this);
    this._onAudioToggle = this._onAudioToggle.bind(this);
  }

  init() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.85;
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('[SoundSynth] Web Audio API lỗi:', e);
    }

    window.addEventListener('TIKTOK_ACTION', this._onTikTokAction);
    window.addEventListener('AUDIO_TOGGLE', this._onAudioToggle);
  }

  unlockAudio() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.ambientStarted && !this.muted) {
      this.startAmbientSoundscape();
      this.ambientStarted = true;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.1);
    }
    if (!this.muted && !this.ambientStarted) {
      this.startAmbientSoundscape();
      this.ambientStarted = true;
    }
    return this.muted;
  }

  _onAudioToggle(e) {
    if (typeof e.detail?.muted === 'boolean') {
      this.muted = e.detail.muted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.1);
      }
    }
  }

  startAmbientSoundscape() {
    if (!this.ctx || this.muted) return;

    // 1. Tiếng gió & lá xào xạc bằng Pink Noise lọc Bandpass
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.02;
      b6 = white * 0.115926;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 380;
    filter.Q.value = 1.8;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.22;
    whiteNoise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);
    whiteNoise.start();

    // 2. Tiếng tụng kinh rì rầm từ xa (Harmonic Drone 108Hz & 162Hz)
    const chantOsc1 = this.ctx.createOscillator();
    const chantOsc2 = this.ctx.createOscillator();
    const chantFilter = this.ctx.createBiquadFilter();
    const chantGain = this.ctx.createGain();
    chantOsc1.type = 'triangle';
    chantOsc2.type = 'sine';
    chantOsc1.frequency.value = 108;
    chantOsc2.frequency.value = 162;
    chantFilter.type = 'lowpass';
    chantFilter.frequency.value = 240;
    chantGain.gain.value = 0.045;

    chantOsc1.connect(chantFilter);
    chantOsc2.connect(chantFilter);
    chantFilter.connect(chantGain);
    chantGain.connect(this.masterGain);
    chantOsc1.start();
    chantOsc2.start();

    // 3. Tiếng chim hót & chuông chùa xa xa định kỳ
    setInterval(() => {
      if (this.muted || !this.ctx || document.hidden) return;
      if (Math.random() < 0.55) {
        this.playBirdChirp();
      } else {
        this.playBell(0.08, 3.5);
      }
    }, 6000);
  }

  playBirdChirp() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 1600 + Math.random() * 500;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playWoodenFish(pitchScale = 1.0) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const f = 680 * pitchScale * (0.97 + Math.random() * 0.06);
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 0.72, now + 0.11);

    filter.type = 'bandpass';
    filter.frequency.value = f;
    filter.Q.value = 6.0;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playBell(volume = 0.5, duration = 4.8) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const freqs = [174, 348, 522, 780];
    const weights = [1, 0.6, 0.35, 0.15];

    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * weights[idx], now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / (1 + idx * 0.35));
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  playChime() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [880, 1320, 1760].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.07);
      gain.gain.setValueAtTime(0.001, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 1.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 1.25);
    });
  }

  playShakeStick() {
    if (!this.ctx || this.muted) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playWoodenFish(1.45 + Math.random() * 0.25);
      }, i * 95);
    }
  }

  playFanfare() {
    if (!this.ctx || this.muted) return;
    // Hợp âm ngũ cung trang nghiêm vang lên khi có đại lễ / quà cúng dường lớn
    this.playBell(0.8, 6.0);
    setTimeout(() => this.playChime(), 200);
    setTimeout(() => this.playChime(), 600);
  }

  _onTikTokAction(e) {
    if (this.muted) return;
    this.unlockAudio();

    const action = e.detail?.actionType;
    switch (action) {
      case 'BOW':
        this.playWoodenFish(1.1);
        break;
      case 'WOODEN_FISH':
        this.playWoodenFish(1.0);
        break;
      case 'INCENSE_1':
      case 'INCENSE_3':
      case 'LANTERN':
      case 'PRAYER_TEXT':
      case 'OFFERING_FRUIT':
        this.playChime();
        break;
      case 'BELL':
        this.playBell(0.7, 5.0);
        break;
      case 'CONFETTI':
      case 'PARADE_FLOAT':
      case 'BUDDHA_LIGHT':
      case 'THOUSAND_LANTERNS':
      case 'GOLDEN_PAGODA':
      case 'GOLDEN_LION':
      case 'GOLDEN_PHOENIX':
      case 'TIKTOK_UNIVERSE':
        this.playFanfare();
        break;
    }
  }

  destroy() {
    window.removeEventListener('TIKTOK_ACTION', this._onTikTokAction);
    window.removeEventListener('AUDIO_TOGGLE', this._onAudioToggle);
    if (this.ctx && typeof this.ctx.close === 'function') {
      this.ctx.close();
    }
  }
}
