import { registerViz, parseNumbers, mean, sd, sum } from './_core.js';

// ==========================================================
// HYPOTHESIS - 统计可视化模块
// ==========================================================

// ============================================================
// HYPOTHESIS - 统计可视化模块
// ============================================================

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
registerViz('ttest', renderTTest);

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
      if (rows === 2 && cols === 2) {
        const [a,b,c,d] = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1]];
        // 超几何分布精确 P（large samples return null, skip）
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

      // 只有 chi-square 不显著但 Fisher 显著时，才提示期望频数不足
      if (fisherP !== null && fisherP < 0.05 && !sig) {
        html += '<div class="calc-note">⚠️ 期望频数 < 5，建议用 Fisher 精确检验</div>';
      }

      resultEl.innerHTML = html;
    });
  }
registerViz('chisq', renderChiSq);

  // Fisher 精确检验（超几何分布）
  function hypergeometricTest(a, b, c, d) {
    const total = a + b + c + d;
    // Guard: Fisher exact test is only feasible for small samples.
    // For large tables (total > 500), skip to avoid browser freeze.
    if (total > 500) return null;
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

    // Guard: each group needs n >= 1
    if (means.some((m, i) => ns[i] < 1 || isNaN(ns[i]))) {
      el.innerHTML = '<div class="viz-card"><div class="viz-header"><span>📊 ANOVA</span></div><p style="padding:20px;color:#e74c3c;">每组样本量 n 必须 ≥ 1</p></div>';
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
registerViz('anova', renderANOVA);

  // ── F 分布探索器 ─────────────────────────────────
  // <div class="stat-viz" data-type="fdist" data-df1="2" data-df2="87"></div>

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
registerViz('scatter', renderScatterPlot);

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
registerViz('pca', renderScreePlot);

  // ── ANOVA 组间差异比较 ─────────────────────────────
  // <div class="stat-viz" data-type="anova" data-means="[10.5,13.2,15.8]" data-sds="[2.1,2.4,1.9]" data-ns="[30,30,30]" data-labels='["低剂量","中剂量","高剂量"]'></div>

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
registerViz('wilcoxon', renderWilcoxonSignedRank);

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
    const W = 560, canvasH = 300;
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${canvasH}" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="text-align:center;font-size:13px;margin-top:8px;color:#333;"></div>
    </div>`;
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, canvasH);
    const pad = {t:40, r:20, b:50, l:50};
    const iW = W - pad.l - pad.r, iH = canvasH - pad.t - pad.b;
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
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, canvasH-pad.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l, canvasH-pad.b); ctx.lineTo(W-pad.r, canvasH-pad.b); ctx.stroke();
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
      ctx.fillText(g.name, cx, canvasH - pad.b + 18);
      // 均值标注
      ctx.fillStyle = c; ctx.font = '11px sans-serif';
      ctx.fillText('μ=' + mean.toFixed(1), cx, pad.t - 8);
    });
    // 组名标签
    ctx.fillStyle = '#888'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('三组死亡率比较（方框=四分位须=范围 红线=中位数 点=均值）', W/2, canvasH - 5);
    // ── Kruskal-Wallis H 真实计算 ──────────────────────────
    // Step 1: 合并全部数据，统一编秩（遇相同值取平均秩）
    const N = allVals.length;
    const k = groups.length;
    const sortedAll = [...allVals].sort((a, b) => a - b);

    // 计算每个观测值的秩（含并列调整）
    const ranks = allVals.map((v) => {
      // 找这个值在全量中的所有位置
      const positions = [];
      sortedAll.forEach((sv, idx) => { if (sv === v) positions.push(idx + 1); });
      // 平均秩
      return positions.reduce((a, b) => a + b, 0) / positions.length;
    });

    // Step 2: 每个组的秩和
    let offset = 0;
    const groupRanks = groups.map(g => {
      const r = ranks.slice(offset, offset + g.values.length);
      offset += g.values.length;
      return { name: g.name, Ri: r.reduce((a, b) => a + b, 0), ni: g.values.length };
    });

    // Step 3: H 统计量
    const sumRi2ni = groupRanks.reduce((s, gr) => s + (gr.Ri * gr.Ri) / gr.ni, 0);
    const H_stat = (12 / (N * (N + 1))) * sumRi2ni - 3 * (N + 1);

    // Step 4: P 值（chi-square, df = k-1）
    const df = k - 1;
    const pVal = jStat.chisquare.cdf(H_stat, df);
    const pDisplay = (1 - pVal).toFixed(4);

    document.getElementById(id + '-result').innerHTML =
      `H = ${H_stat.toFixed(3)} (χ²=${H_stat.toFixed(3)}, df=${df}, P≈${pDisplay})` +
      (pDisplay < 0.05 ? ' — 三组死亡率差异有统计学意义 ✱' : ' — 三组差异无统计学意义');
  }
registerViz('kruskal', renderKruskalWallis);

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
    // ── Friedman M 真实计算 ─────────────────────────────────
    // 在每个区块内对各处理编秩（值越大秩越小，即 rank 越小）
    const b = nBlocks; // block 数
    const t = nTreat;  // 处理数
    const blockRanks = data.map(blockData => {
      // 按值升序排列，记录原始索引，然后赋予秩（1=最小值）
      const indexed = blockData.map((v, ti) => ({ v, ti }));
      indexed.sort((a, b) => a.v - b.v);
      const ranks = new Array(t);
      let i = 0;
      while (i < t) {
        let j = i;
        // 找相同值的范围
        while (j < t - 1 && indexed[j + 1].v === indexed[i].v) j++;
        const avgRank = (i + 1 + j + 1) / 2; // 平均秩（1-indexed）
        for (let k = i; k <= j; k++) ranks[indexed[k].ti] = avgRank;
        i = j + 1;
      }
      return ranks;
    });

    // 各处理的秩和
    const treatRankSums = treatments.map((_, ti) =>
      blockRanks.reduce((s, br) => s + br[ti], 0)
    );
    const meanRank = (t + 1) / 2; // 每个区块内 mean rank = (t+1)/2
    const expectedSum = b * meanRank;

    // M = Σ (Ri - b*meanRank)^2
    const M = treatRankSums.reduce((s, Ri) => s + (Ri - expectedSum) ** 2, 0);

    // χ² 近似（df = t-1），考虑 ties 的校正因子
    const totalPairs = b * t * (t + 1) / 2;
    let tieCorrection = 0;
    blockRanks.forEach(br => {
      const freq = {};
      br.forEach(r => { freq[r] = (freq[r] || 0) + 1; });
      Object.values(freq).forEach(f => { if (f > 1) tieCorrection += (f ** 3 - f); });
    });
    const Cf = 1 - tieCorrection / (b * t * (t ** 2 - 1));
    const chiSq = Cf > 0 && b > 1 ? (12 * M) / (b * t * (t + 1)) : 0;
    const df = t - 1;
    const pVal = jStat.chisquare.cdf(chiSq, df);
    const pDisplay = (1 - pVal).toFixed(4);

    document.getElementById(id + '-result').innerHTML =
      `Friedman M = ${M.toFixed(3)} (χ²=${chiSq.toFixed(3)}, df=${df}, P≈${pDisplay})` +
      (pDisplay < 0.05 ? ' — 各处理间差异有统计学意义 ✱' : ' — 各处理间差异无统计学意义');
  }
registerViz('friedman', renderFriedman);

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
registerViz('rminteraction', renderRepeatedMeasuresInteraction);

  // ── 偏相关 Venn 图 ───────────────────────────────────
  // <div class="stat-viz" data-type="partialcorr" data-title="偏相关分析"></div>

  function renderNormTest(el) {
    const id = 'normtest-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '正态性检验 Q-Q 图';
    const rawData = el.dataset.data || '72,80,85,88,90,92,95,97,98,100,102,104,105,107,108,110,112,115,118,120,125,128,132';
    const data = rawData.split(',').map(Number).filter(v => Number.isFinite(v)).sort((a, b) => a - b);
    const n = data.length;

    if (n < 3 || !window.jStat?.normal?.inv) {
      el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><p style="padding:20px;color:#666;">至少需要 3 个有效数据点，且需成功加载 jStat 才能绘制 Q-Q 图。</p></div>';
      return;
    }

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

      // Stats — 用原始未扰动数据计算偏度和峰度，并做防护
      let skewness = NaN, kurtosis = NaN;
      try {
        if (n >= 3) {
          skewness = jStat.skewness(data);
          kurtosis = jStat.kurtosis(data);
        }
      } catch(e) {}
      const skewStr = isNaN(skewness) ? '—' : skewness.toFixed(3);
      const kurtStr = isNaN(kurtosis) ? '—' : kurtosis.toFixed(3);
      document.getElementById(id + '-stats').textContent =
        `n=${n} | 偏度=${skewStr} | 峰度=${kurtStr} | 数据点越贴近红线越接近正态`;
    }

    draw(0);
    document.getElementById(id + '-skew').addEventListener('input', () => draw(parseInt(document.getElementById(id + '-skew').value)));
    document.getElementById(id + '-reset').addEventListener('click', () => { document.getElementById(id + '-skew').value = 0; draw(0); });
  }
registerViz('normtest', renderNormTest);

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
registerViz('interaction', renderFactorialInteraction);

  function renderBlandAltman(el) {
    const id = 'ba-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Bland-Altman 一致性分析';
    const method1 = el.dataset.method1 || '方法A';
    const method2 = el.dataset.method2 || '方法B';

    let delta = [10,15,12,8,18,11,14,9,13,16,7,20,5,17,14];
    let meanVals = [55,58,52,60,48,56,53,59,54,57,50,62,45,58,54];
    try {
      if (el.dataset.delta) delta = JSON.parse(el.dataset.delta);
      if (el.dataset.mean) meanVals = JSON.parse(el.dataset.mean);
    } catch (e) {
      console.warn('[stats-viz] blandaltman data parse failed, using fallback defaults', e);
    }
    delta = delta.filter(v => Number.isFinite(v));
    meanVals = meanVals.filter(v => Number.isFinite(v));
    const n = Math.min(delta.length, meanVals.length);
    if (n < 3) {
      el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><p style="padding:20px;color:#666;">Bland-Altman 图至少需要 3 对有效数据。</p></div>';
      return;
    }
    delta = delta.slice(0, n);
    meanVals = meanVals.slice(0, n);
    const W = 520, H = 340;
    el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><canvas id="' + id + '" width="' + W + '" height="' + H + '" style="display:block;margin:0 auto;"></canvas><div id="' + id + '-stats" style="text-align:center;font-size:12px;color:#555;margin-top:4px;"></div></div>';
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const pad = {t: 30, r: 25, b: 45, l: 55};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    const meanVal = delta.reduce((a, b) => a + b, 0) / delta.length;
    const sd = Math.sqrt(delta.reduce((s, d) => s + (d - meanVal) ** 2, 0) / (delta.length - 1));
    const xMin = Math.min(...meanVals) * 0.95;
    const xMax = Math.max(...meanVals) * 1.05;
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
      const x = xOf(meanVals[i]);
      const y = yOf(d);
      ctx.fillStyle = Math.abs(d) > 1.96 * sd ? '#e74c3c' : '#3498db';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    });
    // Stats
    document.getElementById(id + '-stats').textContent =
      'mean=' + meanVal.toFixed(2) + '  |  SD=' + sd.toFixed(2) + '  |  95%LoA: [' +
      (meanVal - 1.96 * sd).toFixed(2) + ', ' + (meanVal + 1.96 * sd).toFixed(2) + ']';
  }
registerViz('blandaltman', renderBlandAltman);
