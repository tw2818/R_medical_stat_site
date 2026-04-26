import { registerViz } from './_core.js';

function parseNumberList(raw) {
  return (raw || '')
    .split(',')
    .map(v => parseFloat(v.trim()))
    .filter(v => Number.isFinite(v));
}

function parsePairs(el) {
  let pairs = [];

  try {
    const rawPoints = JSON.parse(el.dataset.points || '[]');
    if (Array.isArray(rawPoints)) {
      pairs = rawPoints
        .map(p => {
          if (Array.isArray(p) && p.length >= 2) return { before: Number(p[0]), after: Number(p[1]) };
          if (p && typeof p === 'object') return { before: Number(p.x), after: Number(p.y) };
          return null;
        })
        .filter(p => p && Number.isFinite(p.before) && Number.isFinite(p.after));
    }
  } catch (e) {
    pairs = [];
  }

  if (!pairs.length) {
    const before = parseNumberList(el.dataset.before || el.dataset.xs);
    const after = parseNumberList(el.dataset.after || el.dataset.ys);
    const n = Math.min(before.length, after.length);
    pairs = Array.from({ length: n }, (_, i) => ({ before: before[i], after: after[i] }));
  }

  return pairs;
}

function mean(values) {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function sampleSD(values, valueMean = mean(values)) {
  if (values.length < 2) return NaN;
  const ss = values.reduce((s, v) => s + (v - valueMean) ** 2, 0);
  return Math.sqrt(ss / (values.length - 1));
}

function formatP(p) {
  if (!Number.isFinite(p)) return '—';
  if (p < 0.001) return '< 0.001';
  return p.toFixed(4);
}

function getPairedTStats(pairs) {
  const n = pairs.length;
  const diffs = pairs.map(p => p.after - p.before);
  const beforeMean = mean(pairs.map(p => p.before));
  const afterMean = mean(pairs.map(p => p.after));
  const meanDiff = mean(diffs);
  const sdDiff = sampleSD(diffs, meanDiff);
  const seDiff = sdDiff / Math.sqrt(n);
  const df = n - 1;
  const t = seDiff > 0 ? meanDiff / seDiff : NaN;

  let pValue = NaN;
  let tCrit = 1.96;
  if (typeof window.jStat !== 'undefined' && df > 0) {
    pValue = Math.min(1, 2 * window.jStat.studentt.cdf(-Math.abs(t), df));
    if (typeof window.jStat.studentt.inv === 'function') {
      tCrit = window.jStat.studentt.inv(0.975, df);
    }
  }

  return {
    n,
    df,
    diffs,
    beforeMean,
    afterMean,
    meanDiff,
    sdDiff,
    seDiff,
    t,
    pValue,
    ciLow: meanDiff - tCrit * seDiff,
    ciHigh: meanDiff + tCrit * seDiff
  };
}

function drawRoundedLabel(ctx, text, x, y, color) {
  ctx.save();
  ctx.font = '12px sans-serif';
  const w = ctx.measureText(text).width + 16;
  const h = 22;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

function renderPairedTTestTutorial(el) {
  const pairs = parsePairs(el);
  const title = el.dataset.title || '配对 t 检验可视化：看每一对的差值';
  if (pairs.length < 2) {
    el.innerHTML = '<div class="viz-card"><div class="viz-header"><span>📊 ' + title + '</span></div><p style="padding:20px;color:#666;">请提供至少 2 对配对数据。</p></div>';
    return;
  }

  const stats = getPairedTStats(pairs);
  const W = 640;
  const H = 575;
  const id = 'paired-ttest-' + Math.random().toString(36).slice(2, 8);
  const direction = stats.meanDiff < 0 ? '平均下降' : (stats.meanDiff > 0 ? '平均升高' : '平均无变化');
  const significant = Number.isFinite(stats.pValue) && stats.pValue < 0.05;
  const conclusion = significant
    ? (stats.meanDiff < 0 ? '用药后显著低于用药前。' : '用药后显著高于用药前。')
    : '尚未见显著证据说明用药前后均值不同。';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header"><span>📊 ${title}</span></div>
      <canvas id="${id}" class="viz-canvas" width="${W}" height="${H}"></canvas>
      <div style="padding:10px 14px;background:#f8fafc;border-top:1px solid rgba(148,163,184,.25);font-size:13px;line-height:1.7;color:#334155;">
        <strong>配对 t 检验：</strong>
        先计算每一对差值 <code>D = 用药后 − 用药前</code>，再检验 <code>D</code> 的均值是否等于 0。
        <br>
        <strong>结果：</strong>n = ${stats.n} 对，
        D̄ = ${stats.meanDiff.toFixed(4)}，
        t(${stats.df}) = ${Number.isFinite(stats.t) ? stats.t.toFixed(3) : '—'}，
        P = ${formatP(stats.pValue)}，
        95% CI = [${Number.isFinite(stats.ciLow) ? stats.ciLow.toFixed(4) : '—'}, ${Number.isFinite(stats.ciHigh) ? stats.ciHigh.toFixed(4) : '—'}]。
        <br>
        <strong>读图：</strong>${direction}；${conclusion}本图刻意不画 Pearson r 或回归线，避免把配对 t 检验误解为相关分析。
      </div>
    </div>`;

  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');

  const beforeValues = pairs.map(p => p.before);
  const afterValues = pairs.map(p => p.after);
  const allValues = beforeValues.concat(afterValues);
  const rawYMin = Math.min(...allValues);
  const rawYMax = Math.max(...allValues);
  const yRange = rawYMax - rawYMin || 1;
  const yMin = rawYMin - yRange * 0.16;
  const yMax = rawYMax + yRange * 0.16;

  const valueScale = (v, panel) => panel.y + panel.h - ((v - yMin) / (yMax - yMin)) * panel.h;

  const topPanel = { x: 78, y: 48, w: 510, h: 185 };
  const bottomPanel = { x: 78, y: 355, w: 510, h: 105 };

  function drawAxes(panel, yLabel) {
    ctx.strokeStyle = 'rgba(100,116,139,.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = panel.y + panel.h * i / 4;
      ctx.beginPath();
      ctx.moveTo(panel.x, y);
      ctx.lineTo(panel.x + panel.w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(panel.x, panel.y);
    ctx.lineTo(panel.x, panel.y + panel.h);
    ctx.lineTo(panel.x + panel.w, panel.y + panel.h);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const v = yMax - (yMax - yMin) * i / 4;
      const y = panel.y + panel.h * i / 4;
      ctx.fillText(v.toFixed(2), panel.x - 8, y);
    }

    ctx.save();
    ctx.translate(18, panel.y + panel.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }

  function drawTopPanel() {
    drawAxes(topPanel, '测量值');
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1. 配对连线图：每条线是一名受试者', topPanel.x + topPanel.w / 2, 24);

    const xBefore = topPanel.x + topPanel.w * 0.28;
    const xAfter = topPanel.x + topPanel.w * 0.72;

    pairs.forEach(p => {
      const yBefore = valueScale(p.before, topPanel);
      const yAfter = valueScale(p.after, topPanel);
      const color = p.after < p.before ? '#2f855a' : (p.after > p.before ? '#c05621' : '#64748b');
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(xBefore, yBefore);
      ctx.lineTo(xAfter, yAfter);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(xBefore, yBefore, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(xAfter, yAfter, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    const meanBeforeY = valueScale(stats.beforeMean, topPanel);
    const meanAfterY = valueScale(stats.afterMean, topPanel);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xBefore, meanBeforeY);
    ctx.lineTo(xAfter, meanAfterY);
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    [
      [xBefore, meanBeforeY],
      [xAfter, meanAfterY]
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('用药前', xBefore, topPanel.y + topPanel.h + 24);
    ctx.fillText('用药后', xAfter, topPanel.y + topPanel.h + 24);

    drawRoundedLabel(ctx, '绿色线：用药后下降', topPanel.x + 118, topPanel.y + topPanel.h + 56, '#2f855a');
    drawRoundedLabel(ctx, '黑粗线：组均值变化', topPanel.x + topPanel.w - 132, topPanel.y + topPanel.h + 56, '#0f172a');
  }

  function drawBottomPanel() {
    const diffs = stats.diffs;
    const rawMin = Math.min(0, stats.ciLow, stats.meanDiff, ...diffs);
    const rawMax = Math.max(0, stats.ciHigh, stats.meanDiff, ...diffs);
    const range = rawMax - rawMin || 1;
    const xMin = rawMin - range * 0.12;
    const xMax = rawMax + range * 0.12;
    const sx = v => bottomPanel.x + ((v - xMin) / (xMax - xMin)) * bottomPanel.w;
    const centerY = bottomPanel.y + bottomPanel.h / 2;

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2. 差值图：配对 t 检验检验 D̄ 是否等于 0', bottomPanel.x + bottomPanel.w / 2, bottomPanel.y - 32);

    ctx.strokeStyle = 'rgba(100,116,139,.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const x = bottomPanel.x + bottomPanel.w * i / 4;
      ctx.beginPath();
      ctx.moveTo(x, bottomPanel.y);
      ctx.lineTo(x, bottomPanel.y + bottomPanel.h);
      ctx.stroke();
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bottomPanel.x, centerY);
    ctx.lineTo(bottomPanel.x + bottomPanel.w, centerY);
    ctx.stroke();

    const zeroX = sx(0);
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(zeroX, bottomPanel.y - 8);
    ctx.lineTo(zeroX, bottomPanel.y + bottomPanel.h + 10);
    ctx.stroke();
    ctx.restore();
    drawRoundedLabel(ctx, 'D = 0 无变化', zeroX, bottomPanel.y - 10, '#ef4444');

    diffs.forEach((d, i) => {
      const jitter = ((i % 5) - 2) * 7;
      ctx.fillStyle = d < 0 ? '#2f855a' : (d > 0 ? '#c05621' : '#64748b');
      ctx.beginPath();
      ctx.arc(sx(d), centerY + jitter, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    const ciY = bottomPanel.y + bottomPanel.h + 34;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx(stats.ciLow), ciY);
    ctx.lineTo(sx(stats.ciHigh), ciY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(stats.ciLow), ciY - 7);
    ctx.lineTo(sx(stats.ciLow), ciY + 7);
    ctx.moveTo(sx(stats.ciHigh), ciY - 7);
    ctx.lineTo(sx(stats.ciHigh), ciY + 7);
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(sx(stats.meanDiff), ciY, 6, 0, Math.PI * 2);
    ctx.fill();
    drawRoundedLabel(ctx, 'D̄ 与 95% CI', sx(stats.meanDiff), ciY + 28, '#0f172a');

    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 4; i++) {
      const v = xMin + (xMax - xMin) * i / 4;
      const x = sx(v);
      ctx.beginPath();
      ctx.moveTo(x, centerY + 5);
      ctx.lineTo(x, centerY + 10);
      ctx.stroke();
      ctx.fillText(v.toFixed(2), x, centerY + 14);
    }
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('差值 D = 用药后 − 用药前（D < 0 表示下降）', bottomPanel.x + bottomPanel.w / 2, H - 16);
  }

  ctx.clearRect(0, 0, W, H);
  drawTopPanel();
  drawBottomPanel();
}

registerViz('pairedttestviz', renderPairedTTestTutorial);
