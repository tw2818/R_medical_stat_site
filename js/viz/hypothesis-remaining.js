import { registerViz } from './_core.js';

function renderANOVA(el) {
  let means = [], sds = [], ns = [], labels = [];
  try { means = JSON.parse(el.dataset.means || '[]'); } catch(e) {}
  try { sds = JSON.parse(el.dataset.sds || '[]'); } catch(e) {}
  try { ns = JSON.parse(el.dataset.ns || '[]'); } catch(e) {}
  try { labels = JSON.parse(el.dataset.labels || '[]'); } catch(e) {}

  if (!means.length) {
    el.innerHTML = '<div class="viz-card"><div class="viz-header"><span>📊 ANOVA 组间差异比较</span></div><p style="padding:20px;color:#666;">请提供组数据</p></div>';
    return;
  }
  if (means.some((m, i) => ns[i] < 1 || isNaN(ns[i]))) {
    el.innerHTML = '<div class="viz-card"><div class="viz-header"><span>📊 ANOVA</span></div><p style="padding:20px;color:#e74c3c;">每组样本量 n 必须 ≥ 1</p></div>';
    return;
  }

  const W = 600, H = 320;
  const k = means.length;
  const se = sds.map((s, i) => s / Math.sqrt(ns[i]));
  const dfWithin = ns.reduce((a,b)=>a+b,0) - k;
  const grandMean = means.reduce((s, m, i) => s + m * ns[i], 0) / ns.reduce((a,b)=>a+b, 0);
  const ssBetween = means.reduce((s, m, i) => s + ns[i] * (m - grandMean)**2, 0);
  const ssWithin = sds.reduce((s, sd, i) => s + (ns[i]-1) * sd**2, 0);
  const msBetween = ssBetween / (k - 1);
  const msWithin = ssWithin / dfWithin;
  const Fstat = msBetween / msWithin;
  let pVal = NaN;
  if (window.jStat && window.jStat.ftest) pVal = jStat.ftest(Fstat, k-1, dfWithin);

  const card = document.createElement('div');
  card.className = 'viz-card';
  card.innerHTML = `
    <div class="viz-header"><span>📊 ${el.dataset.title || '组间差异比较'}</span></div>
    <canvas class="viz-canvas" width="${W}" height="${H}"></canvas>
    <div class="viz-table"></div>
  `;
  el.appendChild(card);

  const canvas = card.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(30,30,30,0.03)';
    ctx.fillRect(0, 0, W, H);
    const pad = { left: 60, right: 20, top: 30, bottom: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const barW = plotW / k * 0.5;
    const gap = plotW / k * 0.5;
    const maxY = Math.max(...means.map((m, i) => m + 1.96 * se[i])) * 1.15;
    const sx = i => pad.left + i * (barW + gap) + gap/2;
    const sy = v => pad.top + plotH - (v / maxY) * plotH;
    ctx.strokeStyle = 'rgba(128,128,128,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (plotH/5)*i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }
    means.forEach((m, i) => {
      const x = sx(i) + barW/2;
      const ciLow = m - 1.96 * se[i];
      const ciHigh = m + 1.96 * se[i];
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, sy(ciLow)); ctx.lineTo(x, sy(ciHigh));
      ctx.moveTo(x - 6, sy(ciLow)); ctx.lineTo(x + 6, sy(ciLow));
      ctx.moveTo(x - 6, sy(ciHigh)); ctx.lineTo(x + 6, sy(ciHigh));
      ctx.stroke();
      const color = `hsl(${200 + i * 30}, 60%, 55%)`;
      ctx.fillStyle = color;
      ctx.fillRect(sx(i), sy(m), barW, sy(0) - sy(m));
      ctx.fillStyle = '#333';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`\u0078\u0304=${m.toFixed(2)}`, sx(i) + barW/2, sy(m) - 10);
      ctx.font = '11px sans-serif';
      ctx.fillText(labels[i] || `组${i+1}`, sx(i) + barW/2, pad.top + plotH + 18);
    });
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();
  }
  draw();
  const tableEl = card.querySelector('.viz-table');
  const sig = !isNaN(pVal) && pVal < 0.05;
  tableEl.innerHTML = `
    <table class="anova-table">
      <tr><th>变异来源</th><th>SS</th><th>df</th><th>MS</th><th>F</th><th>P</th></tr>
      <tr><td>组间</td><td>${ssBetween.toFixed(3)}</td><td>${k-1}</td><td>${msBetween.toFixed(3)}</td><td>${Fstat.toFixed(3)}</td><td class="${sig?'sig':'ns'}">${isNaN(pVal)?'—':(pVal < 0.001?'< 0.001':pVal.toFixed(4))}</td></tr>
      <tr><td>组内</td><td>${ssWithin.toFixed(3)}</td><td>${dfWithin}</td><td>${msWithin.toFixed(3)}</td><td>—</td><td>—</td></tr>
    </table>
  `;
}
registerViz('anova', renderANOVA);

function renderScatterPlot(el) {
  const title = el.dataset.title || '散点图';
  const xlabel = el.dataset.xlabel || 'X';
  const ylabel = el.dataset.ylabel || 'Y';
  let points = [];
  try { points = JSON.parse(el.dataset.points || '[]'); } catch(e) { points = []; }
  if (points.length === 0 && el.dataset.xs && el.dataset.ys) {
    const xsRaw = el.dataset.xs.split(',').map(v => parseFloat(v.trim()));
    const ysRaw = el.dataset.ys.split(',').map(v => parseFloat(v.trim()));
    const n = Math.min(xsRaw.length, ysRaw.length);
    for (let i = 0; i < n; i++) {
      if (!isNaN(xsRaw[i]) && !isNaN(ysRaw[i])) points.push({ x: xsRaw[i], y: ysRaw[i] });
    }
  }
  const groupCentroids = [];
  if (el.dataset.groupx && el.dataset.groupy) {
    const gxs = el.dataset.groupx.split(',').map(v => parseFloat(v.trim()));
    const gys = el.dataset.groupy.split(',').map(v => parseFloat(v.trim()));
    const glabels = (el.dataset.grouplabels || '').split(',');
    const nG = Math.min(gxs.length, gys.length);
    for (let i = 0; i < nG; i++) {
      if (!isNaN(gxs[i]) && !isNaN(gys[i])) groupCentroids.push({ x: gxs[i], y: gys[i], label: glabels[i] || ('G' + (i+1)) });
    }
  }
  const W = 600, H = 360;
  const pad = { left: 60, right: 20, top: 40, bottom: 50 };
  const card = document.createElement('div');
  card.className = 'viz-card';
  card.innerHTML = `
    <div class="viz-header"><span>📈 ${title}</span></div>
    <canvas class="viz-canvas" width="${W}" height="${H}"></canvas>
    <div class="viz-r-display">r = <span data-r>—</span></div>
  `;
  el.appendChild(card);
  const canvas = card.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  function computeEllipse(pts, confidence) {
    const n = pts.length;
    if (n < 3) return null;
    const mx = pts.reduce((a,b)=>a+b.x,0)/n;
    const my = pts.reduce((a,b)=>a+b.y,0)/n;
    const dx = pts.map(p=>p.x-mx), dy = pts.map(p=>p.y-my);
    const sxx = dx.reduce((s,v)=>s+v*v,0)/(n-1);
    const syy = dy.reduce((s,v)=>s+v*v,0)/(n-1);
    const sxy = dx.reduce((s,v,i)=>s+v*dy[i],0)/(n-1);
    const tr = sxx+syy, det = sxx*syy-sxy*sxy;
    const disc = Math.sqrt(Math.max(0, tr*tr/4-det));
    const lam1 = tr/2+disc, lam2 = tr/2-disc;
    if (lam1 <= 0 || lam2 <= 0) return null;
    const theta = Math.atan2(2*sxy, sxx-syy)/2;
    const scale = { f: 2.447, t: 2.0, z: 1.96 }[confidence] || 2.0;
    return { mx, my, theta, r: Math.max(Math.sqrt(lam1), Math.sqrt(lam2))*scale, r2: Math.min(Math.sqrt(lam1), Math.sqrt(lam2))*scale };
  }
  function drawEllipse(ctx, cx, cy, rx, ry, theta) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(theta);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2); ctx.stroke(); ctx.restore();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (points.length < 2) {
      ctx.fillStyle = '#666'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('请提供至少2个数据点', W/2, H/2); return;
    }
    const allX = points.map(p=>p.x).concat(groupCentroids.map(g=>g.x));
    const allY = points.map(p=>p.y).concat(groupCentroids.map(g=>g.y));
    const xMin = Math.min(...allX), xMax = Math.max(...allX);
    const yMin = Math.min(...allY), yMax = Math.max(...allY);
    const xPad = (xMax - xMin) * 0.15 || 1;
    const yPad = (yMax - yMin) * 0.15 || 1;
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const sx = x => pad.left + (x - (xMin - xPad)) / ((xMax - xMin) + 2*xPad) * plotW;
    const sy = y => pad.top + plotH - (y - (yMin - yPad)) / ((yMax - yMin) + 2*yPad) * plotH;
    ctx.strokeStyle = 'rgba(128,128,128,0.15)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const xPos = pad.left + (plotW / 5) * i;
      ctx.beginPath(); ctx.moveTo(xPos, pad.top); ctx.lineTo(xPos, pad.top + plotH); ctx.stroke();
      const yPos = pad.top + (plotH / 5) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, yPos); ctx.lineTo(pad.left + plotW, yPos); ctx.stroke();
    }
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const val = xMin - xPad + ((xMax - xMin) + 2*xPad) * (i / 5);
      const xPos = sx(val);
      ctx.beginPath(); ctx.moveTo(xPos, pad.top + plotH); ctx.lineTo(xPos, pad.top + plotH + 4); ctx.stroke();
      ctx.fillText(val.toFixed(1), xPos, pad.top + plotH + 16);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const val = yMin - yPad + ((yMax - yMin) + 2*yPad) * (i / 5);
      const yPos = sy(val);
      ctx.beginPath(); ctx.moveTo(pad.left - 4, yPos); ctx.lineTo(pad.left, yPos); ctx.stroke();
      ctx.fillText(val.toFixed(1), pad.left - 8, yPos + 4);
    }
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(xlabel, pad.left + plotW/2, H - 8);
    ctx.save(); ctx.translate(14, pad.top + plotH/2); ctx.rotate(-Math.PI/2); ctx.fillText(ylabel, 0, 0); ctx.restore();
    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#222'; ctx.textAlign = 'center';
    ctx.fillText(title, pad.left + plotW/2, 20);
    if (el.dataset.ellipse === 'true' && points.length >= 3) {
      const ell = computeEllipse(points, 't');
      if (ell) {
        const ecx = sx(ell.mx), ecy = sy(ell.my);
        const erx = (ell.r / ((xMax-xMin)+2*xPad)) * plotW;
        const ery = (ell.r2 / ((yMax-yMin)+2*yPad)) * plotH;
        ctx.save(); ctx.strokeStyle = 'rgba(231,76,60,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
        drawEllipse(ctx, ecx, ecy, erx, ery, ell.theta); ctx.setLineDash([]); ctx.restore();
      }
    }
    ctx.fillStyle = '#569cd6';
    points.forEach(p => { ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 4, 0, Math.PI * 2); ctx.fill(); });
    if (groupCentroids.length > 0) {
      const colors = ['#e74c3c','#2ecc71','#9b59b6','#f39c12','#1abc9c','#e91e63'];
      groupCentroids.forEach((g, i) => {
        const cx = sx(g.x), cy = sy(g.y), color = colors[i % colors.length];
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = color; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(g.label, cx + 10, cy - 6);
      });
    }
    const showRegression = points.length >= 5 && (el.dataset.regression !== 'false');
    if (showRegression) {
      const xs = points.map(p=>p.x), ys = points.map(p=>p.y), n = xs.length;
      const sumX = xs.reduce((a,b)=>a+b,0), sumY = ys.reduce((a,b)=>a+b,0), sumXY = xs.reduce((s,x,i)=>s+x*ys[i],0), sumX2 = xs.reduce((s,x)=>s+x*x,0);
      const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
      const intercept = (sumY - slope*sumX) / n;
      const meanX = sumX / n, meanY = sumY / n;
      const numR = xs.reduce((s,x,i)=>s+(x-meanX)*(ys[i]-meanY),0);
      const denR = Math.sqrt(xs.reduce((s,x)=>s+(x-meanX)**2,0) * ys.reduce((s,y)=>s+(y-meanY)**2,0));
      card.querySelector('[data-r]').textContent = (numR / denR).toFixed(4);
      const x1 = xMin - xPad, x2 = xMax + xPad;
      ctx.strokeStyle = '#f9826c'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(sx(x1), sy(slope*x1+intercept)); ctx.lineTo(sx(x2), sy(slope*x2+intercept)); ctx.stroke();
    }
  }
  draw();
}
registerViz('scatter', renderScatterPlot);

function renderScreePlot(el) {
  let eigenvalues = [];
  try { eigenvalues = JSON.parse(el.dataset.eigenvalues || '[]'); } catch(e) { eigenvalues = []; }
  if (!eigenvalues.length) {
    el.innerHTML = '<div class="viz-card"><div class="viz-header"><span>📊 PCA 碎石图</span></div><p style="padding:20px;color:#666;">请提供特征值数据 (data-eigenvalues)</p></div>';
    return;
  }
  const W = 600, H = 300;
  const totalVar = eigenvalues.reduce((a,b)=>a+b,0);
  const cumulative = [];
  eigenvalues.reduce((sum, v) => { sum += v; cumulative.push(sum); return sum; }, 0);
  const cumPct = cumulative.map(s => s / totalVar * 100);
  const kaiserCount = eigenvalues.filter(v => v > 1).length;
  const card = document.createElement('div');
  card.className = 'viz-card';
  card.innerHTML = `
    <div class="viz-header"><span>📊 PCA 碎石图 (Kaiser: ${kaiserCount}个主成分)</span><button class="viz-reset" title="重置">↺</button></div>
    <canvas class="viz-canvas" width="${W}" height="${H}"></canvas>
    <div class="viz-legend">
      <span class="legend-item" style="border-color:#569cd6">— 特征值</span>
      <span class="legend-item" style="border-color:#c586c0">— 累积方差%</span>
      <span class="legend-item" style="border-color:#f9826c;border-style:dashed">— Kaiser 准则 (λ=1)</span>
    </div>
    <div class="viz-subtitle">总方差解释: ${cumPct[cumPct.length-1].toFixed(1)}%</div>
  `;
  el.appendChild(card);
  const canvas = card.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(30,30,30,0.03)'; ctx.fillRect(0, 0, W, H);
    const pad = { left: 50, right: 20, top: 20, bottom: 40 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const n = eigenvalues.length;
    const maxEv = Math.max(...eigenvalues, 1);
    const barW = plotW / n * 0.6;
    const gap = plotW / n * 0.4;
    const sx = i => pad.left + i * (barW + gap) + gap/2;
    const syEv = v => pad.top + plotH - (v / (maxEv * 1.15)) * plotH;
    const syCum = p => pad.top + plotH - (p / 100) * plotH;
    const kaiserY = syEv(1);
    ctx.strokeStyle = '#f9826c'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(pad.left, kaiserY); ctx.lineTo(pad.left + plotW, kaiserY); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = '#f9826c'; ctx.font = '11px sans-serif'; ctx.fillText('λ=1 (Kaiser)', pad.left + plotW - 75, kaiserY - 5);
    ctx.textAlign = 'center';
    eigenvalues.forEach((ev, i) => {
      const x = sx(i), colorIntensity = 0.3 + 0.7 * (cumPct[i] / 100);
      ctx.fillStyle = `rgba(86, 156, 214, ${colorIntensity})`;
      ctx.fillRect(x, syEv(ev), barW, syEv(0) - syEv(ev));
      ctx.fillStyle = '#333'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`PC${i+1}`, x + barW/2, pad.top + plotH + 18);
      ctx.font = '10px sans-serif'; ctx.fillText(ev.toFixed(2), x + barW/2, syEv(ev) - 4);
      ctx.fillStyle = '#c586c0'; ctx.fillText(`${cumPct[i].toFixed(0)}%`, x + barW/2, syCum(cumPct[i]) - 4);
      if (ev > 1) { ctx.fillStyle = '#4ec9b0'; ctx.beginPath(); ctx.arc(x + barW/2, syEv(ev) - 10, 4, 0, Math.PI*2); ctx.fill(); }
    });
    ctx.beginPath(); ctx.strokeStyle = '#c586c0'; ctx.lineWidth = 2;
    eigenvalues.forEach((ev, i) => { const x = sx(i) + barW/2, y = syCum(cumPct[i]); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke();
    eigenvalues.forEach((ev, i) => { const x = sx(i) + barW/2, y = syCum(cumPct[i]); ctx.fillStyle = '#c586c0'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill(); });
    ctx.fillStyle = '#569cd6'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('特征值', 15, pad.top + 15);
    ctx.fillStyle = '#c586c0'; ctx.fillText('累积%', 15, pad.top + 30);
  }
  draw();
}
registerViz('pca', renderScreePlot);

function renderNormTest(el) {
  const id = 'normtest-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '正态性检验 Q-Q 图';
  const rawData = el.dataset.data || '72,80,85,88,90,92,95,97,98,100,102,104,105,107,108,110,112,115,118,120,125,128,132';
  const data = rawData.split(',').map(Number).filter(v => Number.isFinite(v)).sort((a, b) => a - b);
  const n = data.length;
  if (n < 3 || !window.jStat?.normal?.inv) {
    el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><p style="padding:20px;color:#666;">至少需要 3 个有效数据点，且需成功加载 jStat 才能绘制 Q-Q 图。</p></div>';
    return;
  }
  const mu = data.reduce((a, b) => a + b, 0) / n;
  const sigma = Math.sqrt(data.reduce((a, b) => a + (b - mu) ** 2, 0) / (n - 1));
  const W = 500, H = 400;
  const padL = 55, padR = 20, padT = 30, padB = 45;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  el.innerHTML = `<div class="viz-card">
    <div class="viz-header">📊 ${title}</div>
    <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
    <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;" id="${id}-stats"></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:8px;">
      <label style="font-size:13px;">添加扰动:
        <input type="range" id="${id}-skew" min="0" max="10" value="0" step="1" style="width:100px;">
      </label>
      <button id="${id}-reset" style="padding:4px 14px;background:#95a5a6;color:white;border:none;border-radius:4px;cursor:pointer;">重置</button>
    </div>
  </div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const theorQ = data.map((_, i) => jStat.normal.inv((i + 0.5) / n, mu, sigma));
  const minQ = Math.min(...theorQ), maxQ = Math.max(...theorQ);
  const minD = Math.min(...data), maxD = Math.max(...data);
  function draw(skew) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 18);
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(padL + (i/5)*plotW, padT); ctx.lineTo(padL + (i/5)*plotW, padT + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, padT + (i/5)*plotH); ctx.lineTo(padL + plotW, padT + (i/5)*plotH); ctx.stroke();
    }
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
    for (let i = 0; i <= 5; i++) {
      ctx.textAlign = 'center'; ctx.fillText((minQ + (i/5)*(maxQ - minQ)).toFixed(0), padL + (i/5)*plotW, padT + plotH + 16);
      ctx.textAlign = 'right'; ctx.fillText((maxD - (i/5)*(maxD - minD)).toFixed(0), padL - 6, padT + (i/5)*plotH + 4);
    }
    ctx.save(); ctx.translate(12, padT + plotH/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.fillText('样本分位数', 0, 0); ctx.restore();
    ctx.textAlign = 'center'; ctx.fillText('理论分位数 (正态)', padL + plotW/2, H - 4);
    const scaleX = q => padL + ((q - minQ) / (maxQ - minQ + 0.001)) * plotW;
    const scaleY = v => padT + (1 - (v - minD) / (maxD - minD + 0.001)) * plotH;
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(scaleX(minQ), scaleY(minD)); ctx.lineTo(scaleX(maxQ), scaleY(maxD)); ctx.stroke(); ctx.setLineDash([]);
    const skewedData = data.map((v, i) => v + Math.sin(i * skew * 0.5) * skew * 0.5);
    ctx.fillStyle = 'rgba(52,152,219,0.7)';
    theorQ.forEach((q, i) => { const x = scaleX(q), y = scaleY(skewedData[i]); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); });
    let skewness = NaN, kurtosis = NaN;
    try { if (n >= 3) { skewness = jStat.skewness(data); kurtosis = jStat.kurtosis(data); } } catch(e) {}
    document.getElementById(id + '-stats').textContent = `n=${n} | 偏度=${isNaN(skewness) ? '—' : skewness.toFixed(3)} | 峰度=${isNaN(kurtosis) ? '—' : kurtosis.toFixed(3)} | 数据点越贴近红线越接近正态`;
  }
  draw(0);
  document.getElementById(id + '-skew').addEventListener('input', () => draw(parseInt(document.getElementById(id + '-skew').value)));
  document.getElementById(id + '-reset').addEventListener('click', () => { document.getElementById(id + '-skew').value = 0; draw(0); });
}
registerViz('normtest', renderNormTest);

function renderFactorialInteraction(el) {
  const id = 'fact-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '析因设计交互效应图';
  const factor1 = el.dataset.factor1 ? el.dataset.factor1.split(',') : ['因素A', '因素B'];
  const factor2 = el.dataset.factor2 ? el.dataset.factor2.split(',') : ['水平1', '水平2'];
  const means = el.dataset.means ? JSON.parse(el.dataset.means) : [[10, 30], [40, 70]];
  const W = 560, H = 320;
  el.innerHTML = `<div class="viz-card"><div class="viz-header">📊 ${title}</div><canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas></div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const pad = {t: 40, r: 120, b: 60, l: 60};
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const allVals = means.flat();
  const yMin = Math.min(...allVals) * 0.8;
  const yMax = Math.max(...allVals) * 1.15;
  const yOf = v => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 20);
  ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const yVal = yMin + (yMax - yMin) * i / 4, yPx = yOf(yVal);
    ctx.beginPath(); ctx.moveTo(pad.l, yPx); ctx.lineTo(W - pad.r, yPx); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(yVal.toFixed(0), pad.l - 5, yPx + 4);
  }
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  const n1 = factor1.length;
  const groupW = iW / n1;
  factor1.forEach((f1, fi) => {
    const groupCenterX = pad.l + (fi + 0.5) * groupW;
    ctx.fillStyle = '#333'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f1, groupCenterX, H - pad.b + 20);
    const n2 = factor2.length, offsetStep = groupW * 0.2, f2OffsetStart = -(n2 - 1) * offsetStep / 2;
    means[fi].forEach((mv, fi2) => {
      const x = groupCenterX + f2OffsetStart + fi2 * offsetStep, y = yOf(mv);
      ctx.fillStyle = fi2 === 0 ? '#2980b9' : '#e67e22';
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      if (fi === 0) {
        const xNext = pad.l + (fi + 1.5) * groupW + f2OffsetStart + fi2 * offsetStep;
        const yNext = yOf(means[fi + 1][fi2]);
        ctx.strokeStyle = fi2 === 0 ? '#2980b9' : '#e67e22'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xNext, yNext); ctx.stroke(); ctx.setLineDash([]);
      }
    });
  });
  factor2.forEach((label, i) => {
    const lx = W - pad.r + 10, ly = pad.t + i * 22;
    ctx.fillStyle = i === 0 ? '#2980b9' : '#e67e22'; ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(label, lx + 12, ly + 4);
  });
  ctx.save(); ctx.translate(14, pad.t + iH / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.fillText('均值', 0, 0); ctx.restore();
}
registerViz('interaction', renderFactorialInteraction);

function renderBlandAltman(el) {
  const id = 'ba-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'Bland-Altman 一致性分析';
  let delta = [10,15,12,8,18,11,14,9,13,16,7,20,5,17,14];
  let meanVals = [55,58,52,60,48,56,53,59,54,57,50,62,45,58,54];
  try {
    if (el.dataset.delta) delta = JSON.parse(el.dataset.delta);
    if (el.dataset.mean) meanVals = JSON.parse(el.dataset.mean);
  } catch (e) {
    console.warn('[stats-viz] blandaltman data parse failed, using fallback defaults', e);
  }
  delta = delta.filter(v => Number.isFinite(v));
  meanVals = meanVals.filter(v => Number.isFinite(v));
  const n = Math.min(delta.length, meanVals.length);
  if (n < 3) {
    el.innerHTML = `<div class="viz-card"><div class="viz-header">📊 ${title}</div><p style="padding:20px;color:#666;">Bland-Altman 图至少需要 3 对有效数据。</p></div>`;
    return;
  }
  delta = delta.slice(0, n); meanVals = meanVals.slice(0, n);
  const W = 520, H = 340;
  el.innerHTML = `<div class="viz-card"><div class="viz-header">📊 ${title}</div><canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas><div id="${id}-stats" style="text-align:center;font-size:12px;color:#555;margin-top:4px;"></div></div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const pad = {t: 30, r: 25, b: 45, l: 55};
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const meanVal = delta.reduce((a, b) => a + b, 0) / delta.length;
  const sd = Math.sqrt(delta.reduce((s, d) => s + (d - meanVal) ** 2, 0) / (delta.length - 1));
  const xMin = Math.min(...meanVals) * 0.95, xMax = Math.max(...meanVals) * 1.05;
  const yMin = Math.min(...delta) - Math.abs(meanVal) * 0.3, yMax = Math.max(...delta) + Math.abs(meanVal) * 0.3;
  const xOf = v => pad.l + ((v - xMin) / (xMax - xMin)) * iW;
  const yOf = v => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 20);
  const zeroY = yOf(0);
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(pad.l, zeroY); ctx.lineTo(pad.l + iW, zeroY); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#888'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('零差值线', pad.l + iW / 2, zeroY - 5);
  const meanY = yOf(meanVal);
  ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pad.l, meanY); ctx.lineTo(pad.l + iW, meanY); ctx.stroke();
  ctx.fillStyle = '#27ae60'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('mean=' + meanVal.toFixed(2), pad.l + 5, meanY - 5);
  [meanVal + 1.96 * sd, meanVal - 1.96 * sd].forEach((v, i) => {
    const ly = yOf(v);
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, ly); ctx.lineTo(pad.l + iW, ly); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#e74c3c'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText((i === 0 ? '+1.96SD' : '-1.96SD') + '=' + v.toFixed(2), pad.l + 5, ly - 4);
  });
  ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const yv = yMin + (yMax - yMin) * i / 4; ctx.beginPath(); ctx.moveTo(pad.l, yOf(yv)); ctx.lineTo(pad.l + iW, yOf(yv)); ctx.stroke(); }
  for (let i = 0; i <= 4; i++) { const xv = xMin + (xMax - xMin) * i / 4; ctx.beginPath(); ctx.moveTo(xOf(xv), pad.t); ctx.lineTo(xOf(xv), pad.t + iH); ctx.stroke(); }
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + iH); ctx.lineTo(pad.l + iW, pad.t + iH); ctx.stroke();
  ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
  for (let i = 0; i <= 4; i++) { const yv = yMin + (yMax - yMin) * i / 4; ctx.textAlign = 'right'; ctx.fillText(yv.toFixed(0), pad.l - 5, yOf(yv) + 4); }
  for (let i = 0; i <= 4; i++) { const xv = xMin + (xMax - xMin) * i / 4; ctx.textAlign = 'center'; ctx.fillText(xv.toFixed(0), xOf(xv), pad.t + iH + 15); }
  ctx.save(); ctx.translate(14, pad.t + iH / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.fillText('差值 (A - B)', 0, 0); ctx.restore();
  ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.fillText('两方法均值', pad.l + iW / 2, H - 4);
  delta.forEach((d, i) => { const x = xOf(meanVals[i]), y = yOf(d); ctx.fillStyle = Math.abs(d) > 1.96 * sd ? '#e74c3c' : '#3498db'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
  document.getElementById(id + '-stats').textContent = 'mean=' + meanVal.toFixed(2) + '  |  SD=' + sd.toFixed(2) + '  |  95%LoA: [' + (meanVal - 1.96 * sd).toFixed(2) + ', ' + (meanVal + 1.96 * sd).toFixed(2) + ']';
}
registerViz('blandaltman', renderBlandAltman);

  // ── 列联表热力图（实测 vs 期望频数差异）──────────────────
  // <div class="stat-viz" data-type="contingency"
  //      data-a="75" data-b="21" data-c="99" data-d="5"
  //      data-title="四格表列联表（实测 vs 期望）"></div>
  function renderContingency(el) {
    const a = parseInt(el.dataset.a || '75');
    const b = parseInt(el.dataset.b || '21');
    const c = parseInt(el.dataset.c || '99');
    const d = parseInt(el.dataset.d || '5');
    const title = el.dataset.title || '列联表热力图（实测 vs 期望）';
    const rowLabels = (el.dataset.rowLabels || '治疗组,安慰剂组').split(',');
    const colLabels = (el.dataset.colLabels || '有效,无效').split(',');

    const obs = [[a, b], [c, d]];
    const total = a + b + c + d;
    const rowTotals = [a + b, c + d];
    const colTotals = [a + c, b + d];
    const expected = [
      [(rowTotals[0] * colTotals[0]) / total, (rowTotals[0] * colTotals[1]) / total],
      [(rowTotals[1] * colTotals[0]) / total, (rowTotals[1] * colTotals[1]) / total],
    ];
    const diff = obs.map((row, i) => row.map((v, j) => v - expected[i][j]));

    el.innerHTML = `
      <div class="viz-card">
        <div class="viz-header">📊 ${title}</div>
        <div class="viz-body">
          <canvas class="viz-canvas" style="width:100%;max-width:520px;height:240px !important;display:block;margin:0 auto;"></canvas>
        </div>
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;padding:6px 12px;background:#f8f9fa;border-top:1px solid #eee;font-size:12px;color:#555;">
          <span>格内：<strong>实测 (期望)</strong>，颜色深浅 = 观测-期望 差值</span>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;padding:4px;font-size:11px;color:#666;">
          <span style="background:#ffd0d0;padding:2px 8px;border-radius:4px;">■ 正偏差（实测&gt;期望）</span>
          <span style="background:#c8e6ff;padding:2px 8px;border-radius:4px;">■ 负偏差（实测&lt;期望）</span>
          <span style="background:#f5f5f5;padding:2px 8px;border-radius:4px;">■ 无偏差</span>
        </div>
      </div>
    `;

    const canvas = el.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth * 2, H = 440;
    canvas.width = W; canvas.height = H;

    // 窄屏自适应
    const containerW = canvas.offsetWidth;
    const isNarrow = containerW < 400;
    const scale = isNarrow ? Math.max(containerW / 400, 0.6) : 1;
    const pad = { l: isNarrow ? Math.round(55 * scale) : 90, r: 20, t: 20, b: isNarrow ? 30 : 20 };
    const cellW = (W - pad.l - pad.r) / 2;
    const cellH = (H - pad.t - pad.b) / 2;

    ctx.clearRect(0, 0, W, H);

    const maxAbs = Math.max(...diff.map(r => Math.max(...r.map(Math.abs))));

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const x = pad.l + j * cellW;
        const y = pad.t + i * cellH;
        const dval = diff[i][j];
        const intensity = Math.abs(dval) / (maxAbs || 1);

        if (dval > 0) {
          ctx.fillStyle = `rgba(231, 76, 60, ${0.15 + intensity * 0.7})`;
        } else if (dval < 0) {
          ctx.fillStyle = `rgba(52, 152, 219, ${0.15 + intensity * 0.7})`;
        } else {
          ctx.fillStyle = '#f5f5f5';
        }
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

        ctx.fillStyle = '#1e293b';
        ctx.font = `bold ${Math.round(36 * scale)}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(obs[i][j], x + cellW / 2, y + cellH / 2 - 8);
        ctx.font = `${Math.round(26 * scale)}px JetBrains Mono, monospace`;
        ctx.fillStyle = '#888';
        ctx.fillText(`(${expected[i][j].toFixed(1)})`, x + cellW / 2, y + cellH / 2 + 12);

        // 列标签（顶部）
        if (i === 0) {
          ctx.fillStyle = '#444';
          ctx.font = `bold ${Math.round(26 * scale)}px sans-serif`;
          ctx.fillText(colLabels[j] || '', x + cellW / 2, y - 6);
        }
        // 行标签（左侧）
        if (j === 0) {
          ctx.fillStyle = '#444';
          ctx.font = `bold ${Math.round(26 * scale)}px sans-serif`;
          ctx.textAlign = 'right';
          ctx.fillText(rowLabels[i] || '', x - 8, y + cellH / 2 + 5);
          ctx.textAlign = 'center';
        }
      }
    }
  }
registerViz('contingency', renderContingency);

  // ── 马赛克图 ───────────────────────────────────────────
  // <div class="stat-viz" data-type="mosaic"
  //      data-a="75" data-b="21" data-c="99" data-d="5"
  //      data-title="马赛克图（四格表频数）"></div>
  function renderMosaic(el) {
    const a = parseInt(el.dataset.a || '75');
    const b = parseInt(el.dataset.b || '21');
    const c = parseInt(el.dataset.c || '99');
    const d = parseInt(el.dataset.d || '5');
    const title = el.dataset.title || '面积比例图（四格表频数）';
    const rowLabels = (el.dataset.rowLabels || '治疗组,安慰剂组').split(',');
    const colLabels = (el.dataset.colLabels || '有效,无效').split(',');

    const obs = [[a, b], [c, d]];
    const total = a + b + c + d;
    const colTotals = [a + c, b + d];
    const rowTotals = [a + b, c + d];

    el.innerHTML = `
      <div class="viz-card">
        <div class="viz-header">📊 ${title}</div>
        <div class="viz-body">
          <canvas class="viz-canvas" style="width:100%;max-width:520px;height:250px !important;display:block;margin:0 auto;"></canvas>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;padding:4px;font-size:11px;color:#666;">
          <span style="background:#aed6f1;padding:2px 8px;border-radius:4px;">■ 有效</span>
          <span style="background:#fadbd8;padding:2px 8px;border-radius:4px;">■ 无效</span>
        </div>
      </div>
    `;

    const canvas = el.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth * 2, H = 480;
    canvas.width = W; canvas.height = H;

    // 窄屏自适应
    const containerW = canvas.offsetWidth;
    const isNarrow = containerW < 400;
    const scale = isNarrow ? Math.max(containerW / 400, 0.6) : 1;
    const pad = { l: isNarrow ? Math.round(55 * scale) : 90, r: 20, t: 20, b: isNarrow ? 30 : 20 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;

    ctx.clearRect(0, 0, W, H);

    // 列宽 = 列合计比例
    const col1W = innerW * (colTotals[0] / total);
    const col2W = innerW * (colTotals[1] / total);

    // 行高 = 行合计比例（每列内）
    const row1H1 = innerH * (rowTotals[0] / total) * (a / rowTotals[0]);
    const row1H2 = innerH * (rowTotals[0] / total) * (b / rowTotals[0]);
    const row2H1 = innerH * (rowTotals[1] / total) * (c / rowTotals[1]);
    const row2H2 = innerH * (rowTotals[1] / total) * (d / rowTotals[1]);

    const cells = [
      [{ v: a, x: pad.l, y: pad.t, w: col1W, h: row1H1, fill: '#aed6f1' }],
      [{ v: b, x: pad.l + col1W, y: pad.t, w: col2W, h: row1H2, fill: '#fadbd8' }],
      [{ v: c, x: pad.l, y: pad.t + row1H1, w: col1W, h: row2H1, fill: '#aed6f1' }],
      [{ v: d, x: pad.l + col1W, y: pad.t + row1H2, w: col2W, h: row2H2, fill: '#fadbd8' }],
    ];

    // 合并同行同列的矩形
    // Row 1
    ctx.fillStyle = '#aed6f1';
    ctx.fillRect(pad.l, pad.t, col1W, row1H1);
    ctx.fillStyle = '#fadbd8';
    ctx.fillRect(pad.l + col1W, pad.t, col2W, row1H2);
    // Row 2
    ctx.fillStyle = '#aed6f1';
    ctx.fillRect(pad.l, pad.t + row1H1, col1W, row2H1);
    ctx.fillStyle = '#fadbd8';
    ctx.fillRect(pad.l + col1W, pad.t + row1H2, col2W, row2H2);

    // 边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    // 垂直分隔（列合计边界）
    ctx.beginPath();
    ctx.moveTo(pad.l + col1W, pad.t);
    ctx.lineTo(pad.l + col1W, pad.t + innerH);
    ctx.stroke();
    // 水平分隔（行合计边界）
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + row1H1 + row1H2);
    ctx.lineTo(pad.l + innerW, pad.t + row1H1 + row1H2);
    ctx.stroke();

    // 频数标注
    ctx.font = `bold ${Math.round(28 * scale)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    const cells2 = [
      { v: a, x: pad.l + col1W / 2, y: pad.t + row1H1 / 2 },
      { v: b, x: pad.l + col1W + col2W / 2, y: pad.t + row1H2 / 2 },
      { v: c, x: pad.l + col1W / 2, y: pad.t + row1H1 + row2H1 / 2 },
      { v: d, x: pad.l + col1W + col2W / 2, y: pad.t + row1H2 + row2H2 / 2 },
    ];
    ctx.fillStyle = '#1e293b';
    cells2.forEach(({ v, x, y }) => {
      ctx.fillText(v, x, y + 5);
    });

    // 列标签
    ctx.font = `bold ${Math.round(24 * scale)}px sans-serif`;
    ctx.fillStyle = '#555';
    ctx.fillText(colLabels[0] || '有效', pad.l + col1W / 2, pad.t + innerH + 14);
    ctx.fillText(colLabels[1] || '无效', pad.l + col1W + col2W / 2, pad.t + innerH + 14);

    // 行标签（左侧，顶部=安慰剂组=row1，底部=治疗组=row2）
    ctx.textAlign = 'right';
    ctx.font = `bold ${Math.round(24 * scale)}px sans-serif`;
    ctx.fillText(rowLabels[0] || '安慰剂组', pad.l - 6, pad.t + row1H1 / 2 + 4);
    ctx.fillText(rowLabels[1] || '治疗组', pad.l - 6, pad.t + row1H1 + row2H1 / 2 + 4);
  }
registerViz('mosaic', renderMosaic);
