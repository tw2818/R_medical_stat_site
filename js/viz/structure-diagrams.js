import { registerViz } from './_core.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function renderPartialCorr(el) {
  const id = 'pcorr-' + Math.random().toString(36).slice(2, 8);
  const title = escapeHtml(el.dataset.title) || '偏相关示意';
  const W = 480, H = 300;
  el.innerHTML = `<div class="viz-card"><div class="viz-header">📊 ${title}</div><canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas><div id="${id}-result" style="text-align:center;font-size:13px;margin-top:8px;"></div></div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const cx = W/2, cy = H/2 - 10;
  const r1 = 90, r2 = 90, overlap = 40;
  ctx.beginPath(); ctx.arc(cx - overlap/2, cy, r1, 0, Math.PI*2);
  ctx.fillStyle = '#2980b933'; ctx.fill(); ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + overlap/2, cy, r2, 0, Math.PI*2);
  ctx.fillStyle = '#27ae6033'; ctx.fill(); ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#2980b9'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('X', cx - overlap/2 - 50, cy + 5);
  ctx.fillStyle = '#27ae60'; ctx.fillText('Y', cx + overlap/2 + 50, cy + 5);
  ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.fillText('Z (控制)', cx, cy - r1 - 15);
  ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.fillText('r_XY(控制Z)', cx, cy + 5);
  ctx.fillStyle = '#888'; ctx.font = '11px sans-serif'; ctx.fillText('排除Z影响后X与Y的相关', cx, cy + 50);
  document.getElementById(id + '-result').innerHTML = '偏相关 r<sub>XY·Z</sub> = 控制Z后X与Y的净相关 | 例：控制年龄后，血脂与血压的净相关';
}
registerViz('partialcorr', renderPartialCorr);

function renderDendrogram(el) {
  const id = 'dendro-' + Math.random().toString(36).slice(2, 8);
  const title = escapeHtml(el.dataset.title) || '系统聚类（层次聚类）树状图';
  const W = 580, H = 300;
  el.innerHTML = `<div class="viz-card"><div class="viz-header">📊 ${title}</div><canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas><div style="text-align:center;font-size:12px;color:#666;margin-top:6px;">Ward法 + 欧氏距离 | 横轴=观测，纵轴=合并距离（相似度）</div></div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const pad = {t:20, r:30, b:40, l:50};
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const items = ['BEEF','PORK','RAMEN','SOY','FISH','MUSH','RADISH','LAMB','CHICK','TURKEY'];
  const n = items.length;
  const clr = '#7b2d8b';
  ctx.strokeStyle = clr; ctx.lineWidth = 1.5;
  const xScale = iW / (n - 1);
  const yScale = iH / 10;
  items.forEach((item, i) => {
    const x = pad.l + i * xScale;
    ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    ctx.save(); ctx.translate(x - 5, H - pad.b + 12); ctx.rotate(Math.PI/4); ctx.fillText(item, 0, 0); ctx.restore();
  });
  const treeY = (h) => pad.t + (10 - h) * yScale;
  const leafX = (i) => pad.l + i * xScale;
  const x3 = leafX(3), x4 = leafX(4); ctx.beginPath(); ctx.moveTo(x3, treeY(0)); ctx.lineTo(x3, treeY(0.5)); ctx.lineTo(x4, treeY(0.5)); ctx.lineTo(x4, treeY(0)); ctx.stroke();
  const x1 = leafX(1), x2 = leafX(2); ctx.beginPath(); ctx.moveTo(x1, treeY(0)); ctx.lineTo(x1, treeY(1.2)); ctx.lineTo(x2, treeY(1.2)); ctx.lineTo(x2, treeY(0)); ctx.stroke();
  const x6 = leafX(6), x7 = leafX(7); ctx.beginPath(); ctx.moveTo(x6, treeY(0)); ctx.lineTo(x6, treeY(1.5)); ctx.lineTo(x7, treeY(1.5)); ctx.lineTo(x7, treeY(0)); ctx.stroke();
  const x0 = leafX(0), x9 = leafX(9); ctx.beginPath(); ctx.moveTo(x0, treeY(0)); ctx.lineTo(x0, treeY(2.3)); ctx.lineTo(x9, treeY(2.3)); ctx.lineTo(x9, treeY(0)); ctx.stroke();
  const x8 = leafX(8), x68 = (x6+x7)/2; ctx.beginPath(); ctx.moveTo(x8, treeY(0)); ctx.lineTo(x8, treeY(2.8)); ctx.lineTo(x68, treeY(2.8)); ctx.lineTo(x68, treeY(1.5)); ctx.stroke();
  const x0349 = (x0+x9)/2; ctx.beginPath(); ctx.moveTo(x0349, treeY(2.3)); ctx.lineTo(x0349, treeY(4.0)); ctx.stroke();
  const x68_x8 = (x8+x68)/2; ctx.beginPath(); ctx.moveTo(x68_x8, treeY(2.8)); ctx.lineTo(x68_x8, treeY(4.0)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0349, treeY(4.0)); ctx.lineTo(x68_x8, treeY(4.0)); ctx.stroke();
  const x34 = (x3+x4)/2; ctx.beginPath(); ctx.moveTo(x34, treeY(0.5)); ctx.lineTo(x34, treeY(5.5)); ctx.stroke();
  const x12 = (x1+x2)/2; ctx.beginPath(); ctx.moveTo(x12, treeY(1.2)); ctx.lineTo(x12, treeY(5.5)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x34, treeY(5.5)); ctx.lineTo(x12, treeY(5.5)); ctx.stroke();
  const x3405 = (x0349+x68_x8)/2; ctx.beginPath(); ctx.moveTo(x3405, treeY(4.0)); ctx.lineTo(x3405, treeY(7.2)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x3405, treeY(7.2)); ctx.lineTo(x34, treeY(5.5)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x3405, treeY(7.2)); ctx.lineTo(x12, treeY(5.5)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x3405, treeY(7.2)); ctx.lineTo(x3405, treeY(9.8)); ctx.stroke();
  ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right'; [0, 2, 4, 6, 8, 10].forEach(h => { const y = treeY(Math.min(h, 10)); ctx.fillText(h.toString(), pad.l - 5, y + 4); });
}
registerViz('dendrogram', renderDendrogram);

function renderSEM(el) {
  const id = 'sem-' + Math.random().toString(36).slice(2, 8);
  const title = escapeHtml(el.dataset.title) || 'SEM 路径分析示意图';
  const w = 500, h = 300;
  el.innerHTML = `<div style="font-family:sans-serif"><div style="background:#f8f9fa;border-radius:8px;padding:15px;margin-bottom:10px"><div style="font-size:14px;font-weight:bold;color:#333;margin-bottom:8px">${title}</div><svg width="${w}" height="${h}" style="display:block;margin:0 auto"><defs><marker id="arrow${id}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#666"/></marker></defs><rect x="30" y="30" width="80" height="45" rx="5" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.5"/><text x="70" y="57" text-anchor="middle" font-size="13" fill="#333">X₁</text><rect x="30" y="130" width="80" height="45" rx="5" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.5"/><text x="70" y="157" text-anchor="middle" font-size="13" fill="#333">X₂</text><ellipse cx="220" cy="75" rx="50" ry="35" fill="#fff3e0" stroke="#f57c00" stroke-width="1.5"/><text x="220" y="80" text-anchor="middle" font-size="13" fill="#333">η₁</text><ellipse cx="220" cy="195" rx="50" ry="35" fill="#fff3e0" stroke="#f57c00" stroke-width="1.5"/><text x="220" y="200" text-anchor="middle" font-size="13" fill="#333">η₂</text><rect x="380" y="50" width="80" height="45" rx="5" fill="#e8f5e9" stroke="#388e3c" stroke-width="1.5"/><text x="420" y="77" text-anchor="middle" font-size="13" fill="#333">Y₁</text><rect x="380" y="160" width="80" height="45" rx="5" fill="#e8f5e9" stroke="#388e3c" stroke-width="1.5"/><text x="420" y="187" text-anchor="middle" font-size="13" fill="#333">Y₂</text><line x1="110" y1="75" x2="170" y2="80" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/><text x="140" y="68" text-anchor="middle" font-size="10" fill="#666">γ₁₁</text><line x1="110" y1="155" x2="170" y2="145" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/><text x="130" y="142" text-anchor="middle" font-size="10" fill="#666">γ₂₁</text><line x1="110" y1="155" x2="170" y2="205" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/><text x="130" y="195" text-anchor="middle" font-size="10" fill="#666">γ₂₂</text><line x1="270" y1="90" x2="370" y2="72" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/><text x="320" y="72" text-anchor="middle" font-size="10" fill="#666">λ₁</text><line x1="270" y1="180" x2="370" y2="182" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/><text x="320" y="192" text-anchor="middle" font-size="10" fill="#666">λ₂</text><line x1="220" y1="108" x2="220" y2="162" stroke="#666" stroke-width="1.5" marker-end="url(#arrow${id})"/><text x="240" y="138" text-anchor="middle" font-size="10" fill="#666">β₁₁</text><line x1="220" y1="228" x2="220" y2="260" stroke="#999" stroke-width="1" marker-end="url(#arrow${id})"/><text x="228" y="250" font-size="9" fill="#999">ζ₁</text><path d="M 15 52 Q 5 52 5 45" stroke="#999" stroke-width="1" fill="none" marker-end="url(#arrow${id})"/><path d="M 15 152 Q 5 152 5 145" stroke="#999" stroke-width="1" fill="none" marker-end="url(#arrow${id})"/><rect x="140" y="265" width="12" height="12" fill="#e3f2fd" stroke="#1976d2"/><text x="156" y="275" font-size="10" fill="#333">外生显变量</text><ellipse cx="213" cy="271" rx="8" ry="6" fill="#fff3e0" stroke="#f57c00"/><text x="225" y="275" font-size="10" fill="#333">内生潜变量</text><rect x="320" y="265" width="12" height="12" fill="#e8f5e9" stroke="#388e3c"/><text x="336" y="275" font-size="10" fill="#333">内生显变量</text></svg><div style="margin-top:10px;font-size:11px;color:#666"><span style="margin-right:15px">X₁,X₂: 外生显变量（自变量）</span><span style="margin-right:15px">η₁,η₂: 内生潜变量（中介/因变量）</span><span>Y₁,Y₂: 内生显变量（观测结果）</span></div></div></div>`;
}
registerViz('sem', renderSEM);

function renderAutocorrelation(el) {
  const id = 'acf-' + Math.random().toString(36).slice(2, 8);
  const title = escapeHtml(el.dataset.title) || '自相关图 (ACF/PACF)';
  const rawValues = el.dataset.values || '0.85,0.72,0.58,0.45,0.32,0.21,0.12,0.05,-0.02,-0.08,-0.14,-0.18';
  const values = rawValues.split(',').map(Number);
  const n = values.length;
  const barW = 28, padL = 40, padR = 30, padT = 40, padB = 40;
  const svgW = padL + n * (barW + 6) + padR;
  const svgH = 200;
  const maxVal = Math.max(...values.map(Math.abs), 0.5);
  const scale = (svgH - padT - padB) / 2 / maxVal;
  const centerY = padT + (svgH - padT - padB) / 2;
  el.innerHTML = `<div style="font-family:sans-serif"><div style="background:#f8f9fa;border-radius:8px;padding:12px"><div style="font-size:13px;font-weight:bold;color:#333;margin-bottom:8px">${title}</div><svg width="${svgW}" height="${svgH}" style="display:block;margin:0 auto"><line x1="${padL}" y1="${centerY - scale*1.96/Math.sqrt(30)}" x2="${svgW-padR}" y2="${centerY - scale*1.96/Math.sqrt(30)}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4,2"/><line x1="${padL}" y1="${centerY + scale*1.96/Math.sqrt(30)}" x2="${svgW-padR}" y2="${centerY + scale*1.96/Math.sqrt(30)}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4,2"/><line x1="${padL}" y1="${centerY}" x2="${svgW-padR}" y2="${centerY}" stroke="#999" stroke-width="1"/>${values.map((v, i) => { const barH = v * scale; const x = padL + i * (barW + 6); const yPos = v >= 0 ? centerY - barH : centerY; return `<rect x="${x}" y="${yPos}" width="${barW}" height="${Math.abs(barH)}" fill="${v >= 0 ? '#1976d2' : '#dc3545'}" opacity="0.8" rx="2"><title>Lag ${i}: ${v.toFixed(3)}</title></rect><text x="${x + barW/2}" y="${svgH-10}" text-anchor="middle" font-size="10" fill="#666">${i}</text>`; }).join('')}<text x="${svgW/2}" y="${svgH-2}" text-anchor="middle" font-size="11" fill="#666">滞后期 (Lag)</text><text x="12" y="${centerY}" text-anchor="middle" font-size="10" fill="#666" transform="rotate(-90,12,${centerY})">ACF</text></svg><div style="margin-top:8px;font-size:11px;color:#666;text-align:center">蓝色条形表示正自相关，红色表示负自相关；虚线为95%置信区间</div></div></div>`;
}
registerViz('autocorrelation', renderAutocorrelation);
