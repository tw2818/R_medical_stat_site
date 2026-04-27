import { registerViz, ensureJStat } from './_core.js';

// ==========================================================
// CALCULATORS - 统计可视化模块
// ==========================================================

// ============================================================
// CALCULATORS - 统计可视化模块
// ============================================================

  function renderPower(el) {
    if (!ensureJStat(el)) return;
    const id = 'power-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '功效分析';
    const test = el.dataset.test || 'ttest';

    const testTypes = { ttest2: '两样本t检验', ttest1: '单样本t检验', paired: '配对t检验' };
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">⚡ ${title}</div>
      <canvas id="${id}" width="560" height="300" style="display:block;margin:0 auto;"></canvas>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:10px;">
        <label style="font-size:13px;">检验类型:
          <select id="${id}-type" style="padding:4px 8px;font-size:13px;border:1px solid #ccc;border-radius:4px;">
            <option value="ttest2" selected>两样本t检验</option>
            <option value="ttest1">单样本t检验</option>
            <option value="paired">配对t检验</option>
          </select>
        </label>
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
      const testType = document.getElementById(id + '-type').value;
      const testLabel = testTypes[testType] || '两样本t检验';
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('功效曲线 (' + testLabel + ')', W / 2, 20);

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
        let power;
        if (testType === 'ttest2') {
          // 两样本 t: n 每组
          power = 1 - jStat.normal.cdf(jStat.normal.inv(1 - alpha / 2, 0, 1) - d * Math.sqrt(n / 2), 0, 1);
        } else if (testType === 'ttest1') {
          // 单样本 t: n 为样本量
          power = 1 - jStat.normal.cdf(jStat.normal.inv(1 - alpha / 2, 0, 1) - d * Math.sqrt(n), 0, 1);
        } else {
          // 配对 t: n 为配对数
          power = 1 - jStat.normal.cdf(jStat.normal.inv(1 - alpha / 2, 0, 1) - d * Math.sqrt(n), 0, 1);
        }
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

      // Annotate power reference line
      const selPower = parseFloat(document.getElementById(id + '-pwrval').textContent);
      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('power=' + selPower.toFixed(2), padL + plotW + 2, scaleY(selPower) + 4);
    }

    drawPowerCurve();

    const dSlider = document.getElementById(id + '-d');
    const pwrSlider = document.getElementById(id + '-pwr');
    const aSlider = document.getElementById(id + '-a');
    const typeSelect = document.getElementById(id + '-type');

    dSlider.addEventListener('input', () => {
      document.getElementById(id + '-dval').textContent = (dSlider.value / 10).toFixed(1);
      drawPowerCurve();
    });
    pwrSlider.addEventListener('input', () => {
      document.getElementById(id + '-pwrval').textContent = (pwrSlider.value / 100).toFixed(2);
      drawPowerCurve();
    });
    aSlider.addEventListener('input', () => {
      document.getElementById(id + '-aval').textContent = (aSlider.value / 100).toFixed(2);
      drawPowerCurve();
    });
    typeSelect.addEventListener('change', () => {
      drawPowerCurve();
    });

    document.getElementById(id + '-calc').addEventListener('click', () => {
      const testType = document.getElementById(id + '-type').value;
      const d = parseFloat(document.getElementById(id + '-dval').textContent);
      const power = parseFloat(document.getElementById(id + '-pwrval').textContent);
      const alpha = parseFloat(document.getElementById(id + '-aval').textContent);
      const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
      const zBeta = jStat.normal.inv(power, 0, 1);
      let n, result;
      if (testType === 'ttest2') {
        n = Math.ceil(2 * Math.pow((zAlpha + zBeta) / d, 2));
        result = '每组所需样本量 n ≈ ' + n + ' (每组 total: ' + n * 2 + ')';
      } else if (testType === 'ttest1') {
        n = Math.ceil(Math.pow((zAlpha + zBeta) / d, 2));
        result = '所需样本量 n ≈ ' + n;
      } else if (testType === 'paired') {
        n = Math.ceil(Math.pow((zAlpha + zBeta) / d, 2));
        result = '配对样本数 n ≈ ' + n;
      }
      document.getElementById(id + '-result').textContent = result;
    });
  }
registerViz('power', renderPower);

  // DOMContentLoaded 之后运行（但章节内容是 fetch 后才注入，需要用 MutationObserver）


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
registerViz('coefci', renderCoefCI);

  function renderSampleSizeCalc(el) {
    if (!ensureJStat(el)) return;
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
registerViz('samplesizecalc', renderSampleSizeCalc);

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
registerViz('nnt', renderNNT);

  // ============================================================
  // Gauge Chart (Risk Stratification)
  // ============================================================

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
registerViz('confusionmatrix', renderConfusionMatrix);

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
registerViz('sequential', renderSequentialAnalysis);

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
registerViz('riskdist', renderRiskScoreDist);

  // ============================================================
  // Proportion Power Curve (p1 vs p2 comparison)
  // ============================================================

  function renderPropPower(el) {
    if (!ensureJStat(el)) return;
    const id = 'proppower-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '两组率比较功效分析';
    const readPercent = (value, fallback) => {
      const parsed = parseFloat(value);
      const proportion = Number.isFinite(parsed) ? parsed : fallback;
      return Math.max(1, Math.min(99, Math.round(proportion * 100)));
    };
    const initialP1 = readPercent(el.dataset.p1, 0.4);
    const initialP2 = readPercent(el.dataset.p2, 0.3);
    const initialAlpha = readPercent(el.dataset.alpha, 0.05);
    const initialPower = readPercent(el.dataset.power, 0.8);

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="560" height="300" style="display:block;margin:0 auto;"></canvas>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:10px;">
        <label style="font-size:13px;">p₁ (处理组):
          <input type="range" id="${id}-p1" min="1" max="99" value="${initialP1}" step="1" style="width:90px;">
          <span id="${id}-p1val">${(initialP1 / 100).toFixed(2)}</span>
        </label>
        <label style="font-size:13px;">p₂ (对照组):
          <input type="range" id="${id}-p2" min="1" max="99" value="${initialP2}" step="1" style="width:90px;">
          <span id="${id}-p2val">${(initialP2 / 100).toFixed(2)}</span>
        </label>
        <label style="font-size:13px;">α:
          <input type="range" id="${id}-a" min="1" max="10" value="${initialAlpha}" step="1" style="width:70px;">
          <span id="${id}-aval">${(initialAlpha / 100).toFixed(2)}</span>
        </label>
        <label style="font-size:13px;">功效 1-β:
          <input type="range" id="${id}-pwr" min="50" max="99" value="${initialPower}" step="1" style="width:90px;">
          <span id="${id}-pwrval">${(initialPower / 100).toFixed(2)}</span>
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

    function getParams() {
      const p1 = parseFloat(document.getElementById(id + '-p1val').textContent);
      const p2 = parseFloat(document.getElementById(id + '-p2val').textContent);
      const alpha = parseFloat(document.getElementById(id + '-aval').textContent);
      const power = parseFloat(document.getElementById(id + '-pwrval').textContent);
      return { p1, p2, alpha, power };
    }

    function drawPowerCurve() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('功效曲线 (两组率比较)', W / 2, 20);

      const { p1, p2, alpha, power } = getParams();
      const diff = Math.abs(p1 - p2);

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

      const maxN = 500;
      const scaleX = n => padL + (n / maxN) * plotW;
      const scaleY = pw => padT + (1 - pw) * plotH;

      // Reference line at power
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, scaleY(power)); ctx.lineTo(padL + plotW, scaleY(power)); ctx.stroke();
      ctx.setLineDash([]);

      // Power curve
      const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
      ctx.beginPath(); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2.5;
      for (let n = 5; n <= maxN; n++) {
        const seAlt = Math.sqrt(p1 * (1 - p1) / n + p2 * (1 - p2) / n);
        const z = diff / seAlt;
        const curvePower = 1 - jStat.normal.cdf(zAlpha - z, 0, 1);
        const x = scaleX(n), y = scaleY(Math.min(curvePower, 0.999));
        if (n === 5) ctx.moveTo(x, y); else ctx.lineTo(x, y);
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

      // Annotate
      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('power=' + power.toFixed(2), padL + plotW + 2, scaleY(power) + 4);
      ctx.fillStyle = '#555'; ctx.font = '11px sans-serif';
      ctx.fillText(`p₁=${p1.toFixed(2)}, p₂=${p2.toFixed(2)}, Δ=${diff.toFixed(2)}`, padL + 5, padT + 15);
    }

    drawPowerCurve();

    const p1Slider = document.getElementById(id + '-p1');
    const p2Slider = document.getElementById(id + '-p2');
    const aSlider = document.getElementById(id + '-a');
    const pwrSlider = document.getElementById(id + '-pwr');

    p1Slider.addEventListener('input', () => {
      document.getElementById(id + '-p1val').textContent = (p1Slider.value / 100).toFixed(2);
      drawPowerCurve();
    });
    p2Slider.addEventListener('input', () => {
      document.getElementById(id + '-p2val').textContent = (p2Slider.value / 100).toFixed(2);
      drawPowerCurve();
    });
    aSlider.addEventListener('input', () => {
      document.getElementById(id + '-aval').textContent = (aSlider.value / 100).toFixed(2);
      drawPowerCurve();
    });
    pwrSlider.addEventListener('input', () => {
      document.getElementById(id + '-pwrval').textContent = (pwrSlider.value / 100).toFixed(2);
      drawPowerCurve();
    });

    document.getElementById(id + '-calc').addEventListener('click', () => {
      const { p1, p2, alpha, power } = getParams();
      const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
      const zBeta = jStat.normal.inv(power, 0, 1);
      // Kelley & Maxwell formula for two-proportion z-test
      const n = Math.ceil(Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2)) / Math.pow(p1 - p2, 2));
      document.getElementById(id + '-result').textContent = '每组所需样本量 n ≈ ' + n + ' (总 N ≈ ' + (n * 2) + ')';
    });
  }
registerViz('proppower', renderPropPower);

  // ============================================================
  // Correlation Power Analysis
  // ============================================================

  function renderCorrPower(el) {
    if (!ensureJStat(el)) return;
    const id = 'corrpower-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '相关性功效分析';

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="560" height="300" style="display:block;margin:0 auto;"></canvas>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:10px;">
        <label style="font-size:13px;">相关系数 r:
          <input type="range" id="${id}-r" min="1" max="95" value="30" step="1" style="width:90px;">
          <span id="${id}-rval">0.30</span>
        </label>
        <label style="font-size:13px;">α:
          <input type="range" id="${id}-a" min="1" max="10" value="5" step="1" style="width:70px;">
          <span id="${id}-aval">0.05</span>
        </label>
        <label style="font-size:13px;">功效 1-β:
          <input type="range" id="${id}-pwr" min="50" max="99" value="80" step="1" style="width:90px;">
          <span id="${id}-pwrval">0.80</span>
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

    function getParams() {
      const r = parseFloat(document.getElementById(id + '-rval').textContent);
      const alpha = parseFloat(document.getElementById(id + '-aval').textContent);
      const power = parseFloat(document.getElementById(id + '-pwrval').textContent);
      return { r, alpha, power };
    }

    function drawPowerCurve() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('功效曲线 (相关性分析)', W / 2, 20);

      const { r, alpha } = getParams();

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

      const maxN = 200;
      const scaleX = n => padL + (n / maxN) * plotW;
      const scaleY = pw => padT + (1 - pw) * plotH;

      // Reference line at power=0.8
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, scaleY(0.8)); ctx.lineTo(padL + plotW, scaleY(0.8)); ctx.stroke();
      ctx.setLineDash([]);

      // Fisher z transformation
      const fisherZ = 0.5 * Math.log((1 + r) / (1 - r));

      // Power curve
      const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
      ctx.beginPath(); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2.5;
      for (let n = 3; n <= maxN; n++) {
        const se = 1 / Math.sqrt(n - 3);
        const z = fisherZ / se;
        const power = 1 - jStat.normal.cdf(zAlpha - z, 0, 1);
        const x = scaleX(n), y = scaleY(Math.min(power, 0.999));
        if (n === 3) ctx.moveTo(x, y); else ctx.lineTo(x, y);
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
      ctx.fillText('样本量 n', padL + plotW / 2, H - 4);
      ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('功效 (1-β)', 0, 0); ctx.restore();

      // Annotate
      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('power=0.8', padL + plotW + 2, scaleY(0.8) + 4);
      ctx.fillStyle = '#555'; ctx.font = '11px sans-serif';
      ctx.fillText(`r=${r.toFixed(2)}, α=${alpha.toFixed(2)}`, padL + 5, padT + 15);
    }

    drawPowerCurve();

    const rSlider = document.getElementById(id + '-r');
    const aSlider = document.getElementById(id + '-a');
    const pwrSlider = document.getElementById(id + '-pwr');

    rSlider.addEventListener('input', () => {
      document.getElementById(id + '-rval').textContent = (rSlider.value / 100).toFixed(2);
      drawPowerCurve();
    });
    aSlider.addEventListener('input', () => {
      document.getElementById(id + '-aval').textContent = (aSlider.value / 100).toFixed(2);
      drawPowerCurve();
    });
    pwrSlider.addEventListener('input', () => {
      document.getElementById(id + '-pwrval').textContent = (pwrSlider.value / 100).toFixed(2);
    });

    document.getElementById(id + '-calc').addEventListener('click', () => {
      const { r, alpha, power } = getParams();
      const fisherZ = 0.5 * Math.log((1 + r) / (1 - r));
      if (Math.abs(fisherZ) < 0.001) {
        document.getElementById(id + '-result').textContent = '相关系数 r 过小，请调大 r 值';
        return;
      }
      const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
      const zBeta = jStat.normal.inv(power, 0, 1);
      const n = Math.ceil(3 + Math.pow((zAlpha + zBeta) / fisherZ, 2));
      document.getElementById(id + '-result').textContent = '所需样本量 n ≈ ' + n;
    });
  }
registerViz('corrpower', renderCorrPower);

  // ============================================================
  // ANOVA Effect Size Calculator
  // ============================================================

  function renderAnovaEffectSize(el) {
    if (!ensureJStat(el)) return;
    const id = 'anova-es-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'ANOVA 效应量计算器';

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="560" height="280" style="display:block;margin:0 auto;"></canvas>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:12px;">
        <div>
          <label style="font-size:13px;display:block;margin-bottom:4px;">组数 k:</label>
          <input type="range" id="${id}-k" min="2" max="10" value="3" step="1" style="width:100%;">
          <span id="${id}-kval" style="font-size:12px;color:#555;">3</span>
        </div>
        <div>
          <label style="font-size:13px;display:block;margin-bottom:4px;">每组样本量 n:</label>
          <input type="range" id="${id}-n" min="5" max="100" value="30" step="1" style="width:100%;">
          <span id="${id}-nval" style="font-size:12px;color:#555;">30</span>
        </div>
        <div>
          <label style="font-size:13px;display:block;margin-bottom:4px;">组间方差 σ²<sub>b</sub>:</label>
          <input type="range" id="${id}-vb" min="1" max="100" value="25" step="1" style="width:100%;">
          <span id="${id}-vbval" style="font-size:12px;color:#555;">2.50</span>
        </div>
        <div>
          <label style="font-size:13px;display:block;margin-bottom:4px;">组内方差 σ²<sub>w</sub>:</label>
          <input type="range" id="${id}-vw" min="1" max="100" value="75" step="1" style="width:100%;">
          <span id="${id}-vwval" style="font-size:12px;color:#555;">7.50</span>
        </div>
      </div>
      <div style="text-align:center;padding:0 12px 12px;">
        <button id="${id}-calc" style="padding:8px 24px;background:#3498db;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:bold;">计算效应量</button>
      </div>
      <div id="${id}-result" style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;padding-bottom:12px;font-size:14px;"></div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 560, H = 280;
    const padL = 50, padR = 20, padT = 30, padB = 45;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    function computeEffectSizes(k, n, varBetween, varWithin) {
      // Sum of squares
      const ssBetween = varBetween * k;
      const ssWithin = varWithin * k * n;
      const ssTotal = ssBetween + ssWithin;

      // Eta-squared (η²)
      const etaSq = ssBetween / ssTotal;

      // Partial eta-squared
      const partialEtaSq = ssBetween / (ssBetween + ssWithin);

      // Cohen's f = sqrt(eta² / (1 - eta²))
      const cohensF = Math.sqrt(etaSq / (1 - etaSq));

      // Omega-squared (ω²) - less biased estimate
      const dfBetween = k - 1;
      const dfWithin = k * (n - 1);
      const omegaSq = (ssBetween - dfBetween * varWithin) / (ssTotal + varWithin);

      return { etaSq, partialEtaSq, cohensF, omegaSq, ssBetween, ssWithin, ssTotal, dfBetween, dfWithin };
    }

    function drawEffectSizeChart() {
      ctx.clearRect(0, 0, W, H);

      const k = parseInt(document.getElementById(id + '-k').value);
      const n = parseInt(document.getElementById(id + '-n').value);
      const varBetween = parseFloat(document.getElementById(id + '-vbval').textContent);
      const varWithin = parseFloat(document.getElementById(id + '-vwval').textContent);

      const { etaSq, partialEtaSq, cohensF, omegaSq } = computeEffectSizes(k, n, varBetween, varWithin);
      const metrics = [
        { label: 'η²', value: etaSq, color: '#3498db' },
        { label: 'η²<sub>p</sub>', value: partialEtaSq, color: '#e74c3c' },
        { label: 'ω²', value: omegaSq, color: '#27ae60' },
        { label: "Cohen's f", value: cohensF, color: '#9b59b6' }
      ];

      // Title
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('ANOVA 效应量 (k=' + k + ', n=' + n + ')', W / 2, 18);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const x = padL + (i / 4) * plotW, y = padT + (i / 4) * plotH;
        ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

      // Draw bars
      const barW = plotW / (metrics.length + 1);
      const maxValue = Math.max(...metrics.map(m => m.value));
      const normScale = maxValue > 0 ? (plotH - 20) / maxValue * 0.9 : 1;

      // Reference lines for effect size interpretation
      const interpretation = [
        { threshold: 0.01, label: '小', color: '#27ae60' },
        { threshold: 0.06, label: '中', color: '#f39c12' },
        { threshold: 0.14, label: '大', color: '#e74c3c' }
      ];

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
      [0.01, 0.06, 0.14].forEach((t, i) => {
        const y = padT + plotH - t * normScale;
        if (y > padT) {
          ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
          ctx.fillStyle = '#aaa'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(interpretation[i].label, padL + 4, y - 3);
        }
      });
      ctx.setLineDash([]);
      metrics.forEach((m, i) => {
        const x = padL + (i + 0.5) * barW + barW * 0.2;
        const barHeight = Math.min(m.value * normScale, plotH - 10);
        const y = padT + plotH - barHeight;

        // Bar
        ctx.fillStyle = m.color;
        ctx.fillRect(x, y, barW * 0.6, barHeight);

        // Value label
        ctx.fillStyle = '#333'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(m.label.replace('<sub>', '').replace('</sub>', ''), x + barW * 0.3, y - 5);
        ctx.fillText(m.value.toFixed(3), x + barW * 0.3, y + barHeight + 14);

        // Interpretation badge
        let interp = m.value < 0 ? '~0' : m.value < 0.01 ? '极小' : m.value < 0.06 ? '小' : m.value < 0.14 ? '中' : '大';

        ctx.fillStyle = '#666'; ctx.font = '10px sans-serif';
        ctx.fillText('(' + interp + ')', x + barW * 0.3, y + barHeight + 26);
      });

      // Y-axis label
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('效应量大小', padL + plotW / 2, H - 5);
      ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('η² / ω²', 0, 0); ctx.restore();

      // Update result display
      const resultEl = document.getElementById(id + '-result');
      resultEl.innerHTML = metrics.map(m => {
        const interp = m.value < 0 ? '~0' : m.value < 0.01 ? '极小' : m.value < 0.06 ? '小' : m.value < 0.14 ? '中' : '大';
        return `<span style="color:${m.color};font-weight:bold;">${m.label}: ${m.value.toFixed(4)} (${interp})</span>`;
      }).join('');
    }

    drawEffectSizeChart();

    // Event listeners for sliders
    const kSlider = document.getElementById(id + '-k');
    const nSlider = document.getElementById(id + '-n');
    const vbSlider = document.getElementById(id + '-vb');
    const vwSlider = document.getElementById(id + '-vw');

    kSlider.addEventListener('input', () => {
      document.getElementById(id + '-kval').textContent = kSlider.value;
      drawEffectSizeChart();
    });
    nSlider.addEventListener('input', () => {
      document.getElementById(id + '-nval').textContent = nSlider.value;
      drawEffectSizeChart();
    });
    vbSlider.addEventListener('input', () => {
      document.getElementById(id + '-vbval').textContent = (vbSlider.value / 10).toFixed(2);
      drawEffectSizeChart();
    });
    vwSlider.addEventListener('input', () => {
      document.getElementById(id + '-vwval').textContent = (vwSlider.value / 10).toFixed(2);
      drawEffectSizeChart();
    });

    document.getElementById(id + '-calc').addEventListener('click', () => {
      const k = parseInt(kSlider.value);
      const n = parseInt(nSlider.value);
      const varBetween = parseFloat(document.getElementById(id + '-vbval').textContent);
      const varWithin = parseFloat(document.getElementById(id + '-vwval').textContent);
      const { etaSq, partialEtaSq, cohensF, omegaSq, dfBetween, dfWithin } = computeEffectSizes(k, n, varBetween, varWithin);

      const interp = (v) => v < 0 ? '~0' : v < 0.01 ? '极小' : v < 0.06 ? '小' : v < 0.14 ? '中' : '大';

      document.getElementById(id + '-result').innerHTML = `
        <span style="color:#3498db;font-weight:bold;">η² = ${etaSq.toFixed(4)} (${interp(etaSq)})</span>
        <span style="color:#e74c3c;font-weight:bold;">η²<sub>p</sub> = ${partialEtaSq.toFixed(4)} (${interp(partialEtaSq)})</span>
        <span style="color:#27ae60;font-weight:bold;">ω² = ${omegaSq.toFixed(4)} (${interp(omegaSq)})</span>
        <span style="color:#9b59b6;font-weight:bold;">Cohen's f = ${cohensF.toFixed(4)} (${interp(cohensF)})</span>
      `;
    });
  }
  registerViz('anova-effectsize', renderAnovaEffectSize);
