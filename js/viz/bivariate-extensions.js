import { registerViz, ensureJStat } from './_core.js';

function parseNumericCsv(text) {
  return String(text || '')
    .split(',')
    .map(v => Number(v.trim()))
    .filter(v => Number.isFinite(v));
}

function pairedXY(xsText, ysText) {
  const xs = parseNumericCsv(xsText);
  const ys = parseNumericCsv(ysText);
  const n = Math.min(xs.length, ys.length);
  return {
    xs: xs.slice(0, n),
    ys: ys.slice(0, n),
    points: xs.slice(0, n).map((x, i) => ({ x, y: ys[i] }))
  };
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function pearson(xs, ys) {
  const mx = mean(xs), my = mean(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const denx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
  const deny = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
  if (denx === 0 || deny === 0) return 0;
  return num / (denx * deny);
}

function averageRanks(arr) {
  const indexed = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) j++;
    const rank = (i + j + 2) / 2;
    for (let k = i; k <= j; k++) ranks[indexed[k].i] = rank;
    i = j + 1;
  }
  return ranks;
}

function spearman(xs, ys) {
  return pearson(averageRanks(xs), averageRanks(ys));
}

function kendallTau(xs, ys) {
  let concordant = 0, discordant = 0;
  let tiesX = 0, tiesY = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      const dx = xs[i] - xs[j];
      const dy = ys[i] - ys[j];
      if (dx === 0 && dy === 0) continue;
      if (dx === 0) { tiesX++; continue; }
      if (dy === 0) { tiesY++; continue; }
      if (dx * dy > 0) concordant++;
      else if (dx * dy < 0) discordant++;
    }
  }
  const denom = Math.sqrt((concordant + discordant + tiesX) * (concordant + discordant + tiesY));
  return denom > 0 ? (concordant - discordant) / denom : 0;
}

function corrPValue(r, n) {
  if (n < 3 || Math.abs(r) >= 1) return r === 0 ? 1 : 0;
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  return Math.min(1, 2 * (1 - jStat.studentt.cdf(Math.abs(t), n - 2)));
}

function linearFit(xs, ys) {
  const mx = mean(xs), my = mean(ys);
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const preds = xs.map(x => intercept + slope * x);
  return { model: 'linear', intercept, slope, preds };
}

function solve3x3(A, b) {
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const div = M[col][col];
    for (let j = col; j < 4; j++) M[col][j] /= div;
    for (let row = 0; row < 3; row++) {
      if (row === col) continue;
      const factor = M[row][col];
      for (let j = col; j < 4; j++) M[row][j] -= factor * M[col][j];
    }
  }
  return [M[0][3], M[1][3], M[2][3]];
}

function quadraticFit(xs, ys) {
  const n = xs.length;
  const sx = xs.reduce((a, b) => a + b, 0);
  const sx2 = xs.reduce((a, x) => a + x * x, 0);
  const sx3 = xs.reduce((a, x) => a + x * x * x, 0);
  const sx4 = xs.reduce((a, x) => a + x * x * x * x, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sx2y = xs.reduce((a, x, i) => a + x * x * ys[i], 0);
  const coefs = solve3x3([
    [n, sx, sx2],
    [sx, sx2, sx3],
    [sx2, sx3, sx4]
  ], [sy, sxy, sx2y]);
  if (!coefs) return linearFit(xs, ys);
  const [a, b, c] = coefs;
  const preds = xs.map(x => a + b * x + c * x * x);
  return { model: 'quadratic', a, b, c, preds };
}

function logFit(xs, ys) {
  if (xs.some(x => x <= 0)) return null;
  const lxs = xs.map(x => Math.log(x));
  const fit = linearFit(lxs, ys);
  return { model: 'log', a: fit.intercept, b: fit.slope, preds: xs.map(x => fit.intercept + fit.slope * Math.log(x)) };
}

function fitMetrics(ys, preds) {
  const ybar = mean(ys);
  const sse = ys.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0);
  const sst = ys.reduce((s, y) => s + (y - ybar) ** 2, 0);
  const r2 = sst > 0 ? 1 - sse / sst : 0;
  const rmse = Math.sqrt(sse / ys.length);
  return { sse, r2, rmse };
}

function renderRankCorrelation(el) {
  if (!ensureJStat(el)) return;
  const id = 'rankcorr-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '秩相关对比';
  const defaultXs = el.dataset.xs || '1,2,3,4,5,6,7,8';
  const defaultYs = el.dataset.ys || '2,3,5,4,6,7,9,8';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">📈 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">可切换“原始值视图”和“秩次视图”，帮助区分 Pearson 线性相关与 Spearman 单调相关。</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">X（逗号分隔）<br><input id="${id}-xs" type="text" value="${defaultXs}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">Y（逗号分隔）<br><input id="${id}-ys" type="text" value="${defaultYs}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-calc" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">更新相关分析</button>
        <button id="${id}-raw" class="path-tab active" type="button">原始值视图</button>
        <button id="${id}-rank" class="path-tab" type="button">秩次视图</button>
      </div>
      <canvas id="${id}-canvas" width="620" height="340" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
    </div>`;

  const xsInput = document.getElementById(`${id}-xs`);
  const ysInput = document.getElementById(`${id}-ys`);
  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const result = document.getElementById(`${id}-result`);
  const rawBtn = document.getElementById(`${id}-raw`);
  const rankBtn = document.getElementById(`${id}-rank`);
  let view = 'raw';

  function setView(next) {
    view = next;
    rawBtn.classList.toggle('active', view === 'raw');
    rankBtn.classList.toggle('active', view === 'rank');
    compute();
  }

  function draw(xs, ys, labelX, labelY, titleText) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const pad = { left: 60, right: 20, top: 35, bottom: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xPad = (xMax - xMin) * 0.15 || 1;
    const yPad = (yMax - yMin) * 0.15 || 1;
    const sx = x => pad.left + ((x - (xMin - xPad)) / ((xMax - xMin) + 2 * xPad)) * plotW;
    const sy = y => pad.top + plotH - ((y - (yMin - yPad)) / ((yMax - yMin) + 2 * yPad)) * plotH;

    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, W / 2, 18);

    ctx.strokeStyle = 'rgba(128,128,128,0.15)';
    for (let i = 0; i <= 5; i++) {
      const x = pad.left + (plotW / 5) * i;
      const y = pad.top + (plotH / 5) * i;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    ctx.fillStyle = '#569cd6';
    xs.forEach((x, i) => {
      ctx.beginPath();
      ctx.arc(sx(x), sy(ys[i]), 4, 0, Math.PI * 2);
      ctx.fill();
    });

    const reg = linearFit(xs, ys);
    const x1 = xMin - xPad, x2 = xMax + xPad;
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx(x1), sy(reg.intercept + reg.slope * x1));
    ctx.lineTo(sx(x2), sy(reg.intercept + reg.slope * x2));
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(labelX, pad.left + plotW / 2, H - 10);
    ctx.save();
    ctx.translate(16, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(labelY, 0, 0);
    ctx.restore();
  }

  function compute() {
    const { xs, ys } = pairedXY(xsInput.value, ysInput.value);
    if (xs.length < 4) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">请至少提供 4 对有效数据。</div>';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const rhoP = pearson(xs, ys);
    const rhoS = spearman(xs, ys);
    const tau = kendallTau(xs, ys);
    const pP = corrPValue(rhoP, xs.length);
    const pS = corrPValue(rhoS, xs.length);
    const rankX = averageRanks(xs);
    const rankY = averageRanks(ys);

    if (view === 'raw') {
      draw(xs, ys, 'X 原始值', 'Y 原始值', '原始值散点图');
    } else {
      draw(rankX, rankY, 'X 秩次', 'Y 秩次', '秩次散点图');
    }

    const stronger = Math.abs(rhoS) > Math.abs(rhoP)
      ? '当前数据的单调关系比线性关系更强，Spearman 更值得关注。'
      : '当前数据的线性关系与单调关系接近，Pearson 与 Spearman 结论差异不大。';

    result.innerHTML = `
      <div><strong>Pearson r</strong> = ${rhoP.toFixed(4)}，P ≈ ${pP < 0.001 ? '&lt; 0.001' : pP.toFixed(4)}</div>
      <div><strong>Spearman ρ</strong> = ${rhoS.toFixed(4)}，P ≈ ${pS < 0.001 ? '&lt; 0.001' : pS.toFixed(4)}</div>
      <div><strong>Kendall τ</strong> = ${tau.toFixed(4)}</div>
      <div><strong>解释提示</strong>：${stronger}</div>`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  rawBtn.addEventListener('click', () => setView('raw'));
  rankBtn.addEventListener('click', () => setView('rank'));
  compute();
}

function renderCurveFit(el) {
  if (!ensureJStat(el)) return;
  const id = 'curvefit-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '曲线拟合比较';
  const defaultXs = el.dataset.xs || '1,2,3,4,5,6,7,8';
  const defaultYs = el.dataset.ys || '3.2,4.1,5.0,6.4,8.7,11.5,15.3,20.1';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">📉 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">比较线性、二次和对数拟合，帮助判断“非线性关系是否明显”。</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">X（逗号分隔）<br><input id="${id}-xs" type="text" value="${defaultXs}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">Y（逗号分隔）<br><input id="${id}-ys" type="text" value="${defaultYs}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-calc" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">更新拟合</button>
        <button id="${id}-linear" class="path-tab active" type="button">线性</button>
        <button id="${id}-quad" class="path-tab" type="button">二次</button>
        <button id="${id}-log" class="path-tab" type="button">对数</button>
      </div>
      <canvas id="${id}-canvas" width="620" height="360" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
    </div>`;

  const xsInput = document.getElementById(`${id}-xs`);
  const ysInput = document.getElementById(`${id}-ys`);
  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const result = document.getElementById(`${id}-result`);
  const linearBtn = document.getElementById(`${id}-linear`);
  const quadBtn = document.getElementById(`${id}-quad`);
  const logBtn = document.getElementById(`${id}-log`);
  let mode = 'linear';

  function setMode(next) {
    mode = next;
    linearBtn.classList.toggle('active', mode === 'linear');
    quadBtn.classList.toggle('active', mode === 'quadratic');
    logBtn.classList.toggle('active', mode === 'log');
    compute();
  }

  function draw(xs, ys, fit) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const pad = { left: 60, right: 20, top: 35, bottom: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys, ...fit.preds), yMax = Math.max(...ys, ...fit.preds);
    const xPad = (xMax - xMin) * 0.12 || 1;
    const yPad = (yMax - yMin) * 0.15 || 1;
    const sx = x => pad.left + ((x - (xMin - xPad)) / ((xMax - xMin) + 2 * xPad)) * plotW;
    const sy = y => pad.top + plotH - ((y - (yMin - yPad)) / ((yMax - yMin) + 2 * yPad)) * plotH;

    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('散点与拟合曲线', W / 2, 18);

    ctx.strokeStyle = 'rgba(128,128,128,0.15)';
    for (let i = 0; i <= 5; i++) {
      const x = pad.left + (plotW / 5) * i;
      const y = pad.top + (plotH / 5) * i;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    ctx.fillStyle = '#569cd6';
    xs.forEach((x, i) => {
      ctx.beginPath();
      ctx.arc(sx(x), sy(ys[i]), 4, 0, Math.PI * 2);
      ctx.fill();
    });

    const dense = [];
    const start = xMin - xPad;
    const end = xMax + xPad;
    for (let i = 0; i <= 120; i++) {
      const x = start + (end - start) * (i / 120);
      let y;
      if (fit.model === 'linear') y = fit.intercept + fit.slope * x;
      else if (fit.model === 'quadratic') y = fit.a + fit.b * x + fit.c * x * x;
      else y = fit.a + fit.b * Math.log(x);
      if (Number.isFinite(y)) dense.push({ x, y });
    }

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    dense.forEach((p, i) => {
      if (i === 0) ctx.moveTo(sx(p.x), sy(p.y));
      else ctx.lineTo(sx(p.x), sy(p.y));
    });
    ctx.stroke();
  }

  function compute() {
    const { xs, ys } = pairedXY(xsInput.value, ysInput.value);
    if (xs.length < 5) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">请至少提供 5 对有效数据。</div>';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const linear = linearFit(xs, ys);
    const quad = quadraticFit(xs, ys);
    const log = logFit(xs, ys);
    const metricsLinear = fitMetrics(ys, linear.preds);
    const metricsQuad = fitMetrics(ys, quad.preds);
    const metricsLog = log ? fitMetrics(ys, log.preds) : null;

    const current = mode === 'linear' ? linear : mode === 'quadratic' ? quad : (log || linear);
    const currentMetrics = mode === 'linear' ? metricsLinear : mode === 'quadratic' ? metricsQuad : (metricsLog || metricsLinear);
    draw(xs, ys, current);

    const candidates = [
      { name: '线性', metrics: metricsLinear },
      { name: '二次', metrics: metricsQuad },
      ...(metricsLog ? [{ name: '对数', metrics: metricsLog }] : [])
    ];
    candidates.sort((a, b) => b.metrics.r2 - a.metrics.r2);
    const best = candidates[0];

    let formula;
    if (current.model === 'linear') formula = `ŷ = ${current.intercept.toFixed(4)} + ${current.slope.toFixed(4)}x`;
    else if (current.model === 'quadratic') formula = `ŷ = ${current.a.toFixed(4)} + ${current.b.toFixed(4)}x + ${current.c.toFixed(4)}x²`;
    else formula = `ŷ = ${current.a.toFixed(4)} + ${current.b.toFixed(4)}ln(x)`;

    result.innerHTML = `
      <div><strong>当前模型</strong>：${current.model === 'linear' ? '线性' : current.model === 'quadratic' ? '二次' : '对数'}；<strong>方程</strong>：${formula}</div>
      <div><strong>R²</strong> = ${currentMetrics.r2.toFixed(4)}；<strong>RMSE</strong> = ${currentMetrics.rmse.toFixed(4)}；<strong>SSE</strong> = ${currentMetrics.sse.toFixed(4)}</div>
      <div><strong>模型比较</strong>：线性 R²=${metricsLinear.r2.toFixed(4)}，二次 R²=${metricsQuad.r2.toFixed(4)}${metricsLog ? `，对数 R²=${metricsLog.r2.toFixed(4)}` : '（对数模型因 X 含非正值未计算）'}</div>
      <div><strong>最佳拟合提示</strong>：当前这组数据里，${best.name}模型的拟合优度最高。</div>`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  linearBtn.addEventListener('click', () => setMode('linear'));
  quadBtn.addEventListener('click', () => setMode('quadratic'));
  logBtn.addEventListener('click', () => setMode('log'));
  compute();
}

registerViz('rankcorrelation', renderRankCorrelation);
registerViz('curvefit', renderCurveFit);

function injectChapter7Widgets() {
  const root = document.getElementById('chapter-content');
  if (!root) return;
  const title = root.querySelector('h1 .chapter-title');
  if (!title || !title.textContent.includes('双变量回归与相关')) return;

  const rankHeading = Array.from(root.querySelectorAll('h2, h3')).find(node => node.textContent.includes('秩相关'));
  if (rankHeading && !root.querySelector('.stat-calc[data-type="rankcorrelation"]')) {
    const note = document.createElement('p');
    note.textContent = '下方组件把 Pearson 线性相关和 Spearman 秩相关放在同一界面中比较，并支持切换到秩次视图，帮助区分“线性关系”和“单调关系”。';
    note.style.color = '#555';
    note.style.fontSize = '0.95em';
    const widget = document.createElement('div');
    widget.className = 'stat-calc';
    widget.dataset.type = 'rankcorrelation';
    widget.dataset.title = '秩相关与线性相关对比';
    widget.dataset.xs = '1,2,3,4,5,6,7,8';
    widget.dataset.ys = '2,3,5,4,6,7,9,8';
    rankHeading.insertAdjacentElement('afterend', note);
    note.insertAdjacentElement('afterend', widget);
  }

  const curveHeading = Array.from(root.querySelectorAll('h2, h3')).find(node => node.textContent.includes('曲线拟合'));
  if (curveHeading && !root.querySelector('.stat-calc[data-type="curvefit"]')) {
    const note = document.createElement('p');
    note.textContent = '下方组件用于比较不同曲线形式的拟合效果。它不是替代正式建模，而是帮助读者先直观看出：什么时候“直线”已经不够，什么时候需要考虑非线性。';
    note.style.color = '#555';
    note.style.fontSize = '0.95em';
    const widget = document.createElement('div');
    widget.className = 'stat-calc';
    widget.dataset.type = 'curvefit';
    widget.dataset.title = '曲线拟合比较';
    widget.dataset.xs = '1,2,3,4,5,6,7,8';
    widget.dataset.ys = '3.2,4.1,5.0,6.4,8.7,11.5,15.3,20.1';
    curveHeading.insertAdjacentElement('afterend', note);
    note.insertAdjacentElement('afterend', widget);
  }
}

function setupChapter7Injection() {
  injectChapter7Widgets();
  const root = document.getElementById('chapter-content');
  if (!root) return;
  const observer = new MutationObserver(() => injectChapter7Widgets());
  observer.observe(root, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupChapter7Injection, { once: true });
} else {
  setupChapter7Injection();
}
