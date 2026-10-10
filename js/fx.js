/* fx.js Canvas 2D 发光粒子系统 + 全局特效函数 */
const $ = (s, r = document) => r.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/* =========================================================================
 * 一、Canvas 2D 发光粒子系统
 * ========================================================================= */
const FX = (function () {
  const cvs = $('#fx');
  const ctx = cvs.getContext('2d', { alpha: true });

  // 设备判定：移动端 / 小屏减少粒子
  const isTouch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
  const isSmall = window.innerWidth < 820;
  const MOBILE = isTouch || isSmall;
  const MAX_P = MOBILE ? 48 : 130;          // 粒子上限
  const DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.6 : 2);

  /* 调色板：0-4 基础色，5-9 为各文章主题专属色 */
  const PALETTE = [
    [34, 224, 255],   // 0 青蓝
    [255, 47, 208],   // 1 品红
    [139, 92, 246],   // 2 紫
    [120, 255, 214],  // 3 薄荷
    [235, 245, 255],  // 4 白
    [255, 64, 96],    // 5 暗红（悬疑）
    [255, 200, 120],  // 6 暖黄（温情）
    [255, 150, 195],  // 7 柔粉（温情）
    [255, 190, 60],   // 8 金橙（冒险）
    [70, 235, 150]    // 9 翠绿（冒险）
  ];
  /* 主题 → 粒子主色索引 + 运动特性 */
  const THEME_CI = {
    'sci-fi':    [0, 2, 3, 4],
    'mystery':   [5, 1, 2, 4],
    'warm':      [6, 7, 4, 3],
    'adventure': [8, 9, 0, 4]
  };
  let theme = 'sci-fi';

  // 预渲染发光精灵（避免使用 shadowBlur，性能更好）
  const SPRITES = PALETTE.map(c => {
    const s = 64, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0.00, rgba(c, 1));
    grd.addColorStop(0.18, rgba(c, 0.75));
    grd.addColorStop(0.45, rgba(c, 0.22));
    grd.addColorStop(1.00, rgba(c, 0));
    g.fillStyle = grd;
    g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); g.fill();
    return cv;
  });

  let W = 0, H = 0;
  const P = [];          // 常驻粒子
  const bits = [];       // 临时爆发 / 汇聚粒子
  const waves = [];      // 冲击波
  const mouse = { x: -9999, y: -9999, active: false };
  let hoverAt = null;    // {x,y} 卡片悬停吸附点
  let suck = null;       // {x,y,until} 强吸引（吸入）
  let warp = 0, warpTarget = 0;
  let t = 0, last = performance.now();

  /* ---------- 尺寸 ---------- */
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    cvs.width = Math.floor(W * DPR);
    cvs.height = Math.floor(H * DPR);
    cvs.style.width = W + 'px';
    cvs.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* ---------- 创建粒子 ---------- */
  function makeP(x, y) {
    return {
      x: x ?? Math.random() * W,
      y: y ?? Math.random() * H,
      px: 0, py: 0,
      vx: (Math.random() - .5) * .6,
      vy: (Math.random() - .5) * .6,
      r: 0.7 + Math.random() * (MOBILE ? 1.6 : 2.3),
      a0: 0.35 + Math.random() * 0.55,
      a: 1,
      ci: Math.random() < .55 ? 0 : (Math.random() < .5 ? 1 : (Math.random() < .5 ? 2 : (Math.random() < .6 ? 3 : 4))),
      ph: Math.random() * Math.PI * 2,
      freq: 0.008 + Math.random() * 0.02
    };
  }
  function initParticles() {
    P.length = 0;
    for (let i = 0; i < MAX_P; i++) P.push(makeP());
  }

  /* ---------- 更新 ---------- */
  function update(dt) {
    t += dt;
    const cx = W / 2, cy = H / 2;
    const suckOn = suck && performance.now() < suck.until;

    for (const p of P) {
      p.px = p.x; p.py = p.y;
      p.ph += 0.012 * dt;

      // 1) 自由漂移（正弦扰动）
      p.vx += Math.cos(p.ph) * 0.020 * dt;
      p.vy += Math.sin(p.ph * 1.3) * 0.020 * dt;

      // 1.5) 文章主题影响粒子运动与闪烁
      if (warp < 0.05) {
        if (theme === 'warm') {                       // 温情：缓慢飘落
          p.vy += 0.011 * dt;
          p.vx += Math.sin(t * 0.02 + p.ph) * 0.014 * dt;
        } else if (theme === 'adventure') {           // 冒险：横向能量流
          p.vx += 0.018 * dt;
        } else if (theme === 'mystery') {             // 悬疑：随机故障闪烁
          if (Math.random() < 0.0035) p.a0 *= 0.25;
          if (Math.random() < 0.0035) p.a0 = Math.min(0.95, p.a0 * 1.6 + 0.05);
        }
      }

      // 2) 鼠标：吸引 + 绕行 + 轻微拖尾
      if (mouse.active && warp < 0.05) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const d2 = dx * dx + dy * dy, R = MOBILE ? 160 : 230;
        if (d2 < R * R && d2 > 4) {
          const d = Math.sqrt(d2), f = 1 - d / R;
          const nx = dx / d, ny = dy / d;
          p.vx += nx * f * 0.30 * dt;
          p.vy += ny * f * 0.30 * dt;
          p.vx += -ny * f * 0.55 * dt;   // 切向绕行
          p.vy += nx * f * 0.55 * dt;
        }
      }

      // 3) 卡片悬停：轻微吸附
      if (hoverAt && warp < 0.05) {
        const dx = hoverAt.x - p.x, dy = hoverAt.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 260) {
          const f = (1 - d / 260) * 0.55;
          p.vx += dx / d * f * dt;
          p.vy += dy / d * f * dt;
        }
      }

      // 4) 点击吸入（进入卡片）：强吸引
      if (suckOn) {
        const dx = suck.x - p.x, dy = suck.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.min(3.2, 240 / d) * 1.15;
        p.vx += dx / d * f * dt;
        p.vy += dy / d * f * dt;
        p.vx *= 0.90; p.vy *= 0.90;
      }

      // 5) 冲击波：环形外推
      for (const w of waves) {
        const dx = p.x - w.x, dy = p.y - w.y;
        const d = Math.hypot(dx, dy) || 1;
        const diff = Math.abs(d - w.r);
        if (diff < w.thick) {
          const f = (1 - diff / w.thick) * (1 - w.r / w.max) * 3.4;
          p.vx += dx / d * f * dt;
          p.vy += dy / d * f * dt;
        }
      }

      // 6) 曲速：从中心向外加速拉伸
      if (warp > 0.02) {
        const dx = p.x - cx, dy = p.y - cy;
        const d = Math.hypot(dx, dy) || 1;
        const f = warp * (0.9 + d / Math.max(W, H) * 6);
        p.vx += dx / d * f * dt;
        p.vy += dy / d * f * dt;
      }

      // 阻尼 + 限速
      const damp = warp > 0.02 ? 0.985 : 0.945;
      p.vx *= damp; p.vy *= damp;
      const sp = Math.hypot(p.vx, p.vy), lim = warp > 0.02 ? 60 : 8;
      if (sp > lim) { p.vx = p.vx / sp * lim; p.vy = p.vy / sp * lim; }

      p.x += p.vx * dt; p.y += p.vy * dt;

      // 越界处理（曲速时从中心重生，形成隧道流）
      const m = 60;
      if (p.x < -m || p.x > W + m || p.y < -m || p.y > H + m) {
        if (warp > 0.4) {
          const ang = Math.random() * Math.PI * 2, rr = Math.random() * 40 + 6;
          p.x = cx + Math.cos(ang) * rr; p.y = cy + Math.sin(ang) * rr;
          p.px = p.x; p.py = p.y;
          p.vx = Math.cos(ang) * (2 + Math.random() * 4);
          p.vy = Math.sin(ang) * (2 + Math.random() * 4);
        } else {
          p.x = (p.x + W + m * 2) % (W + m * 2) - m;
          p.y = (p.y + H + m * 2) % (H + m * 2) - m;
          p.px = p.x; p.py = p.y;
        }
      }
      // 闪烁
      p.a = p.a0 * (0.72 + 0.28 * Math.sin(t * p.freq * 6));
    }

    // 冲击波推进
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i];
      w.r += w.speed * dt;
      if (w.r > w.max) waves.splice(i, 1);
    }

    // 临时粒子
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.life -= dt;
      if (b.mode === 'in') {                    // 汇聚：向目标加速
        const dx = b.tx - b.x, dy = b.ty - b.y;
        const d = Math.hypot(dx, dy) || 1;
        b.vx += dx / d * 1.4 * dt;
        b.vy += dy / d * 1.4 * dt;
        if (d < 14) b.life = Math.min(b.life, 4);
      } else {
        b.vx *= 0.955; b.vy *= 0.955;
      }
      b.px = b.x; b.py = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.life <= 0) bits.splice(i, 1);
    }
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    // 淡出上一帧（保留透明，形成拖尾）
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    // 常驻粒子
    for (const p of P) {
      const c = PALETTE[p.ci], sp = SPRITES[p.ci], size = p.r * 8;
      if (warp > 0.05) {
        // 曲速：拉成星线
        const dx = p.x - p.px, dy = p.y - p.py;
        ctx.globalAlpha = Math.min(1, p.a * (0.5 + warp * 0.6));
        ctx.strokeStyle = rgba(c, 0.55);
        ctx.lineWidth = Math.max(0.8, p.r * 0.85);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x - dx * (1 + warp * 7), p.y - dy * (1 + warp * 7));
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else {
        // 拖尾
        ctx.globalAlpha = p.a * 0.28;
        ctx.strokeStyle = rgba(c, 0.5);
        ctx.lineWidth = Math.max(0.6, p.r * 0.7);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      ctx.globalAlpha = Math.min(1, p.a * (warp > 0.05 ? 0.85 : 1));
      ctx.drawImage(sp, p.x - size / 2, p.y - size / 2, size, size);
    }

    // 临时粒子
    for (const b of bits) {
      const alpha = Math.max(0, b.life / b.ttl);
      const c = PALETTE[b.ci], sp = SPRITES[b.ci], size = b.r * 8;
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = rgba(c, 0.6);
      ctx.lineWidth = Math.max(0.8, b.r * 0.8);
      ctx.beginPath(); ctx.moveTo(b.px, b.py); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.drawImage(sp, b.x - size / 2, b.y - size / 2, size, size);
    }

    // 冲击波环
    for (const w of waves) {
      const k = 1 - w.r / w.max;
      ctx.globalAlpha = k * 0.9;
      ctx.strokeStyle = rgba(PALETTE[w.ci], 0.75 * k);
      ctx.lineWidth = 2.2 * k + 0.4;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = k * 0.35;
      ctx.strokeStyle = rgba(PALETTE[w.ci], 0.35 * k);
      ctx.lineWidth = 10 * k;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 0.94, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- 主循环 ---------- */
  function frame(now) {
    const dt = Math.min(3, (now - last) / 16.667) || 1;
    last = now;
    warp += (warpTarget - warp) * 0.05 * dt;
    if (suck && now > suck.until) suck = null;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  /* ---------- 对外 API ---------- */
  const API = {
    init() {
      resize(); initParticles();
      window.addEventListener('resize', () => { resize(); }, { passive: true });
      // 鼠标 / 触摸
      window.addEventListener('mousemove', e => {
        mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
      }, { passive: true });
      window.addEventListener('mouseleave', () => { mouse.active = false; });
      window.addEventListener('touchmove', e => {
        const tp = e.touches[0];
        if (tp) { mouse.x = tp.clientX; mouse.y = tp.clientY; mouse.active = true; }
      }, { passive: true });
      // 点击冲击波
      window.addEventListener('pointerdown', e => {
        mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
        API.shock(e.clientX, e.clientY);
      }, { passive: true });
      requestAnimationFrame(frame);
    },
    /** 冲击波：粒子向外散开后缓慢恢复 */
    shock(x, y) {
      waves.push({ x, y, r: 6, max: Math.max(W, H) * 0.62, speed: 13, thick: 78, ci: Math.random() < .5 ? 0 : 1 });
      API.burst(x, y, MOBILE ? 10 : 20);
    },
    /** 爆发粒子 */
    burst(x, y, n = 40, ci = null) {
      n = Math.min(n, MOBILE ? 26 : 90);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * (ci === null ? 9 : 6);
        bits.push({
          x, y, px: x, py: y,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          r: 0.8 + Math.random() * 2.2,
          ci: ci ?? (Math.random() < .5 ? 0 : (Math.random() < .5 ? 1 : (Math.random() < .6 ? 2 : 4))),
          life: 40 + Math.random() * 60, ttl: 100, mode: 'out', tx: x, ty: y
        });
      }
    },
    /** 汇聚粒子（吸入卡片） */
    converge(x, y, n = 46) {
      n = Math.min(n, MOBILE ? 22 : 80);
      const R = Math.min(W, H) * 0.55;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, rr = R * (0.45 + Math.random() * 0.55);
        const bx = x + Math.cos(a) * rr, by = y + Math.sin(a) * rr;
        bits.push({
          x: bx, y: by, px: bx, py: by,
          vx: -Math.cos(a) * 3, vy: -Math.sin(a) * 3,
          r: 0.7 + Math.random() * 1.8, ci: Math.random() < .5 ? 0 : (Math.random() < .4 ? 1 : 2),
          life: 40 + Math.random() * 34, ttl: 74, mode: 'in', tx: x, ty: y
        });
      }
    },
    /** 强吸引点（吸入效果），持续 ms */
    suckAt(x, y, ms = 620) { suck = { x, y, until: performance.now() + ms }; },
    /** 卡片悬停吸附点 */
    setHover(x, y) { hoverAt = (x == null) ? null : { x, y }; },
    /** 曲速隧道 0~1 */
    setWarp(v) { warpTarget = v; },
    getWarp() { return warp; },
    /**
     * 切换文章主题：重染粒子颜色并改变运动特性
     * @param {"sci-fi"|"mystery"|"warm"|"adventure"} name
     */
    setTheme(name) {
      theme = THEME_CI[name] ? name : 'sci-fi';
      const ci = THEME_CI[theme];
      for (const p of P) {
        if (Math.random() < 0.72) p.ci = ci[(Math.random() * ci.length) | 0];
        // 恢复被故障效果改过的亮度
        p.a0 = 0.35 + Math.random() * 0.55;
      }
    },
    get mobile() { return MOBILE; }
  };
  return API;
})();

/* =========================================================================
 * 二、DOM 特效小工具（白光 / 光环 / 曲速环 / 碎裂）
 * ========================================================================= */
const fxRoot = $('#fx-root');
const flashEl = $('#flash');

function flash(color = '255,255,255', dur = 760) {
  flashEl.style.background =
    `radial-gradient(circle at 50% 50%, rgba(${color},.95), rgba(${color},.28) 36%, rgba(${color},0) 70%)`;
  flashEl.animate(
    [{ opacity: 0 }, { opacity: 1, offset: .16 }, { opacity: 0 }],
    { duration: dur, easing: 'ease-out' }
  );
}

/** 在指定坐标产生径向光环 */
function pulseRing(x, y, color = '34,224,255', dur = 900, scale = 1) {
  const d = document.createElement('div');
  d.className = 'pulse-ring';
  d.style.left = x + 'px';
  d.style.top = y + 'px';
  d.style.setProperty('--rc', color);
  d.style.width = d.style.height = (60 * scale) + 'vmax';
  d.style.margin = (-30 * scale) + 'vmax 0 0 ' + (-30 * scale) + 'vmax';
  fxRoot.appendChild(d);
  const an = d.animate(
    [
      { transform: 'scale(.12)', opacity: 0 },
      { transform: 'scale(.5)', opacity: .95, offset: .25 },
      { transform: 'scale(1.35)', opacity: 0 }
    ],
    { duration: dur, easing: 'cubic-bezier(.16,.8,.24,1)' }
  );
  an.finished.then(() => d.remove()).catch(() => d.remove());
}

/** 曲速隧道：多重同心环 */
function warpTunnel() {
  for (let i = 0; i < 7; i++) {
    const d = document.createElement('div');
    d.className = 'warp-ring';
    d.style.borderColor = i % 2 ? 'rgba(255,47,208,.5)' : 'rgba(34,224,255,.55)';
    fxRoot.appendChild(d);
    const an = d.animate(
      [
        { transform: 'scale(.15)', opacity: 0 },
        { transform: 'scale(1.2)', opacity: .95, offset: .22 },
        { transform: 'scale(9)', opacity: 0 }
      ],
      { duration: 1000, delay: i * 80, easing: 'cubic-bezier(.3,.7,.2,1)' }
    );
    an.finished.then(() => d.remove()).catch(() => d.remove());
  }
}

/**
 * 玻璃碎裂：把登录卡片切成 cols×rows 碎片并向外炸开
 */
function shatter(el, cols = 7, rows = 5) {
  const rect = el.getBoundingClientRect();
  const bg = getComputedStyle(el).backgroundImage || 'linear-gradient(160deg, rgba(18,30,64,.9), rgba(46,14,72,.7))';
  const cw = rect.width, ch = rect.height;
  const fw = cw / cols, fh = ch / rows;
  const cx = rect.left + cw / 2, cy = rect.top + ch / 2;
  const frags = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const f = document.createElement('div');
      f.className = 'shard';
      const ox = c * fw, oy = r * fh;
      Object.assign(f.style, {
        left: (rect.left + ox) + 'px',
        top: (rect.top + oy) + 'px',
        width: fw + 'px',
        height: fh + 'px',
        backgroundImage: bg,
        backgroundSize: cw + 'px ' + ch + 'px',
        backgroundPosition: (-ox) + 'px ' + (-oy) + 'px'
      });
      fxRoot.appendChild(f);
      frags.push({ el: f, ox, oy });
    }
  }

  // 原卡片立刻隐藏
  el.style.transition = 'none';
  el.style.opacity = '0';

  frags.forEach(({ el: f, ox, oy }) => {
    const fx = rect.left + ox + fw / 2, fy = rect.top + oy + fh / 2;
    const dx = fx - cx, dy = fy - cy;
    const d = Math.hypot(dx, dy) || 1;
    const dist = 90 + Math.random() * 260;
    const an = f.animate(
      [
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1, filter: 'brightness(1)' },
        {
          transform: `translate(${dx / d * dist * .5}px, ${dy / d * dist * .5}px) rotate(${(Math.random() - .5) * 90}deg) scale(1.25)`,
          opacity: .95, filter: 'brightness(2.2)', offset: .22
        },
        {
          transform: `translate(${dx / d * dist}px, ${dy / d * dist + 60}px) rotate(${(Math.random() - .5) * 220}deg) scale(.25)`,
          opacity: 0, filter: 'brightness(.6)'
        }
      ],
      { duration: 780 + Math.random() * 420, delay: Math.random() * 90, easing: 'cubic-bezier(.2,.75,.3,1)', fill: 'forwards' }
    );
    an.finished.then(() => f.remove()).catch(() => f.remove());
  });
  return { cx, cy };
}
