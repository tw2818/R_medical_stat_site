"use strict";

// ===== 状态 =====
let currentGroup = null;
let currentIndex = 0;
let currentChapterData = null;


const GROUP_CONFIG = [
  { key: 'basic', el: 'basic-chapters', label: '基础统计分析' },
  { key: 'advanced', el: 'advanced-chapters', label: '高级统计分析' },
  { key: 'literature', el: 'other-chapters', label: '文献常见统计分析' },
  { key: 'other', el: 'other-chapters', label: '其他合集' },
];

// ===== DOM =====
const $ = id => document.getElementById(id);

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
      a.href = '#';
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
  GROUP_CONFIG.forEach(({ key }) => {
    const list = CHAPTERS[key] || [];
    const countEl = $(`${key}-count`);
    if (countEl) countEl.textContent = `0/${list.length}`;
  });
}

function navigateToChapter(groupKey, index) {
  const list = CHAPTERS[groupKey] || [];
  if (!list[index]) return;

  currentGroup = groupKey;
  currentIndex = index;
  const chapter = list[index];

  // 更新侧边栏激活状态
  document.querySelectorAll('.chapter-link').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`.chapter-link[data-group="${groupKey}"][data-index="${index}"]`);
  if (activeLink) activeLink.classList.add('active');

  // 更新顶部标题
  const titleEl = $('current-chapter-title');
  if (titleEl) titleEl.textContent = chapter.title;

  // 加载章节内容
  loadChapter(chapter.file);

  // 关闭侧边栏（移动端）
  const sidebar = $('sidebar');
  if (sidebar) sidebar.classList.remove('open');
  updateProgress();
}

async function loadChapter(filename) {
  const wrapper = $('chapter-content');
  const welcome = $('welcome');
  if (!wrapper) return;

  welcome && welcome.classList.remove('active');
  wrapper.innerHTML = '<div class="loading">加载中...</div>';
  wrapper.classList.add('active');

  try {
    const resp = await fetch(`data/${filename}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    let html = await resp.text();

    // 注入复制按钮到代码块
    html = injectCopyButtons(html);

    wrapper.innerHTML = html;

    // 渲染完成后注入交互
    Prism.highlightAll();
    setupChapterInteractions(wrapper);

    // 更新章节计数
    updateChapterCount();
    updateNavGroupExpansion();
  } catch (err) {
    wrapper.innerHTML = `<div class="error">加载失败：${err.message}</div>`;
  }
}

function injectCopyButtons(html) {
  // 为每个 pre.sourceCode 注入复制按钮
  return html.replace(
    /(<pre class="sourceCode[^"]*">)/g,
    '<div class="code-block-wrapper">$1'
  ).replace(
    /(<pre class="sourceCode[^">]*">)/g,
    '<div class="code-block-wrapper"><button class="code-copy-btn" title="复制代码" onclick="copyCodeBlock(this)">📋 复制</button>$1'
  ).replace(
    /<\/pre>/g,
    '</pre></div>'
  );
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

// ===== 代码复制 =====
window.copyCodeBlock = function(btn) {
  const pre = btn.nextElementSibling;
  if (!pre || !pre.tagName === 'PRE') return;
  const code = pre.querySelector('code');
  const text = code ? code.textContent : pre.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = '✅ 已复制';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 1500);
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✅ 已复制';
    setTimeout(() => { btn.textContent = '📋 复制'; }, 1500);
  });
};

function copyCode(btn) {
  const code = decodeURIComponent(btn.dataset.code || '');
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => {
    showToast('代码已复制');
  });
}

// ===== 章节内交互（锚点、代码块等）=====
function setupChapterInteractions(container) {
  // 展开/折叠章节
  container.querySelectorAll('.callout[data-callout]').forEach(el => {
    el.classList.add('callout-collapsed');
    const header = document.createElement('div');
    header.className = 'callout-header';
    const type = el.dataset.callout;
    header.innerHTML = `<span>${type === 'warning' ? '⚠️' : type === 'note' ? 'ℹ️' : '📌'} ${type}</span><span class="callout-toggle">▶</span>`;
    header.addEventListener('click', () => {
      el.classList.toggle('callout-collapsed');
      const toggle = header.querySelector('.callout-toggle');
      if (toggle) toggle.textContent = el.classList.contains('callout-collapsed') ? '▶' : '▼';
    });
    el.insertBefore(header, el.firstChild);
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
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const results = $('search-results');
    if (!results) return;
    if (!q) { results.innerHTML = ''; return; }
    const matches = ALL_CHAPTERS.filter(ch =>
      ch.title.toLowerCase().includes(q)
    ).slice(0, 8);
    if (!matches.length) { results.innerHTML = '<div class="search-empty">无结果</div>'; return; }
    results.innerHTML = matches.map(ch =>
      `<a href="#" class="search-result" data-group="${ch.group}" data-index="${ch.index}">${ch.title}</a>`
    ).join('');
    results.querySelectorAll('.search-result').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const { group, index } = a.dataset;
        navigateToChapter(group, parseInt(index));
        input.value = '';
        results.innerHTML = '';
      });
    });
  });
  input.addEventListener('blur', () => setTimeout(() => { if (results) results.innerHTML = ''; }, 200));
}

// ===== 进度 =====
function updateProgress() {
  const total = getTotalChapterCount();
  const text = $('progress-text');
  if (text) text.textContent = `0/${total}`;
  const fill = $('progress-fill');
  if (fill) fill.style.width = '0%';
}

// ===== Toast =====
function showToast(msg) {
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
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  buildNav();
  initSearch();

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

  updateProgress();
  updateStaticCounts();
});
