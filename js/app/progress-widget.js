// ================================================================
// progress-widget.js — 当前章节阅读进度悬浮窗
// 固定右下角，显示滚动进度百分比
// ================================================================

let widget = null;
let scrollY = 0;

function buildWidget() {
  const el = document.createElement('div');
  el.id = 'progress-widget';
  el.innerHTML = `
    <div class="pw-bar-wrap">
      <div class="pw-bar-fill" id="pw-fill"></div>
    </div>
    <div class="pw-label" id="pw-label">0%</div>
  `;
  document.body.appendChild(el);

  // 滚动时更新
  const onScroll = () => {
    const content = document.getElementById('chapter-content');
    if (!content || !content.classList.contains('active')) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';

    const scrollTop = content.scrollTop || document.documentElement.scrollTop;
    const scrollHeight = content.scrollHeight - content.clientHeight;
    const pct = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 100;

    const fill = el.querySelector('#pw-fill');
    const label = el.querySelector('#pw-label');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
  };

  // 监听章节切换：章节内容激活时重新绑定
  const observer = new MutationObserver(() => {
    const content = document.getElementById('chapter-content');
    if (content) {
      content.removeEventListener('scroll', onScroll);
      content.addEventListener('scroll', onScroll, { passive: true });
    }
    onScroll();
  });

  const main = document.getElementById('main-content');
  if (main) observer.observe(main, { childList: true, subtree: true });

  // 初始
  onScroll();
  const content = document.getElementById('chapter-content');
  if (content) content.addEventListener('scroll', onScroll, { passive: true });

  return el;
}

export function initProgressWidget() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { widget = buildWidget(); });
  } else {
    widget = buildWidget();
  }
}

// refreshProgressWidget 不需要，滚动进度由 scroll 事件驱动
export function refreshProgressWidget() {}
