"use strict";

// ===== 统计可视化与交互计算器 =====
// 依赖: jStat (https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js)
// 使用 Canvas + jStat 实现，无需安装

(function() {
  // ── 工具函数 ──────────────────────────────────────
  const $ = id => document.getElementById(id);

  // 解析数值（支持逗号/空格分隔）
  function parseNumbers(text) {
    return text.trim()
      .split(/[,\s]+/)
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v) && isFinite(v));
  }

  // 均值
  function mean(arr) { return arr.reduce((a,b)=>a+b,0)/arr.length; }
  // 标准差（样本）
  function sd(arr) {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s,x)=>s+(x-m)**2,0)/(arr.length-1));
  }
  // 求和
  function sum(arr) { return arr.reduce((a,b)=>a+b,0); }

  // ── Canvas 画布工厂 ────────────────────────────────
  function makeCanvas(container, w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = 'display:block;width:100%;max-width:600px;margin:0 auto;border-radius:8px;';
    container.appendChild(canvas);
    return canvas;
  }

  // ── 正态分布探索器 ─────────────────────────────────
  // <div class="stat-viz" data-type="normal" data-mu="0" data-sigma="1"></div>
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
        // 近似：t 分布的尾部比正态厚
        tPdf = x => {
          const c = (1 + x*x/df) ** (-(df+1)/2);
          return c * (df > 0 ? Math.exp(-lgamma(df/2+0.5) - lgamma(0.5) + lgamma(df/2+1)) / Math.sqrt(df*Math.PI) : 0);
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

  // ── t 检验计算器 ───────────────────────────────────
  // <div class="stat-calc" data-type="ttest"></div>
  function renderTTest(el) {
    const card = document.createElement('div');
    card.className = 'calc-card';
    card.innerHTML = `
      <div class="calc-header">🧮 t 检验计算器</div>
      <div class="calc-tabs">
        <button class="calc-tab active" data-tab="one-sample">单样本 t 检验</button>
        <button class="calc-tab" data-tab="two-sample">两样本 t 检验</button>
      </div>
      <div class="calc-body">
        <!-- 单样本 -->
        <div class="calc-panel active" data-panel="one-sample">
          <div class="calc-field">
            <label>样本数据（空格或逗号分隔）</label>
            <textarea class="calc-input" data-input="sample1" rows="3" placeholder="例如：112 137 129 126 88 90 118 105 ..."></textarea>
          </div>
          <div class="calc-field">
            <label>总体均数 μ₀ = </label>
            <input type="number" class="calc-input" data-input="mu0" value="140" step="any">
          </div>
        </div>
        <!-- 两样本 -->
        <div class="calc-panel" data-panel="two-sample">
          <div class="calc-field">
            <label>组 1 数据</label>
            <textarea class="calc-input" data-input="g1" rows="2" placeholder="例如：2.1 1.5 3.2 0.9 ..."></textarea>
          </div>
          <div class="calc-field">
            <label>组 2 数据</label>
            <textarea class="calc-input" data-input="g2" rows="2" placeholder="例如：1.8 2.3 1.1 3.5 ..."></textarea>
          </div>
          <div class="calc-field">
            <label><input type="checkbox" class="calc-check" data-input="equal-var"> 假设方差齐性（不勾选则用 Welch 校正）</label>
          </div>
        </div>
      </div>
      <button class="calc-run">计算</button>
      <div class="calc-result" data-result></div>
    `;
    el.appendChild(card);

    // Tab 切换
    card.querySelectorAll('.calc-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        card.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
        card.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        card.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add('active');
      });
    });

    card.querySelector('.calc-run').addEventListener('click', () => {
      const tab = card.querySelector('.calc-tab.active').dataset.tab;
      let result;

      if (tab === 'one-sample') {
        const raw = card.querySelector('[data-input="sample1"]').value;
        const mu0 = parseFloat(card.querySelector('[data-input="mu0"]').value);
        const arr = parseNumbers(raw);

        if (arr.length < 2) { alert('请输入至少2个数值'); return; }
        if (isNaN(mu0)) { alert('请输入有效的总体均数'); return; }

        const n = arr.length;
        const xbar = mean(arr);
        const s = sd(arr);
        const se = s / Math.sqrt(n);
        const tStat = (xbar - mu0) / se;

        // jStat 如果可用
        let pTwo = NaN, pOne = NaN;
        if (window.jStat && window.jStat.studentt) {
          const df = n - 1;
          pTwo = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));
          pOne = 1 - jStat.studentt.cdf(tStat, df);
        }

        const ci95 = [xbar - 2.0459*se, xbar + 2.0459*se]; // 近似 df=n-1
        result = { type: 'one-sample t', n, xbar: xbar.toFixed(4), s: s.toFixed(4),
                   t: tStat.toFixed(4), df: n-1,
                   pTwo: pTwo < 0.001 ? '< 0.001' : (isNaN(pTwo) ? '—' : pTwo.toFixed(4)),
                   ci95: `[${ci95[0].toFixed(3)}, ${ci95[1].toFixed(3)}]` };

      } else {
        const g1 = parseNumbers(card.querySelector('[data-input="g1"]').value);
        const g2 = parseNumbers(card.querySelector('[data-input="g2"]').value);
        const equalVar = card.querySelector('[data-input="equal-var"]').checked;

        if (g1.length < 2 || g2.length < 2) { alert('每组至少输入2个数值'); return; }

        const n1 = g1.length, n2 = g2.length;
        const x1 = mean(g1), x2 = mean(g2);
        const s1 = sd(g1), s2 = sd(g2);

        let tStat, df, se, pTwo = NaN, pOne = NaN;

        if (equalVar) {
          const sp = Math.sqrt(((n1-1)*s1*s1+(n2-1)*s2*s2)/(n1+n2-2));
          se = sp * Math.sqrt(1/n1 + 1/n2);
          df = n1 + n2 - 2;
        } else {
          se = Math.sqrt(s1*s1/n1 + s2*s2/n2);
          // Welch–Satterthwaite
          const num = (s1*s1/n1 + s2*s2/n2)**2;
          const denom = (s1**4/(n1*n1*(n1-1))) + (s2**4/(n2*n2*(n2-1)));
          df = num / denom;
        }

        tStat = (x1 - x2) / se;

        if (window.jStat && window.jStat.studentt) {
          pTwo = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), Math.round(df)));
          pOne = 1 - jStat.studentt.cdf(tStat, Math.round(df));
        }

        result = {
          type: equalVar ? '两样本 t（方差齐）' : 'Welch t（方差不齐）',
          n1, n2, x1: x1.toFixed(4), x2: x2.toFixed(4),
          s1: s1.toFixed(4), s2: s2.toFixed(4),
          t: tStat.toFixed(4), df: Number.isInteger(df) ? df : df.toFixed(2),
          pTwo: pTwo < 0.001 ? '< 0.001' : (isNaN(pTwo) ? '—' : pTwo.toFixed(4)),
          pOne: pOne < 0.001 ? '< 0.001' : (isNaN(pOne) ? '—' : pOne.toFixed(4))
        };
      }

      displayTTestResult(card.querySelector('[data-result]'), result);
    });
  }

  function displayTTestResult(el, r) {
    const significant = r.pTwo !== '—' && parseFloat(r.pTwo) < 0.05;
    const pTag = significant
      ? `<span class="result-sig">显著 ${parseFloat(r.pTwo) < 0.01 ? '**' : '*'}</span>`
      : '<span class="result-ns">不显著</span>';

    let html = `<div class="result-table"><div class="result-row header"><span>项目</span><span>值</span></div>`;

    const rows = r.type === 'one-sample t'
      ? [
          ['检验类型', r.type],
          ['样本量 n', r.n],
          ['样本均数 x̄', r.xbar],
          ['标准差 s', r.s],
          ['t 统计量', r.t],
          ['自由度 df', r.df],
          ['P 值（双侧）', `${r.pTwo} ${pTag}`],
          ['95% CI', r.ci95],
        ]
      : [
          ['检验类型', r.type],
          ['组1 n', r.n1], ['组2 n', r.n2],
          ['组1 均数', r.x1], ['组2 均数', r.x2],
          ['组1 SD', r.s1], ['组2 SD', r.s2],
          ['t 统计量', r.t],
          ['自由度 df', r.df],
          ['P 值（双侧）', `${r.pTwo} ${pTag}`],
          ['P 值（单侧）', r.pOne],
        ];

    rows.forEach(([k,v]) => { html += `<div class="result-row"><span>${k}</span><span>${v}</span></div>`; });
    html += '</div>';
    el.innerHTML = html;
  }

  // ── 卡方检验计算器 ─────────────────────────────────
  // <div class="stat-calc" data-type="chisq"></div>
  function renderChiSq(el) {
    const card = document.createElement('div');
    card.className = 'calc-card';
    card.innerHTML = `
      <div class="calc-header">📊 卡方检验计算器</div>
      <div class="calc-body">
        <div class="calc-field">
          <label>列联表数据（每行一组，数字用空格分隔）</label>
          <textarea class="calc-input" data-input="table" rows="4" placeholder="例如（2×2 表）：&#10;75 21&#10;99 5&#10;&#10;（第一行：安慰剂组 有效/无效，第二行：治疗组 有效/无效）"></textarea>
        </div>
      </div>
      <button class="calc-run">计算</button>
      <div class="calc-result" data-result></div>
    `;
    el.appendChild(card);

    card.querySelector('.calc-run').addEventListener('click', () => {
      const raw = card.querySelector('[data-input="table"]').value.trim();
      const lines = raw.split('\n').filter(l => l.trim());
      const matrix = lines.map(l => parseNumbers(l));

      if (matrix.length < 2 || matrix.some(r => r.length < 2)) {
        alert('请输入至少 2×2 的列联表（每行数字用空格分隔）'); return;
      }

      const rows = matrix.length, cols = Math.max(...matrix.map(r=>r.length));
      // Pad to square-ish
      for (let i = 0; i < rows; i++) {
        while (matrix[i].length < cols) matrix[i].push(0);
      }

      // 总计
      const total = matrix.flat().reduce((a,b)=>a+b,0);
      const rowTotals = matrix.map(r => sum(r));
      const colTotals = Array.from({length: cols}, (_,c) => sum(matrix.map(r=>r[c]||0)));

      // 卡方统计量
      let chi2 = 0;
      const expected = [];
      for (let i = 0; i < rows; i++) {
        expected[i] = [];
        for (let j = 0; j < cols; j++) {
          const e = (rowTotals[i] * colTotals[j]) / total;
          expected[i][j] = e;
          const o = matrix[i][j];
          chi2 += (o - e)**2 / e;
        }
      }

      const df = (rows - 1) * (cols - 1);
      let p = NaN;
      if (window.jStat && window.jStat.chisquare) {
        p = 1 - jStat.chisquare.cdf(chi2, df);
      }

      // Fisher 精确检验（2×2 only）
      let fisherP = null;
      if (rows === 2 && cols === 2 && window.jStat && jStat.beta) {
        const [a,b,c,d] = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1]];
        // 超几何分布精确 P
        const hyperP = hypergeometricTest(a, b, c, d);
        fisherP = hyperP;
      }

      // 显示结果
      const resultEl = card.querySelector('[data-result]');
      const sig = !isNaN(p) && p < 0.05;
      const sigMark = p < 0.01 ? '**' : '*';
      const sigTag = sig ? `<span class="result-sig">${sigMark} 显著</span>` : '<span class="result-ns">不显著</span>';

      let html = `<div class="result-table">`;
      html += `<div class="result-row header"><span>项目</span><span>值</span></div>`;
      html += `<div class="result-row"><span>χ² 统计量</span><span>${chi2.toFixed(4)}</span></div>`;
      html += `<div class="result-row"><span>自由度 df</span><span>${df}</span></div>`;
      html += `<div class="result-row"><span>P 值</span><span>${isNaN(p) ? '—' : (p < 0.001 ? '< 0.001' : p.toFixed(4))} ${sigTag}</span></div>`;

      if (fisherP !== null) {
        const fisherSig = fisherP < 0.05 ? `<span class="result-sig">*</span>` : '<span class="result-ns">ns</span>';
        html += `<div class="result-row"><span>Fisher 精确 P</span><span>${fisherP < 0.001 ? '< 0.001' : fisherP.toFixed(4)} ${fisherSig}</span></div>`;
      }

      html += `<div class="result-row header" style="margin-top:8px"><span>—— 期望频数 ——</span><span></span></div>`;
      for (let i = 0; i < rows; i++) {
        html += `<div class="result-row"><span>行${i+1}</span><span>${expected[i].map(v=>v.toFixed(2)).join('  |  ')}</span></div>`;
      }
      html += '</div>';

      if (fisherP !== null && fisherP < 0.05 && !sig) {
        html += '<div class="calc-note">⚠️ 期望频数 < 5，建议用 Fisher 精确检验</div>';
      }

      resultEl.innerHTML = html;
    });
  }

  // Fisher 精确检验（超几何分布）
  function hypergeometricTest(a, b, c, d) {
    const total = a + b + c + d;
    const row1 = a + b, row2 = c + d, col1 = a + c, col2 = b + d;
    const min = Math.max(0, col1 - row2), max = Math.min(row1, col1);
    let pObs = 0, pSum = 0;
    for (let k = min; k <= max; k++) {
      const p = comb(row1, k) * comb(row2, col1 - k) / comb(total, col1);
      if (k === a) pObs = p;
      if (p <= pObs + 1e-10) pSum += p;
    }
    return Math.min(1, 2 * pSum);
  }

  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    let res = 1;
    for (let i = 0; i < k; i++) res = res * (n - i) / (i + 1);
    return res;
  }

  // ── 散点图 ─────────────────────────────────────────
  // <div class="stat-viz" data-type="scatter" data-title="标题" data-xlabel="X轴" data-ylabel="Y轴" data-points="[{x:1,y:2},{x:3,y:4}]"></div>
  function renderScatterPlot(el) {
    const title = el.dataset.title || '散点图';
    const xlabel = el.dataset.xlabel || 'X';
    const ylabel = el.dataset.ylabel || 'Y';
    let points = [];
    try {
      points = JSON.parse(el.dataset.points || '[]');
    } catch(e) { points = []; }

    const W = 600, H = 340;
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

    function draw() {
      ctx.clearRect(0, 0, W, H);

      if (points.length < 2) {
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('请提供至少2个数据点', W/2, H/2);
        return;
      }

      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const xMin = Math.min(...xs), xMax = Math.max(...xs);
      const yMin = Math.min(...ys), yMax = Math.max(...ys);
      const xPad = (xMax - xMin) * 0.1 || 1;
      const yPad = (yMax - yMin) * 0.1 || 1;
      const plotW = W - pad.left - pad.right;
      const plotH = H - pad.top - pad.bottom;

      const sx = x => pad.left + (x - (xMin - xPad)) / ((xMax - xMin) + 2*xPad) * plotW;
      const sy = y => pad.top + plotH - (y - (yMin - yPad)) / ((yMax - yMin) + 2*yPad) * plotH;

      // 网格
      ctx.strokeStyle = 'rgba(128,128,128,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const xPos = pad.left + (plotW / 5) * i;
        ctx.beginPath(); ctx.moveTo(xPos, pad.top); ctx.lineTo(xPos, pad.top + plotH); ctx.stroke();
        const yPos = pad.top + (plotH / 5) * i;
        ctx.beginPath(); ctx.moveTo(pad.left, yPos); ctx.lineTo(pad.left + plotW, yPos); ctx.stroke();
      }

      // 坐标轴
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH);
      ctx.stroke();

      // X轴刻度和标签
      ctx.fillStyle = '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      const xTicks = 5;
      for (let i = 0; i <= xTicks; i++) {
        const val = xMin - xPad + ((xMax - xMin) + 2*xPad) * (i / xTicks);
        const xPos = sx(val);
        ctx.beginPath(); ctx.moveTo(xPos, pad.top + plotH); ctx.lineTo(xPos, pad.top + plotH + 4); ctx.stroke();
        ctx.fillText(val.toFixed(1), xPos, pad.top + plotH + 16);
      }

      // Y轴刻度和标签
      ctx.textAlign = 'right';
      const yTicks = 5;
      for (let i = 0; i <= yTicks; i++) {
        const val = yMin - yPad + ((yMax - yMin) + 2*yPad) * (i / yTicks);
        const yPos = sy(val);
        ctx.beginPath(); ctx.moveTo(pad.left - 4, yPos); ctx.lineTo(pad.left, yPos); ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillText(val.toFixed(1), pad.left - 8, yPos + 4);
      }

      // 轴标签
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(xlabel, pad.left + plotW/2, H - 8);
      ctx.save();
      ctx.translate(14, pad.top + plotH/2);
      ctx.rotate(-Math.PI/2);
      ctx.fillText(ylabel, 0, 0);
      ctx.restore();

      // 标题
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#222';
      ctx.textAlign = 'center';
      ctx.fillText(title, pad.left + plotW/2, 20);

      // 散点
      ctx.fillStyle = '#569cd6';
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 回归线（5+点）
      if (points.length >= 5) {
        const n = xs.length;
        const sumX = xs.reduce((a,b)=>a+b,0);
        const sumY = ys.reduce((a,b)=>a+b,0);
        const sumXY = xs.reduce((s,x,i)=>s+x*ys[i],0);
        const sumX2 = xs.reduce((s,x)=>s+x*x,0);
        const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
        const intercept = (sumY - slope*sumX) / n;

        // r 计算
        const meanX = sumX / n, meanY = sumY / n;
        const numR = xs.reduce((s,x,i)=>s+(x-meanX)*(ys[i]-meanY),0);
        const denR = Math.sqrt(xs.reduce((s,x)=>s+(x-meanX)**2,0) * ys.reduce((s,y)=>s+(y-meanY)**2,0));
        const r = numR / denR;
        card.querySelector('[data-r]').textContent = r.toFixed(4);

        // 回归线
        const x1 = xMin - xPad, x2 = xMax + xPad;
        ctx.strokeStyle = '#f9826c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx(x1), sy(slope*x1+intercept));
        ctx.lineTo(sx(x2), sy(slope*x2+intercept));
        ctx.stroke();
      }
    }

    draw();
  }

  // ── PCA 碎石图 ─────────────────────────────────────
  // <div class="stat-viz" data-type="pca" data-eigenvalues="[4.2, 2.1, 1.3, 0.8, 0.4, 0.2]"></div>
  function renderScreePlot(el) {
    let eigenvalues = [];
    try {
      eigenvalues = JSON.parse(el.dataset.eigenvalues || '[]');
    } catch(e) { eigenvalues = []; }
    
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
      ctx.fillStyle = 'rgba(30,30,30,0.03)';
      ctx.fillRect(0, 0, W, H);

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

      // Kaiser 线
      const kaiserY = syEv(1);
      ctx.strokeStyle = '#f9826c';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, kaiserY);
      ctx.lineTo(pad.left + plotW, kaiserY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f9826c';
      ctx.font = '11px sans-serif';
      ctx.fillText('λ=1 (Kaiser)', pad.left + plotW - 75, kaiserY - 5);

      // 绘制柱子和标签
      ctx.textAlign = 'center';
      eigenvalues.forEach((ev, i) => {
        const x = sx(i);
        const barH = syEv(0) - syEv(ev);
        const pct = ev / totalVar * 100;
        const colorIntensity = 0.3 + 0.7 * (cumPct[i] / 100);
        ctx.fillStyle = `rgba(86, 156, 214, ${colorIntensity})`;
        ctx.fillRect(x, syEv(ev), barW, barH);
        
        // PC 标签
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`PC${i+1}`, x + barW/2, pad.top + plotH + 18);
        // 特征值
        ctx.font = '10px sans-serif';
        ctx.fillText(ev.toFixed(2), x + barW/2, syEv(ev) - 4);
        // 累积方差%
        ctx.fillStyle = '#c586c0';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${cumPct[i].toFixed(0)}%`, x + barW/2, syCum(cumPct[i]) - 4);

        // Kaiser 标记
        if (ev > 1) {
          ctx.fillStyle = '#4ec9b0';
          ctx.beginPath();
          ctx.arc(x + barW/2, syEv(ev) - 10, 4, 0, Math.PI*2);
          ctx.fill();
        }
      });

      // 累积方差折线
      ctx.beginPath();
      ctx.strokeStyle = '#c586c0';
      ctx.lineWidth = 2;
      eigenvalues.forEach((ev, i) => {
        const x = sx(i) + barW/2;
        const y = syCum(cumPct[i]);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 圆点
      eigenvalues.forEach((ev, i) => {
        const x = sx(i) + barW/2;
        const y = syCum(cumPct[i]);
        ctx.fillStyle = '#c586c0';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI*2);
        ctx.fill();
      });

      // Y轴标签
      ctx.fillStyle = '#569cd6';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('特征值', 15, pad.top + 15);
      ctx.fillStyle = '#c586c0';
      ctx.fillText('累积%', 15, pad.top + 30);
    }

    draw();
  }

  // ── ANOVA 组间差异比较 ─────────────────────────────
  // <div class="stat-viz" data-type="anova" data-means="[10.5,13.2,15.8]" data-sds="[2.1,2.4,1.9]" data-ns="[30,30,30]" data-labels='["低剂量","中剂量","高剂量"]'></div>
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

    const W = 600, H = 320;
    const k = means.length;
    const se = sds.map((s, i) => s / Math.sqrt(ns[i]));
    const dfWithin = ns.reduce((a,b)=>a+b,0) - k;
    const alpha = 0.05;

    // 计算 ANOVA 表
    const grandMean = means.reduce((s, m, i) => s + m * ns[i], 0) / ns.reduce((a,b)=>a+b, 0);
    const ssBetween = means.reduce((s, m, i) => s + ns[i] * (m - grandMean)**2, 0);
    const ssWithin = sds.reduce((s, sd, i) => s + (ns[i]-1) * sd**2, 0);
    const msBetween = ssBetween / (k - 1);
    const msWithin = ssWithin / dfWithin;
    const Fstat = msBetween / msWithin;
    let pVal = NaN;
    if (window.jStat && window.jStat.ftest) {
      pVal = 1 - jStat.ftest.cdf(Fstat, k-1, dfWithin);
    }

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

      // 网格
      ctx.strokeStyle = 'rgba(128,128,128,0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = pad.top + (plotH/5)*i;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
      }

      // 误差棒 (95% CI)
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

        // 柱子
        const color = `hsl(${200 + i * 30}, 60%, 55%)`;
        ctx.fillStyle = color;
        ctx.fillRect(sx(i), sy(m), barW, sy(0) - sy(m));

        // 均值标签
        ctx.fillStyle = '#333';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`$\\bar{x}=${m.toFixed(2)}$`, sx(i) + barW/2, sy(m) - 10);

        // 组名
        ctx.font = '11px sans-serif';
        ctx.fillText(labels[i] || `组${i+1}`, sx(i) + barW/2, pad.top + plotH + 18);
      });

      // Y轴
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH);
      ctx.stroke();
    }

    draw();

    // ANOVA 表
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

  // ── F 分布探索器 ─────────────────────────────────
  // <div class="stat-viz" data-type="fdist" data-df1="2" data-df2="87"></div>
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
      if (window.jStat && window.jStat.ftest) return window.jStat.ftest.pdf(x, d1, d2);
      // Fallback approximation
      if (x <= 0) return 0;
      const c = d1 > 0 && d2 > 0 ? (d1*x)**d1 * d2**d2 / (d1*x + d2)**(d1+d2) : 0;
      return c / x * (1 / jStat.beta ? jStat.beta.fn(d1/2, d2/2) : 1);
    }

    function draw(d1, d2) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(30,30,30,0.03)';
      ctx.fillRect(0, 0, W, H);

      // 计算 F 临界值
      let fCrit = 3.0;
      if (window.jStat && window.jStat.ftest) {
        fCrit = jStat.ftest.inv(1 - alpha, d1, d2);
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
      ctx.moveTo(pad.left || 0, 0); ctx.lineTo(pad.left || 0, H); ctx.lineTo(W, H);
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

  // ── Kaplan-Meier 生存曲线 ────────────────────────────
  // <div class="stat-viz" data-type="km" data-times="[3,5,8,12,15,20,25]" data-status="[1,1,0,1,0,1,0]" data-title="Kaplan-Meier 生存曲线"></div>
  // times: 生存时间，status: 1=事件发生(死亡)，0=截尾
  function renderKM(el) {
    const times = JSON.parse(el.dataset.times || '[3,5,8,12,15,20,25]');
    const status = JSON.parse(el.dataset.status || '[1,1,0,1,0,1,0]');
    const title = el.dataset.title || 'Kaplan-Meier 生存曲线';

    el.innerHTML = `
      <div class="viz-card">
        <div class="viz-header">📊 ${title}</div>
        <div class="viz-body">
          <canvas class="viz-canvas" style="width:100%;max-width:640px;height:300px;display:block;margin:0 auto;"></canvas>
        </div>
        <div class="viz-result" style="text-align:center;font-size:13px;padding:6px;color:#555;background:#f8f9fa;border-top:1px solid #eee;"></div>
      </div>
    `;

    const canvas = el.querySelector('canvas');
    const resultDiv = el.querySelector('.viz-result');

    function draw() {
      const ctx = canvas.getContext('2d');
      const W = canvas.offsetWidth * 2, H = 600;
      canvas.width = W; canvas.height = H;
      const pad = { l: 60, r: 30, t: 30, b: 55 };
      const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

      ctx.clearRect(0, 0, W, H);

      // Compute KM curve
      const n = times.length;
      let surv = 1.0;
      const steps = [{ t: 0, s: 1 }];
      for (let i = 0; i < n; i++) {
        if (status[i] === 1) {
          const d = status.slice(0, i + 1).filter(s => s === 1).length;
          const atRisk = n - i;
          surv *= (atRisk - 1) / atRisk;
        }
        steps.push({ t: times[i], s: surv });
      }
      const lastS = steps[steps.length - 1].s;

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b);
      ctx.stroke();
      ctx.fillStyle = '#555'; ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('生存时间', W / 2, H - 6);
      ctx.save(); ctx.translate(16, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('生存概率 S(t)', 0, 0); ctx.restore();

      // Grid
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (i / 4) * ih;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
        ctx.fillStyle = '#666'; ctx.font = '18px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText((1 - i * 0.25).toFixed(2), pad.l - 6, y + 6);
      }

      // Step function
      ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t + ih * (1 - steps[0].s));
      for (let i = 1; i < steps.length; i++) {
        const x = pad.l + (steps[i].t / times[n - 1]) * iw;
        const prevY = pad.t + ih * (1 - steps[i - 1].s);
        ctx.lineTo(x, prevY);
        const currY = pad.t + ih * (1 - steps[i].s);
        ctx.lineTo(x, currY);
      }
      ctx.stroke();

      // Censored marks (vertical ticks on the step)
      for (let i = 0; i < n; i++) {
        if (status[i] === 0) {
          const tIdx = steps.findIndex(s => s.t === times[i]);
          const x = pad.l + (times[i] / times[n - 1]) * iw;
          const y = pad.t + ih * (1 - steps[tIdx].s);
          ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke();
        }
      }

      // Median survival (S=0.5 line)
      const medianY = pad.t + ih * 0.5;
      ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(pad.l, medianY); ctx.lineTo(W - pad.r, medianY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#27ae60'; ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('S=0.5', W - pad.r - 50, medianY - 4);

      // Legend
      ctx.fillStyle = '#2980b9'; ctx.fillRect(pad.l + 10, pad.t + 8, 20, 3);
      ctx.fillStyle = '#555'; ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('生存曲线', pad.l + 38, pad.t + 12);
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pad.l + 10, pad.t + 24); ctx.lineTo(pad.l + 30, pad.t + 24); ctx.stroke();
      ctx.fillStyle = '#555';
      ctx.fillText('截尾', pad.l + 38, pad.t + 28);

      // Result text
      const events = status.filter(s => s === 1).length;
      const censored = n - events;
      // Median survival time: find when S(t) <= 0.5 first
      let medianSurv = 'N/A';
      let accSurv = 1.0;
      for (let i = 0; i < n; i++) {
        if (status[i] === 1) {
          const d = status.slice(0, i + 1).filter(s => s === 1).length;
          const atRisk = n - i;
          accSurv *= (atRisk - 1) / atRisk;
        }
        if (accSurv <= 0.5) { medianSurv = times[i]; break; }
      }
      resultDiv.innerHTML = `n=${n} &nbsp;|&nbsp; 事件数=${events} &nbsp;|&nbsp; 截尾数=${censored} &nbsp;|&nbsp; 中位生存时间=${medianSurv}`;
    }

    draw();
  }

  // ── 泊松分布可视化 ──────────────────────────────────
  // <div class="stat-viz" data-type="poisson" data-lambda="5" data-title="泊松分布 P(λ)"></div>
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

  // ── 主入口 ─────────────────────────────────────────
  function init() {
    document.querySelectorAll('.stat-viz, .stat-calc').forEach(el => {
      if (el.dataset.rendered) return;
      el.dataset.rendered = 'true';
      try {
        if (el.dataset.type === 'normal') renderNormalDistribution(el);
        else if (el.dataset.type === 'tcompare') renderTCompare(el);
        else if (el.dataset.type === 'pvalue') renderPValue(el);
        else if (el.dataset.type === 'scatter') renderScatterPlot(el);
        else if (el.dataset.type === 'ttest') renderTTest(el);
        else if (el.dataset.type === 'chisq') renderChiSq(el);
        else if (el.dataset.type === 'pca') renderScreePlot(el);
        else if (el.dataset.type === 'anova') renderANOVA(el);
        else if (el.dataset.type === 'fdist') renderFDist(el);
        else if (el.dataset.type === 'binom') renderBinomial(el);
        else if (el.dataset.type === 'poisson') renderPoisson(el);
        else if (el.dataset.type === 'km') renderKM(el);
      } catch(e) { console.error('stats-viz error:', e); }
    });
  }

  // DOMContentLoaded 之后运行（但章节内容是 fetch 后才注入，需要用 MutationObserver）
  function setupObserver() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            node.querySelectorAll && node.querySelectorAll('.stat-viz, .stat-calc').forEach(el => {
              if (!el.dataset.rendered) {
                el.dataset.rendered = 'true';
                try {
                  if (el.dataset.type === 'normal') renderNormalDistribution(el);
                  else if (el.dataset.type === 'tcompare') renderTCompare(el);
                  else if (el.dataset.type === 'pvalue') renderPValue(el);
                  else if (el.dataset.type === 'scatter') renderScatterPlot(el);
                  else if (el.dataset.type === 'ttest') renderTTest(el);
                  else if (el.dataset.type === 'chisq') renderChiSq(el);
                  else if (el.dataset.type === 'pca') renderScreePlot(el);
                  else if (el.dataset.type === 'anova') renderANOVA(el);
                  else if (el.dataset.type === 'fdist') renderFDist(el);
                  else if (el.dataset.type === 'binom') renderBinomial(el);
                  else if (el.dataset.type === 'poisson') renderPoisson(el);
                  else if (el.dataset.type === 'km') renderKM(el);
                } catch(e) { console.error('stats-viz error:', e); }
              }
            });
          }
        });
      });
    });
    observer.observe(document.getElementById('chapter-content') || document.body, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();
    setupObserver();
  });
})();
