/**
 * HUD & Activities Manager — Lên Chùa Cầu An
 * Quản lý HUD, 5 Hoạt Động Tâm Linh, Sổ Cầu An và Thiệp Chia Sẻ 1080x1350.
 */

const STORAGE_KEY = 'len_chua_cau_an_save_v2';
const BAD_WORDS = ['địt', 'đụ', 'lồn', 'cặc', 'đéo', 'chó đẻ', 'ngu', 'chết tiệt', 'vãi', 'đĩ', 'fuck', 'shit', 'dm', 'đm', 'vcl', 'vl'];

const FORTUNE_QUOTES = [
  { title: "Quẻ Số 01 • Tâm Khởi Bình Yên", text: "Lòng người như mặt hồ thu tĩnh lặng, giữ tâm trong sáng thì mỗi ngày đều là ngày lành." },
  { title: "Quẻ Số 02 • Xuân Hòa Gia Đạo", text: "Trong nhà có tiếng cười hiền hòa, bữa cơm sum vầy chính là phúc phần quý giá nhất." },
  { title: "Quẻ Số 03 • Bước Chân Vững Chãi", text: "Chẳng cần vội vã hơn người, cứ đi từng bước kiên trì ắt sẽ tới bến bờ mong ước." },
  { title: "Quẻ Số 04 • Gió Thoảng Hương Sen", text: "Bao dung với người cũng là mở lối cho chính mình, hương thơm tự khắc lan tỏa." },
  { title: "Quẻ Số 05 • Trăng Sáng Đầu Cành", text: "Những băn khoăn rồi sẽ tan như mây khói, trả lại bầu trời quang đãng trong tâm." },
  { title: "Quẻ Số 06 • Hạt Mầm Thiện Niệm", text: "Một lời nói ấm áp gieo xuống hôm nay sẽ nở thành hoa lành trong những ngày sắp tới." },
  { title: "Quẻ Số 07 • Nắng Ấm Mùa Xuân", text: "Hãy trân trọng từng khoảnh khắc bình dị, niềm vui đang ở ngay nơi nhịp thở an nhiên." },
  { title: "Quẻ Số 08 • Bút Nghiên Sáng Tỏ", text: "Tâm trí tĩnh tại giúp việc học hành, suy nghĩ thêm phần thấu suốt và bền bỉ." },
  { title: "Quẻ Số 09 • Dòng Suối Mát Lành", text: "Biết lắng nghe và sẻ chia sẽ giúp tình thân, tình bạn ngày càng gắn kết bền lâu." },
  { title: "Quẻ Số 10 • Cây Cổ Thụ Vững Gốc", text: "Chăm sóc nền tảng đạo đức và lối sống điều độ, bạn sẽ luôn vững vàng trước mọi đổi thay." },
  { title: "Quẻ Số 11 • Cánh Én Báo Xuân", text: "Tin vui nho nhỏ đến từ những điều giản dị, hãy mở lòng đón nhận bằng nụ cười hiền." },
  { title: "Quẻ Số 12 • Chuông Chùa Ngân Xa", text: "Buông bớt một phần nóng giận, lòng nhẹ nhàng thêm mười phần thảnh thơi." },
  { title: "Quẻ Số 13 • Lá Thắm Cành Xanh", text: "Sự chân thành luôn chạm tới trái tim, mọi mối nhân duyên thiện lành đều đáng trân quý." },
  { title: "Quẻ Số 14 • Đèn Sáng Trong Đêm", text: "Khi giữ vững niềm tin hướng thiện, bạn luôn tìm thấy lối đi sáng suốt cho riêng mình." },
  { title: "Quẻ Số 15 • Mây Trắng Thong Dong", text: "Chuyện đã qua hãy để gió cuốn đi, dành trọn tâm ý cho hiện tại tươi đẹp." },
  { title: "Quẻ Số 16 • Sen Nở Trong Hồ", text: "Dù bận rộn đến đâu, hãy dành cho mình vài phút lắng lòng để tìm lại sự cân bằng." },
  { title: "Quẻ Số 17 • Thuận Hòa Bốn Phương", text: "Đi tới đâu cũng giữ lễ nghĩa và nụ cười, ắt gặp được những người bạn đồng hành tốt bụng." },
  { title: "Quẻ Số 18 • Giọt Sương Ban Mai", text: "Khởi đầu mỗi sáng bằng lòng biết ơn, cả ngày dài sẽ tràn đầy năng lượng tích cực." },
  { title: "Quẻ Số 19 • Bến Đò Bình Yên", text: "Gia đình luôn là chốn quay về ấm áp nhất, hãy gửi lời hỏi thăm tới người thương yêu." },
  { title: "Quẻ Số 20 • Trí Sáng Tâm Trong", text: "Kiên nhẫn rèn luyện mỗi ngày, công sức bạn bỏ ra sẽ mang lại sự trưởng thành vững chắc." },
  { title: "Quẻ Số 21 • Hương Trầm Tỏa Ngát", text: "Lòng hiếu thảo và sự lễ phép là nét đẹp bền vững nhất của mỗi con người." },
  { title: "Quẻ Số 22 • Nhịp Cầu Giao Hòa", text: "Một lời cảm ơn hay xin lỗi đúng lúc sẽ hóa giải mọi khoảng cách xa xôi." },
  { title: "Quẻ Số 23 • Rừng Trúc Xanh Tươi", text: "Mềm mỏng nhưng kiên cường như cây trúc, bạn sẽ vượt qua thử thách một cách nhẹ nhàng." },
  { title: "Quẻ Số 24 • Tiếng Sáo Đồng Quê", text: "Cuộc sống đẹp ở sự giản đơn, biết đủ chính là chìa khóa của niềm vui lâu dài." },
  { title: "Quẻ Số 25 • Sao Khuê Lấp Lánh", text: "Sự chăm chỉ và tinh thần ham học hỏi sẽ mở ra nhiều chân trời tri thức mới mẻ." },
  { title: "Quẻ Số 26 • Mưa Xuân Nhuần Thấm", text: "Lòng tốt âm thầm như mưa mùa xuân, lặng lẽ nuôi dưỡng những điều tử tế quanh ta." },
  { title: "Quẻ Số 27 • Cánh Buồm Xuôi Gió", text: "Chuẩn bị kỹ lưỡng và giữ tâm thế chủ động, mọi kế hoạch sẽ diễn ra nhịp nhàng." },
  { title: "Quẻ Số 28 • Trà Thơm Tri Kỷ", text: "Có người cùng trò chuyện, sẻ chia buồn vui là niềm hạnh phúc đáng trân trọng." },
  { title: "Quẻ Số 29 • Núi Cao Vững Chãi", text: "Giữ chữ tín trong lời nói và việc làm, bạn sẽ luôn nhận được sự tin yêu từ mọi người." },
  { title: "Quẻ Số 30 • Hoa Khai Phú Quý Tâm", text: "Sự giàu có lớn nhất là một tâm hồn phong phú, biết yêu thương và trân trọng cuộc đời." },
  { title: "Quẻ Số 31 • Ánh Bình Minh Rạng", text: "Mỗi ngày mới là một trang giấy trắng để bạn viết lên những điều ý nghĩa và vui tươi." },
  { title: "Quẻ Số 32 • Chim Én Về Tổ", text: "Dù đi xa muôn nơi, nhớ về cội nguồn và quê hương luôn tiếp thêm sức mạnh trong lòng." },
  { title: "Quẻ Số 33 • Nước Chảy Đá Mòn", text: "Đừng ngại việc khó, sự nhẫn nại từng chút một sẽ đưa bạn đến thành quả ngọt ngào." },
  { title: "Quẻ Số 34 • Gió Mát Trăng Thanh", text: "Giấc ngủ ngon và tâm trí thư thái đến từ một ngày sống trọn vẹn, chân thành." },
  { title: "Quẻ Số 35 • Bồ Đề Tỏa Bóng", text: "Khi bạn giúp đỡ ai đó bằng cả tấm lòng, niềm vui sẽ nhân đôi trong tim cả hai người." },
  { title: "Quẻ Số 36 • Đường Xuân Thênh Thang", text: "Hãy bước đi với sự tự tin và khiêm nhường, phía trước luôn có nhiều điều tốt đẹp." },
  { title: "Quẻ Số 37 • Lửa Ấm Đêm Đông", text: "Sự quan tâm chân thành có thể sưởi ấm cả những ngày se lạnh nhất." },
  { title: "Quẻ Số 38 • Nhành Mai Đầu Ngõ", text: "Kiên trì vượt qua những ngày mưa nắng, đóa hoa nỗ lực của bạn sẽ nở rộ rực rỡ." },
  { title: "Quẻ Số 39 • Khúc Nhạc An Nhiên", text: "Hài hòa giữa làm việc và nghỉ ngơi giúp thân khỏe, tâm an, trí sáng." },
  { title: "Quẻ Số 40 • Vạn Sự Tùy Duyên Lành", text: "Làm hết sức mình với tâm thiện lành, mọi điều đến đi đều mang lại bài học quý giá." }
];

export class HudManager {
  constructor(soundSynth, sceneManager) {
    this.sound = soundSynth;
    this.sceneManager = sceneManager;

    this.userState = this._loadSaveData();
    this.visitorCount = 1248;
    this.totalMerit = 12480;
    this.activeRhythmCleanup = null;

    // DOM Elements
    this.activityModal = null;
    this.activityContent = null;
    this.actionBtn = null;
    this.toastEl = null;
    this.visitorCounterEl = null;
    this.meritCounterEl = null;

    this._onTikTokAction = this._onTikTokAction.bind(this);
  }

  init() {
    this.activityModal = document.getElementById('activity-modal');
    this.activityContent = document.getElementById('activity-content');
    this.actionBtn = document.getElementById('action-btn');
    this.toastEl = document.getElementById('toast-msg');
    this.visitorCounterEl = document.getElementById('visitor-counter');
    this.meritCounterEl = document.getElementById('merit-counter');

    window.addEventListener('TIKTOK_ACTION', this._onTikTokAction);

    // Định kỳ tăng khách hành hương
    setInterval(() => {
      const added = 8 + Math.floor(Math.random() * 8);
      this.visitorCount += added;
      if (this.visitorCounterEl) {
        this.visitorCounterEl.textContent = `Hôm nay có ${this.visitorCount.toLocaleString('vi-VN')} người lên chùa cầu an`;
      }
    }, 24000);
  }

  _loadSaveData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      playerName: "Khách Hành Hương",
      incenseCount: 3,
      bellCount: 1,
      bestTamAnScore: 88,
      prayers: [
        { text: "Cầu mong gia đình luôn mạnh khỏe, bình an và ngập tràn tiếng cười.", type: "silk", date: "Hôm nay" }
      ],
      fortunes: [],
      tutorialSeen: false
    };
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.userState));
    } catch (e) {}
  }

  filterProfanity(input) {
    let cleaned = String(input || '').trim();
    for (const word of BAD_WORDS) {
      const reg = new RegExp(word, 'gi');
      cleaned = cleaned.replace(reg, '***');
    }
    return cleaned;
  }

  showToast(msg) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 3500);
  }

  closeActivityModal() {
    if (this.activeRhythmCleanup) {
      this.activeRhythmCleanup();
      this.activeRhythmCleanup = null;
    }
    if (this.activityModal) {
      this.activityModal.style.display = 'none';
    }
  }

  _onTikTokAction(e) {
    const data = e.detail;
    if (!data) return;

    const nickname = data.user?.nickname || 'Khán giả';
    const action = data.actionType;

    if (action === 'BOW') {
      this.showToast(`🙏 ${nickname}: Nam Mô A Di Đà Phật!`);
    } else if (action === 'INCENSE_1' || action === 'INCENSE_3') {
      const n = action === 'INCENSE_3' ? 3 : 1;
      this.showToast(`🕯️ ${nickname} đã thành tâm dâng ${n} nén hương cầu an!`);
    } else if (action === 'BELL') {
      this.showToast(`🔔 ${nickname} đã thỉnh Đại Hồng Chung ngân vang!`);
    } else if (action === 'LANTERN') {
      this.showToast(`🪷 ${nickname} đã thả Đèn Hoa Đăng cầu nguyện!`);
    } else if (action === 'PRAYER_TEXT') {
      const comment = data.payload?.comment || '';
      this.showToast(`📜 ${nickname} cầu an: "${comment}"`);
    } else if (data.payload?.giftName) {
      this.showToast(`✨ ${nickname} đã cúng dường ${data.payload.giftName}! Công đức vô lượng!`);
    }
  }

  // 1. Hoạt động Thắp hương
  openIncenseActivity() {
    this.activityModal.style.display = 'flex';
    this.activityContent.innerHTML = `
      <h2>🙏 Dâng Hương Lễ Phật</h2>
      <p>Thành tâm chắp tay trước Lư Hương Đại Đồng. Hãy chọn số nén tâm hương bạn muốn dâng:</p>
      <div class="btn-row">
        <button class="primary-btn" id="act-incense-1">Thắp 1 Nén Tâm Hương</button>
        <button class="primary-btn" id="act-incense-3">Thắp 3 Nén Tam Bảo</button>
      </div>
      <div class="btn-row">
        <button class="secondary-btn" id="act-close">Đóng</button>
      </div>
    `;
    const doLight = (count) => {
      if (this.sceneManager) this.sceneManager.addIncense(count);
      this.userState.incenseCount += count;
      this.saveData();
      if (this.sound) this.sound.playChime();
      this.closeActivityModal();
      this.showToast(`Bạn đã thành tâm dâng ${count} nén hương. Khói hương quyện tỏa bình an.`);
    };
    document.getElementById('act-incense-1').onclick = () => doLight(1);
    document.getElementById('act-incense-3').onclick = () => doLight(3);
    document.getElementById('act-close').onclick = () => this.closeActivityModal();
  }

  // 2. Hoạt động Thỉnh chuông
  openBellActivity() {
    this.activityModal.style.display = 'flex';
    this.activityContent.innerHTML = `
      <h2>🔔 Thỉnh Đại Hồng Chung</h2>
      <p>Chạm vào quả chuông <b>đúng lúc vòng sáng co lại trùng khít vòng nét đứt</b> để chuông ngân vang thanh thoát.</p>
      <div class="rhythm-arena" id="bell-tap-zone">
        <div class="target-ring"></div>
        <div class="shrinking-ring" id="bell-ring"></div>
        <div class="center-instrument">🔔</div>
      </div>
      <div class="rhythm-feedback" id="bell-feedback">Chạm vào chuông khi vòng sáng trùng khít!</div>
      <div class="btn-row">
        <button class="secondary-btn" id="act-close">Đóng</button>
      </div>
    `;
    const ringEl = document.getElementById('bell-ring');
    const fbEl = document.getElementById('bell-feedback');
    let scale = 1.9;
    let animId = null;

    const updateRing = () => {
      scale -= 0.014;
      if (scale < 0.65) scale = 1.9;
      if (ringEl) {
        ringEl.style.width = `${scale * 110}px`;
        ringEl.style.height = `${scale * 110}px`;
      }
      animId = requestAnimationFrame(updateRing);
    };
    animId = requestAnimationFrame(updateRing);

    document.getElementById('bell-tap-zone').onclick = () => {
      const diff = Math.abs(scale - 1.0);
      if (diff < 0.18) {
        if (this.sound) this.sound.playBell(0.65, 5.2);
        if (this.sceneManager) this.sceneManager.ringBell();
        fbEl.textContent = "✨ Chuông ngân viên mãn! Lòng người lắng dịu.";
        this.userState.bellCount++;
        this.saveData();
      } else if (diff < 0.35) {
        if (this.sound) this.sound.playBell(0.35, 3.2);
        fbEl.textContent = "🔔 Tiếng chuông vang nhẹ (Hãy căn sát vòng hơn)";
      } else {
        if (this.sound) this.sound.playWoodenFish(0.7);
        fbEl.textContent = "Chưa đúng nhịp, hãy hít thở sâu và thử lại nhé!";
      }
      scale = 1.9;
    };

    this.activeRhythmCleanup = () => cancelAnimationFrame(animId);
    document.getElementById('act-close').onclick = () => this.closeActivityModal();
  }

  // 3. Hoạt động Gõ mõ tụng kinh (30 giây)
  openWoodenFishActivity() {
    this.activityModal.style.display = 'flex';
    this.activityContent.innerHTML = `
      <h2>📿 Gõ Mõ Tụng Kinh (30s)</h2>
      <p>Chạm vào mõ gỗ theo nhịp vòng sáng thu về để giữ tâm an định.</p>
      <div style="display:flex; justify-content:space-around; font-size:14px; font-weight:700; color:#ffd978;">
        <span id="mo-timer">Thời gian: 30s</span>
        <span id="mo-score">Tâm an: 0</span>
      </div>
      <div class="rhythm-arena" id="mo-tap-zone">
        <div class="target-ring"></div>
        <div class="shrinking-ring" id="mo-ring"></div>
        <div class="center-instrument">🪵</div>
      </div>
      <div class="rhythm-feedback" id="mo-feedback">Chạm vào mõ để bắt đầu nhịp đầu tiên!</div>
      <div class="btn-row">
        <button class="secondary-btn" id="act-close">Kết thúc sớm</button>
      </div>
    `;

    const ringEl = document.getElementById('mo-ring');
    const fbEl = document.getElementById('mo-feedback');
    const timerEl = document.getElementById('mo-timer');
    const scoreEl = document.getElementById('mo-score');

    let timeLeft = 30;
    let hits = 0, totalScore = 0;
    let ringScale = 1.85;
    let animId = null;
    let finished = false;

    const loop = () => {
      if (finished) return;
      ringScale -= 0.018;
      if (ringScale < 0.65) ringScale = 1.85;
      if (ringEl) {
        ringEl.style.width = `${ringScale * 110}px`;
        ringEl.style.height = `${ringScale * 110}px`;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const secInterval = setInterval(() => {
      timeLeft--;
      if (timerEl) timerEl.textContent = `Thời gian: ${timeLeft}s`;
      if (timeLeft <= 0) finishGame();
    }, 1000);

    const finishGame = () => {
      finished = true;
      cancelAnimationFrame(animId);
      clearInterval(secInterval);
      const finalScore = hits === 0 ? 50 : Math.min(100, Math.round((totalScore / (hits * 10)) * 100));
      if (finalScore > this.userState.bestTamAnScore) {
        this.userState.bestTamAnScore = finalScore;
        this.saveData();
      }
      let praise = "Nhịp mõ đều đặn, lòng người thanh thản như mây trắng giữa trời.";
      if (finalScore >= 85) praise = "Tâm bạn thật tĩnh lặng và sáng trong. Tiếng mõ ngân đều như hơi thở an nhiên!";
      else if (finalScore < 60) praise = "Dù nhịp mõ đôi lúc nhanh chậm, chỉ cần lòng hướng thiện là tâm đã thêm phần an ổn.";

      this.activityContent.innerHTML = `
        <h2>🪷 Hoàn Thành Thời Kinh Ngắn</h2>
        <div class="fortune-card">
          <h3>Điểm Tâm An: ${finalScore} / 100</h3>
          <p>${praise}</p>
        </div>
        <div class="btn-row">
          <button class="primary-btn" id="close-mo-done">Hoan hỷ khép lại</button>
        </div>
      `;
      if (this.sound) this.sound.playChime();
      document.getElementById('close-mo-done').onclick = () => this.closeActivityModal();
    };

    document.getElementById('mo-tap-zone').onclick = () => {
      if (finished) return;
      if (this.sound) this.sound.playWoodenFish(1.0);
      if (this.sceneManager) this.sceneManager.tapWoodenFish();
      const diff = Math.abs(ringScale - 1.0);
      hits++;
      if (diff < 0.18) {
        totalScore += 10;
        fbEl.textContent = "🪷 Tĩnh tâm! (+10)";
      } else if (diff < 0.36) {
        totalScore += 7;
        fbEl.textContent = "✨ Được (+7)";
      } else {
        totalScore += 3;
        fbEl.textContent = "🍃 Lệch nhịp (+3)";
      }
      const normalized = Math.min(100, Math.round((totalScore / Math.max(1, hits * 10)) * 100));
      if (scoreEl) scoreEl.textContent = `Tâm an: ${normalized}`;
      ringScale = 1.85;
    };

    this.activeRhythmCleanup = () => {
      finished = true;
      cancelAnimationFrame(animId);
      clearInterval(secInterval);
    };
    document.getElementById('act-close').onclick = () => this.closeActivityModal();
  }

  // 4. Hoạt động Viết lời cầu an
  openPrayerActivity() {
    this.activityModal.style.display = 'flex';
    this.activityContent.innerHTML = `
      <h2>🏮 Viết Lời Cầu An</h2>
      <p>Gửi gắm lời chúc bình an, sức khỏe, học hành hoặc gia đạo (tối đa 120 ký tự):</p>
      <textarea id="prayer-input" class="textarea-input" rows="3" maxlength="120" placeholder="Ví dụ: Cầu mong cha mẹ luôn mạnh khỏe, cả nhà thuận hòa bình an..."></textarea>
      <div class="btn-row">
        <button class="primary-btn" id="btn-hang-silk">🎀 Treo dải lụa lên Cây Bồ Đề</button>
        <button class="primary-btn" id="btn-drop-lantern">🪷 Thả đèn hoa đăng Hồ Sen</button>
      </div>
      <div class="btn-row">
        <button class="secondary-btn" id="act-close">Đóng</button>
      </div>
    `;
    const submitPrayer = (type) => {
      const raw = document.getElementById('prayer-input').value.trim();
      if (!raw) {
        this.showToast("Bạn hãy viết vài lời chúc trước khi gửi nhé!");
        return;
      }
      const cleaned = this.filterProfanity(raw);
      this.userState.prayers.unshift({
        text: cleaned,
        type,
        date: new Date().toLocaleDateString('vi-VN')
      });
      this.saveData();
      if (this.sound) this.sound.playChime();

      if (type === 'silk') {
        if (this.sceneManager) this.sceneManager.hangSilkRibbon();
        this.showToast("🎀 Dải lụa đỏ ghi lời cầu an của bạn đã được treo lên Cây Bồ Đề!");
      } else {
        if (this.sceneManager) this.sceneManager.dropLotusLantern();
        this.showToast("🪷 Chiếc đèn hoa đăng mang lời cầu an đã được thả xuống Hồ Sen!");
      }
      this.closeActivityModal();
    };
    document.getElementById('btn-hang-silk').onclick = () => submitPrayer('silk');
    document.getElementById('btn-drop-lantern').onclick = () => submitPrayer('lantern');
    document.getElementById('act-close').onclick = () => this.closeActivityModal();
  }

  // 5. Hoạt động Xin quẻ đầu năm
  openFortuneActivity() {
    this.activityModal.style.display = 'flex';
    this.activityContent.innerHTML = `
      <h2>🎋 Xin Quẻ Đầu Năm</h2>
      <p>Chạm nút bên dưới (hoặc chạm giữ) để lắc ống xăm và đón nhận một lời chúc thiện lành.</p>
      <div style="font-size:56px; margin:14px 0;" id="tube-icon">🎋</div>
      <div class="btn-row">
        <button class="primary-btn" id="btn-shake-fortune">Lắc Ống Xăm Cầu Lộc Lành</button>
        <button class="secondary-btn" id="act-close">Đóng</button>
      </div>
      <div class="disclaimer-note">Mang tính giải trí • Gieo lời chúc tích cực đầu năm</div>
    `;

    document.getElementById('btn-shake-fortune').onclick = () => {
      if (this.sound) this.sound.playShakeStick();
      const icon = document.getElementById('tube-icon');
      if (icon) icon.classList.add('shake-screen');

      setTimeout(() => {
        const pick = FORTUNE_QUOTES[Math.floor(Math.random() * FORTUNE_QUOTES.length)];
        this.userState.fortunes.unshift({
          title: pick.title,
          text: pick.text,
          date: new Date().toLocaleDateString('vi-VN')
        });
        this.saveData();
        if (this.sound) this.sound.playChime();

        this.activityContent.innerHTML = `
          <h2>🎋 Thẻ Quẻ Của Bạn</h2>
          <div class="fortune-card">
            <h3>${pick.title}</h3>
            <p>“${pick.text}”</p>
          </div>
          <div class="disclaimer-note">Mang tính giải trí • Chúc bạn một năm an vui, vạn sự hanh thông</div>
          <div class="btn-row">
            <button class="primary-btn" id="btn-share-fortune">🖼️ Chia sẻ thẻ cầu an</button>
            <button class="secondary-btn" id="act-close-f">Đóng</button>
          </div>
        `;
        document.getElementById('btn-share-fortune').onclick = () => this.openShareModal();
        document.getElementById('act-close-f').onclick = () => this.closeActivityModal();
      }, 500);
    };
    document.getElementById('act-close').onclick = () => this.closeActivityModal();
  }

  // Sổ Cầu An
  openNotebookModal() {
    this.activityModal.style.display = 'flex';
    const prayersHtml = this.userState.prayers.map(p =>
      `<div class="notebook-item">${p.type === 'silk' ? '🎀' : '🪷'} <b>${p.text}</b> <span style="opacity:0.65;font-size:11px;">(${p.date})</span></div>`
    ).join('') || '<div class="notebook-item">Chưa có lời cầu an nào.</div>';

    const fortunesHtml = this.userState.fortunes.map(f =>
      `<div class="notebook-item">🎋 <b>${f.title}:</b> ${f.text}</div>`
    ).join('') || '<div class="notebook-item">Bạn chưa xin quẻ đầu năm nào.</div>';

    this.activityContent.innerHTML = `
      <h2>📖 Sổ Cầu An Của ${this.userState.playerName}</h2>
      <p>Nén hương đã thắp: <b>${this.userState.incenseCount}</b> • Điểm Tâm an cao nhất: <b>${this.userState.bestTamAnScore}/100</b></p>
      <div style="text-align:left; font-size:13px; font-weight:700; color:var(--gold); margin-bottom:4px;">Lời cầu an đã gửi:</div>
      <div class="notebook-list">${prayersHtml}</div>
      <div style="text-align:left; font-size:13px; font-weight:700; color:var(--gold); margin-bottom:4px;">Quẻ lành đã nhận:</div>
      <div class="notebook-list">${fortunesHtml}</div>
      <div class="btn-row">
        <button class="primary-btn" id="nb-share">🖼️ Tạo Ảnh Chia Sẻ</button>
        <button class="secondary-btn" id="nb-close">Đóng</button>
      </div>
    `;
    document.getElementById('nb-share').onclick = () => this.openShareModal();
    document.getElementById('nb-close').onclick = () => this.closeActivityModal();
  }

  // Tạo Thiệp Chia Sẻ Canvas 1080x1350
  openShareModal() {
    this.activityModal.style.display = 'flex';
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 1350);
    grad.addColorStop(0, '#2a130d');
    grad.addColorStop(0.55, '#471e12');
    grad.addColorStop(1, '#1a0b07');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Vẽ cảnh 3D hiện tại
    if (this.sceneManager && this.sceneManager.renderer) {
      try {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(70, 130, 940, 560, 28);
        ctx.clip();
        ctx.drawImage(this.sceneManager.renderer.domElement, 0, 0, this.sceneManager.renderer.domElement.width, this.sceneManager.renderer.domElement.height, 70, 130, 940, 560);
        ctx.restore();
      } catch (e) {}
    }

    ctx.strokeStyle = '#f6c967';
    ctx.lineWidth = 6;
    ctx.strokeRect(36, 36, 1008, 1278);

    ctx.fillStyle = '#f6c967';
    ctx.font = 'bold 46px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪷 CHÙA AN LẠC • LÊN CHÙA CẦU AN 🪷', 540, 100);

    ctx.fillStyle = 'rgba(255, 245, 222, 0.95)';
    ctx.beginPath();
    ctx.roundRect(70, 730, 940, 440, 26);
    ctx.fill();
    ctx.strokeStyle = '#b52b1d';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#8c2318';
    ctx.font = 'bold 38px system-ui, sans-serif';
    ctx.fillText(`Người cầu an: ${this.userState.playerName}`, 540, 805);

    const latestPrayer = this.userState.prayers[0]?.text || "Cầu mong gia đình bình an, sức khỏe dồi dào, tâm luôn an lạc.";
    ctx.fillStyle = '#2c1408';
    ctx.font = 'italic 34px system-ui, sans-serif';

    const words = latestPrayer.split(' ');
    let line = '', y = 885;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + ' ';
      if (ctx.measureText(test).width > 820 && i > 0) {
        ctx.fillText(line.trim(), 540, y);
        line = words[i] + ' ';
        y += 48;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), 540, y);

    ctx.fillStyle = '#9e4710';
    ctx.font = 'bold 32px system-ui, sans-serif';
    const tamAn = this.userState.bestTamAnScore || 88;
    ctx.fillText(`✨ Điểm Tâm An: ${tamAn}/100   •   🙏 Đã dâng: ${this.userState.incenseCount} nén hương`, 540, 1065);

    ctx.fillStyle = '#f6c967';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('Lên Chùa Cầu An — Không Gian Tịnh Tâm 3D', 540, 1245);
    ctx.fillStyle = '#d8c3a5';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText('Tâm thành hướng thiện • Bình an tự khắc tìm về', 540, 1285);

    const dataUrl = canvas.toDataURL('image/png');
    this.activityContent.innerHTML = `
      <h2>🖼️ Thiệp Cầu An (1080×1350)</h2>
      <img id="share-preview-img" src="${dataUrl}" alt="Thiệp cầu an" />
      <div class="btn-row">
        <button class="primary-btn" id="btn-do-share">📤 Chia sẻ / Tải ảnh về máy</button>
        <button class="secondary-btn" id="btn-close-share">Đóng</button>
      </div>
    `;

    document.getElementById('btn-do-share').onclick = async () => {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'len-chua-cau-an.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Lên Chùa Cầu An',
              text: `Lời cầu an của ${this.userState.playerName} tại Chùa An Lạc`,
              files: [file]
            });
            return;
          } catch (err) {}
        }
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'thiep-len-chua-cau-an.png';
        a.click();
        this.showToast("Đã tải ảnh Thiệp Cầu An (1080×1350) về thiết bị của bạn!");
      }, 'image/png');
    };
    document.getElementById('btn-close-share').onclick = () => this.closeActivityModal();
  }
}
