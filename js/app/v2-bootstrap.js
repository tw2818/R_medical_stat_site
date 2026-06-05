/* ===================================================================
 * v2 Chapter Bootstrap — 让 Quarto 生成的章节页自动应用 v2 主题
 * ===================================================================
 *
 * 用法：在 Quarto 章节页 <head> 末尾加
 *   <script src="../js/app/v2-bootstrap.js"></script>
 *
 * 作用：
 *  1. 加 v2-active class 到 <body>（不抢 Quarto 的 nav-sidebar floating class）
 *  2. 同步主题：localStorage → system pref → 保持现状
 *  3. 注入 css/v2-chapter-shell.css（lazy，不阻塞首屏）
 *  4. 注入主题切换按钮（右下角 fixed FAB）
 *  5. 移动端汉堡：点击打开 Quarto sidebar
 * =================================================================== */

(function () {
  'use strict';

  // === 1. 加 v2-active class（必须等 body 解析后）===
  function addV2ActiveClass() {
    if (document.body) {
      document.body.classList.add('v2-active');
    }
  }

  // === 2. 主题同步 ===
  // 优先级: localStorage > system prefers-color-scheme > 不设
  function detectTheme() {
    const saved = localStorage.getItem('v2-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme === 'light');
    // 更新按钮图标
    const btn = document.getElementById('v2-chapter-theme-toggle');
    if (btn) btn.innerHTML = theme === 'dark' ? '☀' : '🌙';
  }

  applyTheme(detectTheme());

  // === 3. 懒加载 chapter shell CSS（不阻塞首屏）===
  function loadShellCSS() {
    if (document.querySelector('link[data-v2-shell]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../css/v2-chapter-shell.css';
    link.setAttribute('data-v2-shell', '');
    document.head.appendChild(link);
  }

  // === 4. 主题切换按钮（FAB）===
  function injectThemeToggle() {
    if (document.getElementById('v2-chapter-theme-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'v2-chapter-theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', '切换主题');
    btn.setAttribute('title', '切换主题');
    btn.innerHTML = detectTheme() === 'dark' ? '☀' : '🌙';
    btn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('v2-theme', next);
      applyTheme(next);
    });
    document.body.appendChild(btn);
  }

  // === 5. 移动端 sidebar 汉堡增强 ===
  function enhanceMobileSidebar() {
    // Quarto 自己的 toggle 已存在，我们只补 body class 用于 CSS 选择器
    const quartoBtn = document.querySelector('.quarto-btn-toggle');
    if (!quartoBtn) return;

    // 拦截点击，Quarto 自己的 collapse 我们不去动，但加 sidebar-open 状态用于 CSS
    quartoBtn.addEventListener('click', function () {
      setTimeout(function () {
        const isOpen = document.getElementById('quarto-sidebar')?.classList.contains('show');
        document.body.classList.toggle('sidebar-open', !!isOpen);
      }, 50);
    });

    // 监听 Quarto 自己的 collapse 事件
    const sidebar = document.getElementById('quarto-sidebar');
    if (sidebar) {
      sidebar.addEventListener('shown.bs.collapse', function () {
        document.body.classList.add('sidebar-open');
      });
      sidebar.addEventListener('hidden.bs.collapse', function () {
        document.body.classList.remove('sidebar-open');
      });
    }
  }

  // === 启动顺序：CSS 立即同步加载以避免 FOUC，UI 增强稍后 ===
  // 必须在 DOMContentLoaded 后才能改 body class（script 在 head 中加载时 body 还没解析）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      addV2ActiveClass();
      loadShellCSS();
      injectThemeToggle();
      enhanceMobileSidebar();
    });
  } else {
    addV2ActiveClass();
    loadShellCSS();
    injectThemeToggle();
    enhanceMobileSidebar();
  }

  // === 监听 system 主题变化 ===
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', function (e) {
      // 只在用户没显式设置时才跟随 system
      if (!localStorage.getItem('v2-theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
})();
