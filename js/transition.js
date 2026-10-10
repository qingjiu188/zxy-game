/* =========================================================================
 * transition.js —— 多页版公共工具
 * -------------------------------------------------------------------------
 * 职责：主题切换 / 页面入场动画 / 离场动画后跳转 / 登录态守卫
 * 加载顺序：fx.js → data.js → transition.js → 各页面脚本
 * ========================================================================= */

const themeFx = $('#theme-fx');

/**
 * 切换全局主题：body class + CSS 变量 + 粒子配色
 * @param {"sci-fi"|"mystery"|"warm"|"adventure"} name
 */
function applyTheme(name) {
  const key = THEMES[name] ? name : 'sci-fi';
  document.body.className = 'theme-' + key;
  FX.setTheme(key);
}

/** 显示 / 隐藏主题专属背景动效层（内页默认关闭，文章页开启） */
function showThemeFx(on) {
  themeFx.classList.toggle('show', !!on);
}

/** 清除元素上残留的 WAAPI 动画（避免 fill:forwards 状态堆积） */
function clearAnims(el) {
  if (el && el.getAnimations) {
    el.getAnimations().forEach(a => { try { a.cancel(); } catch (e) {} });
  }
}

/* ---------------- URL 参数 / 登录态 ---------------- */

/** 读取 URL 参数 */
function param(k) {
  return new URLSearchParams(location.search).get(k);
}

/** 生成携带登录态（s=1）的页面地址 */
function href(url) {
  return url + (url.indexOf('?') > -1 ? '&' : '?') + 's=1';
}

/**
 * 登录态守卫：未携带 s=1 时退回登录页。
 * 说明：这是纯前端校验，仅防止直接输入地址跳过登录，不具备真实安全性。
 */
function requireAuth() {
  if (param('s') !== '1') {
    location.replace('index.html');
    return false;
  }
  return true;
}

/* ---------------- 离场跳转 ---------------- */

let leaving = false;   // 防止连点重复跳转

/**
 * 播放离场动画后跳转到目标页面
 * @param {string} url   目标页面（建议用 href() 生成，带上登录态）
 * @param {Function} leaveFn 可选：async 离场动画，执行完再跳转
 */
async function goTo(url, leaveFn) {
  if (leaving) return;
  leaving = true;
  try {
    if (typeof leaveFn === 'function') await leaveFn();
  } catch (e) {
    console.warn('[transition] 离场动画异常：', e);
  }
  location.href = url;
}

/* ---------------- 入场动画 ---------------- */

/**
 * 页面入场：应用主题 + 启动粒子系统 + 内容径向展开
 * @param {Object} opts
 *   theme  主题名，默认 sci-fi
 *   fxOn   是否开启主题背景动效层
 *   target 入场动画作用的元素选择器，默认 .view
 */
function enterPage(opts = {}) {
  const { theme = 'sci-fi', fxOn = false, target = '.view' } = opts;
  applyTheme(theme);
  showThemeFx(fxOn);
  FX.init();

  const el = $(target);
  if (!el) return;
  clearAnims(el);
  el.animate(
    [
      { opacity: 0, transform: 'scale(.92)', filter: 'blur(22px)' },
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }
    ],
    { duration: 720, easing: 'cubic-bezier(.16,1,.3,1)' }
  );
  // 粒子从四周向中心汇聚，形成“落地”感
  FX.converge(innerWidth / 2, innerHeight / 2, FX.mobile ? 18 : 44);
}
