/**
 * TempleActivities.js - Quản lý 5 Hoạt Động Tâm Linh Cầu An
 * 1. Thắp hương (1 hoặc 3 nén)
 * 2. Thỉnh Đại Hồng Chung (Căn vòng sáng co lại)
 * 3. Gõ mõ 30 giây (Chấm điểm Tâm An)
 * 4. Viết lời Cầu An/Cầu Siêu (Treo lụa Bồ Đề / Thả đèn Hồ Sen)
 * 5. Xin quẻ đầu năm (40 câu chúc thiện lành)
 */

export class TempleActivities {
  constructor(options = {}) {
    this.audioSynth = options.audioSynth || null;
    this.playerController = options.playerController || null;
    this.vfxManager = options.vfxManager || null;
    this.templeWorld = options.templeWorld || null;
    this.onStateChange = options.onStateChange || null;

    // Trạng thái mini-game gõ mõ
    this.moTimer = null;
    this.moTimeLeft = 30;
    this.moHits = 0;
    this.moScore = 0;
    this.isMoPlaying = false;
    this.targetBeatInterval = 1000; // 1 giây 1 nhịp
    this.lastHitTime = 0;

    // Trạng thái thỉnh chuông
    this.bellRingScale = 1.0;
    this.bellAnimFrame = null;
    this.isBellActive = false;

    // Danh sách 40 quẻ thiện lành đầu năm
    this.fortuneList = this.initFortuneList();
  }

  // ==========================================
  // 1. THẮP HƯƠNG (CÚNG DƯỜNG TÂM HƯƠNG)
  // ==========================================
  lightIncense(count = 3, devoteeName = 'Phật Tử') {
    // 1. Âm thanh chuông gia trì ngân nhẹ
    if (this.audioSynth) {
      this.audioSynth.playSingingBowl(540);
    }

    // 2. Nhân vật cúi lễ lạy
    if (this.playerController) {
      this.playerController.setAnimation('BOW', 3000);
    }

    // 3. Hiệu ứng hạt khói hương bốc cao trong 3D
    if (this.vfxManager) {
      this.vfxManager.triggerShockwave({ x: 0, y: 1.5, z: 2 }, '#ffd166');
      if (this.vfxManager.incenseSmoke) {
        // Tăng độ đậm và bốc cao của khói
        const mat = this.vfxManager.incenseSmoke.material;
        mat.opacity = Math.min(0.9, mat.opacity + 0.15);
      }
    }

    // 4. Lưu trạng thái
    const currentIncense = parseInt(localStorage.getItem('np_incense_count') || '0', 10) + count;
    const currentMerit = parseInt(localStorage.getItem('np_merit_points') || '0', 10) + count * 5;
    localStorage.setItem('np_incense_count', currentIncense.toString());
    localStorage.setItem('np_merit_points', currentMerit.toString());

    if (this.onStateChange) {
      this.onStateChange({
        type: 'LIGHT_INCENSE',
        count: count,
        totalIncense: currentIncense,
        totalMerit: currentMerit
      });
    }

    return {
      success: true,
      count: count,
      message: `${devoteeName} đã thành tâm thắp ${count} nén tâm hương dâng lên Tam Bảo.`
    };
  }

  // ==========================================
  // 2. THỈNH ĐẠI HỒNG CHUNG
  // ==========================================
  startBellMiniGame(ringElement, onHitCallback) {
    this.isBellActive = true;
    let scale = 2.0;
    let speed = 0.022;

    const loop = () => {
      if (!this.isBellActive) return;
      scale -= speed;
      if (scale < 0.6) {
        scale = 2.0; // Vòng lặp co lại
      }

      this.bellRingScale = scale;
      if (ringElement) {
        ringElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
        const diff = Math.abs(scale - 1.0);
        if (diff < 0.12) {
          ringElement.style.borderColor = '#00ff88';
          ringElement.style.boxShadow = '0 0 25px #00ff88';
        } else {
          ringElement.style.borderColor = '#ffd700';
          ringElement.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
        }
      }

      this.bellAnimFrame = requestAnimationFrame(loop);
    };

    if (this.bellAnimFrame) cancelAnimationFrame(this.bellAnimFrame);
    this.bellAnimFrame = requestAnimationFrame(loop);
  }

  strikeBell() {
    if (!this.isBellActive) return null;

    const diff = Math.abs(this.bellRingScale - 1.0);
    let rating = 'Lệch Nhịp';
    let meritBonus = 2;

    if (diff < 0.08) {
      rating = 'Thấu Triệt (Tuyệt Vời!)';
      meritBonus = 15;
    } else if (diff < 0.2) {
      rating = 'Thanh Thoát (Tốt)';
      meritBonus = 8;
    }

    // Âm thanh Đại hồng chung trầm hùng ngân dài
    if (this.audioSynth) {
      this.audioSynth.playGreatBell();
    }

    // Nhân vật cúi lễ
    if (this.playerController) {
      this.playerController.setAnimation('BOW', 2000);
    }

    // Hiệu ứng sóng âm lan tỏa
    if (this.vfxManager) {
      const gTowerPos = { x: -25, y: 0, z: 0 };
      this.vfxManager.triggerShockwave(gTowerPos, '#ffd700');
    }

    // Lưu công đức
    const currentMerit = parseInt(localStorage.getItem('np_merit_points') || '0', 10) + meritBonus;
    localStorage.setItem('np_merit_points', currentMerit.toString());

    return {
      rating: rating,
      diff: diff,
      meritBonus: meritBonus
    };
  }

  stopBellMiniGame() {
    this.isBellActive = false;
    if (this.bellAnimFrame) {
      cancelAnimationFrame(this.bellAnimFrame);
      this.bellAnimFrame = null;
    }
  }

  // ==========================================
  // 3. GÕ MÕ TỤNG KINH (30 GIÂY CHẤM TÂM AN)
  // ==========================================
  startWoodenFishSession(onTick, onComplete) {
    this.isMoPlaying = true;
    this.moTimeLeft = 30;
    this.moHits = 0;
    this.moScore = 0;
    this.lastHitTime = 0;

    if (this.moTimer) clearInterval(this.moTimer);

    this.moTimer = setInterval(() => {
      this.moTimeLeft--;
      if (onTick) onTick(this.moTimeLeft, this.moScore);

      if (this.moTimeLeft <= 0) {
        this.finishWoodenFishSession(onComplete);
      }
    }, 1000);
  }

  tapWoodenFish() {
    if (!this.isMoPlaying) return { rating: 'Chưa bắt đầu', score: 0 };

    const now = performance.now();
    let rating = 'Bình Hòa';
    let addedScore = 2;

    if (this.lastHitTime > 0) {
      const delta = now - this.lastHitTime;
      const error = Math.abs(delta - this.targetBeatInterval);

      if (error < 150) {
        rating = 'Tâm Tĩnh Nhập Định (+5)';
        addedScore = 5;
      } else if (error < 300) {
        rating = 'Thuận Nhịp Thanh Thản (+3)';
        addedScore = 3;
      } else {
        rating = 'Hơi Nhanh/Chậm (+1)';
        addedScore = 1;
      }
    } else {
      rating = 'Khởi Nhịp (+3)';
      addedScore = 3;
    }

    this.lastHitTime = now;
    this.moHits++;
    this.moScore = Math.min(100, this.moScore + addedScore);

    // Âm thanh mõ
    if (this.audioSynth) {
      this.audioSynth.playWoodenFish();
    }

    // Hiệu ứng nhẹ
    if (this.playerController && this.playerController.currentAction === 'IDLE') {
      this.playerController.setAnimation('BOW', 400);
    }

    return {
      rating: rating,
      score: this.moScore,
      hits: this.moHits
    };
  }

  finishWoodenFishSession(onComplete) {
    this.isMoPlaying = false;
    if (this.moTimer) {
      clearInterval(this.moTimer);
      this.moTimer = null;
    }

    // Chuông kết thúc
    if (this.audioSynth) {
      this.audioSynth.playSingingBowl(580);
    }

    // Đánh giá tâm an
    let evaluation = '';
    if (this.moScore >= 80) {
      evaluation = 'Tâm Như Mặt Nước Phẳng Lặng, Vạn Niệm Tiêu Trừ';
    } else if (this.moScore >= 50) {
      evaluation = 'Tâm Đang Dần Thanh Tịnh, Bớt Đi Nỗi Phiền Muộn';
    } else {
      evaluation = 'Hãy Hít Thở Sâu, Buông Xả Âu Lo Để Tìm Lại Sự An Yên';
    }

    // Lưu điểm cao nhất
    const bestScore = Math.max(parseInt(localStorage.getItem('np_tam_an_score') || '0', 10), this.moScore);
    localStorage.setItem('np_tam_an_score', bestScore.toString());

    if (onComplete) {
      onComplete({
        score: this.moScore,
        hits: this.moHits,
        evaluation: evaluation
      });
    }
  }

  // ==========================================
  // 4. VIẾT LỜI CẦU AN / CẦU SIÊU
  // ==========================================
  submitPrayer(prayerData) {
    // prayerData = { sender, targetName, content, type: 'BODE' | 'HOSEN' }
    const filteredContent = this.filterBadWords(prayerData.content || '');

    const prayer = {
      id: Date.now(),
      sender: prayerData.sender || 'Phật Tử',
      targetName: prayerData.targetName || 'Gia quyến',
      content: filteredContent,
      type: prayerData.type || 'BODE',
      createdAt: new Date().toLocaleDateString('vi-VN')
    };

    // Lưu danh sách lời cầu vào localStorage
    const prayers = JSON.parse(localStorage.getItem('np_prayers_list') || '[]');
    prayers.unshift(prayer);
    if (prayers.length > 30) prayers.pop(); // Giữ tối đa 30 lời cầu
    localStorage.setItem('np_prayers_list', JSON.stringify(prayers));

    // Kích hoạt hiệu ứng trong 3D
    if (prayer.type === 'HOSEN') {
      // Thả đèn hoa đăng trôi hồ sen
      if (this.templeWorld) {
        this.templeWorld.spawnFloatingLantern(prayer.sender);
      }
      if (this.audioSynth) this.audioSynth.playSingingBowl(560);
    } else {
      // Treo dải lụa đỏ cây Bồ Đề
      if (this.vfxManager) {
        this.vfxManager.triggerShockwave({ x: 25, y: 2, z: 0 }, '#ff4757');
      }
      if (this.audioSynth) this.audioSynth.playVajraBell();
    }

    if (this.playerController) {
      this.playerController.setAnimation('BOW', 3000);
    }

    const currentMerit = parseInt(localStorage.getItem('np_merit_points') || '0', 10) + 10;
    localStorage.setItem('np_merit_points', currentMerit.toString());

    return prayer;
  }

  filterBadWords(text) {
    const blackList = ['đm', 'dm', 'vcl', 'cl', 'lon', 'cac', 'buoi', 'ngu', 'cho', 'chet'];
    let res = text;
    blackList.forEach((word) => {
      const reg = new RegExp(word, 'gi');
      res = res.replace(reg, '***');
    });
    return res;
  }

  // ==========================================
  // 5. XIN QUẺ ĐẦU NĂM (40 CÂU THIỆN LÀNH)
  // ==========================================
  drawFortuneStick() {
    const idx = Math.floor(Math.random() * this.fortuneList.length);
    const fortune = this.fortuneList[idx];

    // Âm thanh chuông gia trì ngân nhẹ
    if (this.audioSynth) {
      this.audioSynth.playSingingBowl(620);
    }

    // Nhân vật bái lạy tạ ơn
    if (this.playerController) {
      this.playerController.setAnimation('BOW', 2500);
    }

    // Lưu quẻ gần nhất
    localStorage.setItem('np_last_fortune', JSON.stringify(fortune));

    return fortune;
  }

  initFortuneList() {
    const list = [
      { id: 1, title: 'Thượng Thượng Quẻ - Vạn Sự Cát Tường', poem: 'Tâm an cảnh hóa thong dong,\nĐức dày phúc rộng hanh thông tháng ngày.', meaning: 'Lòng từ bi mở rộng, việc lành kết trái ngọt, công việc thuận buồm xuôi gió.' },
      { id: 2, title: 'Thượng Cát Quẻ - Bồ Đề Đơm Hoa', poem: 'Trồng cây phúc đức tháng năm,\nNay hoa thơm ngát bóng râm chở che.', meaning: 'Gia đạo êm ấm, việc thiện ngày trước nay mang lại sự che chở bình an.' },
      { id: 3, title: 'Cát Quẻ - Tùy Duyên Hạnh Ngộ', poem: 'Gió lành đưa bước tao phùng,\nNgười hiền bạn tốt tương phùng chung tay.', meaning: 'Gặp gỡ quý nhân giúp đỡ, mở rộng tình thân ái.' },
      { id: 4, title: 'Đại Cát Quẻ - Liên Hoa Tịnh Thể', poem: 'Gần bùn chẳng chút bụi trần,\nTâm sen tỏa ngát xa gần mười phương.', meaning: 'Giữ tâm thuần khiết vượt qua mọi thị phi và hiểu lầm.' },
      { id: 5, title: 'Bình An Quẻ - Thong Dong Tự Tại', poem: 'Sớm đón nắng mai chan hòa,\nChiều buông gánh nặng bước qua muộn phiền.', meaning: 'Buông bỏ chấp niệm, cuộc sống thảnh thơi an nhàn.' },
      { id: 6, title: 'Thượng Cát Quẻ - Phật Quang Tiếp Dẫn', poem: 'Đèn tâm thắp sáng muôn phương,\nBao nhiêu chướng ngại nhường đường bước đi.', meaning: 'Trí tuệ sáng tỏ, vượt qua mọi ngã rẽ khó khăn.' },
      { id: 7, title: 'Thiện Duyên Quẻ - Ý Hợp Tâm Đầu', poem: 'Một câu hòa ái trao nhau,\nMuôn đời ấm áp thắm màu nghĩa nhân.', meaning: 'Tình cảm gia đình và bạn bè ngày một gắn kết keo sơn.' },
      { id: 8, title: 'Thịnh Vượng Quẻ - Phúc Thọ Song Toàn', poem: 'Tích thiện thì phước có dư,\nAn vui khỏe mạnh thiên thu thái bình.', meaning: 'Sức khỏe dồi dào, tâm hồn trẻ trung an vui.' },
      { id: 9, title: 'Hóa Giải Quẻ - Mưa Lành Nắng Ấm', poem: 'Qua cơn bão tố phong ba,\nBầu trời trong sáng chan hòa ánh dương.', meaning: 'Những trắc trở sắp qua đi, bình an chuẩn bị tới.' },
      { id: 10, title: 'Thanh Tịnh Quẻ - Suối Nguồn Tươi Mát', poem: 'Nước trong soi bóng trăng vàng,\nTâm không vướng bận nhẹ nhàng thênh thang.', meaning: 'Thân tâm nhẹ nhõm, giấc ngủ an lành.' },
      { id: 11, title: 'Trí Huệ Quẻ - Soi Đường Chỉ Lối', poem: 'Học sâu hiểu rộng lòng khiêm,\nViệc chi cũng thấu việc chi cũng tường.', meaning: 'Thi cử học hành hoặc nghiên cứu đạt thành quả tốt.' },
      { id: 12, title: 'Nhẫn Nại Quẻ - Đá Mòn Biển Cạn', poem: 'Nhẫn một chút sóng yên gió lặng,\nLùi một bước biển rộng trời cao.', meaning: 'Giữ thái độ điềm tĩnh sẽ giải quyết êm đẹp mọi mâu thuẫn.' },
      { id: 13, title: 'Hỷ Lạc Quẻ - Tin Vui Tới Cửa', poem: 'Gió xuân đưa én về ngàn,\nTin mừng đưa tới rộn ràng cội mai.', meaning: 'Gia đạo sắp đón tin hỷ hoặc thành viên mới an lành.' },
      { id: 14, title: 'Từ Bi Quẻ - Ban Rải Yêu Thương', poem: 'Thương người như thể thương thân,\nCho đi là nhận muôn phần an vui.', meaning: 'Làm việc thiện nguyện giúp tâm hồn ấm áp lạ thường.' },
      { id: 15, title: 'Viên Mãn Quẻ - Trăng Tròn Đầu Tháng', poem: 'Vầng trăng vằng vặc trời đêm,\nChiếu soi muôn dặm êm đềm bình yên.', meaning: 'Dự định ấp ủ lâu nay đang dần đi đến kết quả mỹ mãn.' },
      { id: 16, title: 'Vững Chãi Quẻ - Khí Phách Tùng Bách', poem: 'Mặc cho sương tuyết lạnh lùng,\nCây tùng đứng vững giữa vùng non cao.', meaning: 'Ý chí kiên định giúp bạn đứng vững trước thử thách.' },
      { id: 17, title: 'Hiếu Thuận Quẻ - Cội Nguồn Ấm Êm', poem: 'Ơn cha nghĩa mẹ khắc ghi,\nĐạo hiền giữ trọn bước đi rạng ngời.', meaning: 'Chăm sóc cha mẹ bề trên mang lại phúc báo lớn lao.' },
      { id: 18, title: 'Bao Dung Quẻ - Biển Rộng Chứa Sông', poem: 'Bao dung độ lượng bao la,\nOán hờn tan biến chan hòa niềm vui.', meaning: 'Tha thứ cho lỗi lầm của người khác là tự giải thoát cho chính mình.' },
      { id: 19, title: 'Tinh Tấn Quẻ - Siêng Năng Học Hỏi', poem: 'Mỗi ngày góp một giọt sương,\nNgày mai gom lại cả phương hoa ngời.', meaning: 'Cần cù kiên trì từng ngày tạo nên thành quả bền vững.' },
      { id: 20, title: 'Bình Tâm Quẻ - Không Gian Tĩnh Lặng', poem: 'Ngồi nghe tiếng suối reo vui,\nQuên đi danh lợi ngủ vùi giấc say.', meaning: 'Tận hưởng khoảnh khắc hiện tại, không lo xa nghĩ ngợi.' },
      { id: 21, title: 'Phước Duyên Quẻ - Trái Ngọt Vườn Xanh', poem: 'Xuân qua hoa nở ngập tràn,\nHạt lành xưa gieo nay ngàn quả thơm.', meaning: 'Thành quả lao động chân chính bắt đầu đem lại no ấm.' },
      { id: 22, title: 'Khởi Sắc Quẻ - Bình Minh Tươi Sáng', poem: 'Đêm đen rồi cũng qua mau,\nÁnh hồng rực rỡ muôn màu lung linh.', meaning: 'Khởi đầu mới tràn đầy sức sống và hy vọng.' },
      { id: 23, title: 'Thuận Hòa Quẻ - Nhịp Cầu Tri Âm', poem: 'Gặp gỡ tri kỷ tâm giao,\nĐồng lòng chung sức việc nào chẳng xong.', meaning: 'Hợp tác làm ăn hoặc làm việc nhóm đạt hiệu quả cao.' },
      { id: 24, title: 'Tiêu Diêu Quẻ - Cánh Hạc Trời Mây', poem: 'Mây trôi nước chảy lững lờ,\nSống đời tỉnh thức từng giờ thảnh thơi.', meaning: 'Tâm hồn tự do, không bị ràng buộc bởi được mất.' },
      { id: 25, title: 'Đức Trọng Quẻ - Uy Danh Lan Xa', poem: 'Sống đời trung thực thật thà,\nNgười người quý mến gần xa ngợi khen.', meaning: 'Uy tín cá nhân được củng cố vững chắc.' },
      { id: 26, title: 'Tịnh Tâm Quẻ - Đèn Thiền Tỏa Sáng', poem: 'Lắng nghe từng nhịp thở sâu,\nMuộn phiền tan biến chẳng âu lo gì.', meaning: 'Thực hành thiền định giúp phục hồi năng lượng sống.' },
      { id: 27, title: 'Ấm No Quẻ - Mùa Vàng Bội Thu', poem: 'Ruộng cày chăm chút sớm trưa,\nĐến ngày lúa chín gió đưa hương nồng.', meaning: 'Tài chính ổn định, tiêu dùng hợp lý.' },
      { id: 28, title: 'Vạn Hạnh Quẻ - May Mắn Mỉm Cười', poem: 'Cơ duyên sắp đặt diệu kỳ,\nBước chân tới đâu cũng tùy duyên may.', meaning: 'Gặp may mắn bất ngờ trong công việc hoặc cuộc sống.' },
      { id: 29, title: 'Lạc Quan Quẻ - Nụ Cười Nở Hoa', poem: 'Một nụ cười hé trên môi,\nBao nhiêu nặng trĩu cuốn trôi theo dòng.', meaning: 'Giữ nụ cười tươi tắn xua tan không khí căng thẳng.' },
      { id: 30, title: 'Tri Túc Quẻ - Biết Đủ Là An', poem: 'Biết đủ lòng chẳng tham cầu,\nNhà tranh vách đất cũng mầu nhiệm thay.', meaning: 'Biết hài lòng với những gì đang có là hạnh phúc chân thật.' },
      { id: 31, title: 'Gắn Kết Quẻ - Vòng Tay Yêu Thương', poem: 'Một nhành hoa gửi muôn phương,\nBắc cầu nhân ái nối đường tương tri.', meaning: 'Mở rộng giao lưu kết bạn thiện lành.' },
      { id: 32, title: 'Vững Tâm Quẻ - Bến Đỗ Bình Yên', poem: 'Dù cho sóng gió biển khơi,\nThuyền về neo đậu giữa nơi an lành.', meaning: 'Gia đình luôn là chốn bình yên vững chắc nhất.' },
      { id: 33, title: 'Khai Mở Quẻ - Tầm Nhìn Bao Quát', poem: 'Lên đỉnh núi ngắm chân mây,\nMới hay trời đất xưa nay rộng dài.', meaning: 'Mở rộng góc nhìn để nhận ra nhiều cơ hội mới.' },
      { id: 34, title: 'Trọn Vẹn Quẻ - Như Ý Cát Tường', poem: 'Tâm lành gieo hạt thiện lương,\nNgày nay kết trái rạng đường cháu con.', meaning: 'Ước nguyện chân chính sắp thành tựu.' },
      { id: 35, title: 'Thong Dong Quẻ - Bước Chân Tỉnh Thức', poem: 'Mỗi bước chân nở đóa sen,\nTâm an vạn sự chẳng phen ngại ngùng.', meaning: 'Đi đứng chậm rãi, tận hưởng sự sống quanh mình.' },
      { id: 36, title: 'Duyên Lành Quẻ - Gặp Bạn Hiền', poem: 'Đồng thanh tương ứng lạ kỳ,\nCùng chung lý tưởng bước đi vững vàng.', meaning: 'Gặp gỡ những người đồng điệu cùng hướng tới điều thiện.' },
      { id: 37, title: 'Ấm Áp Quẻ - Bếp Lửa Nghĩa Tình', poem: 'Bếp hồng sưởi ấm đêm đông,\nMột nhà đoàn tụ thơm nồng bữa cơm.', meaning: 'Bữa cơm gia đình ấm cúng xua tan mệt mỏi.' },
      { id: 38, title: 'An Nhiên Quẻ - Mưa Rơi Ngoài Hiên', poem: 'Mưa rơi tí tách hiên ngoài,\nTrà thơm một tách tháng ngày thảnh thơi.', meaning: 'Dành thời gian chăm sóc sở thích cá nhân.' },
      { id: 39, title: 'Sáng Trong Quẻ - Ngọc Quý Giữa Đời', poem: 'Ngọc càng mài dũa càng trong,\nTâm người trong sáng sạch trong bụi trần.', meaning: 'Phẩm hạnh cao quý được mọi người nể phục.' },
      { id: 40, title: 'Viên Giác Quẻ - Đại Hoan Hỷ', poem: 'Nam Mô Phật Tổ độ trì,\nMuôn phương thanh tịnh từ bi ngập tràn.', meaning: 'Quẻ toàn mỹ: Thân tâm an lạc, phúc thọ tăng long, vạn sự hanh thông.' }
    ];
    return list;
  }
}

