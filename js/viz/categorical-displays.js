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
  return p < 0.001 ? '&lt; 0.001' : p.toFixed(4);
}

function residualColor(r) {
  const a = Math.min(1, Math.abs(r) / 4);
  if (r >= 0) {
    const g = Math.round(235 - a * 95);
    const b = Math.round(235 - a * 95);
    return `rgb(231, ${g}, ${b})`;
  }
  const rr = Math.round(235 - a * 95);
  const gg = Math.round(235 - a * 95);
  return `rgb(${rr}, ${gg}, 231)`;
}

function intensityColor(v, max) {
  const a = max > 0 ? Math.min(1, v / max) : 0;
  const base = Math.round(245 - a * 120);
  return `rgb(${base}, ${base + 5}, 255)`;
}

function renderMosaic(el) {
  if (!ensureJStat(el)) return;
  const id = 'mosaic-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '列联表马赛克图';
  const rowLabelsDefault = el.dataset.rowLabels || 'A组,B组,C组';
  const colLabelsDefault = el.dataset.colLabels || '无效,有效,显效';
  const matrixDefault = el.dataset.matrix || '42,35,23;28,44,28;20,30,50';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">🧩 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">面积表示频数占比，颜色表示 Pearson 残差方向与大小：红色偏高、蓝色偏低。</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">行标签（逗号分隔）<br><input id="${id}-rows" type="text" value="${rowLabelsDefault}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">列标签（逗号分隔）<br><input id="${id}-cols" type="text" value="${colLabelsDefault}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;grid-column:1 / -1;">列联表矩阵（每行逗号分隔，行与行用分号分隔）<br><input id="${id}-matrix" type="text" value="${matrixDefault}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-calc" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">重绘马赛克图</button>
      </div>
      <canvas id="${id}-canvas" width="620" height="340" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
    </div>`;

  const rowsInput = document.getElementById(`${id}-rows`);
  const colsInput = document.getElementById(`${id}-cols`);
  const matrixInput = document.getElementById(`${id}-matrix`);
  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const result = document.getElementById(`${id}-result`);

  function draw(rowLabels, matrix, stats) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 70, r: 20, t: 35, b: 72 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const { rowTotals, total, residuals } = stats;

    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('马赛克图：面积≈频数占比，颜色≈残差', W / 2, 18);

    let x = pad.l;
    matrix.forEach((row, i) => {
      const w = plotW * (rowTotals[i] / total);
      let y = pad.t + plotH;
      row.forEach((v, j) => {
        const h = rowTotals[i] > 0 ? plotH * (v / rowTotals[i]) : 0;
        y -= h;
        ctx.fillStyle = residualColor(residuals[i][j]);
        ctx.fillRect(x, y, w - 2, h - 2);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x, y, w - 2, h - 2);
        if (w > 44 && h > 24) {
          ctx.fillStyle = '#222';
          ctx.font = '11px sans-serif';
          ctx.fillText(String(v), x + (w - 2) / 2, y + h / 2 + 4);
        }
      });
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.fillText(rowLabels[i], x + w / 2, pad.t + plotH + 18);
      x += w;
    });

    ctx.strokeStyle = '#333';
    ctx.strokeRect(pad.l, pad.t, plotW, plotH);
  }

  function compute() {
    const rowLabels = parseCsv(rowsInput.value, false);
    const colLabels = parseCsv(colsInput.value, false);
    const matrix = parseMatrix(matrixInput.value);
    const err = validateContingency(rowLabels, colLabels, matrix);
    if (err) {
      result.innerHTML = `<div style="color:#c0392b;text-align:center;">${err}</div>`;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const stats = computeContingencyStats(matrix);
    draw(rowLabels, matrix, stats);
    const maxAbsResidual = Math.max(...stats.residuals.flat().map(v => Math.abs(v)));
    result.innerHTML = `
      <div><strong>Pearson χ²</strong> = ${stats.chisq.toFixed(4)}，df = ${stats.df}，P ≈ ${formatP(stats.p)}</div>
      <div><strong>读图方式</strong>：横向宽度表示各行总量占比；小块面积表示单元格频数占比；颜色越深，说明该格对列联偏离贡献越明显。</div>
      <div><strong>最大 |Pearson 残差|</strong> = ${maxAbsResidual.toFixed(3)}</div>`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  compute();
}

function renderContingencyHeatmap(el) {
  if (!ensureJStat(el)) return;
  const id = 'heatmap-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '列联表热力图';
  const rowLabelsDefault = el.dataset.rowLabels || 'A组,B组,C组';
  const colLabelsDefault = el.dataset.colLabels || '无效,有效,显效';
  const matrixDefault = el.dataset.matrix || '42,35,23;28,44,28;20,30,50';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">🔥 ${title}</div>
      <div style="margin:6px 0 10px;text-align:center;font-size:12px;color:#666;">可切换观察频数、期望频数和 Pearson 残差三种视图，用来判断哪些单元格最“拉动”整体 χ²。</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:10px;align-items:end;">
        <label style="font-size:13px;">行标签（逗号分隔）<br><input id="${id}-rows" type="text" value="${rowLabelsDefault}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;">列标签（逗号分隔）<br><input id="${id}-cols" type="text" value="${colLabelsDefault}" style="width:100%;padding:6px;"></label>
        <label style="font-size:13px;grid-column:1 / -1;">列联表矩阵（每行逗号分隔，行与行用分号分隔）<br><input id="${id}-matrix" type="text" value="${matrixDefault}" style="width:100%;padding:6px;"></label>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-calc" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">更新热力图</button>
        <button id="${id}-obs" class="path-tab active" type="button">观察频数</button>
        <button id="${id}-exp" class="path-tab" type="button">期望频数</button>
        <button id="${id}-res" class="path-tab" type="button">Pearson 残差</button>
      </div>
      <canvas id="${id}-canvas" width="620" height="340" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
    </div>`;

  const rowsInput = document.getElementById(`${id}-rows`);
  const colsInput = document.getElementById(`${id}-cols`);
  const matrixInput = document.getElementById(`${id}-matrix`);
  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const result = document.getElementById(`${id}-result`);
  const obsBtn = document.getElementById(`${id}-obs`);
  const expBtn = document.getElementById(`${id}-exp`);
  const resBtn = document.getElementById(`${id}-res`);
  let mode = 'observed';

  function setMode(nextMode) {
    mode = nextMode;
    obsBtn.classList.toggle('active', mode === 'observed');
    expBtn.classList.toggle('active', mode === 'expected');
    resBtn.classList.toggle('active', mode === 'residual');
    compute();
  }

  function draw(rowLabels, colLabels, matrix, stats) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 86, r: 24, t: 42, b: 62 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const cellW = plotW / colLabels.length;
    const cellH = plotH / rowLabels.length;
    const observedMax = Math.max(...matrix.flat());
    const expectedMax = Math.max(...stats.expected.flat());
    const residualMax = Math.max(...stats.residuals.flat().map(v => Math.abs(v))) || 1;

    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      mode === 'observed' ? '列联表热力图：观察频数' : mode === 'expected' ? '列联表热力图：期望频数' : '列联表热力图：Pearson 残差',
      W / 2,
      18
    );

    rowLabels.forEach((label, i) => {
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(label, pad.l - 8, pad.t + i * cellH + cellH / 2 + 4);
    });
    colLabels.forEach((label, j) => {
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, pad.l + j * cellW + cellW / 2, pad.t - 10);
    });

    for (let i = 0; i < rowLabels.length; i++) {
      for (let j = 0; j < colLabels.length; j++) {
        const x = pad.l + j * cellW;
        const y = pad.t + i * cellH;
        const obs = matrix[i][j];
        const exp = stats.expected[i][j];
        const res = stats.residuals[i][j];
        let fill, valueText;
        if (mode === 'observed') {
          fill = intensityColor(obs, observedMax);
          valueText = String(obs);
        } else if (mode === 'expected') {
          fill = intensityColor(exp, expectedMax);
          valueText = exp.toFixed(1);
        } else {
          fill = residualColor(res);
          valueText = res.toFixed(2);
        }
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, cellW - 2, cellH - 2);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x, y, cellW - 2, cellH - 2);
        ctx.fillStyle = '#222';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(valueText, x + (cellW - 2) / 2, y + cellH / 2 + 4);
      }
    }

    ctx.strokeStyle = '#555';
    ctx.strokeRect(pad.l, pad.t, plotW, plotH);
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    if (mode === 'residual') {
      ctx.fillText(`残差色阶范围：±${residualMax.toFixed(2)}`, pad.l, H - 18);
    } else {
      const maxText = mode === 'observed' ? observedMax.toFixed(0) : expectedMax.toFixed(1);
      ctx.fillText(`色阶最大值：${maxText}`, pad.l, H - 18);
    }
  }

  function compute() {
    const rowLabels = parseCsv(rowsInput.value, false);
    const colLabels = parseCsv(colsInput.value, false);
    const matrix = parseMatrix(matrixInput.value);
    const err = validateContingency(rowLabels, colLabels, matrix);
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
      <div><strong>Pearson χ²</strong> = ${stats.chisq.toFixed(4)}，df = ${stats.df}，P ≈ ${formatP(stats.p)}</div>
      <div><strong>最显著偏离单元格</strong>：${rowLabels[maxCell.i]} × ${colLabels[maxCell.j]}，Pearson 残差 = ${maxCell.value.toFixed(3)}</div>
      <div><strong>读图方式</strong>：观察频数看原始表，期望频数看“若独立时应有多大”，残差视图最适合判断哪些格子对整体 χ² 贡献最大。</div>`;
  }

  document.getElementById(`${id}-calc`).addEventListener('click', compute);
  obsBtn.addEventListener('click', () => setMode('observed'));
  expBtn.addEventListener('click', () => setMode('expected'));
  resBtn.addEventListener('click', () => setMode('residual'));
  compute();
}

registerViz('mosaic', renderMosaic);
registerViz('contingencyheatmap', renderContingencyHeatmap);

function injectContingencyDisplayWidgets() {
  const root = document.getElementById('chapter-content');
  if (!root) return;
  const title = root.querySelector('h1 .chapter-title');
  if (!title || !title.textContent.includes('卡方检验')) return;
  if (root.querySelector('.stat-viz[data-type="mosaic"]') || root.querySelector('.stat-calc[data-type="contingencyheatmap"]')) return;

  const heading = Array.from(root.querySelectorAll('h2, h3')).find(node => node.textContent.includes('行 x 列表资料的卡方检验'));
  if (!heading) return;

  const note = document.createElement('p');
  note.textContent = '下方两个组件用来补足行×列表的可视化层：马赛克图强调“面积 + 残差方向”，热力图强调“观察频数 / 期望频数 / 残差”三种视角，适合配合 4.5 一起看。';
  note.style.color = '#555';
  note.style.fontSize = '0.95em';

  const mosaic = document.createElement('div');
  mosaic.className = 'stat-viz';
  mosaic.dataset.type = 'mosaic';
  mosaic.dataset.title = '列联表马赛克图';
  mosaic.dataset.rowLabels = 'A组,B组,C组';
  mosaic.dataset.colLabels = '无效,有效,显效';
  mosaic.dataset.matrix = '42,35,23;28,44,28;20,30,50';

  const heatmap = document.createElement('div');
  heatmap.className = 'stat-calc';
  heatmap.dataset.type = 'contingencyheatmap';
  heatmap.dataset.title = '列联表热力图';
  heatmap.dataset.rowLabels = 'A组,B组,C组';
  heatmap.dataset.colLabels = '无效,有效,显效';
  heatmap.dataset.matrix = '42,35,23;28,44,28;20,30,50';

  heading.insertAdjacentElement('afterend', note);
  note.insertAdjacentElement('afterend', mosaic);
  mosaic.insertAdjacentElement('afterend', heatmap);
}

function setupContingencyDisplayInjection() {
  injectContingencyDisplayWidgets();
  const root = document.getElementById('chapter-content');
  if (!root) return;
  const observer = new MutationObserver(() => injectContingencyDisplayWidgets());
  observer.observe(root, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupContingencyDisplayInjection, { once: true });
} else {
  setupContingencyDisplayInjection();
}
