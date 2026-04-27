import { registerViz } from './_core.js';

function logGamma(z) {
  const coeff = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < coeff.length; i++) x += coeff[i] / (z + i + 1);
  const t = z + coeff.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function regularizedGammaP(a, x) {
  if (x <= 0) return 0;
  if (a <= 0) return NaN;
  const gln = logGamma(a);

  if (x < a + 1) {
    let ap = a;
    let del = 1 / a;
    let sum = del;
    for (let n = 1; n <= 120; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-13) break;
    }
    return Math.min(1, Math.max(0, sum * Math.exp(-x + a * Math.log(x) - gln)));
  }

  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 120; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-13) break;
  }
  return Math.min(1, Math.max(0, 1 - Math.exp(-x + a * Math.log(x) - gln) * h));
}

function chiSquareCDF(x, df) {
  if (window.jStat?.chisquare?.cdf) return window.jStat.chisquare.cdf(x, df);
  return regularizedGammaP(df / 2, x / 2);
}

function chiSquareInv(p, df) {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  if (window.jStat?.chisquare?.inv) return window.jStat.chisquare.inv(p, df);

  let lo = 0;
  let hi = Math.max(1, df + 10 * Math.sqrt(2 * df) + 20);
  while (chiSquareCDF(hi, df) < p && hi < 1e8) hi *= 2;
  for (let i = 0; i < 90; i++) {
    const mid = (lo + hi) / 2;
    if (chiSquareCDF(mid, df) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function inverseNormal(p) {
  if (window.jStat?.normal?.inv) return window.jStat.normal.inv(p, 0, 1);
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425;
  const phigh = 1 - plow;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function garwoodRateCI(x, exposure, alpha) {
  const lo = x === 0 ? 0 : 0.5 * chiSquareInv(alpha / 2, 2 * x) / exposure;
  const hi = 0.5 * chiSquareInv(1 - alpha / 2, 2 * (x + 1)) / exposure;
  return [lo, hi];
}

function normalRateCI(x, exposure, z) {
  const rate = x / exposure;
  const se = Math.sqrt(x) / exposure;
  return [Math.max(0, rate - z * se), rate + z * se];
}

function fmt(v, digits = 4) {
  return Number.isFinite(v) ? v.toFixed(digits) : '—';
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function pct(v) {
  return `${(100 * v).toFixed(0)}%`;
}

function renderPoissonCIFixed(el) {
  const id = 'poisson-ci-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '泊松分布置信区间 — Garwood 精确区间 & 正态近似';
  const initialX = clamp(parseInt(el.dataset.x || '68', 10) || 0, 0, 500);
  const initialExposure = clamp(parseFloat(el.dataset.exposure || el.dataset.t || '1') || 1, 0.1, 1000);
  const initialConf = clamp(parseFloat(el.dataset.conf || '0.99') || 0.99, 0.80, 0.99);

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header"><span>📊 ${title}</span><button id="${id}-reset" class="viz-reset" type="button" title="重置">↺</button></div>
      <canvas id="${id}-canvas" class="viz-canvas" width="640" height="285"></canvas>
      <div class="viz-sliders">
        <label>事件数 x = <span class="viz-val" id="${id}-xv">${initialX}</span>
          <input id="${id}-x" type="range" min="0" max="500" step="1" value="${initialX}">
        </label>
        <label>观察量 T = <span class="viz-val" id="${id}-tv">${initialExposure.toFixed(1)}</span>
          <input id="${id}-t" type="range" min="0.1" max="1000" step="0.1" value="${initialExposure}">
        </label>
        <label>置信水平 = <span class="viz-val" id="${id}-cv">${pct(initialConf)}</span>
          <input id="${id}-conf" type="range" min="0.80" max="0.99" step="0.01" value="${initialConf}">
        </label>
      </div>
      <div id="${id}-stats" class="viz-stats" style="line-height:1.7;"></div>
      <div style="font-size:12px;color:#64748b;text-align:center;margin-top:8px;">
        T=1 时区间就是泊松均数 λ 的区间；T 为人年、时间或面积时，区间表示单位观察量事件率。x=0 时正态近似会退化，Garwood 精确区间仍有上限。
      </div>
    </div>`;

  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const xInput = document.getElementById(`${id}-x`);
  const tInput = document.getElementById(`${id}-t`);
  const confInput = document.getElementById(`${id}-conf`);
  const xVal = document.getElementById(`${id}-xv`);
  const tVal = document.getElementById(`${id}-tv`);
  const cVal = document.getElementById(`${id}-cv`);
  const stats = document.getElementById(`${id}-stats`);

  function syncAndDraw() {
    const x = clamp(parseInt(xInput.value, 10) || 0, 0, 500);
    const exposure = clamp(parseFloat(tInput.value) || 1, 0.1, 1000);
    const conf = clamp(parseFloat(confInput.value) || 0.95, 0.80, 0.99);
    xInput.value = String(x);
    tInput.value = String(exposure);
    confInput.value = String(conf);
    xVal.textContent = String(x);
    tVal.textContent = exposure.toFixed(1);
    cVal.textContent = pct(conf);
    draw(x, exposure, conf);
  }

  function drawAxis(pad, W, H, maxX) {
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
      const value = maxX * i / 5;
      const x = pad.l + (value / maxX) * (W - pad.l - pad.r);
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
      ctx.fillText(value.toFixed(maxX < 10 ? 1 : 0), x, y + 18);
    }
  }

  function drawInterval(label, lo, hi, y, color, sx, W) {
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
    const text = `[${fmt(lo, 3)}, ${fmt(hi, 3)}]`;
    ctx.font = '12px sans-serif';
    if (sx(hi) + 10 + ctx.measureText(text).width > W - 6) {
      ctx.textAlign = 'right';
      ctx.fillText(text, W - 8, y + 4);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(text, sx(hi) + 8, y + 4);
    }
  }

  function draw(x, exposure, conf) {
    const W = canvas.width;
    const H = canvas.height;
    const pad = { l: 125, r: 112, t: 36, b: 44 };
    const alpha = 1 - conf;
    const z = inverseNormal(0.5 + conf / 2);
    const rate = x / exposure;
    const exact = garwoodRateCI(x, exposure, alpha);
    const normal = normalRateCI(x, exposure, z);
    const maxX = Math.max(exact[1], normal[1], rate, 1e-8) * 1.15;
    const sx = v => pad.l + (v / maxX) * (W - pad.l - pad.r);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(248,250,252,1)';
    ctx.fillRect(0, 0, W, H);

    drawAxis(pad, W, H, maxX);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`观察事件率 = ${x}/${fmt(exposure, 1)} = ${fmt(rate, 3)}`, W / 2, 22);

    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx(rate), pad.t + 10);
    ctx.lineTo(sx(rate), H - pad.b + 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('估计值', sx(rate), pad.t + 4);

    drawInterval('精确区间', exact[0], exact[1], 100, '#2563eb', sx, W);
    drawInterval('正态近似', normal[0], normal[1], 166, '#dc2626', sx, W);

    const degenerate = x === 0;
    stats.innerHTML = `
      <span><strong>x</strong> = ${x}, <strong>T</strong> = ${fmt(exposure, 1)}, <strong>估计率</strong> = ${fmt(rate, 4)}</span>
      <span><strong>${pct(conf)} Garwood 精确区间</strong>: [${fmt(exact[0], 4)}, ${fmt(exact[1], 4)}]</span>
      <span><strong>正态近似区间</strong>: [${fmt(normal[0], 4)}, ${fmt(normal[1], 4)}]${degenerate ? '；x=0 时正态近似退化为 0' : ''}</span>`;
  }

  xInput.addEventListener('input', syncAndDraw);
  tInput.addEventListener('input', syncAndDraw);
  confInput.addEventListener('input', syncAndDraw);
  document.getElementById(`${id}-reset`).addEventListener('click', () => {
    xInput.value = String(initialX);
    tInput.value = String(initialExposure);
    confInput.value = String(initialConf);
    syncAndDraw();
  });

  syncAndDraw();
}

registerViz('poissoncifixed', renderPoissonCIFixed);
