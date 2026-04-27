import { registerViz } from './_core.js';

function poissonPMF(k, lambda) {
  if (!Number.isInteger(k) || k < 0 || lambda < 0) return 0;
  if (lambda === 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

function poissonPMFSeries(maxK, lambda) {
  const probs = new Array(maxK + 1).fill(0);
  if (lambda === 0) {
    probs[0] = 1;
    return probs;
  }
  probs[0] = Math.exp(-lambda);
  for (let k = 1; k <= maxK; k++) probs[k] = probs[k - 1] * lambda / k;
  return probs;
}

function poissonCDF(k, lambda) {
  if (k < 0) return 0;
  const kk = Math.floor(k);
  return Math.min(1, Math.max(0, poissonPMFSeries(kk, lambda).reduce((s, p) => s + p, 0)));
}

function poissonQuantile(prob, lambda) {
  if (lambda === 0) return 0;
  let k = 0;
  let p = Math.exp(-lambda);
  let cdf = p;
  const hardMax = Math.max(50, Math.ceil(lambda + 12 * Math.sqrt(lambda + 1)));
  while (cdf < prob && k < hardMax) {
    k += 1;
    p *= lambda / k;
    cdf += p;
  }
  return k;
}

function fmt(v, digits = 4) {
  return Number.isFinite(v) ? v.toFixed(digits) : '—';
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function renderPoissonDistributionFixed(el) {
  const id = 'poissondist-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '泊松分布 Poisson(λ)：单位观察量内事件数';
  const defaultLambda = clamp(parseFloat(el.dataset.lambda || el.dataset.rate || '4') || 4, 0, 50);
  const defaultK = clamp(parseInt(el.dataset.k || Math.round(defaultLambda), 10) || 0, 0, 120);

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header"><span>📊 ${title}</span><button id="${id}-reset" class="viz-reset" type="button" title="重置">↺</button></div>
      <canvas id="${id}-canvas" class="viz-canvas" width="640" height="310"></canvas>
      <div class="viz-sliders">
        <label>事件率/均数 λ = <span class="viz-val" id="${id}-lv">${defaultLambda.toFixed(1)}</span>
          <input id="${id}-lambda" type="range" min="0" max="50" step="0.1" value="${defaultLambda}">
        </label>
        <label>观察事件数 k = <span class="viz-val" id="${id}-kv">${defaultK}</span>
          <input id="${id}-k" type="range" min="0" max="120" step="1" value="${defaultK}">
        </label>
      </div>
      <div id="${id}-stats" class="viz-stats" style="line-height:1.7;"></div>
      <div style="font-size:12px;color:#64748b;text-align:center;margin-top:8px;">
        泊松分布中 E(X)=Var(X)=λ。拖动 λ 时会自动调整建议显示范围；阴影为 P(X≤k)，红柱为当前 k。
      </div>
    </div>`;

  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const lambdaInput = document.getElementById(`${id}-lambda`);
  const kInput = document.getElementById(`${id}-k`);
  const lambdaVal = document.getElementById(`${id}-lv`);
  const kVal = document.getElementById(`${id}-kv`);
  const stats = document.getElementById(`${id}-stats`);

  function displayMax(lambda, k) {
    const q = poissonQuantile(0.999, lambda);
    return Math.max(8, k, q, Math.ceil(lambda + 5 * Math.sqrt(lambda + 1)));
  }

  function syncAndDraw() {
    const lambda = clamp(parseFloat(lambdaInput.value) || 0, 0, 50);
    const suggestedMax = Math.min(120, Math.max(8, displayMax(lambda, 0)));
    kInput.max = String(suggestedMax);
    const k = clamp(parseInt(kInput.value, 10) || 0, 0, suggestedMax);
    lambdaInput.value = String(lambda);
    kInput.value = String(k);
    lambdaVal.textContent = lambda.toFixed(1);
    kVal.textContent = String(k);
    draw(lambda, k, suggestedMax);
  }

  function draw(lambda, k, maxK) {
    const W = canvas.width;
    const H = canvas.height;
    const pad = { l: 58, r: 28, t: 34, b: 48 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const probs = poissonPMFSeries(maxK, lambda);
    const maxProb = Math.max(...probs, 1e-12) * 1.15;
    const cdf = poissonCDF(k, lambda);
    const upper = 1 - poissonCDF(k - 1, lambda);
    const exact = poissonPMF(k, lambda);
    const sd = Math.sqrt(lambda);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(248,250,252,1)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`X ~ Poisson(${lambda.toFixed(1)})`, W / 2, 22);

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

    const barGap = maxK <= 60 ? 1.5 : 0.5;
    const barW = Math.max(1, plotW / (maxK + 1) - barGap);
    const sx = x => pad.l + (x / Math.max(1, maxK)) * plotW;
    const sy = p => pad.t + plotH - (p / maxProb) * plotH;

    probs.forEach((prob, x) => {
      const center = sx(x);
      const left = center - barW / 2;
      const y = sy(prob);
      ctx.fillStyle = x <= k ? '#16a085' : '#94a3b8';
      if (x === k) ctx.fillStyle = '#dc2626';
      ctx.fillRect(left, y, barW, pad.t + plotH - y);
    });

    const lambdaX = sx(Math.min(lambda, maxK));
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(lambdaX, pad.t);
    ctx.lineTo(lambdaX, pad.t + plotH);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#0f172a';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('均数 λ', clamp(lambdaX, pad.l + 30, W - pad.r - 30), pad.t + 14);

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
    const tickCount = Math.min(10, maxK);
    for (let i = 0; i <= tickCount; i++) {
      const x = Math.round((i / tickCount) * maxK);
      const px = sx(x);
      ctx.beginPath();
      ctx.moveTo(px, pad.t + plotH);
      ctx.lineTo(px, pad.t + plotH + 5);
      ctx.stroke();
      ctx.fillText(String(x), px, pad.t + plotH + 20);
    }
    ctx.fillText('事件数 x', pad.l + plotW / 2, H - 8);

    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const p = maxProb * (1 - i / 4);
      const y = pad.t + (i / 4) * plotH;
      ctx.fillText(p.toFixed(2), pad.l - 7, y + 4);
    }

    const tailNote = k > maxK ? '；k 超出显示范围' : '';
    stats.innerHTML = `
      <span><strong>均数 E(X)</strong> = λ = ${fmt(lambda, 2)}</span>
      <span><strong>方差 Var(X)</strong> = λ = ${fmt(lambda, 2)}；SD = ${fmt(sd, 2)}</span>
      <span><strong>P(X=${k})</strong> = ${fmt(exact, 4)}</span>
      <span><strong>P(X≤${k})</strong> = ${fmt(cdf, 4)}；<strong>P(X≥${k})</strong> = ${fmt(upper, 4)}${tailNote}</span>`;
  }

  lambdaInput.addEventListener('input', syncAndDraw);
  kInput.addEventListener('input', syncAndDraw);
  document.getElementById(`${id}-reset`).addEventListener('click', () => {
    lambdaInput.value = String(defaultLambda);
    kInput.value = String(defaultK);
    syncAndDraw();
  });

  syncAndDraw();
}

registerViz('poissondistfixed', renderPoissonDistributionFixed);
