import { registerViz } from './_core.js';

function normalInv975(conf = 0.95) {
  if (window.jStat?.normal?.inv) return window.jStat.normal.inv(0.5 + conf / 2, 0, 1);
  if (Math.abs(conf - 0.99) < 1e-9) return 2.575829;
  if (Math.abs(conf - 0.90) < 1e-9) return 1.644854;
  return 1.959964;
}

function logChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  k = Math.min(k, n - k);
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}

function binomPMF(k, n, p) {
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
}

function binomCDF(k, n, p) {
  if (k < 0) return 0;
  if (k >= n) return 1;
  let s = 0;
  for (let i = 0; i <= k; i++) s += binomPMF(i, n, p);
  return Math.min(1, Math.max(0, s));
}

function betaInvFallback(q, a, b) {
  // Fallback via the beta/binomial identity:
  // I_x(a,b) = P(Y >= a), Y ~ Binomial(a+b-1, x), for positive integer a and b.
  let lo = 0;
  let hi = 1;
  for (let iter = 0; iter < 70; iter++) {
    const mid = (lo + hi) / 2;
    const n = a + b - 1;
    const betaCdf = 1 - binomCDF(a - 1, n, mid);
    if (betaCdf < q) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function betaInv(q, a, b) {
  if (window.jStat?.beta?.inv) return window.jStat.beta.inv(q, a, b);
  return betaInvFallback(q, a, b);
}

function clopperPearson(x, n, alpha) {
  if (x === 0) return [0, 1 - Math.pow(alpha / 2, 1 / n)];
  if (x === n) return [Math.pow(alpha / 2, 1 / n), 1];
  return [betaInv(alpha / 2, x, n - x + 1), betaInv(1 - alpha / 2, x + 1, n - x)];
}

function normalApproxCI(x, n, z) {
  const p = x / n;
  const se = Math.sqrt(p * (1 - p) / n);
  return [Math.max(0, p - z * se), Math.min(1, p + z * se)];
}

function pct(v) {
  return `${(100 * v).toFixed(1)}%`;
}

function renderBinomialCIFixed(el) {
  const id = 'binom-ci-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '二项分布置信区间 — Clopper-Pearson 精确区间 & 正态近似';
  const initialN = Math.max(1, Math.min(300, parseInt(el.dataset.n || '20', 10) || 20));
  const initialX = Math.max(0, Math.min(initialN, parseInt(el.dataset.x || '2', 10) || 2));
  const initialConf = Math.max(0.80, Math.min(0.99, parseFloat(el.dataset.conf || '0.95') || 0.95));

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header"><span>📊 ${title}</span><button id="${id}-reset" class="viz-reset" type="button" title="重置">↺</button></div>
      <canvas id="${id}-canvas" class="viz-canvas" width="640" height="285"></canvas>
      <div class="viz-sliders">
        <label>阳性数 x = <span class="viz-val" id="${id}-xv">${initialX}</span>
          <input id="${id}-x" type="range" min="0" max="${initialN}" step="1" value="${initialX}">
        </label>
        <label>样本量 n = <span class="viz-val" id="${id}-nv">${initialN}</span>
          <input id="${id}-n" type="range" min="1" max="300" step="1" value="${initialN}">
        </label>
        <label>置信水平 = <span class="viz-val" id="${id}-cv">${pct(initialConf)}</span>
          <input id="${id}-conf" type="range" min="0.80" max="0.99" step="0.01" value="${initialConf}">
        </label>
      </div>
      <div id="${id}-stats" class="viz-stats" style="line-height:1.7;"></div>
      <div style="font-size:12px;color:#64748b;text-align:center;margin-top:8px;">
        拖动 n 时会自动约束 x ≤ n；x = 0 或 x = n 时仅精确区间能给出合理边界，正态近似会退化。
      </div>
    </div>`;

  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const xInput = document.getElementById(`${id}-x`);
  const nInput = document.getElementById(`${id}-n`);
  const confInput = document.getElementById(`${id}-conf`);
  const xVal = document.getElementById(`${id}-xv`);
  const nVal = document.getElementById(`${id}-nv`);
  const cVal = document.getElementById(`${id}-cv`);
  const stats = document.getElementById(`${id}-stats`);

  function syncFromInputs() {
    let n = Math.max(1, parseInt(nInput.value, 10) || 1);
    let x = Math.max(0, parseInt(xInput.value, 10) || 0);
    if (x > n) x = n;
    xInput.max = String(n);
    xInput.value = String(x);
    nInput.value = String(n);
    xVal.textContent = String(x);
    nVal.textContent = String(n);
    const conf = Math.max(0.80, Math.min(0.99, parseFloat(confInput.value) || 0.95));
    cVal.textContent = pct(conf);
    draw(x, n, conf);
  }

  function drawAxis(pad, W, H) {
    const y = H - pad.b;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(W - pad.r, y);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const p = i / 5;
      const x = pad.l + p * (W - pad.l - pad.r);
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
      ctx.fillText(pct(p), x, y + 18);
    }
  }

  function drawInterval(label, lo, hi, y, color, sx) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(lo), y);
    ctx.lineTo(sx(hi), y);
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = color;
    [lo, hi].forEach(v => {
      ctx.beginPath();
      ctx.arc(sx(v), y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(label, sx(0) - 12, y + 4);
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`[${pct(lo)}, ${pct(hi)}]`, sx(hi) + 8, y + 4);
  }

  function draw(x, n, conf) {
    const W = canvas.width, H = canvas.height;
    const pad = { l: 125, r: 110, t: 36, b: 44 };
    const alpha = 1 - conf;
    const z = normalInv975(conf);
    const pHat = x / n;
    const exact = clopperPearson(x, n, alpha);
    const normal = normalApproxCI(x, n, z);
    const sx = p => pad.l + p * (W - pad.l - pad.r);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(248,250,252,1)';
    ctx.fillRect(0, 0, W, H);

    drawAxis(pad, W, H);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`样本率 p̂ = ${x}/${n} = ${pct(pHat)}`, W / 2, 22);

    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx(pHat), pad.t + 10);
    ctx.lineTo(sx(pHat), H - pad.b + 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('p̂', sx(pHat), pad.t + 4);

    drawInterval('精确区间', exact[0], exact[1], 100, '#2563eb', sx);
    drawInterval('正态近似', normal[0], normal[1], 166, '#dc2626', sx);

    const degenerate = x === 0 || x === n;
    stats.innerHTML = `
      <span><strong>x</strong> = ${x}, <strong>n</strong> = ${n}, <strong>p̂</strong> = ${pHat.toFixed(4)}</span>
      <span><strong>${pct(conf)} Clopper-Pearson</strong>: [${exact[0].toFixed(4)}, ${exact[1].toFixed(4)}]</span>
      <span><strong>正态近似</strong>: [${normal[0].toFixed(4)}, ${normal[1].toFixed(4)}]${degenerate ? '；边界样本下近似区间会退化' : ''}</span>`;
  }

  xInput.addEventListener('input', syncFromInputs);
  nInput.addEventListener('input', syncFromInputs);
  confInput.addEventListener('input', syncFromInputs);
  document.getElementById(`${id}-reset`).addEventListener('click', () => {
    nInput.value = String(initialN);
    xInput.max = String(initialN);
    xInput.value = String(initialX);
    confInput.value = String(initialConf);
    syncFromInputs();
  });

  syncFromInputs();
}

registerViz('binomialcifixed', renderBinomialCIFixed);
