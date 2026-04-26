// ================================================================
// progress-widget.js — 当前章节阅读进度 + 章节小标题跳转
// ================================================================

let widget = null;
let expanded = false;

function buildWidget() {
  const el = document.createElement('div');
  el.id = 'progress-widget';
  document.body.appendChild(el);

  el.addEventListener('click', () => {
    toggle(el);
  });

  render(el);
  return el;
}

function render(el) {
  el.innerHTML = `
    <div class="pw-summary">
      <div class="pw-bar-wrap">
        <div class="pw-bar-fill" id="pw-fill"></div>
      </div>
      <div class="pw-label" id="pw-label">0%</div>
      <button class="pw-chevron" aria-label="章节小标题">${expanded ? '▲' : '▼'}</button>
    </div>
    <div class="pw-toc" id="pw-toc" style="display:${expanded ? '' : 'none'}"></div>
  `;

  // TOC 由 JS 动态填充
  if (expanded) bindTOC(el);
  updateScrollProgress(el);
}

function toggle(el) {
  expanded = !expanded;
  const toc = el.querySelector('#pw-toc');
  const chevron = el.querySelector('.pw-chevron');
  if (toc) toc.style.display = expanded ? '' : 'none';
  if (chevron) chevron.textContent = expanded ? '▲' : '▼';
  if (expanded) bindTOC(el);
}

function bindTOC(el) {
  const toc = el.querySelector('#pw-toc');
  if (!toc) return;

  const content = document.getElementById('chapter-content');
  if (!content) return;

  // 提取当前章节的所有 h2 / h3
  const headings = Array.from(content.querySelectorAll('h2[id], h3[id]'));
  if (headings.length === 0) {
    toc.innerHTML = '<div class="pw-toc-empty">本页无小标题</div>';
    return;
  }

  toc.innerHTML = headings.map(h => {
    const level = h.tagName.toLowerCase();
    const text = h.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
    return `<div class="pw-toc-item pw-toc-${level}" data-id="${h.id}">${text}</div>`;
  }).join('');

  toc.querySelectorAll('.pw-toc-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = item.dataset.id;
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // 点击后收起
      expanded = false;
      const chevron = el.querySelector('.pw-chevron');
      const tocEl = el.querySelector('#pw-toc');
      if (tocEl) tocEl.style.display = 'none';
      if (chevron) chevron.textContent = '▼';
    });
  });
}

function updateScrollProgress(el) {
  const content = document.getElementById('chapter-content');
  if (!content) return;

  const scrollTop = content.scrollTop || document.documentElement.scrollTop;
  const scrollHeight = content.scrollHeight - content.clientHeight;
  const pct = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 100;

  const fill = el.querySelector('#pw-fill');
  const label = el.querySelector('#pw-label');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = pct + '%';
}

export function initProgressWidget() {
  const build = () => {
    widget = buildWidget();

    // 监听章节切换
    const observer = new MutationObserver(() => {
      const content = document.getElementById('chapter-content');
      if (content) {
        content.addEventListener('scroll', () => updateScrollProgress(widget), { passive: true });
        // 章节内容切换后重新渲染（收起 TOC）
        if (expanded) {
          expanded = false;
          render(widget);
        }
      }
    });

    const main = document.getElementById('main-content');
    if (main) observer.observe(main, { childList: true, subtree: true });

    // 初始绑定
    const content = document.getElementById('chapter-content');
    if (content) content.addEventListener('scroll', () => updateScrollProgress(widget), { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
}

export function refreshProgressWidget() {}
