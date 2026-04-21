import { registerViz } from './_core.js';

// ==========================================================
// META - 统计可视化模块
// ==========================================================

// ============================================================
// META - 统计可视化模块
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
    const positiveVals = allVals.filter(v => Number.isFinite(v) && v > 0);
    const minV = Math.max(Math.min(...positiveVals) * 0.8, 0.05);
    const maxV = Math.max(...positiveVals) * 1.1;
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
registerViz('subgroupforest', renderSubgroupForest);

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
    const positiveVals = allVals.filter(v => Number.isFinite(v) && v > 0);
    const minV = Math.max(Math.min(...positiveVals) * 0.85, 0.05);
    const maxV = Math.max(...positiveVals) * 1.1;
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
registerViz('metaforest', renderMetaForest);

  function renderFunnel(el) {
    const id = 'funnel-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '漏斗图 (发表偏倚检测)';
    let effects = [0.65, 1.12, 0.88, 1.33, 0.95, 1.05, 0.78, 1.20, 0.91, 1.08, 0.72, 1.15];
    let ses = [0.18, 0.15, 0.22, 0.12, 0.19, 0.16, 0.24, 0.14, 0.20, 0.17, 0.21, 0.13];
    try {
      if (el.dataset.effects) effects = JSON.parse(el.dataset.effects);
      if (el.dataset.se) ses = JSON.parse(el.dataset.se);
    } catch (e) {
      console.warn('[stats-viz] funnel data parse failed, using fallback defaults', e);
    }
    effects = effects.filter(v => Number.isFinite(v));
    ses = ses.filter(v => Number.isFinite(v) && v > 0);
    const n = Math.min(effects.length, ses.length);
    if (n < 3) {
      el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><p style="padding:20px;color:#666;">漏斗图至少需要 3 个有效研究点。</p></div>';
      return;
    }
    effects = effects.slice(0, n);
    ses = ses.slice(0, n);
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
registerViz('funnel', renderFunnel);
