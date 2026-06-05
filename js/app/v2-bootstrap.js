/* ===================================================================
 * v2 Chapter Bootstrap — 让 Quarto 生成的章节页自动应用 v2 主题
 * ===================================================================
 *
 * 用法：在 Quarto 章节页 <head> 末尾加（defer 加载）
 *   <script src="../js/app/v2-bootstrap.js" defer></script>
 *
 * 因为用了 defer，本脚本保证在 DOM 解析完成后才执行，body 一定存在。
 *
 * 作用：
 *  1. 加 v2-active class 到 <body>（不抢 Quarto 的 nav-sidebar floating class）
 *  2. 同步主题：localStorage > system pref > 保持现状
 *  3. 加 body.quarto-light / quarto-dark 跟 Quarto 习惯对齐
 *  4. 注入 css/v2-chapter-shell.css（lazy，不阻塞首屏）
 *  5. 注入主题切换按钮（右下角 fixed FAB）
 * =================================================================== */

(function () {
  'use strict';

  // === 1. 加 v2-active class（CSS 选择器依赖）===
  document.body.classList.add('v2-active');

  // === 2. 主题检测 ===
  function detectTheme() {
    try {
      const saved = localStorage.getItem('v2-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      // localStorage 可能被禁用
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // === 3. 应用主题（跟 Quarto 习惯对齐：用 body class 不用 data-theme）===
  function applyTheme(theme) {
    document.body.classList.toggle('quarto-dark', theme === 'dark');
    document.body.classList.toggle('quarto-light', theme === 'light');
    // 同步通知 CSS（用 data-theme 兼容其他可能的 v2 样式）
    document.documentElement.setAttribute('data-theme', theme);
    // 更新按钮图标
    const btn = document.getElementById('v2-chapter-theme-toggle');
    if (btn) btn.innerHTML = theme === 'dark' ? '☀' : '🌙';
  }

  applyTheme(detectTheme());

  // === 4. 懒加载 chapter shell CSS ===
  function loadShellCSS() {
    if (document.querySelector('link[data-v2-shell]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../css/v2-chapter-shell.css';
    link.setAttribute('data-v2-shell', '');
    // async 加载，不阻塞
    document.head.appendChild(link);
  }

  // === 5. 主题切换按钮（FAB）===
  function injectThemeToggle() {
    if (document.getElementById('v2-chapter-theme-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'v2-chapter-theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', '切换主题');
    btn.setAttribute('title', '切换主题');
    btn.innerHTML = detectTheme() === 'dark' ? '☀' : '🌙';
    btn.addEventListener('click', function () {
      const current = detectTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('v2-theme', next); } catch (e) {}
      applyTheme(next);
    });
    document.body.appendChild(btn);
  }

  // === 6. 启动 ===
  loadShellCSS();
  injectThemeToggle();

  // === 7. 监听 system 主题变化 ===
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', function (e) {
      // 只在用户没显式设置时才跟随 system
      let saved = null;
      try { saved = localStorage.getItem('v2-theme'); } catch (err) {}
      if (!saved) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
})();
