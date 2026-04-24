import { registerViz, ensureJStat } from './_core.js';

const uniqueId = prefix => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
const isCount = value => Number.isInteger(value) && value >= 0;

function parseLabels(text) {
  return String(text || '').split(',').map(item => item.trim()).filter(Boolean);
}

function parseMatrix(text) {
  return String(text || '')
    .split(';')
    .map(row => row.trim())
    .filter(Boolean)
    .map(row => row.split(',').map(cell => Number(cell.trim())));
}

function escapeAttr(value) {
  return String(value).replace(/[&<>"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[char]));
}

function formatP(p) {
  if (!Number.isFinite(p)) return '不可计算';
  return p < 0.001 ? '&lt; 0.001' : p.toFixed(4);
}

function validateTable(rowLabels, colLabels, matrix) {
  if (!rowLabels.length || !colLabels.length || !matrix.length) return '请输入完整的行标签、列标签和矩阵。';
  if (matrix.length !== rowLabels.length) return '矩阵行数必须和行标签数量一致。';
  if (matrix.some(row => row.length !== colLabels.length)) return '每一行矩阵的列数必须和列标签数量一致。';
  if (matrix.flat().some(value => !isCount(value))) return '列联表频数必须是非负整数。';
  if (matrix.flat().reduce((sum, value) => sum + value, 0) <= 0) return '列联表总频数必须大于 0。';
  if (matrix.some(row => row.reduce((sum, value) => sum + value, 0) === 0)) return '每一行的合计频数必须大于 0。';
  return '';
}

function getStats(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rowTotals = matrix.map(row => row.reduce((sum, value) => sum + value, 0));
  const colTotals = Array.from({ length: cols }, (_, j) => matrix.reduce((sum, row) => sum + row[j], 0));
  const total = rowTotals.reduce((sum, value) => sum + value, 0);
  const expected = matrix.map((row, i) => row.map((_, j) => (rowTotals[i] * colTotals[j]) / total));
  const residuals = matrix.map((row, i) => row.map((value, j) => {
    const e = expected[i][j];
    return e > 0 ? (value - e) / Math.sqrt(e) : 0;
  }));
  const chisq = matrix.reduce((sum, row, i) => sum + row.reduce((acc, value, j) => {
    const e = expected[i][j];
    return acc + (e > 0 ? ((value - e) ** 2) / e : 0);
  }, 0), 0);
  const df = (rows - 1) * (cols - 1);
  const p = df > 0 ? 1 - jStat.chisquare.cdf(chisq, df) : 1;
  return { rows, cols, rowTotals, colTotals, total, expected, residuals, chisq, df, p };
}

function residualColor(value, maxAbs) {
  const a = Math.min(1, Math.abs(value) / Math.max(maxAbs, 1));
  if (value >= 0) {
    const gb = Math.round(235 - a * 145);
    return `rgb(231,${gb},${gb})`;
  }
  const rg = Math.round(235 - a * 145);
  return `rgb(${rg},${rg},231)`;
}

function countColor(value, max) {
  const a = max > 0 ? Math.min(1, value / max) : 0;
  const base = Math.round(245 - a * 130);
  return `rgb(${base},${base + 5},255)`;
}

function resizeCanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function readInputs(id) {
  return {
    rowLabels: parseLabels(document.getElementById(`${id}-rows`).value),
    colLabels: parseLabels(document.getElementById(`${id}-cols`).value),
    matrix: parseMatrix(document.getElementById(`${id}-matrix`).value)
  };
}

function renderMosaicAudited(el) {
  if (!ensureJStat(el)) return;
  const id = uniqueId('mosaic');
  const title = el.dataset.title || '列联表马赛克图';
  const rowDefaults = el.dataset.rowLabels || '安慰剂组,治疗组';
  const colDefaults = el.dataset.colLabels || '有效,无效';
  const matrixDefaults = el.dataset.matrix || '75,21;99,5';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">🧩 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">面积逻辑已校正：横向宽度 ∝ 行合计，行内高度 ∝ 该行内列比例，因此矩形面积 ∝ 观察频数；颜色 = Pearson 残差。</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">行标签（逗号分隔）<br><input id="${id}-rows" type="text" value="${escapeAttr(rowDefaults)}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">列标签（逗号分隔）<br><input id="${id}-cols" type="text" value="${escapeAttr(colDefaults)}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;grid-column:1 / -1;">列联表矩阵（行内逗号分隔，行间分号分隔）<br><input id="${id}-matrix" type="text" value="${escapeAttr(matrixDefaults)}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="text-align:center;margin-bottom:10px;"><button id="${id}-calc" type="button" style="padding:8px 20px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">重绘马赛克图</button></div>
      <canvas id="${id}-canvas" style="display:block;margin:0 auto;max-width:100%;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
    </div>`;

  const canvas = document.getElementById(`${id}-canvas`);
  const result = document.getElementById(`${id}-result`);

  function draw(rowLabels, colLabels, matrix, stats) {
    const width = Math.max(320, canvas.parentElement.clientWidth || 620);
    const height = Math.max(300, Math.min(440, width * 0.6));
    const ctx = resizeCanvas(canvas, width, height);
    const pad = { left: 88, right: 24, top: 44, bottom: 68 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const maxAbs = Math.max(...stats.residuals.flat().map(value => Math.abs(value)), 1);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('马赛克图：面积 ∝ 观察频数；颜色 = Pearson 残差', width / 2, 22);

    let x = pad.left;
    rowLabels.forEach((rowLabel, i) => {
      const blockW = plotW * (stats.rowTotals[i] / stats.total);
      let y = pad.top;
      colLabels.forEach((_, j) => {
        const cellH = plotH * (matrix[i][j] / stats.rowTotals[i]);
        ctx.fillStyle = residualColor(stats.residuals[i][j], maxAbs);
        ctx.fillRect(x + 1, y + 1, Math.max(blockW - 2, 0), Math.max(cellH - 2, 0));
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x + 1, y + 1, Math.max(blockW - 2, 0), Math.max(cellH - 2, 0));
        if (blockW >= 44 && cellH >= 24) {
          ctx.fillStyle = '#222';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(matrix[i][j]), x + blockW / 2, y + cellH / 2);
        }
        y += cellH;
      });
      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(rowLabel, x + blockW / 2, pad.top + plotH + 8);
      x += blockW;
    });

    ctx.strokeStyle = '#bbb';
    ctx.strokeRect(pad.left, pad.top, plotW, plotH);
  }

  function compute() {
    const { rowLabels, colLabels, matrix } = readInputs(id);
    const error = validateTable(rowLabels, colLabels, matrix);
    if (error) {
      result.innerHTML = `<div style="color:#c0392b;text-align:center;">${error}</div>`;
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const stats = getStats(matrix);
    draw(rowLabels, colLabels, matrix, stats);
    const maxAbs = Math.max(...stats.residuals.flat().map(value => Math.abs(value)));
    result.innerHTML = `<strong>Pearson χ²</strong> = ${stats.chisq.toFixed(4)}，df = ${stats.df}，P ≈ ${formatP(stats.p)} &nbsp;|&nbsp; <strong>最大 |残差|</strong> = ${maxAbs.toFixed(3)}`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  new ResizeObserver(compute).observe(canvas.parentElement);
  compute();
}

function renderHeatmapAudited(el) {
  if (!ensureJStat(el)) return;
  const id = uniqueId('heatmap');
  const title = el.dataset.title || '列联表热力图';
  const rowDefaults = el.dataset.rowLabels || '安慰剂组,治疗组';
  const colDefaults = el.dataset.colLabels || '有效,无效';
  const matrixDefaults = el.dataset.matrix || '75,21;99,5';
  let mode = 'residual';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">🔥 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">频数输入限制为非负整数；残差视图用于定位主要偏离单元格。</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">行标签（逗号分隔）<br><input id="${id}-rows" type="text" value="${escapeAttr(rowDefaults)}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">列标签（逗号分隔）<br><input id="${id}-cols" type="text" value="${escapeAttr(colDefaults)}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;grid-column:1 / -1;">列联表矩阵（行内逗号分隔，行间分号分隔）<br><input id="${id}-matrix" type="text" value="${escapeAttr(matrixDefaults)}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-res" class="path-tab active" type="button">Pearson 残差</button>
        <button id="${id}-obs" class="path-tab" type="button">观察频数</button>
        <button id="${id}-exp" class="path-tab" type="button">期望频数</button>
      </div>
      <canvas id="${id}-canvas" style="display:block;margin:0 auto;max-width:100%;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
    </div>`;

  const canvas = document.getElementById(`${id}-canvas`);
  const result = document.getElementById(`${id}-result`);
  const buttons = {
    residual: document.getElementById(`${id}-res`),
    observed: document.getElementById(`${id}-obs`),
    expected: document.getElementById(`${id}-exp`),
  };

  function draw(rowLabels, colLabels, matrix, stats) {
    const width = Math.max(320, canvas.parentElement.clientWidth || 620);
    const height = Math.max(240, Math.min(360, width * 0.52));
    const ctx = resizeCanvas(canvas, width, height);
    const pad = { left: 88, right: 24, top: 48, bottom: 54 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const cellW = plotW / colLabels.length;
    const cellH = plotH / rowLabels.length;
    const obsMax = Math.max(...matrix.flat());
    const expMax = Math.max(...stats.expected.flat());
    const resMax = Math.max(...stats.residuals.flat().map(value => Math.abs(value)), 1);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText({ residual: 'Pearson 残差', observed: '观察频数', expected: '期望频数' }[mode], width / 2, 22);

    ctx.fillStyle = '#555';
    ctx.font = '12px sans-serif';
    colLabels.forEach((label, j) => {
      ctx.textAlign = 'center';
      ctx.fillText(label, pad.left + j * cellW + cellW / 2, pad.top - 10);
    });
    rowLabels.forEach((label, i) => {
      ctx.textAlign = 'right';
      ctx.fillText(label, pad.left - 8, pad.top + i * cellH + cellH / 2 + 4);
    });

    rowLabels.forEach((_, i) => {
      colLabels.forEach((__, j) => {
        const x = pad.left + j * cellW;
        const y = pad.top + i * cellH;
        let fill;
        let text;
        if (mode === 'residual') {
          fill = residualColor(stats.residuals[i][j], resMax);
          text = stats.residuals[i][j].toFixed(2);
        } else if (mode === 'observed') {
          fill = countColor(matrix[i][j], obsMax);
          text = String(matrix[i][j]);
        } else {
          fill = countColor(stats.expected[i][j], expMax);
          text = stats.expected[i][j].toFixed(1);
        }
        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.fillStyle = '#222';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + cellW / 2, y + cellH / 2);
      });
    });
  }

  function compute() {
    const { rowLabels, colLabels, matrix } = readInputs(id);
    const error = validateTable(rowLabels, colLabels, matrix);
    if (error) {
      result.innerHTML = `<div style="color:#c0392b;text-align:center;">${error}</div>`;
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const stats = getStats(matrix);
    draw(rowLabels, colLabels, matrix, stats);
    let maxCell = { i: 0, j: 0, value: 0 };
    stats.residuals.forEach((row, i) => row.forEach((value, j) => {
      if (Math.abs(value) > Math.abs(maxCell.value)) maxCell = { i, j, value };
    }));
    result.innerHTML = `<strong>Pearson χ²</strong> = ${stats.chisq.toFixed(4)}，df = ${stats.df}，P ≈ ${formatP(stats.p)} &nbsp;|&nbsp; <strong>最显著偏离</strong>：${rowLabels[maxCell.i]} × ${colLabels[maxCell.j]}，残差=${maxCell.value.toFixed(3)}`;
  }

  Object.entries(buttons).forEach(([nextMode, button]) => {
    button.addEventListener('click', () => {
      mode = nextMode;
      Object.entries(buttons).forEach(([key, btn]) => btn.classList.toggle('active', key === mode));
      compute();
    });
  });
  new ResizeObserver(compute).observe(canvas.parentElement);
  compute();
}

registerViz('mosaic', renderMosaicAudited);
registerViz('contingencyheatmap', renderHeatmapAudited);
