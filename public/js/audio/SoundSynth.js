/**
 * Web Audio API Synthesizer (SoundSynth)
 * Tự tổng hợp âm thanh Mõ gỗ (Cốc!), Đại Hồng Chung (Boong...), và Chuông gió (Keng...)
 * hoàn toàn bằng thuật toán AudioContext, không phụ thuộc bất kỳ file .mp3 nào bên ngoài.
 */

export class SoundSynth {
  constructor() {
    this.ctx = null;
    this.muted = false;

    // Giới hạn tốc độ phát âm (Rate limiter) tối đa 8 âm thanh / giây
    this.lastPlayTime = 0;
    this.minInterval = 120; // 120ms giữa các lần kích hoạt âm thanh

    this._onTikTokAction = this._onTikTokAction.bind(this);
    this._onAudioToggle = this._onAudioToggle.bind(this);
  }

  /**
   * Khởi tạo Web Audio Context và các bộ lọc
   */
  init() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    } catch (e) {
      console.warn('[SoundSynth] Web Audio API không được hỗ trợ:', e);
    }

    window.addEventListener('TIKTOK_ACTION', this._onTikTokAction);
    window.addEventListener('AUDIO_TOGGLE', this._onAudioToggle);

    console.log('[SoundSynth] Web Audio Synthesizer đã sẵn sàng.');
  }

  /**
   * Mở khóa AudioContext khi người dùng click hoặc gõ phím (Bypass Autoplay Policy)
   */
  unlockAudio() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        console.log('[SoundSynth] AudioContext đã được mở khóa (Running).');
      }).catch((err) => {
        console.warn('[SoundSynth] Lỗi mở khóa audio:', err);
      });
    }
  }

  _onAudioToggle(e) {
    this.muted = !!e.detail?.muted;
    console.log(`[SoundSynth] Âm thanh: ${this.muted ? 'TẮT (Muted)' : 'BẬT'}`);
  }

  _onTikTokAction(e) {
    if (this.muted) return;
    const event = e.detail;
    if (!event || !event.actionType) return;

    // Đảm bảo audio context đang chạy
    this.unlockAudio();

    const now = Date.now();
    if (now - this.lastPlayTime < this.minInterval) {
      // Bỏ qua nếu kích hoạt quá dồn dập trong 120ms
      return;
    }
    this.lastPlayTime = now;

    switch (event.actionType) {
      case 'WOODEN_FISH':
        this.playWoodenFish();
        break;
      case 'BELL':
        this.playBell();
        break;
      case 'INCENSE':
      case 'LANTERN':
      case 'PRAYER_TEXT':
        this.playChime();
        break;
    }
  }

  /**
   * 1. Tiếng Mõ Gỗ ("Cốc!")
   * Sóng triangle + Bandpass filter (~720Hz, Q=8) + Envelope dứt khoát trong 0.12s
   * Tự động biến thiên nhẹ tần số ±4% để nghe tự nhiên như gõ mõ thật
   */
  playWoodenFish() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Biến thiên tần số ngẫu nhiên ±4%
    const detuneFactor = 1.0 + (Math.random() - 0.5) * 0.08;
    const baseFreq = 720 * detuneFactor;

    // Oscillator sóng tam giác tạo âm thanh gõ gỗ mộc
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    // Tần số giảm nhẹ tạo tiếng va chạm dùi gỗ
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, now + 0.1);

    // Bộ lọc dải thông (Bandpass) tạo âm rỗng của bụng mõ gỗ
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.Q.setValueAtTime(8, now);

    // Gain Envelope: Đập mạnh và ngắt nhanh trong 0.12s
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.85, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    // Kết nối đồ thị âm thanh
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * 2. Tiếng Đại Hồng Chung ("Boong...")
   * Kết hợp 3 Oscillator sóng sine tạo âm bồi kim loại (165Hz, 330Hz, 495Hz)
   * ngân vang kéo dài 4.0s với hiệu ứng rung nhẹ (LFO detune)
   */
  playBell() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const harmonics = [
      { freq: 165, gainVal: 0.7, decay: 4.2 }, // Âm cơ bản (Fundamental)
      { freq: 330, gainVal: 0.45, decay: 3.5 }, // Họa âm 2 (2nd Harmonic)
      { freq: 495, gainVal: 0.3, decay: 2.8 },  // Họa âm 3 (3rd Harmonic)
      { freq: 660, gainVal: 0.15, decay: 2.0 }  // Đốm kim loại đanh ban đầu
    ];

    harmonics.forEach(({ freq, gainVal, decay }) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Hiệu ứng rung chuông nhẹ (Detune pitch wobble)
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);
      osc.detune.linearRampToValueAtTime(0, now + decay);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  }

  /**
   * 3. Tiếng Chuông Gió / Thắp Nhang ("Keng...")
   * Sóng sine trong trẻo ngân nhẹ 1.2s ở tần số cao (1318Hz -> 1760Hz)
   */
  playChime() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Chọn ngẫu nhiên nốt trong hợp âm ngũ cung thanh tịnh (E6, G6, A6, B6, D7)
    const notes = [1318.51, 1567.98, 1760.0, 1975.53, 2349.32];
    const freq = notes[Math.floor(Math.random() * notes.length)];

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.4, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  destroy() {
    window.removeEventListener('TIKTOK_ACTION', this._onTikTokAction);
    window.removeEventListener('AUDIO_TOGGLE', this._onAudioToggle);
    if (this.ctx && typeof this.ctx.close === 'function') {
      this.ctx.close();
    }
  }
}

