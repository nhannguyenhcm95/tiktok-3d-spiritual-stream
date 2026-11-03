/**
 * HandSealSystem.js - Hệ thống Kết Ấn Thủ Ấn (Mudra System)
 * Mini-game vẽ nối điểm linh quang trên Canvas 2D tương tác
 * Bùng nổ sóng linh quang 3D, tịnh hóa chướng nghiệp và siêu độ linh quang
 */

export class HandSealSystem {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.audioSynth = options.audioSynth || null;
    this.playerController = options.playerController || null;
    this.vfxManager = options.vfxManager || null;
    this.onCompleteCallback = options.onComplete || null;

    this.isOpen = false;
    this.currentSealIndex = 0;
    this.userPath = []; // Mảng các index điểm đã nối thành công
    this.isDragging = false;
    this.currentPointer = { x: 0, y: 0 };

    // Định nghĩa 4 đồ hình Thủ Ấn thiêng liêng
    this.seals = [
      {
        id: 'lien_hoa',
        name: 'Liên Hoa Hợp Chưởng Ấn',
        sanskrit: 'Padma Mudra',
        meaning: 'Tâm hoa bừng nở, khai mở lòng từ bi thanh tịnh',
        color: '#ffb3ba',
        glowColor: '#ffd700',
        points: [
          { x: 0.5, y: 0.18, label: '1' }, // Đỉnh nụ sen
          { x: 0.76, y: 0.42, label: '2' }, // Cánh phải
          { x: 0.65, y: 0.82, label: '3' }, // Đáy phải
          { x: 0.35, y: 0.82, label: '4' }, // Đáy trái
          { x: 0.24, y: 0.42, label: '5' }  // Cánh trái
        ],
        targetOrder: [0, 1, 2, 3, 4, 0] // Vòng khép kín hình hoa sen
      },
      {
        id: 'vo_uy',
        name: 'Vô Úy Thí Ấn',
        sanskrit: 'Abhaya Mudra',
        meaning: 'Ban sự an ổn không sợ hãi, tiêu trừ âu lo',
        color: '#70d6ff',
        glowColor: '#48cae4',
        points: [
          { x: 0.5, y: 0.15, label: '1' },
          { x: 0.3, y: 0.45, label: '2' },
          { x: 0.7, y: 0.45, label: '3' },
          { x: 0.5, y: 0.75, label: '4' },
          { x: 0.5, y: 0.9, label: '5' }
        ],
        targetOrder: [0, 1, 3, 2, 0, 4]
      },
      {
        id: 'kim_cang',
        name: 'Kim Cang Bất Hoại Ấn',
        sanskrit: 'Vajra Mudra',
        meaning: 'Trí tuệ kim cang kiên cố, phá tan vô minh phiền não',
        color: '#ffc6ff',
        glowColor: '#e0aaff',
        points: [
          { x: 0.5, y: 0.12, label: '1' }, // Đỉnh
          { x: 0.82, y: 0.5, label: '2' }, // Phải
          { x: 0.5, y: 0.88, label: '3' }, // Đáy
          { x: 0.18, y: 0.5, label: '4' }, // Trái
          { x: 0.5, y: 0.5, label: '5' }   // Tâm điểm
        ],
        targetOrder: [0, 1, 2, 3, 0, 4]
      },
      {
        id: 'tinh_hoa',
        name: 'Tịnh Hóa Siêu Độ Ấn',
        sanskrit: 'Amita Shuddhi Mudra',
        meaning: 'Phóng hào quang nhiếp thọ, tiếp dẫn linh quang vãng sinh',
        color: '#ffee93',
        glowColor: '#ffb703',
        points: [
          { x: 0.5, y: 0.12, label: '1' },
          { x: 0.78, y: 0.32, label: '2' },
          { x: 0.72, y: 0.78, label: '3' },
          { x: 0.28, y: 0.78, label: '4' },
          { x: 0.22, y: 0.32, label: '5' },
          { x: 0.5, y: 0.52, label: '6' }
        ],
        targetOrder: [0, 2, 4, 1, 3, 0, 5]
      }
    ];

    this.particles = [];
    this.animationFrameId = null;

    this.initEvents();
  }

  initEvents() {
    const handleStart = (clientX, clientY) => {
      if (!this.isOpen) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      this.isDragging = true;
      this.currentPointer = { x, y };

      // Kiểm tra xem có chạm vào điểm bắt đầu (điểm tiếp theo cần nối)
      const seal = this.seals[this.currentSealIndex];
      const nextExpectedPointIndex = seal.targetOrder[this.userPath.length];
      const clickedPoint = this.getPointAt(x, y);

      if (clickedPoint !== null) {
        if (this.userPath.length === 0) {
          if (clickedPoint === seal.targetOrder[0]) {
            this.userPath.push(clickedPoint);
            this.spawnTouchSparks(x, y);
            if (this.audioSynth) this.audioSynth.playSingingBowl(580);
          }
        } else if (clickedPoint === nextExpectedPointIndex) {
          this.userPath.push(clickedPoint);
          this.spawnTouchSparks(x, y);
          if (this.audioSynth) this.audioSynth.playSingingBowl(580 + this.userPath.length * 40);
          this.checkCompletion();
        }
      }
    };

    const handleMove = (clientX, clientY) => {
      if (!this.isOpen || !this.isDragging) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      this.currentPointer = { x, y };

      if (this.userPath.length > 0) {
        const seal = this.seals[this.currentSealIndex];
        const nextExpectedPointIndex = seal.targetOrder[this.userPath.length];
        const hoveredPoint = this.getPointAt(x, y);

        if (hoveredPoint !== null && hoveredPoint === nextExpectedPointIndex) {
          this.userPath.push(hoveredPoint);
          this.spawnTouchSparks(x, y);
          if (this.audioSynth) this.audioSynth.playSingingBowl(580 + this.userPath.length * 45);
          this.checkCompletion();
        }
      }
    };

    const handleEnd = () => {
      this.isDragging = false;
      // Nếu thả tay mà chưa xong một nét thì vẫn giữ các điểm đã nối đúng
    };

    // Chuột
    this.canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', handleEnd);

    // Cảm ứng Mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchend', handleEnd);
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    const size = Math.min(parent.clientWidth - 20, 380);
    this.canvas.width = size;
    this.canvas.height = size;
  }

  open(sealIndex = 0) {
    this.isOpen = true;
    this.currentSealIndex = Math.min(Math.max(0, sealIndex), this.seals.length - 1);
    this.userPath = [];
    this.resizeCanvas();
    this.startLoop();
  }

  close() {
    this.isOpen = false;
    this.userPath = [];
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setSealIndex(idx) {
    this.currentSealIndex = Math.min(Math.max(0, idx), this.seals.length - 1);
    this.userPath = [];
  }

  getPointAt(x, y, radiusThreshold = 26) {
    const seal = this.seals[this.currentSealIndex];
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < seal.points.length; i++) {
      const px = seal.points[i].x * w;
      const py = seal.points[i].y * h;
      const dist = Math.hypot(x - px, y - py);
      if (dist <= radiusThreshold) {
        return i;
      }
    }
    return null;
  }

  spawnTouchSparks(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        alpha: 1,
        color: '#ffec5c',
        decay: 0.025 + Math.random() * 0.03
      });
    }
  }

  checkCompletion() {
    const seal = this.seals[this.currentSealIndex];
    if (this.userPath.length === seal.targetOrder.length) {
      // Đã hoàn thành toàn bộ ấn đồ hình!
      this.handleSuccess(seal);
    }
  }

  handleSuccess(seal) {
    // 1. Âm thanh chuông Kim Cang & Đại hồng chung ngân vang
    if (this.audioSynth) {
      this.audioSynth.playVajraBell();
      setTimeout(() => {
        if (this.audioSynth) this.audioSynth.playGreatBell();
      }, 350);
    }

    // 2. Nhân vật múa thủ ấn
    if (this.playerController) {
      this.playerController.setAnimation('HAND_SEAL', 3800);
    }

    // 3. Hiệu ứng sóng ánh sáng 3D & Siêu độ
    if (this.vfxManager) {
      const center = this.playerController ? this.playerController.getPosition() : { x: 0, y: 0, z: 0 };
      this.vfxManager.triggerShockwave(center, '#ffd700');
      // Siêu độ linh quang xung quanh
      this.vfxManager.purifyLinhQuang();
    }

    // 4. Bùng nổ hạt Canvas
    const w = this.canvas.width;
    const h = this.canvas.height;
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: w / 2,
        y: h / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        alpha: 1,
        color: '#ffd700',
        decay: 0.015 + Math.random() * 0.02
      });
    }

    // 5. Gọi callback
    if (this.onCompleteCallback) {
      this.onCompleteCallback(seal);
    }
  }

  startLoop() {
    const render = () => {
      if (!this.isOpen) return;
      this.draw();
      this.animationFrameId = requestAnimationFrame(render);
    };
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(render);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const seal = this.seals[this.currentSealIndex];
    if (!seal) return;

    // Xóa nền với hiệu ứng làm mờ nhẹ
    ctx.clearRect(0, 0, w, h);

    // Vẽ vòng hào quang đồ hình nền
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, w * 0.44, 0, Math.PI * 2);
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Vẽ các đường nét gợi ý (mờ)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < seal.targetOrder.length - 1; i++) {
      const p1 = seal.points[seal.targetOrder[i]];
      const p2 = seal.points[seal.targetOrder[i + 1]];
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
    }
    ctx.stroke();

    // Vẽ các đường người chơi đã nối thành công (sáng rực rỡ)
    if (this.userPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = seal.glowColor || '#ffd700';
      ctx.shadowColor = seal.glowColor || '#ffd700';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < this.userPath.length; i++) {
        const pt = seal.points[this.userPath[i]];
        if (i === 0) ctx.moveTo(pt.x * w, pt.y * h);
        else ctx.lineTo(pt.x * w, pt.y * h);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Vẽ nét nối đang kéo từ điểm cuối đến vị trí ngón tay/chuột
    if (this.isDragging && this.userPath.length > 0 && this.userPath.length < seal.targetOrder.length) {
      const lastPoint = seal.points[this.userPath[this.userPath.length - 1]];
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 235, 120, 0.75)';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(lastPoint.x * w, lastPoint.y * h);
      ctx.lineTo(this.currentPointer.x, this.currentPointer.y);
      ctx.stroke();
      ctx.restore();
    }

    // Vẽ các điểm linh quang (nodes)
    const nextExpectedPoint = seal.targetOrder[this.userPath.length];
    const time = performance.now() * 0.003;

    seal.points.forEach((pt, idx) => {
      const px = pt.x * w;
      const py = pt.y * h;
      const isConnected = this.userPath.includes(idx);
      const isNext = (idx === nextExpectedPoint);

      ctx.save();
      ctx.beginPath();

      if (isConnected) {
        // Điểm đã kích hoạt
        ctx.arc(px, py, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 18;
        ctx.fill();

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (isNext) {
        // Điểm tiếp theo cần chạm (nhấp nháy mời gọi)
        const pulse = 10 + Math.sin(time * 3) * 3;
        ctx.arc(px, py, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 230, 80, 0.9)';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 20;
        ctx.fill();

        // Vòng tròn mở rộng
        ctx.beginPath();
        const outerPulse = 14 + (Math.sin(time * 3) + 1) * 6;
        ctx.arc(px, py, outerPulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Điểm chưa chạm
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 180, 210, 0.4)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      }

      // Số thứ tự trong điểm
      ctx.fillStyle = isConnected ? '#b8860b' : '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pt.label, px, py);

      ctx.restore();
    });

    // Cập nhật và vẽ các hạt ánh sáng (particles)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

