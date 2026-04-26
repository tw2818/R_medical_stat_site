// ================================================================
// progress-widget.js — 章节阅读进度悬浮窗
// 固定在右下角，点击展开分组进度详情
// ================================================================

import { ALL_CHAPTERS, CHAPTERS, GROUP_CONFIG, getProgress } from '../chapters.js';

let widget = null;
let expanded = false;

function getGroupLabel(key) {
  const map = {
    basic:    '📈 基础统计分析',
    advanced: '🔬 高级统计分析',
    literature: '📚 文献常见统计',
    other:    '📎 其他合集',
  };
  return map[key] || key;
}

function buildWidget() {
  const el = document.createElement('div');
  el.id = 'progress-widget';
  el.innerHTML = buildInnerHTML();
  document.body.appendChild(el);

  el.addEventListener('click', (e) => {
    if (e.target.closest('.pw-close')) {
      collapse(el);
      return;
    }
    if (e.target.closest('.pw-toggle') || !expanded) {
      toggle(el);
    }
  });

  return el;
}

function buildInnerHTML() {
  const visited = getProgress();
  const total = ALL_CHAPTERS.length;
  const done = visited.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const groups = GROUP_CONFIG.map(({ key }) => {
    const groupDone = CHAPTERS[key].filter(ch => visited.includes(ch.id)).length;
    const groupTotal = CHAPTERS[key].length;
    const groupPct = groupTotal > 0 ? Math.round((groupDone / groupTotal) * 100) : 0;
    return `
      <div class="pw-group">
        <div class="pw-group-label">${getGroupLabel(key)}</div>
        <div class="pw-group-bar-wrap">
          <div class="pw-group-bar-fill" style="width:${groupPct}%"></div>
        </div>
        <div class="pw-group-count">${groupDone}/${groupTotal}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="pw-summary">
      <svg class="pw-ring" width="44" height="44" viewBox="0 0 44 44">
        <circle class="pw-ring-track" cx="22" cy="22" r="${r}"/>
        <circle class="pw-ring-fill" cx="22" cy="22" r="${r}"
          style="stroke-dasharray:${circ};stroke-dashoffset:${offset}"/>
      </svg>
      <div class="pw-info">
        <div class="pw-pct">${pct}%</div>
        <div class="pw-count">${done}/${total}</div>
      </div>
      <button class="pw-toggle" aria-label="展开进度详情">▶</button>
      <button class="pw-close" aria-label="收起">✕</button>
    </div>
    <div class="pw-detail" style="display:none">
      <div class="pw-detail-title">阅读进度</div>
      ${groups}
    </div>
  `;
}

function toggle(el) {
  expanded = !expanded;
  const detail = el.querySelector('.pw-detail');
  const toggleBtn = el.querySelector('.pw-toggle');
  if (expanded) {
    detail.style.display = 'block';
    toggleBtn.textContent = '▼';
    el.classList.add('pw-expanded');
  } else {
    detail.style.display = 'none';
    toggleBtn.textContent = '▶';
    el.classList.remove('pw-expanded');
  }
}

function collapse(el) {
  expanded = false;
  const detail = el.querySelector('.pw-detail');
  detail.style.display = 'none';
  el.querySelector('.pw-toggle').textContent = '▶';
  el.classList.remove('pw-expanded');
}

export function initProgressWidget() {
  // 延迟到 DOM 就绪
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { widget = buildWidget(); });
  } else {
    widget = buildWidget();
  }
}

export function refreshProgressWidget() {
  if (!widget) return;
  const newHTML = buildInnerHTML();
  // 保留展开状态
  const wasExpanded = expanded;
  widget.innerHTML = newHTML;
  expanded = wasExpanded;
  if (expanded) {
    widget.querySelector('.pw-detail').style.display = 'block';
    widget.querySelector('.pw-toggle').textContent = '▼';
    widget.classList.add('pw-expanded');
  }
}
