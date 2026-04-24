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

function renderROC(el) {
  if (!ensureJStat(el)) return;
  const id = 'roc-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'ROC 曲线 & AUC';
  el.innerHTML = `<div class="viz-card"><div class="viz-header">📈 ${title}</div><canvas id="${id}" width="560" height="340" style="display:block;margin:0 auto;"></canvas><div style="text-align:center;margin-top:8px;"><span style="font-size:14px;color:#333;">AUC = <strong id="${id}-auc">0.00</strong></span><span style="margin-left:16px;font-size:13px;color:#555;">灵敏度 = <strong id="${id}-sens">--</strong></span><span style="margin-left:16px;font-size:13px;color:#555;">特异度 = <strong id="${id}-spec">--</strong></span></div><div style="text-align:center;margin-top:6px;"><span style="font-size:12px;color:#888;">点击曲线查看对应 cutoff 点的灵敏度和特异度</span></div></div>`;
  const canvas = document.getElementById(id); const ctx = canvas.getContext('2d'); const W = 560, H = 340;
  const disease = [], healthy = []; for (let i = 0; i < 60; i++) { disease.push(jStat.normal.inv(Math.random(), 0.7, 0.18)); healthy.push(jStat.normal.inv(Math.random(), 0.4, 0.15)); }
  const allVals = [...disease, ...healthy].sort((a, b) => a - b); const labels = [...Array(60).fill(1), ...Array(60).fill(0)];
  const rocPoints = []; for (let i = 0; i < allVals.length; i++) { const cutoff = allVals[i]; let tp = 0, fp = 0, tn = 0, fn = 0; for (let j = 0; j < allVals.length; j++) { if (labels[j] === 1) { if (allVals[j] >= cutoff) tp++; else fn++; } else { if (allVals[j] >= cutoff) fp++; else tn++; } } rocPoints.push({ fpr: fp / (fp + tn), tpr: tp / (tp + fn), cutoff }); }
  rocPoints.unshift({ fpr: 0, tpr: 0 }); rocPoints.push({ fpr: 1, tpr: 1 });
  let auc = 0; for (let i = 1; i < rocPoints.length; i++) auc += (rocPoints[i].fpr - rocPoints[i - 1].fpr) * (rocPoints[i].tpr + rocPoints[i - 1].tpr) / 2;
  document.getElementById(id + '-auc').textContent = auc.toFixed(3);
  const padL = 55, padR = 15, padT = 20, padB = 40; const plotW = W - padL - padR, plotH = H - padT - padB;
  ctx.clearRect(0, 0, W, H); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) { const x = padL + (i / 5) * plotW, y = padT + (i / 5) * plotH; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke(); ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke(); }
  ctx.setLineDash([5, 5]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 2.5; ctx.beginPath(); rocPoints.forEach((p, i) => { const x = padL + p.fpr * plotW, y = padT + (1 - p.tpr) * plotH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke();
  ctx.lineTo(padL + plotW, padT + plotH); ctx.lineTo(padL, padT + plotH); ctx.closePath(); ctx.fillStyle = 'rgba(41,128,185,0.1)'; ctx.fill();
  ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('1 - 特异度 (False Positive Rate)', W / 2, H - 6); ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('灵敏度 (True Positive Rate)', 0, 0); ctx.restore();
  ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; for (let i = 0; i <= 5; i++) { ctx.fillText((i / 5).toFixed(1), padL + (i / 5) * plotW, padT + plotH + 16); ctx.textAlign = 'right'; ctx.fillText((1 - i / 5).toFixed(1), padL - 6, padT + (i / 5) * plotH + 4); }
  ctx.fillStyle = '#2980b9'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('AUC = ' + auc.toFixed(3), W / 2, padT + 16);
  canvas.onclick = function(e) { const rect = canvas.getBoundingClientRect(); const mx = (e.clientX - rect.left) * (W / rect.width), my = (e.clientY - rect.top) * (H / rect.height); const fpr = (mx - padL) / plotW, tpr = 1 - (my - padT) / plotH; let best = rocPoints[0], bestD = Infinity; rocPoints.forEach(p => { const d = Math.hypot(p.fpr - fpr, p.tpr - tpr); if (d < bestD) { bestD = d; best = p; } }); if (best.cutoff !== undefined) { document.getElementById(id + '-sens').textContent = best.tpr.toFixed(3); document.getElementById(id + '-spec').textContent = (1 - best.fpr).toFixed(3); } };
}
registerViz('roc', renderROC);

function renderROCCompare(el) {
  if (!ensureJStat(el)) return;
  const id = 'roc-compare-' + Math.random().toString(36).slice(2, 8); const title = el.dataset.title || 'ROC 曲线对比'; const auc1 = parseFloat(el.dataset.auc1 || '0.82'); const auc2 = parseFloat(el.dataset.auc2 || '0.75'); const label1 = el.dataset.label1 || '模型1'; const label2 = el.dataset.label2 || '模型2';
  el.innerHTML = `<div class="viz-card"><div class="viz-header">📈 ${title}</div><canvas id="${id}" width="560" height="380" style="display:block;margin:0 auto;"></canvas><div style="text-align:center;margin-top:8px;"><span style="font-size:14px;color:#2980b9;"><strong>${label1}</strong> AUC = ${auc1.toFixed(3)}</span><span style="margin-left:24px;font-size:14px;color:#e74c3c;"><strong>${label2}</strong> AUC = ${auc2.toFixed(3)}</span></div></div>`;
  const canvas = document.getElementById(id), ctx = canvas.getContext('2d'); const W = 560, H = 380; const padL = 55, padR = 15, padT = 25, padB = 45; const plotW = W - padL - padR, plotH = H - padT - padB; ctx.clearRect(0, 0, W, H);
  function genROC(auc, n = 60) { const pts = []; const disease = [], healthy = []; const meanD = 0.7 + (auc - 0.7) * 0.8; for (let i = 0; i < n; i++) { disease.push(jStat.normal.inv(Math.random(), meanD, 0.18)); healthy.push(jStat.normal.inv(Math.random(), 0.4, 0.15)); } const allVals = [...disease, ...healthy].sort((a, b) => a - b); const labels = [...Array(n).fill(1), ...Array(n).fill(0)]; for (let i = 0; i < allVals.length; i++) { const cutoff = allVals[i]; let tp = 0, fp = 0, tn = 0, fn = 0; for (let j = 0; j < allVals.length; j++) { if (labels[j] === 1) { if (allVals[j] >= cutoff) tp++; else fn++; } else { if (allVals[j] >= cutoff) fp++; else tn++; } } pts.push({ fpr: fp / (fp + tn), tpr: tp / (tp + fn), cutoff }); } pts.unshift({ fpr: 0, tpr: 0 }); pts.push({ fpr: 1, tpr: 1 }); return pts; }
  const roc1 = genROC(auc1), roc2 = genROC(auc2);
  ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; for (let i = 0; i <= 5; i++) { const x = padL + (i / 5) * plotW, y = padT + (i / 5) * plotH; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke(); ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke(); }
  ctx.setLineDash([5, 5]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT); ctx.stroke(); ctx.setLineDash([]);
  function drawROC(pts, color, fillAlpha) { ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath(); pts.forEach((p, i) => { const x = padL + p.fpr * plotW, y = padT + (1 - p.tpr) * plotH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke(); ctx.lineTo(padL + plotW, padT + plotH); ctx.lineTo(padL, padT + plotH); ctx.closePath(); ctx.fillStyle = color.replace(')', ',' + fillAlpha + ')').replace('rgb', 'rgba'); ctx.fill(); }
  drawROC(roc1, 'rgb(41,128,185)', 0.08); drawROC(roc2, 'rgb(231,76,60)', 0.08);
  ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#2980b9'; ctx.textAlign = 'left'; ctx.fillRect(padL + 10, padT + 10, 20, 4); ctx.fillText(label1 + ' (AUC=' + auc1.toFixed(2) + ')', padL + 36, padT + 15); ctx.fillStyle = '#e74c3c'; ctx.fillRect(padL + 10, padT + 30, 20, 4); ctx.fillText(label2 + ' (AUC=' + auc2.toFixed(2) + ')', padL + 36, padT + 35);
  ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('1 - 特异度 (False Positive Rate)', W / 2, H - 8); ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('灵敏度 (True Positive Rate)', 0, 0); ctx.restore();
  ctx.font = '11px sans-serif'; for (let i = 0; i <= 5; i++) { ctx.textAlign = 'center'; ctx.fillText((i / 5).toFixed(1), padL + (i / 5) * plotW, padT + plotH + 16); ctx.textAlign = 'right'; ctx.fillText((1 - i / 5).toFixed(1), padL - 6, padT + (i / 5) * plotH + 4); }
}
registerViz('roccompare', renderROCCompare);

function renderCoxHR(el) {
  const id = 'cox-hr-' + Math.random().toString(36).slice(2, 8); const title = el.dataset.title || 'Cox 回归 HR 森林图'; const rawValues = el.dataset.values || '0.608,1.012,0.987'; const rawLabels = el.dataset.labels || 'sex (male),age,ph.karno'; const rawLower = el.dataset.lower || '0.438,0.994,0.976'; const rawUpper = el.dataset.upper || '0.845,1.031,0.998'; const rawPval = el.dataset.p || '0.003,0.188,0.023';
  const values = rawValues.split(',').map(Number), labels = rawLabels.split(','), lower = rawLower.split(',').map(Number), upper = rawUpper.split(',').map(Number), pvals = rawPval.split(',').map(Number);
  const n = values.length; const barH = 36, padL = 140, padR = 60, padT = 50, padB = 30; const rowH = barH + 8; const W = 560, H = padT + n * rowH + padB + 20;
  el.innerHTML = `<div class="viz-card"><div class="viz-header">🏥 ${title}</div><canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas><div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">垂直虚线 HR=1 表示无效线 | ● 表示点估计值 | 误差线为 95% CI</div></div>`;
  const canvas = document.getElementById(id), ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 22);
  const logVals = values.concat(lower).concat(upper).map(v => Math.log(v)), minLog = Math.min(...logVals) - 0.5, maxLog = Math.max(...logVals) + 0.3, scaleX = v => padL + ((Math.log(v) - minLog) / (maxLog - minLog)) * (W - padL - padR);
  const refX = scaleX(1); ctx.setLineDash([4, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(refX, padT); ctx.lineTo(refX, H - padB); ctx.stroke(); ctx.setLineDash([]);
  values.forEach((hr, i) => { const y = padT + i * rowH + barH / 2, x = scaleX(hr), xLow = scaleX(Math.max(lower[i], Math.pow(10, minLog))), xHigh = scaleX(Math.min(upper[i], Math.pow(10, maxLog))), sig = lower[i] > 1 || upper[i] < 1, pText = pvals[i] < 0.001 ? 'p<0.001' : 'p=' + pvals[i].toFixed(3); ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(labels[i] || ('V' + (i + 1)), padL - 8, y + 4); ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xLow, y); ctx.lineTo(xHigh, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(xLow, y - 5); ctx.lineTo(xLow, y + 5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(xHigh, y - 5); ctx.lineTo(xHigh, y + 5); ctx.stroke(); ctx.fillStyle = sig ? '#e74c3c' : '#3498db'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#333'; ctx.font = '12px monospace'; ctx.textAlign = 'left'; ctx.fillText('HR=' + hr.toFixed(3) + ' (' + pText + ')', x + 8, y + 4); });
  const logTicks = [0.2, 0.5, 1, 2, 5]; ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; logTicks.filter(v => v >= Math.pow(10, minLog) && v <= Math.pow(10, maxLog)).forEach(v => { ctx.fillText(v.toString(), scaleX(v), H - 10); });
  ctx.save(); ctx.translate(14, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = '#666'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Hazard Ratio (log scale)', 0, 0); ctx.restore();
}
registerViz('cox', renderCoxHR);

function renderNomogram(el) {
  const id = 'nom-' + Math.random().toString(36).slice(2, 8); const title = el.dataset.title || '列线图 (Nomogram) 示例'; const svgW = 540, svgH = 260; const pointsMax = 100; const padL = 60, padR = 60, padT = 30; const scaleH = 180;
  const vars = [{ name: '年龄', unit: '岁', min: 20, max: 80, points: pointsMax, tickStep: 20 }, { name: '血压', unit: 'mmHg', min: 90, max: 200, points: pointsMax, tickStep: 22 }, { name: '胆固醇', unit: 'mmol/L', min: 3, max: 8, points: pointsMax, tickStep: 1 }];
  const totalWidth = svgW - padL - padR, varWidth = totalWidth / vars.length, scaleTop = padT + 30, scaleBottom = scaleTop + scaleH, varPositions = vars.map((v, i) => padL + i * varWidth + varWidth / 2);
  el.innerHTML = `<div style="font-family:sans-serif"><div style="background:#f8f9fa;border-radius:8px;padding:12px"><div style="font-size:13px;font-weight:bold;color:#333;margin-bottom:8px">${title}</div><svg width="${svgW}" height="${svgH}" style="display:block;margin:0 auto"><style>.nom-text { font-size:11px fill:#333 }.nom-label { font-size:10px fill:#666 }.nom-tick { font-size:9px fill:#999 }</style>${vars.map((v, i) => `<text x="${varPositions[i]}" y="${scaleTop - 10}" text-anchor="middle" class="nom-text" font-weight="bold">${v.name}</text><text x="${varPositions[i]}" y="${scaleTop - 22}" text-anchor="middle" class="nom-label">(${v.unit})</text>`).join('')}<line x1="${padL}" y1="${scaleTop}" x2="${padL}" y2="${scaleBottom}" stroke="#333" stroke-width="2"/><line x1="${padL - 5}" y1="${scaleTop}" x2="${padL + 5}" y2="${scaleTop}" stroke="#333" stroke-width="1.5"/><line x1="${padL - 5}" y1="${scaleBottom}" x2="${padL + 5}" y2="${scaleBottom}" stroke="#333" stroke-width="1.5"/><line x1="${padL - 5}" y1="${scaleTop + scaleH/2}" x2="${padL + 5}" y2="${scaleTop + scaleH/2}" stroke="#333" stroke-width="1"/><text x="${padL - 8}" y="${scaleTop + 4}" text-anchor="end" class="nom-tick">0</text><text x="${padL - 8}" y="${scaleBottom + 4}" text-anchor="end" class="nom-tick">${pointsMax * 3}</text><text x="${padL - 8}" y="${scaleTop + scaleH/2 + 4}" text-anchor="end" class="nom-tick">${pointsMax * 1.5}</text><text x="${padL + 10}" y="${scaleTop - 5}" class="nom-label">总分</text>${vars.map((v, i) => { const x = varPositions[i]; const ticks = []; for (let val = v.min; val <= v.max; val += v.tickStep) { const ratio = (val - v.min) / (v.max - v.min); const y = scaleBottom - ratio * scaleH; const isMajor = val === v.min || val === v.max || val === (v.min + v.max) / 2; ticks.push(`<line x1="${x - (isMajor ? 8 : 5)}" y1="${y}" x2="${x + (isMajor ? 8 : 5)}" y2="${y}" stroke="#666" stroke-width="${isMajor ? 1.5 : 1}"/><text x="${x + 12}" y="${y + 4}" class="nom-tick">${val}</text>`); } return `<line x1="${x}" y1="${scaleTop}" x2="${x}" y2="${scaleBottom}" stroke="#666" stroke-width="1"/>${ticks.join('')}`; }).join('')}<line x1="${varPositions[0]}" y1="${scaleTop + scaleH * 0.6}" x2="${varPositions[1]}" y2="${scaleTop + scaleH * 0.4}" stroke="#bbb" stroke-width="1" stroke-dasharray="3,2"/><line x1="${varPositions[1]}" y1="${scaleTop + scaleH * 0.4}" x2="${varPositions[2]}" y2="${scaleTop + scaleH * 0.5}" stroke="#bbb" stroke-width="1" stroke-dasharray="3,2"/><line x1="${varPositions[2]}" y1="${scaleTop + scaleH * 0.5}" x2="${padL}" y2="${scaleTop + scaleH * 0.8}" stroke="#bbb" stroke-width="1" stroke-dasharray="3,2"/><line x1="${svgW - padR}" y1="${scaleTop}" x2="${svgW - padR}" y2="${scaleBottom}" stroke="#333" stroke-width="2"/><text x="${svgW - padR + 8}" y="${scaleTop - 5}" class="nom-label">风险概率</text><text x="${svgW - padR + 8}" y="${scaleTop + 4}" class="nom-tick">0.1</text><text x="${svgW - padR + 8}" y="${scaleTop + scaleH * 0.33 + 4}" class="nom-tick">0.3</text><text x="${svgW - padR + 8}" y="${scaleTop + scaleH * 0.67 + 4}" class="nom-tick">0.6</text><text x="${svgW - padR + 8}" y="${scaleBottom + 4}" class="nom-tick">0.9</text><line x1="${svgW - padR - 5}" y1="${scaleTop}" x2="${svgW - padR + 5}" y2="${scaleTop}" stroke="#333"/><line x1="${svgW - padR - 5}" y1="${scaleBottom}" x2="${svgW - padR + 5}" y2="${scaleBottom}" stroke="#333"/><line x1="${svgW - padR - 5}" y1="${scaleTop + scaleH/2}" x2="${svgW - padR + 5}" y2="${scaleTop + scaleH/2}" stroke="#333"/><line x1="${padL}" y1="${scaleTop + scaleH * 0.5}" x2="${svgW - padR}" y2="${scaleTop + scaleH * 0.33}" stroke="#d32f2f" stroke-width="2"/></svg><div style="margin-top:8px;font-size:11px;color:#666;text-align:center">示意列线图：各变量取值映射到顶部总分尺，通过总分在风险尺上读取预测概率</div></div></div>`;
}
registerViz('nomogram', renderNomogram);
