"use strict";

import { ALL_CHAPTERS, CHAPTERS, GROUP_CONFIG, saveProgress, updateProgressBar } from './chapters.js';

// ===== 状态 =====
let currentGroup = null;
let currentIndex = 0;

// ===== 章节内容缓存 =====
const chapterCache = new Map();

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
  updateProgressBar();
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

  if (currentGroup === groupKey && currentIndex === index) {
    updateActiveLink(groupKey, index);
    const homeBtn = $('home-btn');
    if (homeBtn) homeBtn.style.display = 'inline-block';
    return;
  }

  history.replaceState(null, '', '#' + chapter.id);
  saveProgress(chapter.id);

  currentGroup = groupKey;
  currentIndex = index;

  updateActiveLink(groupKey, index);

  const titleEl = $('current-chapter-title');
  if (titleEl) titleEl.textContent = chapter.title;

  const homeBtn = $('home-btn');
  if (homeBtn) homeBtn.style.display = 'inline-block';

  loadChapter(chapter.file);

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

  if (welcome) welcome.classList.remove('active');
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

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const main = doc.getElementById('quarto-document-content');
      if (!main) throw new Error('无法解析章节内容');

      main.querySelectorAll('script').forEach(s => s.remove());

      contentHtml = main.innerHTML;
      contentHtml = injectCopyButtons(contentHtml);
      chapterCache.set(filename, contentHtml);
    }

    wrapper.innerHTML = contentHtml;
    pruneMisplacedChapterWidgets(wrapper, filename);
    rewriteChapterLinks(wrapper);

    Prism.highlightAll();
    setupChapterInteractions(wrapper);

    if (window.initStatViz) window.initStatViz();
    if (window.setupStatVizObserver) window.setupStatVizObserver();

    updateChapterCount();
    updateNavGroupExpansion();
  } catch (err) {
    wrapper.innerHTML = `<div class="error">加载失败：${err.message}</div>`;
  }
}

function updateNavGroupExpansion() {
  if (!currentGroup) return;
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

function injectCopyButtons(html) {
  return html.replace(
    /<button([^>]*)class="code-copy-button"([^>]*)>[\s\S]*?<\/button>/g,
    `<button$1class="code-copy-button chapter-copy-button"$2 type="button" title="复制代码" aria-label="复制代码">📋</button>`
  );
}

function pruneMisplacedChapterWidgets(container, filename) {
  if (filename === '1001-ttest.html') {
    const pvalues = container.querySelectorAll('.stat-viz[data-type="pvalue"]');
    if (pvalues.length > 1) {
      pvalues[0].remove();
    }

    const introBox = container.querySelector('.stat-viz[data-type="box"]');
    if (introBox) introBox.remove();

    const introPs = Array.from(container.querySelectorAll('p'));
    const introLead = introPs.find(p => p.textContent.includes('t检验主要适用于1组或2组的均数的比较'));
    if (introLead) {
      introLead.textContent = 't检验用于比较一组均数、配对差值均数或两组均数。经典两样本 t 检验通常要求数据近似正态且方差齐；若两组方差不齐，可使用 Welch t 检验。这里不展开推导，只聚焦如何用 R 完成常见 t 检验。';
    }

    const introExplore = introPs.find(p => p.textContent.trim() === '正态性检验与分布探索：');
    if (introExplore) {
      introExplore.textContent = '先用图形直观感受正态分布和样本分布：';
    }

    const introFunc = introPs.find(p => p.textContent.includes('在R中进行t检验非常简单，就是'));
    if (introFunc) {
      introFunc.textContent = '在 R 中进行 t 检验非常简单，核心函数就是 t.test()。单样本、配对样本和两样本 t 检验都可以通过这个函数完成。';
    }

    const oneSampleResult = introPs.find(p => p.textContent.includes('结果显示t=-2.1367'));
    if (oneSampleResult) {
      oneSampleResult.textContent = '结果显示 t = -2.1367，df = 35，P = 0.03969，和课本一致。下面两个组件分别用于直观看 P 值所在位置，以及自己动手改参数体会 t 检验结果如何变化。';
    }

    const pairedData = introPs.find(p => p.textContent.includes('数据一共3列10行，第1列是样本编号'));
    if (pairedData) {
      pairedData.textContent = '数据一共 3 列 10 行：第 1 列是样本编号，第 2 列和第 3 列分别是配对比较的两次测量值。';
    }

    const twoSampleRead = introPs.find(p => p.textContent.trim() === '首先是读取数据.');
    if (twoSampleRead) {
      twoSampleRead.textContent = '首先读取数据。';
    }

    const h14 = container.querySelector('h2#正态性检验和两样本方差比较的f检验');
    if (h14) {
      h14.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) node.textContent = '\u00A0 正态性检验与方差齐性检验';
      });
      const chapterTitle = h14.querySelector('.header-section-number');
      if (chapterTitle && chapterTitle.nextSibling) {
        chapterTitle.nextSibling.textContent = '\u00A0 正态性检验与方差齐性检验';
      }
    }

    const toc14 = container.querySelector('a[href="#正态性检验和两样本方差比较的f检验"]');
    if (toc14) {
      toc14.innerHTML = '<span class="header-section-number">1.4</span> 正态性检验与方差齐性检验';
    }

    const startP = Array.from(container.querySelectorAll('p')).find(p =>
      p.textContent.includes('如果数据格式是两列数据')
    );
    if (startP) {
      let node = startP;
      while (node) {
        const next = node.nextElementSibling;
        const stop = node.tagName === 'BLOCKQUOTE';
        node.remove();
        if (stop) break;
        node = next;
      }
    }
  }

  if (filename === '1002-anova.html') {
    const anovas = container.querySelectorAll('.stat-viz[data-type="anova"]');
    if (anovas.length > 1) {
      anovas[1].remove();
    }

    const anovaPs = Array.from(container.querySelectorAll('p'));
    const blockResult = anovaPs.find(p => p.textContent.includes('区组间F值=5.798'));
    if (blockResult) {
      blockResult.textContent = '结果显示区组间自由度为4，分组间自由度为2，组内自由度为8，区组间离均差平方和为0.2284，分组间离均差平方和为0.2280，组内离均差平方和为0.0764，区组间均方为0.05709，分组间均方为0.1140，组内均方为0.00955，区组间F值=5.978，p=0.01579，分组间F值=11.937，p=0.00397，和课本一致。';
    }

    const latinResult = anovaPs.find(p => p.textContent.includes('组内离均差平方和为0.0683.2'));
    if (latinResult) {
      latinResult.textContent = '结果显示行区组间自由度为5，列区组间自由度为5，分组（处理因素）间自由度为5，组内自由度为20；行区组间离均差平方和为250.5，列区组间离均差平方和为85.5，分组间离均差平方和为667.1，组内离均差平方和为683.2；行区组间均方为50.09，列区组间均方为17.09，分组间均方为133.43，组内均方为34.16，行区组间F值=1.466，p=0.2447，列区组间F值=0.5，p=0.7723，分组间F值=3.906，p=0.0124，和课本一致。';
    }
  }

  if (filename === '1012-randomgroup.html') {
    container.querySelectorAll('.stat-viz[data-type="samplesizecalc"]').forEach(el => el.remove());
  }

  if (filename === '1038-p4trend.html') {
    container.querySelectorAll('.stat-viz[data-type="subgroupforest"]').forEach(el => el.remove());
  }

  if (filename === '1039-nonlinear.html') {
    container.querySelectorAll('.stat-viz[data-type="dose"]').forEach(el => el.remove());
  }
}

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

function setupChapterInteractions(container) {
  container.querySelectorAll('.callout-warning, .callout-note, .callout-tip, .callout-important').forEach(el => {
    el.classList.add('callout-collapsed');
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

  container.querySelectorAll('details').forEach(d => {
    if (!d.querySelector('summary')) {
      const summary = document.createElement('summary');
      summary.textContent = '详情';
      d.insertBefore(summary, d.firstChild);
    }
  });
}

function initSearch() {
  const input = $('search-input');
  const results = $('search-results');
  if (!input || !results) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.innerHTML = '';
      return;
    }
    const matches = ALL_CHAPTERS.filter(ch =>
      [ch.title, ch.groupName, ch.file, String(ch.num)].some(field => String(field).toLowerCase().includes(q))
    ).slice(0, 8);
    if (!matches.length) {
      results.innerHTML = '<div class="search-empty">无结果</div>';
      return;
    }
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

  input.addEventListener('blur', () => setTimeout(() => {
    results.innerHTML = '';
  }, 200));
}

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

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  buildNav();
  initSearch();
  initGlobalActions();

  const themeBtn = $('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const menuToggle = $('menu-toggle');
  const sidebar = $('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    sidebar.addEventListener('click', e => {
      if (e.target === sidebar) sidebar.classList.remove('open');
    });
  }

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

  document.querySelectorAll('.path-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.path-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.path-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const target = document.getElementById('path-' + this.dataset.path);
      if (target) target.classList.add('active');
    });
  });

  if (window.location.hash) {
    setTimeout(navigateByHash, 0);
  }
});

function navigateByHash() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;
  for (const [groupKey, list] of Object.entries(CHAPTERS)) {
    const idx = list.findIndex(ch => ch.id === hash);
    if (idx !== -1) {
      if (currentGroup === groupKey && currentIndex === idx) return;
      navigateToChapter(groupKey, idx);
      return;
    }
  }
}

window.addEventListener('hashchange', navigateByHash);

window.showWelcome = function() {
  history.replaceState(null, '', window.location.pathname);
  currentGroup = null;
  currentIndex = 0;
  const wrapper = $('chapter-content');
  const welcome = $('welcome');
  if (wrapper) {
    wrapper.innerHTML = '';
    wrapper.classList.remove('active');
  }
  if (welcome) welcome.classList.add('active');
  document.querySelectorAll('.chapter-link').forEach(a => a.classList.remove('active'));
  const titleEl = $('current-chapter-title');
  if (titleEl) titleEl.textContent = 'R语言实战医学统计';
  const homeBtn = $('home-btn');
  if (homeBtn) homeBtn.style.display = 'none';
};
