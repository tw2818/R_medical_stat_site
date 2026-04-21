import { registerViz, parseNumbers, mean, sd, sum } from './_core.js';

function formatPValue(p) {
  if (p == null || Number.isNaN(p)) return '—';
  return p < 0.001 ? '< 0.001' : p.toFixed(4);
}

function displayTTestResult(el, r) {
  const pTwoStr = r.pTwo;
  const isPlt001 = typeof pTwoStr === 'string' && pTwoStr.trim().startsWith('<');
  const pNum = isPlt001 ? 0.0005 : parseFloat(pTwoStr);
  const pVal = Number.isNaN(pNum) ? null : pNum;
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
        ['均数差 (组1-组2)', r.diff],
        ['t 统计量', r.t],
        ['自由度 df', r.df],
        ['P 值（双侧）', `${r.pTwo} ${pTag}`],
        ['P 值（单侧）', r.pOne],
        ['95% CI', r.ci95],
      ];

  rows.forEach(([k, v]) => { html += `<div class="result-row"><span>${k}</span><span>${v}</span></div>`; });
  html += '</div>';
  el.innerHTML = html;
}

function renderTTest(el) {
  el.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'calc-card';
  card.innerHTML = `
    <div class="calc-header">🧮 t 检验计算器</div>
    <div class="calc-tabs">
      <button class="calc-tab active" data-tab="one-sample">单样本 t 检验</button>
      <button class="calc-tab" data-tab="two-sample">两样本 t 检验</button>
    </div>
    <div class="calc-body">
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
      if (Number.isNaN(mu0)) { alert('请输入有效的总体均数'); return; }

      const n = arr.length;
      const xbar = mean(arr);
      const s = sd(arr);
      const se = s / Math.sqrt(n);
      const df = n - 1;
      const tStat = (xbar - mu0) / se;

      let pTwo = NaN;
      let tCrit = 1.96;
      if (window.jStat && window.jStat.studentt) {
        pTwo = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));
        if (typeof jStat.studentt.inv === 'function') {
          tCrit = jStat.studentt.inv(0.975, df);
        }
      }

      const ci95 = [xbar - tCrit * se, xbar + tCrit * se];
      result = {
        type: 'one-sample t',
        n,
        xbar: xbar.toFixed(4),
        s: s.toFixed(4),
        t: tStat.toFixed(4),
        df,
        pTwo: formatPValue(pTwo),
        ci95: `[${ci95[0].toFixed(3)}, ${ci95[1].toFixed(3)}]`
      };
    } else {
      const g1 = parseNumbers(card.querySelector('[data-input="g1"]').value);
      const g2 = parseNumbers(card.querySelector('[data-input="g2"]').value);
      const equalVar = card.querySelector('[data-input="equal-var"]').checked;

      if (g1.length < 2 || g2.length < 2) { alert('每组至少输入2个数值'); return; }

      const n1 = g1.length, n2 = g2.length;
      const x1 = mean(g1), x2 = mean(g2);
      const s1 = sd(g1), s2 = sd(g2);
      const diff = x1 - x2;

      let se, df;
      if (equalVar) {
        const sp = Math.sqrt((((n1 - 1) * s1 * s1) + ((n2 - 1) * s2 * s2)) / (n1 + n2 - 2));
        se = sp * Math.sqrt(1 / n1 + 1 / n2);
        df = n1 + n2 - 2;
      } else {
        se = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2);
        const num = (s1 * s1 / n1 + s2 * s2 / n2) ** 2;
        const denom = (s1 ** 4 / (n1 * n1 * (n1 - 1))) + (s2 ** 4 / (n2 * n2 * (n2 - 1)));
        df = num / denom;
      }

      const tStat = diff / se;
      let pTwo = NaN;
      let pOne = NaN;
      let tCrit = 1.96;
      if (window.jStat && window.jStat.studentt) {
        pTwo = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));
        pOne = 1 - jStat.studentt.cdf(tStat, df);
        if (typeof jStat.studentt.inv === 'function') {
          tCrit = jStat.studentt.inv(0.975, df);
        }
      }
      const ci95 = [diff - tCrit * se, diff + tCrit * se];

      result = {
        type: equalVar ? '两样本 t（方差齐）' : 'Welch t（方差不齐）',
        n1, n2,
        x1: x1.toFixed(4),
        x2: x2.toFixed(4),
        s1: s1.toFixed(4),
        s2: s2.toFixed(4),
        diff: diff.toFixed(4),
        t: tStat.toFixed(4),
        df: Number.isInteger(df) ? df : df.toFixed(2),
        pTwo: formatPValue(pTwo),
        pOne: formatPValue(pOne),
        ci95: `[${ci95[0].toFixed(3)}, ${ci95[1].toFixed(3)}]`
      };
    }

    displayTTestResult(card.querySelector('[data-result]'), result);
  });
}

function comb(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - k + i)) / i;
  }
  return res;
}

function hypergeometricProbability(a, row1, row2, col1, total) {
  return comb(row1, a) * comb(row2, col1 - a) / comb(total, col1);
}

function hypergeometricTest(a, b, c, d) {
  const total = a + b + c + d;
  if (total > 500) return null;

  const row1 = a + b;
  const row2 = c + d;
  const col1 = a + c;
  const min = Math.max(0, col1 - row2);
  const max = Math.min(row1, col1);

  const pObs = hypergeometricProbability(a, row1, row2, col1, total);
  let pTwoSided = 0;

  for (let k = min; k <= max; k++) {
    const p = hypergeometricProbability(k, row1, row2, col1, total);
    if (p <= pObs + 1e-12) pTwoSided += p;
  }

  return Math.min(1, pTwoSided);
}

function renderChiSq(el) {
  el.innerHTML = '';
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
      alert('请输入至少 2×2 的列联表（每行数字用空格分隔）');
      return;
    }

    const rows = matrix.length;
    const cols = Math.max(...matrix.map(r => r.length));
    for (let i = 0; i < rows; i++) {
      while (matrix[i].length < cols) matrix[i].push(0);
    }

    const total = matrix.flat().reduce((a, b) => a + b, 0);
    const rowTotals = matrix.map(r => sum(r));
    const colTotals = Array.from({ length: cols }, (_, c) => sum(matrix.map(r => r[c] || 0)));

    let chi2 = 0;
    const expected = [];
    let minExpected = Infinity;
    for (let i = 0; i < rows; i++) {
      expected[i] = [];
      for (let j = 0; j < cols; j++) {
        const e = (rowTotals[i] * colTotals[j]) / total;
        expected[i][j] = e;
        minExpected = Math.min(minExpected, e);
        const o = matrix[i][j];
        chi2 += (o - e) ** 2 / e;
      }
    }

    const df = (rows - 1) * (cols - 1);
    let p = NaN;
    if (window.jStat && window.jStat.chisquare) {
      p = 1 - jStat.chisquare.cdf(chi2, df);
    }

    let fisherP = null;
    if (rows === 2 && cols === 2) {
      const [a, b, c, d] = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1]];
      fisherP = hypergeometricTest(a, b, c, d);
    }

    const resultEl = card.querySelector('[data-result]');
    const sig = !Number.isNaN(p) && p < 0.05;
    const sigMark = p < 0.01 ? '**' : '*';
    const sigTag = sig ? `<span class="result-sig">${sigMark} 显著</span>` : '<span class="result-ns">不显著</span>';

    let html = `<div class="result-table">`;
    html += `<div class="result-row header"><span>项目</span><span>值</span></div>`;
    html += `<div class="result-row"><span>χ² 统计量</span><span>${chi2.toFixed(4)}</span></div>`;
    html += `<div class="result-row"><span>自由度 df</span><span>${df}</span></div>`;
    html += `<div class="result-row"><span>P 值</span><span>${formatPValue(p)} ${sigTag}</span></div>`;

    if (fisherP !== null) {
      const fisherSig = fisherP < 0.05 ? '<span class="result-sig">* 显著</span>' : '<span class="result-ns">不显著</span>';
      html += `<div class="result-row"><span>Fisher 精确 P</span><span>${formatPValue(fisherP)} ${fisherSig}</span></div>`;
    }

    html += `<div class="result-row"><span>最小期望频数</span><span>${minExpected.toFixed(3)}</span></div>`;
    html += `<div class="result-row header" style="margin-top:8px"><span>—— 期望频数 ——</span><span></span></div>`;
    for (let i = 0; i < rows; i++) {
      html += `<div class="result-row"><span>行${i + 1}</span><span>${expected[i].map(v => v.toFixed(2)).join('  |  ')}</span></div>`;
    }
    html += '</div>';

    if (fisherP !== null && minExpected < 5) {
      html += '<div class="calc-note">⚠️ 检测到期望频数偏小，2×2 表优先参考 Fisher 精确检验。</div>';
    }

    resultEl.innerHTML = html;
  });
}

registerViz('ttest', renderTTest);
registerViz('chisq', renderChiSq);
