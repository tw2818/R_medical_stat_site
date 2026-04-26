import { registerViz } from './_core.js';

function logChoose(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n) return -Infinity;
  const kk = Math.min(k, n - k);
  let s = 0;
  for (let i = 1; i <= kk; i++) s += Math.log(n - kk + i) - Math.log(i);
  return s;
}

function binomPMF(k, n, p) {
  if (k < 0 || k > n) return 0;
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

function pct(v, digits = 1) {
  return `${(100 * v).toFixed(digits)}%`;
}

function fmt(v, digits = 4) {
  return Number.isFinite(v) ? v.toFixed(digits) : '—';
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function renderBinomialDistributionFixed(el) {
  const id = 'binomdist-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '二项分布 B(n, p)：成功次数的分布';
  const defaultN = clamp(parseInt(el.dataset.n || '20', 10) || 20, 1, 200);
  const defaultP = clamp(parseFloat(el.dataset.p || '0.30') || 0.30, 0, 1);
  const defaultK = clamp(parseInt(el.dataset.k || Math.round(defaultN * defaultP), 10) || 0, 0, defaultN);

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header"><span>📊 ${title}</span><button id="${id}-reset" class="viz-reset" type="button" title="重置">↺</button></div>
      <canvas id="${id}-canvas" class="viz-canvas" width="640" height="310"></canvas>
      <div class="viz-sliders">
        <label>试验次数 n = <span class="viz-val" id="${id}-nv">${defaultN}</span>
          <input id="${id}-n" type="range" min="1" max="200" step="1" value="${defaultN}">
        </label>
        <label>成功概率 p = <span class="viz-val" id="${id}-pv">${defaultP.toFixed(2)}</span>
          <input id="${id}-p" type="range" min="0" max="1" step="0.01" value="${defaultP}">
        </label>
        <label>观察成功数 k = <span class="viz-val" id="${id}-kv">${defaultK}</span>
          <input id="${id}-k" type="range" min="0" max="${defaultN}" step="1" value="${defaultK}">
        </label>
      </div>
      <div id="${id}-stats" class="viz-stats" style="line-height:1.7;"></div>
      <div style="font-size:12px;color:#64748b;text-align:center;margin-top:8px;">
        拖动 n 时会自动同步 k 的最大值，保持 0 ≤ k ≤ n。柱高为 P(X = x)，阴影为 P(X ≤ k)。
      </div>
    </div>`;

  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const nInput = document.getElementById(`${id}-n`);
  const pInput = document.getElementById(`${id}-p`);
  const kInput = document.getElementById(`${id}-k`);
  const nVal = document.getElementById(`${id}-nv`);
  const pVal = document.getElementById(`${id}-pv`);
  const kVal = document.getElementById(`${id}-kv`);
  const stats = document.getElementById(`${id}-stats`);

  function syncAndDraw() {
    const n = clamp(parseInt(nInput.value, 10) || 1, 1, 200);
    const p = clamp(parseFloat(pInput.value) || 0, 0, 1);
    let k = clamp(parseInt(kInput.value, 10) || 0, 0, n);

    nInput.value = String(n);
    pInput.value = String(p);
    kInput.max = String(n);
    kInput.value = String(k);

    nVal.textContent = String(n);
    pVal.textContent = p.toFixed(2);
    kVal.textContent = String(k);

    draw(n, p, k);
  }

  function draw(n, p, k) {
    const W = canvas.width;
    const H = canvas.height;
    const pad = { l: 56, r: 28, t: 34, b: 48 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const probs = Array.from({ length: n + 1 }, (_, x) => binomPMF(x, n, p));
    const maxProb = Math.max(...probs, 1e-12) * 1.15;
    const mean = n * p;
    const variance = n * p * (1 - p);
    const sd = Math.sqrt(variance);
    const cdf = binomCDF(k, n, p);
    const upper = 1 - binomCDF(k - 1, n, p);
    const exact = binomPMF(k, n, p);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(248,250,252,1)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`X ~ B(${n}, ${p.toFixed(2)})`, W / 2, 22);

    ctx.strokeStyle = 'rgba(100,116,139,.24)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + plotH);
    ctx.lineTo(W - pad.r, pad.t + plotH);
    ctx.stroke();

    const barGap = n <= 60 ? 1.5 : 0.5;
    const barW = Math.max(1, plotW / (n + 1) - barGap);
    const sx = x => pad.l + (x / Math.max(1, n)) * plotW;
    const sy = prob => pad.t + plotH - (prob / maxProb) * plotH;

    probs.forEach((prob, x) => {
      const center = sx(x);
      const left = center - barW / 2;
      const y = sy(prob);
      ctx.fillStyle = x <= k ? '#2563eb' : '#94a3b8';
      if (x === k) ctx.fillStyle = '#dc2626';
      ctx.fillRect(left, y, barW, pad.t + plotH - y);
    });

    // Mean reference line
    const meanX = sx(mean);
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(meanX, pad.t);
    ctx.lineTo(meanX, pad.t + plotH);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#0f172a';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('均数 np', clamp(meanX, pad.l + 30, W - pad.r - 30), pad.t + 14);

    // Selected k line
    const kX = sx(k);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(kX, pad.t);
    ctx.lineTo(kX, pad.t + plotH + 4);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    const tickCount = Math.min(10, n);
    for (let i = 0; i <= tickCount; i++) {
      const x = Math.round((i / tickCount) * n);
      const px = sx(x);
      ctx.beginPath();
      ctx.moveTo(px, pad.t + plotH);
      ctx.lineTo(px, pad.t + plotH + 5);
      ctx.stroke();
      ctx.fillText(String(x), px, pad.t + plotH + 20);
    }
    ctx.fillText('成功次数 x', pad.l + plotW / 2, H - 8);

    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const prob = maxProb * (1 - i / 4);
      const y = pad.t + (i / 4) * plotH;
      ctx.fillText(prob.toFixed(2), pad.l - 7, y + 4);
    }

    stats.innerHTML = `
      <span><strong>均数 E(X)</strong> = np = ${fmt(mean, 2)}</span>
      <span><strong>方差 Var(X)</strong> = np(1-p) = ${fmt(variance, 2)}；SD = ${fmt(sd, 2)}</span>
      <span><strong>P(X=${k})</strong> = ${fmt(exact, 4)}</span>
      <span><strong>P(X≤${k})</strong> = ${fmt(cdf, 4)}；<strong>P(X≥${k})</strong> = ${fmt(upper, 4)}</span>`;
  }

  nInput.addEventListener('input', syncAndDraw);
  pInput.addEventListener('input', syncAndDraw);
  kInput.addEventListener('input', syncAndDraw);
  document.getElementById(`${id}-reset`).addEventListener('click', () => {
    nInput.value = String(defaultN);
    pInput.value = String(defaultP);
    kInput.max = String(defaultN);
    kInput.value = String(defaultK);
    syncAndDraw();
  });

  syncAndDraw();
}

registerViz('binomialdistfixed', renderBinomialDistributionFixed);
registerViz('binomdistfixed', renderBinomialDistributionFixed);
