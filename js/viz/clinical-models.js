import { registerViz, ensureJStat } from './_core.js';

function renderLogisticOR(el) {
  const id = 'logistic-or-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'Logistic 回归 OR 森林图';
  const rawData = el.dataset.values || '2.35,1.61,31.26,3.16,2.36,2.09,50.43,0.97,0.68,11.74';
  const rawLabels = el.dataset.labels || 'x12,x13,x14,x21,x31,x41,x51,x61,x72,x73,x81';
  const rawLower = el.dataset.lower || '0.13,0.08,0.79,0.52,0.58,0.19,0.31,3.78,0.09,0.02,1.67';
  const rawUpper = el.dataset.upper || '81.86,59.46,4201.19,22.19,67.03,44.76,15.26,9.25,15.26,148.02';
  const values = rawData.split(',').map(Number);
  const labels = rawLabels.split(',');
  const lower = rawLower.split(',').map(Number);
  const upper = rawUpper.split(',').map(Number);
  const n = values.length;
  const barH = 36, padL = 120, padR = 60, padT = 50, padB = 30;
  const rowH = barH + 8;
  const W = 560, H = padT + n * rowH + padB + 20;
  el.innerHTML = `<div class="viz-card"><div class="viz-header">📊 ${title}</div><canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas><div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">垂直虚线 OR=1 表示无效线 | 误差线为 95% CI</div></div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 22);
  const logVals = values.concat(lower).concat(upper).map(v => Math.log(v));
  const minLog = Math.min(...logVals) - 0.5;
  const maxLog = Math.max(...logVals) + 0.5;
  const scaleX = v => padL + ((Math.log(v) - minLog) / (maxLog - minLog)) * (W - padL - padR);
  const refX = scaleX(1);
  ctx.setLineDash([4, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(refX, padT); ctx.lineTo(refX, H - padB); ctx.stroke(); ctx.setLineDash([]);
  values.forEach((or, i) => {
    const y = padT + i * rowH + barH / 2;
    const x = scaleX(or), xLow = scaleX(Math.max(lower[i], Math.pow(10, minLog))), xHigh = scaleX(Math.min(upper[i], Math.pow(10, maxLog)));
    ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(labels[i] || ('V' + (i + 1)), padL - 8, y + 4);
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xLow, y); ctx.lineTo(xHigh, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xLow, y - 5); ctx.lineTo(xLow, y + 5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(xHigh, y - 5); ctx.lineTo(xHigh, y + 5); ctx.stroke();
    const sig = lower[i] > 1 || upper[i] < 1 ? '#e74c3c' : '#3498db'; ctx.fillStyle = sig; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333'; ctx.font = '12px monospace'; ctx.textAlign = 'left'; ctx.fillText(or.toFixed(2), x + 8, y + 4);
  });
  const logTicks = [0.1, 0.5, 1, 5, 10, 50, 500];
  ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  logTicks.filter(v => v >= Math.pow(10, minLog) && v <= Math.pow(10, maxLog)).forEach(v => { ctx.fillText(v.toString(), scaleX(v), H - 10); ctx.beginPath(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.5; ctx.moveTo(scaleX(v), padT); ctx.lineTo(scaleX(v), H - padB); ctx.stroke(); });
  ctx.save(); ctx.translate(14, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = '#666'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Odds Ratio (log scale)', 0, 0); ctx.restore();
}
registerViz('logistic', renderLogisticOR);

function makeRocPoints(disease, healthy) {
  const pairs = disease.map(v => ({ score: v, label: 1 }))
    .concat(healthy.map(v => ({ score: v, label: 0 })));
  const thresholds = [...new Set(pairs.map(p => p.score))].sort((a, b) => b - a);
  const points = [{ fpr: 0, tpr: 0 }];
  thresholds.forEach(cutoff => {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    pairs.forEach(({ score, label }) => {
      const positive = score >= cutoff;
      if (label === 1 && positive) tp += 1;
      else if (label === 1 && !positive) fn += 1;
      else if (label === 0 && positive) fp += 1;
      else tn += 1;
    });
    points.push({
      fpr: fp / (fp + tn || 1),
      tpr: tp / (tp + fn || 1),
      cutoff,
    });
  });
  points.push({ fpr: 1, tpr: 1 });
  return points.sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
}

function computeAuc(points) {
  let auc = 0;
  for (let i = 1; i < points.length; i += 1) {
    auc += (points[i].fpr - points[i - 1].fpr) * (points[i].tpr + points[i - 1].tpr) / 2;
  }
  return Math.max(0, Math.min(1, auc));
}

function drawRocAxes(ctx, W, H, padL, padR, padT, padB) {
  const plotW = W - padL - padR, plotH = H - padT - padB;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const x = padL + (i / 5) * plotW, y = padT + (i / 5) * plotH;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
  }
  ctx.setLineDash([5, 5]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('1 - 特异度 (False Positive Rate)', W / 2, H - 6);
  ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('灵敏度 (True Positive Rate)', 0, 0); ctx.restore();
  ctx.font = '11px sans-serif';
  for (let i = 0; i <= 5; i += 1) {
    ctx.textAlign = 'center';
    ctx.fillText((i / 5).toFixed(1), padL + (i / 5) * plotW, padT + plotH + 16);
    ctx.textAlign = 'right';
    ctx.fillText((1 - i / 5).toFixed(1), padL - 6, padT + (i / 5) * plotH + 4);
  }
  return { plotW, plotH };
}

function drawRocCurve(ctx, points, color, fillAlpha, padL, padT, plotW, plotH) {
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
  points.forEach((p, i) => {
    const x = padL + p.fpr * plotW, y = padT + (1 - p.tpr) * plotH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.lineTo(padL + plotW, padT + plotH); ctx.lineTo(padL, padT + plotH); ctx.closePath();
  ctx.fillStyle = color.replace(')', ',' + fillAlpha + ')').replace('rgb', 'rgba'); ctx.fill();
}

function renderROC(el) {
  if (!ensureJStat(el)) return;
  const id = 'roc-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'ROC 曲线 & AUC';
  const W = 560, H = 340;
  el.innerHTML = `<div class="viz-card"><div class="viz-header">📈 ${title}</div><canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas><div style="text-align:center;margin-top:8px;"><span style="font-size:14px;color:#333;">AUC = <strong id="${id}-auc">0.00</strong></span><span style="margin-left:16px;font-size:13px;color:#555;">灵敏度 = <strong id="${id}-sens">--</strong></span><span style="margin-left:16px;font-size:13px;color:#555;">特异度 = <strong id="${id}-spec">--</strong></span></div><div style="text-align:center;margin-top:6px;"><span style="font-size:12px;color:#888;">点击曲线查看对应 cutoff 点的灵敏度和特异度</span></div></div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const disease = [], healthy = [];
  for (let i = 0; i < 60; i += 1) {
    disease.push(jStat.normal.inv(Math.random(), 0.7, 0.18));
    healthy.push(jStat.normal.inv(Math.random(), 0.4, 0.15));
  }
  const rocPoints = makeRocPoints(disease, healthy);
  const auc = computeAuc(rocPoints);
  document.getElementById(id + '-auc').textContent = auc.toFixed(3);
  const padL = 55, padR = 15, padT = 20, padB = 40;
  const { plotW, plotH } = drawRocAxes(ctx, W, H, padL, padR, padT, padB);
  drawRocCurve(ctx, rocPoints, 'rgb(41,128,185)', 0.1, padL, padT, plotW, plotH);
  ctx.fillStyle = '#2980b9'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('AUC = ' + auc.toFixed(3), W / 2, padT + 16);
  canvas.onclick = function(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width), my = (e.clientY - rect.top) * (H / rect.height);
    const fpr = (mx - padL) / plotW, tpr = 1 - (my - padT) / plotH;
    let best = rocPoints[0], bestD = Infinity;
    rocPoints.forEach(point => {
      if (point.cutoff === undefined) return;
      const d = Math.hypot(point.fpr - fpr, point.tpr - tpr);
      if (d < bestD) { bestD = d; best = point; }
    });
    if (best.cutoff !== undefined) {
      document.getElementById(id + '-sens').textContent = best.tpr.toFixed(3);
      document.getElementById(id + '-spec').textContent = (1 - best.fpr).toFixed(3);
    }
  };
}
registerViz('roc', renderROC);

function renderROCCompare(el) {
  if (!ensureJStat(el)) return;
  const id = 'roc-compare-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'ROC 曲线对比';
  const auc1 = parseFloat(el.dataset.auc1 || '0.82');
  const auc2 = parseFloat(el.dataset.auc2 || '0.75');
  const label1 = el.dataset.label1 || '模型1';
  const label2 = el.dataset.label2 || '模型2';
  const W = 560, H = 380;
  el.innerHTML = `<div class="viz-card"><div class="viz-header">📈 ${title}</div><canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas><div style="text-align:center;margin-top:8px;"><span style="font-size:14px;color:#2980b9;"><strong>${label1}</strong> AUC ≈ <span id="${id}-auc1">--</span></span><span style="margin-left:24px;font-size:14px;color:#e74c3c;"><strong>${label2}</strong> AUC ≈ <span id="${id}-auc2">--</span></span></div></div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const padL = 55, padR = 15, padT = 25, padB = 45;
  function genROC(targetAuc, n = 60) {
    const disease = [], healthy = [];
    const meanD = 0.62 + (targetAuc - 0.65) * 0.9;
    for (let i = 0; i < n; i += 1) {
      disease.push(jStat.normal.inv(Math.random(), meanD, 0.18));
      healthy.push(jStat.normal.inv(Math.random(), 0.4, 0.15));
    }
    return makeRocPoints(disease, healthy);
  }
  const roc1 = genROC(auc1), roc2 = genROC(auc2);
  const actualAuc1 = computeAuc(roc1);
  const actualAuc2 = computeAuc(roc2);
  document.getElementById(id + '-auc1').textContent = actualAuc1.toFixed(3);
  document.getElementById(id + '-auc2').textContent = actualAuc2.toFixed(3);
  const { plotW, plotH } = drawRocAxes(ctx, W, H, padL, padR, padT, padB);
  drawRocCurve(ctx, roc1, 'rgb(41,128,185)', 0.08, padL, padT, plotW, plotH);
  drawRocCurve(ctx, roc2, 'rgb(231,76,60)', 0.08, padL, padT, plotW, plotH);
  ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#2980b9'; ctx.textAlign = 'left';
  ctx.fillRect(padL + 10, padT + 10, 20, 4);
  ctx.fillText(label1 + ' (AUC≈' + actualAuc1.toFixed(2) + ')', padL + 36, padT + 15);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(padL + 10, padT + 30, 20, 4);
  ctx.fillText(label2 + ' (AUC≈' + actualAuc2.toFixed(2) + ')', padL + 36, padT + 35);
}
registerViz('roccompare', renderROCCompare);

let coxHrCounter = 0;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function parseCoxNumberList(raw, fallback) {
  return String(raw || fallback).split(',').map((item) => Number(item.trim()));
}

function renderCoxError(el, message) {
  el.innerHTML = `<div class="viz-error"><strong>Cox HR 森林图数据错误</strong><br>${escapeHtml(message)}</div>`;
}

function validateCoxRows(values, lower, upper, pvals) {
  const sameLength = values.length === lower.length && values.length === upper.length && values.length === pvals.length;
  if (!sameLength || values.length === 0) return 'values/lower/upper/pvals must have the same length';
  const effectNumbers = values.concat(lower).concat(upper);
  if (!effectNumbers.every((value) => Number.isFinite(value) && value > 0)) return 'HR and 95% CI values must be finite positive numbers';
  if (!pvals.every((value) => Number.isFinite(value) && value >= 0)) return 'p values must be finite non-negative numbers';
  if (!values.every((value, index) => lower[index] <= value && value <= upper[index])) return 'each HR must fall within its 95% CI';
  return '';
}

function renderCoxHR(el) {
  coxHrCounter += 1;
  const id = 'cox-hr-' + coxHrCounter;
  const title = el.dataset.title || 'Cox 回归 HR 森林图';
  const rawLabels = el.dataset.labels || 'sex male vs female,age per year,ph.karno per point';
  const values = parseCoxNumberList(el.dataset.values, '0.6082,1.0125,0.9868');
  const labels = rawLabels.split(',').map((item) => item.trim());
  const lower = parseCoxNumberList(el.dataset.lower, '0.4378,0.9940,0.9755');
  const upper = parseCoxNumberList(el.dataset.upper, '0.8450,1.0313,0.9982');
  const pvals = parseCoxNumberList(el.dataset.p, '0.00303,0.18821,0.02348');
  const validationError = validateCoxRows(values, lower, upper, pvals);
  if (validationError) {
    renderCoxError(el, validationError);
    return;
  }

  const n = values.length;
  const barH = 36, padL = 170, padR = 245, padT = 52, padB = 34;
  const rowH = barH + 8;
  const W = 760, H = padT + n * rowH + padB + 24;
  const safeTitle = escapeHtml(title);
  const ariaLabel = `${title}: ${values.map((hr, i) => `${labels[i] || 'V' + (i + 1)} HR=${hr.toFixed(3)} 95% CI ${lower[i].toFixed(3)}–${upper[i].toFixed(3)} p=${pvals[i].toPrecision(3)}`).join('; ')}`;
  el.innerHTML = `<div class="viz-card"><div class="viz-header">🏥 ${safeTitle}</div><canvas id="${id}" width="${W}" height="${H}" role="img" aria-label="${escapeHtml(ariaLabel)}" style="width:100%;max-width:${W}px;height:auto;display:block;margin:0 auto;"></canvas><div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">垂直虚线 HR=1 表示无效线 | ● 表示点估计值 | 误差线为 95% CI | Female 为 sex 变量参考组</div><table aria-label="${safeTitle} 数据表" style="position:absolute;left:-9999px;"><thead><tr><th>Variable</th><th>HR</th><th>95% CI</th><th>p</th></tr></thead><tbody>${values.map((hr, i) => `<tr><td>${escapeHtml(labels[i] || 'V' + (i + 1))}</td><td>${hr.toFixed(3)}</td><td>${lower[i].toFixed(3)}–${upper[i].toFixed(3)}</td><td>${pvals[i].toPrecision(3)}</td></tr>`).join('')}</tbody></table></div>`;

  const canvas = document.getElementById(id), ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 22);

  const logVals = values.concat(lower).concat(upper).map((value) => Math.log(value));
  const minLog = Math.min(...logVals) - 0.5;
  const maxLog = Math.max(...logVals) + 0.5;
  const minBound = Math.exp(minLog);
  const maxBound = Math.exp(maxLog);
  const plotW = W - padL - padR;
  const scaleX = (value) => padL + ((Math.log(value) - minLog) / (maxLog - minLog)) * plotW;

  const logTicks = [0.2, 0.5, 1, 2, 5];
  ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  logTicks.filter((value) => value >= minBound && value <= maxBound).forEach((value) => {
    const tickX = scaleX(value);
    ctx.beginPath(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.5; ctx.moveTo(tickX, padT); ctx.lineTo(tickX, H - padB); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.fillText(value.toString(), tickX, H - 12);
  });

  const refX = scaleX(1);
  ctx.setLineDash([4, 4]); ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(refX, padT); ctx.lineTo(refX, H - padB); ctx.stroke(); ctx.setLineDash([]);

  values.forEach((hr, i) => {
    const y = padT + i * rowH + barH / 2;
    const x = scaleX(hr);
    const xLow = scaleX(Math.max(lower[i], minBound));
    const xHigh = scaleX(Math.min(upper[i], maxBound));
    const sig = lower[i] > 1 || upper[i] < 1;
    const pText = pvals[i] < 0.001 ? 'p<0.001' : 'p=' + pvals[i].toFixed(3);
    const label = labels[i] || ('V' + (i + 1));

    ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right';
    const labelText = label.length > 22 ? label.slice(0, 20) + '…' : label;
    ctx.fillText(labelText, padL - 8, y + 4);

    ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xLow, y); ctx.lineTo(xHigh, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xLow, y - 5); ctx.lineTo(xLow, y + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xHigh, y - 5); ctx.lineTo(xHigh, y + 5); ctx.stroke();

    ctx.fillStyle = sig ? '#e74c3c' : '#3498db';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();

    const annotation = `HR=${hr.toFixed(3)} (95% CI ${lower[i].toFixed(3)}–${upper[i].toFixed(3)}), ${pText}`;
    const annotationX = W - padR + 12;
    ctx.fillStyle = '#333'; ctx.font = '12px monospace'; ctx.textAlign = 'left';
    if (ctx.measureText(annotation).width + annotationX > W - 8) {
      ctx.textAlign = 'right';
      ctx.fillText(annotation, W - 8, y + 4);
    } else {
      ctx.fillText(annotation, annotationX, y + 4);
    }
  });

  ctx.fillStyle = '#666'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Hazard Ratio (log scale)', padL + plotW / 2, H - 2);
}
registerViz('cox', renderCoxHR);

function renderNomogram(el) {
  const id = 'nom-' + Math.random().toString(36).slice(2, 8); const title = el.dataset.title || '列线图 (Nomogram) 示例'; const svgW = 540, svgH = 260; const pointsMax = 100; const padL = 60, padR = 60, padT = 30; const scaleH = 180;
  const vars = [{ name: '年龄', unit: '岁', min: 20, max: 80, points: pointsMax, tickStep: 20 }, { name: '血压', unit: 'mmHg', min: 90, max: 200, points: pointsMax, tickStep: 22 }, { name: '胆固醇', unit: 'mmol/L', min: 3, max: 8, points: pointsMax, tickStep: 1 }];
  const totalWidth = svgW - padL - padR, varWidth = totalWidth / vars.length, scaleTop = padT + 30, scaleBottom = scaleTop + scaleH, varPositions = vars.map((v, i) => padL + i * varWidth + varWidth / 2);
  el.innerHTML = `<div style="font-family:sans-serif"><div style="background:#f8f9fa;border-radius:8px;padding:12px"><div style="font-size:13px;font-weight:bold;color:#333;margin-bottom:8px">${title}</div><svg width="${svgW}" height="${svgH}" style="display:block;margin:0 auto"><style>.nom-text { font-size:11px fill:#333 }.nom-label { font-size:10px fill:#666 }.nom-tick { font-size:9px fill:#999 }</style>${vars.map((v, i) => `<text x="${varPositions[i]}" y="${scaleTop - 10}" text-anchor="middle" class="nom-text" font-weight="bold">${v.name}</text><text x="${varPositions[i]}" y="${scaleTop - 22}" text-anchor="middle" class="nom-label">(${v.unit})</text>`).join('')}<line x1="${padL}" y1="${scaleTop}" x2="${padL}" y2="${scaleBottom}" stroke="#333" stroke-width="2"/><line x1="${padL - 5}" y1="${scaleTop}" x2="${padL + 5}" y2="${scaleTop}" stroke="#333" stroke-width="1.5"/><line x1="${padL - 5}" y1="${scaleBottom}" x2="${padL + 5}" y2="${scaleBottom}" stroke="#333" stroke-width="1.5"/><line x1="${padL - 5}" y1="${scaleTop + scaleH/2}" x2="${padL + 5}" y2="${scaleTop + scaleH/2}" stroke="#333" stroke-width="1"/><text x="${padL - 8}" y="${scaleTop + 4}" text-anchor="end" class="nom-tick">0</text><text x="${padL - 8}" y="${scaleBottom + 4}" text-anchor="end" class="nom-tick">${pointsMax * 3}</text><text x="${padL - 8}" y="${scaleTop + scaleH/2 + 4}" text-anchor="end" class="nom-tick">${pointsMax * 1.5}</text><text x="${padL + 10}" y="${scaleTop - 5}" class="nom-label">总分</text>${vars.map((v, i) => { const x = varPositions[i]; const ticks = []; for (let val = v.min; val <= v.max; val += v.tickStep) { const ratio = (val - v.min) / (v.max - v.min); const y = scaleBottom - ratio * scaleH; const isMajor = val === v.min || val === v.max || val === (v.min + v.max) / 2; ticks.push(`<line x1="${x - (isMajor ? 8 : 5)}" y1="${y}" x2="${x + (isMajor ? 8 : 5)}" y2="${y}" stroke="#666" stroke-width="${isMajor ? 1.5 : 1}"/><text x="${x + 12}" y="${y + 4}" class="nom-tick">${val}</text>`); } return `<line x1="${x}" y1="${scaleTop}" x2="${x}" y2="${scaleBottom}" stroke="#666" stroke-width="1"/>${ticks.join('')}`; }).join('')}<line x1="${varPositions[0]}" y1="${scaleTop + scaleH * 0.6}" x2="${varPositions[1]}" y2="${scaleTop + scaleH * 0.4}" stroke="#bbb" stroke-width="1" stroke-dasharray="3,2"/><line x1="${varPositions[1]}" y1="${scaleTop + scaleH * 0.4}" x2="${varPositions[2]}" y2="${scaleTop + scaleH * 0.5}" stroke="#bbb" stroke-width="1" stroke-dasharray="3,2"/><line x1="${varPositions[2]}" y1="${scaleTop + scaleH * 0.5}" x2="${padL}" y2="${scaleTop + scaleH * 0.8}" stroke="#bbb" stroke-width="1" stroke-dasharray="3,2"/><line x1="${svgW - padR}" y1="${scaleTop}" x2="${svgW - padR}" y2="${scaleBottom}" stroke="#333" stroke-width="2"/><text x="${svgW - padR + 8}" y="${scaleTop - 5}" class="nom-label">风险概率</text><text x="${svgW - padR + 8}" y="${scaleTop + 4}" class="nom-tick">0.1</text><text x="${svgW - padR + 8}" y="${scaleTop + scaleH * 0.33 + 4}" class="nom-tick">0.3</text><text x="${svgW - padR + 8}" y="${scaleTop + scaleH * 0.67 + 4}" class="nom-tick">0.6</text><text x="${svgW - padR + 8}" y="${scaleBottom + 4}" class="nom-tick">0.9</text><line x1="${svgW - padR - 5}" y1="${scaleTop}" x2="${svgW - padR + 5}" y2="${scaleTop}" stroke="#333"/><line x1="${svgW - padR - 5}" y1="${scaleBottom}" x2="${svgW - padR + 5}" y2="${scaleBottom}" stroke="#333"/><line x1="${svgW - padR - 5}" y1="${scaleTop + scaleH/2}" x2="${svgW - padR + 5}" y2="${scaleTop + scaleH/2}" stroke="#333"/><line x1="${padL}" y1="${scaleTop + scaleH * 0.5}" x2="${svgW - padR}" y2="${scaleTop + scaleH * 0.33}" stroke="#d32f2f" stroke-width="2"/></svg><div style="margin-top:8px;font-size:11px;color:#666;text-align:center">示意列线图：各变量取值映射到顶部总分尺，通过总分在风险尺上读取预测概率</div></div></div>`;
}
registerViz('nomogram', renderNomogram);
