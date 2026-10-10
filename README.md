# 郑晓银的模拟人生

一个纯前端的 **多页单页应用（MPA + SPA 视觉体验）**：深空粒子背景、玻璃拟态、霓虹光效、星际穿越式页面转场。
无需后端、无需构建工具、无需本地服务器，双击 `index.html` 即可运行。

---

## 快速开始

```bash
# 直接双击打开
open index.html          # macOS
```

或者在浏览器地址栏输入本地文件路径即可。

> 登录页不再显示明文提示，源码中凭证以 base64 编码存放。
> 这是纯前端固定校验，仅用于演示，不具备任何真实安全性。

**流程**：`index.html`（登录）→ `home.html`（主页）→ `inner.html`（人生卡片）→ `article.html?id=N`（文章详情）。

---

## 目录结构

```
zxy-game/
├── index.html              登录页（入口）
├── home.html               主页
├── inner.html              人生卡片列表
├── article.html            文章详情页（接收 ?id=N）
│
├── css/
│   ├── base.css            全局：CSS 变量 / 深空背景 / 粒子层 / 主题动效层 / 视图容器 / 响应式
│   ├── login.css           登录页样式
│   ├── home.css            主页样式
│   ├── inner.css           内页卡片网格样式
│   └── article.css         文章页样式
│
├── js/
│   ├── fx.js               Canvas 2D 发光粒子系统 + DOM 特效工具
│   ├── data.js             主题配置 THEMES + 故事数据 stories
│   ├── transition.js       主题切换 / 入场动画 / 离场跳转 / 登录态守卫
│   ├── login.js            登录页逻辑
│   ├── home.js             主页打字机 + 星际穿越
│   ├── inner.js            卡片渲染 + 穿越跳转
│   └── article.js          文章渲染 + 返回 / 下一段
│
├── _backup_单文件版.html    重构前的单文件版本备份（可删）
└── README.md
```

**脚本加载顺序**（每个页面固定，不可调换）：

```
js/fx.js → js/data.js → js/transition.js → 页面专属脚本
```

---

## 页面说明

### 1. 登录页 `index.html`

- 居中玻璃拟态卡片，含扫描线、霓虹边框、全息光效。
- 输入框聚焦发光，按钮 hover 扫描光。
- 支持回车提交。
- 登录失败：卡片抖动 + 红色霓虹文字提示（不使用 `alert`）。
- 登录成功：卡片碎裂 → 白光扩散 → 粒子爆发 → 跳往主页。

### 2. 主页 `home.html`

- 大号霓虹渐变主标题「郑晓银的模拟人生」，带打字机动画。
- 中央「开始游戏」玻璃拟态按钮。
- 点击后播放星际穿越特效：星点拉伸成线 → 曲速隧道 → 镜头推进 → 白光闪过 → 进入内页。

### 3. 内页 `inner.html`

- 顶部标题，下方玻璃拟态卡片网格（由 `stories` 数组自动生成，非手写死数据）。
- 卡片悬停：3D 倾斜 + 发光边框 + 扫描线 + 粒子吸附（触屏设备自动关闭倾斜）。
- 点击卡片：粒子吸入 + 径向光 + 模糊穿越 → 进入文章页。
- 响应式：桌面多列，移动端自动降为双列 / 单列。

### 4. 文章页 `article.html?id=N`

- 主标题为故事文档名，大号霓虹渐变字。
- 角色介绍区：主角 + 配角，各自展示姓名与性格描述。
- 开头钩子句（引子）。
- 正文：按空行自动分段；以「第 X 章」开头的行自动渲染为章节小标题；以引号开头的段落自动高亮为对话样式。
- 顶部阅读进度条。
- 左下角固定玻璃拟态「返回」按钮，播放反向穿越动画后回到内页；右下角可切「下一段人生」。

---

## 主题系统

文章页会根据故事的 `theme` 字段自动换肤，切换时背景光晕、CSS 变量、粒子颜色与粒子运动方式同步变化。

| theme | 风格 | 视觉 |
| --- | --- | --- |
| `sci-fi` | 科幻 | 蓝青霓虹、星云粒子、科技网格 |
| `mystery` | 悬疑 | 暗红 / 紫黑、闪烁光、故障效果 |
| `warm` | 温情 | 暖黄 / 粉紫、柔和光晕、飘落粒子 |
| `adventure` | 冒险 | 金橙 / 翠绿、动态光带、能量流动 |

主题由 `js/data.js` 的 `THEMES` 定义，由 `js/transition.js` 的 `applyTheme(name)` 应用，粒子配色由 `FX.setTheme(name)` 同步。

---

## 如何新增一篇文章

只改 `js/data.js`，在 `stories` 数组里追加一个对象即可。内页会自动生成卡片，文章页会自动按 `theme` 换肤，无需改动 HTML / CSS / 其他 JS。

```js
{
  id: 4,                          // 唯一标识，对应 article.html?id=4
  title: '文档名',                 // 卡片标题 + 文章页主标题
  subtitle: '副标题',              // 卡片副标题
  icon: '🌌',                     // 卡片图标（emoji）
  theme: 'sci-fi',                // sci-fi / mystery / warm / adventure
  hook: '一句勾人的引子，制造悬念或情感冲击。',
  protagonist: {
    name: '郑晓银',
    personality: '冷静果断，好奇心强'
  },
  supporting: [
    { name: '配角A', personality: '活泼开朗' },
    { name: '配角B', personality: '沉默寡言' }
  ],
  content: `正文段落一。

  正文段落二。

  第三章 章节标题
  正文段落三……`
}
```

**正文格式约定**

| 写法 | 渲染结果 |
| --- | --- |
| 空行分隔 | 分段（每段首行缩进 2 字符） |
| 以「第X章」「第三章」开头 | 章节小标题（带霓虹分隔线） |
| 以 `"` `“` `『` 开头 | 对话高亮样式 |

---

## 现有文章

| id | 标题 | 主题 |
| --- | --- | --- |
| 1 | 囚她 | `mystery` |
| 2 | 替身千金：陈钰丽的半生疯魔 | `warm` |
| 3 | 夜莺坠于灰蓝之海 | `sci-fi` |

---

## 核心模块

### `js/fx.js` — Canvas 2D 粒子系统

全屏固定 `<canvas id="fx">`，`pointer-events: none`，不遮挡点击。

- 鼠标移动：粒子追随、绕行、被吸引，带轻微拖尾。
- 鼠标点击：以点击点为中心产生冲击波，粒子向外散开后缓慢恢复。
- 曲速模式：粒子拉伸成星线，形成隧道感。
- 自适应 `devicePixelRatio`；移动端自动降低粒子上限。
- 统一 `requestAnimationFrame` 主循环，动画尽量只改 `transform` / `opacity`。

对外接口：

| 成员 | 说明 |
| --- | --- |
| `FX.init()` | 初始化粒子系统并开始主循环 |
| `FX.burst(x, y, n, ci)` | 在指定位置爆发粒子 |
| `FX.converge(x, y, n)` | 粒子从四周向某点汇聚（吸入感） |
| `FX.suckAt(x, y, ms)` | 在某点持续强吸引 |
| `FX.setHover(x, y)` | 设置 / 取消卡片悬停吸附点（`null` 取消） |
| `FX.setWarp(v)` | 曲速强度 0~1 |
| `FX.setTheme(name)` | 按主题重染粒子并改变运动特性 |
| `FX.mobile` | 是否移动端（只读） |
| `flash(color, dur)` | 全屏白光 / 彩光闪过 |
| `pulseRing(x, y, color, dur, scale)` | 径向扩散光环 |
| `warpTunnel()` | 曲速隧道环序列 |
| `shatter(el, cols, rows)` | 把元素切片成碎片飞散（玻璃碎裂），返回中心坐标 |

### `js/transition.js` — 公共跳转与守卫

| 成员 | 说明 |
| --- | --- |
| `applyTheme(name)` | 切换 body class + CSS 变量 + 粒子主题 |
| `showThemeFx(on)` | 开关主题背景动效层 |
| `param(k)` | 读取 URL 参数 |
| `href(url)` | 生成携带登录态的地址（自动拼 `?s=1`） |
| `requireAuth()` | 登录态守卫，未带 `s=1` 时跳回 `index.html` |
| `goTo(url, leaveFn)` | 先播放离场动画，完成后跳转 |
| `enterPage(opts)` | 入场：应用主题 + 启动粒子 + 内容径向展开 |
| `clearAnims(el)` | 清除元素上残留的 WAAPI 动画 |

---

## 页面切换机制

采用**真实页面跳转**（会刷新浏览器），登录态与文章 id 通过 URL 参数传递：

```
index.html                 →  登录成功  →  home.html?s=1
home.html?s=1              →  开始游戏  →  inner.html?s=1
inner.html?s=1             →  点击卡片  →  article.html?id=N&s=1
article.html?id=N&s=1      →  返回      →  inner.html?s=1
```

- 每次跳转前先播放对应的穿越 / 碎裂 / 曲速动画，动画结束后再 `location.href` 跳转。
- `?s=1` 是演示级登录态标记：直接输入 `inner.html` 或 `article.html` 且不带 `s=1` 时，会被强制跳回登录页。
- 若希望完全无刷新（SPA 体验），需要改用 History API + 前端路由，并起本地服务器（`file://` 下 fetch 加载会被浏览器拦截）。

---

## 性能与兼容

- 粒子上限受控：桌面与移动端分别限制，移动端自动减少数量。
- 适配 `devicePixelRatio`，高分屏不糊。
- 动画优先使用 `transform` / `opacity` / `filter`，走合成层。
- 支持 `prefers-reduced-motion`：系统开启「减弱动效」时自动压缩动画时长。
- 移动端关闭卡片 3D 倾斜，减少重绘压力。
- 需要支持 `backdrop-filter` 的现代浏览器（Chrome / Edge / Safari / Firefox 新版）。

---

## 常见问题

**双击打开后背景是纯黑、没有粒子？**
检查 `js/` 与 `css/` 文件夹是否和 HTML 在同一级目录，路径为相对引用，不要单独挪走 HTML 文件。

**直接打开 `article.html` 被弹回登录页？**
正常行为。需要带参数访问，例如 `article.html?id=1&s=1`。

**改了 data.js 但页面没变化？**
强制刷新（`Cmd + Shift + R` / `Ctrl + F5`）清缓存。

**想换成无刷新的单页应用？**
保留 `_backup_单文件版.html`，那是重构前的单文件 SPA 版本（所有视图在同一 HTML 内，JS 控制显示隐藏）。也可以基于现有多文件结构接前端路由改造。
