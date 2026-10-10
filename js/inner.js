/* =========================================================================
 * inner.js —— 内页逻辑（inner.html）
 * -------------------------------------------------------------------------
 * 由 stories 自动生成卡片；点击卡片播放穿越动画 → 跳转 article.html?id=N
 * ========================================================================= */

requireAuth();

/* ---- 卡片：只由 stories 生成（没有文章就不会出现空方块） ---- */
const lifeCards = stories.map(s => {
  const th = THEMES[s.theme] || THEMES['sci-fi'];
  return {
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    icon: s.icon,
    color: th.color,
    theme: s.theme
  };
});

const grid = $('#grid');
$('#card-count').textContent = lifeCards.length;

lifeCards.forEach(c => {
  const el = document.createElement('article');
  el.className = 'life-card';
  el.style.setProperty('--c', c.color);
  el.dataset.id = c.id;
  el.innerHTML = `
    <div class="card-ico">${c.icon}</div>
    <div class="card-txt">
      <h3 class="card-title">${c.title}</h3>
      <p class="card-sub">${c.subtitle}</p>
    </div>
    <span class="card-no">NO.${String(c.id).padStart(2, '0')}</span>
  `;

  /* --- 3D 倾斜（仅非触屏） --- */
  if (!FX.mobile) {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      el.style.transform =
        `perspective(800px) rotateY(${px * 14}deg) rotateX(${-py * 12}deg) translateZ(14px) scale(1.045)`;
    });
    el.addEventListener('mouseenter', () => {
      const r = el.getBoundingClientRect();
      FX.setHover(r.left + r.width / 2, r.top + r.height / 2);  // 粒子吸附
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      FX.setHover(null);
    });
  }

  el.addEventListener('click', () => openArticle(c.id, el));
  grid.appendChild(el);
});

/* ---- 入场：卡片逐张浮现 ---- */
enterPage({ theme: 'sci-fi', fxOn: false, target: '#view-inner' });
[...grid.children].forEach((el, i) => {
  el.animate(
    [
      { opacity: 0, transform: 'translateY(46px) rotateX(-38deg) scale(.86)' },
      { opacity: 1, transform: 'translateY(0) rotateX(0) scale(1)' }
    ],
    { duration: 620, delay: 260 + i * 45, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }
  );
});

/**
 * 点击卡片：粒子吸入 + 径向光 + 模糊穿越 → 跳转文章页
 */
function openArticle(id, cardEl) {
  goTo(href('article.html?id=' + id), async () => {
    const s = stories.find(x => x.id === id);
    const th = THEMES[s.theme] || THEMES['sci-fi'];

    // 主题先切换，让背景与粒子渐变到本篇风格
    applyTheme(s.theme);
    showThemeFx(true);

    const r = cardEl.getBoundingClientRect();
    const cxp = r.left + r.width / 2, cyp = r.top + r.height / 2;

    // 1) 粒子吸入 + 径向光
    FX.suckAt(cxp, cyp, 760);
    FX.converge(cxp, cyp, FX.mobile ? 26 : 76);
    pulseRing(cxp, cyp, th.color, 950, .85);

    // 2) 卡片放大穿越
    cardEl.style.zIndex = 9;
    cardEl.animate(
      [
        { transform: 'scale(1)', opacity: 1, filter: 'brightness(1) blur(0px)' },
        { transform: 'scale(1.18)', opacity: 1, filter: 'brightness(1.8) blur(1px)', offset: .3 },
        { transform: 'scale(2.4)', opacity: 0, filter: 'brightness(3) blur(16px)' }
      ],
      { duration: 660, easing: 'cubic-bezier(.5,0,.9,.4)', fill: 'forwards' }
    );

    // 3) 内页模糊退场
    await sleep(300);
    $('#view-inner').animate(
      [
        { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
        { opacity: 0, transform: 'scale(.9)', filter: 'blur(18px)' }
      ],
      { duration: 560, easing: 'cubic-bezier(.4,0,.7,.4)', fill: 'forwards' }
    );

    await sleep(300);
    flash(th.color, 720);
    FX.setHover(null);
  });
}
