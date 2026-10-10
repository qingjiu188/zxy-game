/* =========================================================================
 * home.js —— 主页逻辑（home.html）
 * -------------------------------------------------------------------------
 * 打字机标题 + 点击「开始游戏」播放星际穿越 → 跳转 inner.html
 * ========================================================================= */

requireAuth();

const homeTitle = $('#home-title');
const HOME_TEXT = '郑晓银的模拟人生';

/* 入场 */
enterPage({ theme: 'sci-fi', fxOn: false, target: '#view-home' });
typeTitle();

/** 标题打字机 + 光标 */
function typeTitle() {
  if (!homeTitle) return;
  homeTitle.innerHTML = '';
  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.textContent = ' ';
  let i = 0;
  const timer = setInterval(() => {
    if (i >= HOME_TEXT.length) {
      clearInterval(timer);
      setTimeout(() => caret.remove(), 2600);
      return;
    }
    homeTitle.insertBefore(document.createTextNode(HOME_TEXT[i]), caret);
    i++;
  }, 130);
}

/* ---- 开始游戏：星际穿越 ---- */
const startBtn = $('#start-btn');
let warping = false;

startBtn.addEventListener('click', () => {
  goTo(href('inner.html'), async () => {
    if (warping) return;
    warping = true;
    startBtn.classList.add('busy');
    startBtn.querySelector('span').textContent = '曲 速 引 擎 充 能';

    const r = startBtn.getBoundingClientRect();
    pulseRing(r.left + r.width / 2, r.top + r.height / 2, '34,224,255', 700, .6);
    FX.converge(innerWidth / 2, innerHeight / 2, FX.mobile ? 24 : 60); // 粒子向中心汇聚
    await sleep(620);

    startBtn.querySelector('span').textContent = '穿 越 中';
    // 1) 粒子拉伸成星线
    FX.setWarp(1);
    // 2) 曲速隧道
    warpTunnel();
    await sleep(240);
    // 3) 径向模糊 + 镜头推进
    $('#view-home').animate(
      [
        { opacity: 1, transform: 'scale(1) translateZ(0)', filter: 'blur(0px)' },
        { opacity: .85, transform: 'scale(1.35)', filter: 'blur(6px)', offset: .45 },
        { opacity: 0, transform: 'scale(3.2)', filter: 'blur(26px)' }
      ],
      { duration: 1000, easing: 'cubic-bezier(.55,0,.85,.35)', fill: 'forwards' }
    );
    await sleep(560);
    // 4) 白光闪过
    flash('235,250,255', 900);
    FX.burst(innerWidth / 2, innerHeight / 2, FX.mobile ? 40 : 90, 4);
    await sleep(320);
  });
});
