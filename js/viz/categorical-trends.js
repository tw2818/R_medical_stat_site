import { registerViz, ensureJStat } from './_core.js';

function parseCsv(text, asNumber = false) {
  const items = String(text || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  return asNumber ? items.map(v => Number(v)) : items;
}

function renderCochranTrend(el) {
  if (!ensureJStat(el)) return;

  const id = 'cochrantrend-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'Cochran-Armitage 趋势检验';
  const defaultLabels = el.dataset.labels || '50mg,100mg,200mg,300mg,500mg';
  const defaultSuccesses = el.dataset.successes || '87,119,133,177,167';
  const defaultTotals = el.dataset.totals || '1000,1000,1000,1000,1000';
  const defaultScores = el.dataset.scores || '50,100,200,300,500';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">按“各组阳性数 / 总数 + 有序分值”演示趋势检验；既看各组率，也看正式的趋势统计量。</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">组别标签（逗号分隔）<br><input id="${id}-labels" type="text" value="${defaultLabels}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">阳性数 x（逗号分隔）<br><input id="${id}-successes" type="text" value="${defaultSuccesses}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">总数 n（逗号分隔）<br><input id="${id}-totals" type="text" value="${defaultTotals}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">有序分值 score（逗号分隔）<br><input id="${id}-scores" type="text" value="${defaultScores}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-calc" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">计算趋势检验</button>
        <button id="${id}-equal" type="button" style="padding:8px 16px;background:#95a5a6;color:#fff;border:none;border-radius:6px;cursor:pointer;">改为等距分值 1..k</button>
      </div>
      <canvas id="${id}-canvas" width="620" height="320" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
      <div id="${id}-table" style="margin-top:10px;overflow:auto;"></div>
      <div style="margin-top:8px;font-size:12px;color:#666;text-align:center;">结果为教学实现：采用 Cochran-Armitage 线性趋势检验的常用近似统计量，并报告双侧 P 值。</div>
    </div>`;

  const labelsInput = document.getElementById(`${id}-labels`);
  const successesInput = document.getElementById(`${id}-successes`);
  const totalsInput = document.getElementById(`${id}-totals`);
  const scoresInput = document.getElementById(`${id}-scores`);
  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const result = document.getElementById(`${id}-result`);
  const table = document.getElementById(`${id}-table`);

  function draw(labels, rates, scores) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 60, r: 20, t: 35, b: 72 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const barSpace = plotW / labels.length;
    const barW = Math.min(72, barSpace * 0.5);

    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('各组率与趋势示意', W / 2, 18);

    ctx.strokeStyle = '#e6e6e6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (plotH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
      const pct = 1 - i / 5;
      ctx.fillStyle = '#666';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText((pct * 100).toFixed(0) + '%', pad.l - 6, y + 4);
    }

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + plotH);
    ctx.lineTo(pad.l + plotW, pad.t + plotH);
    ctx.stroke();

    const points = [];
    rates.forEach((rate, i) => {
      const x = pad.l + i * barSpace + (barSpace - barW) / 2;
      const h = Math.max(0, Math.min(1, rate)) * plotH;
      const y = pad.t + plotH - h;

      ctx.fillStyle = '#dfe6e9';
      ctx.fillRect(x, pad.t, barW, plotH);
      ctx.fillStyle = '#3498db';
      ctx.fillRect(x, y, barW, h);

      const cx = x + barW / 2;
      points.push({ x: cx, y });

      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], cx, pad.t + plotH + 18);
      ctx.fillText(`score=${scores[i]}`, cx, pad.t + plotH + 34);
      ctx.fillText((rate * 100).toFixed(1) + '%', cx, y - 8);
    });

    if (points.length >= 2) {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      ctx.fillStyle = '#e74c3c';
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  function compute() {
    const labels = parseCsv(labelsInput.value, false);
    const x = parseCsv(successesInput.value, true);
    const n = parseCsv(totalsInput.value, true);
    const scores = parseCsv(scoresInput.value, true);

    if (!(labels.length && labels.length === x.length && x.length === n.length && n.length === scores.length)) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">标签、阳性数、总数和分值的长度必须一致。</div>';
      table.innerHTML = '';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    if (labels.length < 3) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">趋势检验更适合至少 3 个有序组。</div>';
      table.innerHTML = '';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    if (x.some(v => !Number.isFinite(v) || v < 0) || n.some(v => !Number.isFinite(v) || v <= 0) || scores.some(v => !Number.isFinite(v)) || x.some((v, i) => v > n[i])) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">请确保阳性数、总数和分值都合法，且每组阳性数不超过总数。</div>';
      table.innerHTML = '';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const rates = x.map((v, i) => v / n[i]);
    draw(labels, rates, scores);

    const N = n.reduce((a, b) => a + b, 0);
    const X = x.reduce((a, b) => a + b, 0);
    const p = X / N;
    const weightedScoreMean = scores.reduce((s, v, i) => s + v * n[i], 0) / N;
    const numerator = scores.reduce((s, v, i) => s + v * (x[i] - n[i] * p), 0);
    const varianceCore = scores.reduce((s, v, i) => s + n[i] * (v - weightedScoreMean) ** 2, 0);
    const denominator = Math.sqrt(p * (1 - p) * varianceCore);
    const z = denominator > 0 ? numerator / denominator : 0;
    const chisq = z * z;
    const pval = Math.min(1, 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1)));
    const direction = z > 0 ? '阳性率随分值总体上升' : (z < 0 ? '阳性率随分值总体下降' : '未见明确线性趋势');

    result.innerHTML = `
      <div><strong>总体阳性率</strong> = ${p.toFixed(4)} (${(p * 100).toFixed(1)}%)</div>
      <div><strong>趋势方向</strong>：${direction}</div>
      <div><strong>Cochran-Armitage Z</strong> = ${z.toFixed(4)}；<strong>趋势 χ²</strong> = ${chisq.toFixed(4)}</div>
      <div><strong>双侧 P 值</strong> ≈ ${pval < 0.001 ? '&lt; 0.001' : pval.toFixed(4)}</div>`;

    table.innerHTML = `
      <table class="anova-table">
        <tr><th>组别</th><th>阳性数</th><th>总数</th><th>率</th><th>score</th></tr>
        ${labels.map((label, i) => `<tr><td>${label}</td><td>${x[i]}</td><td>${n[i]}</td><td>${(rates[i] * 100).toFixed(1)}%</td><td>${scores[i]}</td></tr>`).join('')}
      </table>`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  document.getElementById(`${id}-equal`).addEventListener('click', () => {
    const labels = parseCsv(labelsInput.value, false);
    scoresInput.value = labels.map((_, i) => i + 1).join(',');
    compute();
  });

  compute();
}

registerViz('cochrantrend', renderCochranTrend);

function injectCochranTrendWidget() {
  const root = document.getElementById('chapter-content');
  if (!root) return;
  const title = root.querySelector('h1 .chapter-title');
  if (!title || !title.textContent.includes('Cochran-Armitage检验')) return;
  if (root.querySelector('.stat-calc[data-type="cochrantrend"]')) return;

  const anchor = Array.from(root.querySelectorAll('.stat-viz[data-type="scatter"]')).find(node =>
    (node.dataset.title || '').includes('Cochran-Armitage')
  );
  if (!anchor) return;

  const note = document.createElement('p');
  note.textContent = '上图先用剂量与有效率给出趋势直觉。下方组件再按“各组阳性数/总数 + 有序分值”的形式演示 Cochran-Armitage 趋势检验，更贴近本章真正的 2×k 有序列联表语境。';
  note.style.color = '#555';
  note.style.fontSize = '0.95em';

  const widget = document.createElement('div');
  widget.className = 'stat-calc';
  widget.dataset.type = 'cochrantrend';
  widget.dataset.title = 'Cochran-Armitage 趋势检验';
  widget.dataset.labels = '50mg,100mg,200mg,300mg,500mg';
  widget.dataset.successes = '87,119,133,177,167';
  widget.dataset.totals = '1000,1000,1000,1000,1000';
  widget.dataset.scores = '50,100,200,300,500';

  anchor.insertAdjacentElement('afterend', note);
  note.insertAdjacentElement('afterend', widget);
}

function setupCochranTrendInjection() {
  injectCochranTrendWidget();
  const root = document.getElementById('chapter-content');
  if (!root) return;
  const observer = new MutationObserver(() => injectCochranTrendWidget());
  observer.observe(root, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCochranTrendInjection, { once: true });
} else {
  setupCochranTrendInjection();
}
