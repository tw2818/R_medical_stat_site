import { registerViz } from './_core.js';

// ============================================================
// REGRESSION — 直线回归教学组件
// 展示散点图 + 回归线 + 方程 + R² + 系数检验
// ============================================================

function renderRegression(el) {
  const title = el.dataset.title || '直线回归';
  const xlabel = el.dataset.xlabel || 'X';
  const ylabel = el.dataset.ylabel || 'Y';
  const xsRaw = (el.dataset.xs || '').split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const ysRaw = (el.dataset.ys || '').split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const n = Math.min(xsRaw.length, ysRaw.length);
  const points = xsRaw.slice(0, n).map((x, i) => ({ x, y: ysRaw[i] }));

  const card = document.createElement('div');
  card.className = 'viz-card';
  card.style.cssText = 'font-family:system-ui; max-width:780px;';

  // 计算回归统计量
  function calcReg(pts) {
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y), N = xs.length;
    const sumX = xs.reduce((a,b)=>a+b,0), sumY = ys.reduce((a,b)=>a+b,0);
    const sumXY = xs.reduce((s,x,i)=>s+x*ys[i],0), sumX2 = xs.reduce((s,x)=>s+x*x,0);
    const sumY2 = ys.reduce((s,y)=>s+y*y,0);
    const denom = N*sumX2 - sumX*sumX;
    const slope = denom !== 0 ? (N*sumXY - sumX*sumY) / denom : 0;
    const intercept = (sumY - slope*sumX) / N;
    const meanX = sumX/N, meanY = sumY/N;
    const SSxx = xs.reduce((s,x)=>s+(x-meanX)**2,0);
    const SSyy = ys.reduce((s,y)=>s+(y-meanY)**2,0);
    const SSxy = xs.reduce((s,x,i)=>s+(x-meanX)*(ys[i]-meanY),0);
    const r = Math.sqrt(SSxx*SSyy) !== 0 ? SSxy / Math.sqrt(SSxx*SSyy) : 0;
    const R2 = r * r;
    const seY = Math.sqrt(SSyy / (N-1));
    const df = N - 2;
    const MSE = df > 0 ? (SSyy - SSxy*SSxy/SSxx) / df : 0;
    const seSlope = MSE > 0 && SSxx !== 0 ? Math.sqrt(MSE / SSxx) : 0;
    const tSlope = seSlope !== 0 ? slope / seSlope : 0;
    const Fstat = SSxx !== 0 ? (SSxy*SSxy/SSxx) / MSE : 0;
    return { slope, intercept, r, R2, Fstat, df, seSlope, tSlope, seY, meanX, meanY };
  }

  let stats = null, eqLine = '', eqAnnot = '';
  if (points.length >= 3) {
    stats = calcReg(points);
    const s = stats.slope.toFixed(4), a = stats.intercept.toFixed(4);
    eqLine = `ŷ = ${stats.slope.toFixed(4)}x + ${stats.intercept.toFixed(4)}`;
    eqAnnot = `R² = ${stats.R2.toFixed(4)}   F = ${stats.Fstat.toFixed(2)} (df=1,${stats.df})   t<sub>slope</sub> = ${stats.tSlope.toFixed(3)}`;
  }

  // Canvas 散点图
  const W = 580, H = 300;
  const pad = { left: 60, right: 20, top: 50, bottom: 50 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const xMin = Math.min(...points.map(p=>p.x)), xMax = Math.max(...points.map(p=>p.x));
  const yMin = Math.min(...points.map(p=>p.y)), yMax = Math.max(...points.map(p=>p.y));
  const xPad = (xMax - xMin) * 0.15 || 1;
  const yPad = (yMax - yMin) * 0.15 || 0.1;
  const sx = x => pad.left + (x - (xMin - xPad)) / ((xMax - xMin) + 2*xPad) * plotW;
  const sy = y => pad.top + plotH - (y - (yMin - yPad)) / ((yMax - yMin) + 2*yPad) * plotH;

  let canvasHTML = `<div class="reg-canvas-wrap"><canvas class="viz-canvas" width="${W}" height="${H}"></canvas></div>`;
  if (!stats) {
    canvasHTML = `<div class="reg-placeholder">数据点不足（至少需要3个）</div>`;
  }

  card.innerHTML = `
    <div class="viz-header"><span>📈 ${title}</span></div>
    ${canvasHTML}
    ${stats ? `<div class="reg-eq">
      <span class="reg-eq-label">回归方程：</span>
      <code>${eqLine}</code>
    </div>
    <div class="reg-stats-row">
      <div class="reg-stat"><span class="reg-stat-label">R²</span><span class="reg-stat-val">${stats.R2.toFixed(4)}</span></div>
      <div class="reg-stat"><span class="reg-stat-label">F</span><span class="reg-stat-val">${stats.Fstat.toFixed(2)}</span><span class="reg-stat-sub">df=(1,${stats.df})</span></div>
      <div class="reg-stat"><span class="reg-stat-label">截距 a</span><span class="reg-stat-val">${stats.intercept.toFixed(4)}</span></div>
      <div class="reg-stat"><span class="reg-stat-label">斜率 b</span><span class="reg-stat-val">${stats.slope.toFixed(4)}</span></div>
      <div class="reg-stat"><span class="reg-stat-label">r</span><span class="reg-stat-val">${stats.r.toFixed(4)}</span></div>
    </div>` : ''}
    <div class="reg-footer">
      <p>例中数据：年龄 x = [${xsRaw.join(',')}]，骨龄 y = [${ysRaw.join(',')}]</p>
      <p>截距 a = ${stats ? stats.intercept.toFixed(5) : '—'}（即 x=0 时 ŷ 的预测值）；斜率 b = ${stats ? stats.slope.toFixed(5) : '—'}（x 每增加1，ŷ 平均变化 b 个单位）</p>
    </div>
  `;
  el.appendChild(card);

  if (stats) {
    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    // 网格线
    ctx.strokeStyle = 'rgba(128,128,128,0.12)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const xp = pad.left + (plotW/5)*i; ctx.beginPath(); ctx.moveTo(xp, pad.top); ctx.lineTo(xp, pad.top+plotH); ctx.stroke();
      const yp = pad.top + (plotH/5)*i; ctx.beginPath(); ctx.moveTo(pad.left, yp); ctx.lineTo(pad.left+plotW, yp); ctx.stroke();
    }
    // 坐标轴
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top+plotH); ctx.lineTo(pad.left+plotW, pad.top+plotH); ctx.stroke();
    // 刻度标签
    ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const val = xMin - xPad + ((xMax-xMin)+2*xPad)*(i/5);
      const xp = sx(val); ctx.beginPath(); ctx.moveTo(xp, pad.top+plotH); ctx.lineTo(xp, pad.top+plotH+4); ctx.stroke();
      ctx.fillText(val.toFixed(1), xp, pad.top+plotH+16);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const val = yMin - yPad + ((yMax-yMin)+2*yPad)*(i/5);
      const yp = sy(val); ctx.beginPath(); ctx.moveTo(pad.left-4, yp); ctx.lineTo(pad.left, yp); ctx.stroke();
      ctx.fillText(val.toFixed(2), pad.left-8, yp+4);
    }
    // 轴标签
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(xlabel, pad.left+plotW/2, H-6);
    ctx.save(); ctx.translate(14, pad.top+plotH/2); ctx.rotate(-Math.PI/2); ctx.fillText(ylabel, 0, 0); ctx.restore();
    // 标题
    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#222';
    ctx.fillText(title, pad.left+plotW/2, 20);
    // 散点
    ctx.fillStyle = '#569cd6';
    points.forEach(p => { ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 5, 0, Math.PI*2); ctx.fill(); });
    // 回归线
    const x1 = xMin - xPad, x2 = xMax + xPad;
    ctx.strokeStyle = '#f9826c'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx(x1), sy(stats.slope*x1+stats.intercept));
    ctx.lineTo(sx(x2), sy(stats.slope*x2+stats.intercept));
    ctx.stroke();
    // 回归线标注
    ctx.fillStyle = '#f9826c'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
    const annotX = sx(xMin + xPad * 3);
    const annotY = stats.slope * annotX + stats.intercept;
    ctx.fillText(`ŷ=${stats.slope.toFixed(3)}x+${stats.intercept.toFixed(2)}`, annotX, sy(annotY) - 10);
  }

  // 注入样式
  const style = document.createElement('style');
  style.textContent = `
    .reg-canvas-wrap{display:block;text-align:center;}
    .reg-placeholder{height:200px;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px;}
    .reg-eq{background:#f8f9fa;border-left:4px solid #f9826c;padding:10px 14px;margin:10px 0;font-size:14px;}
    .reg-eq-label{font-weight:600;color:#555;margin-right:8px;}
    .reg-eq code{font-size:15px;color:#c0392b;font-family:monospace;}
    .reg-stats-row{display:flex;gap:0;flex-wrap:wrap;margin-bottom:8px;}
    .reg-stat{flex:1;min-width:80px;background:#f5f8ff;border:1px solid #e0e8f8;padding:8px 10px;text-align:center;}
    .reg-stat-label{display:block;font-size:11px;color:#888;margin-bottom:3px;}
    .reg-stat-val{display:block;font-size:16px;font-weight:700;color:#2c3e50;}
    .reg-stat-sub{display:block;font-size:10px;color:#aaa;}
    .reg-footer{margin-top:10px;padding:10px 14px;background:#f8f9fa;border-radius:4px;font-size:12px;color:#666;}
    .reg-footer p{margin:3px 0;}
  `;
  card.appendChild(style);
}

registerViz('regression', renderRegression);
