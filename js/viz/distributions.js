import { registerViz } from './_core.js';

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
        <label>μ = <span class="viz-val" data-for="mu">${mu}</span>
          <input type="range" class="viz-slider" data-param="mu" min="-5" max="5" step="0.1" value="${mu}">
        </label>
        <label>σ = <span class="viz-val" data-for="sigma">${sigma}</span>
          <input type="range" class="viz-slider" data-param="sigma" min="0.5" max="5" step="0.1" value="${sigma}">
        </label>
      </div>
      <div class="viz-stats">
        <span>P(μ-σ &lt; X &lt; μ+σ) = <strong>68.3%</strong></span>
        <span>P(μ-2σ &lt; X &lt; μ+2σ) = <strong>95.5%</strong></span>
      </div>
    `;
    el.appendChild(card);

    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    function pdf(x, mu, sigma) {
      return Math.exp(-0.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
    }

    function draw(muV, sigmaV) {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, W, H);

      // 背景
      ctx.fillStyle = 'rgba(30,30,30,0.03)';
      ctx.fillRect(0, 0, W, H);

      // 坐标映射
      const xMin = muV - 4*sigmaV, xMax = muV + 4*sigmaV;
      const yMax = pdf(muV, muV, sigmaV) * 1.15;

      const sx = x => (x - xMin) / (xMax - xMin) * W;
      const sy = y => H - (y / yMax) * H * 0.85 - 20;

      // 网格
      ctx.strokeStyle = 'rgba(128,128,128,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = Math.ceil(xMin); x <= xMax; x += sigmaV) {
        const cx = sx(x);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
      }
      ctx.stroke();

      // 曲线
      ctx.beginPath();
      ctx.strokeStyle = '#569cd6';
      ctx.lineWidth = 2.5;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px/W)*(xMax-xMin);
        const y = pdf(x, muV, sigmaV);
        const cx = px, cy = sy(y);
        px === 0 ? ctx.moveTo(cx,cy) : ctx.lineTo(cx,cy);
      }
      ctx.stroke();

      // 填充曲线
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(86,156,214,0.3)');
      grad.addColorStop(1, 'rgba(86,156,214,0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      // μ 线
      const mx = sx(muV);
      ctx.strokeStyle = '#f9826c';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f9826c';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillText('μ', mx+4, 16);

      // σ 区域 (±1σ 浅色)
      ctx.fillStyle = 'rgba(86,156,214,0.08)';
      ctx.beginPath();
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px/W)*(xMax-xMin);
        const cx = px, cy = sy(pdf(x,muV,sigmaV));
        px === 0 ? ctx.moveTo(cx,cy) : ctx.lineTo(cx,cy);
      }
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
      ctx.fill();
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
      card.querySelector('[data-for="mu"]').textContent = mu;
      card.querySelector('[data-for="sigma"]').textContent = sigma;
      draw(mu, sigma);
    });
  }
registerViz('normal', renderNormalDistribution);

  // ── t 分布对比器 ───────────────────────────────────
  // <div class="stat-viz" data-type="tcompare"></div>

  function renderTCompare(el) {
    const W = 600, H = 280;
    const card = document.createElement('div');
    card.className = 'viz-card';
    card.innerHTML = `
      <div class="viz-header"><span>📊 正态分布 vs t 分布</span><button class="viz-reset" title="重置">↺</button></div>
      <canvas class="viz-canvas" width="${W}" height="${H}"></canvas>
      <div class="viz-sliders">
        <label>自由度 df = <span class="viz-val" data-for="df">10</span>
          <input type="range" class="viz-slider" data-param="df" min="1" max="100" step="1" value="10">
        </label>
      </div>
      <div class="viz-legend">
        <span class="legend-item" style="border-color:#569cd6">— 标准正态 N(0,1)</span>
        <span class="legend-item" style="border-color:#c586c0">— t 分布</span>
      </div>
    `;
    el.appendChild(card);

    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    function normalPDF(x) {
      return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);
    }

    function draw(df) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(30,30,30,0.03)';
      ctx.fillRect(0, 0, W, H);

      const xMin = -4, xMax = 4;

      // t PDF（用 jStat 如果可用，否则近似）
      let tPdf;
      if (window.jStat && window.jStat.studentt) {
        tPdf = x => window.jStat.studentt.pdf(x, df);
      } else {
        // t PDF fallback: 用 Stirling 近似计算 log-Gamma
        // logΓ(z) ≈ (z-0.5)*log(z) - z + 0.5*log(2π) + 1/(12z) - 1/(360z³)
        function logGammaStirling(z) {
          if (z <= 0) return 0;
          return (z - 0.5) * Math.log(z) - z + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * z) - 1 / (360 * z * z * z);
        }
        tPdf = x => {
          const c = Math.pow(1 + x * x / df, -(df + 1) / 2);
          const lg1 = logGammaStirling(df / 2 + 0.5);
          const lg2 = 0.5 * Math.log(Math.PI); // log Γ(0.5) = log √π
          const lg3 = logGammaStirling(df / 2 + 1);
          return c * Math.exp(lg1 + lg2 - lg3) / Math.sqrt(df * Math.PI);
        };
      }

      const maxY = Math.max(normalPDF(0), tPdf(0)) * 1.2;
      const sx = x => (x - xMin)/(xMax - xMin) * W;
      const sy = y => H - (y/maxY)*H*0.8 - 15;

      // 画正态曲线
      ctx.beginPath();
      ctx.strokeStyle = '#569cd6';
      ctx.lineWidth = 2;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px/W)*(xMax-xMin);
        const y = normalPDF(x);
        px === 0 ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
      }
      ctx.stroke();

      // 画 t 曲线
      ctx.beginPath();
      ctx.strokeStyle = '#c586c0';
      ctx.lineWidth = 2;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px/W)*(xMax-xMin);
        const y = tPdf(x);
        px === 0 ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
      }
      ctx.stroke();

      // 填充 t 曲线
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
      const grad = ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,'rgba(197,133,192,0.15)');
      grad.addColorStop(1,'rgba(197,133,192,0.02)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    draw(10);

    card.querySelector('.viz-slider').addEventListener('input', () => {
      const df = parseInt(card.querySelector('[data-param="df"]').value);
      card.querySelector('[data-for="df"]').textContent = df;
      draw(df);
    });

    card.querySelector('.viz-reset').addEventListener('click', () => {
      card.querySelector('[data-param="df"]').value = 10;
      card.querySelector('[data-for="df"]').textContent = 10;
      draw(10);
    });
  }
registerViz('tcompare', renderTCompare);

  // ── P 值可视化 ─────────────────────────────────────
  // <div class="stat-viz" data-type="pvalue" data-df="35"></div>

  function renderPValue(el) {
    const df = parseInt(el.dataset.df || '35');
    const W = 600, H = 260;
    const card = document.createElement('div');
    card.className = 'viz-card';
    card.innerHTML = `
      <div class="viz-header"><span>🎯 P 值可视化（t 分布）</span><button class="viz-reset" title="重置">↺</button></div>
      <canvas class="viz-canvas" width="${W}" height="${H}"></canvas>
      <div class="viz-sliders">
        <label>t 统计量 = <span class="viz-val" data-for="t">2.14</span>
          <input type="range" class="viz-slider" data-param="t" min="-6" max="6" step="0.01" value="2.14">
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

    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    function tPdf(x, df) {
      if (window.jStat && window.jStat.studentt) return window.jStat.studentt.pdf(x, df);
      // 不支持时的退化（should not happen since jStat is loaded）
      return Math.exp(-(df+1)/2*Math.log(1+x*x/df)) / Math.sqrt(df*Math.PI);
    }

    function tCdf(x, df) {
      if (window.jStat && window.jStat.studentt) return window.jStat.studentt.cdf(x, df);
      // fallback: 标准正态近似（df 大时足够好）
      return 0.5 * (1 + _erf(x / Math.sqrt(2)));
    }

    // 近似误差函数（ Abramowitz-Stegun 公式）
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

    function draw(tStat) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(30,30,30,0.03)';
      ctx.fillRect(0, 0, W, H);

      const xMin = -5, xMax = 5;
      const maxY = tPdf(0, df) * 1.2;
      const sx = x => (x - xMin)/(xMax - xMin) * W;
      const sy = y => H - (y/maxY)*H*0.8 - 12;

      // 画曲线
      ctx.beginPath();
      ctx.strokeStyle = '#569cd6';
      ctx.lineWidth = 2;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px/W)*(xMax-xMin);
        const y = tPdf(x, df);
        px === 0 ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
      }
      ctx.stroke();

      // 填充右尾
      const rightX = Math.max(tStat, xMin);
      ctx.beginPath();
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px/W)*(xMax-xMin);
        if (x < rightX) continue;
        const y = tPdf(x, df);
        px === 0 || x === rightX ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
      }
      ctx.lineTo(W,H); ctx.lineTo(sx(rightX),H); ctx.closePath();
      ctx.fillStyle = 'rgba(214,105,105,0.35)';
      ctx.fill();

      // 填充左尾
      const leftX = Math.min(tStat, xMax);
      ctx.beginPath();
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px/W)*(xMax-xMin);
        if (x > leftX) continue;
        const y = tPdf(x, df);
        px === 0 || x === leftX ? ctx.moveTo(px, sy(y)) : ctx.lineTo(px, sy(y));
      }
      ctx.lineTo(0,H); ctx.lineTo(sx(leftX),H); ctx.closePath();
      ctx.fill();

      // t 统计量线
      const tx = sx(tStat);
      ctx.strokeStyle = '#f9826c';
      ctx.lineWidth = 2;
      ctx.setLineDash([5,5]);
      ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, H); ctx.stroke();
      ctx.setLineDash([]);

      // t 统计量标签
      ctx.fillStyle = '#f9826c';
      ctx.font = 'bold 13px JetBrains Mono, monospace';
      ctx.fillText(`t = ${tStat.toFixed(2)}`, Math.min(tx+6, W-90), 16);

      // 更新 P 值显示
      const pTwo = 2 * (1 - tCdf(Math.abs(tStat), df));
      const pOne = 1 - tCdf(tStat, df);
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

    draw(2.14);

    card.querySelector('.viz-slider').addEventListener('input', () => {
      const t = parseFloat(card.querySelector('[data-param="t"]').value);
      card.querySelector('[data-for="t"]').textContent = t.toFixed(2);
      draw(t);
    });

    card.querySelector('.viz-reset').addEventListener('click', () => {
      card.querySelector('[data-param="t"]').value = 2.14;
      card.querySelector('[data-for="t"]').textContent = '2.14';
      draw(2.14);
    });
  }
registerViz('pvalue', renderPValue);

  // ── t 检验计算器 ───────────────────────────────────
  // <div class="stat-calc" data-type="ttest"></div>

  function renderFDist(el) {
    const df1 = parseInt(el.dataset.df1 || '2');
    const df2 = parseInt(el.dataset.df2 || '87');
    const W = 600, H = 280;
    const alpha = 0.05;

    const card = document.createElement('div');
    card.className = 'viz-card';
    card.innerHTML = `
      <div class="viz-header"><span>📈 F 分布与 ANOVA (α=0.05)</span><button class="viz-reset" title="重置">↺</button></div>
      <canvas class="viz-canvas" width="${W}" height="${H}"></canvas>
      <div class="viz-sliders">
        <label>df1 = <span class="viz-val" data-for="df1">${df1}</span>
          <input type="range" class="viz-slider" data-param="df1" min="1" max="20" step="1" value="${df1}">
        </label>
        <label>df2 = <span class="viz-val" data-for="df2">${df2}</span>
          <input type="range" class="viz-slider" data-param="df2" min="1" max="100" step="1" value="${df2}">
        </label>
      </div>
      <div class="viz-stats">
        <span>F临界值 = <strong data-fcrit>—</strong></span>
        <span>拒绝域面积 = <strong>5%</strong></span>
      </div>
    `;
    el.appendChild(card);

    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    function fPdf(x, d1, d2) {
      if (window.jStat && window.jStat.centralF && window.jStat.centralF.pdf) return window.jStat.centralF.pdf(x, d1, d2);
      // Fallback approximation
      if (x <= 0) return 0;
      const c = d1 > 0 && d2 > 0 ? (d1*x)**d1 * d2**d2 / (d1*x + d2)**(d1+d2) : 0;
      const betaFn = (window.jStat && window.jStat.beta && window.jStat.beta.fn)
        ? window.jStat.beta.fn(d1/2, d2/2)
        : 1 / (Math.sqrt(Math.PI) * Math.exp(jStat.gammaln ? jStat.gammaln(d1/2) + jStat.gammaln(d2/2) - jStat.gammaln((d1+d2)/2) : 0));
      return c / x * betaFn;
    }

    function draw(d1, d2) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(30,30,30,0.03)';
      ctx.fillRect(0, 0, W, H);

      // 计算 F 临界值
      let fCrit = 3.0;
      if (window.jStat && window.jStat.ftest) {
        fCrit = jStat.centralF.inv(1 - alpha, d1, d2);
      }
      card.querySelector('[data-fcrit]').textContent = fCrit.toFixed(3);

      const xMin = 0, xMax = Math.max(5, fCrit * 2.5);
      const maxY = fPdf(0.5, d1, d2) * 1.3;
      const sx = x => (x - xMin) / (xMax - xMin) * W;
      const sy = y => H - (y / maxY) * H * 0.8 - 15;

      // 画曲线
      ctx.beginPath();
      ctx.strokeStyle = '#569cd6';
      ctx.lineWidth = 2.5;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px/W)*(xMax-xMin);
        const y = fPdf(x, d1, d2);
        const cx = px, cy = sy(y);
        px === 0 ? ctx.moveTo(cx,cy) : ctx.lineTo(cx,cy);
      }
      ctx.stroke();

      // 填充拒绝域
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px/W)*(xMax-xMin);
        if (x < fCrit) continue;
        const y = fPdf(x, d1, d2);
        if (!started) { ctx.moveTo(px, sy(y)); started = true; }
        else ctx.lineTo(px, sy(y));
      }
      ctx.lineTo(W, H); ctx.lineTo(sx(fCrit), H); ctx.closePath();
      ctx.fillStyle = 'rgba(214, 105, 105, 0.35)';
      ctx.fill();

      // F 临界线
      const cxCrit = sx(fCrit);
      ctx.strokeStyle = '#f9826c';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(cxCrit, 0); ctx.lineTo(cxCrit, H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f9826c';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`F* = ${fCrit.toFixed(2)}`, Math.min(cxCrit + 6, W - 80), 16);

      // 坐标轴
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pad.l, 0); ctx.lineTo(pad.l, H); ctx.lineTo(W, H);
      ctx.stroke();
    }

    draw(df1, df2);

    card.querySelectorAll('.viz-slider').forEach(slider => {
      slider.addEventListener('input', () => {
        const param = slider.dataset.param;
        const val = parseInt(slider.value);
        card.querySelector(`[data-for="${param}"]`).textContent = val;
        const d1 = parseInt(card.querySelector('[data-param="df1"]').value);
        const d2 = parseInt(card.querySelector('[data-param="df2"]').value);
        draw(d1, d2);
      });
    });

    card.querySelector('.viz-reset').addEventListener('click', () => {
      card.querySelector('[data-param="df1"]').value = df1;
      card.querySelector('[data-param="df2"]').value = df2;
      card.querySelector('[data-for="df1"]').textContent = df1;
      card.querySelector('[data-for="df2"]').textContent = df2;
      draw(df1, df2);
    });
  }
registerViz('fdist', renderFDist);

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

      // Bars
      for (let k = 0; k <= dn; k++) {
        const x = pad.l + (k / dn) * iw - (iw/(dn*2));
        const barW = Math.max(2, (iw/dn) * 0.85);
        const barH = (probs[k] / maxP) * ih;
        const barY = H - pad.b - barH;
        const mean = dn * dp;
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
      const variance = dn * dp * (1 - dp);
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
