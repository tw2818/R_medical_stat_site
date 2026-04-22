import { registerViz, ensureJStat } from './_core.js';

// ==========================================================
// DISTRIBUTIONS - 统计可视化模块
// ==========================================================

// ============================================================
// DISTRIBUTIONS - 统计可视化模块
// ============================================================

  function renderNormalDistribution(el) {
    const mu = parseFloat(el.dataset.mu || '0');
    const sigma = parseFloat(el.dataset.sigma || '1');
    const W = 600, H = 280;

    const card = document.createElement('div');
    card.className = 'viz-card';
    card.innerHTML = `
      <div class="viz-header"><span>📈 正态分布 N(μ, σ²)</span><button class="viz-reset" title="重置">↺</button></div>
      <canvas class="viz-canvas" width="${W}" height="${H}"></canvas>
      <div class="viz-sliders">
        <label>μ = <span class="viz-val" data-for="mu">${mu.toFixed(1)}</span>
          <input type="range" class="viz-slider" data-param="mu" min="-5" max="5" step="0.1" value="${mu}">
        </label>
        <label>σ = <span class="viz-val" data-for="sigma">${sigma.toFixed(1)}</span>
          <input type="range" class="viz-slider" data-param="sigma" min="0.5" max="5" step="0.1" value="${sigma}">
        </label>
      </div>
      <div class="viz-stats">
        <span>阴影图例：<strong style="color:#f9826c;">±1σ</strong> / <strong style="color:#c26b5b;">±2σ</strong></span>
        <span>P(μ-σ &lt; X &lt; μ+σ) = <strong data-stat="p1">68.3%</strong></span>
        <span>P(μ-2σ &lt; X &lt; μ+2σ) = <strong data-stat="p2">95.5%</strong></span>
      </div>
    `;
    el.appendChild(card);

    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const p1El = card.querySelector('[data-stat="p1"]');
    const p2El = card.querySelector('[data-stat="p2"]');

    function pdf(x, mu, sigma) {
      return Math.exp(-0.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
    }

    function draw(muV, sigmaV) {
      ctx.clearRect(0, 0, W, H);

      const cdf = x => window.jStat?.normal?.cdf ? window.jStat.normal.cdf(x, muV, sigmaV) : null;
      const p1 = cdf(muV + sigmaV) !== null ? cdf(muV + sigmaV) - cdf(muV - sigmaV) : 0.6827;
      const p2 = cdf(muV + 2 * sigmaV) !== null ? cdf(muV + 2 * sigmaV) - cdf(muV - 2 * sigmaV) : 0.9545;
      if (p1El) p1El.textContent = `${(p1 * 100).toFixed(1)}%`;
      if (p2El) p2El.textContent = `${(p2 * 100).toFixed(1)}%`;

      // 背景
      ctx.fillStyle = 'rgba(30,30,30,0.03)';
      ctx.fillRect(0, 0, W, H);

      // 坐标映射
      const xMin = muV - 4 * sigmaV;
      const xMax = muV + 4 * sigmaV;
      const yMax = pdf(muV, muV, sigmaV) * 1.15;
      const baselineY = H - 20;
      const oneSigmaLeft = muV - sigmaV;
      const oneSigmaRight = muV + sigmaV;
      const twoSigmaLeft = muV - 2 * sigmaV;
      const twoSigmaRight = muV + 2 * sigmaV;

      const sx = x => (x - xMin) / (xMax - xMin) * W;
      const sy = y => baselineY - (y / yMax) * H * 0.85;

      // 网格
      ctx.strokeStyle = 'rgba(128,128,128,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = Math.ceil(xMin); x <= xMax; x += sigmaV) {
        const cx = sx(x);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
      }
      ctx.stroke();

      // x 轴刻度
      const tickDefs = [
        { value: twoSigmaLeft, label: (muV - 2 * sigmaV).toFixed(1) },
        { value: oneSigmaLeft, label: (muV - sigmaV).toFixed(1) },
        { value: muV, label: muV.toFixed(1) },
        { value: oneSigmaRight, label: (muV + sigmaV).toFixed(1) },
        { value: twoSigmaRight, label: (muV + 2 * sigmaV).toFixed(1) },
      ];
      ctx.fillStyle = '#666';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      tickDefs.forEach(({ value, label }) => {
        const cx = sx(value);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(90,90,90,0.35)';
        ctx.moveTo(cx, baselineY - 4);
        ctx.lineTo(cx, baselineY + 4);
        ctx.stroke();
        ctx.fillText(label, cx, H - 4);
      });

      // 先填充整条曲线下方的浅色面积
      ctx.beginPath();
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        const y = pdf(x, muV, sigmaV);
        const cy = sy(y);
        px === 0 ? ctx.moveTo(px, cy) : ctx.lineTo(px, cy);
      }
      ctx.lineTo(W, baselineY);
      ctx.lineTo(0, baselineY);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(86,156,214,0.22)');
      grad.addColorStop(1, 'rgba(86,156,214,0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      const fillBand = (left, right, color) => {
        ctx.beginPath();
        ctx.moveTo(sx(left), baselineY);
        let started = false;
        for (let px = 0; px <= W; px++) {
          const x = xMin + (px / W) * (xMax - xMin);
          if (x < left || x > right) continue;
          const y = pdf(x, muV, sigmaV);
          const cx = sx(x), cy = sy(y);
          if (!started) {
            ctx.lineTo(cx, cy);
            started = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        }
        ctx.lineTo(sx(right), baselineY);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };

      // 先画 ±2σ，再画 ±1σ
      fillBand(twoSigmaLeft, twoSigmaRight, 'rgba(194,107,91,0.12)');
      fillBand(oneSigmaLeft, oneSigmaRight, 'rgba(249,130,108,0.22)');

      // 曲线
      ctx.beginPath();
      ctx.strokeStyle = '#569cd6';
      ctx.lineWidth = 2.5;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        const y = pdf(x, muV, sigmaV);
        const cy = sy(y);
        px === 0 ? ctx.moveTo(px, cy) : ctx.lineTo(px, cy);
      }
      ctx.stroke();

      // μ 线
      const mx = sx(muV);
      ctx.strokeStyle = '#f9826c';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f9826c';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillText('μ', mx + 4, 16);

      // ±1σ 边界线 + 拐点
      [oneSigmaLeft, oneSigmaRight].forEach((xVal, idx) => {
        const cx = sx(xVal);
        const cy = sy(pdf(xVal, muV, sigmaV));
        ctx.strokeStyle = 'rgba(249,130,108,0.7)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(249,130,108,0.9)';
        ctx.fillText(idx === 0 ? 'μ-σ' : 'μ+σ', cx + 4, 32 + idx * 14);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    draw(mu, sigma);

    // 交互
    card.querySelectorAll('.viz-slider').forEach(slider => {
      slider.addEventListener('input', () => {
        const param = slider.dataset.param;
        const val = parseFloat(slider.value);
        card.querySelector(`[data-for="${param}"]`).textContent = val.toFixed(1);
        const muV = parseFloat(card.querySelector('[data-param="mu"]').value);
        const sigmaV = parseFloat(card.querySelector('[data-param="sigma"]').value);
        draw(muV, sigmaV);
      });
    });

    card.querySelector('.viz-reset').addEventListener('click', () => {
      card.querySelector('[data-param="mu"]').value = mu;
      card.querySelector('[data-param="sigma"]').value = sigma;
      card.querySelector('[data-for="mu"]').textContent = mu.toFixed(1);
      card.querySelector('[data-for="sigma"]').textContent = sigma.toFixed(1);
      draw(mu, sigma);
    });
  }
registerViz('normal', renderNormalDistribution);

  // ── t 分布对比器 ───────────────────────────────────
  // <div class="stat-viz" data-type="tcompare"></div>

  function renderTCompare(el) {
    const W = 600, H = 280;
    const initialDf = 10;
    const card = document.createElement('div');
    card.className = 'viz-card';
    card.innerHTML = `
      <div class="viz-header"><span>📈 正态分布 vs t 分布</span><button class="viz-reset" title="重置">↺</button></div>
      <canvas class="viz-canvas" width="${W}" height="${H}"></canvas>
      <div class="viz-sliders">
        <label>自由度 df = <span class="viz-val" data-for="df">${initialDf}</span>
          <input type="range" class="viz-slider" data-param="df" min="1" max="100" step="1" value="${initialDf}">
        </label>
      </div>
      <div class="viz-legend">
        <span class="legend-item" style="border-color:#569cd6">— 标准正态 N(0,1)</span>
        <span class="legend-item" style="border-color:#c586c0">— t 分布</span>
      </div>
      <div class="viz-stats">
        <span>尾部差异：<strong data-stat="tail">—</strong></span>
        <span>提示：df 越小，t 分布尾部越厚、峰越低</span>
      </div>
    `;
    el.appendChild(card);
    if (!ensureJStat(el)) return;
    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const tailEl = card.querySelector('[data-stat="tail"]');
    function normalPDF(x) {
      return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    }

    function draw(df) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(30,30,30,0.03)';
      ctx.fillRect(0, 0, W, H);

      const xMin = -4, xMax = 4;
      const baselineY = H - 20;

      let tPdf;
      if (window.jStat && window.jStat.studentt) {
        tPdf = x => window.jStat.studentt.pdf(x, df);
      } else {
        function logGammaStirling(z) {
          if (z <= 0) return 0;
          return (z - 0.5) * Math.log(z) - z + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * z) - 1 / (360 * z * z * z);
        }
        tPdf = x => {
          const c = Math.pow(1 + x * x / df, -(df + 1) / 2);
          const lg1 = logGammaStirling(df / 2 + 0.5);
          const lg2 = 0.5 * Math.log(Math.PI);
          const lg3 = logGammaStirling(df / 2 + 1);
          return c * Math.exp(lg1 + lg2 - lg3) / Math.sqrt(df * Math.PI);
        };
      }

      const maxY = Math.max(normalPDF(0), tPdf(0)) * 1.2;
      const sx = x => (x - xMin) / (xMax - xMin) * W;
      const sy = y => baselineY - (y / maxY) * H * 0.8;

      ctx.strokeStyle = 'rgba(128,128,128,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let tick = -3; tick <= 3; tick += 1) {
        const cx = sx(tick);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, H);
      }
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      for (let tick = -3; tick <= 3; tick += 1) {
        const cx = sx(tick);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(90,90,90,0.35)';
        ctx.moveTo(cx, baselineY - 4);
        ctx.lineTo(cx, baselineY + 4);
        ctx.stroke();
        ctx.fillText(String(tick), cx, H - 4);
      }

      const fillCurve = (fn, colorStops) => {
        ctx.beginPath();
        for (let px = 0; px <= W; px++) {
          const x = xMin + (px / W) * (xMax - xMin);
          const y = fn(x);
          px === 0 ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
        }
        ctx.lineTo(W, baselineY);
        ctx.lineTo(0, baselineY);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        colorStops.forEach(([stop, color]) => grad.addColorStop(stop, color));
        ctx.fillStyle = grad;
        ctx.fill();
      };

      fillCurve(tPdf, [[0, 'rgba(197,133,192,0.15)'], [1, 'rgba(197,133,192,0.02)']]);

      ctx.beginPath();
      ctx.strokeStyle = '#569cd6';
      ctx.lineWidth = 2;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        const y = normalPDF(x);
        px === 0 ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#c586c0';
      ctx.lineWidth = 2.2;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        const y = tPdf(x);
        px === 0 ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
      }
      ctx.stroke();

      const tailNormal = window.jStat?.normal?.cdf ? 2 * (1 - window.jStat.normal.cdf(2, 0, 1)) : 0.0455;
      const tailT = window.jStat?.studentt?.cdf ? 2 * (1 - window.jStat.studentt.cdf(2, df)) : null;
      if (tailEl) {
        tailEl.textContent = tailT !== null
          ? `|x|>2 时：t=${(tailT * 100).toFixed(2)}%，正态=${(tailNormal * 100).toFixed(2)}%`
          : 'jStat 未加载，无法动态计算尾部概率';
      }
    }

    draw(initialDf);

    card.querySelector('.viz-slider').addEventListener('input', () => {
      const df = parseInt(card.querySelector('[data-param="df"]').value, 10);
      card.querySelector('[data-for="df"]').textContent = df;
      draw(df);
    });

    card.querySelector('.viz-reset').addEventListener('click', () => {
      card.querySelector('[data-param="df"]').value = initialDf;
      card.querySelector('[data-for="df"]').textContent = initialDf;
      draw(initialDf);
    });
  }
registerViz('tcompare', renderTCompare);

  // ── P 值可视化 ─────────────────────────────────────
  // <div class="stat-viz" data-type="pvalue" data-df="35"></div>

  function renderPValue(el) {
    const df = parseInt(el.dataset.df || '35', 10);
    const initialT = parseFloat(el.dataset.tstat || '2.14');
    const W = 600, H = 280;
    const card = document.createElement('div');
    card.className = 'viz-card';
    card.innerHTML = `
      <div class="viz-header"><span>🎯 P 值可视化（t 分布）</span><button class="viz-reset" title="重置">↺</button></div>
      <canvas class="viz-canvas" width="${W}" height="${H}"></canvas>
      <div class="viz-sliders">
        <label>t 统计量 = <span class="viz-val" data-for="t">${initialT.toFixed(2)}</span>
          <input type="range" class="viz-slider" data-param="t" min="-6" max="6" step="0.01" value="${initialT}">
        </label>
      </div>
      <div class="viz-pvalue-display">
        <div class="pvalue-result">
          <span class="pvalue-label">双侧 P 值 = </span>
          <span class="pvalue-num" data-pvalue>—</span>
        </div>
        <div class="pvalue-result">
          <span class="pvalue-label">单侧 P 值 = </span>
          <span class="pvalue-num-side" data-pvalue-side>—</span>
        </div>
        <div class="pvalue-interpretation" data-interp></div>
      </div>
    `;
    el.appendChild(card);
    if (!ensureJStat(el)) return;

    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    function tPdf(x, df) {
      if (window.jStat && window.jStat.studentt) return window.jStat.studentt.pdf(x, df);
      return Math.exp(-(df + 1) / 2 * Math.log(1 + x * x / df)) / Math.sqrt(df * Math.PI);
    }

    function tCdf(x, df) {
      if (window.jStat && window.jStat.studentt) return window.jStat.studentt.cdf(x, df);
      return 0.5 * (1 + _erf(x / Math.sqrt(2)));
    }

    function _erf(x) {
      const t = 1 / (1 + 0.5 * Math.abs(x));
      const tau = t * Math.exp(-x * x - 1.26551223 +
        t * (1.00002368 +
        t * (0.37409196 +
        t * (0.09678418 +
        t * (-0.18628806 +
        t * (0.27886807 +
        t * (-1.13520398 +
        t * (1.48851587 +
        t * (-0.82215223 +
        t * 0.17087277)))))))));
      return x >= 0 ? 1 - tau : tau - 1;
    }

    function drawTail(left, right, color, xMin, xMax, baselineY, sy) {
      ctx.beginPath();
      ctx.moveTo(left === xMin ? 0 : (left - xMin) / (xMax - xMin) * W, baselineY);
      let started = false;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        if (x < left || x > right) continue;
        const y = tPdf(x, df);
        if (!started) {
          ctx.lineTo(px, sy(y));
          started = true;
        } else {
          ctx.lineTo(px, sy(y));
        }
      }
      const endX = (right - xMin) / (xMax - xMin) * W;
      ctx.lineTo(endX, baselineY);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function draw(tStat) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(30,30,30,0.03)';
      ctx.fillRect(0, 0, W, H);

      const xMin = -6, xMax = 6;
      const baselineY = H - 20;
      const maxY = tPdf(0, df) * 1.2;
      const sx = x => (x - xMin) / (xMax - xMin) * W;
      const sy = y => baselineY - (y / maxY) * H * 0.8;

      ctx.strokeStyle = 'rgba(128,128,128,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let tick = -6; tick <= 6; tick += 2) {
        const cx = sx(tick);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, H);
      }
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      for (let tick = -6; tick <= 6; tick += 2) {
        const cx = sx(tick);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(90,90,90,0.35)';
        ctx.moveTo(cx, baselineY - 4);
        ctx.lineTo(cx, baselineY + 4);
        ctx.stroke();
        ctx.fillText(String(tick), cx, H - 4);
      }

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(90,90,90,0.5)';
      ctx.beginPath();
      ctx.moveTo(sx(0), 0);
      ctx.lineTo(sx(0), H);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.strokeStyle = '#569cd6';
      ctx.lineWidth = 2;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        const y = tPdf(x, df);
        px === 0 ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
      }
      ctx.stroke();

      const absT = Math.abs(tStat);
      drawTail(xMin, -absT, 'rgba(214,105,105,0.35)', xMin, xMax, baselineY, sy);
      drawTail(absT, xMax, 'rgba(214,105,105,0.35)', xMin, xMax, baselineY, sy);

      [tStat, -tStat].forEach((value, idx) => {
        const tx = sx(value);
        ctx.strokeStyle = '#f9826c';
        ctx.lineWidth = idx === 0 ? 2 : 1.4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, H); ctx.stroke();
        ctx.setLineDash([]);
      });

      const tx = sx(tStat);
      ctx.fillStyle = '#f9826c';
      ctx.font = 'bold 13px JetBrains Mono, monospace';
      ctx.fillText(`t = ${tStat.toFixed(2)}`, Math.min(tx + 8, W - 92), 16);

      const pTwo = 2 * (1 - tCdf(absT, df));
      const pOne = tStat >= 0 ? 1 - tCdf(tStat, df) : tCdf(tStat, df);
      const pTwoClamped = Math.min(1, Math.max(0, pTwo));
      const pOneClamped = Math.min(1, Math.max(0, pOne));

      card.querySelector('[data-pvalue]').textContent = pTwoClamped < 0.001 ? '< 0.001' : pTwoClamped.toFixed(4);
      card.querySelector('[data-pvalue-side]').textContent = pOneClamped < 0.001 ? '< 0.001' : pOneClamped.toFixed(4);

      const interp = card.querySelector('[data-interp]');
      if (pTwoClamped < 0.001) interp.textContent = '■■■ P < 0.001，极显著差异';
      else if (pTwoClamped < 0.01) interp.textContent = '■■ P < 0.01，非常显著';
      else if (pTwoClamped < 0.05) interp.textContent = '■ P < 0.05，显著';
      else interp.textContent = '○ P ≥ 0.05，不显著';
    }

    draw(initialT);

    card.querySelector('.viz-slider').addEventListener('input', () => {
      const t = parseFloat(card.querySelector('[data-param="t"]').value);
      card.querySelector('[data-for="t"]').textContent = t.toFixed(2);
      draw(t);
    });

    card.querySelector('.viz-reset').addEventListener('click', () => {
      card.querySelector('[data-param="t"]').value = initialT;
      card.querySelector('[data-for="t"]').textContent = initialT.toFixed(2);
      draw(initialT);
    });
  }
registerViz('pvalue', renderPValue);

  // ── t 检验计算器 ───────────────────────────────────
  // <div class="stat-calc" data-type="ttest"></div>

  function renderFDist(el) {
    const initialDf1 = parseInt(el.dataset.df1 || '2', 10);
    const initialDf2 = parseInt(el.dataset.df2 || '87', 10);
    const W = 600, H = 280;
    const alpha = 0.05;

    const card = document.createElement('div');
    card.className = 'viz-card';
    card.innerHTML = `
      <div class="viz-header"><span>📈 F 分布与 ANOVA (α=0.05)</span><button class="viz-reset" title="重置">↺</button></div>
      <canvas class="viz-canvas" width="${W}" height="${H}"></canvas>
      <div class="viz-sliders">
        <label>df1 = <span class="viz-val" data-for="df1">${initialDf1}</span>
          <input type="range" class="viz-slider" data-param="df1" min="1" max="20" step="1" value="${initialDf1}">
        </label>
        <label>df2 = <span class="viz-val" data-for="df2">${initialDf2}</span>
          <input type="range" class="viz-slider" data-param="df2" min="1" max="100" step="1" value="${initialDf2}">
        </label>
      </div>
      <div class="viz-stats">
        <span>F临界值 = <strong data-fcrit>—</strong></span>
        <span>拒绝域面积 = <strong>5%</strong></span>
        <span data-reject-label>右尾红色区域为拒绝域</span>
      </div>
    `;
    el.appendChild(card);
    if (!ensureJStat(el)) return;

    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    function fPdf(x, d1, d2) {
      if (window.jStat && window.jStat.centralF && window.jStat.centralF.pdf) return window.jStat.centralF.pdf(x, d1, d2);
      if (x <= 0) return 0;
      const c = d1 > 0 && d2 > 0 ? (d1 * x) ** d1 * d2 ** d2 / (d1 * x + d2) ** (d1 + d2) : 0;
      const betaFnFallback = (a, b) => {
        if (window.jStat && window.jStat.gammaln) {
          const lgA = jStat.gammaln(a), lgB = jStat.gammaln(b), lgAB = jStat.gammaln(a + b);
          return Math.exp(lgA + lgB - lgAB);
        }
        return 1 / Math.sqrt(Math.PI);
      };
      const betaFn = (window.jStat && window.jStat.beta && window.jStat.beta.fn)
        ? window.jStat.beta.fn(d1 / 2, d2 / 2)
        : betaFnFallback(d1 / 2, d2 / 2);
      return c / x * betaFn;
    }

    function draw(d1, d2) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(30,30,30,0.03)';
      ctx.fillRect(0, 0, W, H);

      let fCrit = 3.0;
      if (window.jStat?.centralF?.inv) {
        fCrit = window.jStat.centralF.inv(1 - alpha, d1, d2);
      }
      card.querySelector('[data-fcrit]').textContent = fCrit.toFixed(3);

      const xMin = 0;
      const xMax = Math.max(5, fCrit * 2.5);
      const baselineY = H - 20;
      const probeX = Math.max(0.3, Math.min(1, d2 > 4 ? (d2 - 2) / d2 : 0.5));
      const maxY = Math.max(fPdf(probeX, d1, d2), fPdf(fCrit, d1, d2), 0.0001) * 1.35;
      const sx = x => (x - xMin) / (xMax - xMin) * W;
      const sy = y => baselineY - (y / maxY) * H * 0.8;

      ctx.strokeStyle = 'rgba(128,128,128,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const tickMax = Math.ceil(xMax);
      for (let tick = 0; tick <= tickMax; tick += Math.max(1, Math.ceil(tickMax / 5))) {
        const cx = sx(tick);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, H);
      }
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      for (let tick = 0; tick <= tickMax; tick += Math.max(1, Math.ceil(tickMax / 5))) {
        const cx = sx(tick);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(90,90,90,0.35)';
        ctx.moveTo(cx, baselineY - 4);
        ctx.lineTo(cx, baselineY + 4);
        ctx.stroke();
        ctx.fillText(String(tick), cx, H - 4);
      }

      ctx.beginPath();
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        const y = fPdf(x, d1, d2);
        px === 0 ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
      }
      ctx.lineTo(W, baselineY);
      ctx.lineTo(0, baselineY);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(86,156,214,0.20)');
      grad.addColorStop(1, 'rgba(86,156,214,0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        if (x < fCrit) continue;
        const y = fPdf(x, d1, d2);
        if (!started) {
          ctx.moveTo(px, sy(y));
          started = true;
        } else {
          ctx.lineTo(px, sy(y));
        }
      }
      ctx.lineTo(W, baselineY);
      ctx.lineTo(sx(fCrit), baselineY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(214, 105, 105, 0.35)';
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = '#569cd6';
      ctx.lineWidth = 2.5;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        const y = fPdf(x, d1, d2);
        px === 0 ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
      }
      ctx.stroke();

      const cxCrit = sx(fCrit);
      ctx.strokeStyle = '#f9826c';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(cxCrit, 0); ctx.lineTo(cxCrit, H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f9826c';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText(`F* = ${fCrit.toFixed(2)}`, Math.min(cxCrit + 6, W - 80), 16);
      ctx.fillStyle = 'rgba(214,105,105,0.9)';
      ctx.fillText('拒绝域 α=0.05', Math.min(cxCrit + 12, W - 110), 34);
    }

    draw(initialDf1, initialDf2);

    card.querySelectorAll('.viz-slider').forEach(slider => {
      slider.addEventListener('input', () => {
        const param = slider.dataset.param;
        const val = parseInt(slider.value, 10);
        card.querySelector(`[data-for="${param}"]`).textContent = val;
        const d1 = parseInt(card.querySelector('[data-param="df1"]').value, 10);
        const d2 = parseInt(card.querySelector('[data-param="df2"]').value, 10);
        draw(d1, d2);
      });
    });

    card.querySelector('.viz-reset').addEventListener('click', () => {
      card.querySelector('[data-param="df1"]').value = initialDf1;
      card.querySelector('[data-param="df2"]').value = initialDf2;
      card.querySelector('[data-for="df1"]').textContent = initialDf1;
      card.querySelector('[data-for="df2"]').textContent = initialDf2;
      draw(initialDf1, initialDf2);
    });
  }
registerViz('fdist', renderFDist);

  // ── 卡方分布 explorer ──────────────────────────────────
  // <div class="stat-viz" data-type="chidist" data-df="1" data-title="χ² 分布 explorer"></div>
  function renderChiDist(el) {
    const initialDf = parseInt(el.dataset.df || '1');
    const title = el.dataset.title || 'χ² 分布 explorer';

    el.innerHTML = `
      <div class="viz-card">
        <div class="viz-header">📊 ${title}</div>
        <div class="viz-body">
          <canvas class="viz-canvas" style="width:100%;max-width:600px;height:260px;display:block;margin:0 auto;"></canvas>
        </div>
        <div class="viz-controls" style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:center;padding:8px 12px;background:#f8f9fa;border-top:1px solid #eee;">
          <label>df = <span data-for="df" class="val-label">${initialDf}</span>
            <input type="range" class="viz-slider" data-param="df" min="1" max="30" value="${initialDf}" style="width:140px;">
          </label>
          <label>α = <span data-for="alpha" class="val-label">0.05</span>
            <select class="viz-alpha" style="width:90px;">
              <option value="0.10">0.10</option>
              <option value="0.05" selected>0.05</option>
              <option value="0.01">0.01</option>
            </select>
          </label>
        </div>
        <div class="viz-result" style="text-align:center;font-size:13px;padding:6px;color:#555;"></div>
      </div>
    `;

    const canvas = el.querySelector('canvas');
    const slider = el.querySelector('[data-param="df"]');
    const alphaSel = el.querySelector('.viz-alpha');
    const dfLabel = el.querySelector('[data-for="df"]');
    const resultDiv = el.querySelector('.viz-result');

    function chiPdf(x, df) {
      if (x <= 0) return 0;
      return Math.pow(x, df / 2 - 1) * Math.exp(-x / 2) / (Math.pow(2, df / 2) * gamma(df / 2));
    }

    function gamma(z) {
      if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
      z -= 1;
      const g = 7;
      const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
      let x = c[0];
      for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
      const t = z + g + 0.5;
      return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    }

    function draw() {
      const df = parseInt(slider.value, 10);
      const alpha = parseFloat(alphaSel.value, 10);
      dfLabel.textContent = df;

      const ctx = canvas.getContext('2d');
      const W = canvas.offsetWidth * 2, H = 520;
      canvas.width = W; canvas.height = H;
      const pad = { l: 52, r: 20, t: 20, b: 52 };
      const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

      ctx.clearRect(0, 0, W, H);

      // 找峰值 x
      let modeX = (df - 2) > 0 ? df - 2 : 0.1;
      let maxY = chiPdf(modeX, df);

      const xMin = 0, xMax = Math.max(df * 3 + 5, 15);

      const sx = x => pad.l + (x / xMax) * iw;
      const sy = y => pad.t + ih - (y / (maxY * 1.2)) * ih;

      // 临界值
      let chiCrit = null;
      if (window.jStat && window.jStat.chisquare && window.jStat.chisquare.inv) {
        chiCrit = jStat.chisquare.inv(1 - alpha, df);
      } else {
        // 数值搜索：找满足 CDF(x) >= 1-alpha 的最小 x
        let lo = 0, hi = xMax;
        for (let step = 0; step < 12; step++) {
          const mid = (lo + hi) / 2;
          let cum = 0;
          for (let xi = 0; xi <= mid; xi += 0.01) cum += chiPdf(xi, df) * 0.01;
          if (cum < 1 - alpha) lo = mid; else hi = mid;
        }
        chiCrit = (lo + hi) / 2;
      }

      // 坐标轴
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ih); ctx.lineTo(pad.l + iw, pad.t + ih); ctx.stroke();

      // 填充拒绝域
      if (chiCrit !== null) {
        ctx.beginPath();
        let started = false;
        for (let px = 0; px <= W; px++) {
          const x = xMin + (px / W) * (xMax - xMin);
          if (x < chiCrit) continue;
          const y = chiPdf(x, df);
          if (!started) { ctx.moveTo(sx(x), sy(y)); started = true; }
          else ctx.lineTo(sx(x), sy(y));
        }
        ctx.lineTo(sx(chiCrit), pad.t + ih);
        ctx.lineTo(sx(chiCrit), sy(0));
        ctx.closePath();
        ctx.fillStyle = 'rgba(214,105,105,0.35)';
        ctx.fill();

        ctx.strokeStyle = '#f9826c';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(sx(chiCrit), pad.t); ctx.lineTo(sx(chiCrit), pad.t + ih); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f9826c';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.fillText(`χ²* = ${chiCrit.toFixed(2)}`, Math.min(sx(chiCrit) + 6, W - 110), 16);
        ctx.fillStyle = 'rgba(214,105,105,0.9)';
        ctx.fillText(`拒绝域 α=${alpha}`, Math.min(sx(chiCrit) + 12, W - 100), 34);
      }

      // 曲线
      ctx.strokeStyle = '#569cd6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        const y = chiPdf(x, df);
        px === 0 ? ctx.moveTo(sx(x), sy(y)) : ctx.lineTo(sx(x), sy(y));
      }
      ctx.stroke();

      // X轴标签
      ctx.fillStyle = '#888';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      for (let x = 0; x <= xMax; x += Math.ceil(xMax / 6)) {
        ctx.fillText(x.toFixed(0), sx(x), pad.t + ih + 16);
      }
      ctx.textAlign = 'left';

      // 结果文字
      const pText = chiCrit !== null
        ? `df=${df} 时，χ²(${alpha}, ${df}) ≈ ${chiCrit.toFixed(2)}，右侧阴影为拒绝域`
        : `df=${df}，α=${alpha}（jStat 未加载，无法计算临界值）`;
      resultDiv.textContent = pText;
    }

    draw();
    slider.addEventListener('input', draw);
    alphaSel.addEventListener('change', draw);
  }
registerViz('chidist', renderChiDist);

  // ── 二项分布可视化 ──────────────────────────────────
  // <div class="stat-viz" data-type="binom" data-n="20" data-p="0.5" data-title="二项分布 B(n,p)"></div>

  function renderBinomial(el) {
    const n = parseInt(el.dataset.n || '20');
    const p = parseFloat(el.dataset.p || '0.5');
    const title = el.dataset.title || `二项分布 B(${n}, ${p})`;

    el.innerHTML = `
      <div class="viz-card">
        <div class="viz-header">📊 ${title}</div>
        <div class="viz-body">
          <canvas class="viz-canvas" style="width:100%;max-width:640px;height:280px;display:block;margin:0 auto;"></canvas>
        </div>
        <div class="viz-controls" style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:center;padding:8px 12px;background:#f8f9fa;border-top:1px solid #eee;">
          <label>n = <span class="val-label">${n}</span>
            <input type="range" class="binom-n" min="1" max="50" value="${n}" style="width:120px;">
          </label>
          <label>p = <span class="val-label">${p}</span>
            <input type="range" class="binom-p" min="0.01" max="0.99" step="0.01" value="${p}" style="width:120px;">
          </label>
        </div>
        <div class="viz-result" style="text-align:center;font-size:13px;padding:4px;color:#555;"></div>
      </div>
    `;

    const canvas = el.querySelector('canvas');
    const nInput = el.querySelector('.binom-n');
    const pInput = el.querySelector('.binom-p');
    const nLabel = el.querySelector('.viz-controls .val-label');
    const pLabel = el.querySelectorAll('.viz-controls .val-label')[1];
    const resultDiv = el.querySelector('.viz-result');

    function draw() {
      const dn = parseInt(nInput.value);
      const dp = parseFloat(pInput.value);
      nLabel.textContent = dn;
      pLabel.textContent = dp.toFixed(2);
      const ctx = canvas.getContext('2d');
      const W = canvas.offsetWidth * 2, H = 560;
      canvas.width = W; canvas.height = H;
      const pad = { l: 50, r: 20, t: 20, b: 50 };
      const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

      // Find max P(X=k)
      const probs = [];
      for (let k = 0; k <= dn; k++) {
        try { probs.push(jStat.combination(dn, k) * Math.pow(dp, k) * Math.pow(1-dp, dn-k)); }
        catch(e) { probs.push(0); }
      }
      const maxP = Math.max(...probs);

      // Axes
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H-pad.b); ctx.lineTo(W-pad.r, H-pad.b);
      ctx.stroke();
      // X axis label
      ctx.fillStyle = '#555'; ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('X = k', W/2, H-8);
      // Y axis label
      ctx.save(); ctx.translate(14, H/2); ctx.rotate(-Math.PI/2); ctx.fillText('P(X=k)', 0, 0); ctx.restore();

      // Grid lines
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
      for (let k = 0; k <= dn; k++) {
        const x = pad.l + (k / dn) * iw;
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H-pad.b); ctx.stroke();
      }

      const mean = dn * dp;
      const variance = dn * dp * (1 - dp);

      // Bars
      for (let k = 0; k <= dn; k++) {
        const x = pad.l + (k / dn) * iw - (iw/(dn*2));
        const barW = Math.max(2, (iw/dn) * 0.85);
        const barH = (probs[k] / maxP) * ih;
        const barY = H - pad.b - barH;
        const isMean = Math.abs(k - mean) < 0.5;
        ctx.fillStyle = isMean ? '#e74c3c' : '#3498db';
        ctx.fillRect(x, barY, barW, barH);
      }

      // Mean line
      const meanX = pad.l + (mean / dn) * iw;
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(meanX, pad.t); ctx.lineTo(meanX, H-pad.b); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`μ=${mean.toFixed(1)}`, meanX, pad.t + 18);

      // Stats
      resultDiv.innerHTML = `μ = ${mean.toFixed(2)} &nbsp;|&nbsp; σ² = ${variance.toFixed(2)} &nbsp;|&nbsp; P(X=⌊np⌋) = ${probs[Math.round(mean)].toFixed(4)}`;
    }

    nInput.addEventListener('input', draw);
    pInput.addEventListener('input', draw);
    draw();
  }
registerViz('binom', renderBinomial);

  // ── Kaplan-Meier 生存曲线 ────────────────────────────
  // <div class="stat-viz" data-type="km" data-times="[3,5,8,12,15,20,25]" data-status="[1,1,0,1,0,1,0]" data-title="Kaplan-Meier 生存曲线"></div>
  // times: 生存时间，status: 1=事件发生(死亡)，0=截尾

  function renderPoisson(el) {
    const lambda = parseFloat(el.dataset.lambda || '5');
    const title = el.dataset.title || `泊松分布 P(${lambda})`;

    el.innerHTML = `
      <div class="viz-card">
        <div class="viz-header">📊 ${title}</div>
        <div class="viz-body">
          <canvas class="viz-canvas" style="width:100%;max-width:640px;height:280px;display:block;margin:0 auto;"></canvas>
        </div>
        <div class="viz-controls" style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:center;padding:8px 12px;background:#f8f9fa;border-top:1px solid #eee;">
          <label>λ = <span class="val-label">${lambda}</span>
            <input type="range" class="poisson-lambda" min="0.5" max="30" step="0.5" value="${lambda}" style="width:140px;">
          </label>
        </div>
        <div class="viz-result" style="text-align:center;font-size:13px;padding:4px;color:#555;"></div>
      </div>
    `;

    const canvas = el.querySelector('canvas');
    const lambdaInput = el.querySelector('.poisson-lambda');
    const lambdaLabel = el.querySelector('.val-label');
    const resultDiv = el.querySelector('.viz-result');

    function draw() {
      const dl = parseFloat(lambdaInput.value);
      lambdaLabel.textContent = dl.toFixed(dl < 10 ? 1 : 0);
      const ctx = canvas.getContext('2d');
      const W = canvas.offsetWidth * 2, H = 560;
      canvas.width = W; canvas.height = H;
      const pad = { l: 50, r: 20, t: 20, b: 50 };
      const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

      // Range: show from 0 to ~λ+4√λ
      const maxK = Math.max(20, Math.ceil(dl + 4 * Math.sqrt(dl)));
      const probs = [];
      for (let k = 0; k <= maxK; k++) {
        try { probs.push(jStat.poisson.pdf(k, dl)); } catch(e) { probs.push(0); }
      }
      const maxP = Math.max(...probs);

      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H-pad.b); ctx.lineTo(W-pad.r, H-pad.b);
      ctx.stroke();
      ctx.fillStyle = '#555'; ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('X = k', W/2, H-8);
      ctx.save(); ctx.translate(14, H/2); ctx.rotate(-Math.PI/2); ctx.fillText('P(X=k)', 0, 0); ctx.restore();

      // Grid
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
      for (let k = 0; k <= maxK; k++) {
        const x = pad.l + (k / maxK) * iw;
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H-pad.b); ctx.stroke();
      }

      // Bars
      for (let k = 0; k <= maxK; k++) {
        const x = pad.l + (k / maxK) * iw - (iw/(maxK*2));
        const barW = Math.max(3, (iw/maxK) * 0.8);
        const barH = (probs[k] / maxP) * ih;
        const barY = H - pad.b - barH;
        const isMean = Math.abs(k - dl) < 0.5;
        ctx.fillStyle = isMean ? '#e74c3c' : '#9b59b6';
        ctx.fillRect(x, barY, barW, barH);
      }

      // Mean line
      const meanX = pad.l + (dl / maxK) * iw;
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(meanX, pad.t); ctx.lineTo(meanX, H-pad.b); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`λ=${dl.toFixed(1)}`, meanX, pad.t + 18);

      // P(X=λ)
      const pAtLambda = jStat.poisson.pdf(Math.round(dl), dl);
      resultDiv.innerHTML = `μ = λ = ${dl.toFixed(2)} &nbsp;|&nbsp; σ² = λ = ${dl.toFixed(2)} &nbsp;|&nbsp; P(X=⌊λ⌋) = ${pAtLambda.toFixed(4)}`;
    }

    lambdaInput.addEventListener('input', draw);
    draw();
  }
registerViz('poisson', renderPoisson);

  // ── Wilcoxon符号秩检验可视化 ─────────────────────────
  // <div class="stat-viz" data-type="wilcoxon" data-title="配对样本Wilcoxon符号秩检验"></div>
