/**
 * AudioTtsManager.js - Quản lý Nhạc Thiền Ngũ Cung, Tiếng Chuông Chùa & Giọng Đọc AI Tiếng Việt
 * Sử dụng thuần Web Audio API tổng hợp âm sắc + Endpoint /api/tts phát giọng đọc AI mượt mà
 * Tuân thủ chuẩn CONTRACT.md & Role 03
 */

export class AudioTtsManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isUnlocked = false;

    // Quản lý giai điệu ngũ cung chạy nền
    this.bgmTimer = null;
    this.bgmGain = null;

    // Nốt nhạc ngũ cung thiền vị (C4, D4, E4, G4, A4, C5, D5, E5)
    this.pentatonicFrequencies = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

    // Audio Element riêng cho giọng đọc TTS
    this.ttsAudio = new Audio();
    this.ttsAudio.preload = 'auto';
  }

  /**
   * Mở khóa AudioContext khi người xem chạm màn hình hoặc click nút
   */
  unlockAudio() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!this.isUnlocked) {
      this.isUnlocked = true;
      this.startAmbientMelody();
      console.log('[AudioTtsManager] AudioContext đã mở khóa thành công!');
    }
  }

  /**
   * Bắt đầu giai điệu ngũ cung tịnh tâm chạy nền liên tục (Procedural Pentatonic Zen)
   */
  startAmbientMelody() {
    if (!this.ctx || this.bgmTimer) return;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    this.bgmGain.connect(this.ctx.destination);

    // Chơi từng nốt đàn tranh / chuông gió ngân nga ngẫu nhiên mỗi 1.8 - 2.8 giây
    const playNextNote = () => {
      if (this.isUnlocked && !this.isMuted && this.ctx) {
        const freq = this.pentatonicFrequencies[Math.floor(Math.random() * this.pentatonicFrequencies.length)];
        this.playZenPluck(freq);
      }

      const nextDelay = 1800 + Math.random() * 1200;
      this.bgmTimer = setTimeout(playNextNote, nextDelay);
    };

    playNextNote();
  }

  /**
   * Tổng hợp 1 tiếng đàn tranh / chuông gió ngân vang trong trẻo
   */
  playZenPluck(freq) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Sóng tam giác hòa quyện với sóng sin tạo âm sắc đàn gảy
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    // Envelope tấn công nhanh (Attack), ngân dài (Decay)
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    osc.connect(gain);
    gain.connect(this.bgmGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 2.6);
  }

  /**
   * Tiếng Đại Hồng Chung chùa ngân vang trầm hùng (Boong...)
   * Khi nhân vật Solo quỳ lạy dâng hương
   */
  playTempleBell() {
    if (!this.ctx) {
      this.unlockAudio();
    }
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const masterBellGain = this.ctx.createGain();
    masterBellGain.gain.setValueAtTime(0.35, now);
    masterBellGain.connect(this.ctx.destination);

    // Chuông chùa gồm 4 hòa âm (Hài âm trầm, trung và kim)
    const harmonics = [
      { freq: 174.61, gain: 0.6, decay: 4.8 }, // Nốt F3 trầm hùng
      { freq: 349.23, gain: 0.3, decay: 3.8 }, // F4
      { freq: 523.25, gain: 0.15, decay: 2.8 }, // C5
      { freq: 700.0, gain: 0.08, decay: 1.8 }   // Hài âm kim
    ];

    harmonics.forEach((h) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(h.freq, now);

      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(h.gain, now + 0.015); // Tiếng vồ đập vào chuông
      g.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

      osc.connect(g);
      g.connect(masterBellGain);

      osc.start(now);
      osc.stop(now + h.decay);
    });

    console.log('[AudioTtsManager] Tiếng Đại Hồng Chung ngân vang: Boong...');
  }

  /**
   * Giọng đọc AI Tiếng Việt phát câu chúc khi dâng hương
   * Ưu tiên Stream từ /api/tts?text=... kết hợp Fallback Web Speech API
   */
  speakVietnamese(text) {
    if (this.isMuted || !text) return;

    console.log(`[AudioTtsManager] Chuẩn bị đọc TTS: "${text}"`);

    // 1. Phương án 1: Dùng Endpoint Proxy Google TTS của server
    try {
      const encoded = encodeURIComponent(text);
      this.ttsAudio.src = `/api/tts?text=${encoded}`;
      this.ttsAudio.volume = 1.0;

      const playPromise = this.ttsAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[AudioTtsManager] Lỗi play TTS stream, chuyển sang Web Speech Fallback:', err.message);
          this.fallbackSpeechSynthesis(text);
        });
      }
    } catch (err) {
      this.fallbackSpeechSynthesis(text);
    }
  }

  /**
   * Fallback Web Speech API nếu stream mạng bị chậm
   */
  fallbackSpeechSynthesis(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Bật / Tắt âm thanh
   */
  toggleSound() {
    this.isMuted = !this.isMuted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    }
    if (this.isMuted) {
      if (this.ttsAudio) this.ttsAudio.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    return !this.isMuted;
  }
}

