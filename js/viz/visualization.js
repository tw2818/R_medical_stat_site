import { registerViz, mean, sd, ensureJStat } from './_core.js';

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
    bins.forEach((count, i) => {
      const barH = (count / maxCount) * plotH * 0.85;
      const x = padL + (i / nbins) * plotW + (plotW / nbins) * 0.1;
      const y = padT + plotH - barH;
      ctx.fillStyle = '#3498db'; ctx.fillRect(x, y, barW, barH);
    });

    // Normal curve overlay
    ctx.beginPath();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2.5;
    const xRange = maxD - minD || 1;
    const safeMaxCount = Math.max(maxCount, 1);
    const safeBins = Math.max(nbins, 1);
    for (let px = 0; px <= plotW; px++) {
      const v = minD + (px / plotW) * xRange;
      const density = jStat.normal.pdf(v, mean, sd) * binWidth;
      const y = padT + plotH - (density / (safeMaxCount / n) / safeBins * plotH * 0.85);
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
registerViz('bar', renderBarChart);

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
registerViz('pie', renderPieChart);

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
registerViz('gauge', renderGaugeChart);

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
registerViz('spine', renderSpinePlot);

  // ============================================================
  // Error Bar Chart (Mean ± CI)
  // ============================================================
