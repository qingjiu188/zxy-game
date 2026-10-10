/* =========================================================================
 * article.js —— 文章页逻辑（article.html?id=N）
 * -------------------------------------------------------------------------
 * 按 id 渲染故事（标题 / 角色 / 钩子 / 正文 / 章节），
 * 返回与「下一段人生」都播放反向穿越动画后跳转。
 * ========================================================================= */

requireAuth();

const articlePanel = $('#article-panel');
const aTag = $('#a-tag'), aTitle = $('#a-title'), aMeta = $('#a-meta');
const aCast = $('#a-cast'), aHook = $('#a-hook'), aBody = $('#a-body');
const readingBar = $('#reading-progress');
const articleNext = $('#article-next');
const articleView = $('#view-article');

let currentId = null;
let animating = false;

/** 简单 HTML 转义，避免正文里的尖括号破坏结构 */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---- 读取 URL 上的故事 id ---- */
const rawId = Number(param('id'));
const story = stories.find(x => x.id === rawId) || stories[0];
currentId = story.id;

/* ---- 渲染 + 入场 ---- */
renderArticle(story);
enterPage({ theme: story.theme, fxOn: true, target: '#view-article' });

// 面板径向展开
articlePanel.animate(
  [
    { opacity: 0, transform: 'scale(.72) rotateX(24deg)', filter: 'blur(28px)' },
    { opacity: 1, transform: 'scale(1) rotateX(0deg)', filter: 'blur(0px)' }
  ],
  { duration: 780, delay: 120, easing: 'cubic-bezier(.16,1,.3,1)' }
);
// 内部区块错落浮现
[$('.article-hero'), aCast, aHook, aBody].forEach((el, i) => {
  if (!el) return;
  el.animate(
    [
      { opacity: 0, transform: 'translateY(30px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    { duration: 560, delay: 380 + i * 110, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }
  );
});

/* ---- 阅读进度条 ---- */
function updateProgress() {
  const max = articleView.scrollHeight - articleView.clientHeight;
  readingBar.style.width = (max > 0 ? (articleView.scrollTop / max) * 100 : 0).toFixed(2) + '%';
}
articleView.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();

/**
 * 按 story 对象渲染整篇内容（标题 / 角色 / 钩子 / 正文）
 */
function renderArticle(s) {
  const th = THEMES[s.theme] || THEMES['sci-fi'];
  const wordCount = s.content.replace(/\s/g, '').length;

  // 1) 头部
  aTag.textContent = `${th.label} · ${th.name}`;
  aTitle.textContent = s.title;
  aMeta.innerHTML =
    `模拟人生 · 第 <b>${String(s.id).padStart(2, '0')}</b> 段 ／ 主角 <b>${esc(s.protagonist.name)}</b> ／ 全文约 <b>${wordCount}</b> 字`;

  // 2) 角色介绍：主角 + 配角
  const castList = [
    { role: '主角', lead: true, ...s.protagonist },
    ...(s.supporting || []).map(x => ({ role: '配角', lead: false, ...x }))
  ];
  aCast.innerHTML = castList.map(c => `
    <div class="cast-card${c.lead ? ' lead' : ''}">
      <div class="avatar">${esc(c.name.slice(0, 1))}</div>
      <div class="cast-info">
        <span class="cast-role">${c.role}</span>
        <h3 class="cast-name">${esc(c.name)}</h3>
        <p class="cast-desc">${esc(c.personality)}</p>
      </div>
    </div>
  `).join('');

  // 3) 开头钩子
  aHook.textContent = s.hook;

  // 4) 正文：按空行分段；"第X章" 渲染为章节小标题；纯对话段落高亮
  aBody.innerHTML = s.content.trim().split(/\n+/).map(t => {
    const p = t.trim();
    if (!p) return '';
    if (/^第[一二三四五六七八九十百]+章/.test(p)) {
      return `<h2 class="chapter">${esc(p)}</h2>`;
    }
    const isDialog = /^[“"『]/.test(p);
    return `<p class="${isDialog ? 'dialogue' : ''}">${esc(p)}</p>`;
  }).join('');

  // 5) 多篇文章时才显示“下一段人生”
  articleNext.hidden = stories.length < 2;

  articleView.scrollTop = 0;
}

/** 反向穿越：缩小 + 模糊 + 粒子外爆 */
function leaveArticle() {
  return (async () => {
    animating = true;
    articlePanel.animate(
      [
        { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
        { opacity: 0, transform: 'scale(.62) rotateX(-18deg)', filter: 'blur(24px)' }
      ],
      { duration: 560, easing: 'cubic-bezier(.5,0,.85,.4)', fill: 'forwards' }
    );
    articleView.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 560, easing: 'ease-in', fill: 'forwards' }
    );

    await sleep(200);
    FX.burst(innerWidth / 2, innerHeight / 2, FX.mobile ? 30 : 70);
    pulseRing(innerWidth / 2, innerHeight / 2, '139,92,246', 800, .8);
    await sleep(340);
  })();
}

/* ---- 返回内页 ---- */
$('#article-back').addEventListener('click', () => {
  goTo(href('inner.html'), leaveArticle);
});
$('#article-back2').addEventListener('click', () => {
  goTo(href('inner.html'), leaveArticle);
});

/* ---- 下一段人生 ---- */
articleNext.addEventListener('click', () => {
  if (animating) return;
  const idx = stories.findIndex(x => x.id === currentId);
  const next = stories[(idx + 1) % stories.length];
  goTo(href('article.html?id=' + next.id), async () => {
    animating = true;
    articlePanel.animate(
      [
        { opacity: 1, transform: 'rotateY(0deg) scale(1)' },
        { opacity: 0, transform: 'rotateY(60deg) scale(.92)' }
      ],
      { duration: 480, easing: 'cubic-bezier(.4,0,.7,.4)', fill: 'forwards' }
    );
    await sleep(200);
    FX.converge(innerWidth / 2, innerHeight / 2, FX.mobile ? 24 : 60);
    flash(THEMES[next.theme].color, 640);
    await sleep(260);
  });
});
