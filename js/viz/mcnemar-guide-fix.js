import { registerViz } from './_core.js';

const boxStyle = 'border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;padding:12px;box-shadow:0 1px 2px rgba(15,23,42,.04);';
const muted = 'color:#64748b;font-size:13px;line-height:1.6;';

function erfApprox(x) {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

function normalCDF(x) {
  if (window.jStat?.normal?.cdf) return window.jStat.normal.cdf(x, 0, 1);
  return 0.5 * (1 + erfApprox(x / Math.SQRT2));
}

function chiSquareP(stat, df = 1) {
  if (!Number.isFinite(stat) || stat < 0 || df !== 1) return NaN;
  if (window.jStat?.chisquare?.cdf) return Math.max(0, Math.min(1, 1 - window.jStat.chisquare.cdf(stat, df)));
  return Math.max(0, Math.min(1, 2 * (1 - normalCDF(Math.sqrt(stat)))));
}

function logChoose(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n) return -Infinity;
  const kk = Math.min(k, n - k);
  let s = 0;
  for (let i = 1; i <= kk; i++) s += Math.log(n - kk + i) - Math.log(i);
  return s;
}

function binomPMF(k, n, p = 0.5) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
}

function exactMcNemarP(b, c) {
  const n = b + c;
  if (n === 0) return 1;
  const x = Math.min(b, c);
  let tail = 0;
  for (let k = 0; k <= x; k++) tail += binomPMF(k, n, 0.5);
  return Math.min(1, 2 * tail);
}

function fmt(x, digits = 3) { return Number.isFinite(x) ? x.toFixed(digits) : '—'; }
function fmtP(p) { if (!Number.isFinite(p)) return '—'; if (p < 0.001) return '< 0.001'; return Math.min(1, Math.max(0, p)).toFixed(4); }
function isCount(v) { return Number.isInteger(v) && v >= 0; }
function readNumber(id) { return Number(document.getElementById(id).value); }

function renderMcNemarGuideFixed(el) {
  const id = 'mcnemarguide-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '配对四格表：McNemar 检验只看不一致格子';
  const init = {
    a: Number(el.dataset.a || 35),
    b: Number(el.dataset.b || 12),
    c: Number(el.dataset.c || 4),
    d: Number(el.dataset.d || 49)
  };

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header"><span>📊 ${title}</span></div>
      <div style="padding:14px;background:#f8fafc;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:12px;align-items:start;">
          <div style="${boxStyle}">
            <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">输入配对 2×2 表</div>
            <table style="border-collapse:collapse;width:100%;margin-bottom:10px;">
              <thead><tr><th></th><th>方法B +</th><th>方法B −</th></tr></thead>
              <tbody>
                <tr>
                  <th style="text-align:left;">方法A +</th>
                  <td style="background:#e2e8f0;padding:6px;"><input id="${id}-a" type="number" min="0" step="1" value="${init.a}" style="width:80px;padding:5px;"><div style="font-size:11px;color:#64748b;">a 一致+</div></td>
                  <td style="background:#fee2e2;padding:6px;"><input id="${id}-b" type="number" min="0" step="1" value="${init.b}" style="width:80px;padding:5px;"><div style="font-size:11px;color:#991b1b;">b: A+ / B−</div></td>
                </tr>
                <tr>
                  <th style="text-align:left;">方法A −</th>
                  <td style="background:#fee2e2;padding:6px;"><input id="${id}-c" type="number" min="0" step="1" value="${init.c}" style="width:80px;padding:5px;"><div style="font-size:11px;color:#991b1b;">c: A− / B+</div></td>
                  <td style="background:#e2e8f0;padding:6px;"><input id="${id}-d" type="number" min="0" step="1" value="${init.d}" style="width:80px;padding:5px;"><div style="font-size:11px;color:#64748b;">d 一致−</div></td>
                </tr>
              </tbody>
            </table>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button id="${id}-swap" type="button" style="padding:7px 12px;border:none;border-radius:6px;background:#64748b;color:#fff;cursor:pointer;">交换 b / c</button>
              <button id="${id}-reset" type="button" style="padding:7px 12px;border:none;border-radius:6px;background:#94a3b8;color:#fff;cursor:pointer;">重置</button>
            </div>
          </div>
          <div id="${id}-result" style="${boxStyle}"></div>
        </div>
        <div style="font-size:12px;color:#64748b;text-align:center;margin-top:10px;">
          McNemar 检验只使用不一致对子 b 和 c。a、d 可描述一致性，但不进入检验统计量。
        </div>
      </div>
    </div>`;

  function calc() {
    const a = readNumber(`${id}-a`);
    const b = readNumber(`${id}-b`);
    const c = readNumber(`${id}-c`);
    const d = readNumber(`${id}-d`);
    const out = document.getElementById(`${id}-result`);

    if ([a, b, c, d].some(v => !isCount(v))) {
      out.innerHTML = '<div style="color:#b91c1c;">请输入非负整数频数。</div>';
      return;
    }
    const total = a + b + c + d;
    if (total === 0) {
      out.innerHTML = '<div style="color:#b91c1c;">总配对数不能为 0。</div>';
      return;
    }

    const discordant = b + c;
    const agree = a + d;
    const stat = discordant > 0 ? ((b - c) ** 2) / discordant : 0;
    const yates = discordant > 0 ? ((Math.max(0, Math.abs(b - c) - 1)) ** 2) / discordant : 0;
    const p = discordant > 0 ? chiSquareP(stat, 1) : 1;
    const py = discordant > 0 ? chiSquareP(yates, 1) : 1;
    const exact = exactMcNemarP(b, c);
    const rateA = (a + b) / total;
    const rateB = (a + c) / total;
    const direction = b > c
      ? 'B 的阳性率低于 A；更多对子从 A+ 变为 B−。'
      : (c > b ? 'B 的阳性率高于 A；更多对子从 A− 变为 B+。' : 'b 与 c 相等，未见方向偏向。');
    const methodNote = discordant === 0
      ? '<strong style="color:#b45309;">没有不一致对子，McNemar 检验没有可用差异信息；P 值按 1 处理。</strong>'
      : (discordant < 25 ? '<strong style="color:#b45309;">不一致对子较少时更建议报告精确二项 P 值。</strong>' : '不一致对子数较多时，χ² 近似通常更稳定。');

    out.innerHTML = `
      <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">结果解释</div>
      <div style="${muted}">总配对数 = ${total}；一致对子 a+d = ${agree}；不一致对子 b+c = ${discordant}。</div>
      <div style="${muted}">A 阳性率 = ${(100 * rateA).toFixed(1)}%；B 阳性率 = ${(100 * rateB).toFixed(1)}%。${direction}</div>
      <div style="${muted}">未校正 McNemar χ² = ${fmt(stat)}，P = ${fmtP(p)}。</div>
      <div style="${muted}">连续性校正 χ² = ${fmt(yates)}，P = ${fmtP(py)}。</div>
      <div style="${muted}">精确二项检验 P = ${fmtP(exact)}。${methodNote}</div>`;
  }

  ['a', 'b', 'c', 'd'].forEach(cell => document.getElementById(`${id}-${cell}`).addEventListener('input', calc));
  document.getElementById(`${id}-swap`).addEventListener('click', () => {
    const bEl = document.getElementById(`${id}-b`);
    const cEl = document.getElementById(`${id}-c`);
    const oldB = bEl.value;
    bEl.value = cEl.value;
    cEl.value = oldB;
    calc();
  });
  document.getElementById(`${id}-reset`).addEventListener('click', () => {
    document.getElementById(`${id}-a`).value = String(init.a);
    document.getElementById(`${id}-b`).value = String(init.b);
    document.getElementById(`${id}-c`).value = String(init.c);
    document.getElementById(`${id}-d`).value = String(init.d);
    calc();
  });

  calc();
}

registerViz('mcnemarguide', renderMcNemarGuideFixed);
