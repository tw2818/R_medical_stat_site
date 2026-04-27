import { registerViz } from './_core.js';

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

function chiSquareP(stat) {
  if (!Number.isFinite(stat) || stat < 0) return NaN;
  if (window.jStat?.chisquare?.cdf) return Math.max(0, Math.min(1, 1 - window.jStat.chisquare.cdf(stat, 1)));
  return Math.max(0, Math.min(1, 2 * (1 - normalCDF(Math.sqrt(stat)))));
}

function logChoose(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n) return -Infinity;
  const kk = Math.min(k, n - k);
  let s = 0;
  for (let i = 1; i <= kk; i++) s += Math.log(n - kk + i) - Math.log(i);
  return s;
}

function binomPmf(k, n, p = 0.5) {
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
  for (let k = 0; k <= x; k++) tail += binomPmf(k, n, 0.5);
  return Math.min(1, 2 * tail);
}

function isCount(v) {
  return Number.isInteger(v) && v >= 0;
}

function formatP(p) {
  if (!Number.isFinite(p)) return '—';
  return p < 0.001 ? '&lt; 0.001' : p.toFixed(4);
}

function renderMcNemar(el) {
  const id = 'mcnemar-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'McNemar 检验';
  const defaults = {
    a: Number(el.dataset.a || 35),
    b: Number(el.dataset.b || 12),
    c: Number(el.dataset.c || 4),
    d: Number(el.dataset.d || 49)
  };

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">配对四格表的关键不是四格都同等参与，而是重点看两格“不一致配对” b 与 c。</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">a：A+ / B+<br><input id="${id}-a" type="number" min="0" step="1" value="${defaults.a}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">b：A+ / B−<br><input id="${id}-b" type="number" min="0" step="1" value="${defaults.b}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">c：A− / B+<br><input id="${id}-c" type="number" min="0" step="1" value="${defaults.c}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">d：A− / B−<br><input id="${id}-d" type="number" min="0" step="1" value="${defaults.d}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-calc" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">计算 McNemar</button>
        <button id="${id}-swap" type="button" style="padding:8px 16px;background:#95a5a6;color:#fff;border:none;border-radius:6px;cursor:pointer;">交换 b / c</button>
      </div>
      <canvas id="${id}-canvas" width="560" height="300" style="display:block;margin:0 auto;max-width:100%;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
      <div style="margin-top:8px;font-size:12px;color:#666;text-align:center;">同时报告未校正、连续性校正和精确二项法 P 值，方便和不同教材/软件口径对照。</div>
    </div>`;

  const aInput = document.getElementById(`${id}-a`);
  const bInput = document.getElementById(`${id}-b`);
  const cInput = document.getElementById(`${id}-c`);
  const dInput = document.getElementById(`${id}-d`);
  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const result = document.getElementById(`${id}-result`);

  function draw(a, b, c, d) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cellW = 130, cellH = 84;
    const x0 = 150, y0 = 70;

    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('配对四格表：重点高亮不一致配对', W / 2, 24);

    const cells = [
      { x: x0, y: y0, val: a, fill: '#dfe6e9', label: 'a' },
      { x: x0 + cellW, y: y0, val: b, fill: '#f9c0c0', label: 'b' },
      { x: x0, y: y0 + cellH, val: c, fill: '#f9c0c0', label: 'c' },
      { x: x0 + cellW, y: y0 + cellH, val: d, fill: '#dfe6e9', label: 'd' }
    ];

    cells.forEach(cell => {
      ctx.fillStyle = cell.fill;
      ctx.fillRect(cell.x, cell.y, cellW - 4, cellH - 4);
      ctx.strokeStyle = '#555';
      ctx.strokeRect(cell.x, cell.y, cellW - 4, cellH - 4);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(String(cell.val), cell.x + (cellW - 4) / 2, cell.y + 42);
      ctx.font = '12px sans-serif';
      ctx.fillText(cell.label, cell.x + (cellW - 4) / 2, cell.y + 62);
    });

    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.fillText('B：阳性', x0 + cellW / 2, y0 - 12);
    ctx.fillText('B：阴性', x0 + cellW + cellW / 2, y0 - 12);
    ctx.save();
    ctx.translate(x0 - 45, y0 + cellH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('A：阳性', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(x0 - 45, y0 + cellH + cellH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('A：阴性', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#c0392b';
    ctx.font = '12px sans-serif';
    ctx.fillText('McNemar 主要看 b 与 c', W / 2, y0 + cellH * 2 + 28);
  }

  function compute() {
    const a = Number(aInput.value);
    const b = Number(bInput.value);
    const c = Number(cInput.value);
    const d = Number(dInput.value);

    if ([a, b, c, d].some(v => !isCount(v))) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">四格频数必须是非负整数。</div>';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const total = a + b + c + d;
    if (total === 0) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">总配对数不能为 0。</div>';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    draw(a, b, c, d);

    const discordant = b + c;
    const rateA = (a + b) / total;
    const rateB = (a + c) / total;
    if (discordant === 0) {
      result.innerHTML = `
        <div><strong>不一致配对数</strong> b + c = 0；<strong>一致配对</strong> a + d = ${a + d}</div>
        <div>A 阳性率 = ${(100 * rateA).toFixed(1)}%；B 阳性率 = ${(100 * rateB).toFixed(1)}%。所有配对都落在一致格中，因此没有可供 McNemar 检验的差异信息。</div>
        <div><strong>P 值</strong> = 1.0000</div>`;
      return;
    }

    const chiUncorrected = Math.pow(b - c, 2) / discordant;
    const chiCorrected = Math.pow(Math.max(0, Math.abs(b - c) - 1), 2) / discordant;
    const pUncorrected = chiSquareP(chiUncorrected);
    const pCorrected = chiSquareP(chiCorrected);
    const pExact = exactMcNemarP(b, c);
    const direction = b > c ? 'B 的阳性率低于 A；更多对子从 A+ 变为 B−。' : (c > b ? 'B 的阳性率高于 A；更多对子从 A− 变为 B+。' : 'b 与 c 相等，未见方向偏向。');
    const methodNote = discordant < 25 ? '不一致对子较少时，更建议报告精确二项法 P 值。' : '不一致对子数较多时，χ² 近似通常更稳定。';

    result.innerHTML = `
      <div><strong>一致配对</strong> a + d = ${a + d}；<strong>不一致配对</strong> b + c = ${discordant}</div>
      <div><strong>A 阳性率</strong> = ${(100 * rateA).toFixed(1)}%；<strong>B 阳性率</strong> = ${(100 * rateB).toFixed(1)}%。${direction}</div>
      <div><strong>McNemar χ²（未校正）</strong> = ${chiUncorrected.toFixed(4)}，P ≈ ${formatP(pUncorrected)}</div>
      <div><strong>McNemar χ²（连续性校正）</strong> = ${chiCorrected.toFixed(4)}，P ≈ ${formatP(pCorrected)}</div>
      <div><strong>精确二项法 P 值</strong> ≈ ${formatP(pExact)}。${methodNote}</div>`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  document.getElementById(`${id}-swap`).addEventListener('click', () => {
    const b = bInput.value;
    bInput.value = cInput.value;
    cInput.value = b;
    compute();
  });
  [aInput, bInput, cInput, dInput].forEach(input => input.addEventListener('input', compute));

  compute();
}


