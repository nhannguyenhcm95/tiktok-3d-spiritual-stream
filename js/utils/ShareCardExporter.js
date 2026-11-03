/**
 * ShareCardExporter.js — Quản lý Sổ Công Đức & Xuất Thiệp Dọc 1080x1350
 * Tự động đồng bộ với localStorage, tạo thiệp cầu an hoa văn sen cổ kính
 * và cho phép tải ảnh về hoặc chia sẻ qua Web Share API.
 */

export class ShareCardExporter {
  constructor() {
    this.storageKey = 'NIEMPHAT_3D_DATA_V1';
  }

  getData() {
    const defaultData = {
      playerName: 'Phật Tử Hữu Duyên',
      chantCount: 0,
      incenseCount: 0,
      bellCount: 0,
      woodenFishCount: 0,
      handSealCount: 0,
      sieuDoCount: 0,
      tamAnScore: 88,
      prayerText: 'Nguyện cầu thế giới hòa bình, gia quyến bình an, muôn người hạnh phúc.',
      prayerTarget: 'Cây Bồ Đề',
      fortuneText: 'Tâm an vạn sự an, hoa khai kết quả thiện lành.',
      lastVisit: Date.now()
    };

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return { ...defaultData, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('[ShareCardExporter] Lỗi đọc localStorage:', e);
    }
    return defaultData;
  }

  saveData(partial) {
    const current = this.getData();
    const updated = { ...current, ...partial, lastVisit: Date.now() };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('[ShareCardExporter] Lỗi ghi localStorage:', e);
    }
    return updated;
  }

  /**
   * Tạo hình thiệp chúc an dọc kích thước chuẩn 1080 x 1350 (Tỷ lệ 4:5 Instagram/Facebook)
   */
  async generateCardCanvas(customData = {}) {
    const data = { ...this.getData(), ...customData };
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    // 1. Nền gấm hoàng hôn - tím đỏ trầm ấm
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGrad.addColorStop(0, '#2b0e0c');
    bgGrad.addColorStop(0.35, '#451711');
    bgGrad.addColorStop(0.75, '#1e0b09');
    bgGrad.addColorStop(1, '#110504');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Họa tiết ánh trăng / hào quang tỏa sáng từ trên cao
    const auraGrad = ctx.createRadialGradient(540, 260, 40, 540, 260, 480);
    auraGrad.addColorStop(0, 'rgba(255, 225, 120, 0.45)');
    auraGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.18)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(540, 260, 480, 0, Math.PI * 2);
    ctx.fill();

    // 2. Khung viền chỉ vàng chạm khắc hoa sen cổ điển
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(48, 48, 984, 1254);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(62, 62, 956, 1226);

    // Bốn góc hoa văn góc vuông cổ kính
    this._drawCornerOrnament(ctx, 48, 48);
    this._drawCornerOrnament(ctx, 1032, 48, true);
    this._drawCornerOrnament(ctx, 48, 1302, false, true);
    this._drawCornerOrnament(ctx, 1032, 1302, true, true);

    // 3. Biểu tượng Đóa Sen Vàng & Hoành Phi
    ctx.font = '72px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪷', 540, 150);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('CHÙA AN LẠC', 540, 205);

    ctx.fillStyle = '#fce2cc';
    ctx.font = '22px "Segoe UI", Arial, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('THIỆP CẦU AN & SỔ CÔNG ĐỨC TU TẬP', 540, 245);

    // Dải phân cách vàng
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(340, 275);
    ctx.lineTo(740, 275);
    ctx.stroke();

    // 4. Họ tên người tu tập
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Phật Tử: ${data.playerName}`, 540, 345);

    // 5. Khung Bảng Ghi Nhận Công Đức Tu Tập
    ctx.fillStyle = 'rgba(30, 16, 12, 0.75)';
    ctx.roundRect ? ctx.roundRect(110, 395, 860, 340, 18) : ctx.fillRect(110, 395, 860, 340);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const stats = [
      { label: '📿 Biến Niệm Phật', val: `${data.chantCount.toLocaleString('vi-VN')} biến` },
      { label: '🕯️ Tâm Hương Cúng Phật', val: `${data.incenseCount} nén` },
      { label: '✨ Kết Ấn & Siêu Độ', val: `${data.handSealCount + data.sieuDoCount} lần` },
      { label: '🔔 Thỉnh Đại Hồng Chung', val: `${data.bellCount} lần` },
      { label: '🪵 Gõ Mõ Tụng Kinh', val: `${data.woodenFishCount} nhịp` },
      { label: '🧘 Điểm Tĩnh Tâm', val: `${data.tamAnScore} / 100` }
    ];

    stats.forEach((st, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = col === 0 ? 150 : 580;
      const y = 460 + row * 85;

      ctx.fillStyle = '#d5c8b5';
      ctx.font = '22px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(st.label, x, y);

      ctx.fillStyle = '#ffe066';
      ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
      ctx.fillText(st.val, x, y + 36);
    });

    // 6. Lời Cầu Nguyện & Lời Quẻ
    ctx.fillStyle = 'rgba(20, 10, 8, 0.85)';
    ctx.roundRect ? ctx.roundRect(110, 770, 860, 350, 18) : ctx.fillRect(110, 770, 860, 350);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`📜 LỜI CẦU NGUYỆN (Gửi tại ${data.prayerTarget})`, 540, 825);

    ctx.fillStyle = '#fff9e6';
    ctx.font = 'italic 26px "Segoe UI", Arial, sans-serif';
    this._wrapText(ctx, `"${data.prayerText}"`, 540, 875, 760, 38);

    ctx.fillStyle = '#e8b960';
    ctx.font = '22px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`🍀 Quẻ Thiện Lành: "${data.fortuneText}"`, 540, 1060);

    // 7. Con Dấu Son Đỏ "TÂM AN VẠN SỰ AN"
    this._drawSealStamp(ctx, 840, 1170);

    // 8. Dòng lưu bút chân trang
    ctx.fillStyle = '#a69888';
    ctx.font = '20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    const dateStr = new Date(data.lastVisit).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillText(`Ghi nhận ngày ${dateStr} • Niệm Phật Cầu An 3D`, 540, 1260);

    return canvas;
  }

  _drawCornerOrnament(ctx, x, y, flipX = false, flipY = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, 35);
    ctx.lineTo(10, 10);
    ctx.lineTo(35, 10);
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(18, 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawSealStamp(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.06);

    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 4;
    ctx.roundRect ? ctx.roundRect(-55, -45, 110, 90, 12) : ctx.strokeRect(-55, -45, 110, 90);
    ctx.stroke();

    ctx.fillStyle = '#c62828';
    ctx.font = 'bold 20px "Segoe UI", serif';
    ctx.textAlign = 'center';
    ctx.fillText('TÂM AN', 0, -10);
    ctx.fillText('VẠN SỰ AN', 0, 20);

    ctx.restore();
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currY);
        line = words[n] + ' ';
        currY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currY);
  }

  async downloadCard(customData = {}) {
    const canvas = await this.generateCardCanvas(customData);
    const link = document.createElement('a');
    link.download = `Thiep_Cau_An_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async shareCard(customData = {}) {
    const canvas = await this.generateCardCanvas(customData);
    if (navigator.share && canvas.toBlob) {
      canvas.toBlob(async (blob) => {
        try {
          const file = new File([blob], 'Thiep_Cau_An.png', { type: 'image/png' });
          await navigator.share({
            title: 'Thiệp Cầu An & Sổ Công Đức — Chùa An Lạc',
            text: 'Gửi ngàn lời chúc an lành và năng lượng từ bi từ Niệm Phật Cầu An 3D 🙏',
            files: [file]
          });
        } catch (e) {
          this.downloadCard(customData);
        }
      });
    } else {
      this.downloadCard(customData);
    }
  }
}
