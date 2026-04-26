// ================================================================
// progress-widget.js — 当前章节阅读进度 + 章节小标题跳转
// ================================================================

let widget = null;
let expanded = false;

function buildWidget() {
  const el = document.createElement('div');
  el.id = 'progress-widget';
  document.body.appendChild(el);

  el.addEventListener('click', (e) => {
    // 点击小标题条目不要触发展开/收起
    if (e.target.closest('.pw-toc-item')) return;
    toggle(el);
  });

  render(el);
  return el;
}

function render(el) {
  const chevronIcon = expanded ? '▲' : '▼';

  el.innerHTML = `
    <div class="pw-summary">
      <div class="pw-bar-wrap">
        <div class="pw-bar-fill" id="pw-fill"></div>
      </div>
      <div class="pw-label" id="pw-label">0%</div>
      <button class="pw-chevron" aria-label="章节小标题">${chevronIcon}</button>
    </div>
    <div class="pw-toc" id="pw-toc" style="display:${expanded ? '' : 'none'}"></div>
  `;

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

  // 用 data-anchor-id 属性选择（Quarto 生成的章节标题用此属性）
  const headings = Array.from(
    content.querySelectorAll('h2[data-anchor-id], h3[data-anchor-id]')
  );

  if (headings.length === 0) {
    toc.innerHTML = '<div class="pw-toc-empty">本页无小标题</div>';
    return;
  }

  toc.innerHTML = headings.map(h => {
    const level = h.tagName.toLowerCase(); // 'h2' or 'h3'
    const anchor = h.dataset.anchorId;
    // 显示文字：取 header-section-number 后的文本
    const numSpan = h.querySelector('.header-section-number');
    const num = numSpan ? numSpan.textContent.trim() + ' ' : '';
    const text = h.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
    return `<div class="pw-toc-item pw-toc-${level}" data-anchor="${anchor}">${num}${text}</div>`;
  }).join('');

  toc.querySelectorAll('.pw-toc-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const anchor = item.dataset.anchor;
      // 用属性选择器查找（标题没有原生 id，只有 data-anchor-id）
      const target = content.querySelector(`[data-anchor-id="${anchor}"]`);
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
  const container = document.getElementById('content-wrapper');
  if (!container) return;

  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight - container.clientHeight;
  const pct = scrollHeight > 0
    ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100))
    : 100;

  const fill = el.querySelector('#pw-fill');
  const label = el.querySelector('#pw-label');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = pct + '%';
}

export function initProgressWidget() {
  const build = () => {
    widget = buildWidget();

    const observer = new MutationObserver(() => {
      const content = document.getElementById('chapter-content');
      if (content) {
        content.removeEventListener('scroll', onScroll);
        content.addEventListener('scroll', onScroll, { passive: true });
        if (expanded) {
          expanded = false;
          render(widget);
        }
      }
    });

    const main = document.getElementById('main-content');
    if (main) observer.observe(main, { childList: true, subtree: true });

    // 滚动容器是 #content-wrapper
    const container = document.getElementById('content-wrapper');
    if (container) container.addEventListener('scroll', onScroll, { passive: true });
  };

  const onScroll = () => updateScrollProgress(widget);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
}

export function refreshProgressWidget() {}
