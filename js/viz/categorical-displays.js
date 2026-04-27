import { registerViz } from './_core.js';

function parseCsv(text, asNumber = false) {
  const items = String(text || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  return asNumber ? items.map(v => Number(v)) : items;
}

function parseMatrix(text) {
  return String(text || '')
    .split(';')
    .map(row => row.trim())
    .filter(Boolean)
    .map(row => parseCsv(row, true));
}

function isCount(v) {
  return Number.isInteger(v) && v >= 0;
}

function validateContingency(rowLabels, colLabels, matrix) {
  if (!rowLabels.length || !colLabels.length || !matrix.length) return '请输入完整的行标签、列标签和矩阵。';
  if (rowLabels.length < 2 || colLabels.length < 2) return '列联表至少需要 2 行和 2 列。';
  if (matrix.length !== rowLabels.length) return '矩阵行数必须和行标签数量一致。';
  if (matrix.some(row => row.length !== colLabels.length)) return '每一行矩阵的列数必须和列标签数量一致。';
  if (matrix.flat().some(v => !Number.isFinite(v) || !isCount(v))) return '列联表频数必须是非负整数。';

  const rowTotals = matrix.map(row => row.reduce((a, b) => a + b, 0));
  const colTotals = colLabels.map((_, j) => matrix.reduce((s, row) => s + row[j], 0));
  const total = rowTotals.reduce((a, b) => a + b, 0);
  if (total <= 0) return '总频数必须大于 0。';
  if (rowTotals.some(v => v === 0)) return '不能存在合计为 0 的行。';
  if (colTotals.some(v => v === 0)) return '不能存在合计为 0 的列。';
  return '';
}

function logGamma(z) {
  const coeff = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
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

function chiSquareP(chisq, df) {
  if (!Number.isFinite(chisq) || chisq < 0 || df <= 0) return NaN;
  if (window.jStat?.chisquare?.cdf) return Math.max(0, Math.min(1, 1 - window.jStat.chisquare.cdf(chisq, df)));
  return Math.max(0, Math.min(1, 1 - regularizedGammaP(df / 2, chisq / 2)));
}

function computeContingencyStats(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rowTotals = matrix.map(row => row.reduce((a, b) => a + b, 0));
  const colTotals = Array.from({ length: cols }, (_, j) => matrix.reduce((s, row) => s + row[j], 0));
  const total = rowTotals.reduce((a, b) => a + b, 0);
  const expected = matrix.map((row, i) => row.map((_, j) => (rowTotals[i] * colTotals[j]) / total));
  const residuals = matrix.map((row, i) => row.map((v, j) => {
    const e = expected[i][j];
    return e > 0 ? (v - e) / Math.sqrt(e) : NaN;
  }));
  const chisq = matrix.reduce((accTotal, row, i) => accTotal + row.reduce((acc, v, j) => {
    const e = expected[i][j];
    return acc + (e > 0 ? ((v - e) ** 2) / e : 0);
  }, 0), 0);
  const df = (rows - 1) * (cols - 1);
  const p = chiSquareP(chisq, df);
  return { rows, cols, rowTotals, colTotals, total, expected, residuals, chisq, df, p };
}

function formatP(p) {
  if (!Number.isFinite(p)) return '—';
  return p < 0.001 ? '< 0.001' : p.toFixed(4);
}

// 残差色：正残差→偏红，负残差→偏蓝，强度映射到指定上限
function residualColor(r, maxAbs) {
  const a = Math.min(1, Math.abs(r) / Math.max(maxAbs, 1e-12));
  if (r >= 0) {
    const g = Math.round(235 - a * 145);
    const b = Math.round(235 - a * 145);
    return `rgb(231,${g},${b})`;
  }
  const rr = Math.round(235 - a * 145);
  const gg = Math.round(235 - a * 145);
  return `rgb(${rr},${gg},231)`;
}

// 频数色阶（浅蓝→深蓝）
function freqColor(v, max) {
  const a = max > 0 ? Math.min(1, v / max) : 0;
  const base = Math.round(245 - a * 130);
  return `rgb(${base},${base + 5},255)`;
}

function prepareCanvas(canvas, minH, maxH, ratio) {
  const dpr = window.devicePixelRatio || 1;
  const displayW = Math.max(320, canvas.parentElement.clientWidth || 640);
  const displayH = Math.max(minH, Math.min(maxH, displayW * ratio));
  canvas.width = Math.round(displayW * dpr);
  canvas.height = Math.round(displayH * dpr);
  canvas.style.width = displayW + 'px';
  canvas.style.height = displayH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W: displayW, H: displayH };
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function renderMosaic(el) {
  const id = 'mosaic-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '列联表马赛克图';
  const rowLabelsDefault = el.dataset.rowLabels || '安慰剂组,治疗组';
  const colLabelsDefault = el.dataset.colLabels || '有效,无效';
  const matrixDefault = el.dataset.matrix || '75,21;99,5';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">🧩 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">
        横向宽度 ∝ 行合计；每个行块内部高度 ∝ 该行内构成比，因此每个矩形面积 ∝ 观察频数。颜色 = Pearson 残差（红=观察&gt;期望，蓝=观察&lt;期望）。
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">行标签（逗号分隔）<br><input id="${id}-rows" type="text" value="${rowLabelsDefault}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">列标签（逗号分隔）<br><input id="${id}-cols" type="text" value="${colLabelsDefault}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;grid-column:1 / -1;">列联表矩阵（行内逗号分隔，行间分号分隔）<br><input id="${id}-matrix" type="text" value="${matrixDefault}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="text-align:center;margin-bottom:10px;">
        <button id="${id}-calc" type="button" style="padding:8px 20px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">重绘马赛克图</button>
      </div>
      <canvas id="${id}-canvas" style="display:block;margin:0 auto;max-width:100%;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
      <div style="margin-top:8px;font-size:11px;color:#888;text-align:center;">
        颜色图例：<span style="color:#e74c3c;">■</span> 正残差（观察&gt;期望）
        &nbsp;<span style="color:#3498db;">■</span> 负残差（观察&lt;期望）
      </div>
    </div>`;

  const rowsInput = document.getElementById(`${id}-rows`);
  const colsInput = document.getElementById(`${id}-cols`);
  const matrixInput = document.getElementById(`${id}-matrix`);
  const canvas = document.getElementById(`${id}-canvas`);

  function draw(rowLabels, colLabels, matrix, stats) {
    const { ctx, W, H } = prepareCanvas(canvas, 300, 430, 0.58);
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 18, r: 18, t: 36, b: 64 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const { rowTotals, total, residuals } = stats;
    const maxAbsRes = Math.max(...residuals.flat().map(v => Math.abs(v)).filter(Number.isFinite), 1);

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('马赛克图：面积 ∝ 观察频数    颜色 = Pearson 残差', W / 2, 20);

    let x = pad.l;
    for (let i = 0; i < rowTotals.length; i++) {
      const blockW = plotW * (rowTotals[i] / total);
      let y = pad.t;
      for (let j = 0; j < colLabels.length; j++) {
        const cellH = plotH * (matrix[i][j] / rowTotals[i]);
        const fill = residualColor(residuals[i][j], maxAbsRes);
        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, Math.max(0, blockW - 2), Math.max(0, cellH - 2));
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, Math.max(0, blockW - 2), Math.max(0, cellH - 2));

        if (blockW > 45 && cellH > 24) {
          const cx = x + blockW / 2;
          const cy = y + cellH / 2;
          ctx.fillStyle = '#222';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(matrix[i][j]), cx, cy - (cellH > 42 ? 7 : 0));
          if (cellH > 42) {
            ctx.font = '11px sans-serif';
            ctx.fillText(colLabels[j], cx, cy + 9);
          }
        }
        y += cellH;
      }

      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(rowLabels[i], x + blockW / 2, pad.t + plotH + 6);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText(`n=${rowTotals[i]}`, x + blockW / 2, pad.t + plotH + 23);
      x += blockW;
    }

    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.l, pad.t, plotW, plotH);
  }

  function compute() {
    const rowLabels = parseCsv(rowsInput.value, false);
    const colLabels = parseCsv(colsInput.value, false);
    const matrix = parseMatrix(matrixInput.value);
    const err = validateContingency(rowLabels, colLabels, matrix);
    const result = document.getElementById(`${id}-result`);
    if (err) {
      result.innerHTML = `<div style="color:#c0392b;text-align:center;">${err}</div>`;
      clearCanvas(canvas);
      return;
    }
    const stats = computeContingencyStats(matrix);
    draw(rowLabels, colLabels, matrix, stats);
    const maxAbs = Math.max(...stats.residuals.flat().map(v => Math.abs(v)).filter(Number.isFinite));
    result.innerHTML = `
      <strong>Pearson χ²</strong> = ${stats.chisq.toFixed(4)}，df = ${stats.df}，P ≈ ${formatP(stats.p)} &nbsp;|&nbsp;
      <strong>最大 |残差|</strong> = ${maxAbs.toFixed(3)}<br>
      <span style="color:#64748b;font-size:12px;">注意：矩形面积使用观察频数；颜色使用独立性模型下的 Pearson 残差。</span>`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  [rowsInput, colsInput, matrixInput].forEach(input => input.addEventListener('change', compute));
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => { if (rowsInput.value) compute(); });
    ro.observe(canvas.parentElement);
  }
  compute();
}

function renderContingencyHeatmap(el) {
  const id = 'heatmap-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '列联表热力图';
  const rowLabelsDefault = el.dataset.rowLabels || '安慰剂组,治疗组';
  const colLabelsDefault = el.dataset.colLabels || '有效,无效';
  const matrixDefault = el.dataset.matrix || '75,21;99,5';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">🔥 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">
        三种视图：<strong>残差</strong>（观察−期望）最适合发现哪些单元格对整体 χ² 贡献较大；观察频数 / 期望频数用于辅助核对。
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">行标签（逗号分隔）<br><input id="${id}-rows" type="text" value="${rowLabelsDefault}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">列标签（逗号分隔）<br><input id="${id}-cols" type="text" value="${colLabelsDefault}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;grid-column:1 / -1;">列联表矩阵（行内逗号分隔，行间分号分隔）<br><input id="${id}-matrix" type="text" value="${matrixDefault}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-calc" type="button" style="padding:7px 14px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">重绘热力图</button>
        <button id="${id}-res" class="path-tab active" type="button">Pearson 残差</button>
        <button id="${id}-obs" class="path-tab" type="button">观察频数</button>
        <button id="${id}-exp" class="path-tab" type="button">期望频数</button>
      </div>
      <canvas id="${id}-canvas" style="display:block;margin:0 auto;max-width:100%;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
    </div>`;

  const rowsInput = document.getElementById(`${id}-rows`);
  const colsInput = document.getElementById(`${id}-cols`);
  const matrixInput = document.getElementById(`${id}-matrix`);
  const canvas = document.getElementById(`${id}-canvas`);
  const resBtn = document.getElementById(`${id}-res`);
  const obsBtn = document.getElementById(`${id}-obs`);
  const expBtn = document.getElementById(`${id}-exp`);
  let mode = 'residual';

  function setMode(next) {
    mode = next;
    resBtn.classList.toggle('active', mode === 'residual');
    obsBtn.classList.toggle('active', mode === 'observed');
    expBtn.classList.toggle('active', mode === 'expected');
    compute();
  }

  function draw(rowLabels, colLabels, matrix, stats) {
    const { ctx, W, H } = prepareCanvas(canvas, 240, 360, 0.52);
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 82, r: 20, t: 44, b: 58 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const cellW = plotW / colLabels.length;
    const cellH = plotH / rowLabels.length;

    const { expected, residuals } = stats;
    const observedMax = Math.max(...matrix.flat(), 1);
    const expectedMax = Math.max(...expected.flat(), 1e-12);
    const residualMax = Math.max(...residuals.flat().map(v => Math.abs(v)).filter(Number.isFinite), 1);

    const titleMap = {
      residual: '列联表热力图 — Pearson 残差（观察−期望）',
      observed: '列联表热力图 — 观察频数',
      expected: '列联表热力图 — 期望频数',
    };
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(titleMap[mode], W / 2, 22);

    ctx.fillStyle = '#555';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    for (let j = 0; j < colLabels.length; j++) {
      ctx.fillText(colLabels[j], pad.l + j * cellW + cellW / 2, pad.t - 10);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i < rowLabels.length; i++) {
      ctx.fillText(rowLabels[i], pad.l - 8, pad.t + i * cellH + cellH / 2 + 4);
    }

    for (let i = 0; i < rowLabels.length; i++) {
      for (let j = 0; j < colLabels.length; j++) {
        const x = pad.l + j * cellW;
        const y = pad.t + i * cellH;
        const obs = matrix[i][j];
        const exp = expected[i][j];
        const res = residuals[i][j];

        let fill, text;
        if (mode === 'residual') {
          fill = residualColor(res, residualMax);
          text = res.toFixed(2);
        } else if (mode === 'observed') {
          fill = freqColor(obs, observedMax);
          text = String(obs);
        } else {
          fill = freqColor(exp, expectedMax);
          text = exp.toFixed(1);
        }

        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, Math.max(0, cellW - 2), Math.max(0, cellH - 2));
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, Math.max(0, cellW - 2), Math.max(0, cellH - 2));
        ctx.fillStyle = '#222';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + cellW / 2, y + cellH / 2);
      }
    }

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.l, pad.t, plotW, plotH);

    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if (mode === 'residual') {
      ctx.fillText(`残差色阶 ±${residualMax.toFixed(2)}（红=观察>期望，蓝=观察<期望）`, pad.l, H - 14);
    } else {
      const maxVal = mode === 'observed' ? observedMax : expectedMax;
      const label = mode === 'observed' ? '观察频数' : '期望频数';
      ctx.fillText(`${label}  0 ↔ ${maxVal.toFixed(mode === 'observed' ? 0 : 1)}（色阶越深数值越大）`, pad.l, H - 14);
    }
  }

  function compute() {
    const rowLabels = parseCsv(rowsInput.value, false);
    const colLabels = parseCsv(colsInput.value, false);
    const matrix = parseMatrix(matrixInput.value);
    const err = validateContingency(rowLabels, colLabels, matrix);
    const result = document.getElementById(`${id}-result`);
    if (err) {
      result.innerHTML = `<div style="color:#c0392b;text-align:center;">${err}</div>`;
      clearCanvas(canvas);
      return;
    }
    const stats = computeContingencyStats(matrix);
    draw(rowLabels, colLabels, matrix, stats);

    let maxCell = { i: 0, j: 0, value: 0 };
    stats.residuals.forEach((row, i) => row.forEach((v, j) => {
      if (Number.isFinite(v) && Math.abs(v) > Math.abs(maxCell.value)) maxCell = { i, j, value: v };
    }));

    result.innerHTML = `
      <strong>Pearson χ²</strong> = ${stats.chisq.toFixed(4)}，df = ${stats.df}，P ≈ ${formatP(stats.p)} &nbsp;|&nbsp;
      <strong>最显著偏离</strong>：${rowLabels[maxCell.i]} × ${colLabels[maxCell.j]}，残差=${maxCell.value.toFixed(3)}`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  document.getElementById(`${id}-res`).addEventListener('click', () => setMode('residual'));
  document.getElementById(`${id}-obs`).addEventListener('click', () => setMode('observed'));
  document.getElementById(`${id}-exp`).addEventListener('click', () => setMode('expected'));
  [rowsInput, colsInput, matrixInput].forEach(input => input.addEventListener('change', compute));
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => { if (rowsInput.value) compute(); });
    ro.observe(canvas.parentElement);
  }
  compute();
}

registerViz('mosaic', renderMosaic);
registerViz('contingencyheatmap', renderContingencyHeatmap);
