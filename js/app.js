"use strict";

import { ALL_CHAPTERS, CHAPTERS, GROUP_CONFIG, saveProgress, updateProgressBar, clearProgress } from './chapters.js';
import { applyChapterPatches } from './chapter-patches.js';
import { createAppState } from './app/state.js';
import { createChapterLookupMaps, findChapterByHref, getHashChapterTarget, injectCopyButtons } from './app/chapter-content.js';
import { initTheme as initThemeState, toggleTheme as toggleThemeState } from './app/theme.js';
import { findMatchingChapters } from './app/search.js';
import { resolveNavigationTarget, shouldSkipNavigation, getActiveLinkSelector } from './app/navigation.js';
import { createLoaderLifecycle, shouldUseCachedChapter, createChapterProgressTimer } from './app/chapter-loader.js';
import { findCodeBlockText, ensureDetailsHaveSummary, prepareCallouts } from './app/chapter-interactions.js';
import { getWelcomeAction, shouldOpenSidebarFromOverlayClick } from './app/ui-shell.js';
import { shouldCloseLightboxOnClick, shouldCloseLightboxOnEscape, shouldOpenLightboxForTarget } from './app/lightbox.js';
import { parseChapterMainContent, removeBreadcrumbs } from './app/chapter-dom.js';
import { createToastLifecycle } from './app/toast.js';
import { getNextExpandedState, getPathTargetId } from './app/nav-shell.js';

// ===== 状态 =====
const appState = createAppState();

// ===== DOM =====
const $ = id => document.getElementById(id);
const chapterLookupMaps = createChapterLookupMaps(ALL_CHAPTERS);

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
  initThemeState({
    root: document.documentElement,
    button: $('theme-toggle'),
    storage: localStorage,
  });
}

function toggleTheme() {
  toggleThemeState({
    root: document.documentElement,
    button: $('theme-toggle'),
    storage: localStorage,
  });
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
  const normalizedAction = getWelcomeAction(action);
  if (normalizedAction === 'scroll-task-nav') {
    const taskNav = $('task-nav');
    if (taskNav) taskNav.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (normalizedAction === 'open-all-chapters') {
    expandAllChapterGroups();
  }
}

function initGlobalActions() {
  const continueBtn = $('btn-continue');
  if (continueBtn) continueBtn.addEventListener('click', continueLearning);

  const homeBtn = $('home-btn');
  if (homeBtn) homeBtn.addEventListener('click', showWelcome);

  const resetBtn = $('btn-reset-progress');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    clearProgress();
    window.showToast('学习进度已重置');
  });

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
  const target = resolveNavigationTarget(groupKey, index, CHAPTERS);
  if (!target) return;

  const { chapter } = target;
  const currentPosition = appState.getCurrentPosition();

  if (shouldSkipNavigation(currentPosition, groupKey, index)) {
    updateActiveLink(groupKey, index);
    const homeBtn = $('home-btn');
    if (homeBtn) homeBtn.style.display = 'inline-block';
    return;
  }

  history.replaceState(null, '', '#' + chapter.id);

  appState.setCurrentPosition(groupKey, index);

  updateActiveLink(groupKey, index);

  const titleEl = $('current-chapter-title');
  if (titleEl) titleEl.textContent = chapter.title;

  const homeBtn = $('home-btn');
  if (homeBtn) homeBtn.style.display = 'inline-block';

  loadChapter(chapter.file, chapter.id);

  const sidebar = $('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

function updateActiveLink(groupKey, index) {
  document.querySelectorAll('.chapter-link').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(getActiveLinkSelector(groupKey, index));
  if (activeLink) activeLink.classList.add('active');
}

function rewriteChapterLinks(container) {
  container.querySelectorAll('a[href]').forEach(link => {
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || /^(https?:|mailto:|javascript:|data:)/i.test(rawHref)) return;

    const target = findChapterByHref(rawHref, chapterLookupMaps);
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

async function loadChapter(filename, chapterId) {
  const wrapper = $('chapter-content');
  const welcome = $('welcome');
  if (!wrapper) return;

  createLoaderLifecycle(appState, clearTimeout).beforeLoad();

  if (welcome) welcome.classList.remove('active');
  wrapper.innerHTML = '<div class="loading">加载中...</div>';
  wrapper.classList.add('active');

  try {
    let contentHtml;
    if (shouldUseCachedChapter(appState, filename)) {
      contentHtml = appState.getCachedChapter(filename);
    } else {
      const resp = await fetch(`data/${filename}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();

      contentHtml = parseChapterMainContent(html);
      contentHtml = injectCopyButtons(contentHtml);
      appState.cacheChapter(filename, contentHtml);
    }

    wrapper.innerHTML = contentHtml;
    applyChapterPatches(wrapper, filename);
    rewriteChapterLinks(wrapper);
    removeBreadcrumbs(wrapper);

    Prism.highlightAll();
    setupChapterInteractions(wrapper);

    if (window.initStatViz) window.initStatViz();
    if (window.setupStatVizObserver) window.setupStatVizObserver();

    updateChapterCount();
    updateNavGroupExpansion();

    createChapterProgressTimer({
      chapterId,
      appState,
      schedule: setTimeout,
      saveProgress,
    });
  } catch (err) {
    wrapper.innerHTML = `<div class="error">加载失败：${err.message}</div>`;
  }
}

function updateNavGroupExpansion() {
  const { group: currentGroup } = appState.getCurrentPosition();
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

function copyCodeBlock(btn) {
  const text = findCodeBlockText(btn);
  if (!text) return;
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
  prepareCallouts(Array.from(container.querySelectorAll('.callout-warning, .callout-note, .callout-tip, .callout-important')));

  container.querySelectorAll('.chapter-copy-button').forEach(btn => {
    btn.addEventListener('click', () => copyCodeBlock(btn));
  });

  ensureDetailsHaveSummary(Array.from(container.querySelectorAll('details')));
}

function initSearch() {
  const input = $('search-input');
  const results = $('search-results');
  if (!input || !results) return;

  input.addEventListener('input', () => {
    const matches = findMatchingChapters(input.value, ALL_CHAPTERS);
    if (!matches.length) {
      results.innerHTML = input.value.trim() ? '<div class="search-empty">无结果</div>' : '';
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
  createToastLifecycle().show(msg);
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  buildNav();
  initSearch();
  initGlobalActions();
  initLightbox();

  const themeBtn = $('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const menuToggle = $('menu-toggle');
  const sidebar = $('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    sidebar.addEventListener('click', e => {
      if (shouldOpenSidebarFromOverlayClick(e.target, sidebar)) sidebar.classList.remove('open');
    });
  }

  document.querySelectorAll('.nav-group-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      const expanded = getNextExpandedState(btn.getAttribute('aria-expanded'));
      btn.setAttribute('aria-expanded', String(expanded));
      const content = document.getElementById(`${group}-chapters`);
      if (content) content.style.display = expanded ? 'block' : 'none';
    });
  });

  updateChapterCount();
  updateStaticCounts();

  document.querySelectorAll('.path-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.path-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.path-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const target = document.getElementById(getPathTargetId(this.dataset.path));
      if (target) target.classList.add('active');
    });
  });

  if (window.location.hash) {
    setTimeout(navigateByHash, 0);
  }
});

function initLightbox() {
  const overlay = document.getElementById('lightbox-overlay');
  const img = overlay ? overlay.querySelector('img') : null;
  if (!overlay || !img) return;

  function openLightbox(src, alt) {
    img.src = src;
    img.alt = alt || '';
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => { img.src = ''; img.alt = ''; }, 200);
  }

  overlay.addEventListener('click', e => {
    if (shouldCloseLightboxOnClick(e.target, overlay)) {
      closeLightbox();
    }
  });
  document.addEventListener('keydown', e => {
    if (shouldCloseLightboxOnEscape(e, overlay)) closeLightbox();
  });

  document.addEventListener('click', e => {
    const target = shouldOpenLightboxForTarget(e);
    if (target) {
      e.preventDefault();
      openLightbox(target.src, target.alt);
    }
  });
}

function navigateByHash() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;

  const target = getHashChapterTarget(hash, ALL_CHAPTERS);
  if (!target) return;

  const currentPosition = appState.getCurrentPosition();
  if (currentPosition.group === target.group && currentPosition.index === target.index) return;

  navigateToChapter(target.group, target.index);
}

window.addEventListener('hashchange', navigateByHash);

window.showWelcome = function() {
  history.replaceState(null, '', window.location.pathname);
  appState.resetCurrentPosition();
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
