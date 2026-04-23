import { registerViz, ensureJStat } from './_core.js';

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

function validateContingency(rowLabels, colLabels, matrix) {
  if (!rowLabels.length || !colLabels.length || !matrix.length) return '请输入完整的行标签、列标签和矩阵。';
  if (matrix.length !== rowLabels.length) return '矩阵行数必须和行标签数量一致。';
  if (matrix.some(row => row.length !== colLabels.length)) return '每一行矩阵的列数必须和列标签数量一致。';
  if (matrix.flat().some(v => !Number.isFinite(v) || v < 0)) return '列联表频数必须是非负数。';
  return '';
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
    return e > 0 ? (v - e) / Math.sqrt(e) : 0;
  }));
  const chisq = matrix.reduce((sum, row, i) => sum + row.reduce((acc, v, j) => {
    const e = expected[i][j];
    return acc + (e > 0 ? ((v - e) ** 2) / e : 0);
  }, 0), 0);
  const df = (rows - 1) * (cols - 1);
  const p = df > 0 ? 1 - jStat.chisquare.cdf(chisq, df) : 1;
  return { rows, cols, rowTotals, colTotals, total, expected, residuals, chisq, df, p };
}

function formatP(p) {
  return p < 0.001 ? '< 0.001' : p.toFixed(4);
}

// 残差色：正残差→偏红，负残差→偏蓝，强度映射到指定上限
function residualColor(r, maxAbs) {
  const a = Math.min(1, Math.abs(r) / maxAbs);
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

function renderMosaic(el) {
  if (!ensureJStat(el)) return;
  const id = 'mosaic-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '列联表马赛克图';
  const rowLabelsDefault = el.dataset.rowLabels || '安慰剂组,治疗组';
  const colLabelsDefault = el.dataset.colLabels || '有效,无效';
  const matrixDefault = el.dataset.matrix || '75,21;99,5';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">🧩 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">
        横向宽度 ∝ 行合计（各处理组样本量），各行内高度 ∝ 列分类占比，颜色 = Pearson 残差（红=偏高，蓝=偏低）。
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
  const ctx = canvas.getContext('2d');

  function draw(rowLabels, colLabels, matrix, stats) {
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.parentElement.clientWidth;
    const displayH = Math.max(280, Math.min(400, displayW * 0.55));
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
    ctx.scale(dpr, dpr);

    const W = displayW, H = displayH;
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 72, r: 18, t: 36, b: 64 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const { rowTotals, colTotals, total, residuals } = stats;
    const maxAbsRes = Math.max(...residuals.flat().map(v => Math.abs(v)), 1);

    // 标题
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('马赛克图：矩形面积 ∝ 频数    颜色 = Pearson 残差', W / 2, 20);

    // 横轴：行合计比例 → 宽度
    // 纵轴：列合计比例 → 高度（每个单元格在列方向上按列合计占比分配）
    let x = pad.l;
    for (let i = 0; i < rowTotals.length; i++) {
      const colW = plotW * (rowTotals[i] / total);
      // 第i行的每个单元格，按列合计占比分配高度（这是标准马赛克图的算法）
      let y = pad.t + plotH;
      for (let j = 0; j < colLabels.length; j++) {
        const cellH = plotH * (colTotals[j] / total);
        y -= cellH;
        const fill = residualColor(residuals[i][j], maxAbsRes);
        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, colW - 2, cellH - 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, colW - 2, cellH - 2);

        const cx = x + colW / 2;
        const cy = y + cellH / 2;
        ctx.fillStyle = '#222';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(matrix[i][j]), cx, cy);
      }
      // 行标签（底部）
      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(rowLabels[i], x + colW / 2, pad.t + plotH + 6);
      x += colW;
    }

    // 列标签（顶部，竖排）
    ctx.fillStyle = '#555';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    const colPositions = [];
    let xp = pad.l;
    for (let i = 0; i < rowTotals.length; i++) {
      const cw = plotW * (rowTotals[i] / total);
      colPositions.push({ x: xp, w: cw });
      xp += cw;
    }
    for (let j = 0; j < colLabels.length; j++) {
      // 找第j列的x中心（跨所有行块）
      let totalX = 0, totalW = 0;
      colPositions.forEach(({ x: px, w: pw }) => {
        // 第j列在第i行块内的局部高度，但x中心是整体x+该块宽度/2
        totalX += px + pw / 2;
        totalW += 1;
      });
      const cx = totalX / totalW;
      ctx.save();
      ctx.translate(cx, pad.t - 8);
      ctx.textBaseline = 'bottom';
      ctx.fillText(colLabels[j], 0, 0);
      ctx.restore();
    }

    // 外框
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const stats = computeContingencyStats(matrix);
    draw(rowLabels, colLabels, matrix, stats);
    const maxAbs = Math.max(...stats.residuals.flat().map(v => Math.abs(v)));
    result.innerHTML = `
      <strong>Pearson χ²</strong> = ${stats.chisq.toFixed(4)}，df = ${stats.df}，P ≈ ${formatP(stats.p)} &nbsp;|&nbsp;
      <strong>最大 |残差|</strong> = ${maxAbs.toFixed(3)}`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  // responsive redraw on resize
  const ro = new ResizeObserver(() => { if (rowsInput.value) compute(); });
  ro.observe(canvas.parentElement);
  compute();
}

function renderContingencyHeatmap(el) {
  if (!ensureJStat(el)) return;
  const id = 'heatmap-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '列联表热力图';
  const rowLabelsDefault = el.dataset.rowLabels || '安慰剂组,治疗组';
  const colLabelsDefault = el.dataset.colLabels || '有效,无效';
  const matrixDefault = el.dataset.matrix || '75,21;99,5';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">🔥 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">
        三种视图：<strong>残差</strong>（实测−期望）最适合发现哪些单元格最"拖累"整体 χ²；观察频数 / 期望频数辅助参考。
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">行标签（逗号分隔）<br><input id="${id}-rows" type="text" value="${rowLabelsDefault}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">列标签（逗号分隔）<br><input id="${id}-cols" type="text" value="${colLabelsDefault}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;grid-column:1 / -1;">列联表矩阵（行内逗号分隔，行间分号分隔）<br><input id="${id}-matrix" type="text" value="${matrixDefault}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
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
  const ctx = canvas.getContext('2d');
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
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.parentElement.clientWidth;
    const displayH = Math.max(220, Math.min(340, displayW * 0.52));
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
    ctx.scale(dpr, dpr);

    const W = displayW, H = displayH;
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 82, r: 20, t: 44, b: 58 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const cellW = plotW / colLabels.length;
    const cellH = plotH / rowLabels.length;

    const { expected, residuals } = stats;
    const observedMax = Math.max(...matrix.flat());
    const expectedMax = Math.max(...expected.flat());
    const residualMax = Math.max(...residuals.flat().map(v => Math.abs(v))) || 1;

    const titleMap = {
      residual: '列联表热力图 — Pearson 残差（实测−期望）',
      observed: '列联表热力图 — 观察频数',
      expected: '列联表热力图 — 期望频数',
    };
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleMap[mode], W / 2, 22);

    // 列标签（顶部）
    ctx.fillStyle = '#555';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    for (let j = 0; j < colLabels.length; j++) {
      ctx.fillText(colLabels[j], pad.l + j * cellW + cellW / 2, pad.t - 10);
    }

    // 行标签（左侧）
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
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.fillStyle = '#222';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + cellW / 2, y + cellH / 2);
      }
    }

    // 外框
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.l, pad.t, plotW, plotH);

    // 图例
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const stats = computeContingencyStats(matrix);
    draw(rowLabels, colLabels, matrix, stats);

    let maxCell = { i: 0, j: 0, value: 0 };
    stats.residuals.forEach((row, i) => row.forEach((v, j) => {
      if (Math.abs(v) > Math.abs(maxCell.value)) maxCell = { i, j, value: v };
    }));

    result.innerHTML = `
      <strong>Pearson χ²</strong> = ${stats.chisq.toFixed(4)}，df = ${stats.df}，P ≈ ${formatP(stats.p)} &nbsp;|&nbsp;
      <strong>最显著偏离</strong>：${rowLabels[maxCell.i]} × ${colLabels[maxCell.j]}，残差=${maxCell.value.toFixed(3)}`;
  }

  document.getElementById(`${id}-res`).addEventListener('click', () => setMode('residual'));
  document.getElementById(`${id}-obs`).addEventListener('click', () => setMode('observed'));
  document.getElementById(`${id}-exp`).addEventListener('click', () => setMode('expected'));
  const ro = new ResizeObserver(() => { if (rowsInput.value) compute(); });
  ro.observe(canvas.parentElement);
  compute();
}

registerViz('mosaic', renderMosaic);
registerViz('contingencyheatmap', renderContingencyHeatmap);
