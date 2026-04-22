"use strict";

// ===== 状态 =====
let currentGroup = null;
let currentIndex = 0;
let currentChapterData = null;

// ===== 章节内容缓存 =====
const chapterCache = new Map();


const GROUP_CONFIG = [
  { key: 'basic', el: 'basic-chapters', label: '基础统计分析' },
  { key: 'advanced', el: 'advanced-chapters', label: '高级统计分析' },
  { key: 'literature', el: 'literature-chapters', label: '文献常见统计分析' },
  { key: 'other', el: 'other-chapters', label: '其他合集' },
];

// ===== DOM =====
const $ = id => document.getElementById(id);
const CHAPTER_BY_FILE = new Map(ALL_CHAPTERS.map(ch => [ch.file, ch]));
const CHAPTER_BY_TITLE_FILE = new Map(
  ALL_CHAPTERS.map(ch => [`${ch.title}.html`, ch])
);

function getTotalChapterCount() {
  return ALL_CHAPTERS.length;
}

function updateStaticCounts() {
  GROUP_CONFIG.forEach(({ key }) => {
    const count = CHAPTERS[key].length;
    const cardCount = $(`${key}-card-count`);
    if (cardCount) cardCount.textContent = `${count}章`;
  });

  const totalEl = $('welcome-total-count');
  if (totalEl) totalEl.textContent = getTotalChapterCount();
}

// ===== 主题 =====
function initTheme() {
  const saved = localStorage.getItem('rstat_theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  updateThemeToggle();
}
function updateThemeToggle() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = $('theme-toggle');
  if (!btn) return;
  btn.textContent = isDark ? '☀️' : '🌙';
  btn.setAttribute('aria-label', isDark ? '切换浅色模式' : '切换深色模式');
}
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  localStorage.setItem('rstat_theme', isDark ? 'light' : 'dark');
  updateThemeToggle();
}

// ===== 导航 =====
function buildNav() {
  GROUP_CONFIG.forEach(({ key, el }) => {
    const container = $(el);
    if (!container) return;
    container.innerHTML = '';
    const list = CHAPTERS[key] || [];
    list.forEach((ch, i) => {
      const a = document.createElement('a');
      a.className = 'chapter-link';
      a.href = '#' + ch.id;
      a.dataset.group = key;
      a.dataset.index = i;
      a.textContent = ch.title;
      a.addEventListener('click', e => {
        e.preventDefault();
        navigateToChapter(key, i);
      });
      container.appendChild(a);
    });
  });
  updateChapterCount();
}

function updateChapterCount() {
  if (typeof updateProgressBar === 'function') updateProgressBar();
}

function continueLearning() {
  const lastId = window._lastChapterId;
  if (!lastId) return;
  for (const [groupKey, list] of Object.entries(CHAPTERS)) {
    const idx = list.findIndex(ch => ch.id === lastId);
    if (idx !== -1) {
      navigateToChapter(groupKey, idx);
      return;
    }
  }
}

function expandAllChapterGroups() {
  const sidebar = $('sidebar');
  if (sidebar) sidebar.classList.add('open');
  document.querySelectorAll('.nav-group-header').forEach(btn => {
    btn.setAttribute('aria-expanded', 'true');
    const content = document.getElementById(`${btn.dataset.group}-chapters`);
    if (content) content.style.display = 'block';
  });
  const chapterNav = $('chapter-nav');
  if (chapterNav) chapterNav.scrollIntoView({ behavior: 'smooth' });
}

function handleWelcomeAction(action) {
  if (action === 'scroll-task-nav') {
    const taskNav = $('task-nav');
    if (taskNav) taskNav.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (action === 'open-all-chapters') {
    expandAllChapterGroups();
  }
}

function initGlobalActions() {
  const continueBtn = $('btn-continue');
  if (continueBtn) continueBtn.addEventListener('click', continueLearning);

  const homeBtn = $('home-btn');
  if (homeBtn) homeBtn.addEventListener('click', showWelcome);

  const contentWrapper = $('content-wrapper');
  if (!contentWrapper) return;

  contentWrapper.addEventListener('click', event => {
    const navTarget = event.target.closest('[data-nav-group][data-nav-index]');
    if (navTarget) {
      navigateToChapter(navTarget.dataset.navGroup, parseInt(navTarget.dataset.navIndex, 10));
      return;
    }

    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget) {
      handleWelcomeAction(actionTarget.dataset.action);
    }
  });
}

function navigateToChapter(groupKey, index) {
  const list = CHAPTERS[groupKey] || [];
  if (!list[index]) return;

  const chapter = list[index];

  // 避免重复加载同一章节（但仍更新状态）
  if (currentGroup === groupKey && currentIndex === index) {
    updateActiveLink(groupKey, index);
    const homeBtn = $('home-btn');
    if (homeBtn) homeBtn.style.display = 'inline-block';
    return;
  }

  // 更新 URL hash（用于书签/分享）
  history.replaceState(null, '', '#' + chapter.id);

  // Track visited chapter
  if (typeof saveProgress === 'function') {
    saveProgress(chapter.id);
  } else {
    const visited = JSON.parse(localStorage.getItem('rstat_visited') || '[]');
    if (!visited.includes(chapter.id)) {
      visited.push(chapter.id);
      localStorage.setItem('rstat_visited', JSON.stringify(visited));
    }
    updateChapterCount();
  }

  currentGroup = groupKey;
  currentIndex = index;

  // 更新侧边栏激活状态
  updateActiveLink(groupKey, index);

  // 更新顶部标题
  const titleEl = $('current-chapter-title');
  if (titleEl) titleEl.textContent = chapter.title;

  // 显示返回首页按钮
  const homeBtn = $('home-btn');
  if (homeBtn) homeBtn.style.display = 'inline-block';

  // 加载章节内容
  loadChapter(chapter.file);

  // 关闭侧边栏（移动端）
  const sidebar = $('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

function updateActiveLink(groupKey, index) {
  document.querySelectorAll('.chapter-link').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`.chapter-link[data-group="${groupKey}"][data-index="${index}"]`);
  if (activeLink) activeLink.classList.add('active');
}

function findChapterByHref(href) {
  if (!href) return null;
  const cleaned = href.split('#')[0].replace(/^\.\//, '').trim();
  if (!cleaned || cleaned === 'index.html') return { type: 'home' };

  if (cleaned.startsWith('data/')) {
    const file = cleaned.slice('data/'.length);
    const chapter = CHAPTER_BY_FILE.get(file);
    if (chapter) return { type: 'chapter', chapter };
  }

  const fileCandidate = cleaned.split('/').pop();
  const byFile = CHAPTER_BY_FILE.get(fileCandidate);
  if (byFile) return { type: 'chapter', chapter: byFile };

  const byTitleFile = CHAPTER_BY_TITLE_FILE.get(fileCandidate);
  if (byTitleFile) return { type: 'chapter', chapter: byTitleFile };

  return null;
}

function rewriteChapterLinks(container) {
  container.querySelectorAll('a[href]').forEach(link => {
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || /^(https?:|mailto:|javascript:|data:)/i.test(rawHref)) return;

    const target = findChapterByHref(rawHref);
    if (!target) return;

    link.href = '#';
    link.addEventListener('click', event => {
      event.preventDefault();
      if (target.type === 'home') {
        showWelcome();
        return;
      }
      navigateToChapter(target.chapter.group, target.chapter.index);
    });
  });
}

async function loadChapter(filename) {
  const wrapper = $('chapter-content');
  const welcome = $('welcome');
  if (!wrapper) return;

  welcome && welcome.classList.remove('active');
  wrapper.innerHTML = '<div class="loading">加载中...</div>';
  wrapper.classList.add('active');

  try {
    let contentHtml;
    if (chapterCache.has(filename)) {
      contentHtml = chapterCache.get(filename);
    } else {
      const resp = await fetch(`data/${filename}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();

      // 解析完整文档，只提取主要章节内容（避开 Quarto 的 head/nav/footer）
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const main = doc.getElementById('quarto-document-content');
      if (!main) throw new Error('无法解析章节内容');

      // 移除所有内联脚本，避免污染全局命名空间
      main.querySelectorAll('script').forEach(s => s.remove());

      contentHtml = main.innerHTML;
      contentHtml = injectCopyButtons(contentHtml);
      chapterCache.set(filename, contentHtml);
    }

    wrapper.innerHTML = contentHtml;
    pruneMisplacedChapterWidgets(wrapper, filename);
    rewriteChapterLinks(wrapper);

    // 渲染完成后注入交互
    Prism.highlightAll();
    setupChapterInteractions(wrapper);

    // 初始化统计可视化组件，并启动 MutationObserver 监听动态内容
    if (window.initStatViz) window.initStatViz();
    if (window.setupStatVizObserver) window.setupStatVizObserver();

    // 更新章节计数（进度条、圆环、最近章节等）
    updateChapterCount();
    updateNavGroupExpansion();
  } catch (err) {
    wrapper.innerHTML = `<div class="error">加载失败：${err.message}</div>`;
  }
}

function updateNavGroupExpansion() {
  if (!currentGroup) return;
  // 自动展开当前分组
  GROUP_CONFIG.forEach(({ key }) => {
    const btn = document.querySelector(`.nav-group-header[data-group="${key}"]`);
    const content = document.getElementById(`${key}-chapters`);
    if (btn && content) {
      const isExpanded = key === currentGroup;
      btn.setAttribute('aria-expanded', String(isExpanded));
      content.style.display = isExpanded ? 'block' : 'none';
    }
  });
}

// 注入/替换代码复制按钮
function injectCopyButtons(html) {
  return html.replace(
    /<button([^>]*)class="code-copy-button"([^>]*)>[\s\S]*?<\/button>/g,
    `<button$1class="code-copy-button chapter-copy-button"$2 type="button" title="复制代码" aria-label="复制代码">📋</button>`
  );
}

function pruneMisplacedChapterWidgets(container, filename) {
  if (filename === '1012-randomgroup.html') {
    container.querySelectorAll('.stat-viz[data-type="samplesizecalc"]').forEach(el => el.remove());
  }
}

// ===== 代码复制 =====
function copyCodeBlock(btn) {
  const wrapper = btn.closest('div');
  const pre = wrapper ? wrapper.querySelector('pre') : btn.nextElementSibling;
  if (!pre || pre.tagName !== 'PRE') return;
  const code = pre.querySelector('code');
  const text = code ? code.textContent : pre.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = '✅ 已复制';
    setTimeout(() => { btn.textContent = original; }, 1500);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const original = btn.textContent;
    btn.textContent = '✅ 已复制';
    setTimeout(() => { btn.textContent = original; }, 1500);
  });
}

// ===== 章节内交互（锚点、代码块等）=====
function setupChapterInteractions(container) {
  // 展开/折叠 callout（Quarto 用 class="callout-warning/note/tip"，不用 data-callout）
  container.querySelectorAll('.callout-warning, .callout-note, .callout-tip, .callout-important').forEach(el => {
    el.classList.add('callout-collapsed');
    // 找到已有的 .callout-header，追加 toggle 按钮并绑定点击
    const header = el.querySelector('.callout-header');
    if (header) {
      const toggle = document.createElement('span');
      toggle.className = 'callout-toggle';
      toggle.textContent = '▶';
      toggle.style.cursor = 'pointer';
      header.appendChild(toggle);
      header.addEventListener('click', () => {
        el.classList.toggle('callout-collapsed');
        toggle.textContent = el.classList.contains('callout-collapsed') ? '▶' : '▼';
      });
    }
  });

  container.querySelectorAll('.chapter-copy-button').forEach(btn => {
    btn.addEventListener('click', () => copyCodeBlock(btn));
  });

  // 折叠细节标签
  container.querySelectorAll('details').forEach(d => {
    if (!d.querySelector('summary')) {
      const summary = document.createElement('summary');
      summary.textContent = '详情';
      d.insertBefore(summary, d.firstChild);
    }
  });
}

// ===== 搜索 =====
function initSearch() {
  const input = $('search-input');
  const results = $('search-results');
  if (!input || !results) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML = ''; return; }
    const matches = ALL_CHAPTERS.filter(ch =>
      [ch.title, ch.groupName, ch.file, String(ch.num)].some(field =>
        String(field).toLowerCase().includes(q)
      )
    ).slice(0, 8);
    if (!matches.length) { results.innerHTML = '<div class="search-empty">无结果</div>'; return; }
    results.innerHTML = matches.map(ch =>
      `<a href="#" class="search-result" data-nav-group="${ch.group}" data-nav-index="${ch.index}">${ch.title}<span class="search-result-meta">${ch.groupName}</span></a>`
    ).join('');
    results.querySelectorAll('.search-result').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const { navGroup, navIndex } = a.dataset;
        navigateToChapter(navGroup, parseInt(navIndex, 10));
        input.value = '';
        results.innerHTML = '';
      });
    });
  });

  input.addEventListener('blur', () => setTimeout(() => { results.innerHTML = ''; }, 200));
}

// ===== 进度 =====

// ===== Toast =====
window.showToast = function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  buildNav();
  initSearch();
  initGlobalActions();

  // 主题切换
  const themeBtn = $('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // 移动端菜单
  const menuToggle = $('menu-toggle');
  const sidebar = $('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    sidebar.addEventListener('click', e => {
      if (e.target === sidebar) sidebar.classList.remove('open');
    });
  }

  // 分组展开/折叠
  document.querySelectorAll('.nav-group-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const content = document.getElementById(`${group}-chapters`);
      if (content) content.style.display = expanded ? 'none' : 'block';
    });
  });

  updateChapterCount();
  updateStaticCounts();

  // 学习路线 tab 切换
  document.querySelectorAll('.path-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.path-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.path-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const target = document.getElementById('path-' + this.dataset.path);
      if (target) target.classList.add('active');
    });
  });

  // ===== Hash 路由 =====
  // 页面加载时检查 hash（用 setTimeout 确保 buildNav 已完成）
  if (window.location.hash) {
    setTimeout(navigateByHash, 0);
  }
});

// ===== Hash 路由 =====
function navigateByHash() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;
  for (const [groupKey, list] of Object.entries(CHAPTERS)) {
    const idx = list.findIndex(ch => ch.id === hash);
    if (idx !== -1) {
      if (currentGroup === groupKey && currentIndex === idx) return;
      // 用 navigateToChapter 统一处理（含 home-btn 显示）
      navigateToChapter(groupKey, idx);
      return;
    }
  }
}

window.addEventListener('hashchange', navigateByHash);

// ===== 返回首页 =====
window.showWelcome = function() {
  history.replaceState(null, '', window.location.pathname);
  currentGroup = null;
  currentIndex = 0;
  const wrapper = $('chapter-content');
  const welcome = $('welcome');
  if (wrapper) { wrapper.innerHTML = ''; wrapper.classList.remove('active'); }
  if (welcome) welcome.classList.add('active');
  document.querySelectorAll('.chapter-link').forEach(a => a.classList.remove('active'));
  const titleEl = $('current-chapter-title');
  if (titleEl) titleEl.textContent = 'R语言实战医学统计';
  const homeBtn = $('home-btn');
  if (homeBtn) homeBtn.style.display = 'none';
};
