import { registerViz } from './_core.js';

// ================================================================
// RANK-CORRELATION — Spearman 秩相关组件
// 展示：原始散点图 + 秩转换散点图 + Spearman r_s + p值 + 95%CI
// ================================================================

function rank(arr) {
  const sorted = arr.map((v, i) => ({ v, i }))
    .slice()
    .sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length && sorted[j].v === sorted[i].v) j++;
    const avgRank = (i + j - 1) / 2 + 1; // 1-based average rank
    for (let k = i; k < j; k++) ranks[sorted[k].i] = avgRank;
    i = j;
  }
  return ranks;
}

function spearmanR(xs, ys) {
  const n = xs.length;
  if (n < 3) return { r: 0, t: 0, df: n - 2, p: 1 };
  const rx = rank(xs), ry = rank(ys);
  let d2 = 0;
  for (let i = 0; i < n; i++) d2 += (rx[i] - ry[i]) ** 2;
  // tie correction (simplified): use basic formula
  const r = 1 - 6 * d2 / (n * (n * n - 1));
  const df = n - 2;
  const tStat = df > 0 ? r * Math.sqrt(df / (1 - r * r)) : 0;
  let pValue = '—';
  if (typeof window.jStat !== 'undefined' && df > 0) {
    const twoTail = window.jStat.studentt.cdf(-Math.abs(tStat), df);
    pValue = Math.min(1, twoTail * 2).toFixed(4);
  }
  // Fisher z for CI
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const seZ = 1 / Math.sqrt(n - 3);
  const zLower = z - 1.96 * seZ, zUpper = z + 1.96 * seZ;
  const rLower = (Math.exp(2 * zLower) - 1) / (Math.exp(2 * zLower) + 1);
  const rUpper = (Math.exp(2 * zUpper) - 1) / (Math.exp(2 * zUpper) + 1);
  return { r, t: tStat, df, p: pValue, rLower, rUpper, rx, ry };
}

function renderRankCorrelation(el) {
  const title = el.dataset.title || '秩相关（Spearman）';
  const xlabel = el.dataset.xlabel || 'X';
  const ylabel = el.dataset.ylabel || 'Y';

  const xsRaw = (el.dataset.xs || '').split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const ysRaw = (el.dataset.ys || '').split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const n = Math.min(xsRaw.length, ysRaw.length);
  const points = xsRaw.slice(0, n).map((x, i) => ({ x, y: ysRaw[i] }));
  const rx = rank(xsRaw.slice(0, n));
  const ry = rank(ysRaw.slice(0, n));
  const rankedPoints = rx.map((rxVal, i) => ({ x: rxVal, y: ry[i] }));

  const stats = spearmanR(xsRaw.slice(0, n), ysRaw.slice(0, n));

  const W = 560, H = 280;
  const pad = { left: 55, right: 15, top: 50, bottom: 45 };

  const card = document.createElement('div');
  card.className = 'viz-card';
  el.appendChild(card);

  function buildCanvas(dataPts, xlabel2, ylabel2) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const allX = dataPts.map(p => p.x);
    const allY = dataPts.map(p => p.y);
    const xMin = Math.min(...allX), xMax = Math.max(...allX);
    const yMin = Math.min(...allY), yMax = Math.max(...allY);
    const xPad = (xMax - xMin) * 0.12 || 1;
    const yPad = (yMax - yMin) * 0.12 || 1;
    const plotW = W - pad.left - pad.right, plotH = H - pad.top - pad.bottom;
    const sx = x => pad.left + (x - (xMin - xPad)) / ((xMax - xMin) + 2 * xPad) * plotW;
    const sy = y => pad.top + plotH - (y - (yMin - yPad)) / ((yMax - yMin) + 2 * yPad) * plotH;

    // grid
    ctx.strokeStyle = 'rgba(128,128,128,0.12)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const xp = pad.left + (plotW / 4) * i; ctx.beginPath(); ctx.moveTo(xp, pad.top); ctx.lineTo(xp, pad.top + plotH); ctx.stroke();
      const yp = pad.top + (plotH / 4) * i; ctx.beginPath(); ctx.moveTo(pad.left, yp); ctx.lineTo(pad.left + plotW, yp); ctx.stroke();
    }
    // axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();
    // tick labels
    ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const val = xMin - xPad + ((xMax - xMin) + 2 * xPad) * (i / 4);
      const xp = sx(val); ctx.beginPath(); ctx.moveTo(xp, pad.top + plotH); ctx.lineTo(xp, pad.top + plotH + 4); ctx.stroke();
      ctx.fillText(val % 1 === 0 ? val.toFixed(0) : val.toFixed(1), xp, pad.top + plotH + 16);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = yMin - yPad + ((yMax - yMin) + 2 * yPad) * (i / 4);
      const yp = sy(val); ctx.beginPath(); ctx.moveTo(pad.left - 4, yp); ctx.lineTo(pad.left, yp); ctx.stroke();
      ctx.fillText(val % 1 === 0 ? val.toFixed(0) : val.toFixed(1), pad.left - 8, yp + 4);
    }
    // axis labels
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(xlabel2, pad.left + plotW / 2, H - 6);
    ctx.save(); ctx.translate(12, pad.top + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(ylabel2, 0, 0); ctx.restore();
    // scatter
    ctx.fillStyle = '#569cd6';
    dataPts.forEach(p => { ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 4, 0, Math.PI * 2); ctx.fill(); });
    // regression line
    if (dataPts.length >= 3) {
      const xs = dataPts.map(p => p.x), ys = dataPts.map(p => p.y);
      const sumX = xs.reduce((a, b) => a + b, 0), sumY = ys.reduce((a, b) => a + b, 0);
      const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0), sumX2 = xs.reduce((s, x) => s + x * x, 0);
      const denom = dataPts.length * sumX2 - sumX * sumX;
      if (Math.abs(denom) > 1e-12) {
        const slope = (dataPts.length * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / dataPts.length;
        ctx.strokeStyle = '#f9826c'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx(xMin - xPad), sy(slope * (xMin - xPad) + intercept));
        ctx.lineTo(sx(xMax + xPad), sy(slope * (xMax + xPad) + intercept));
        ctx.stroke();
      }
    }
    return c;
  }

  const tabs = ['原始数据', '秩转换后'];
  let activeTab = 0;

  card.innerHTML = `
    <div class="viz-header"><span>📊 ${title}</span>
      <div class="rc-tabs" style="float:right">
        ${tabs.map((t, i) => `<button class="rc-tab ${i === 0 ? 'active' : ''}" data-tab="${i}">${t}</button>`).join('')}
      </div>
    </div>
    <div class="rc-canvas-container" style="text-align:center;"></div>
    <div class="rc-stats" style="margin-top:10px;padding:10px 14px;background:#f0f4ff;border-radius:6px;font-size:13px;line-height:1.8;">
      <strong>Spearman 秩相关分析</strong><br>
      r<sub>s</sub> = <strong>${stats.r.toFixed(4)}</strong>
      &nbsp; t<sub>${stats.df}</sub> = ${stats.t.toFixed(3)}
      &nbsp; P = ${stats.p}
      &nbsp; 95%CI: [${stats.rLower.toFixed(4)}, ${stats.rUpper.toFixed(4)}]
      &nbsp; n = ${n}
      <div style="margin-top:6px;font-size:12px;color:#555;">
        ${Math.abs(stats.r) >= 0.7 ? '📌 强相关' : stats.r >= 0.4 ? '📌 中等相关' : '📌 弱相关'}
        &nbsp;|&nbsp;秩转换：将原始数据替换为秩次（1,2,3…），消除异常值影响，适合偏态数据
      </div>
    </div>
  `;

  const container = card.querySelector('.rc-canvas-container');
  container.appendChild(buildCanvas(points, xlabel, ylabel));

  card.querySelectorAll('.rc-tab').forEach(btn => {
    btn.style.cssText = 'background:none;border:1px solid #ccc;padding:3px 10px;margin-left:4px;border-radius:4px;cursor:pointer;font-size:12px;';
    btn.addEventListener('click', () => {
      activeTab = parseInt(btn.dataset.tab);
      card.querySelectorAll('.rc-tab').forEach((b, i) => {
        b.classList.toggle('active', i === activeTab);
        b.style.background = i === activeTab ? '#e8f0ff' : 'none';
      });
      container.innerHTML = '';
      if (activeTab === 0) {
        container.appendChild(buildCanvas(points, xlabel, ylabel));
      } else {
        container.appendChild(buildCanvas(rankedPoints, 'X 的秩次', 'Y 的秩次'));
      }
    });
  });

  const style = document.createElement('style');
  style.textContent = `
    .rc-tab.active { background:#e8f0ff !important; border-color:#569cd6 !important; color:#1a5fb4; font-weight:600; }
  `;
  card.appendChild(style);
}

registerViz('rank-correlation', renderRankCorrelation);
