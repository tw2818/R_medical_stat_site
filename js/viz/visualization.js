import { registerViz, mean, sd, ensureJStat, createTooltip } from './_core.js';

// ==========================================================
// VISUALIZATION - 统计可视化模块
// ==========================================================

// ============================================================
// VISUALIZATION - 统计可视化模块
// ============================================================

  function renderHistogram(el) {
    if (!ensureJStat(el)) return;
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
    const barData = [];
    bins.forEach((count, i) => {
      const barH = (count / maxCount) * plotH * 0.85;
      const x = padL + (i / nbins) * plotW + (plotW / nbins) * 0.1;
      const y = padT + plotH - barH;
      barData.push({ x, y, w: barW, h: barH, binRange: `${(minD + i * binWidth).toFixed(1)}–${(minD + (i + 1) * binWidth).toFixed(1)}`, count });
    });

    // Tooltip
    const card = canvas.parentElement;
    const tip = createTooltip(card);
    let hoveredBar = null;
    const xRange = maxD - minD || 1;
    const safeMaxCount = Math.max(maxCount, 1);
    const safeBins = Math.max(nbins, 1);

    function drawBars(hlIndex) {
      ctx.clearRect(padL, padT, plotW, plotH);
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
      barData.forEach((b, i) => {
        ctx.fillStyle = i === hlIndex ? '#2980b9' : '#3498db';
        ctx.fillRect(b.x, b.y, b.w, b.h);
      });
      // Normal curve overlay
      ctx.beginPath();
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2.5;
      for (let px = 0; px <= plotW; px++) {
        const v = minD + (px / plotW) * xRange;
        const density = jStat.normal.pdf(v, mean, sd) * binWidth;
        const y = padT + plotH - (density * n / safeMaxCount * plotH * 0.85);
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
    drawBars(-1);

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let found = null;
      barData.forEach((b, i) => {
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) found = i;
      });
      if (found !== hoveredBar) {
        hoveredBar = found;
        drawBars(found);
      }
      if (found !== null) {
        const b = barData[found];
        tip.show(`${b.binRange} | 频数: ${b.count}`);
        tip.move(e);
      } else {
        tip.hide();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredBar = null;
      drawBars(-1);
      tip.hide();
    });
  }
registerViz('hist', renderHistogram);

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
registerViz('box', renderBoxplot);

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
    const barData = [];
    values.forEach((val, i) => {
      const barH = (val / maxVal) * plotH * 0.9;
      const x = padL + gap + i * (barW + gap);
      const y = padT + plotH - barH;
      barData.push({ x, y, w: barW, h: barH, label: labels[i], value: val });
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x, y, barW, barH);
      // Value label
      ctx.fillStyle = '#333'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(val, x + barW / 2, y - 8);
      // X label
      ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
      ctx.fillText(labels[i], x + barW / 2, padT + plotH + 18);
    });

    const card = canvas.parentElement;
    const tip = createTooltip(card);
    let hoveredIdx = null;

    function drawBars(hlIdx) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 22);
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padT + (i / 5) * plotH;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      }
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
      ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('数值', 0, 0); ctx.restore();
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const y = padT + (i / 5) * plotH;
        const v = Math.round(maxVal * (1 - i / 5));
        ctx.fillText(v, padL - 6, y + 4);
      }
      barData.forEach((b, i) => {
        ctx.fillStyle = i === hlIdx ? '#2980b9' : colors[i % colors.length];
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#333'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(b.value, b.x + b.w / 2, b.y - 8);
        ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
        ctx.fillText(b.label, b.x + b.w / 2, padT + plotH + 18);
      });
    }

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let found = null;
      barData.forEach((b, i) => {
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) found = i;
      });
      if (found !== hoveredIdx) {
        hoveredIdx = found;
        drawBars(found);
      }
      if (found !== null) {
        const b = barData[found];
        tip.show(`${b.label}: ${b.value}`);
        tip.move(e);
      } else {
        tip.hide();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredIdx = null;
      drawBars(-1);
      tip.hide();
    });
  }
registerViz('bar', renderBarChart);

  // ============================================================
  // Pie Chart
  // ============================================================

  function renderPieChart(el) {
    // Pie chart removed - placeholder preserved for future use
  }
  // Note: pie renderer unregistered - component removed from HTML

  // ============================================================
  // Power Analysis Explorer
  // ============================================================

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
registerViz('heatmap', renderHeatmap);

  // ============================================================
  // Ridgeline Plot (峰峦图 / Joy Plot)
  // ============================================================
  // <div class="stat-viz" data-type="ridgeline" data-title="不同年龄段体温分布" data-labels="儿童,青少年,青年,中年,老年" data-dists="12,13,12.5,13.2,12.8,13.5,13.1,12.9,13.3,12.7:22,23,22.5,23.2,22.8,23.5,23.1,22.9,23.3,22.7,23.4,22.6,23.0:36.2,36.5,36.3,36.6,36.4,36.7,36.3,36.5,36.2,36.8,36.4,36.6:37.1,37.3,37.2,37.4,37.0,37.5,37.1,37.3,37.2,37.4,37.0,37.6,37.1:36.8,36.9,36.7,37.0,36.8,37.1,36.9,36.8,37.0,36.7,37.1"></div>

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
      ctx.fillText((maxVal * frac).toFixed(0), cx, cy + r * frac + 10);
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
registerViz('radar', renderRadarChart);

  // ── 分发器 ─────────────────────────────────────────────


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
      const maxDensity = 1 / (s * Math.sqrt(2 * Math.PI));
      const scale = bandH * 0.8;
      for (let k = 0; k <= steps; k++) {
        const xFrac = k / steps;
        const xVal = xMin + xFrac * (xMax - xMin);
        const density = (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((xVal - m) / s) ** 2);
        const px = padL + xFrac * plotW;
        const py = yBase - (density / maxDensity) * scale;
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
registerViz('ridgeline', renderRidgeline);

  // ============================================================
  // LDA Scatter Plot (判别分析散点图)
  // ============================================================
  // <div class="stat-viz" data-type="ldascatter" data-title="LDA二类分类边界" data-x1="1.2,2.1,1.8,2.5,3.2,1.5,2.8,1.9,2.3,1.7,3.5,2.0" data-y1="2.3,3.1,2.8,3.9,4.5,2.5,3.8,2.7,3.2,2.4,4.1,2.9" data-x2="6.1,5.8,6.5,7.2,6.8,5.5,7.0,6.3,5.9,7.5,6.2,6.9" data-y2="5.2,6.1,5.5,6.8,7.2,5.0,6.5,5.8,6.0,7.3,5.7,6.4" data-label1="早期肝硬化" data-label2="晚期肝硬化"></div>

  function renderGaugeChart(el) {
    const id = 'gauge-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '风险分层仪表盘';
    const value = parseFloat(el.dataset.value || '50');
    const min = parseFloat(el.dataset.min || '0');
    const max = parseFloat(el.dataset.max || '100');
    const unit = el.dataset.unit || '%';

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="360" height="280" style="display:block;margin:0 auto;"></canvas>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 360, H = 280;
    const cx = W / 2, cy = 140;
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
    ctx.fillText(value + unit, cx, cy - 55);
  }
registerViz('gauge', renderGaugeChart);

  // ============================================================
  // Sankey Diagram (Flow / Transition)
  // ============================================================

  function renderSankey(el) {
    const id = 'sankey-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '患者状态转移流向图';
    const nodes = (el.dataset.nodes || '入院,治疗中,好转,转院,出院,死亡').split(',');
    const linksRaw = (el.dataset.links || '0->1:150,0->2:40,0->3:25,0->5:10,1->2:80,1->3:30,1->5:20,2->4:70,2->1:20,3->4:30,3->5:10,4->0:15').split(',');

    const W = 580, H = 420;
    const padL = 80, padR = 80, padT = 40, padB = 40;
    const nodeW = 20;
    const nodeLevels = [0, 1, 1, 2, 2, 2];
    const colCount = 3;
    const colX = [padL, padL + (W - padL - padR - nodeW) / 2, W - padR - nodeW];

    el.innerHTML = `<div class="viz-card" style="position:relative;">
      <div class="viz-header">📊 ${title}</div>
      <svg id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></svg>
      <div id="${id}-tooltip" style="position:absolute;pointer-events:none;background:rgba(40,40,40,0.9);color:#fff;padding:8px 12px;border-radius:6px;font-size:12px;line-height:1.4;display:none;z-index:100;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
    </div>`;

    const svg = document.getElementById(id);
    const tooltip = document.getElementById(id + '-tooltip');
    const svgRect = svg.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const svgOffsetX = svgRect.left - elRect.left;
    const svgOffsetY = svgRect.top - elRect.top;

    const linkData = linksRaw.map(l => {
      const [fromTo, val] = l.split(':');
      const [src, tgt] = fromTo.split('->');
      return { source: parseInt(src), target: parseInt(tgt), value: parseFloat(val) };
    });

    const totalFlow = linkData.reduce((s, l) => s + l.value, 0);
    const maxLinkVal = Math.max(...linkData.map(l => l.value));
    const minLinkVal = Math.min(...linkData.map(l => l.value));

    const nodeFlow = nodes.map((_, i) => {
      let inflow = 0, outflow = 0;
      linkData.forEach(l => {
        if (l.target === i) inflow += l.value;
        if (l.source === i) outflow += l.value;
      });
      return inflow + outflow;
    });

    const maxNodeFlow = Math.max(...nodeFlow);
    const plotH = H - padT - padB;

    const nodeHeights = nodeFlow.map(f => {
      const ratio = f / maxNodeFlow;
      return Math.max(40, Math.min(120, ratio * plotH * 0.5));
    });

    function getInitNodeY() {
      const maxLevel = Math.max(...nodeLevels);
      const levelGroups = Array.from({ length: maxLevel + 1 }, () => []);
      nodes.forEach((_, i) => levelGroups[nodeLevels[i]].push(i));

      const result = new Array(nodes.length);

      levelGroups.forEach((group) => {
        const totalH = group.reduce((s, i) => s + nodeHeights[i], 0);
        const gap = (plotH - totalH) / (group.length + 1);
        let y = padT + gap;
        group.forEach(idx => {
          result[idx] = y;
          y += nodeHeights[idx] + gap;
        });
      });

      for (let pass = 0; pass < 3; pass++) {
        linkData.forEach(link => {
          const s = link.source, t = link.target;
          const overlap = (nodeHeights[s] + nodeHeights[t]) / 2 + 10;
          const midS = result[s] + nodeHeights[s] / 2;
          const midT = result[t] + nodeHeights[t] / 2;
          if (Math.abs(midS - midT) < overlap) {
            const shift = (overlap - Math.abs(midS - midT)) / 2 + 5;
            if (midS < midT) {
              result[s] = Math.max(padT, result[s] - shift);
              result[t] = Math.min(H - padB - nodeHeights[t], result[t] + shift);
            } else {
              result[s] = Math.min(H - padB - nodeHeights[s], result[s] + shift);
              result[t] = Math.max(padT, result[t] - shift);
            }
          }
        });
      }

      // Enforce minimum spacing between nodes in the same level (even without direct links)
      for (let lvl = 0; lvl < levelGroups.length; lvl++) {
        const group = levelGroups[lvl];
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const a = group[i], b = group[j];
            const minGap = 12;
            const aBottom = result[a] + nodeHeights[a];
            const bTop = result[b];
            if (bTop - aBottom < minGap) {
              const shift = (minGap - (bTop - aBottom)) / 2;
              result[a] -= shift;
              result[b] += shift;
            }
          }
        }
      }

      return result.map((y, i) => Math.max(padT, Math.min(H - padB - nodeHeights[i], y)));
    }

    const nodeY = getInitNodeY();

    function colorScale(value) {
      const t = (value - minLinkVal) / (maxLinkVal - minLinkVal || 1);
      const r = Math.round(100 + t * 80);
      const g = Math.round(140 + t * 60);
      const b = Math.round(220 - t * 100);
      return `rgb(${r},${g},${b})`;
    }

    let lockedLink = null, lockedNode = null;
    let draggingNode = null, dragStartY = 0, dragNodeStartY = 0, dragOriginalY = 0;

    const linkPaths = [];

    function buildLinkPath(sx, sy, tx, ty, sh, th) {
      const dx = tx - sx;
      const curvature = Math.min(0.5, Math.abs(dx) / 400);
      const cp1x = sx + dx * curvature;
      const cp2x = tx - dx * curvature;
      return `M${sx},${sy + sh/2} C${cp1x},${sy + sh/2} ${cp2x},${ty + th/2} ${tx},${ty + th/2}`;
    }

    linkData.forEach((link, idx) => {
      const sl = nodeLevels[link.source], tl = nodeLevels[link.target];
      const sx = colX[sl] + nodeW, tx = colX[tl];
      const sy = nodeY[link.source], ty = nodeY[link.target];
      const sh = nodeHeights[link.source], th = nodeHeights[link.target];

      const linkWidth = Math.max(2, (link.value / maxLinkVal) * 30);
      const color = colorScale(link.value);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', buildLinkPath(colX[sl] + nodeW, sy, colX[tl], ty, sh, th));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', linkWidth);
      path.setAttribute('stroke-opacity', 0.75);
      path.setAttribute('cursor', 'pointer');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);

      const labelX = (colX[sl] + nodeW + colX[tl]) / 2;
      const labelY = (sy + sh/2 + ty + th/2) / 2;

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', labelX);
      text.setAttribute('y', labelY);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', '#333');
      text.setAttribute('pointer-events', 'none');
      text.textContent = link.value;
      svg.appendChild(text);

      linkPaths.push({ path, baseWidth: linkWidth, baseColor: color, source: link.source, target: link.target, text, labelX, labelY });

      path.addEventListener('mouseenter', (e) => {
        if (lockedLink !== null || lockedNode !== null) return;
        linkPaths.forEach((p, i) => {
          const highlighted = i === idx;
          p.path.setAttribute('stroke-width', highlighted ? p.baseWidth + 4 : p.baseWidth);
          p.path.setAttribute('stroke-opacity', highlighted ? 1 : 0.15);
          p.text.setAttribute('fill', highlighted ? '#000' : '#aaa');
        });
        tooltip.innerHTML = `${nodes[link.source]} → ${nodes[link.target]}: <b>${link.value}人</b>`;
        tooltip.style.display = 'block';
        tooltip.style.left = (svgOffsetX + labelX + 10) + 'px';
        tooltip.style.top = (svgOffsetY + labelY - 20) + 'px';
      });

      path.addEventListener('mousemove', () => {
        tooltip.style.left = (svgOffsetX + labelX + 10) + 'px';
        tooltip.style.top = (svgOffsetY + labelY - 20) + 'px';
      });

      path.addEventListener('mouseleave', () => {
        if (lockedLink !== null || lockedNode !== null) return;
        linkPaths.forEach(p => {
          p.path.setAttribute('stroke-width', p.baseWidth);
          p.path.setAttribute('stroke-opacity', 0.75);
          p.text.setAttribute('fill', '#333');
        });
        tooltip.style.display = 'none';
      });

      path.addEventListener('click', (e) => {
        e.stopPropagation();
        if (lockedLink === idx) {
          lockedLink = null;
          linkPaths.forEach(p => {
            p.path.setAttribute('stroke-width', p.baseWidth);
            p.path.setAttribute('stroke-opacity', 0.75);
            p.text.setAttribute('fill', '#333');
          });
        } else {
          lockedLink = idx;
          lockedNode = null;
          linkPaths.forEach((p, i) => {
            const hl = i === idx;
            p.path.setAttribute('stroke-width', hl ? p.baseWidth + 4 : p.baseWidth);
            p.path.setAttribute('stroke-opacity', hl ? 1 : 0.15);
            p.text.setAttribute('fill', hl ? '#000' : '#aaa');
          });
        }
      });
    });

    const nodeRects = [];
    const levelColors = ['#3498db', '#e67e22', '#27ae60'];

    nodes.forEach((node, i) => {
      const x = colX[nodeLevels[i]];
      const y = nodeY[i];
      const h = nodeHeights[i];

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', nodeW);
      rect.setAttribute('height', h);
      rect.setAttribute('rx', 6);
      rect.setAttribute('fill', levelColors[nodeLevels[i]]);
      rect.setAttribute('cursor', 'grab');
      svg.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const tx = nodeLevels[i] === 0 ? x + nodeW + 8 : (nodeLevels[i] === 2 ? x - 8 : x + nodeW / 2);
      const ta = nodeLevels[i] === 0 ? 'start' : (nodeLevels[i] === 2 ? 'end' : 'middle');
      text.setAttribute('x', tx);
      text.setAttribute('y', y + h / 2);
      text.setAttribute('text-anchor', ta);
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#222');
      text.setAttribute('pointer-events', 'none');
      text.textContent = node;
      svg.appendChild(text);

      nodeRects.push({ rect, baseColor: levelColors[nodeLevels[i]], index: i, text, nodeH: h });

      rect.addEventListener('mouseenter', (e) => {
        if (lockedNode !== null || lockedLink !== null) return;
        linkPaths.forEach(p => {
          const related = p.source === i || p.target === i;
          p.path.setAttribute('stroke-width', related ? p.baseWidth + 3 : p.baseWidth);
          p.path.setAttribute('stroke-opacity', related ? 1 : 0.15);
          p.text.setAttribute('fill', related ? '#000' : '#aaa');
        });
        rect.setAttribute('fill', levelColors[nodeLevels[i]] === '#3498db' ? '#2980b9' :
          levelColors[nodeLevels[i]] === '#e67e22' ? '#d35400' : '#1e8449');
        tooltip.innerHTML = `<b>${node}</b><br>流入: ${nodeFlow[i] - linkData.filter(l => l.source === i).reduce((s, l) => s + l.value, 0)}人 | 流出: ${linkData.filter(l => l.source === i).reduce((s, l) => s + l.value, 0)}人`;
        tooltip.style.display = 'block';
        tooltip.style.left = (svgOffsetX + x + nodeW / 2 + 10) + 'px';
        tooltip.style.top = (svgOffsetY + y + h / 2 - 20) + 'px';
      });

      rect.addEventListener('mousemove', () => {
        tooltip.style.left = (svgOffsetX + x + nodeW / 2 + 10) + 'px';
        tooltip.style.top = (svgOffsetY + y + h / 2 - 20) + 'px';
      });

      rect.addEventListener('mouseleave', () => {
        if (lockedNode !== null || lockedLink !== null) return;
        linkPaths.forEach(p => {
          p.path.setAttribute('stroke-width', p.baseWidth);
          p.path.setAttribute('stroke-opacity', 0.75);
          p.text.setAttribute('fill', '#333');
        });
        rect.setAttribute('fill', levelColors[nodeLevels[i]]);
        tooltip.style.display = 'none';
      });

      rect.addEventListener('click', (e) => {
        e.stopPropagation();
        if (lockedNode === i) {
          lockedNode = null;
          linkPaths.forEach(p => {
            p.path.setAttribute('stroke-width', p.baseWidth);
            p.path.setAttribute('stroke-opacity', 0.75);
            p.text.setAttribute('fill', '#333');
          });
        } else {
          lockedNode = i;
          lockedLink = null;
          linkPaths.forEach(p => {
            const related = p.source === i || p.target === i;
            p.path.setAttribute('stroke-width', related ? p.baseWidth + 3 : p.baseWidth);
            p.path.setAttribute('stroke-opacity', related ? 1 : 0.15);
            p.text.setAttribute('fill', related ? '#000' : '#aaa');
          });
        }
      });

      rect.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        draggingNode = i;
        dragStartY = e.clientY;
        dragNodeStartY = nodeY[i];
        dragOriginalY = nodeY[i];
        lockedNode = null;
        lockedLink = null;
        linkPaths.forEach(p => {
          p.path.setAttribute('stroke-width', p.baseWidth);
          p.path.setAttribute('stroke-opacity', 0.75);
          p.text.setAttribute('fill', '#333');
        });
        rect.style.cursor = 'grabbing';
      });

      
    });

    svg.addEventListener('mousemove', (e) => {
      if (draggingNode === null) return;
      const newY = dragNodeStartY + (e.clientY - dragStartY);
      const clampedY = Math.max(padT, Math.min(H - padB - nodeHeights[draggingNode], newY));
      nodeY[draggingNode] = clampedY;

      const nr = nodeRects[draggingNode];
      nr.rect.setAttribute('y', clampedY);
      nr.text.setAttribute('y', clampedY + nr.nodeH / 2);

      linkPaths.forEach(p => {
        if (p.source === draggingNode || p.target === draggingNode) {
          const sl = nodeLevels[p.source], tl = nodeLevels[p.target];
          const sy = nodeY[p.source], ty = nodeY[p.target];
          const sh = nodeHeights[p.source], th = nodeHeights[p.target];
          p.path.setAttribute('d', buildLinkPath(colX[sl] + nodeW, sy, colX[tl], ty, sh, th));
          p.labelY = (sy + sh/2 + ty + th/2) / 2;
          p.text.setAttribute('y', p.labelY);
          p.text.setAttribute('x', (colX[sl] + nodeW + colX[tl]) / 2);
        }
      });
    });

    svg.addEventListener('mouseup', () => {
      if (draggingNode !== null) {
        nodeRects[draggingNode].rect.style.cursor = 'grab';
        draggingNode = null;
      }
    });

    document.addEventListener('mouseup', () => {
      if (draggingNode !== null) {
        nodeRects[draggingNode].rect.style.cursor = 'grab';
        draggingNode = null;
      }
    });

    svg.addEventListener('mouseleave', () => {
      if (draggingNode !== null) {
        const nr = nodeRects[draggingNode];
        nr.rect.setAttribute('y', dragOriginalY);
        nr.text.setAttribute('y', dragOriginalY + nr.nodeH / 2);
        linkPaths.forEach(p => {
          if (p.source === draggingNode || p.target === draggingNode) {
            const sl = nodeLevels[p.source], tl = nodeLevels[p.target];
            const sy = p.source === draggingNode ? dragOriginalY : nodeY[p.source];
            const ty = p.target === draggingNode ? dragOriginalY : nodeY[p.target];
            const sh = nodeHeights[p.source], th = nodeHeights[p.target];
            p.path.setAttribute('d', buildLinkPath(colX[sl] + nodeW, sy, colX[tl], ty, sh, th));
          }
        });
        nodeY[draggingNode] = dragOriginalY;
        draggingNode = null;
      }
      tooltip.style.display = 'none';
    });

    svg.addEventListener('click', () => {
      if (lockedLink !== null || lockedNode !== null) {
        lockedLink = null;
        lockedNode = null;
        linkPaths.forEach(p => {
          p.path.setAttribute('stroke-width', p.baseWidth);
          p.path.setAttribute('stroke-opacity', 0.75);
          p.text.setAttribute('fill', '#333');
        });
      }
    });
  }
  registerViz('sankey', renderSankey);

  // ============================================================
  // Spine Plot (Ordinal Categorical Data)
  // ============================================================

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
registerViz('area', renderAreaChart);

  // ============================================================
  // Heatmap (热图)
  // ============================================================
  // <div class="stat-viz" data-type="heatmap" data-title="基因表达热图" data-rows="Gene A,Gene B,Gene C,Gene D,Gene E" data-cols="样本1,样本2,样本3,样本4,样本5,样本6" data-values="2.1,1.5,3.2,0.8,1.2,2.8:0.5,2.8,1.1,3.5,2.0,0.9:3.8,0.6,2.4,1.3,3.9,1.7:1.2,3.3,0.7,2.6,1.8,3.1:2.7,1.9,3.5,0.4,2.3,1.6"></div>

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
registerViz('errorbar', renderErrorBar);

  // ============================================================
  // Area Chart (堆叠面积图 / Stacked Area)
  // ============================================================
  // <div class="stat-viz" data-type="area" data-title="患者状态变化趋势" data-labels="1月,2月,3月,4月,5月,6月" data-series="治愈,好转,住院中" data-values="120,135,150,140,160,175:80,95,110,105,120,130:45,50,55,60,58,62"></div>

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
registerViz('ldascatter', renderLDAScatter);

  // ============================================================
  // Radar / Spider Chart (雷达图)
  // ============================================================
  // <div class="stat-viz" data-type="radar" data-title="患者指标雷达图" data-labels="血压,血糖,血脂,肺功能,肾功能,心功能" data-values="75,60,80,70,85,65" data-max="100"></div>

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
    const barX = padL + plotW * 0.05;
    const trackW = plotW * 0.9;

    let segData = [];
    categories.forEach((cat, i) => {
      const barY = padT + gap + i * (barH + gap);
      const barW = props[i] * trackW;
      segData.push({ barX, barY, barW, barH, label: cat, prop: props[i] });

      // Background track
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(barX, barY, trackW, barH);

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

    const card = canvas.parentElement;
    const tip = createTooltip(card);
    let hoveredIdx = null;

    function drawWithHighlight(idx) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 22);
      ctx.save(); ctx.translate(14, padT + totalH / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('累积比例', 0, 0); ctx.restore();
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padT + (i / 4) * totalH;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      }
      const barH = Math.min(36, totalH / categories.length * 0.6);
      const gap = (totalH - barH * categories.length) / (categories.length + 1);
      const barX = padL + plotW * 0.05;
      const trackW = plotW * 0.9;
      const newSegData = [];
      categories.forEach((cat, i) => {
        const barY = padT + gap + i * (barH + gap);
        const barW = props[i] * trackW;
        newSegData.push({ barX, barY, barW, barH, label: cat, prop: props[i] });
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(barX, barY, trackW, barH);
        ctx.fillStyle = idx === i ? colors[i % colors.length] + 'dd' : colors[i % colors.length];
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(cat, padL - 8, barY + barH / 2 + 4);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        if (barW > 30) ctx.fillText((props[i] * 100).toFixed(1) + '%', barX + barW / 2, barY + barH / 2 + 4);
      });
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const y = padT + (i / 4) * totalH;
        ctx.fillText((i / 4 * 100).toFixed(0) + '%', padL - 6, y + 4);
      }
      return newSegData;
    }

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let found = null;
      segData.forEach((s, i) => {
        if (mx >= s.barX && mx <= s.barX + trackW && my >= s.barY && my <= s.barY + s.barH) found = i;
      });
      if (found !== hoveredIdx) {
        hoveredIdx = found;
        segData = drawWithHighlight(hoveredIdx);
      }
      if (found !== null) {
        const s = segData[found];
        tip.show(`${s.label}: ${(s.prop * 100).toFixed(1)}%`);
        tip.move(e);
      } else {
        tip.hide();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredIdx = null;
      drawWithHighlight(null);
      tip.hide();
    });
  }
registerViz('spine', renderSpinePlot);

  // ============================================================
  // Error Bar Chart (Mean ± CI)
  // ============================================================

  function renderQQPlot(el) {
    const id = 'qq-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Q-Q图（正态性检验）';
    const rawXs = el.dataset.xs || '-1.86,-1.63,-1.33,-1.00,-0.67,-0.32,0.00,0.32,0.67,1.00,1.33,1.63,1.86';
    const rawYs = el.dataset.ys || '4.29,4.30,4.50,4.70,4.90,5.10,5.30,5.50,5.70,5.90,6.10,6.30,6.60';
    const sw = el.dataset.sw;
    const xs = rawXs.split(',').map(Number);
    const ys = rawYs.split(',').map(Number);

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="480" height="420" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;margin-top:6px;font-size:12px;color:#555;"></div>
    </div>`;

    const infoDiv = el.querySelector('div:last-child');
    if (sw) infoDiv.innerHTML = `Shapiro-Wilk W = ${parseFloat(sw).toFixed(4)}`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 480, H = 420;
    const padL = 60, padR = 20, padT = 30, padB = 50;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;

    const sx = v => padL + ((v - xMin) / xRange) * plotW;
    const sy = v => padT + plotH - ((v - yMin) / yRange) * plotH;

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 18);

    ctx.strokeStyle = '#eee'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 6; i++) {
      const x = padL + (i / 6) * plotW; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      const y = padT + (i / 6) * plotH; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

    const refMin = Math.max(xMin, yMin), refMax = Math.min(xMax, yMax);
    const x0 = sx(refMin), x1 = sx(refMax), y0 = sy(refMin), y1 = sy(refMax);
    ctx.setLineDash([6, 4]); ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    const midX = (x0 + x1) / 2, midY = (y0 + y1) / 2;
    ctx.save(); ctx.translate(midX - 30, midY - 10); ctx.rotate(-Math.PI / 4);
    ctx.fillText('理论分位数=样本分位数', 0, 0); ctx.restore();

    ctx.fillStyle = '#3498db';
    xs.forEach((xi, i) => {
      ctx.beginPath(); ctx.arc(sx(xi), sy(ys[i]), 5, 0, Math.PI * 2); ctx.fill();
    });

    const tickVals = [-2, -1, 0, 1, 2].filter(v => v >= xMin && v <= xMax);
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    tickVals.forEach(v => { ctx.fillText(v.toString(), sx(v), padT + plotH + 18); });
    ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('理论正态分位数', padL + plotW / 2, H - 6);
    ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('样本值', 0, 0); ctx.restore();

    ctx.fillStyle = '#888'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(`min=(${xMin.toFixed(2)}, ${yMin.toFixed(2)})`, padL + plotW - 5, padT + plotH - 5);
  }
  registerViz('qqplot', renderQQPlot);

  function renderBlandAltman(el) {
    const id = 'ba-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || 'Bland-Altman一致性评价';
    const rawX1 = el.dataset.x1 || '10.2,12.5,11.8,13.1,10.9,14.2,11.5,12.8,10.6,13.5';
    const rawX2 = el.dataset.x2 || '10.5,12.3,12.3,13.0,11.3,14.1,11.7,12.5,11.0,13.3';
    const x1 = rawX1.split(',').map(Number);
    const x2 = rawX2.split(',').map(Number);

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="480" height="380" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;margin-top:6px;font-size:12px;color:#555;"></div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 480, H = 380;
    const padL = 60, padR = 20, padT = 30, padB = 50;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    const means = x1.map((v, i) => (v + x2[i]) / 2);
    const diffs = x1.map((v, i) => v - x2[i]);
    const meanDiff = mean(diffs);
    const sdDiff = sd(diffs);
    const upper = meanDiff + 1.96 * sdDiff;
    const lower = meanDiff - 1.96 * sdDiff;

    const allVals = means.concat(diffs);
    const xMin = Math.min(...means), xMax = Math.max(...means);
    const yMin = Math.min(...diffs, lower), yMax = Math.max(...diffs, upper);
    const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;

    const sx = v => padL + ((v - xMin) / xRange) * plotW;
    const sy = v => padT + plotH - ((v - yMin) / yRange) * plotH;

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 18);

    ctx.strokeStyle = '#eee'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      const y = padT + (i / 5) * plotH; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

    const zeroY = sy(0);
    ctx.setLineDash([4, 3]); ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, zeroY); ctx.lineTo(padL + plotW, zeroY); ctx.stroke();
    ctx.setLineDash([]);

    const meanLineY = sy(meanDiff);
    ctx.setLineDash([6, 4]); ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, meanLineY); ctx.lineTo(padL + plotW, meanLineY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#2980b9'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Mean=${meanDiff.toFixed(2)}`, padL + plotW - 100, meanLineY - 6);

    const upperY = sy(upper), lowerY = sy(lower);
    ctx.setLineDash([6, 4]); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, upperY); ctx.lineTo(padL + plotW, upperY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL, lowerY); ctx.lineTo(padL + plotW, lowerY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#e74c3c'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`+1.96 SD=${upper.toFixed(2)}`, padL + plotW - 100, upperY - 6);
    ctx.fillText(`-1.96 SD=${lower.toFixed(2)}`, padL + plotW - 100, lowerY + 12);

    const card = canvas.parentElement;
    const tip = createTooltip(card);
    const pointData = [];

    means.forEach((m, i) => {
      const px = sx(m), py = sy(diffs[i]);
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      pointData.push({ px, py, mean: m, diff: diffs[i] });
    });

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let found = null;
      pointData.forEach((p, i) => {
        if (Math.abs(p.px - mx) < 8 && Math.abs(p.py - my) < 8) found = i;
      });
      if (found !== null) {
        const p = pointData[found];
        tip.show(`均值=${p.mean.toFixed(2)}, 差值=${p.diff.toFixed(2)}`);
        tip.move(e);
      } else {
        tip.hide();
      }
    });

    canvas.addEventListener('mouseleave', () => tip.hide());

    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('两种方法测量均值', padL + plotW / 2, H - 6);
    ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('差值 (方法1 - 方法2)', 0, 0); ctx.restore();
  }
  registerViz('blandaltman', renderBlandAltman);

  function renderStemLeaf(el) {
    const id = 'sl-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '茎叶图';
    const rawStems = el.dataset.stems || '2,3,4,5,6,7,8';
    const rawLeaves = el.dataset.leaves || '3 7,1 4 8,0 2 5 9,1 3 6,2 5 8,0 4 7,1 5';
    const stems = rawStems.split(',');
    const leafGroups = rawLeaves.split(',');

    const rows = stems.map((stem, i) => ({
      stem,
      leaves: (leafGroups[i] || '').split(' ').filter(v => v.length > 0)
    }));

    const fontSize = 13;
    const rowH = 22;
    const stemW = 35;
    const lineH = rowH;

    // Create canvas first with provisional width to get ctx for measuring
    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" style="display:block;margin:0 auto;"></canvas>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // Dynamically calculate canvas width based on longest leaf string
    let maxLeafWidth = 0;
    rows.forEach(row => {
      const leafText = row.leaves.join(' ');
      if (leafText.length > 0) {
        ctx.font = `${fontSize}px monospace`;
        maxLeafWidth = Math.max(maxLeafWidth, ctx.measureText(leafText).width);
      }
    });
    // Also measure title width to ensure it's not clipped
    ctx.font = 'bold 13px sans-serif';
    const titleWidth = ctx.measureText(title).width;

    const leafW = Math.max(maxLeafWidth + 20, 60);
    const W = Math.max(stemW + leafW + 60, titleWidth + 40);
    const H = rows.length * lineH + 60;

    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);

    const padT = 35, padL = 15;
    const sepX = padL + stemW;

    ctx.fillStyle = '#555'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('茎', padL + stemW / 2, padT - 8);
    ctx.fillText('叶', sepX + 15, padT - 8);

    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sepX, padT); ctx.lineTo(sepX, padT + rows.length * lineH); ctx.stroke();

    const leafEls = [];
    rows.forEach((row, i) => {
      const y = padT + i * lineH + lineH / 2 + 4;

      ctx.fillStyle = '#333'; ctx.font = `${fontSize}px monospace`; ctx.textAlign = 'right';
      ctx.fillText(row.stem, sepX - 8, y);

      ctx.fillStyle = '#2c5aa0'; ctx.font = `${fontSize}px monospace`; ctx.textAlign = 'left';
      ctx.fillText(row.leaves.join(' '), sepX + 8, y);

      // Precise leaf x positions using measureText
      let xCursor = sepX + 8;
      row.leaves.forEach((leaf, li) => {
        if (li > 0) xCursor += ctx.measureText(' ').width;
        const leafW = ctx.measureText(leaf).width;
        const x = xCursor + leafW / 2;
        leafEls.push({ x, y, stem: row.stem, leaf, ri: i, li });
        xCursor += leafW;
      });
    });

    const card = canvas.parentElement;
    const tip = createTooltip(card);

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let found = null;
      leafEls.forEach((l, i) => {
        if (Math.abs(l.x - mx) < 10 && Math.abs(l.y - my) < 10) found = i;
      });
      if (found !== null) {
        const l = leafEls[found];
        tip.show(`数值: ${l.stem}.${l.leaf}`);
        tip.move(e);
      } else {
        tip.hide();
      }
    });

    canvas.addEventListener('mouseleave', () => tip.hide());
  }
  registerViz('stemleaf', renderStemLeaf);
