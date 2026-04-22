// ================================================================
// _core.js - 共享工具函数 + 注册表 + 核心调度逻辑
// ================================================================

// ── 工具函数 ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

function parseNumbers(text) {
  return text.trim()
    .split(/[,\s]+/)
    .map(v => parseFloat(v))
    .filter(v => !isNaN(v) && isFinite(v));
}

function mean(arr) { return arr.reduce((a,b)=>a+b,0)/arr.length; }

function sd(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s,x)=>s+(x-m)**2,0)/(arr.length-1));
}

function sum(arr) { return arr.reduce((a,b)=>a+b,0); }

// ── jStat 可用性检测 + fallback 警告 ──────────────────────
// 所有组件在 jStat 不可用时应调用此函数：
//   if (!ensureJStat(el)) return;
// 会在 el 顶部追加黄色警告 banner，只出现一次。
function ensureJStat(el) {
  if (window.jStat && window.jStat.studentt) return true;
  const already = el.querySelector('.jstat-warn');
  if (!already) {
    const warn = document.createElement('div');
    warn.className = 'jstat-warn';
    warn.textContent = '⚠️ jStat 未加载，图形为近似示意，数值不精确';
    el.insertBefore(warn, el.firstChild);
  }
  return false;
}

function makeCanvas(container, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.className = 'viz-canvas';
  container.appendChild(canvas);
  return canvas;
}

// ── 注册表 ────────────────────────────────────────────────
export const StatVizRegistry = {};
let vizObserver = null;

export function registerViz(type, fn) {
  StatVizRegistry[type] = fn;
}

// ── renderComponent ───────────────────────────────────────
function renderComponent(el) {
  const type = el.dataset.type;
  if (!type) return;
  const fn = StatVizRegistry[type];
  if (fn) {
    fn(el);
  } else {
    console.warn('[stats-viz] Unknown type:', type);
  }
}

// ── init ──────────────────────────────────────────────────
function init() {
  document.querySelectorAll('.stat-viz, .stat-calc').forEach(el => {
    if (el.dataset.rendered) return;
    try {
      renderComponent(el);
      el.dataset.rendered = 'true';
    } catch(e) { console.error('[stats-viz] render error:', e); }
  });
}

// ── setupObserver ────────────────────────────────────────
function setupObserver() {
  const target = document.getElementById('chapter-content') || document.body;
  if (vizObserver) vizObserver.disconnect();

  vizObserver = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.querySelectorAll) {
          if (node.matches?.('.stat-viz, .stat-calc') && !node.dataset.rendered) {
            try {
              renderComponent(node);
              node.dataset.rendered = 'true';
            } catch(e) { console.error('[stats-viz] render error:', e); }
          }
          node.querySelectorAll('.stat-viz, .stat-calc').forEach(el => {
            if (!el.dataset.rendered) {
              try {
                renderComponent(el);
                el.dataset.rendered = 'true';
              } catch(e) { console.error('[stats-viz] render error:', e); }
            }
          });
        }
      });
    });
  });
  vizObserver.observe(target, { childList: true, subtree: true });
}

export { $, parseNumbers, mean, sd, sum, ensureJStat, makeCanvas, renderComponent, init, setupObserver };
