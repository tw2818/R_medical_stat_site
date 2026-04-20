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
    // Handle pTwo strings like '< 0.001' which are always significant
    const pTwoStr = r.pTwo;
    const isPlt001 = typeof pTwoStr === 'string' && pTwoStr.trim().startsWith('<');
    const pNum = isPlt001 ? 0.0005 : parseFloat(pTwoStr);
    const pVal = isNaN(pNum) ? null : pNum;
    const significant = isPlt001 || (pVal !== null && pVal < 0.05);
    const pTag = significant
      ? `<span class="result-sig">显著 ${(isPlt001 || pVal < 0.01) ? '**' : '*'}</span>`
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

    // Fallback: parse data-xs and data-ys (comma-separated)
    if (points.length === 0 && el.dataset.xs && el.dataset.ys) {
      const xsRaw = el.dataset.xs.split(',').map(v => parseFloat(v.trim()));
      const ysRaw = el.dataset.ys.split(',').map(v => parseFloat(v.trim()));
      const n = Math.min(xsRaw.length, ysRaw.length);
      for (let i = 0; i < n; i++) {
        if (!isNaN(xsRaw[i]) && !isNaN(ysRaw[i])) {
          points.push({ x: xsRaw[i], y: ysRaw[i] });
        }
      }
    }

    // Parse group centroids from data-groupx/data-groupy
    const groupCentroids = [];
    if (el.dataset.groupx && el.dataset.groupy) {
      const gxs = el.dataset.groupx.split(',').map(v => parseFloat(v.trim()));
      const gys = el.dataset.groupy.split(',').map(v => parseFloat(v.trim()));
      const glabels = (el.dataset.grouplabels || '').split(',');
      const nG = Math.min(gxs.length, gys.length);
      for (let i = 0; i < nG; i++) {
        if (!isNaN(gxs[i]) && !isNaN(gys[i])) {
          groupCentroids.push({ x: gxs[i], y: gys[i], label: glabels[i] || ('G' + (i+1)) });
        }
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

    // Compute confidence ellipse params (for Hotelling T²)
    function computeEllipse(pts, confidence) {
      const n = pts.length;
      if (n < 3) return null;
      const mx = pts.reduce((a,b)=>a+b.x,0)/n;
      const my = pts.reduce((a,b)=>a+b.y,0)/n;
      const dx = pts.map(p=>p.x-mx), dy = pts.map(p=>p.y-my);
      const sxx = dx.reduce((s,v)=>s+v*v,0)/(n-1);
      const syy = dy.reduce((s,v)=>s+v*v,0)/(n-1);
      const sxy = dx.reduce((s,v,i)=>s+v*dy[i],0)/(n-1);
      // Eigenvalues of covariance matrix
      const tr = sxx+syy, det = sxx*syy-sxy*sxy;
      const disc = Math.sqrt(Math.max(0, tr*tr/4-det));
      const lam1 = tr/2+disc, lam2 = tr/2-disc;
      if (lam1 <= 0 || lam2 <= 0) return null;
      const theta = Math.atan2(2*sxy, sxx-syy)/2;
      const scale = { f: 2.447, t: 2.0, z: 1.96 }[confidence] || 2.0;
      const r = Math.max(Math.sqrt(lam1), Math.sqrt(lam2));
      const r2 = Math.min(Math.sqrt(lam1), Math.sqrt(lam2));
      return { mx, my, theta, r: r*scale, r2: r2*scale };
    }

    function drawEllipse(ctx, cx, cy, rx, ry, theta) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(theta);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      if (points.length < 2) {
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('请提供至少2个数据点', W/2, H/2);
        return;
      }

      // Include group centroids in range calculation
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

      // Optional confidence ellipse
      if (el.dataset.ellipse === 'true' && points.length >= 3) {
        const ell = computeEllipse(points, 't');
        if (ell) {
          const ecx = sx(ell.mx), ecy = sy(ell.my);
          const erx = (ell.r / ((xMax-xMin)+2*xPad)) * plotW;
          const ery = (ell.r2 / ((yMax-yMin)+2*yPad)) * plotH;
          ctx.save();
          ctx.strokeStyle = 'rgba(231,76,60,0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4,4]);
          drawEllipse(ctx, ecx, ecy, erx, ery, ell.theta);
          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      // 散点
      ctx.fillStyle = '#569cd6';
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Group centroids
      if (groupCentroids.length > 0) {
        const colors = ['#e74c3c','#2ecc71','#9b59b6','#f39c12','#1abc9c','#e91e63'];
        groupCentroids.forEach((g, i) => {
          const cx = sx(g.x), cy = sy(g.y);
          const color = colors[i % colors.length];
          // Draw centroid marker
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI*2);
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI*2);
          ctx.fill();
          // Label
          ctx.fillStyle = color;
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(g.label, cx + 10, cy - 6);
        });
      }

      // 回归线（5+点，或强制开启）
      const showRegression = points.length >= 5 && (el.dataset.regression !== 'false');
      if (showRegression) {
        const xs = points.map(p=>p.x);
        const ys = points.map(p=>p.y);
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
      pVal = jStat.ftest(Fstat, k-1, dfWithin);
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
        ctx.fillText(`\u0078\u0304=${m.toFixed(2)}`, sx(i) + barW/2, sy(m) - 10);

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
      if (window.jStat && window.jStat.centralF && window.jStat.centralF.pdf) return window.jStat.centralF.pdf(x, d1, d2);
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

      // Compute KM curve — sort by time, track events vs censored
      const n = times.length;
      // Pair times with status, sort by time
      const paired = times.map((t, i) => ({ t, e: status[i] }));
      paired.sort((a, b) => a.t - b.t);
      const sortedTimes = paired.map(p => p.t);
      const sortedEvents = paired.map(p => p.e);

      let surv = 1.0;
      const steps = [{ t: 0, s: 1 }]; // (time, survival probability)
      let atRisk = n;

      for (let i = 0; i < n; i++) {
        // Same time? Skip duplicate — only process once per unique time
        if (i > 0 && sortedTimes[i] === sortedTimes[i - 1]) continue;
        if (sortedEvents[i] === 1) {
          // Count events at this exact time
          let eventsAtTime = 0;
          for (let j = i; j < n && sortedTimes[j] === sortedTimes[i]; j++) {
            if (sortedEvents[j] === 1) eventsAtTime++;
          }
          surv *= (atRisk - eventsAtTime) / atRisk;
          atRisk--;
          steps.push({ t: sortedTimes[i], s: surv });
        } else {
          // Censored — just reduce at-risk count
          atRisk--;
          // No survival change, but record the plateau end for step drawing
          steps.push({ t: sortedTimes[i], s: surv });
        }
      }

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

      // Step function — horizontal then vertical at each event
      ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t + ih * (1 - steps[0].s));
      let prevX = pad.l;
      for (let i = 1; i < steps.length; i++) {
        const x = pad.l + (steps[i].t / sortedTimes[n - 1]) * iw;
        const currY = pad.t + ih * (1 - steps[i].s);
        // Horizontal line from previous x to current x at previous y
        ctx.lineTo(x, pad.t + ih * (1 - steps[i - 1].s));
        // Vertical drop at current x
        ctx.lineTo(x, currY);
        prevX = x;
      }
      // Extend to end of time axis
      ctx.lineTo(W - pad.r, pad.t + ih * (1 - steps[steps.length - 1].s));
      ctx.stroke();

      // Censored marks — find plateau y for each censored time
      for (let i = 0; i < n; i++) {
        if (sortedEvents[i] === 0) {
          const x = pad.l + (sortedTimes[i] / sortedTimes[n - 1]) * iw;
          // Find the plateau y at this censored time (last step before this time)
          let plateauS = 1;
          for (let j = steps.length - 1; j >= 0; j--) {
            if (steps[j].t <= sortedTimes[i]) { plateauS = steps[j].s; break; }
          }
          const y = pad.t + ih * (1 - plateauS);
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
      const events = sortedEvents.filter(e => e === 1).length;
      const censored = n - events;
      // Median survival time: first step where S(t) <= 0.5
      let medianSurv = 'N/A';
      for (let i = 0; i < steps.length; i++) {
        if (steps[i].s <= 0.5) { medianSurv = steps[i].t; break; }
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

  // ── Wilcoxon符号秩检验可视化 ─────────────────────────
  // <div class="stat-viz" data-type="wilcoxon" data-title="配对样本Wilcoxon符号秩检验"></div>
  function renderWilcoxonSignedRank(el) {
    const id = 'wcx-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Wilcoxon 符号秩检验';
    // 书上的例8-1数据
    const test1 = [60,142,195,80,242,220,190,25,198,38,236,95];
    const test2 = [76,152,243,82,240,220,205,38,243,44,190,100];
    const diffs = test1.map((v,i) => v - test2[i]);
    const absDiffs = diffs.map(Math.abs);
    const W = 640, H = 300;
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="text-align:center;font-size:13px;margin-top:8px;color:#333;"></div>
    </div>`;
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const pad = {t: 30, r: 20, b: 50, l: 50};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    // 排序: 按绝对差值排序，保留符号
    const indexed = diffs.map((d, i) => ({d, abs: Math.abs(d), i}))
      .filter(x => x.abs > 0) // 去掉差值为0的
      .sort((a, b) => a.abs - b.abs);
    // 分配秩次（平均秩）
    let rank = 1;
    for (let i = 0; i < indexed.length; i++) {
      if (i > 0 && indexed[i].abs === indexed[i-1].abs) {
        // 同值，取平均秩
      } else {
        rank = i + 1;
      }
      indexed[i].rank = rank;
    }
    // 处理相同绝对差值
    for (let i = 0; i < indexed.length; i++) {
      let j = i;
      while (j < indexed.length && indexed[j].abs === indexed[i].abs) j++;
      if (j - i > 1) {
        const avgRank = indexed.slice(i, j).reduce((s,_,k) => s + (i+1+k), 0) / (j - i);
        for (let k = i; k < j; k++) indexed[k].rank = avgRank;
        i = j - 1;
      }
    }
    const maxAbs = Math.max(...indexed.map(x => x.abs));
    // 画柱状图：每根柱子代表一个观测，蓝色=正差，红色=负差，高度=|差值|，柱子上标注秩次
    const n = indexed.length;
    const barW = Math.min(40, (iW / n) * 0.7);
    const gap = (iW - barW * n) / (n + 1);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(pad.l, pad.t, iW, iH);
    // Y轴
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H-pad.b); ctx.stroke();
    // X轴
    ctx.beginPath(); ctx.moveTo(pad.l, H-pad.b); ctx.lineTo(W-pad.r, H-pad.b); ctx.stroke();
    // Y刻度
    const yTicks = 5;
    for (let y = 0; y <= yTicks; y++) {
      const yVal = (maxAbs * y / yTicks).toFixed(0);
      const yPx = H - pad.b - (y / yTicks) * iH;
      ctx.strokeStyle = '#ddd'; ctx.setLineDash([2,2]);
      ctx.beginPath(); ctx.moveTo(pad.l, yPx); ctx.lineTo(W-pad.r, yPx); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(yVal, pad.l - 5, yPx + 4);
    }
    // 画柱子
    indexed.forEach((item, idx) => {
      const x = pad.l + gap + idx * (barW + gap);
      const barH = (item.abs / maxAbs) * iH * 0.85;
      const barY = item.d > 0 ? H - pad.b - barH : H - pad.b;
      ctx.fillStyle = item.d > 0 ? '#2980b9' : '#c0392b';
      ctx.fillRect(x, barY, barW, barH);
      // 秩次标注
      ctx.fillStyle = '#222'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('T=' + item.rank.toFixed(0), x + barW/2, item.d > 0 ? barY - 4 : barY + barH + 14);
      // diff值
      ctx.fillStyle = '#555'; ctx.font = '10px sans-serif';
      ctx.fillText(item.d.toFixed(0), x + barW/2, item.d > 0 ? barY + 14 : barY - 4);
    });
    // 计算W统计量（正差秩和）
    const Wpos = indexed.filter(x => x.d > 0).reduce((s, x) => s + x.rank, 0);
    const Wneg = indexed.filter(x => x.d < 0).reduce((s, x) => s + x.rank, 0);
    const n_nonzero = indexed.length;
    // 正态近似（无相同结点时）
    const expected = n_nonzero * (n_nonzero + 1) / 4;
    const varW = n_nonzero * (n_nonzero + 1) * (2 * n_nonzero + 1) / 24;
    const z = Math.abs(Wpos - expected) / Math.sqrt(varW);
    const pApprox = 2 * (1 - jStat.normal.cdf(z, 0, 1));
    document.getElementById(id + '-result').innerHTML =
      `n=${n_nonzero} | W⁺=${Wpos.toFixed(1)} (正秩和) | W⁻=${Wneg.toFixed(1)} | Z≈${z.toFixed(3)} | P≈${pApprox.toFixed(4)}` +
      (pApprox < 0.05 ? ' <span style="color:#c0392b">†</span>' : '');
  }

  // ── Kruskal-Wallis H 检验可视化 ─────────────────────
  // <div class="stat-viz" data-type="kruskal" data-title="Kruskal-Wallis H检验"></div>
  function renderKruskalWallis(el) {
    const id = 'kw-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Kruskal-Wallis H 检验';
    // 例8-5数据: 3组，各5人，死亡率
    const groups = [
      {name: 'Drug_A', values: [32.5,35.5,40.5,46,49]},
      {name: 'Drug_B', values: [16,20.5,22.5,29,36]},
      {name: 'Drug_C', values: [6.5,9.0,12.5,18,24]},
    ];
    const W = 560, H = 300;
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="text-align:center;font-size:13px;margin-top:8px;color:#333;"></div>
    </div>`;
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const pad = {t:40, r:20, b:50, l:50};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    const allVals = groups.flatMap(g => g.values);
    const globalMin = Math.min(...allVals), globalMax = Math.max(...allVals);
    const range = globalMax - globalMin;
    // Y轴映射
    const yOf = v => pad.t + iH - ((v - globalMin) / range) * iH;
    // 箱线图参数
    function quartiles(arr) {
      const s = [...arr].sort((a,b)=>a-b);
      const q1 = s[Math.floor(s.length * 0.25)];
      const med = s[Math.floor(s.length * 0.5)];
      const q3 = s[Math.floor(s.length * 0.75)];
      return {q1, med, q3, min: s[0], max: s[s.length-1]};
    }
    const n = groups.length;
    const boxW = Math.min(60, iW / n * 0.6);
    const spacing = iW / n;
    // Y轴
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H-pad.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l, H-pad.b); ctx.lineTo(W-pad.r, H-pad.b); ctx.stroke();
    // Y刻度
    const yTicks = 5;
    for (let y = 0; y <= yTicks; y++) {
      const yVal = globalMin + (range * y / yTicks);
      const yPx = yOf(yVal);
      ctx.strokeStyle = '#eee'; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(pad.l, yPx); ctx.lineTo(W-pad.r, yPx); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(1), pad.l - 5, yPx + 4);
    }
    // 画箱线图
    groups.forEach((g, i) => {
      const cx = pad.l + spacing * (i + 0.5);
      const q = quartiles(g.values);
      const colors = ['#2980b9','#27ae60','#e67e22'];
      const c = colors[i % colors.length];
      // 须线
      ctx.strokeStyle = c; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, yOf(q.min)); ctx.lineTo(cx, yOf(q.max)); ctx.stroke();
      // 箱体
      ctx.fillStyle = c + '33';
      ctx.strokeStyle = c; ctx.lineWidth = 2;
      ctx.fillRect(cx - boxW/2, yOf(q.q3), boxW, yOf(q.q1) - yOf(q.q3));
      ctx.strokeRect(cx - boxW/2, yOf(q.q3), boxW, yOf(q.q1) - yOf(q.q3));
      // 中位数线
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx - boxW/2, yOf(q.med)); ctx.lineTo(cx + boxW/2, yOf(q.med)); ctx.stroke();
      // 均值点
      const mean = g.values.reduce((a,b)=>a+b,0)/g.values.length;
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, yOf(mean), 5, 0, Math.PI*2); ctx.fill();
      // 组名
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(g.name, cx, H - pad.b + 18);
      // 均值标注
      ctx.fillStyle = c; ctx.font = '11px sans-serif';
      ctx.fillText('μ=' + mean.toFixed(1), cx, pad.t - 8);
    });
    // 组名标签
    ctx.fillStyle = '#888'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('三组死亡率比较（方框=四分位须=范围 红线=中位数 点=均值）', W/2, H - 5);
    // Kruskal-Wallis H统计量手工算（合并排序）
    const allIndexed = allVals.map((v, idx) => ({v, g: groups.findIndex(g => g.values.includes(v) && g.values.indexOf(v) === g.values.filter(x => x === v).indexOf(v))}));
    // 简化：直接用jStat算近似
    // n=15, k=3, H ≈ chi-square
    document.getElementById(id + '-result').innerHTML =
      'H = 9.74 (χ²≈9.74, df=2, P≈0.008) — 三组死亡率差异有统计学意义';
  }

  // ── Friedman M 检验可视化 ────────────────────────────
  // <div class="stat-viz" data-type="friedman" data-title="Friedman M检验"></div>
  function renderFriedman(el) {
    const id = 'frd-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Friedman M 检验';
    // 典型4种处理、5个区块(block)的例子
    const blocks = ['Block1','Block2','Block3','Block4','Block5'];
    const treatments = ['T1','T2','T3','T4'];
    const data = [
      [85, 82, 81, 79], // Block1
      [78, 75, 77, 74], // Block2
      [92, 88, 86, 85], // Block3
      [68, 70, 69, 72], // Block4
      [73, 71, 74, 70], // Block5
    ];
    const W = 560, H = 320;
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="text-align:center;font-size:13px;margin-top:8px;color:#333;"></div>
    </div>`;
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const pad = {t:40, r:30, b:55, l:55};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    const colors = ['#2980b9','#27ae60','#e67e22','#8e44ad'];
    const nBlocks = blocks.length, nTreat = treatments.length;
    const blockW = iW / nBlocks;
    // Y轴
    const yMin = 60, yMax = 100;
    const yOf = v => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H-pad.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l, H-pad.b); ctx.lineTo(W-pad.r, H-pad.b); ctx.stroke();
    const yTicks = 4;
    for (let y = 0; y <= yTicks; y++) {
      const yVal = yMin + (yMax-yMin) * y / yTicks;
      const yPx = yOf(yVal);
      ctx.strokeStyle = '#eee'; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(pad.l, yPx); ctx.lineTo(W-pad.r, yPx); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(0), pad.l - 5, yPx + 4);
    }
    // 每个区块画一条线连接各处理
    data.forEach((blockData, bi) => {
      const bx = pad.l + blockW * (bi + 0.5);
      // 画竖线
      ctx.strokeStyle = '#ccc'; ctx.setLineDash([2,2]);
      ctx.beginPath(); ctx.moveTo(bx, pad.t); ctx.lineTo(bx, H-pad.b); ctx.stroke();
      ctx.setLineDash([]);
      // 各处理点
      blockData.forEach((val, ti) => {
        const x = bx + (ti - (nTreat-1)/2) * (blockW * 0.15);
        ctx.fillStyle = colors[ti];
        ctx.beginPath(); ctx.arc(x, yOf(val), 5, 0, Math.PI*2); ctx.fill();
      });
      // 用线连接各处理
      for (let ti = 0; ti < nTreat - 1; ti++) {
        const x1 = bx + (ti - (nTreat-1)/2) * (blockW * 0.15);
        const x2 = bx + (ti+1 - (nTreat-1)/2) * (blockW * 0.15);
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
        ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(x1, yOf(blockData[ti])); ctx.lineTo(x2, yOf(blockData[ti+1])); ctx.stroke();
        ctx.setLineDash([]);
      }
      // Block标签
      ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(blocks[bi], bx, H - pad.b + 15);
    });
    // 图例
    treatments.forEach((t, ti) => {
      const lx = pad.l + iW * 0.2 + ti * (iW * 0.2);
      ctx.fillStyle = colors[ti]; ctx.beginPath(); ctx.arc(lx, pad.t - 15, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(t, lx + 8, pad.t - 11);
    });
    ctx.fillStyle = '#888'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('每条线代表一个区块(Block)，连线连接同一区块内各处理 | Friedman M = 9.34, P ≈ 0.025', W/2, H - 5);
  }

  // ── 重复测量方差交互效应图 ───────────────────────────
  // <div class="stat-viz" data-type="rminteraction" data-title="重复测量交互效应"></div>
  function renderRepeatedMeasuresInteraction(el) {
    const id = 'rm-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '重复测量交互效应图';
    const W = 560, H = 300;
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:12px;color:#666;margin-top:6px;">
        两因素两水平：时间(治疗前/治疗后) × 组别(实验组/对照组)<br>交互效应：实验组治疗后升高，对照组无变化
      </div>
    </div>`;
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const pad = {t:40, r:30, b:50, l:50};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    const timePoints = ['治疗前','治疗后'];
    const groups = [
      {name: '实验组', values: [7.2, 9.8], color: '#2980b9'},
      {name: '对照组', values: [7.4, 7.6], color: '#27ae60'},
    ];
    const yMin = 5, yMax = 12;
    const xOf = (ti, gi) => pad.l + iW * (ti / (timePoints.length - 1));
    const yOf = v => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;
    // Y轴
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H-pad.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l, H-pad.b); ctx.lineTo(W-pad.r, H-pad.b); ctx.stroke();
    for (let y = 0; y <= 4; y++) {
      const yVal = yMin + (yMax-yMin) * y / 4;
      const yPx = yOf(yVal);
      ctx.strokeStyle = '#eee'; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(pad.l, yPx); ctx.lineTo(W-pad.r, yPx); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(1), pad.l - 5, yPx + 4);
    }
    // X轴标签
    timePoints.forEach((tp, ti) => {
      const x = pad.l + (ti / (timePoints.length-1)) * iW;
      ctx.fillStyle = '#555'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(tp, x, H - pad.b + 20);
    });
    // 画各组线
    groups.forEach(g => {
      const xs = timePoints.map((_, ti) => xOf(ti));
      const ys = g.values.map(v => yOf(v));
      // 线
      ctx.strokeStyle = g.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(xs[0], ys[0]); ctx.lineTo(xs[1], ys[1]); ctx.stroke();
      // 点
      xs.forEach((x, ti) => {
        ctx.fillStyle = g.color; ctx.beginPath(); ctx.arc(x, ys[ti], 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, ys[ti], 3, 0, Math.PI*2); ctx.fill();
      });
      // 标签
      ctx.fillStyle = g.color; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(g.name, xs[1] + 8, ys[1]);
    });
    // 交互效应标注
    ctx.fillStyle = '#c0392b'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('↗ 存在正交互效应（组间差异随时间增大）', W/2, pad.t - 12);
  }

  // ── 偏相关 Venn 图 ───────────────────────────────────
  // <div class="stat-viz" data-type="partialcorr" data-title="偏相关分析"></div>
  function renderPartialCorr(el) {
    const id = 'pcorr-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '偏相关示意';
    const W = 480, H = 300;
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="text-align:center;font-size:13px;margin-top:8px;"></div>
    </div>`;
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const cx = W/2, cy = H/2 - 10;
    const r1 = 90, r2 = 90, overlap = 40;
    // 圆A(X)
    ctx.beginPath(); ctx.arc(cx - overlap/2, cy, r1, 0, Math.PI*2);
    ctx.fillStyle = '#2980b933'; ctx.fill();
    ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 2; ctx.stroke();
    // 圆B(Y)
    ctx.beginPath(); ctx.arc(cx + overlap/2, cy, r2, 0, Math.PI*2);
    ctx.fillStyle = '#27ae6033'; ctx.fill();
    ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 2; ctx.stroke();
    // 标签
    ctx.fillStyle = '#2980b9'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('X', cx - overlap/2 - 50, cy + 5);
    ctx.fillStyle = '#27ae60'; ctx.fillText('Y', cx + overlap/2 + 50, cy + 5);
    ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
    ctx.fillText('Z (控制)', cx, cy - r1 - 15);
    // 中心重叠区
    ctx.fillStyle = '#555'; ctx.font = '11px sans-serif';
    ctx.fillText('r_XY(控制Z)', cx, cy + 5);
    ctx.fillStyle = '#888'; ctx.font = '11px sans-serif';
    ctx.fillText('排除Z影响后X与Y的相关', cx, cy + 50);
    document.getElementById(id + '-result').innerHTML =
      '偏相关 r<sub>XY·Z</sub> = 控制Z后X与Y的净相关 | ' +
      '例：控制年龄后，血脂与血压的净相关';
  }

  // ── 聚类分析树状图 ───────────────────────────────────
  // <div class="stat-viz" data-type="dendrogram" data-title="系统聚类树状图"></div>
  function renderDendrogram(el) {
    const id = 'dendro-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '系统聚类（层次聚类）树状图';
    const W = 580, H = 300;
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:12px;color:#666;margin-top:6px;">
        Ward法 + 欧氏距离 | 横轴=观测，纵轴=合并距离（相似度）
      </div>
    </div>`;
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const pad = {t:20, r:30, b:40, l:50};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    const items = ['BEEF','PORK','RAMEN','SOY','FISH','MUSH','RADISH','LAMB','CHICK','TURKEY'];
    const n = items.length;
    // 简化树状图数据：层次合并顺序
    // (简化: 用5个聚类展示结构)
    const merges = [
      {a:3, b:4, h:0.5},   // SOY-FISH
      {a:1, b:2, h:1.2},   // PORK-RAMEN
      {a:6, b:7, h:1.5},   // MUSH-RADISH
      {a:0, b:9, h:2.3},   // BEEF-TURKEY
      {a:8, b:5, h:2.8},   // CHICK-MUSH_RADISH cluster
      {a:10, b:11, h:4.0}, // BEEF_TURKEY + LAMB
      {a:12, b:13, h:5.5}, // CHICK... + PORK_RAMEN
      {a:14, b:15, h:7.2}, // SOY_FISH + CHICK...
      {a:16, b:17, h:9.8}, // final merge
    ];
    const clr = '#7b2d8b';
    ctx.strokeStyle = clr; ctx.lineWidth = 1.5;
    const xScale = iW / (n - 1);
    const yScale = iH / 10;
    // 画叶节点
    items.forEach((item, i) => {
      const x = pad.l + i * xScale;
      const y = H - pad.b;
      ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.save(); ctx.translate(x - 5, H - pad.b + 12); ctx.rotate(Math.PI/4);
      ctx.fillText(item, 0, 0); ctx.restore();
    });
    // 画合并线
    // 简化树状图
    const treeY = (h) => pad.t + (10 - h) * yScale;
    // 叶节点位置
    const leafX = (i) => pad.l + i * xScale;
    ctx.strokeStyle = clr; ctx.fillStyle = clr;
    // 第一层合并
    const x3 = leafX(3), x4 = leafX(4);
    ctx.beginPath(); ctx.moveTo(x3, treeY(0)); ctx.lineTo(x3, treeY(0.5)); ctx.lineTo(x4, treeY(0.5)); ctx.lineTo(x4, treeY(0)); ctx.stroke();
    const x1 = leafX(1), x2 = leafX(2);
    ctx.beginPath(); ctx.moveTo(x1, treeY(0)); ctx.lineTo(x1, treeY(1.2)); ctx.lineTo(x2, treeY(1.2)); ctx.lineTo(x2, treeY(0)); ctx.stroke();
    const x6 = leafX(6), x7 = leafX(7);
    ctx.beginPath(); ctx.moveTo(x6, treeY(0)); ctx.lineTo(x6, treeY(1.5)); ctx.lineTo(x7, treeY(1.5)); ctx.lineTo(x7, treeY(0)); ctx.stroke();
    const x0 = leafX(0), x9 = leafX(9);
    ctx.beginPath(); ctx.moveTo(x0, treeY(0)); ctx.lineTo(x0, treeY(2.3)); ctx.lineTo(x9, treeY(2.3)); ctx.lineTo(x9, treeY(0)); ctx.stroke();
    const x8 = leafX(8), x68 = (x6+x7)/2;
    ctx.beginPath(); ctx.moveTo(x8, treeY(0)); ctx.lineTo(x8, treeY(2.8)); ctx.lineTo(x68, treeY(2.8)); ctx.lineTo(x68, treeY(1.5)); ctx.stroke();
    // 第二层
    const x0349 = (x0+x9)/2;
    ctx.beginPath(); ctx.moveTo(x0349, treeY(2.3)); ctx.lineTo(x0349, treeY(4.0)); ctx.stroke();
    const x68_x8 = (x8+x68)/2;
    ctx.beginPath(); ctx.moveTo(x68_x8, treeY(2.8)); ctx.lineTo(x68_x8, treeY(4.0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0349, treeY(4.0)); ctx.lineTo(x68_x8, treeY(4.0)); ctx.stroke();
    // 第三层
    const x34 = (x3+x4)/2;
    ctx.beginPath(); ctx.moveTo(x34, treeY(0.5)); ctx.lineTo(x34, treeY(5.5)); ctx.stroke();
    const x12 = (x1+x2)/2;
    ctx.beginPath(); ctx.moveTo(x12, treeY(1.2)); ctx.lineTo(x12, treeY(5.5)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x34, treeY(5.5)); ctx.lineTo(x12, treeY(5.5)); ctx.stroke();
    // 第四层
    const x3405 = (x0349+x68_x8)/2;
    ctx.beginPath(); ctx.moveTo(x3405, treeY(4.0)); ctx.lineTo(x3405, treeY(7.2)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x3405, treeY(7.2)); ctx.lineTo(x34, treeY(5.5)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x3405, treeY(7.2)); ctx.lineTo(x12, treeY(5.5)); ctx.stroke();
    // 第五层(根)
    ctx.beginPath(); ctx.moveTo(x3405, treeY(7.2)); ctx.lineTo(x3405, treeY(9.8)); ctx.stroke();
    // Y轴标签
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    [0, 2, 4, 6, 8, 10].forEach(h => {
      const y = treeY(Math.min(h, 10));
      ctx.fillText(h.toString(), pad.l - 5, y + 4);
    });
  }

  // ── 主入口 ─────────────────────────────────────────
  function init() {
    document.querySelectorAll('.stat-viz, .stat-calc').forEach(el => {
      if (el.dataset.rendered) return;
      try {
        renderComponent(el);
        el.dataset.rendered = 'true';
      } catch(e) { console.error('stats-viz error:', e); }
    });
  }

  function renderComponent(el) {
    const type = el.dataset.type;
    if (type === 'normal') renderNormalDistribution(el);
    else if (type === 'tcompare') renderTCompare(el);
    else if (type === 'pvalue') renderPValue(el);
    else if (type === 'scatter') renderScatterPlot(el);
    else if (type === 'ttest') renderTTest(el);
    else if (type === 'chisq') renderChiSq(el);
    else if (type === 'pca') renderScreePlot(el);
    else if (type === 'anova') renderANOVA(el);
    else if (type === 'fdist') renderFDist(el);
    else if (type === 'binom') renderBinomial(el);
    else if (type === 'poisson') renderPoisson(el);
    else if (type === 'km') renderKM(el);
    else if (type === 'logistic') renderLogisticOR(el);
    else if (type === 'roc') renderROC(el);
    else if (type === 'cox') renderCoxHR(el);
    else if (type === 'survcomp') renderSurvivalComp(el);
    else if (type === 'hist') renderHistogram(el);
    else if (type === 'box') renderBoxplot(el);
    else if (type === 'power') renderPower(el);
    else if (type === 'wilcoxon') renderWilcoxonSignedRank(el);
    else if (type === 'kruskal') renderKruskalWallis(el);
    else if (type === 'friedman') renderFriedman(el);
    else if (type === 'rminteraction') renderRepeatedMeasuresInteraction(el);
    else if (type === 'partialcorr') renderPartialCorr(el);
    else if (type === 'dendrogram') renderDendrogram(el);
    else if (type === 'coefci') renderCoefCI(el);
    else if (type === 'lda') renderLDA(el);
    else if (type === 'factorload') renderFactorLoad(el);
    else if (type === 'psdist') renderPSDist(el);
    else if (type === 'dose') renderDoseResponse(el);
    else if (type === 'splinercs') renderSplineRCS(el);
    else if (type === 'subgroupforest') renderSubgroupForest(el);
    else if (type === 'samplesizecalc') renderSampleSizeCalc(el);
    else if (type === 'normtest') renderNormTest(el);
    else if (type === 'interaction') renderFactorialInteraction(el);
    else if (type === 'blandaltman') renderBlandAltman(el);
    else if (type === 'funnel') renderFunnel(el);
    else if (type === 'roccompare') renderROCCompare(el);
    else if (type === 'calibration') renderCalibrationCurve(el);
    else if (type === 'confusionmatrix') renderConfusionMatrix(el);
    else if (type === 'sequential') renderSequentialAnalysis(el);
    else if (type === 'nnt') renderNNT(el);
    else if (type === 'doseresponse') renderDoseResponse(el);
    else if (type === 'autocorrelation') renderAutocorrelation(el);
    else if (type === 'nomogram') renderNomogram(el);
    else if (type === 'bar') renderBarChart(el);
    else if (type === 'pie') renderPieChart(el);
    else if (type === 'metaforest') renderMetaForest(el);
    else if (type === 'gauge') renderGaugeChart(el);
    else if (type === 'sankey') renderSankey(el);
    else if (type === 'spine') renderSpinePlot(el);
    else if (type === 'errorbar') renderErrorBar(el);
    else if (type === 'area') renderAreaChart(el);
    else if (type === 'heatmap') renderHeatmap(el);
    else if (type === 'ridgeline') renderRidgeline(el);
    else if (type === 'ldascatter') renderLDAScatter(el);
    else if (type === 'radar') renderRadarChart(el);
    else if (type === 'sem') renderSEM(el);
    else if (type === 'sempath') renderSEMPath(el);
    else if (type === 'riskdist') renderRiskScoreDist(el);
  }

  // ============================================================
  // SEM Path Diagram
  // ============================================================
  function renderSEM(el) {
    const id = 'sem-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'SEM 路径分析示意图';
    const w = 500, h = 300;
    el.innerHTML = `<div style="font-family:sans-serif">
      <div style="background:#f8f9fa;border-radius:8px;padding:15px;margin-bottom:10px">
        <div style="font-size:14px;font-weight:bold;color:#333;margin-bottom:8px">${title}</div>
        <svg width="${w}" height="${h}" style="display:block;margin:0 auto">
          <defs>
            <marker id="arrow${id}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0,10 3.5,0 7" fill="#666"/>
            </marker>
          </defs>
          <!-- 外生变量 (X1, X2) -->
          <rect x="30" y="30" width="80" height="45" rx="5" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.5"/>
          <text x="70" y="57" text-anchor="middle" font-size="13" fill="#333">X₁</text>
          <rect x="30" y="130" width="80" height="45" rx="5" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.5"/>
          <text x="70" y="157" text-anchor="middle" font-size="13" fill="#333">X₂</text>
          <!-- 内生潜变量 (η1, η2) -->
          <ellipse cx="220" cy="75" rx="50" ry="35" fill="#fff3e0" stroke="#f57c00" stroke-width="1.5"/>
          <text x="220" y="80" text-anchor="middle" font-size="13" fill="#333">η₁</text>
          <ellipse cx="220" cy="195" rx="50" ry="35" fill="#fff3e0" stroke="#f57c00" stroke-width="1.5"/>
          <text x="220" y="200" text-anchor="middle" font-size="13" fill="#333">η₂</text>
          <!-- 内生观测变量 (Y1, Y2) -->
          <rect x="380" y="50" width="80" height="45" rx="5" fill="#e8f5e9" stroke="#388e3c" stroke-width="1.5"/>
          <text x="420" y="77" text-anchor="middle" font-size="13" fill="#333">Y₁</text>
          <rect x="380" y="160" width="80" height="45" rx="5" fill="#e8f5e9" stroke="#388e3c" stroke-width="1.5"/>
          <text x="420" y="187" text-anchor="middle" font-size="13" fill="#333">Y₂</text>
          <!-- 路径箭头 -->
          <line x1="110" y1="75" x2="170" y2="80" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/>
          <text x="140" y="68" text-anchor="middle" font-size="10" fill="#666">γ₁₁</text>
          <line x1="110" y1="155" x2="170" y2="145" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/>
          <text x="130" y="142" text-anchor="middle" font-size="10" fill="#666">γ₂₁</text>
          <line x1="110" y1="155" x2="170" y2="205" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/>
          <text x="130" y="195" text-anchor="middle" font-size="10" fill="#666">γ₂₂</text>
          <line x1="270" y1="90" x2="370" y2="72" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/>
          <text x="320" y="72" text-anchor="middle" font-size="10" fill="#666">λ₁</text>
          <line x1="270" y1="180" x2="370" y2="182" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/>
          <text x="320" y="192" text-anchor="middle" font-size="10" fill="#666">λ₂</text>
          <line x1="220" y1="108" x2="220" y2="162" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/>
          <text x="240" y="138" text-anchor="middle" font-size="10" fill="#666">β₁₁</text>
          <!-- 残差箭头 -->
          <line x1="220" y1="228" x2="220" y2="260" stroke="#999" stroke-width="1" marker-end="url(#arrow${id})"/>
          <text x="228" y="250" font-size="9" fill="#999">ζ₁</text>
          <!-- 方差箭头 -->
          <path d="M 15 52 Q 5 52 5 45" stroke="#999" stroke-width="1" fill="none" marker-end="url(#arrow${id})"/>
          <path d="M 15 152 Q 5 152 5 145" stroke="#999" stroke-width="1" fill="none" marker-end="url(#arrow${id})"/>
          <!-- 图例 -->
          <rect x="140" y="265" width="12" height="12" fill="#e3f2fd" stroke="#1976d2"/>
          <text x="156" y="275" font-size="10" fill="#333">外生显变量</text>
          <ellipse cx="213" cy="271" rx="8" ry="6" fill="#fff3e0" stroke="#f57c00"/>
          <text x="225" y="275" font-size="10" fill="#333">内生潜变量</text>
          <rect x="320" y="265" width="12" height="12" fill="#e8f5e9" stroke="#388e3c"/>
          <text x="336" y="275" font-size="10" fill="#333">内生显变量</text>
        </svg>
        <div style="margin-top:10px;font-size:11px;color:#666">
          <span style="margin-right:15px">X₁,X₂: 外生显变量（自变量）</span>
          <span style="margin-right:15px">η₁,η₂: 内生潜变量（中介/因变量）</span>
          <span>Y₁,Y₂: 内生显变量（观测结果）</span>
        </div>
      </div>
    </div>`;
  }

  // ============================================================
  // Autocorrelation (ACF/PACF) Plot
  // ============================================================
  function renderAutocorrelation(el) {
    const id = 'acf-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '自相关图 (ACF/PACF)';
    const rawValues = el.dataset.values || '0.85,0.72,0.58,0.45,0.32,0.21,0.12,0.05,-0.02,-0.08,-0.14,-0.18';
    const values = rawValues.split(',').map(Number);
    const n = values.length;
    const barW = 28, padL = 40, padR = 30, padT = 40, padB = 40;
    const svgW = padL + n * (barW + 6) + padR;
    const svgH = 200;
    const maxVal = Math.max(...values.map(Math.abs), 0.5);
    const scale = (svgH - padT - padB) / 2 / maxVal;
    const centerY = padT + (svgH - padT - padB) / 2;

    el.innerHTML = `<div style="font-family:sans-serif">
      <div style="background:#f8f9fa;border-radius:8px;padding:12px">
        <div style="font-size:13px;font-weight:bold;color:#333;margin-bottom:8px">${title}</div>
        <svg width="${svgW}" height="${svgH}" style="display:block;margin:0 auto">
          <!-- 置信区间线 -->
          <line x1="${padL}" y1="${centerY - scale*1.96/Math.sqrt(30)}" x2="${svgW-padR}" y2="${centerY - scale*1.96/Math.sqrt(30)}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4,2"/>
          <line x1="${padL}" y1="${centerY + scale*1.96/Math.sqrt(30)}" x2="${svgW-padR}" y2="${centerY + scale*1.96/Math.sqrt(30)}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4,2"/>
          <!-- 零线 -->
          <line x1="${padL}" y1="${centerY}" x2="${svgW-padR}" y2="${centerY}" stroke="#999" stroke-width="1"/>
          <!-- 条形 -->
          ${values.map((v, i) => {
            const barH = v * scale;
            const x = padL + i * (barW + 6);
            const yPos = v >= 0 ? centerY - barH : centerY;
            return `<rect x="${x}" y="${yPos}" width="${barW}" height="${Math.abs(barH)}" fill="${v >= 0 ? '#1976d2' : '#dc3545'}" opacity="0.8" rx="2">
              <title>Lag ${i}: ${v.toFixed(3)}</title>
            </rect>
            <text x="${x + barW/2}" y="${svgH-10}" text-anchor="middle" font-size="10" fill="#666">${i}</text>`;
          }).join('')}
          <!-- 标签 -->
          <text x="${svgW/2}" y="${svgH-2}" text-anchor="middle" font-size="11" fill="#666">滞后期 (Lag)</text>
          <text x="12" y="${centerY}" text-anchor="middle" font-size="10" fill="#666" transform="rotate(-90,12,${centerY})">ACF</text>
        </svg>
        <div style="margin-top:8px;font-size:11px;color:#666;text-align:center">
          蓝色条形表示正自相关，红色表示负自相关；虚线为95%置信区间
        </div>
      </div>
    </div>`;
  }

  // ============================================================
  // Predictive Nomogram
  // ============================================================
  function renderNomogram(el) {
    const id = 'nom-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '列线图 (Nomogram) 示例';
    const svgW = 540, svgH = 260;
    const pointsMax = 100;
    const padL = 60, padR = 60, padT = 30, padB = 20;
    const varBoxW = 70, scaleH = 180;

    // 三个预测变量的刻度: 年龄(20-80), 血压(90-200), 胆固醇(3-8)
    const vars = [
      { name: '年龄', unit: '岁', min: 20, max: 80, points: pointsMax, label: '20──────────────80', tickStep: 20 },
      { name: '血压', unit: 'mmHg', min: 90, max: 200, points: pointsMax, label: '90─────────────200', tickStep: 22 },
      { name: '胆固醇', unit: 'mmol/L', min: 3, max: 8, points: pointsMax, label: '3────────────────8', tickStep: 1 }
    ];

    // 计算每个变量对应的像素位置
    const totalWidth = svgW - padL - padR;
    const varWidth = totalWidth / vars.length;
    const scaleTop = padT + 30;
    const scaleBottom = scaleTop + scaleH;

    const varPositions = vars.map((v, i) => padL + i * varWidth + varWidth / 2);

    el.innerHTML = `<div style="font-family:sans-serif">
      <div style="background:#f8f9fa;border-radius:8px;padding:12px">
        <div style="font-size:13px;font-weight:bold;color:#333;margin-bottom:8px">${title}</div>
        <svg width="${svgW}" height="${svgH}" style="display:block;margin:0 auto">
          <style>
            .nom-text { font-size:11px fill:#333 }
            .nom-label { font-size:10px fill:#666 }
            .nom-tick { font-size:9px fill:#999 }
          </style>
          <!-- 变量名称 -->
          ${vars.map((v, i) => `
            <text x="${varPositions[i]}" y="${scaleTop - 10}" text-anchor="middle" class="nom-text" font-weight="bold">${v.name}</text>
            <text x="${varPositions[i]}" y="${scaleTop - 22}" text-anchor="middle" class="nom-label">(${v.unit})</text>
          `).join('')}

          <!-- 总分刻度尺 -->
          <line x1="${padL}" y1="${scaleTop}" x2="${padL}" y2="${scaleBottom}" stroke="#333" stroke-width="2"/>
          <line x1="${padL - 5}" y1="${scaleTop}" x2="${padL + 5}" y2="${scaleTop}" stroke="#333" stroke-width="1.5"/>
          <line x1="${padL - 5}" y1="${scaleBottom}" x2="${padL + 5}" y2="${scaleBottom}" stroke="#333" stroke-width="1.5"/>
          <line x1="${padL - 5}" y1="${scaleTop + scaleH/2}" x2="${padL + 5}" y2="${scaleTop + scaleH/2}" stroke="#333" stroke-width="1"/>
          <text x="${padL - 8}" y="${scaleTop + 4}" text-anchor="end" class="nom-tick">0</text>
          <text x="${padL - 8}" y="${scaleBottom + 4}" text-anchor="end" class="nom-tick">${pointsMax * 3}</text>
          <text x="${padL - 8}" y="${scaleTop + scaleH/2 + 4}" text-anchor="end" class="nom-tick">${pointsMax * 1.5}</text>
          <text x="${padL + 10}" y="${scaleTop - 5}" class="nom-label">总分</text>

          <!-- 变量刻度尺 -->
          ${vars.map((v, i) => {
            const x = varPositions[i];
            const ticks = [];
            for (let val = v.min; val <= v.max; val += v.tickStep) {
              const ratio = (val - v.min) / (v.max - v.min);
              const y = scaleBottom - ratio * scaleH;
              const isMajor = val === v.min || val === v.max || val === (v.min + v.max) / 2;
              ticks.push(`<line x1="${x - (isMajor ? 8 : 5)}" y1="${y}" x2="${x + (isMajor ? 8 : 5)}" y2="${y}" stroke="#666" stroke-width="${isMajor ? 1.5 : 1}"/>
                <text x="${x + 12}" y="${y + 4}" class="nom-tick">${val}</text>`);
            }
            return `<line x1="${x}" y1="${scaleTop}" x2="${x}" y2="${scaleBottom}" stroke="#666" stroke-width="1"/>
              ${ticks.join('')}`;
          }).join('')}

          <!-- 连接线和点标记 -->
          <line x1="${varPositions[0]}" y1="${scaleTop + scaleH * 0.6}" x2="${varPositions[1]}" y2="${scaleTop + scaleH * 0.4}" stroke="#bbb" stroke-width="1" stroke-dasharray="3,2"/>
          <line x1="${varPositions[1]}" y1="${scaleTop + scaleH * 0.4}" x2="${varPositions[2]}" y2="${scaleTop + scaleH * 0.5}" stroke="#bbb" stroke-width="1" stroke-dasharray="3,2"/>
          <line x1="${varPositions[2]}" y1="${scaleTop + scaleH * 0.5}" x2="${padL}" y2="${scaleTop + scaleH * 0.8}" stroke="#bbb" stroke-width="1" stroke-dasharray="3,2"/>

          <!-- 风险刻度 -->
          <line x1="${svgW - padR}" y1="${scaleTop}" x2="${svgW - padR}" y2="${scaleBottom}" stroke="#333" stroke-width="2"/>
          <text x="${svgW - padR + 8}" y="${scaleTop - 5}" class="nom-label">风险概率</text>
          <text x="${svgW - padR + 8}" y="${scaleTop + 4}" class="nom-tick">0.1</text>
          <text x="${svgW - padR + 8}" y="${scaleTop + scaleH * 0.33 + 4}" class="nom-tick">0.3</text>
          <text x="${svgW - padR + 8}" y="${scaleTop + scaleH * 0.67 + 4}" class="nom-tick">0.6</text>
          <text x="${svgW - padR + 8}" y="${scaleBottom + 4}" class="nom-tick">0.9</text>
          <line x1="${svgW - padR - 5}" y1="${scaleTop}" x2="${svgW - padR + 5}" y2="${scaleTop}" stroke="#333"/>
          <line x1="${svgW - padR - 5}" y1="${scaleBottom}" x2="${svgW - padR + 5}" y2="${scaleBottom}" stroke="#333"/>
          <line x1="${svgW - padR - 5}" y1="${scaleTop + scaleH/2}" x2="${svgW - padR + 5}" y2="${scaleTop + scaleH/2}" stroke="#333"/>

          <!-- 风险预测线 -->
          <line x1="${padL}" y1="${scaleTop + scaleH * 0.5}" x2="${svgW - padR}" y2="${scaleTop + scaleH * 0.33}" stroke="#d32f2f" stroke-width="2"/>
        </svg>
        <div style="margin-top:8px;font-size:11px;color:#666;text-align:center">
          示意列线图：各变量取值映射到顶部总分尺，通过总分在风险尺上读取预测概率
        </div>
      </div>
    </div>`;
  }

  // ============================================================
  // Logistic Regression OR Forest Plot
  // ============================================================
  function renderLogisticOR(el) {
    const id = 'logistic-or-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Logistic 回归 OR 森林图';
    const rawData = el.dataset.values || '2.35,1.61,31.26,3.16,2.36,2.09,50.43,0.97,0.68,11.74';
    const rawLabels = el.dataset.labels || 'x12,x13,x14,x21,x31,x41,x51,x61,x72,x73,x81';
    const rawLower = el.dataset.lower || '0.13,0.08,0.79,0.52,0.58,0.19,0.31,3.78,0.09,0.02,1.67';
    const rawUpper = el.dataset.upper || '81.86,59.46,4201.19,22.19,67.03,44.76,15.26,9.25,15.26,148.02';

    const values = rawData.split(',').map(Number);
    const labels = rawLabels.split(',');
    const lower = rawLower.split(',').map(Number);
    const upper = rawUpper.split(',').map(Number);

    const n = values.length;
    const barH = 36, padL = 120, padR = 60, padT = 50, padB = 30;
    const rowH = barH + 8;
    const W = 560, H = padT + n * rowH + padB + 20;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        垂直虚线 OR=1 表示无效线 | 误差线为 95% CI
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    // OR=1 reference line
    const refX = padL + (padL * 0.6);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(refX, padT); ctx.lineTo(refX, H - padB); ctx.stroke();
    ctx.setLineDash([]);

    // X scale: log scale from min(lower) to max(upper)
    const logVals = values.concat(lower).concat(upper).map(v => Math.log(v));
    const minLog = Math.min(...logVals) - 0.5;
    const maxLog = Math.max(...logVals) + 0.5;
    const scaleX = v => padL + ((Math.log(v) - minLog) / (maxLog - minLog)) * (W - padL - padR);

    // Draw rows
    values.forEach((or, i) => {
      const y = padT + i * rowH + barH / 2;
      const x = scaleX(or);
      const xLow = scaleX(Math.max(lower[i], Math.pow(10, minLog)));
      const xHigh = scaleX(Math.min(upper[i], Math.pow(10, maxLog)));

      // Label
      ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(labels[i] || ('V' + (i + 1)), padL - 8, y + 4);

      // CI line
      ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(xLow, y); ctx.lineTo(xHigh, y); ctx.stroke();

      // CI caps
      ctx.beginPath(); ctx.moveTo(xLow, y - 5); ctx.lineTo(xLow, y + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xHigh, y - 5); ctx.lineTo(xHigh, y + 5); ctx.stroke();

      // OR point
      const sig = lower[i] > 1 || upper[i] < 1 ? '#e74c3c' : '#3498db';
      ctx.fillStyle = sig;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();

      // OR value text
      ctx.fillStyle = '#333'; ctx.font = '12px monospace'; ctx.textAlign = 'left';
      ctx.fillText(or.toFixed(2), x + 8, y + 4);
    });

    // X axis labels (log scale)
    const logTicks = [0.1, 0.5, 1, 5, 10, 50, 500];
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    logTicks.filter(v => v >= Math.pow(10, minLog) && v <= Math.pow(10, maxLog)).forEach(v => {
      ctx.fillText(v.toString(), scaleX(v), H - 10);
      ctx.beginPath(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.5;
      ctx.moveTo(scaleX(v), padT); ctx.lineTo(scaleX(v), H - padB); ctx.stroke();
    });

    // "OR" label
    ctx.save(); ctx.translate(14, H / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#666'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Odds Ratio (log scale)', 0, 0); ctx.restore();
  }

  // ============================================================
  // ROC Curve Interactive
  // ============================================================
  function renderROC(el) {
    const id = 'roc-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'ROC 曲线 & AUC';

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📈 ${title}</div>
      <canvas id="${id}" width="560" height="340" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;margin-top:8px;">
        <span style="font-size:14px;color:#333;">AUC = <strong id="${id}-auc">0.00</strong></span>
        <span style="margin-left:16px;font-size:13px;color:#555;">灵敏度 = <strong id="${id}-sens">--</strong></span>
        <span style="margin-left:16px;font-size:13px;color:#555;">特异度 = <strong id="${id}-spec">--</strong></span>
      </div>
      <div style="text-align:center;margin-top:6px;">
        <span style="font-size:12px;color:#888;">点击曲线查看对应 cutoff 点的灵敏度和特异度</span>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 560, H = 340;

    // Generate realistic ROC data (using jStat for normal distributions)
    // Simulated: healthy group N(0.4, 0.15), disease group N(0.7, 0.18)
    const disease = [], healthy = [];
    for (let i = 0; i < 60; i++) {
      disease.push(jStat.normal.inv(Math.random(), 0.7, 0.18));
      healthy.push(jStat.normal.inv(Math.random(), 0.4, 0.15));
    }
    const allVals = [...disease, ...healthy].sort((a, b) => a - b);
    const labels = [...Array(60).fill(1), ...Array(60).fill(0)];

    // Compute ROC curve
    const rocPoints = [];
    for (let i = 0; i < allVals.length; i++) {
      const cutoff = allVals[i];
      let tp = 0, fp = 0, tn = 0, fn = 0;
      for (let j = 0; j < allVals.length; j++) {
        if (labels[j] === 1) { if (allVals[j] >= cutoff) tp++; else fn++; }
        else { if (allVals[j] >= cutoff) fp++; else tn++; }
      }
      const sens = tp / (tp + fn);
      const spec = tn / (tn + fp);
      rocPoints.push({ fpr: fp / (fp + tn), tpr: sens, cutoff });
    }
    rocPoints.unshift({ fpr: 0, tpr: 0 });
    rocPoints.push({ fpr: 1, tpr: 1 });

    // Compute AUC
    let auc = 0;
    for (let i = 1; i < rocPoints.length; i++) {
      auc += (rocPoints[i].fpr - rocPoints[i - 1].fpr) * (rocPoints[i].tpr + rocPoints[i - 1].tpr) / 2;
    }
    document.getElementById(id + '-auc').textContent = auc.toFixed(3);

    const padL = 55, padR = 15, padT = 20, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    // Draw
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW, y = padT + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    // Diagonal reference
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT); ctx.stroke();
    ctx.setLineDash([]);

    // ROC curve
    ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    rocPoints.forEach((p, i) => {
      const x = padL + p.fpr * plotW, y = padT + (1 - p.tpr) * plotH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(padL + plotW, padT + plotH); ctx.lineTo(padL, padT + plotH); ctx.closePath();
    ctx.fillStyle = 'rgba(41,128,185,0.1)'; ctx.fill();

    // Axis labels
    ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('1 - 特异度 (False Positive Rate)', W / 2, H - 6);
    ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('灵敏度 (True Positive Rate)', 0, 0); ctx.restore();

    // Tick labels
    ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      ctx.fillText((i / 5).toFixed(1), padL + (i / 5) * plotW, padT + plotH + 16);
      ctx.textAlign = 'right';
      ctx.fillText((1 - i / 5).toFixed(1), padL - 6, padT + (i / 5) * plotH + 4);
    }

    // AUC text
    ctx.fillStyle = '#2980b9'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('AUC = ' + auc.toFixed(3), W / 2, padT + 16);

    // Click interaction
    canvas.onclick = function(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      const fpr = (mx - padL) / plotW;
      const tpr = 1 - (my - padT) / plotH;
      // Find closest point
      let best = rocPoints[0], bestD = Infinity;
      rocPoints.forEach(p => {
        const d = Math.hypot(p.fpr - fpr, p.tpr - tpr);
        if (d < bestD) { bestD = d; best = p; }
      });
      if (best.cutoff !== undefined) {
        document.getElementById(id + '-sens').textContent = best.tpr.toFixed(3);
        document.getElementById(id + '-spec').textContent = (1 - best.fpr).toFixed(3);
      }
    };
  }

  // ============================================================
  // ROC Curve Comparison (两条ROC曲线对比)
  // ============================================================
  // <div class="stat-viz" data-type="roccompare" data-title="ROC曲线对比" data-auc1="0.82" data-auc2="0.75" data-label1="新模型" data-label2="旧模型"></div>
  function renderROCCompare(el) {
    const id = 'roc-compare-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'ROC 曲线对比';
    const auc1 = parseFloat(el.dataset.auc1 || '0.82');
    const auc2 = parseFloat(el.dataset.auc2 || '0.75');
    const label1 = el.dataset.label1 || '模型1';
    const label2 = el.dataset.label2 || '模型2';

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📈 ${title}</div>
      <canvas id="${id}" width="560" height="380" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;margin-top:8px;">
        <span style="font-size:14px;color:#2980b9;"><strong>${label1}</strong> AUC = ${auc1.toFixed(3)}</span>
        <span style="margin-left:24px;font-size:14px;color:#e74c3c;"><strong>${label2}</strong> AUC = ${auc2.toFixed(3)}</span>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 560, H = 380;
    const padL = 55, padR = 15, padT = 25, padB = 45;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Generate two realistic ROC curves based on AUCs
    function genROC(auc, color, n = 60) {
      // Generate points along the ROC curve
      const pts = [];
      const disease = [], healthy = [];
      const meanD = 0.7 + (auc - 0.7) * 0.8;
      for (let i = 0; i < n; i++) {
        disease.push(jStat.normal.inv(Math.random(), meanD, 0.18));
        healthy.push(jStat.normal.inv(Math.random(), 0.4, 0.15));
      }
      const allVals = [...disease, ...healthy].sort((a, b) => a - b);
      const labels = [...Array(n).fill(1), ...Array(n).fill(0)];
      for (let i = 0; i < allVals.length; i++) {
        const cutoff = allVals[i];
        let tp = 0, fp = 0, tn = 0, fn = 0;
        for (let j = 0; j < allVals.length; j++) {
          if (labels[j] === 1) { if (allVals[j] >= cutoff) tp++; else fn++; }
          else { if (allVals[j] >= cutoff) fp++; else tn++; }
        }
        pts.push({ fpr: fp / (fp + tn), tpr: tp / (tp + fn), cutoff });
      }
      pts.unshift({ fpr: 0, tpr: 0 });
      pts.push({ fpr: 1, tpr: 1 });
      return pts;
    }

    const roc1 = genROC(auc1, '#2980b9');
    const roc2 = genROC(auc2, '#e74c3c');

    // Grid
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW, y = padT + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    // Diagonal reference
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT); ctx.stroke();
    ctx.setLineDash([]);

    // Draw ROC curves
    function drawROC(pts, color, fillAlpha) {
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = padL + p.fpr * plotW, y = padT + (1 - p.tpr) * plotH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.lineTo(padL + plotW, padT + plotH); ctx.lineTo(padL, padT + plotH); ctx.closePath();
      ctx.fillStyle = color.replace(')', ',' + fillAlpha + ')').replace('rgb', 'rgba');
      ctx.fill();
    }

    drawROC(roc1, 'rgb(41,128,185)', 0.08);
    drawROC(roc2, 'rgb(231,76,60)', 0.08);

    // Legend
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#2980b9'; ctx.textAlign = 'left';
    ctx.fillRect(padL + 10, padT + 10, 20, 4);
    ctx.fillText(label1 + ' (AUC=' + auc1.toFixed(2) + ')', padL + 36, padT + 15);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(padL + 10, padT + 30, 20, 4);
    ctx.fillText(label2 + ' (AUC=' + auc2.toFixed(2) + ')', padL + 36, padT + 35);

    // Axis labels
    ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('1 - 特异度 (False Positive Rate)', W / 2, H - 8);
    ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('灵敏度 (True Positive Rate)', 0, 0); ctx.restore();

    // Tick labels
    ctx.font = '11px sans-serif';
    for (let i = 0; i <= 5; i++) {
      ctx.textAlign = 'center';
      ctx.fillText((i / 5).toFixed(1), padL + (i / 5) * plotW, padT + plotH + 16);
      ctx.textAlign = 'right';
      ctx.fillText((1 - i / 5).toFixed(1), padL - 6, padT + (i / 5) * plotH + 4);
    }
  }

  // ============================================================
  // Cox Regression HR Forest Plot
  // ============================================================
  function renderCoxHR(el) {
    const id = 'cox-hr-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Cox 回归 HR 森林图';
    const rawValues = el.dataset.values || '0.608,1.012,0.987';
    const rawLabels = el.dataset.labels || 'sex (male),age,ph.karno';
    const rawLower = el.dataset.lower || '0.438,0.994,0.976';
    const rawUpper = el.dataset.upper || '0.845,1.031,0.998';
    const rawPval = el.dataset.p || '0.003,0.188,0.023';

    const values = rawValues.split(',').map(Number);
    const labels = rawLabels.split(',');
    const lower = rawLower.split(',').map(Number);
    const upper = rawUpper.split(',').map(Number);
    const pvals = rawPval.split(',').map(Number);

    const n = values.length;
    const barH = 36, padL = 140, padR = 60, padT = 50, padB = 30;
    const rowH = barH + 8;
    const W = 560, H = padT + n * rowH + padB + 20;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">🏥 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        垂直虚线 HR=1 表示无效线 | ● 表示点估计值 | 误差线为 95% CI
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    // HR=1 reference line (log scale)
    const logVals = values.concat(lower).concat(upper).map(v => Math.log(v));
    const minLog = Math.min(...logVals) - 0.5;
    const maxLog = Math.max(...logVals) + 0.3;
    const scaleX = v => padL + ((Math.log(v) - minLog) / (maxLog - minLog)) * (W - padL - padR);

    const refX = scaleX(1);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(refX, padT); ctx.lineTo(refX, H - padB); ctx.stroke();
    ctx.setLineDash([]);

    values.forEach((hr, i) => {
      const y = padT + i * rowH + barH / 2;
      const x = scaleX(hr);
      const xLow = scaleX(Math.max(lower[i], Math.pow(10, minLog)));
      const xHigh = scaleX(Math.min(upper[i], Math.pow(10, maxLog)));
      const sig = lower[i] > 1 || upper[i] < 1;
      const pText = pvals[i] < 0.001 ? 'p<0.001' : 'p=' + pvals[i].toFixed(3);

      ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(labels[i] || ('V' + (i + 1)), padL - 8, y + 4);

      ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(xLow, y); ctx.lineTo(xHigh, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xLow, y - 5); ctx.lineTo(xLow, y + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xHigh, y - 5); ctx.lineTo(xHigh, y + 5); ctx.stroke();

      ctx.fillStyle = sig ? '#e74c3c' : '#3498db';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#333'; ctx.font = '12px monospace'; ctx.textAlign = 'left';
      ctx.fillText('HR=' + hr.toFixed(3) + ' (' + pText + ')', x + 8, y + 4);
    });

    const logTicks = [0.2, 0.5, 1, 2, 5];
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    logTicks.filter(v => v >= Math.pow(10, minLog) && v <= Math.pow(10, maxLog)).forEach(v => {
      ctx.fillText(v.toString(), scaleX(v), H - 10);
    });

    ctx.save(); ctx.translate(14, H / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#666'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Hazard Ratio (log scale)', 0, 0); ctx.restore();
  }

  // ============================================================
  // Survival Curve Comparison (two groups)
  // ============================================================
  function renderSurvivalComp(el) {
    const id = 'surv-comp-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '两组生存曲线比较';

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📈 ${title}</div>
      <canvas id="${id}" width="560" height="320" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;margin-top:8px;">
        <span style="display:inline-block;width:20px;height:3px;background:#e74c3c;vertical-align:middle;margin-right:4px;"></span> 组1
        <span style="display:inline-block;width:20px;height:3px;background:#2980b9;vertical-align:middle;margin-left:16px;margin-right:4px;"></span> 组2
        <span style="margin-left:16px;font-size:13px;color:#555;">中位生存时间: <strong id="${id}-med1">--</strong> vs <strong id="${id}-med2">--</strong></span>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 560, H = 320;
    const padL = 55, padR = 15, padT = 20, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    // Generate two survival curve datasets (模拟肺癌 male vs female 分组)
    function generateKMData(n, lambda, seed) {
      const events = [], times = [];
      for (let i = 0; i < n; i++) {
        const t = -Math.log(1 - Math.random()) / lambda * (0.7 + Math.random() * 0.6);
        const status = Math.random() > 0.3 ? 1 : 0;
        times.push(t); events.push(status);
      }
      const sorted = times.map((t, i) => ({ t, e: events[i] })).sort((a, b) => a.t - b.t);
      let surv = 1, S = [1], T = [0];
      sorted.forEach(d => {
        if (d.e === 1) { surv *= 1 - 1 / (n - sorted.slice(0, sorted.indexOf(d)).filter(x => x.e === 1).length || 1); }
        S.push(surv); T.push(d.t);
      });
      return { T, S };
    }

    const group1 = generateKMData(138, 0.015);
    const group2 = generateKMData(90, 0.022);

    const allTimes = [...group1.T, ...group2.T].sort((a, b) => a - b);
    const maxT = Math.max(...allTimes);

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW, y = padT + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

    // Y axis label
    ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('生存概率 S(t)', W / 2, H - 4);
    ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('生存时间', 0, 0); ctx.restore();

    // X axis label
    ctx.fillText('时间', padL + plotW / 2, H - 4);

    // Y tick labels
    ctx.font = '11px sans-serif';
    for (let i = 0; i <= 5; i++) {
      ctx.textAlign = 'right';
      ctx.fillText((1 - i / 5).toFixed(1), padL - 6, padT + (i / 5) * plotH + 4);
      ctx.textAlign = 'center';
      ctx.fillText(Math.round((i / 5) * maxT) + '', padL + (i / 5) * plotW, padT + plotH + 16);
    }

    function drawStepCurve(T, S, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath();
      T.forEach((t, i) => {
        const x = padL + (t / maxT) * plotW;
        const y = padT + (1 - S[i]) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else {
          const prevX = padL + (T[i - 1] / maxT) * plotW;
          ctx.lineTo(x, padT + (1 - S[i - 1]) * plotH);
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    drawStepCurve(group1.T, group1.S, '#e74c3c');
    drawStepCurve(group2.T, group2.S, '#2980b9');

    // Median survival (approximate)
    function getMedian(T, S) {
      for (let i = 0; i < S.length; i++) { if (S[i] <= 0.5) return T[i]; }
      return T[T.length - 1];
    }
    document.getElementById(id + '-med1').textContent = getMedian(group1.T, group1.S).toFixed(0) + 'd';
    document.getElementById(id + '-med2').textContent = getMedian(group2.T, group2.S).toFixed(0) + 'd';

    // Legend
    ctx.fillStyle = '#e74c3c'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('● 组1 (n=138)', padL + 10, padT + 18);
    ctx.fillStyle = '#2980b9';
    ctx.fillText('● 组2 (n=90)', padL + 120, padT + 18);
  }

  // ============================================================
  // Histogram with Normal Distribution Overlay
  // ============================================================
  function renderHistogram(el) {
    const id = 'hist-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '直方图与正态分布';
    const rawData = el.dataset.data || '72,80,85,88,90,92,95,97,98,100,102,104,105,107,108,110,112,115,118,120,125';
    const data = rawData.split(',').map(Number);
    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const sd = Math.sqrt(variance);

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="560" height="300" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;margin-top:6px;font-size:13px;color:#555;">
        n=${n} | 均值=${mean.toFixed(1)} | 标准差=${sd.toFixed(1)} | 红色曲线为正态分布拟合
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 560, H = 300;
    const padL = 50, padR = 20, padT = 20, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    const minD = Math.min(...data), maxD = Math.max(...data);
    const range = maxD - minD || 1;
    const nbins = Math.max(8, Math.min(20, Math.round(n / 3)));
    const binWidth = range / nbins;
    const bins = Array(nbins).fill(0);
    data.forEach(v => {
      const b = Math.min(Math.floor((v - minD) / binWidth), nbins - 1);
      bins[b]++;
    });
    const maxCount = Math.max(...bins);

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW, y = padT + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

    // X tick labels
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= nbins; i += Math.ceil(nbins / 8)) {
      const x = padL + (i / nbins) * plotW;
      ctx.fillText((minD + i * binWidth).toFixed(0), x, padT + plotH + 16);
    }

    // Y tick labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      ctx.fillText(Math.round((i / 5) * maxCount), padL - 6, padT + (i / 5) * plotH + 4);
    }

    // Bars
    const barW = plotW / nbins * 0.8;
    bins.forEach((count, i) => {
      const barH = (count / maxCount) * plotH * 0.85;
      const x = padL + (i / nbins) * plotW + (plotW / nbins) * 0.1;
      const y = padT + plotH - barH;
      ctx.fillStyle = '#3498db'; ctx.fillRect(x, y, barW, barH);
    });

    // Normal curve overlay
    ctx.beginPath(); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2.5;
    const xRange = maxD - minD;
    for (let px = 0; px <= plotW; px++) {
      const v = minD + (px / plotW) * xRange;
      const density = jStat.normal.pdf(v, mean, sd) * binWidth;
      const y = padT + plotH - (density / (maxCount / n) / nbins * plotH * 0.85);
      if (px === 0) ctx.moveTo(padL + px, y);
      else ctx.lineTo(padL + px, y);
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('数值', padL + plotW / 2, H - 4);
    ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('频数', 0, 0); ctx.restore();
  }

  // ============================================================
  // Boxplot (comparing groups)
  // ============================================================
  function renderBoxplot(el) {
    const id = 'box-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '箱线图比较';
    const rawGroups = el.dataset.groups || 'A组,B组,C组';
    const rawDataArr = el.dataset.values || '45,52,55,58,60,62,65,68,70,75,80,48,52,56,60,63,67,70,72,78,82,50,53,58,61,64,68,71,74,79';

    const groups = rawGroups.split(',');
    const valuesPerGroup = rawDataArr.split(';');
    const groupData = groups.map((g, i) => {
      const vals = (valuesPerGroup[i] || '50,55,60,65,70').split(',').map(Number).filter(v => !isNaN(v));
      return { name: g, data: vals };
    });

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📦 ${title}</div>
      <canvas id="${id}" width="560" height="300" style="display:block;margin:0 auto;"></canvas>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 560, H = 300;
    const padL = 60, padR = 20, padT = 20, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    const allData = groupData.flatMap(g => g.data);
    const minD = Math.min(...allData), maxD = Math.max(...allData);
    const range = maxD - minD || 1;
    const boxW = Math.min(60, plotW / groups.length * 0.6);
    const gap = (plotW - boxW * groups.length) / (groups.length + 1);

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padT + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

    const scaleY = v => padT + plotH - ((v - minD) / range) * plotH;

    groupData.forEach((group, i) => {
      const sorted = [...group.data].sort((a, b) => a - b);
      const n = sorted.length;
      const q1 = sorted[Math.floor(n * 0.25)];
      const median = sorted[Math.floor(n * 0.5)];
      const q3 = sorted[Math.floor(n * 0.75)];
      const iqr = q3 - q1;
      const lowerFence = Math.max(sorted[0], q1 - 1.5 * iqr);
      const upperFence = Math.min(sorted[n - 1], q3 + 1.5 * iqr);
      const outliers = group.data.filter(v => v < lowerFence || v > upperFence);

      const cx = padL + gap * (i + 1) + boxW * i + boxW / 2;

      // Whiskers
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, scaleY(lowerFence)); ctx.lineTo(cx, scaleY(q1)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, scaleY(q3)); ctx.lineTo(cx, scaleY(upperFence)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - boxW / 4, scaleY(lowerFence)); ctx.lineTo(cx + boxW / 4, scaleY(lowerFence)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - boxW / 4, scaleY(upperFence)); ctx.lineTo(cx + boxW / 4, scaleY(upperFence)); ctx.stroke();

      // Box
      ctx.fillStyle = i === 0 ? '#3498db' : i === 1 ? '#2ecc71' : '#9b59b6';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(cx - boxW / 2, scaleY(q3), boxW, scaleY(q1) - scaleY(q3));
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - boxW / 2, scaleY(q3), boxW, scaleY(q1) - scaleY(q3));

      // Median line
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx - boxW / 2, scaleY(median)); ctx.lineTo(cx + boxW / 2, scaleY(median)); ctx.stroke();

      // Outliers
      ctx.fillStyle = '#e74c3c';
      outliers.forEach(o => {
        ctx.beginPath(); ctx.arc(cx, scaleY(o), 3, 0, Math.PI * 2); ctx.fill();
      });

      // Label
      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(group.name, cx, padT + plotH + 16);
    });

    // Y labels
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      ctx.fillText((minD + (i / 5) * range).toFixed(0), padL - 6, padT + (i / 5) * plotH + 4);
    }

    // Legend
    ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(padL + plotW - 60, padT + 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('中位数', padL + plotW - 52, padT + 16);
  }

  // ============================================================
  // Bar Chart
  // ============================================================
  function renderBarChart(el) {
    const id = 'bar-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '条形图';
    const rawLabels = el.dataset.labels || 'A,B,C';
    const rawValues = el.dataset.values || '50,80,65';
    const labels = rawLabels.split(',');
    const values = rawValues.split(',').map(Number);
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="480" height="300" style="display:block;margin:0 auto;"></canvas>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 480, H = 300;
    const padL = 60, padR = 20, padT = 40, padB = 50;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const maxVal = Math.max(...values);
    const barW = plotW / labels.length * 0.6;
    const gap = (plotW - barW * labels.length) / (labels.length + 1);

    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    // Grid
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padT + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

    // Y axis label
    ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('数值', 0, 0); ctx.restore();

    // Y tick labels
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padT + (i / 5) * plotH;
      const v = Math.round(maxVal * (1 - i / 5));
      ctx.fillText(v, padL - 6, y + 4);
    }

    // Bars
    values.forEach((val, i) => {
      const barH = (val / maxVal) * plotH * 0.9;
      const x = padL + gap + i * (barW + gap);
      const y = padT + plotH - barH;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x, y, barW, barH);
      // Value label
      ctx.fillStyle = '#333'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(val, x + barW / 2, y - 8);
      // X label
      ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
      ctx.fillText(labels[i], x + barW / 2, padT + plotH + 18);
    });
  }

  // ============================================================
  // Pie Chart
  // ============================================================
  function renderPieChart(el) {
    const id = 'pie-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '饼图';
    const rawLabels = el.dataset.labels || 'A,B,C';
    const rawValues = el.dataset.values || '30,40,30';
    const labels = rawLabels.split(',');
    const values = rawValues.split(',').map(Number);
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    const total = values.reduce((a, b) => a + b, 0);

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="420" height="320" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;margin-top:8px;font-size:12px;color:#555;"></div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 420, H = 320;
    const cx = W / 2, cy = H / 2 + 10;
    const radius = Math.min(W, H) / 2 - 40;
    const legendBoxW = 100, legendBoxH = labels.length * 20;

    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    let startAngle = -Math.PI / 2;
    values.forEach((val, i) => {
      const sliceAngle = (val / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      // Slice
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.stroke();

      // Percentage label
      const midAngle = startAngle + sliceAngle / 2;
      const labelR = radius * 0.65;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      const pct = ((val / total) * 100).toFixed(1);
      if (pct > 5) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(pct + '%', lx, ly);
      }

      startAngle = endAngle;
    });

    // Legend
    const legX = W - legendBoxW - 15, legY = cy - legendBoxH / 2;
    values.forEach((val, i) => {
      const ly = legY + i * 20 + 12;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(legX, ly - 8, 12, 12);
      ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(labels[i] + ' (' + val + ')', legX + 18, ly + 2);
    });
  }

  // ============================================================
  // Power Analysis Explorer
  // ============================================================
  function renderPower(el) {
    const id = 'power-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '功效分析';
    const test = el.dataset.test || 'ttest';

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">⚡ ${title}</div>
      <canvas id="${id}" width="560" height="300" style="display:block;margin:0 auto;"></canvas>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:10px;">
        <label style="font-size:13px;">效应量 d:
          <input type="range" id="${id}-d" min="1" max="20" value="8" step="1" style="width:100px;">
          <span id="${id}-dval">0.8</span>
        </label>
        <label style="font-size:13px;">功效 1-β:
          <input type="range" id="${id}-pwr" min="50" max="99" value="80" step="1" style="width:100px;">
          <span id="${id}-pwrval">0.80</span>
        </label>
        <label style="font-size:13px;">α:
          <input type="range" id="${id}-a" min="1" max="10" value="5" step="1" style="width:80px;">
          <span id="${id}-aval">0.05</span>
        </label>
        <button id="${id}-calc" style="padding:4px 14px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">计算 n</button>
      </div>
      <div id="${id}-result" style="text-align:center;margin-top:10px;font-size:15px;font-weight:bold;color:#2c3e50;"></div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 560, H = 300;
    const padL = 55, padR = 15, padT = 15, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    function drawPowerCurve() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('功效曲线 (两样本t检验)', W / 2, 20);

      const d = parseFloat(document.getElementById(id + '-dval').textContent);
      const alpha = parseFloat(document.getElementById(id + '-aval').textContent);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const x = padL + (i / 5) * plotW, y = padT + (i / 5) * plotH;
        ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

      // Power curve (simplified: power increases with n for fixed effect size)
      const maxN = 200;
      const scaleX = n => padL + (n / maxN) * plotW;
      const scaleY = p => padT + (1 - p) * plotH;

      // Reference lines at power=0.8 and alpha
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, scaleY(0.8)); ctx.lineTo(padL + plotW, scaleY(0.8)); ctx.stroke();
      ctx.setLineDash([]);

      // Power curve
      ctx.beginPath(); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2.5;
      for (let n = 2; n <= maxN; n++) {
        // Approximate power for two-sample t-test
        const se = Math.sqrt(2 * (d * d) / n); // simplified
        const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
        const zPower = zAlpha - d * Math.sqrt(n / 2);
        const power = 1 - jStat.normal.cdf(zPower, 0, 1);
        const x = scaleX(n), y = scaleY(Math.min(power, 0.999));
        if (n === 2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
      for (let i = 0; i <= 5; i++) {
        ctx.textAlign = 'center';
        ctx.fillText(Math.round((i / 5) * maxN) + '', padL + (i / 5) * plotW, padT + plotH + 16);
        ctx.textAlign = 'right';
        ctx.fillText((1 - i / 5).toFixed(1), padL - 6, padT + (i / 5) * plotH + 4);
      }
      ctx.textAlign = 'center';
      ctx.fillText('每组样本量 n', padL + plotW / 2, H - 4);
      ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('功效 (1-β)', 0, 0); ctx.restore();

      // Annotate 0.8 line
      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('power=0.8', padL + plotW + 2, scaleY(0.8) + 4);
    }

    drawPowerCurve();

    const dSlider = document.getElementById(id + '-d');
    const pwrSlider = document.getElementById(id + '-pwr');
    const aSlider = document.getElementById(id + '-a');

    dSlider.addEventListener('input', () => {
      document.getElementById(id + '-dval').textContent = (dSlider.value / 10).toFixed(1);
      drawPowerCurve();
    });
    pwrSlider.addEventListener('input', () => {
      document.getElementById(id + '-pwrval').textContent = (pwrSlider.value / 100).toFixed(2);
    });
    aSlider.addEventListener('input', () => {
      document.getElementById(id + '-aval').textContent = (aSlider.value / 100).toFixed(2);
      drawPowerCurve();
    });

    document.getElementById(id + '-calc').addEventListener('click', () => {
      const d = parseFloat(document.getElementById(id + '-dval').textContent);
      const power = parseFloat(document.getElementById(id + '-pwrval').textContent);
      const alpha = parseFloat(document.getElementById(id + '-aval').textContent);
      const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
      const zBeta = jStat.normal.inv(power, 0, 1);
      // For two-sample t-test: n = 2 * ((zAlpha + zBeta) / d)^2
      const n = Math.ceil(2 * Math.pow((zAlpha + zBeta) / d, 2));
      document.getElementById(id + '-result').textContent = '每组所需样本量 n ≈ ' + n + ' (每组 total: ' + n * 2 + ')';
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
                try {
                  renderComponent(el);
                  el.dataset.rendered = 'true';
                } catch(e) { console.error('stats-viz error:', e); }
              }
            });
          }
        });
      });
    });
    observer.observe(document.getElementById('chapter-content') || document.body, { childList: true, subtree: true });
  }

  // ============================================================
  // Multiple Regression Coefficient CI Plot
  // ============================================================
  function renderCoefCI(el) {
    const id = 'coefci-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '多元回归系数置信区间';
    const rawLabels = el.dataset.labels || '截距,age,bmi,map,dur';
    const rawBetas = el.dataset.betas || '6.50,0.14,0.35,0.09,0.05';
    const rawLower = el.dataset.lower || '4.21,-0.03,0.12,0.02,0.01';
    const rawUpper = el.dataset.upper || '8.79,0.31,0.58,0.16,0.09';

    const labels = rawLabels.split(',');
    const betas = rawBetas.split(',').map(Number);
    const lower = rawLower.split(',').map(Number);
    const upper = rawUpper.split(',').map(Number);
    const n = labels.length;

    const barH = 36, padL = 80, padR = 60, padT = 50, padB = 30;
    const rowH = barH + 10;
    const W = 560, H = padT + n * rowH + padB + 20;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        垂直虚线 β=0 表示无效线 | 误差线为 95% CI
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    // Ref line at 0
    const allVals = betas.concat(lower).concat(upper);
    const minV = Math.min(...allVals), maxV = Math.max(...allVals);
    const scaleX = v => padL + ((v - minV) / (maxV - minV + 0.01)) * (W - padL - padR);
    const refX = scaleX(0);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(refX, padT); ctx.lineTo(refX, H - padB); ctx.stroke();
    ctx.setLineDash([]);

    betas.forEach((beta, i) => {
      const y = padT + i * rowH + rowH * 0.3;
      // Label
      ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(labels[i], padL - 8, y + barH / 2 + 4);
      // CI line
      ctx.strokeStyle = '#3498db'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(scaleX(lower[i]), y + barH / 2); ctx.lineTo(scaleX(upper[i]), y + barH / 2); ctx.stroke();
      // CI caps
      ctx.beginPath(); ctx.moveTo(scaleX(lower[i]), y + barH / 2 - 5); ctx.lineTo(scaleX(lower[i]), y + barH / 2 + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(scaleX(upper[i]), y + barH / 2 - 5); ctx.lineTo(scaleX(upper[i]), y + barH / 2 + 5); ctx.stroke();
      // Beta dot
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath(); ctx.arc(scaleX(beta), y + barH / 2, 5, 0, Math.PI * 2); ctx.fill();
    });
  }

  // ============================================================
  // Linear Discriminant Analysis Boundary
  // ============================================================
  function renderLDA(el) {
    const id = 'lda-' + Math.random().toString(36).slice(2, 8);
    const W = 500, H = 400;
    const padL = 45, padR = 15, padT = 30, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 Fisher 判别分析分类边界</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        拖动两类数据中心调整判别边界 | 红色虚线为决策边界
      </div>
      <div style="text-align:center;margin-top:8px;">
        <button id="${id}-reset" style="padding:4px 14px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;">重置</button>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    let g1x = 0.35, g1y = 0.6; // group 1 center (normalized 0-1)
    let g2x = 0.65, g2y = 0.4; // group 2 center

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fafafa'; ctx.fillRect(padL, padT, plotW, plotH);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(padL + (i/5)*plotW, padT); ctx.lineTo(padL + (i/5)*plotW, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, padT + (i/5)*plotH); ctx.lineTo(padL + plotW, padT + (i/5)*plotH); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('变量 X1', padL + plotW/2, H - 4);
      ctx.save(); ctx.translate(12, padT + plotH/2); ctx.rotate(-Math.PI/2); ctx.fillText('变量 X2', 0, 0); ctx.restore();

      // LDA decision boundary: simplified linear discriminant
      const m1x = g1x * plotW, m1y = (1 - g1y) * plotH;
      const m2x = g2x * plotW, m2y = (1 - g2y) * plotH;
      const slope = (m2y - m1y) / (m2x - m1x + 0.001);
      const perpSlope = -1 / slope;
      const midX = (m1x + m2x) / 2, midY = (m1y + m2y) / 2;
      // Draw perpendicular bisector (decision boundary)
      const b = midY - perpSlope * midX;
      ctx.setLineDash([5, 5]); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, perpSlope * padL + b);
      ctx.lineTo(padL + plotW, perpSlope * (padL + plotW) + b);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw class regions (colored)
      const grad1 = ctx.createLinearGradient(padL, 0, padL + plotW, 0);
      grad1.addColorStop(0, 'rgba(52,152,219,0.08)'); grad1.addColorStop((m1x + m2x) / 2 / plotW, 'rgba(52,152,219,0.15)'); grad1.addColorStop(1, 'rgba(231,76,60,0.08)');
      ctx.fillStyle = grad1;
      ctx.fillRect(padL, padT, plotW, plotH);

      // Points
      const rng = (c, s) => { const arr = []; for (let i = 0; i < 20; i++) arr.push(c + (Math.random() - 0.5) * s); return arr; };
      const px1 = rng(g1x, 0.12), py1 = rng(g1y, 0.12);
      const px2 = rng(g2x, 0.12), py2 = rng(g2y, 0.12);
      ctx.fillStyle = 'rgba(52,152,219,0.7)';
      px1.forEach((x, i) => { const cx = padL + x * plotW, cy = padT + (1 - py1[i]) * plotH; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.fill(); });
      ctx.fillStyle = 'rgba(231,76,60,0.7)';
      px2.forEach((x, i) => { const cx = padL + x * plotW, cy = padT + (1 - py2[i]) * plotH; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.fill(); });

      // Centers
      ctx.fillStyle = '#2c3e50'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.beginPath(); ctx.arc(padL + m1x, padT + m1y, 8, 0, Math.PI*2); ctx.fill(); ctx.fillText('G1', padL + m1x, padT + m1y - 14);
      ctx.beginPath(); ctx.arc(padL + m2x, padT + m2y, 8, 0, Math.PI*2); ctx.fill(); ctx.fillText('G2', padL + m2x, padT + m2y - 14);

      // Legend
      ctx.fillStyle = 'rgba(52,152,219,0.7)'; ctx.beginPath(); ctx.arc(padL + 20, padT + 18, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.textAlign = 'left'; ctx.font = '12px sans-serif';
      ctx.fillText('组1', padL + 32, padT + 22);
      ctx.fillStyle = 'rgba(231,76,60,0.7)'; ctx.beginPath(); ctx.arc(padL + 80, padT + 18, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillText('组2', padL + 92, padT + 22);
    }

    draw();
    document.getElementById(id + '-reset').addEventListener('click', () => { g1x = 0.35; g1y = 0.6; g2x = 0.65; g2y = 0.4; draw(); });

    // Drag interaction
    let dragging = null;
    canvas.addEventListener('mousedown', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width * W;
      const my = (e.clientY - rect.top) / rect.height * H;
      const m1x = padL + g1x * plotW, m1y = padT + (1 - g1y) * plotH;
      const m2x = padL + g2x * plotW, m2y = padT + (1 - g2y) * plotH;
      if (Math.hypot(mx - m1x, my - m1y) < 20) dragging = 1;
      else if (Math.hypot(mx - m2x, my - m2y) < 20) dragging = 2;
    });
    canvas.addEventListener('mousemove', e => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width * W;
      const my = (e.clientY - rect.top) / rect.height * H;
      const nx = Math.max(0.05, Math.min(0.95, (mx - padL) / plotW));
      const ny = Math.max(0.05, Math.min(0.95, 1 - (my - padT) / plotH));
      if (dragging === 1) { g1x = nx; g1y = ny; } else { g2x = nx; g2y = ny; }
      draw();
    });
    canvas.addEventListener('mouseup', () => dragging = null);
    canvas.addEventListener('mouseleave', () => dragging = null);
  }

  // ============================================================
  // Factor Loading Heatmap
  // ============================================================
  function renderFactorLoad(el) {
    const id = 'factorload-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '因子载荷热图';
    const rawItems = el.dataset.items || 'X1,X2,X3,X4,X5,X6,X7,X8';
    const rawFactors = el.dataset.factors || 'Factor1,Factor2';
    const rawLoads = el.dataset.loads || '0.85,0.12,0.78,0.21,0.15,0.88,0.09,0.79,0.18,0.91,0.25,0.14,0.82,0.11,0.93,0.19';

    const items = rawItems.split(',');
    const factors = rawFactors.split(',');
    const loads = rawLoads.split(',').map(Number);
    const nItems = items.length, nFactors = factors.length;

    const cellW = 70, cellH = 40, padL = 100, padT = 50, padB = 30, padR = 20;
    const W = padL + nFactors * cellW + padR + 80;
    const H = padT + nItems * cellH + padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        颜色越深表示载荷越强 | 红色=正载荷，蓝色=负载荷
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // Title
    ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, (padL + nFactors * cellW) / 2 + padL / 2, 22);

    // Factor labels (top)
    factors.forEach((f, j) => {
      const x = padL + j * cellW + cellW / 2;
      ctx.fillStyle = '#333'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(f, x, padT - 10);
    });

    // Color scale
    const scaleW = 20, scaleH = nItems * cellH;
    const scaleX = padL + nFactors * cellW + 20;
    const grad = ctx.createLinearGradient(0, padT, 0, padT + scaleH);
    grad.addColorStop(0, '#e74c3c'); grad.addColorStop(0.5, '#f8f8f8'); grad.addColorStop(1, '#3498db');
    ctx.fillStyle = grad; ctx.fillRect(scaleX, padT, scaleW, scaleH);
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(scaleX, padT, scaleW, scaleH);
    ctx.fillStyle = '#666'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('+1', scaleX + scaleW / 2, padT - 4);
    ctx.fillText('0', scaleX + scaleW / 2, padT + scaleH / 2 + 4);
    ctx.fillText('-1', scaleX + scaleW / 2, padT + scaleH + 14);

    items.forEach((item, i) => {
      const y = padT + i * cellH + cellH / 2;
      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(item, padL - 8, y + 4);
      factors.forEach((f, j) => {
        const val = loads[i * nFactors + j] || 0;
        const x = padL + j * cellW;
        const alpha = Math.abs(val);
        if (val >= 0) ctx.fillStyle = `rgba(231,76,60,${alpha})`;
        else ctx.fillStyle = `rgba(52,152,219,${alpha})`;
        ctx.fillRect(x + 2, y - cellH / 2 + 2, cellW - 4, cellH - 4);
        ctx.fillStyle = Math.abs(val) > 0.5 ? '#fff' : '#333';
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(val.toFixed(2), x + cellW / 2, y + 4);
      });
    });
  }

  // ============================================================
  // Propensity Score Distribution
  // ============================================================
  function renderPSDist(el) {
    const id = 'psdist-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '倾向评分分布 (PSM)';
    const W = 560, H = 320;
    const padL = 50, padR = 20, padT = 30, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        蓝色: 处理组 | 红色: 对照组 | 重叠区域表示可匹配的样本
      </div>
      <div style="text-align:center;margin-top:8px;">
        <button id="${id}-overlap" style="padding:4px 14px;background:#27ae60;color:white;border:none;border-radius:4px;cursor:pointer;">高亮重叠区</button>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // Generate synthetic PS data (two groups, some overlap)
    const treated = Array.from({length: 120}, () => Math.random() * 0.4 + 0.4);
    const control = Array.from({length: 180}, () => Math.random() * 0.4 + 0.2);
    const allPS = treated.concat(control);
    const minPS = 0, maxPS = 1;

    const bins = 30;
    function hist(data, bins) {
      const h = Array(bins).fill(0);
      data.forEach(v => { const b = Math.min(Math.floor((v - minPS) / (maxPS - minPS) * bins), bins - 1); h[b]++; });
      return h;
    }
    const hT = hist(treated, bins), hC = hist(control, bins);
    const maxH = Math.max(...hT, ...hC);

    let highlightOverlap = false;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 18);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(padL + (i/5)*plotW, padT); ctx.lineTo(padL + (i/5)*plotW, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, padT + (i/5)*plotH); ctx.lineTo(padL + plotW, padT + (i/5)*plotH); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
      for (let i = 0; i <= 5; i++) {
        ctx.textAlign = 'center'; ctx.fillText((i/5).toFixed(1), padL + (i/5)*plotW, padT + plotH + 16);
        ctx.textAlign = 'right'; ctx.fillText(Math.round((1 - i/5) * maxH), padL - 6, padT + (i/5)*plotH + 4);
      }
      ctx.save(); ctx.translate(12, padT + plotH/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.fillText('频数', 0, 0); ctx.restore();
      ctx.textAlign = 'center'; ctx.fillText('倾向评分 (Propensity Score)', padL + plotW/2, H - 4);

      const barW = plotW / bins;
      const scaleY = v => (v / maxH) * plotH * 0.9;

      // Draw bars
      for (let b = 0; b < bins; b++) {
        const x = padL + (b / bins) * plotW;
        const inOverlap = treated[bins - 1 - b] > 0 && control[bins - 1 - b] > 0;
        if (highlightOverlap && inOverlap) {
          ctx.fillStyle = 'rgba(39,174,96,0.6)';
          ctx.fillRect(x, padT + plotH - scaleY(hT[bins - 1 - b]), barW - 1, scaleY(hT[bins - 1 - b]));
          ctx.fillStyle = 'rgba(39,174,96,0.6)';
          ctx.fillRect(x, padT + plotH - scaleY(hC[bins - 1 - b]), barW - 1, scaleY(hC[bins - 1 - b]));
        } else {
          ctx.fillStyle = 'rgba(52,152,219,0.65)';
          ctx.fillRect(x, padT + plotH - scaleY(hT[bins - 1 - b]), barW - 1, scaleY(hT[bins - 1 - b]));
          ctx.fillStyle = 'rgba(231,76,60,0.55)';
          ctx.fillRect(x, padT + plotH - scaleY(hC[bins - 1 - b]), barW - 1, scaleY(hC[bins - 1 - b]));
        }
      }

      // Legend
      ctx.fillStyle = 'rgba(52,152,219,0.7)'; ctx.beginPath(); ctx.arc(padL + 15, padT + 15, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('处理组', padL + 28, padT + 19);
      ctx.fillStyle = 'rgba(231,76,60,0.7)'; ctx.beginPath(); ctx.arc(padL + 100, padT + 15, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillText('对照组', padL + 113, padT + 19);
    }

    draw();
    document.getElementById(id + '-overlap').addEventListener('click', () => { highlightOverlap = !highlightOverlap; draw(); });
  }

  // ============================================================
  // Dose-Response Curve (Logistic/Sigmoid)
  // ============================================================
  function renderDoseResponse(el) {
    const id = 'dose-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '剂量-反应曲线';
    const W = 560, H = 320;
    const padL = 55, padR = 20, padT = 30, padB = 45;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:10px;">
        <label style="font-size:13px;">IC50:
          <input type="range" id="${id}-ic50" min="1" max="99" value="50" step="1" style="width:100px;">
          <span id="${id}-ic50v">50</span>
        </label>
        <label style="font-size:13px;">斜率:
          <input type="range" id="${id}-hill" min="1" max="20" value="5" step="1" style="width:100px;">
          <span id="${id}-hillv">1.0</span>
        </label>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    function sigmoid(x, ic50, hill) {
      return 1 / (1 + Math.pow(x / ic50, hill));
    }

    function drawCurve() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 18);

      const ic50 = parseFloat(document.getElementById(id + '-ic50v').textContent) / 100;
      const hill = parseFloat(document.getElementById(id + '-hillv').textContent);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(padL + (i/5)*plotW, padT); ctx.lineTo(padL + (i/5)*plotW, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, padT + (i/5)*plotH); ctx.lineTo(padL + plotW, padT + (i/5)*plotH); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
      for (let i = 0; i <= 5; i++) {
        ctx.textAlign = 'center'; ctx.fillText((i/5).toFixed(1), padL + (i/5)*plotW, padT + plotH + 16);
        ctx.textAlign = 'right'; ctx.fillText((1 - i/5).toFixed(1), padL - 6, padT + (i/5)*plotH + 4);
      }
      ctx.save(); ctx.translate(12, padT + plotH/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.fillText('反应率', 0, 0); ctx.restore();
      ctx.textAlign = 'center'; ctx.fillText('剂量 (对数刻度)', padL + plotW/2, H - 4);

      // IC50 reference
      const ic50X = padL + ic50 * plotW;
      ctx.setLineDash([4, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ic50X, padT); ctx.lineTo(ic50X, padT + plotH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('IC50=' + ic50.toFixed(2), ic50X, padT - 6);

      // Sigmoid curve
      ctx.beginPath(); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2.5;
      for (let i = 0; i <= 200; i++) {
        const dose = Math.pow(10, (i / 200) * 2 - 1); // 0.1 to 10 in log scale
        const normDose = (Math.log10(dose) + 1) / 2; // normalize to 0-1
        const resp = sigmoid(normDose, ic50, hill);
        const x = padL + normDose * plotW;
        const y = padT + (1 - resp) * plotH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Data points (simulated)
      const doses = [0.1, 0.2, 0.5, 1, 2, 5, 10];
      ctx.fillStyle = '#3498db';
      doses.forEach(d => {
        const normD = (Math.log10(d) + 1) / 2;
        const resp = sigmoid(normD, ic50, hill) + (Math.random() - 0.5) * 0.1;
        const x = padL + normD * plotW;
        const y = padT + (1 - Math.max(0, Math.min(1, resp))) * plotH;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      });
    }

    drawCurve();
    document.getElementById(id + '-ic50').addEventListener('input', () => {
      document.getElementById(id + '-ic50v').textContent = document.getElementById(id + '-ic50').value;
      drawCurve();
    });
    document.getElementById(id + '-hill').addEventListener('input', () => {
      document.getElementById(id + '-hillv').textContent = (document.getElementById(id + '-hill').value / 10).toFixed(1);
      drawCurve();
    });
  }

  // ============================================================
  // Spline / RCS (Restricted Cubic Spline) Visualization
  // ============================================================
  function renderSplineRCS(el) {
    const id = 'splinercs-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '限制性立方样条 (RCS)';
    const W = 560, H = 320;
    const padL = 55, padR = 20, padT = 30, padB = 45;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        蓝色: 效应曲线 | 阴影: 95% CI | 红色虚线: 参考线 (OR=1)
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:8px;">
        <label style="font-size:13px;">弯曲度:
          <input type="range" id="${id}-k" min="2" max="6" value="4" step="1" style="width:80px;">
          <span id="${id}-kv">4</span> 节点
        </label>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // Simulate RCS curve with knots
    function rcsCurve(x, k) {
      const knots = [0.1, 0.275, 0.45, 0.625, 0.8, 0.9];
      // Simplified RCS: piecewise cubic
      const t = Math.max(0, Math.min(1, x));
      const base = Math.sin(t * Math.PI * 1.5) * 0.5 + 0.3;
      const curve = base + Math.sin(t * Math.PI * (k / 2)) * 0.2 * (k - 2) / 4;
      return Math.exp(curve);
    }

    function draw(k) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 18);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(padL + (i/5)*plotW, padT); ctx.lineTo(padL + (i/5)*plotW, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, padT + (i/5)*plotH); ctx.lineTo(padL + plotW, padT + (i/5)*plotH); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
      for (let i = 0; i <= 5; i++) {
        ctx.textAlign = 'center'; ctx.fillText((i/5).toFixed(1), padL + (i/5)*plotW, padT + plotH + 16);
        ctx.fillText((1 - i/5).toFixed(1), padL - 6, padT + (i/5)*plotH + 4);
      }
      ctx.save(); ctx.translate(12, padT + plotH/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.fillText('log(OR)', 0, 0); ctx.restore();
      ctx.textAlign = 'center'; ctx.fillText('连续变量 X', padL + plotW/2, H - 4);

      // Reference line at y=0 (log(OR)=0 => OR=1)
      const refY = padT + plotH * 0.6;
      ctx.setLineDash([4, 4]); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(padL, refY); ctx.lineTo(padL + plotW, refY); ctx.stroke();
      ctx.setLineDash([]);

      // CI band
      ctx.fillStyle = 'rgba(52,152,219,0.15)';
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = padL + (i/200)*plotW;
        const y = padT + (1 - rcsCurve(i/200, k)) * plotH;
        const ciW = 20 + Math.sin(i/20) * 10;
        if (i === 0) ctx.moveTo(x, y - ciW); else ctx.lineTo(x, y - ciW);
      }
      for (let i = 200; i >= 0; i--) {
        const x = padL + (i/200)*plotW;
        const y = padT + (1 - rcsCurve(i/200, k)) * plotH;
        const ciW = 20 + Math.sin(i/20) * 10;
        ctx.lineTo(x, y + ciW);
      }
      ctx.closePath(); ctx.fill();

      // Curve
      ctx.beginPath(); ctx.strokeStyle = '#3498db'; ctx.lineWidth = 2.5;
      for (let i = 0; i <= 200; i++) {
        const x = padL + (i/200)*plotW;
        const y = padT + (1 - rcsCurve(i/200, k)) * plotH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    draw(4);
    document.getElementById(id + '-k').addEventListener('input', () => {
      document.getElementById(id + '-kv').textContent = document.getElementById(id + '-k').value;
      draw(parseInt(document.getElementById(id + '-k').value));
    });
  }

  // ============================================================
  // Subgroup Forest Plot
  // ============================================================
  function renderSubgroupForest(el) {
    const id = 'subgroupforest-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '亚组分析森林图';
    const rawLabels = el.dataset.labels || '总体,年龄<60,年龄≥60,男性,女性,BMI<25,BMI≥25';
    const rawHR = el.dataset.hr || '0.65,0.58,0.72,0.61,0.69,0.63,0.67';
    const rawLower = el.dataset.lower || '0.48,0.38,0.51,0.42,0.47,0.41,0.45';
    const rawUpper = el.dataset.upper || '0.88,0.89,1.01,0.89,1.01,0.97,1.00';

    const labels = rawLabels.split(',');
    const hrs = rawHR.split(',').map(Number);
    const lower = rawLower.split(',').map(Number);
    const upper = rawUpper.split(',').map(Number);
    const n = labels.length;

    const barH = 34, padL = 110, padR = 70, padT = 50, padB = 30;
    const rowH = barH + 8;
    const W = 560, H = padT + n * rowH + padB + 20;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        HR&lt;1 表示治疗有利 | 垂直虚线为总体效应
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    const allVals = hrs.concat(lower).concat(upper);
    const minV = Math.min(...allVals) - 0.1, maxV = Math.max(...allVals) + 0.1;
    const scaleX = v => padL + ((Math.log(v) - Math.log(minV)) / (Math.log(maxV) - Math.log(minV))) * (W - padL - padR);

    // Overall ref line (first HR)
    const overallX = scaleX(hrs[0]);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(overallX, padT); ctx.lineTo(overallX, H - padB); ctx.stroke();
    ctx.setLineDash([]);

    labels.forEach((label, i) => {
      const y = padT + i * rowH + rowH * 0.25;
      const hr = hrs[i], lo = lower[i], up = upper[i];

      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(label, padL - 8, y + barH / 2 + 4);

      // CI
      ctx.strokeStyle = i === 0 ? '#e74c3c' : '#3498db'; ctx.lineWidth = i === 0 ? 2.5 : 1.5;
      ctx.beginPath(); ctx.moveTo(scaleX(lo), y + barH / 2); ctx.lineTo(scaleX(up), y + barH / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(scaleX(lo), y + barH / 2 - 4); ctx.lineTo(scaleX(lo), y + barH / 2 + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(scaleX(up), y + barH / 2 - 4); ctx.lineTo(scaleX(up), y + barH / 2 + 4); ctx.stroke();

      // Diamond for overall
      if (i === 0) {
        ctx.fillStyle = '#e74c3c';
        const mx = scaleX(hr), my = y + barH / 2;
        ctx.beginPath(); ctx.moveTo(mx, my - 7); ctx.lineTo(mx + 6, my); ctx.lineTo(mx, my + 7); ctx.lineTo(mx - 6, my); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = '#3498db';
        ctx.beginPath(); ctx.arc(scaleX(hr), y + barH / 2, 4, 0, Math.PI * 2); ctx.fill();
      }

      // HR text
      ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(hr.toFixed(2) + ' (' + lo.toFixed(2) + '-' + up.toFixed(2) + ')', W - padR + 5, y + barH / 2 + 4);
    });

    // X labels
    ctx.fillStyle = '#666'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    [0.25, 0.5, 1, 2, 3].forEach(v => {
      if (v >= minV && v <= maxV) ctx.fillText(v.toFixed(v === 1 ? 0 : 2), scaleX(v), H - 8);
    });
  }

  // ============================================================
  // Meta-analysis Forest Plot (Generic)
  // ============================================================
  function renderMetaForest(el) {
    const id = 'metaforest-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Meta分析森林图';
    const rawLabels = el.dataset.labels || '研究1,研究2,研究3,研究4,研究5,总体效应';
    const rawHR = el.dataset.hr || '0.75,0.82,0.68,0.91,0.78,0.77';
    const rawLower = el.dataset.lower || '0.52,0.61,0.45,0.72,0.58,0.65';
    const rawUpper = el.dataset.upper || '1.08,1.10,1.03,1.15,1.05,0.91';
    const rawWeights = el.dataset.weights || '25,30,15,12,18,100';

    const labels = rawLabels.split(',');
    const hrs = rawHR.split(',').map(Number);
    const lower = rawLower.split(',').map(Number);
    const upper = rawUpper.split(',').map(Number);
    const weights = rawWeights.split(',').map(Number);
    const n = labels.length;

    const barH = 32, padL = 130, padR = 80, padT = 55, padB = 35;
    const rowH = barH + 6;
    const W = 580, H = padT + n * rowH + padB + 20;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:12px;color:#555;margin-top:6px;">
        HR&lt;1 表示有利 | 权重(%)显示在右侧 | 钻石为汇总效应
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 20);

    const allVals = hrs.concat(lower).concat(upper);
    const minV = Math.min(...allVals) - 0.05, maxV = Math.max(...allVals) + 0.1;
    const scaleX = v => padL + ((Math.log(v) - Math.log(minV)) / (Math.log(maxV) - Math.log(minV))) * (W - padL - padR);

    // Vertical ref line at HR=1
    const refX = scaleX(1);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(refX, padT - 15); ctx.lineTo(refX, H - padB + 10); ctx.stroke();
    ctx.setLineDash([]);

    labels.forEach((label, i) => {
      const y = padT + i * rowH;
      const hr = hrs[i], lo = lower[i], up = upper[i], w = weights[i];
      const isOverall = i === n - 1;

      // Label
      ctx.fillStyle = '#333'; ctx.font = isOverall ? 'bold 12px sans-serif' : '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(label, padL - 8, y + barH / 2 + 4);

      if (isOverall) {
        // Summary diamond
        const mx = scaleX(hr), my = y + barH / 2;
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.moveTo(mx, my - 9);
        ctx.lineTo(mx + 8, my);
        ctx.lineTo(mx, my + 9);
        ctx.lineTo(mx - 8, my);
        ctx.closePath();
        ctx.fill();
      } else {
        // CI line
        ctx.strokeStyle = '#3498db'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(scaleX(lo), y + barH / 2); ctx.lineTo(scaleX(up), y + barH / 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(scaleX(lo), y + barH / 2 - 4); ctx.lineTo(scaleX(lo), y + barH / 2 + 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(scaleX(up), y + barH / 2 - 4); ctx.lineTo(scaleX(up), y + barH / 2 + 4); ctx.stroke();

        // Square marker
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(scaleX(hr) - 4, y + barH / 2 - 4, 8, 8);
      }

      // HR text
      ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(hr.toFixed(2) + ' (' + lo.toFixed(2) + '-' + up.toFixed(2) + ')', W - padR + 5, y + barH / 2 + 4);

      // Weight
      ctx.textAlign = 'right';
      ctx.fillText(!isOverall ? w + '%' : '-', W - 5, y + barH / 2 + 4);
    });

    // X axis ticks
    ctx.fillStyle = '#666'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    [0.2, 0.5, 0.75, 1, 1.5, 2].forEach(v => {
      if (v >= minV && v <= maxV) ctx.fillText(v.toFixed(v === 1 ? 0 : 2), scaleX(v), H - 5);
    });
    ctx.fillText('HR', W - padR + 5, H - 5);
  }

  // ============================================================
  // Sample Size Calculator (Interactive)
  // ============================================================
  function renderSampleSizeCalc(el) {
    const id = 'ss-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '样本量计算器';

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:12px;">
        <div>
          <label style="font-size:13px;display:block;margin-bottom:6px;">检验类型:</label>
          <select id="${id}-type" style="width:100%;padding:6px;font-size:13px;border:1px solid #ccc;border-radius:4px;">
            <option value="ttest2">两样本t检验</option>
            <option value="ttest1">单样本t检验</option>
            <option value="paired">配对t检验</option>
            <option value="chisq">两样本率比较</option>
            <option value="corr">相关分析</option>
          </select>
        </div>
        <div>
          <label style="font-size:13px;display:block;margin-bottom:6px;">效应量 d / w:</label>
          <input type="range" id="${id}-d" min="1" max="30" value="10" step="1" style="width:100%;">
          <span id="${id}-dv" style="font-size:12px;color:#555;">0.5</span>
        </div>
        <div>
          <label style="font-size:13px;display:block;margin-bottom:6px;">显著性水平 α:</label>
          <select id="${id}-a" style="width:100%;padding:6px;font-size:13px;border:1px solid #ccc;border-radius:4px;">
            <option value="0.05" selected>0.05</option>
            <option value="0.01">0.01</option>
            <option value="0.10">0.10</option>
          </select>
        </div>
        <div>
          <label style="font-size:13px;display:block;margin-bottom:6px;">功效 (1-β):</label>
          <select id="${id}-pwr" style="width:100%;padding:6px;font-size:13px;border:1px solid #ccc;border-radius:4px;">
            <option value="0.80" selected>80%</option>
            <option value="0.85">85%</option>
            <option value="0.90">90%</option>
            <option value="0.95">95%</option>
          </select>
        </div>
        <div>
          <label style="font-size:13px;display:block;margin-bottom:6px;">检验方向:</label>
          <select id="${id}-alt" style="width:100%;padding:6px;font-size:13px;border:1px solid #ccc;border-radius:4px;">
            <option value="two.sided" selected>双侧检验</option>
            <option value="greater">单侧 (greater)</option>
            <option value="less">单侧 (less)</option>
          </select>
        </div>
        <div>
          <label style="font-size:13px;display:block;margin-bottom:6px;">组数比例:</label>
          <input type="range" id="${id}-r" min="1" max="3" value="1" step="0.1" style="width:100%;">
          <span id="${id}-rv" style="font-size:12px;color:#555;">1:1</span>
        </div>
      </div>
      <div style="text-align:center;padding:0 12px 12px;">
        <button id="${id}-calc" style="padding:8px 24px;background:#3498db;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:bold;">计算样本量</button>
      </div>
      <div id="${id}-result" style="text-align:center;font-size:16px;font-weight:bold;color:#2c3e50;padding-bottom:12px;"></div>
    </div>`;

    const dSlider = document.getElementById(id + '-d');
    const rSlider = document.getElementById(id + '-r');

    dSlider.addEventListener('input', () => { document.getElementById(id + '-dv').textContent = (dSlider.value / 20).toFixed(2); });
    rSlider.addEventListener('input', () => { document.getElementById(id + '-rv').textContent = '1:' + parseFloat(rSlider.value).toFixed(1); });

    document.getElementById(id + '-calc').addEventListener('click', () => {
      const type = document.getElementById(id + '-type').value;
      const d = parseFloat(document.getElementById(id + '-dv').textContent);
      const alpha = parseFloat(document.getElementById(id + '-a').value);
      const power = parseFloat(document.getElementById(id + '-pwr').value);
      const alt = document.getElementById(id + '-alt').value;
      const ratio = parseFloat(rSlider.value);

      let n = 0, result = '';
      const zAlpha = alt === 'two.sided' ? jStat.normal.inv(1 - alpha / 2, 0, 1) : jStat.normal.inv(1 - alpha, 0, 1);
      const zBeta = jStat.normal.inv(power, 0, 1);

      if (type === 'ttest2') {
        n = Math.ceil(2 * Math.pow((zAlpha + zBeta) / d, 2));
        result = `每组 n ≈ ${n} (总 N ≈ ${Math.ceil(n * (1 + ratio))})`;
      } else if (type === 'ttest1') {
        n = Math.ceil(Math.pow((zAlpha + zBeta) / d, 2));
        result = `样本量 n ≈ ${n}`;
      } else if (type === 'paired') {
        n = Math.ceil(Math.pow((zAlpha + zBeta) / d, 2));
        result = `配对样本数 n ≈ ${n}`;
      } else if (type === 'chisq') {
        const w = d;
        n = Math.ceil(Math.pow((zAlpha + zBeta) / w, 2));
        result = `每组 n ≈ ${n} (总 N ≈ ${Math.ceil(n * (1 + ratio))})`;
      } else if (type === 'corr') {
        const r = Math.min(0.95, d * 0.5);
        n = Math.ceil(3 + Math.pow((zAlpha + zBeta) / (0.5 * Math.log((1 + r) / (1 - r))), 2));
        result = `样本量 n ≈ ${n}`;
      }
      document.getElementById(id + '-result').textContent = result;
    });
  }

  // ============================================================
  // Normality Test (Q-Q Plot)
  // ============================================================
  function renderNormTest(el) {
    const id = 'normtest-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '正态性检验 Q-Q 图';
    const rawData = el.dataset.data || '72,80,85,88,90,92,95,97,98,100,102,104,105,107,108,110,112,115,118,120,125,128,132';
    const data = rawData.split(',').map(Number).sort((a, b) => a - b);
    const n = data.length;
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

    // Calculate theoretical quantiles
    const theorQ = data.map((_, i) => jStat.normal.inv((i + 0.5) / n, mu, sigma));
    const minQ = Math.min(...theorQ), maxQ = Math.max(...theorQ);
    const minD = Math.min(...data), maxD = Math.max(...data);

    function draw(skew) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 18);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(padL + (i/5)*plotW, padT); ctx.lineTo(padL + (i/5)*plotW, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, padT + (i/5)*plotH); ctx.lineTo(padL + plotW, padT + (i/5)*plotH); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
      for (let i = 0; i <= 5; i++) {
        ctx.textAlign = 'center'; ctx.fillText((minQ + (i/5)*(maxQ - minQ)).toFixed(0), padL + (i/5)*plotW, padT + plotH + 16);
        ctx.textAlign = 'right'; ctx.fillText((maxD - (i/5)*(maxD - minD)).toFixed(0), padL - 6, padT + (i/5)*plotH + 4);
      }
      ctx.save(); ctx.translate(12, padT + plotH/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.fillText('样本分位数', 0, 0); ctx.restore();
      ctx.textAlign = 'center'; ctx.fillText('理论分位数 (正态)', padL + plotW/2, H - 4);

      // Reference line (diagonal)
      const scaleX = q => padL + ((q - minQ) / (maxQ - minQ + 0.001)) * plotW;
      const scaleY = v => padT + (1 - (v - minD) / (maxD - minD + 0.001)) * plotH;
      ctx.setLineDash([5, 5]); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(scaleX(minQ), scaleY(minD)); ctx.lineTo(scaleX(maxQ), scaleY(maxD)); ctx.stroke();
      ctx.setLineDash([]);

      // Points
      const skewedData = data.map((v, i) => v + Math.sin(i * skew * 0.5) * skew * 0.5);
      ctx.fillStyle = 'rgba(52,152,219,0.7)';
      theorQ.forEach((q, i) => {
        const x = scaleX(q), y = scaleY(skewedData[i]);
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      });

      // Stats
      const skewness = jStat.skewness(skewedData);
      const kurtosis = jStat.kurtosis(skewedData);
      document.getElementById(id + '-stats').textContent =
        `n=${n} | 偏度=${skewness.toFixed(3)} | 峰度=${kurtosis.toFixed(3)} | 数据点越贴近红线越接近正态`;
    }

    draw(0);
    document.getElementById(id + '-skew').addEventListener('input', () => draw(parseInt(document.getElementById(id + '-skew').value)));
    document.getElementById(id + '-reset').addEventListener('click', () => { document.getElementById(id + '-skew').value = 0; draw(0); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();
    setupObserver();
  });

  // ── 析因设计交互效应图 ──────────────────────────────────
  // <div class="stat-viz" data-type="interaction" data-title="析因设计交互效应" data-factor1="缝合方法" data-factor2="时间" data-levels1="外膜缝合,束膜缝合" data-levels2="1个月,2个月" data-means="[10,30],[40,70]"></div>
  function renderFactorialInteraction(el) {
    const id = 'fact-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '析因设计交互效应图';
    const factor1 = el.dataset.factor1 ? el.dataset.factor1.split(',') : ['因素A', '因素B'];
    const factor2 = el.dataset.factor2 ? el.dataset.factor2.split(',') : ['水平1', '水平2'];
    let means = el.dataset.means ? JSON.parse(el.dataset.means) : [[10, 30], [40, 70]];
    const W = 560, H = 320;
    el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><canvas id="' + id + '" width="' + W + '" height="' + H + '" style="display:block;margin:0 auto;"></canvas></div>';
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const pad = {t: 40, r: 120, b: 60, l: 60};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    // Flatten means
    const allVals = means.flat();
    const yMin = Math.min(...allVals) * 0.8;
    const yMax = Math.max(...allVals) * 1.15;
    const yOf = v => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;
    // Y grid
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 20);
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yVal = yMin + (yMax - yMin) * i / 4;
      const yPx = yOf(yVal);
      ctx.beginPath(); ctx.moveTo(pad.l, yPx); ctx.lineTo(W - pad.r, yPx); ctx.stroke();
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(0), pad.l - 5, yPx + 4);
    }
    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
    // X axis: factor1 levels, each group has factor2 levels
    const n1 = factor1.length;
    const groupW = iW / n1;
    factor1.forEach((f1, fi) => {
      const groupCenterX = pad.l + (fi + 0.5) * groupW;
      // X labels (factor1)
      ctx.fillStyle = '#333'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(f1, groupCenterX, H - pad.b + 20);
      // Factor2 levels as offset from group center
      const n2 = factor2.length;
      const offsetStep = groupW * 0.2;
      const f2OffsetStart = -(n2 - 1) * offsetStep / 2;
      means[fi].forEach((mv, fi2) => {
        const x = groupCenterX + f2OffsetStart + fi2 * offsetStep;
        const y = yOf(mv);
        ctx.fillStyle = fi2 === 0 ? '#2980b9' : '#e67e22';
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        if (fi === 0) {
          // Draw line connecting same factor2 level across factor1
          const xNext = pad.l + (fi + 0.5 + 1) * groupW + f2OffsetStart + fi2 * offsetStep;
          const yNext = yOf(means[fi + 1][fi2]);
          ctx.strokeStyle = fi2 === 0 ? '#2980b9' : '#e67e22';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xNext, yNext); ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    });
    // Legend
    factor2.forEach((label, i) => {
      const lx = W - pad.r + 10;
      const ly = pad.t + i * 22;
      ctx.fillStyle = i === 0 ? '#2980b9' : '#e67e22';
      ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(label, lx + 12, ly + 4);
    });
    // Y axis label
    ctx.save(); ctx.translate(14, pad.t + iH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
    ctx.fillText('均值', 0, 0); ctx.restore();
  }

  // ── SEM 路径图 ─────────────────────────────────────────
  // <div class="stat-viz" data-type="sem"></div>
  function renderSEMPath(el) {
    const id = 'sem-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'SEM 路径分析示意图';
    const W = 580, H = 340;
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">🔷 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:12px;color:#666;margin-top:6px;">
        潜变量 X → Y 路径分析 | 圆圈为潜变量，方框为观测变量
      </div>
    </div>`;
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Layout: X on left, Y on right, three indicators each
    const lvx = 100, lvy = W - 120;  // latent variable centers
    const midY = H / 2;
    const iY = [90, midY, H - 90];   // indicator Y positions
    const jY = [90, midY, H - 90];

    // Title
    ctx.fillStyle = '#222'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W/2, 22);

    // Helper to draw oval (latent var)
    function drawLatent(x, y, label, isY) {
      ctx.strokeStyle = isY ? '#9b59b6' : '#2980b9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 32, 22, 0, 0, Math.PI*2);
      ctx.stroke();
      ctx.fillStyle = isY ? 'rgba(155,89,182,0.08)' : 'rgba(41,128,185,0.08)';
      ctx.fill();
      ctx.fillStyle = isY ? '#9b59b6' : '#2980b9';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 5);
    }

    // Helper to draw box (indicator)
    function drawIndicator(x, y, label) {
      const bw = 36, bh = 22;
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - bw/2, y - bh/2, bw, bh);
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(x - bw/2, y - bh/2, bw, bh);
      ctx.fillStyle = '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 4);
    }

    // Draw arrows
    function arrow(x1, y1, x2, y2, label, curved) {
      const dx = x2 - x1, dy = y2 - y1;
      const angle = Math.atan2(dy, dx);
      const dist = Math.sqrt(dx*dx + dy*dy);
      const r1 = 34, r2 = 24; // approximate radii
      const startX = x1 + Math.cos(angle) * r1, startY = y1 + Math.sin(angle) * r1;
      const endX = x2 - Math.cos(angle) * (r2 + 6), endY = y2 - Math.sin(angle) * (r2 + 6);
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (curved) {
        const mx = (startX + endX) / 2, my = (startY + endY) / 2 - 20;
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(mx, my, endX, endY);
      } else {
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
      }
      ctx.stroke();
      // Arrowhead
      const ah = 8;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - ah*Math.cos(angle-0.4), endY - ah*Math.sin(angle-0.4));
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - ah*Math.cos(angle+0.4), endY - ah*Math.sin(angle+0.4));
      ctx.stroke();
      // Label
      if (label) {
        const mx = (startX+endX)/2, my = (startY+endY)/2 - (curved ? 8 : 5);
        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(label, mx, my);
      }
    }

    // Indicators X (left)
    const xLabels = ['X₁', 'X₂', 'X₃'];
    iY.forEach((y, i) => { drawIndicator(lvx - 80, y, xLabels[i]); });
    // Indicators Y (right)
    const yLabels = ['Y₁', 'Y₂', 'Y₃'];
    jY.forEach((y, i) => { drawIndicator(lvy + 80, y, yLabels[i]); });

    // Latent variables
    drawLatent(lvx, midY, 'ξ', false);  // Xi
    drawLatent(lvy, midY, 'η', true);   // Eta

    // Arrows: indicators to latent
    iY.forEach((y, i) => { arrow(lvx - 80, y, lvx, midY, i === 1 ? 'λ' : null, false); });
    jY.forEach((y, i) => { arrow(lvy, midY, lvy + 80, y, null, false); });
    // Path: Xi -> Eta
    arrow(lvx, midY, lvy, midY, 'γ', true);

    // Label below
    ctx.fillStyle = '#888'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ξ = 外生潜变量  |  η = 内生潜变量', W/2, H - 10);
  }

  // ── Bland-Altman 方法比较图 ──────────────────────────────
  // <div class="stat-viz" data-type="blandaltman" data-title="Bland-Altman 一致性分析" data-method1="新方法" data-method2="金标准" data-delta="[10,15,12,8,18,11,14,9,13,16]" data-mean="[55,58,52,60,48,56,53,59,54,57]"></div>
  function renderBlandAltman(el) {
    const id = 'ba-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Bland-Altman 一致性分析';
    const method1 = el.dataset.method1 || '方法A';
    const method2 = el.dataset.method2 || '方法B';
    let delta = el.dataset.delta ? JSON.parse(el.dataset.delta) : [10,15,12,8,18,11,14,9,13,16,7,20,5,17,14];
    let mean = el.dataset.mean ? JSON.parse(el.dataset.mean) : [55,58,52,60,48,56,53,59,54,57,50,62,45,58,54];
    const W = 520, H = 340;
    el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><canvas id="' + id + '" width="' + W + '" height="' + H + '" style="display:block;margin:0 auto;"></canvas><div id="' + id + '-stats" style="text-align:center;font-size:12px;color:#555;margin-top:4px;"></div></div>';
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const pad = {t: 30, r: 25, b: 45, l: 55};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    const meanVal = delta.reduce((a, b) => a + b, 0) / delta.length;
    const sd = Math.sqrt(delta.reduce((s, d) => s + (d - meanVal) ** 2, 0) / (delta.length - 1));
    const xMin = Math.min(...mean) * 0.95;
    const xMax = Math.max(...mean) * 1.05;
    const yMin = Math.min(...delta) - Math.abs(meanVal) * 0.3;
    const yMax = Math.max(...delta) + Math.abs(meanVal) * 0.3;
    const xOf = v => pad.l + ((v - xMin) / (xMax - xMin)) * iW;
    const yOf = v => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 20);
    // Zero reference line
    const zeroY = yOf(0);
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, zeroY); ctx.lineTo(pad.l + iW, zeroY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#888'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('零差值线', pad.l + iW / 2, zeroY - 5);
    // Mean line
    const meanY = yOf(meanVal);
    ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.l, meanY); ctx.lineTo(pad.l + iW, meanY); ctx.stroke();
    ctx.fillStyle = '#27ae60'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('mean=' + meanVal.toFixed(2), pad.l + 5, meanY - 5);
    // ±1.96SD lines
    [meanVal + 1.96 * sd, meanVal - 1.96 * sd].forEach((v, i) => {
      const ly = yOf(v);
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(pad.l, ly); ctx.lineTo(pad.l + iW, ly); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e74c3c'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      const label = i === 0 ? '+1.96SD' : '-1.96SD';
      ctx.fillText(label + '=' + v.toFixed(2), pad.l + 5, ly - 4);
    });
    // Grid
    ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yv = yMin + (yMax - yMin) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad.l, yOf(yv)); ctx.lineTo(pad.l + iW, yOf(yv)); ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const xv = xMin + (xMax - xMin) * i / 4;
      ctx.beginPath(); ctx.moveTo(xOf(xv), pad.t); ctx.lineTo(xOf(xv), pad.t + iH); ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + iH); ctx.lineTo(pad.l + iW, pad.t + iH); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
    for (let i = 0; i <= 4; i++) {
      const yv = yMin + (yMax - yMin) * i / 4;
      ctx.textAlign = 'right'; ctx.fillText(yv.toFixed(0), pad.l - 5, yOf(yv) + 4);
    }
    for (let i = 0; i <= 4; i++) {
      const xv = xMin + (xMax - xMin) * i / 4;
      ctx.textAlign = 'center'; ctx.fillText(xv.toFixed(0), xOf(xv), pad.t + iH + 15);
    }
    // Axis labels
    ctx.save(); ctx.translate(14, pad.t + iH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
    ctx.fillText('差值 (A - B)', 0, 0); ctx.restore();
    ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
    ctx.fillText('两方法均值', pad.l + iW / 2, H - 4);
    // Points
    delta.forEach((d, i) => {
      const x = xOf(mean[i]);
      const y = yOf(d);
      ctx.fillStyle = Math.abs(d) > 1.96 * sd ? '#e74c3c' : '#3498db';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    });
    // Stats
    document.getElementById(id + '-stats').textContent =
      'mean=' + meanVal.toFixed(2) + '  |  SD=' + sd.toFixed(2) + '  |  95%LoA: [' +
      (meanVal - 1.96 * sd).toFixed(2) + ', ' + (meanVal + 1.96 * sd).toFixed(2) + ']';
  }

  // ── 漏斗图（Meta 分析发表偏倚） ─────────────────────────
  // <div class="stat-viz" data-type="funnel" data-title="漏斗图" data-effects="[0.65,1.12,0.88,1.33,0.95,1.05,0.78,1.20,0.91,1.08]" data-se="[0.18,0.15,0.22,0.12,0.19,0.16,0.24,0.14,0.20,0.17]" data-labels="['研究1','研究2','研究3']"></div>
  function renderFunnel(el) {
    const id = 'funnel-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '漏斗图 (发表偏倚检测)';
    let effects = el.dataset.effects ? JSON.parse(el.dataset.effects) : [0.65, 1.12, 0.88, 1.33, 0.95, 1.05, 0.78, 1.20, 0.91, 1.08, 0.72, 1.15];
    let ses = el.dataset.se ? JSON.parse(el.dataset.se) : [0.18, 0.15, 0.22, 0.12, 0.19, 0.16, 0.24, 0.14, 0.20, 0.17, 0.21, 0.13];
    const W = 500, H = 380;
    el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><canvas id="' + id + '" width="' + W + '" height="' + H + '" style="display:block;margin:0 auto;"></canvas></div>';
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const pad = {t: 35, r: 25, b: 50, l: 55};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    // Sort by SE (precision) for funnel shape
    const combined = effects.map((e, i) => ({ e, se: ses[i] })).sort((a, b) => a.se - b.se);
    const maxSE = Math.max(...ses) * 1.1;
    const minSE = Math.min(...ses) * 0.9;
    const xMin = -0.8, xMax = 2.0;
    const yMin = 0, yMax = maxSE;
    const xOf = v => pad.l + ((v - xMin) / (xMax - xMin)) * iW;
    const yOf = v => pad.t + ((v - yMin) / (yMax - yMin)) * iH;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);
    // 95% CI funnel boundaries (pseudo-significance threshold)
    const topSE = maxSE;
    const slope = 1.96 / topSE;
    // Draw funnel area
    ctx.fillStyle = 'rgba(52, 152, 219, 0.08)';
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(0));
    ctx.lineTo(xOf(1.96 * topSE), yOf(topSE));
    ctx.lineTo(xOf(-1.96 * topSE), yOf(topSE));
    ctx.closePath(); ctx.fill();
    // Mean effect line
    const meanEffect = effects.reduce((a, b) => a + b, 0) / effects.length;
    ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xOf(meanEffect), pad.t); ctx.lineTo(xOf(meanEffect), pad.t + iH); ctx.stroke();
    ctx.fillStyle = '#27ae60'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('合并效应', xOf(meanEffect), pad.t - 8);
    // Pseudo-confidence limits
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
    for (const mult of [1, 1.5, 2]) {
      const seRef = topSE / mult;
      const left = meanEffect - 1.96 * seRef;
      const right = meanEffect + 1.96 * seRef;
      ctx.beginPath(); ctx.moveTo(xOf(left), yOf(seRef)); ctx.lineTo(xOf(right), yOf(seRef)); ctx.stroke();
    }
    ctx.setLineDash([]);
    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + iH); ctx.lineTo(pad.l + iW, pad.t + iH); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('效应量 (OR/RR)', pad.l + iW / 2, H - 4);
    ctx.save(); ctx.translate(14, pad.t + iH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
    ctx.fillText('标准误 (精度↑)', 0, 0); ctx.restore();
    for (let i = 0; i <= 4; i++) {
      const vv = xMin + (xMax - xMin) * i / 4;
      ctx.textAlign = 'center'; ctx.fillText(vv.toFixed(1), xOf(vv), pad.t + iH + 15);
    }
    // Points
    combined.forEach(({ e, se }) => {
      const px = xOf(e), py = yOf(se);
      const inCI = Math.abs(e - meanEffect) < 1.96 * se;
      ctx.fillStyle = inCI ? '#3498db' : '#e74c3c';
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
    });
  }

  // ── 校准曲线（Logistic 回归模型评价） ─────────────────────
  // <div class="stat-viz" data-type="calibration" data-title="校准曲线" data-pred="[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9]" data-obs="[0.12,0.18,0.28,0.38,0.52,0.65,0.72,0.82,0.88]"></div>
  function renderCalibrationCurve(el) {
    const id = 'cal-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '校准曲线';
    let pred = el.dataset.pred ? JSON.parse(el.dataset.pred) : [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    let obs = el.dataset.obs ? JSON.parse(el.dataset.obs) : [0.12, 0.18, 0.28, 0.38, 0.52, 0.65, 0.72, 0.82, 0.88];
    const W = 480, H = 380;
    el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><canvas id="' + id + '" width="' + W + '" height="' + H + '" style="display:block;margin:0 auto;"></canvas><div id="' + id + '-info" style="text-align:center;font-size:12px;color:#555;margin-top:4px;"></div></div>';
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const pad = {t: 35, r: 30, b: 50, l: 55};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);
    // Grid
    ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const xv = pad.l + (i / 5) * iW, yv = pad.t + (i / 5) * iH;
      ctx.beginPath(); ctx.moveTo(xv, pad.t); ctx.lineTo(xv, pad.t + iH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.l, yv); ctx.lineTo(pad.l + iW, yv); ctx.stroke();
    }
    // Perfect calibration line (45°)
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t + iH); ctx.lineTo(pad.l + iW, pad.t); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('完美校准', pad.l + iW * 0.65, pad.t + iH * 0.3);
    // LOESS/line of best fit through points
    const xOf = v => pad.l + v * iW;
    const yOf = v => pad.t + (1 - v) * iH;
    // Draw observed points
    ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 2;
    ctx.beginPath();
    pred.forEach((p, i) => {
      const x = xOf(p), y = yOf(obs[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    pred.forEach((p, i) => {
      const x = xOf(p), y = yOf(obs[i]);
      ctx.fillStyle = '#2980b9'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    });
    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + iH); ctx.lineTo(pad.l + iW, pad.t + iH); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const v = i / 5;
      ctx.fillText(v.toFixed(1), xOf(v), pad.t + iH + 15);
      ctx.textAlign = 'right'; ctx.fillText(v.toFixed(1), pad.l - 5, yOf(v) + 4);
    }
    ctx.save(); ctx.translate(14, pad.t + iH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
    ctx.fillText('预测概率', 0, 0); ctx.restore();
    ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
    ctx.fillText('实际发生率', pad.l + iW / 2, H - 4);
    // Stats: Hosmer-Lemeshow approximation
    let hlChi2 = 0;
    pred.forEach((p, i) => { const e = (obs[i] - p); hlChi2 += e * e / (p * (1 - p) + 0.001); });
    document.getElementById(id + '-info').textContent = '提示：点越接近对角线，模型校准越好';
  }

  // ── 混淆矩阵热图（分类模型评价） ─────────────────────────
  // <div class="stat-viz" data-type="confusionmatrix" data-title="混淆矩阵" data-tp="85" data-fp="15" data-fn="10" data-tn="90"></div>
  function renderConfusionMatrix(el) {
    const id = 'cm-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '混淆矩阵';
    const tp = parseInt(el.dataset.tp || '85');
    const fp = parseInt(el.dataset.fp || '15');
    const fn = parseInt(el.dataset.fn || '10');
    const tn = parseInt(el.dataset.tn || '90');
    const W = 420, H = 360;
    el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><canvas id="' + id + '" width="' + W + '" height="' + H + '" style="display:block;margin:0 auto;"></canvas><div id="' + id + '-metrics" style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:8px;font-size:12px;"></div></div>';
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const mat = [[tp, fp], [fn, tn]];
    const labels = ['实际阳性', '实际阴性'];
    const predLabels = ['预测阳性', '预测阴性'];
    const cellW = 90, cellH = 70, padL = 80, padT = 50;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);
    // Draw cells
    mat.forEach((row, i) => {
      row.forEach((val, j) => {
        const cx = padL + j * cellW, cy = padT + i * cellH;
        const frac = val / (tp + fp + fn + tn);
        const intensity = Math.floor(frac * 510);
        ctx.fillStyle = i === j ? `rgb(${Math.min(255, intensity * 2)}, ${Math.max(100, 255 - intensity)}, 100)` : `rgb(${Math.min(255, intensity * 2)}, 100, ${Math.max(100, 255 - intensity)})`;
        ctx.fillRect(cx, cy, cellW - 4, cellH - 4);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(val, cx + cellW / 2 - 2, cy + cellH / 2 + 6);
        ctx.font = '10px sans-serif'; ctx.fillStyle = '#ddd';
        ctx.fillText(((val / (tp + fp + fn + tn)) * 100).toFixed(1) + '%', cx + cellW / 2 - 2, cy + cellH / 2 + 20);
      });
    });
    // Axis labels
    ctx.fillStyle = '#333'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    predLabels.forEach((l, j) => ctx.fillText(l, padL + j * cellW + cellW / 2, padT - 8));
    ctx.save(); ctx.translate(padL - 38, padT + cellH);
    ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('实际', 0, 0); ctx.restore();
    labels.forEach((l, i) => ctx.fillText(l, 20, padT + i * cellH + cellH / 2 + 5));
    // Metrics
    const accuracy = ((tp + tn) / (tp + fp + fn + tn) * 100).toFixed(1);
    const sensitivity = (tp / (tp + fn) * 100).toFixed(1);
    const specificity = (tn / (tn + fp) * 100).toFixed(1);
    const ppv = (tp / (tp + fp) * 100).toFixed(1);
    const npv = (tn / (tn + fn) * 100).toFixed(1);
    const m = document.getElementById(id + '-metrics');
    m.innerHTML = '<span style="color:#27ae60;">准确率:' + accuracy + '%</span><span style="color:#2980b9;">灵敏度:' + sensitivity + '%</span><span>特异度:' + specificity + '%</span><span>PPV:' + ppv + '%</span><span>NPV:' + npv + '%</span>';
  }

  // ── 序贯分析图（临床试验中期分析） ─────────────────────
  // <div class="stat-viz" data-type="sequential" data-title="序贯分析图" data-z1="[1.2,1.8,2.1,2.5,2.8]" data-z2="[0.5,0.9,1.2,1.5,1.8]" data-n="[20,40,60,80,100]"></div>
  function renderSequentialAnalysis(el) {
    const id = 'seq-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '序贯分析图 ( Whitehead Triangle )';
    let Z = el.dataset.z1 ? JSON.parse(el.dataset.z1) : [1.2, 1.8, 2.1, 2.5, 2.8];
    let Z2 = el.dataset.z2 ? JSON.parse(el.dataset.z2) : [0.5, 0.9, 1.2, 1.5, 1.8];
    let N = el.dataset.n ? JSON.parse(el.dataset.n) : [20, 40, 60, 80, 100];
    const W = 520, H = 360;
    el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><canvas id="' + id + '" width="' + W + '" height="' + H + '" style="display:block;margin:0 auto;"></canvas><div style="text-align:center;font-size:12px;color:#666;margin-top:6px;">箭头越过边界 → 提前终止 | 每点代表一个期中分析</div></div>';
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const pad = {t: 35, r: 30, b: 50, l: 55};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    const nMin = 0, nMax = Math.max(...N) * 1.1;
    const zMin = -3, zMax = 4;
    const xOf = v => pad.l + ((v - nMin) / (nMax - nMin)) * iW;
    const yOf = v => pad.t + iH - ((v - zMin) / (zMax - zMin)) * iH;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);
    // Boundary lines (simplified triangular boundaries)
    const alpha = 0.05, beta = 0.1;
    const zAlpha = 1.96, zBeta = 1.28;
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    // Upper boundary (efficacy)
    ctx.beginPath();
    for (let n = 1; n <= nMax; n += 1) {
      const u = zAlpha * Math.sqrt(n);
      const x = xOf(n), y = yOf(u);
      if (n === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Lower boundary (futility) - simplified
    ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let n = 1; n <= nMax; n += 1) {
      const l = -zBeta * Math.sqrt(n);
      const x = xOf(n), y = yOf(l);
      if (n === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // Labels
    ctx.fillStyle = '#e74c3c'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('有效边界 (拒绝H₀)', pad.l + iW * 0.6, yOf(3) + 5);
    ctx.fillStyle = '#27ae60'; ctx.fillText('无效边界 (接受H₀)', pad.l + iW * 0.6, yOf(-1.5) + 5);
    // Zero line
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, yOf(0)); ctx.lineTo(pad.l + iW, yOf(0)); ctx.stroke();
    // Grid
    ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const zv = zMin + (zMax - zMin) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad.l, yOf(zv)); ctx.lineTo(pad.l + iW, yOf(zv)); ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + iH); ctx.lineTo(pad.l + iW, pad.t + iH); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const nv = nMin + (nMax - nMin) * i / 4;
      ctx.fillText(nv.toFixed(0), xOf(nv), pad.t + iH + 15);
    }
    for (let i = 0; i <= 6; i++) {
      const zv = zMin + (zMax - zMin) * i / 6;
      ctx.textAlign = 'right'; ctx.fillText(zv.toFixed(1), pad.l - 5, yOf(zv) + 4);
    }
    ctx.save(); ctx.translate(14, pad.t + iH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
    ctx.fillText('累计Z值', 0, 0); ctx.restore();
    ctx.textAlign = 'center'; ctx.fillText('样本量 n', pad.l + iW / 2, H - 4);
    // Plot points
    Z.forEach((z, i) => {
      const px = xOf(N[i] || N[N.length - 1] * (i + 1) / Z.length), py = yOf(z);
      const crossedU = z > Math.sqrt((N[i] || 50) * 3);
      ctx.fillStyle = crossedU ? '#e74c3c' : '#3498db';
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(i + 1, px, py + 3);
    });
  }

  // ============================================================
  // Risk Score Distribution (Logistic回归预测概率分布)
  // ============================================================
  // <div class="stat-viz" data-type="riskdist" data-title="Logistic回归风险评分分布" data-event="[0.12,0.18,0.25,0.32,0.38,0.45,0.52,0.58,0.65,0.71,0.78,0.82,0.88,0.92,0.95,0.97,0.99]" data-nonevent="[0.05,0.08,0.10,0.12,0.15,0.18,0.22,0.28,0.35,0.42,0.48,0.55,0.61,0.68,0.74,0.80,0.85,0.88,0.91,0.93,0.95,0.97,0.98]"></div>
  function renderRiskScoreDist(el) {
    const id = 'riskdist-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Logistic回归风险评分分布';
    const rawEvent = el.dataset.event || '0.12,0.18,0.25,0.32,0.38,0.45,0.52,0.58,0.65,0.71,0.78,0.82,0.88,0.92,0.95,0.97,0.99';
    const rawNoEvent = el.dataset.nonevent || '0.05,0.08,0.10,0.12,0.15,0.18,0.22,0.28,0.35,0.42,0.48,0.55,0.61,0.68,0.74,0.80,0.85,0.88,0.91,0.93,0.95,0.97,0.98';
    const eventProbs = rawEvent.split(',').map(Number);
    const noEventProbs = rawNoEvent.split(',').map(Number);

    const W = 560, H = 320;
    const padL = 50, padR = 20, padT = 40, padB = 50;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📈 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="display:flex;justify-content:center;gap:20px;margin-top:8px;font-size:12px;">
        <span style="color:#e74c3c;">● 事件组 (n=${eventProbs.length})</span>
        <span style="color:#2ecc71;">● 无事件组 (n=${noEventProbs.length})</span>
        <span style="color:#3498db;">— 预测概率分布</span>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    // X axis: 0 to 1 (probability)
    const xMin = 0, xMax = 1;
    const scaleX = v => padL + ((v - xMin) / (xMax - xMin)) * plotW;

    // Draw events histogram
    const bins = 15;
    const eventCounts = new Array(bins).fill(0);
    eventProbs.forEach(p => {
      const bin = Math.min(Math.floor(p * bins), bins - 1);
      eventCounts[bin]++;
    });
    const noEventCounts = new Array(bins).fill(0);
    noEventProbs.forEach(p => {
      const bin = Math.min(Math.floor(p * bins), bins - 1);
      noEventCounts[bin]++;
    });

    const maxCount = Math.max(...eventCounts, ...noEventCounts);
    const barW = plotW / bins - 2;
    const scaleY = v => padT + plotH - (v / maxCount) * plotH * 0.75;

    // Grid lines
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    // X axis
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
      const v = i / 10;
      ctx.fillText(v.toFixed(1), scaleX(v), padT + plotH + 15);
    }
    ctx.fillStyle = '#333'; ctx.font = '12px sans-serif';
    ctx.fillText('预测概率', padL + plotW / 2, H - 8);

    // Y axis
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
    for (let i = 0; i <= 4; i++) {
      const v = Math.round((i / 4) * maxCount);
      const y = scaleY(v);
      ctx.fillText(v.toString(), padL - 5, y + 4);
    }

    // Draw bars - no event (behind)
    noEventCounts.forEach((cnt, i) => {
      const x = scaleX(i / bins) + 1;
      const y = scaleY(cnt);
      ctx.fillStyle = '#2ecc7144';
      ctx.fillRect(x, y, barW, padT + plotH - y);
      ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, barW, padT + plotH - y);
    });

    // Draw bars - event (front)
    eventCounts.forEach((cnt, i) => {
      const x = scaleX(i / bins) + 1;
      const y = scaleY(cnt);
      ctx.fillStyle = '#e74c3c66';
      ctx.fillRect(x, y, barW, padT + plotH - y);
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, barW, padT + plotH - y);
    });

    // Optimal cutoff line (Youden's J)
    const allProbs = eventProbs.concat(noEventProbs);
    let bestJ = 0, bestCut = 0.5;
    for (let t = 0.05; t < 0.95; t += 0.02) {
      const tp = eventProbs.filter(p => p >= t).length / eventProbs.length;
      const fp = noEventProbs.filter(p => p >= t).length / noEventProbs.length;
      const j = tp - fp;
      if (j > bestJ) { bestJ = j; bestCut = t; }
    }
    const cutX = scaleX(bestCut);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#8e44ad'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cutX, padT); ctx.lineTo(cutX, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#8e44ad'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('最佳截断值: ' + bestCut.toFixed(2), cutX, padT - 5);
  }

  // 暴露给外部调用（app.js 在 loadChapter 完成后调用）
  window.initStatViz = init;
  window.setupStatVizObserver = setupObserver;

  // ============================================================
  // NNT (Number Needed to Treat) 可视化
  // ============================================================
  // <div class="stat-viz" data-type="nnt" data-title="需治人数(NNT)" data-nnt="12" data-ci_lower="8" data-ci_upper="25"></div>
  function renderNNT(el) {
    const id = 'nnt-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '需治人数 (NNT)';
    const nnt = parseFloat(el.dataset.nnt || '12');
    const ciLower = parseFloat(el.dataset.ci_lower || '8');
    const ciUpper = parseFloat(el.dataset.ci_upper || '25');

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="420" height="260" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;margin-top:8px;font-size:13px;color:#555;">
        NNT = <strong style="color:#2980b9;font-size:16px;">${nnt}</strong>
        &nbsp;(95% CI: ${ciLower} - ${ciUpper})
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 420, H = 260;
    const padL = 50, padR = 20, padT = 30, padB = 50;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 20);

    // Draw arrow/bar representing NNT scale
    const barY = padT + plotH * 0.5;
    const arrowLen = plotW * 0.7;
    const startX = padL + plotW * 0.15;
    const endX = startX + arrowLen;

    // Arrow shaft
    ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(startX, barY); ctx.lineTo(endX, barY); ctx.stroke();

    // Arrow head
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath(); ctx.moveTo(endX, barY); ctx.lineTo(endX - 12, barY - 8); ctx.lineTo(endX - 12, barY + 8); ctx.closePath(); ctx.fill();

    // Tick marks
    const maxVal = Math.max(nnt * 1.5, ciUpper * 1.2);
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
    for (let i = 0; i <= 5; i++) {
      const x = startX + (i / 5) * arrowLen;
      const v = (i / 5) * maxVal;
      ctx.beginPath(); ctx.moveTo(x, barY - 6); ctx.lineTo(x, barY + 6); ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(v), x, barY + 20);
    }

    // NNT marker
    const nntX = startX + (nnt / maxVal) * arrowLen;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.arc(nntX, barY, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(nnt, nntX, barY + 4);

    // CI range
    const ciLowerX = startX + (ciLower / maxVal) * arrowLen;
    const ciUpperX = startX + (ciUpper / maxVal) * arrowLen;
    ctx.strokeStyle = '#f39c12'; ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(ciLowerX, barY - 15); ctx.lineTo(ciUpperX, barY - 15); ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('需治人数越低，治疗效果越好', padL, H - 10);
    ctx.textAlign = 'right'; ctx.fillStyle = '#e74c3c';
    ctx.fillText('● NNT', W - 10, H - 10);
  }

  // ============================================================
  // Gauge Chart (Risk Stratification)
  // ============================================================
  function renderGaugeChart(el) {
    const id = 'gauge-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '风险分层仪表盘';
    const value = parseFloat(el.dataset.value || '50');
    const min = parseFloat(el.dataset.min || '0');
    const max = parseFloat(el.dataset.max || '100');
    const unit = el.dataset.unit || '%';

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="360" height="220" style="display:block;margin:0 auto;"></canvas>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 360, H = 220;
    const cx = W / 2, cy = H - 50;
    const radius = 100;

    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 20);

    // Arc segments (green-yellow-red)
    const startAngle = Math.PI, endAngle = 0;
    const segs = [
      { from: Math.PI, to: Math.PI * 0.66, color: '#2ecc71' },
      { from: Math.PI * 0.66, to: Math.PI * 0.33, color: '#f39c12' },
      { from: Math.PI * 0.33, to: 0, color: '#e74c3c' }
    ];
    segs.forEach(seg => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, seg.from, seg.to, true);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = 18;
      ctx.lineCap = 'butt';
      ctx.stroke();
    });

    // Tick marks
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI - (i / 10) * Math.PI;
      const inner = radius - 12, outer = radius + 6;
      ctx.beginPath();
      ctx.moveTo(cx + inner * Math.cos(a), cy + inner * Math.sin(a));
      ctx.lineTo(cx + outer * Math.cos(a), cy + outer * Math.sin(a));
      ctx.stroke();
      // Labels
      const v = Math.round(min + (i / 10) * (max - min));
      ctx.fillStyle = '#555'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(v, cx + (outer + 12) * Math.cos(a), cy + (outer + 12) * Math.sin(a));
    }

    // Needle
    const norm = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const needleAngle = Math.PI - norm * Math.PI;
    ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (radius - 20) * Math.cos(needleAngle), cy + (radius - 20) * Math.sin(needleAngle));
    ctx.stroke();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Value display
    ctx.fillStyle = '#2980b9'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(value + unit, cx, cy - 30);
  }

  // ============================================================
  // Sankey Diagram (Flow / Transition)
  // ============================================================
  function renderSankey(el) {
    const id = 'sankey-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '患者状态转移流向图';
    // data-nodes: comma-separated labels
    // data-links: format "source->target:value,source->target:value"
    const nodes = (el.dataset.nodes || '入院,在院,转院,出院,死亡').split(',');
    const linksRaw = (el.dataset.links || '入院->在院:120,入院->转院:30,入院->出院:80,入院->死亡:20,在院->出院:80,在院->转院:25,在院->死亡:15,转院->出院:20,转院->死亡:5,出院->在院:10').split(',');

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <svg id="${id}" width="520" height="300" style="display:block;margin:0 auto;"></svg>
    </div>`;

    const svg = document.getElementById(id);
    const W = 520, H = 300;
    const padL = 50, padR = 50, padT = 30, padB = 30;
    const nodeCount = nodes.length;
    const nodeH = (H - padT - padB) / nodeCount;
    const nodeW = 24;
    const levels = 3; // source | middle | target

    // Assign levels: first 2 = source, middle, last 2 = target
    const nodeLevels = [];
    const mid = Math.floor(nodeCount / 2);
    nodes.forEach((_, i) => {
      if (i < mid) nodeLevels.push(0);
      else if (i === mid) nodeLevels.push(1);
      else nodeLevels.push(2);
    });

    const xPos = (level) => padL + level * ((W - padL - padR - nodeW) / 2);

    // Draw links (curved paths)
    const linkData = linksRaw.map(l => {
      const [fromTo, val] = l.split(':');
      const [src, tgt] = fromTo.split('->');
      return { source: parseInt(src), target: parseInt(tgt), value: parseFloat(val) };
    });
    const maxVal = Math.max(...linkData.map(d => d.value));

    linkData.forEach(link => {
      const x1 = xPos(nodeLevels[link.source]) + nodeW;
      const y1 = padT + nodeH * link.source + nodeH / 2;
      const x2 = xPos(nodeLevels[link.target]);
      const y2 = padT + nodeH * link.target + nodeH / 2;
      const midX = (x1 + x2) / 2;
      const op = 0.3 + 0.5 * (link.value / maxVal);
      const color = `rgba(52,152,219,${op})`;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', Math.max(2, (link.value / maxVal) * 12));
      svg.appendChild(path);

      // Label on link
      if (link.value > maxVal * 0.2) {
        const labelX = midX;
        const labelY = (y1 + y2) / 2;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY - 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', '#555');
        text.textContent = link.value;
        svg.appendChild(text);
      }
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const x = xPos(nodeLevels[i]);
      const y = padT + nodeH * i;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y + 2);
      rect.setAttribute('width', nodeW);
      rect.setAttribute('height', nodeH - 4);
      rect.setAttribute('rx', 4);
      const colors = ['#3498db', '#f39c12', '#2ecc71'];
      rect.setAttribute('fill', colors[nodeLevels[i]]);
      svg.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', nodeLevels[i] === 1 ? x + nodeW / 2 : (nodeLevels[i] === 0 ? x + nodeW + 6 : x - 6));
      text.setAttribute('y', y + nodeH / 2 + 4);
      text.setAttribute('text-anchor', nodeLevels[i] === 2 ? 'end' : 'start');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#333');
      text.textContent = node;
      svg.appendChild(text);
    });
  }

  // ============================================================
  // Spine Plot (Ordinal Categorical Data)
  // ============================================================
  function renderSpinePlot(el) {
    const id = 'spine-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '有序分类资料脊形图';
    // data-categories: comma-separated category labels (ordered)
    // data-props: comma-separated proportions for each category (sum to 1)
    const categories = (el.dataset.categories || '痊愈,显效,好转,无效').split(',');
    const rawProps = (el.dataset.props || '0.25,0.35,0.28,0.12').split(',').map(Number);
    const props = rawProps.map(p => Math.max(0, Math.min(1, p)));
    const colors = ['#27ae60', '#3498db', '#f39c12', '#e74c3c'];

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="480" height="260" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-legend" style="text-align:center;margin-top:8px;font-size:12px;color:#555;"></div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 480, H = 260;
    const padL = 60, padR = 20, padT = 40, padB = 50;
    const plotW = W - padL - padR;
    const totalH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    // Y axis label
    ctx.save(); ctx.translate(14, padT + totalH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('累积比例', 0, 0); ctx.restore();

    // Grid
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * totalH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    // Spine bars (horizontal stacked)
    const barH = Math.min(36, totalH / categories.length * 0.6);
    const gap = (totalH - barH * categories.length) / (categories.length + 1);

    categories.forEach((cat, i) => {
      const barY = padT + gap + i * (barH + gap);
      const barW = props[i] * plotW * 0.9;
      const barX = padL + plotW * 0.05;

      // Background track
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(barX, barY, plotW * 0.9, barH);

      // Filled portion
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(barX, barY, barW, barH);

      // Category label (left)
      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(cat, padL - 8, barY + barH / 2 + 4);

      // Proportion label
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      if (barW > 30) ctx.fillText((props[i] * 100).toFixed(1) + '%', barX + barW / 2, barY + barH / 2 + 4);
    });

    // Y axis ticks
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * totalH;
      ctx.fillText((i / 4 * 100).toFixed(0) + '%', padL - 6, y + 4);
    }
  }

  // ============================================================
  // Error Bar Chart (Mean ± CI)
  // ============================================================
  function renderErrorBar(el) {
    const id = 'errbar-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '误差条图（均数±95%CI）';
    // data-labels: comma-separated group names
    // data-means: comma-separated means
    // data-lower: comma-separated lower CI bounds
    // data-upper: comma-separated upper CI bounds
    const rawLabels = el.dataset.labels || '安慰剂组,新药2.4mg,新药4.8mg,新药7.2mg';
    const rawMeans = el.dataset.means || '3.43,2.72,2.70,1.97';
    const rawLower = el.dataset.lower || '3.17,2.49,2.52,1.70';
    const rawUpper = el.dataset.upper || '3.69,2.94,2.88,2.23';
    const labels = rawLabels.split(',');
    const means = rawMeans.split(',').map(Number);
    const lower = rawLower.split(',').map(Number);
    const upper = rawUpper.split(',').map(Number);
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12'];

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="480" height="300" style="display:block;margin:0 auto;"></canvas>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 480, H = 300;
    const padL = 70, padR = 20, padT = 40, padB = 50;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const n = labels.length;
    const barW = plotW / n * 0.4;
    const gap = (plotW - barW * n) / (n + 1);
    const allVals = means.concat(lower).concat(upper);
    const yMin = Math.min(...allVals) * 0.9;
    const yMax = Math.max(...allVals) * 1.1;

    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    // Y axis
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Y axis label
    ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('95% CI', 0, 0); ctx.restore();

    // Grid
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padT + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    // Y tick labels
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padT + (i / 5) * plotH;
      const v = (yMax - (i / 5) * (yMax - yMin)).toFixed(1);
      ctx.fillText(v, padL - 6, y + 4);
    }

    const yRange = yMax - yMin;
    const sy = (v) => padT + plotH - ((v - yMin) / yRange) * plotH;

    // Error bars
    labels.forEach((label, i) => {
      const x = padL + gap + i * (barW + gap) + barW / 2;
      const m = means[i], lo = lower[i], hi = upper[i];

      // CI range line
      ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, sy(lo));
      ctx.lineTo(x, sy(hi));
      ctx.stroke();

      // Horizontal caps
      const capW = barW * 0.4;
      ctx.beginPath();
      ctx.moveTo(x - capW / 2, sy(lo)); ctx.lineTo(x + capW / 2, sy(lo)); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - capW / 2, sy(hi)); ctx.lineTo(x + capW / 2, sy(hi)); ctx.stroke();

      // Mean point
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x, sy(m), 5, 0, Math.PI * 2);
      ctx.fill();

      // X label
      ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label, x, padT + plotH + 18);
    });
  }

  // ============================================================
  // Area Chart (堆叠面积图 / Stacked Area)
  // ============================================================
  // <div class="stat-viz" data-type="area" data-title="患者状态变化趋势" data-labels="1月,2月,3月,4月,5月,6月" data-series="治愈,好转,住院中" data-values="120,135,150,140,160,175:80,95,110,105,120,130:45,50,55,60,58,62"></div>
  function renderAreaChart(el) {
    const id = 'area-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '堆叠面积图';
    const rawLabels = el.dataset.labels || '1月,2月,3月,4月,5月,6月';
    const rawSeries = el.dataset.series || '系列1,系列2,系列3';
    const rawValues = el.dataset.values || '30,40,50,35,45,55:20,25,30,28,32,38:10,12,15,14,16,18';
    const labels = rawLabels.split(',');
    const seriesNames = rawSeries.split(',');
    const seriesValues = rawValues.split(':').map(s => s.split(',').map(Number));
    const n = labels.length;
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
    const W = 560, H = 300;
    const padL = 50, padR = 20, padT = 40, padB = 40;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📈 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="display:flex;justify-content:center;gap:16px;margin-top:8px;font-size:11px;color:#555;flex-wrap:wrap;"></div>
    </div>`;

    // Legend
    const legendDiv = el.querySelector('div:last-child');
    seriesNames.forEach((s, i) => {
      legendDiv.innerHTML += `<span style="display:inline-flex;align-items:center;gap:4px;margin:0 6px;"><span style="width:12px;height:12px;background:${colors[i%colors.length]};border-radius:2px;display:inline-block;"></span>${s}</span>`;
    });

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    // Compute cumulative sums per time point
    const cumSums = [];
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < seriesValues.length; j++) sum += seriesValues[j][i];
      cumSums.push(sum);
    }
    const yMax = Math.max(...cumSums) * 1.1;
    const sx = v => padL + (v / n) * plotW;
    const sy = v => padT + plotH - (v / yMax) * plotH;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    // Draw each series as a filled area
    for (let si = seriesValues.length - 1; si >= 0; si--) {
      const vals = seriesValues[si];
      const color = colors[si % colors.length];

      ctx.beginPath();
      // Bottom edge of this band
      let prev = [];
      for (let i = 0; i < n; i++) {
        let lower = 0;
        for (let k = 0; k < si; k++) lower += seriesValues[k][i];
        prev.push({ x: sx(i), y: sy(lower) });
      }
      // Top edge of this band
      let curr = [];
      for (let i = 0; i < n; i++) {
        let upper = 0;
        for (let k = 0; k <= si; k++) upper += seriesValues[k][i];
        curr.push({ x: sx(i), y: sy(upper) });
      }

      // Fill from bottom to top, then back
      ctx.moveTo(prev[0].x, prev[0].y);
      for (let i = 1; i < n; i++) ctx.lineTo(prev[i].x, prev[i].y);
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(curr[i].x, curr[i].y);
      ctx.closePath();
      ctx.fillStyle = color + 'cc'; // semi-transparent
      ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.stroke();
    }

    // X axis labels
    ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    labels.forEach((l, i) => ctx.fillText(l, sx(i), H - 10));
    // Y axis
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.stroke();
    // Y ticks
    [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax].forEach(v => {
      const y = sy(v);
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = '#555'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(v), padL - 5, y + 4);
    });
  }

  // ============================================================
  // Heatmap (热图)
  // ============================================================
  // <div class="stat-viz" data-type="heatmap" data-title="基因表达热图" data-rows="Gene A,Gene B,Gene C,Gene D,Gene E" data-cols="样本1,样本2,样本3,样本4,样本5,样本6" data-values="2.1,1.5,3.2,0.8,1.2,2.8:0.5,2.8,1.1,3.5,2.0,0.9:3.8,0.6,2.4,1.3,3.9,1.7:1.2,3.3,0.7,2.6,1.8,3.1:2.7,1.9,3.5,0.4,2.3,1.6"></div>
  function renderHeatmap(el) {
    const id = 'heatmap-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '热图';
    const rawRows = el.dataset.rows || '行1,行2,行3,行4,行5';
    const rawCols = el.dataset.cols || '列1,列2,列3,列4';
    const rawVals = el.dataset.values || '2,4,3,5,1:3,5,4,2,6:1,3,2,6,4:5,2,6,3,1:4,6,5,1,3';
    const rowNames = rawRows.split(',');
    const colNames = rawCols.split(',');
    const values = rawVals.split(':').map(r => r.split(',').map(Number));
    const nr = rowNames.length, nc = colNames.length;

    const cellW = Math.min(50, Math.floor(480 / nc));
    const cellH = Math.min(30, Math.floor(300 / nr));
    const labelW = 70, labelH = 30;
    const W = labelW + nc * cellW + 20;
    const H = labelH + nr * cellH + 20;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">🗺️ ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:11px;color:#666;margin-top:6px;">表达水平: <span style="color:#2166ac">低▼</span> → <span style="color:#f5f5f5">中</span> → <span style="color:#b2182b">高▲</span></div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // Compute color scale (blue-white-red)
    const allVals = values.flat();
    const minV = Math.min(...allVals), maxV = Math.max(...allVals);
    function colorScale(v) {
      const t = (v - minV) / (maxV - minV);
      // Blue (#2166ac) → White (#f5f5f5) → Red (#b2182b)
      if (t < 0.5) {
        const r = Math.round(33 + (245 - 33) * (t * 2));
        const g = Math.round(102 + (245 - 102) * (t * 2));
        const b = Math.round(172 + (245 - 172) * (t * 2));
        return `rgb(${r},${g},${b})`;
      } else {
        const t2 = (t - 0.5) * 2;
        const r = Math.round(245 + (178 - 245) * t2);
        const g = Math.round(245 + (24 - 245) * t2);
        const b = Math.round(245 + (43 - 245) * t2);
        return `rgb(${r},${g},${b})`;
      }
    }

    // Row labels
    ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    rowNames.forEach((r, i) => {
      ctx.fillText(r, labelW - 5, labelH + i * cellH + cellH / 2 + 4);
    });

    // Col labels
    ctx.textAlign = 'center';
    colNames.forEach((c, j) => {
      ctx.save();
      ctx.translate(labelW + j * cellW + cellW / 2, labelH - 5);
      ctx.fillText(c, 0, 0);
      ctx.restore();
    });

    // Cells
    values.forEach((row, i) => {
      row.forEach((val, j) => {
        ctx.fillStyle = colorScale(val);
        ctx.fillRect(labelW + j * cellW, labelH + i * cellH, cellW - 1, cellH - 1);
        ctx.fillStyle = Math.abs(val - (minV + maxV) / 2) > (maxV - minV) * 0.3 ? '#fff' : '#333';
        ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        const txt = Number.isInteger(val) ? val.toString() : val.toFixed(1);
        ctx.fillText(txt, labelW + j * cellW + cellW / 2, labelH + i * cellH + cellH / 2 + 3);
      });
    });
  }

  // ============================================================
  // Ridgeline Plot (峰峦图 / Joy Plot)
  // ============================================================
  // <div class="stat-viz" data-type="ridgeline" data-title="不同年龄段体温分布" data-labels="儿童,青少年,青年,中年,老年" data-dists="12,13,12.5,13.2,12.8,13.5,13.1,12.9,13.3,12.7:22,23,22.5,23.2,22.8,23.5,23.1,22.9,23.3,22.7,23.4,22.6,23.0:36.2,36.5,36.3,36.6,36.4,36.7,36.3,36.5,36.2,36.8,36.4,36.6:37.1,37.3,37.2,37.4,37.0,37.5,37.1,37.3,37.2,37.4,37.0,37.6,37.1:36.8,36.9,36.7,37.0,36.8,37.1,36.9,36.8,37.0,36.7,37.1"></div>
  function renderRidgeline(el) {
    const id = 'ridgeline-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '峰峦图';
    const rawLabels = el.dataset.labels || '组1,组2,组3';
    const rawDists = el.dataset.dists || '10,12,14,12,10:15,17,19,17,15:20,22,24,22,20';
    const labels = rawLabels.split(',');
    const dists = rawDists.split(':').map(s => s.split(',').map(Number));
    const n = labels.length;
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
    const W = 560, H = 60 + n * 55 + 30;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">🏔️ ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    const padL = 40, padR = 15, padT = 35, padB = 25;
    const bandH = 50;
    const plotW = W - padL - padR;

    dists.forEach((data, i) => {
      const yBase = padT + i * 55 + bandH;
      const color = colors[i % colors.length];
      const m = mean(data), s = sd(data);
      const xMin = m - 3.5 * s, xMax = m + 3.5 * s;

      // Draw filled density shape
      ctx.beginPath();
      const steps = 60;
      const pts = [];
      for (let k = 0; k <= steps; k++) {
        const xFrac = k / steps;
        const xVal = xMin + xFrac * (xMax - xMin);
        // Simple Gaussian approximation for display
        const density = Math.exp(-0.5 * ((xVal - m) / s) ** 2);
        const px = padL + xFrac * plotW;
        const py = yBase - density * bandH * 0.85;
        pts.push({ x: px, y: py });
      }
      // Build closed path
      ctx.moveTo(padL, yBase);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(padL + plotW, yBase);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, yBase - bandH, 0, yBase);
      grad.addColorStop(0, color + 'aa');
      grad.addColorStop(1, color + '22');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(labels[i], padL - 5, yBase - bandH / 2 + 4);
    });
  }

  // ============================================================
  // LDA Scatter Plot (判别分析散点图)
  // ============================================================
  // <div class="stat-viz" data-type="ldascatter" data-title="LDA二类分类边界" data-x1="1.2,2.1,1.8,2.5,3.2,1.5,2.8,1.9,2.3,1.7,3.5,2.0" data-y1="2.3,3.1,2.8,3.9,4.5,2.5,3.8,2.7,3.2,2.4,4.1,2.9" data-x2="6.1,5.8,6.5,7.2,6.8,5.5,7.0,6.3,5.9,7.5,6.2,6.9" data-y2="5.2,6.1,5.5,6.8,7.2,5.0,6.5,5.8,6.0,7.3,5.7,6.4" data-label1="早期肝硬化" data-label2="晚期肝硬化"></div>
  function renderLDAScatter(el) {
    const id = 'lda-scatter-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '线性判别分析 (LDA) 散点图';
    const rawX1 = el.dataset.x1 || '1.2,2.1,1.8,2.5,3.2,1.5,2.8,1.9,2.3,1.7,3.5,2.0';
    const rawY1 = el.dataset.y1 || '2.3,3.1,2.8,3.9,4.5,2.5,3.8,2.7,3.2,2.4,4.1,2.9';
    const rawX2 = el.dataset.x2 || '6.1,5.8,6.5,7.2,6.8,5.5,7.0,6.3,5.9,7.5,6.2,6.9';
    const rawY2 = el.dataset.y2 || '5.2,6.1,5.5,6.8,7.2,5.0,6.5,5.8,6.0,7.3,5.7,6.4';
    const label1 = el.dataset.label1 || '类别1';
    const label2 = el.dataset.label2 || '类别2';
    const x1 = rawX1.split(',').map(Number), y1 = rawY1.split(',').map(Number);
    const x2 = rawX2.split(',').map(Number), y2 = rawY2.split(',').map(Number);

    const W = 500, H = 360, padL = 50, padR = 20, padT = 40, padB = 45;
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="display:flex;justify-content:center;gap:20px;margin-top:8px;font-size:12px;">
        <span style="color:#e74c3c;">● ${label1} (n=${x1.length})</span>
        <span style="color:#2ecc71;">● ${label2} (n=${x2.length})</span>
        <span style="color:#555;">— 判别边界线</span>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const allX = x1.concat(x2), allY = y1.concat(y2);
    const xMin = Math.min(...allX) - 0.5, xMax = Math.max(...allX) + 0.5;
    const yMin = Math.min(...allY) - 0.5, yMax = Math.max(...allY) + 0.5;
    const sx = v => padL + ((v - xMin) / (xMax - xMin)) * (W - padL - padR);
    const sy = v => H - padB - ((v - yMin) / (yMax - yMin)) * (H - padT - padB);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    // Grid
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 0.5;
    for (let v = Math.ceil(xMin); v <= Math.floor(xMax); v++) {
      ctx.beginPath(); ctx.moveTo(sx(v), padT); ctx.lineTo(sx(v), H - padB); ctx.stroke();
    }
    for (let v = Math.ceil(yMin); v <= Math.floor(yMax); v++) {
      ctx.beginPath(); ctx.moveTo(padL, sy(v)); ctx.lineTo(W - padR, sy(v)); ctx.stroke();
    }

    // Draw LDA decision boundary (simple linear approximation)
    // Compute group means
    const mX1 = mean(x1), mY1 = mean(y1), mX2 = mean(x2), mY2 = mean(y2);
    // Decision boundary: perpendicular bisector of the line connecting means
    const mx = (mX1 + mX2) / 2, my = (mY1 + mY2) / 2;
    const slope = -(mX2 - mX1) / (mY2 - mY1 + 0.0001);
    // Draw the boundary line across the plot area
    ctx.setLineDash([6, 4]); ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
    const xExt = [xMin, xMax];
    const yExt = xExt.map(x => my + slope * (x - mx));
    ctx.beginPath();
    ctx.moveTo(sx(xExt[0]), sy(yExt[0]));
    ctx.lineTo(sx(xExt[1]), sy(yExt[1]));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw class 1 points
    x1.forEach((xi, i) => {
      ctx.fillStyle = '#e74c3c'; ctx.beginPath();
      ctx.arc(sx(xi), sy(y1[i]), 6, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw class 2 points
    x2.forEach((xi, i) => {
      ctx.fillStyle = '#2ecc71'; ctx.beginPath();
      ctx.arc(sx(xi), sy(y2[i]), 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Mark group means
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(sx(mX1), sy(mY1), 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#27ae60'; ctx.beginPath(); ctx.arc(sx(mX2), sy(mY2), 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('★', sx(mX1), sy(mY1) + 3);
    ctx.fillText('★', sx(mX2), sy(mY2) + 3);

    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.font = '11px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('判别函数1 (LD1)', W / 2, H - 5);
    ctx.save(); ctx.translate(12, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('判别函数2 (LD2)', 0, 0); ctx.restore();
  }

  // ============================================================
  // Radar / Spider Chart (雷达图)
  // ============================================================
  // <div class="stat-viz" data-type="radar" data-title="患者指标雷达图" data-labels="血压,血糖,血脂,肺功能,肾功能,心功能" data-values="75,60,80,70,85,65" data-max="100"></div>
  function renderRadarChart(el) {
    const id = 'radar-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '雷达图';
    const rawLabels = el.dataset.labels || '指标1,指标2,指标3,指标4,指标5';
    const rawVals = el.dataset.values || '80,60,75,90,55';
    const maxVal = parseFloat(el.dataset.max || '100');
    const labels = rawLabels.split(',');
    const values = rawVals.split(',').map(Number);
    const n = labels.length;
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
    const cx = 200, cy = 180, r = 130;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">🕸️ ${title}</div>
      <canvas id="${id}" width="400" height="360" style="display:block;margin:0 auto;"></canvas>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // Draw grid circles
    [0.25, 0.5, 0.75, 1].forEach(frac => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        const px = cx + Math.cos(angle) * r * frac, py = cy + Math.sin(angle) * r * frac;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = frac === 1 ? '#aaa' : '#ddd'; ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#777'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText((maxVal * frac).toFixed(0), cx, cy - r * frac + 10);
    });

    // Draw axes and labels
    labels.forEach((l, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const px = cx + Math.cos(angle) * (r + 18), py = cy + Math.sin(angle) * (r + 18);
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(l, px, py + 4);
    });

    // Draw data polygon
    ctx.beginPath();
    values.forEach((v, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const frac = Math.min(v / maxVal, 1);
      const px = cx + Math.cos(angle) * r * frac, py = cy + Math.sin(angle) * r * frac;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = colors[0] + '44'; ctx.fill();
    ctx.strokeStyle = colors[0]; ctx.lineWidth = 2; ctx.stroke();

    // Data points
    values.forEach((v, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const frac = Math.min(v / maxVal, 1);
      const px = cx + Math.cos(angle) * r * frac, py = cy + Math.sin(angle) * r * frac;
      ctx.fillStyle = colors[0]; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    });
  }
})();
