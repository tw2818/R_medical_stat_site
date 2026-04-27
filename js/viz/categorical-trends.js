import { registerViz } from './_core.js';

const boxStyle = 'border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;padding:12px;box-shadow:0 1px 2px rgba(15,23,42,.04);';
const muted = 'color:#64748b;font-size:13px;line-height:1.6;';
const badge = 'display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;margin-right:6px;';
const grid = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:stretch;';

function card(title, body) {
  return `
    <div class="viz-card">
      <div class="viz-header"><span>📊 ${title}</span></div>
      <div style="padding:14px;background:#f8fafc;">${body}</div>
    </div>`;
}

function parseCsv(text, asNumber = false) {
  const items = String(text || '')
    .split(',')
    .map(v => v.trim())
    .filter(v => v.length > 0);
  return asNumber ? items.map(v => Number(v)) : items;
}

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

function fmt(x, digits = 4) {
  return Number.isFinite(x) ? x.toFixed(digits) : '—';
}

function fmtP(p) {
  if (!Number.isFinite(p)) return '—';
  if (p < 0.001) return '< 0.001';
  return Math.min(1, Math.max(0, p)).toFixed(4);
}

function isNonNegativeInteger(v) {
  return Number.isInteger(v) && v >= 0;
}

function strictlyIncreasing(values) {
  for (let i = 1; i < values.length; i++) {
    if (!(values[i] > values[i - 1])) return false;
  }
  return true;
}

function allSame(values) {
  return values.every(v => v === values[0]);
}

function renderTrendChoiceGuide(el) {
  const title = el.dataset.title || '趋势检验怎么选';
  el.innerHTML = card(title, `
    <div style="${grid}">
      <div style="${boxStyle}">
        <span style="${badge}">普通 R×C χ²</span>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">多组率是否不全相同</div>
        <div style="${muted}">适用于无序或有序多组的总体差异检验；显著只说明分布不全相同，不直接说明线性趋势。</div>
      </div>
      <div style="${boxStyle}">
        <span style="${badge}">Cochran-Armitage</span>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">二分类结局是否随有序等级线性变化</div>
        <div style="${muted}">适用于 2×k 有序列联表，例如剂量等级、暴露等级、病情等级与阳性/阴性结局。</div>
      </div>
      <div style="${boxStyle}">
        <span style="${badge}">CMH 检验</span>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">控制一个分层混杂因素</div>
        <div style="${muted}">用于分层 2×2 表的关联检验，不等同于本章的线性趋势检验。</div>
      </div>
      <div style="${boxStyle}">
        <span style="${badge}">Logistic 回归</span>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">需要调整多个协变量</div>
        <div style="${muted}">可把等级变量按有序分值进入模型，得到趋势 P 值；适合多因素调整场景。</div>
      </div>
    </div>`);
}
registerViz('trendchoiceguide', renderTrendChoiceGuide);

function renderOrdinalTrendStructure(el) {
  const title = el.dataset.title || 'Cochran-Armitage 数据结构：2×k 有序列联表';
  el.innerHTML = card(title, `
    <div style="${boxStyle};${muted};margin-bottom:12px;">
      Cochran-Armitage 检验不是直接对百分比做线性回归，而是使用每个有序组的阳性数 x、总数 n 和预先设定的有序分值 score。
    </div>
    <div style="overflow-x:auto;">
      <table style="border-collapse:collapse;width:100%;min-width:560px;background:#fff;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;">资料结构</th>
            <th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;">低剂量</th>
            <th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;">中剂量</th>
            <th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;">高剂量</th>
          </tr>
        </thead>
        <tbody>
          <tr><th style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;text-align:left;">有效</th><td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">x₁</td><td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">x₂</td><td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">x₃</td></tr>
          <tr><th style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;text-align:left;">无效</th><td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">n₁ − x₁</td><td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">n₂ − x₂</td><td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">n₃ − x₃</td></tr>
          <tr><th style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;text-align:left;">score</th><td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">1</td><td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">2</td><td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">3</td></tr>
        </tbody>
      </table>
    </div>
    <div style="${boxStyle};${muted};margin-top:12px;">
      score 可以取等距分值 1,2,3，也可以取实际剂量 50,100,200。分值应由研究设计或临床意义预先决定，不能为了让 P 值显著而事后调整。
    </div>`);
}
registerViz('ordinaltrendstructure', renderOrdinalTrendStructure);

function renderCochranTrend(el) {
  const id = 'cochrantrend-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'Cochran-Armitage 趋势检验';
  const defaultLabels = el.dataset.labels || '50mg,100mg,200mg,300mg,500mg';
  const defaultSuccesses = el.dataset.successes || '87,119,133,177,167';
  const defaultTotals = el.dataset.totals || '1000,1000,1000,1000,1000';
  const defaultScores = el.dataset.scores || '50,100,200,300,500';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header"><span>📊 ${title}</span><button id="${id}-reset" class="viz-reset" type="button" title="重置">↺</button></div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">输入各组阳性数 / 总数和预先设定的有序分值，计算二分类结局的线性趋势。</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">组别标签（逗号分隔）<br><input id="${id}-labels" type="text" value="${defaultLabels}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">阳性数 x（非负整数）<br><input id="${id}-successes" type="text" value="${defaultSuccesses}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">总数 n（正整数）<br><input id="${id}-totals" type="text" value="${defaultTotals}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">有序分值 score<br><input id="${id}-scores" type="text" value="${defaultScores}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-calc" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">计算趋势检验</button>
        <button id="${id}-equal" type="button" style="padding:8px 16px;background:#95a5a6;color:#fff;border:none;border-radius:6px;cursor:pointer;">改为等距分值 1..k</button>
      </div>
      <canvas id="${id}-canvas" width="640" height="330" style="display:block;margin:0 auto;max-width:100%;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
      <div id="${id}-table" style="margin-top:10px;overflow:auto;"></div>
      <div style="margin-top:8px;font-size:12px;color:#666;text-align:center;">教学实现采用常用正态近似统计量；正式分析请结合教材/软件输出确认 score 设定和单侧/双侧假设。</div>
    </div>`;

  const labelsInput = document.getElementById(`${id}-labels`);
  const successesInput = document.getElementById(`${id}-successes`);
  const totalsInput = document.getElementById(`${id}-totals`);
  const scoresInput = document.getElementById(`${id}-scores`);
  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const result = document.getElementById(`${id}-result`);
  const table = document.getElementById(`${id}-table`);

  function resetOutputs(message) {
    result.innerHTML = `<div style="color:#c0392b;text-align:center;">${message}</div>`;
    table.innerHTML = '';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function draw(labels, rates, scores) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 60, r: 24, t: 35, b: 82 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const barSpace = plotW / labels.length;
    const barW = Math.min(72, barSpace * 0.5);

    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('各组率与线性趋势示意', W / 2, 18);

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
    ctx.lineWidth = 1.5;
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
      ctx.fillText((rate * 100).toFixed(1) + '%', cx, Math.max(pad.t + 12, y - 8));
    });

    if (points.length >= 2) {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.fillStyle = '#e74c3c';
      points.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); });
    }
  }

  function compute() {
    const labels = parseCsv(labelsInput.value, false);
    const x = parseCsv(successesInput.value, true);
    const n = parseCsv(totalsInput.value, true);
    const scores = parseCsv(scoresInput.value, true);

    if (!(labels.length && labels.length === x.length && x.length === n.length && n.length === scores.length)) {
      resetOutputs('标签、阳性数、总数和分值的长度必须一致。');
      return;
    }
    if (labels.length < 3) {
      resetOutputs('趋势检验更适合至少 3 个有序组；只有 2 组时通常回到两组率比较。');
      return;
    }
    if (x.some(v => !isNonNegativeInteger(v)) || n.some(v => !Number.isInteger(v) || v <= 0) || x.some((v, i) => v > n[i])) {
      resetOutputs('阳性数和总数必须为整数，且每组满足 0 ≤ x ≤ n、n > 0。');
      return;
    }
    if (scores.some(v => !Number.isFinite(v)) || allSame(scores)) {
      resetOutputs('score 必须为有限数值，且不能全部相同。');
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
    const z = denominator > 0 ? numerator / denominator : NaN;
    const chisq = z * z;
    const twoSidedP = Number.isFinite(z) ? Math.min(1, 2 * (1 - normalCDF(Math.abs(z)))) : NaN;
    const oneSidedUp = Number.isFinite(z) ? 1 - normalCDF(z) : NaN;
    const oneSidedDown = Number.isFinite(z) ? normalCDF(z) : NaN;
    const direction = z > 0 ? '阳性率随 score 总体上升' : (z < 0 ? '阳性率随 score 总体下降' : '未见明确线性趋势');
    const scoreWarning = strictlyIncreasing(scores) ? '' : '<div style="color:#b45309;"><strong>提示</strong>：score 未严格递增。若输入顺序代表从低到高的有序等级，建议检查 score 设定。</div>';

    result.innerHTML = `
      <div><strong>总体阳性率</strong> = ${fmt(p, 4)} (${(p * 100).toFixed(1)}%)</div>
      <div><strong>趋势方向</strong>：${direction}</div>
      <div><strong>Cochran-Armitage Z</strong> = ${fmt(z, 4)}；<strong>趋势 χ²</strong> = ${fmt(chisq, 4)}</div>
      <div><strong>双侧 P 值</strong> ≈ ${fmtP(twoSidedP)}；<strong>单侧上升 P</strong> ≈ ${fmtP(oneSidedUp)}；<strong>单侧下降 P</strong> ≈ ${fmtP(oneSidedDown)}</div>
      ${scoreWarning}`;

    table.innerHTML = `
      <table class="anova-table">
        <tr><th>组别</th><th>阳性数 x</th><th>总数 n</th><th>率</th><th>score</th></tr>
        ${labels.map((label, i) => `<tr><td>${label}</td><td>${x[i]}</td><td>${n[i]}</td><td>${(rates[i] * 100).toFixed(1)}%</td><td>${scores[i]}</td></tr>`).join('')}
      </table>`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  document.getElementById(`${id}-equal`).addEventListener('click', () => {
    const labels = parseCsv(labelsInput.value, false);
    scoresInput.value = labels.map((_, i) => i + 1).join(',');
    compute();
  });
  document.getElementById(`${id}-reset`).addEventListener('click', () => {
    labelsInput.value = defaultLabels;
    successesInput.value = defaultSuccesses;
    totalsInput.value = defaultTotals;
    scoresInput.value = defaultScores;
    compute();
  });

  compute();
}

registerViz('cochrantrend', renderCochranTrend);
