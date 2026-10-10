/* =========================================================================
 * login.js —— 登录页逻辑（index.html）
 * -------------------------------------------------------------------------
 * 登录成功：玻璃碎裂 + 白光扩散 + 粒子爆发 → 跳转 home.html
 * ========================================================================= */

const loginCard = $('#login-card');
const userInput = $('#username');
const passInput = $('#password');
const loginBtn = $('#login-btn');
const loginBtnText = $('#login-btn-text');
const loginMsg = $('#login-msg');
const fUser = $('#f-user'), fPass = $('#f-pass');

/* 凭证不明文存储在页面上：源码中只保留编码值，校验时解码比对。
   注意：这是纯前端固定校验，仅用于演示，不具备任何真实安全性。 */
const _ENC_USER = 'enh5';   // base64 → zxy
const _ENC_PASS = 'MDAx';   // base64 → 001
const dec = s => { try { return atob(s); } catch (e) { return ''; } };
const VALID_USER = dec(_ENC_USER);
const VALID_PASS = dec(_ENC_PASS);
let logging = false;

/* 入场 */
enterPage({ theme: 'sci-fi', fxOn: false, target: '#view-login' });

loginCard.addEventListener('submit', e => { e.preventDefault(); doLogin(); });
loginBtn.addEventListener('click', e => { e.preventDefault(); doLogin(); });

/** 错误提示：卡片抖动 + 红色霓虹文字（不使用 alert） */
function showError(msg) {
  loginMsg.textContent = msg;
  loginMsg.classList.add('show');
  loginCard.classList.remove('shake');
  void loginCard.offsetWidth;
  loginCard.classList.add('shake');
  fUser.classList.add('err'); fPass.classList.add('err');
  setTimeout(() => {
    loginMsg.classList.remove('show');
    fUser.classList.remove('err'); fPass.classList.remove('err');
  }, 2600);
}

async function doLogin() {
  if (logging) return;
  const u = userInput.value.trim().toLowerCase();
  const p = passInput.value.trim();

  if (u !== VALID_USER || p !== VALID_PASS) {
    showError('账号或密码错误');
    return;
  }

  logging = true;
  loginBtn.classList.add('busy');
  loginBtnText.textContent = '身 份 验 证 中';
  loginMsg.classList.remove('show');

  pulseRing(innerWidth / 2, innerHeight / 2, '34,224,255', 700, .5);
  await sleep(560);
  loginBtnText.textContent = '验 证 通 过';
  FX.burst(innerWidth / 2, innerHeight / 2, 40);

  await loginSuccess();
}

/** 登录成功特效：碎裂 → 白光 → 粒子爆发 → 跳转主页 */
async function loginSuccess() {
  const { cx, cy } = shatter(loginCard, FX.mobile ? 5 : 7, FX.mobile ? 4 : 5);

  await sleep(140);
  flash('255,255,255', 900);                  // 白光扩散
  pulseRing(cx, cy, '34,224,255', 1000, .9);
  FX.burst(cx, cy, FX.mobile ? 50 : 110, 4);  // 粒子爆发
  FX.burst(cx, cy, 40, 0);

  // 登录页整体粒子化消散
  $('#view-login').animate(
    [
      { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
      { opacity: 0, filter: 'blur(14px)', transform: 'scale(1.18)' }
    ],
    { duration: 620, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }
  );

  await sleep(520);

  // 跳转主页（携带登录态）
  await goTo(href('home.html'));
}
