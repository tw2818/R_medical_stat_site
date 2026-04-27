import { registerViz, createTooltip } from './_core.js';

function renderWilcoxonSignedRank(el) {
  const id = 'wcx-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'Wilcoxon 符号秩检验';
  const test1 = [60,142,195,80,242,220,190,25,198,38,236,95];
  const test2 = [76,152,243,82,240,220,205,38,243,44,190,100];
  const diffs = test1.map((v,i) => v - test2[i]);
  const W = 640, H = 300;
  el.innerHTML = `<div class="viz-card">
    <div class="viz-header">📊 ${title}</div>
    <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
    <div id="${id}-result" style="text-align:center;font-size:13px;margin-top:8px;color:#333;"></div>
  </div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const pad = {t: 30, r: 20, b: 50, l: 50};
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  const indexed = diffs.map((d, i) => ({d, abs: Math.abs(d), i}))
    .filter(x => x.abs > 0)
    .sort((a, b) => a.abs - b.abs);

  let rank = 1;
  for (let i = 0; i < indexed.length; i++) {
    if (!(i > 0 && indexed[i].abs === indexed[i-1].abs)) rank = i + 1;
    indexed[i].rank = rank;
  }
  for (let i = 0; i < indexed.length; i++) {
    let j = i;
    while (j < indexed.length && indexed[j].abs === indexed[i].abs) j++;
    if (j - i > 1) {
      const avgRank = indexed.slice(i, j).reduce((s,_,k) => s + (i+1+k), 0) / (j - i);
      for (let k = i; k < j; k++) indexed[k].rank = avgRank;
      i = j - 1;
    }
  }

  const maxAbs = Math.max(...indexed.map(x => x.abs));
  const n = indexed.length;
  const barW = Math.min(40, (iW / n) * 0.7);
  const gap = (iW - barW * n) / (n + 1);

  const barData = indexed.map((item, idx) => {
    const x = pad.l + gap + idx * (barW + gap);
    const barH = (item.abs / maxAbs) * iH * 0.85;
    const barY = item.d > 0 ? H - pad.b - barH : H - pad.b;
    return { x, barW, barH, barY, item, idx };
  });

  const card = canvas.parentElement;
  const tip = createTooltip(card);

  function drawChart(hlIndex) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(pad.l, pad.t, iW, iH);
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H-pad.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l, H-pad.b); ctx.lineTo(W-pad.r, H-pad.b); ctx.stroke();
    const yTicks = 5;
    for (let y = 0; y <= yTicks; y++) {
      const yVal = (maxAbs * y / yTicks).toFixed(0);
      const yPx = H - pad.b - (y / yTicks) * iH;
      ctx.strokeStyle = '#ddd'; ctx.setLineDash([2,2]);
      ctx.beginPath(); ctx.moveTo(pad.l, yPx); ctx.lineTo(W-pad.r, yPx); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(yVal, pad.l - 5, yPx + 4);
    }
    barData.forEach((bar, idx) => {
      const isHl = idx === hlIndex;
      const baseColor = bar.item.d > 0 ? '#2980b9' : '#c0392b';
      const hlColor = bar.item.d > 0 ? '#4da6ff' : '#e74c3c';
      ctx.fillStyle = isHl ? hlColor : baseColor;
      ctx.fillRect(bar.x, bar.barY, bar.barW, bar.barH);
      ctx.fillStyle = '#222'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('T=' + bar.item.rank.toFixed(0), bar.x + bar.barW/2, bar.item.d > 0 ? bar.barY - 4 : bar.barY + bar.barH + 14);
      ctx.fillStyle = '#555'; ctx.font = '10px sans-serif';
      ctx.fillText(bar.item.d.toFixed(0), bar.x + bar.barW/2, bar.item.d > 0 ? bar.barY + 14 : bar.barY - 4);
    });
  }

  drawChart(-1);

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found = -1;
    for (let i = 0; i < barData.length; i++) {
      const bar = barData[i];
      if (mx >= bar.x && mx <= bar.x + bar.barW && my >= bar.barY && my <= bar.barY + bar.barH) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      const bar = barData[found];
      const text = `配对 #${found+1} | test1=${test1[bar.item.i]} test2=${test2[bar.item.i]} | 差值=${bar.item.d} | |差值|=${bar.item.abs.toFixed(1)} | 秩=${bar.item.rank.toFixed(1)}`;
      tip.show(text);
      tip.move(e);
      drawChart(found);
    } else {
      tip.hide();
      drawChart(-1);
    }
  });

  const Wpos = indexed.filter(x => x.d > 0).reduce((s, x) => s + x.rank, 0);
  const Wneg = indexed.filter(x => x.d < 0).reduce((s, x) => s + x.rank, 0);
  const nNonzero = indexed.length;
  const expected = nNonzero * (nNonzero + 1) / 4;
  const varW = nNonzero * (nNonzero + 1) * (2 * nNonzero + 1) / 24;
  const z = Math.abs(Wpos - expected) / Math.sqrt(varW);
  const pApprox = 2 * (1 - jStat.normal.cdf(z, 0, 1));
  document.getElementById(id + '-result').innerHTML =
    `<div style="margin-bottom:4px;color:#888;">† 标记差异有统计学意义 (P &lt; 0.05)</div>` +
    `n=${nNonzero} | W⁺=${Wpos.toFixed(1)} (正秩和) | W⁻=${Wneg.toFixed(1)} | Z≈${z.toFixed(3)} | P≈${pApprox.toFixed(4)}` +
    (pApprox < 0.05 ? ' <span style="color:#c0392b">†</span>' : '');
}
registerViz('wilcoxon', renderWilcoxonSignedRank);

function renderKruskalWallis(el) {
  const id = 'kw-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'Kruskal-Wallis H 检验';
  let groups;
  if (el.dataset.groups) {
    groups = el.dataset.groups.split('|').map((g, i) => ({
      name: (el.dataset.labels ? el.dataset.labels.split(',')[i] : null) || `G${i + 1}`,
      values: g.split(',').map(Number)
    }));
  } else {
    groups = [
      {name: 'Drug_A', values: [32.5,35.5,40.5,46,49]},
      {name: 'Drug_B', values: [16,20.5,22.5,29,36]},
      {name: 'Drug_C', values: [6.5,9.0,12.5,18,24]},
    ];
  }
  const W = 560, canvasH = 300;
  el.innerHTML = `<div class="viz-card">
    <div class="viz-header">📊 ${title}</div>
    <canvas id="${id}" width="${W}" height="${canvasH}" style="display:block;margin:0 auto;"></canvas>
    <div id="${id}-result" style="text-align:center;font-size:13px;margin-top:8px;color:#333;"></div>
  </div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const pad = {t:40, r:20, b:50, l:50};
  const iW = W - pad.l - pad.r, iH = canvasH - pad.t - pad.b;
  const allVals = groups.flatMap(g => g.values);
  const globalMin = Math.min(...allVals), globalMax = Math.max(...allVals);
  const range = globalMax - globalMin;
  const yOf = v => pad.t + iH - ((v - globalMin) / range) * iH;
  function quartiles(arr) {
    const s = [...arr].sort((a,b)=>a-b);
    return {q1: s[Math.floor(s.length * 0.25)], med: s[Math.floor(s.length * 0.5)], q3: s[Math.floor(s.length * 0.75)], min: s[0], max: s[s.length-1]};
  }
  const n = groups.length;
  const boxW = Math.min(60, iW / n * 0.6);
  const spacing = iW / n;
  const colors = ['#2980b9','#27ae60','#e67e22'];

  const groupMeta = [];
  groups.forEach((g, i) => {
    const cx = pad.l + spacing * (i + 0.5);
    const q = quartiles(g.values);
    const mean = g.values.reduce((a,b)=>a+b,0)/g.values.length;
    groupMeta.push({ cx, boxW, q, mean, name: g.name, values: g.values, n: g.values.length });
  });

  const card = canvas.parentElement;
  const tip = createTooltip(card);

  function drawChart(hlIndex) {
    ctx.clearRect(0, 0, W, canvasH);
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, canvasH-pad.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l, canvasH-pad.b); ctx.lineTo(W-pad.r, canvasH-pad.b); ctx.stroke();
    const yTicks = 5;
    for (let y = 0; y <= yTicks; y++) {
      const yVal = globalMin + (range * y / yTicks);
      const yPx = yOf(yVal);
      ctx.strokeStyle = '#eee'; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(pad.l, yPx); ctx.lineTo(W-pad.r, yPx); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(1), pad.l - 5, yPx + 4);
    }
    groupMeta.forEach((gm, i) => {
      const isHl = i === hlIndex;
      const baseColor = colors[i % colors.length];
      const hlColor = isHl ? '#4da6ff' : baseColor;
      const q = gm.q;
      ctx.strokeStyle = hlColor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gm.cx, yOf(q.min)); ctx.lineTo(gm.cx, yOf(q.max)); ctx.stroke();
      ctx.fillStyle = hlColor + '33';
      ctx.strokeStyle = hlColor; ctx.lineWidth = 2;
      ctx.fillRect(gm.cx - gm.boxW/2, yOf(q.q3), gm.boxW, yOf(q.q1) - yOf(q.q3));
      ctx.strokeRect(gm.cx - gm.boxW/2, yOf(q.q3), gm.boxW, yOf(q.q1) - yOf(q.q3));
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(gm.cx - gm.boxW/2, yOf(q.med)); ctx.lineTo(gm.cx + gm.boxW/2, yOf(q.med)); ctx.stroke();
      ctx.fillStyle = hlColor; ctx.beginPath(); ctx.arc(gm.cx, yOf(gm.mean), 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(gm.name, gm.cx, canvasH - pad.b + 18);
      ctx.fillStyle = hlColor; ctx.font = '11px sans-serif';
      ctx.fillText('μ=' + gm.mean.toFixed(1), gm.cx, pad.t - 8);
    });
    ctx.fillStyle = '#888'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${groups.length}组 ${title}（方框=四分位 须=范围 红线=中位数 点=均值）`, W/2, canvasH - 5);
  }

  drawChart(-1);

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let found = -1;
    for (let i = 0; i < groupMeta.length; i++) {
      const gm = groupMeta[i];
      if (mx >= gm.cx - gm.boxW/2 && mx <= gm.cx + gm.boxW/2) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      const gm = groupMeta[found];
      const text = `${gm.name} | n=${gm.n} | mean=${gm.mean} | Q1=${gm.q.q1}-Q3=${gm.q.q3} | median=${gm.q.med} | ${gm.q.min}-${gm.q.max}`;
      tip.show(text);
      tip.move(e);
      drawChart(found);
    } else {
      tip.hide();
      drawChart(-1);
    }
  });

  const N = allVals.length;
  const k = groups.length;
  const sortedAll = [...allVals].sort((a, b) => a - b);
  const ranks = allVals.map((v) => {
    const positions = [];
    sortedAll.forEach((sv, idx) => { if (sv === v) positions.push(idx + 1); });
    return positions.reduce((a, b) => a + b, 0) / positions.length;
  });
  let offset = 0;
  const groupRanks = groups.map(g => {
    const r = ranks.slice(offset, offset + g.values.length);
    offset += g.values.length;
    return { Ri: r.reduce((a, b) => a + b, 0), ni: g.values.length };
  });
  const sumRi2ni = groupRanks.reduce((s, gr) => s + (gr.Ri * gr.Ri) / gr.ni, 0);
  const Hstat = (12 / (N * (N + 1))) * sumRi2ni - 3 * (N + 1);
  const df = k - 1;
  const pDisplay = (1 - jStat.chisquare.cdf(Hstat, df)).toFixed(4);
  const sigText = pDisplay < 0.05 ? `${groups.length}组差异有统计学意义 ✱` : `${groups.length}组差异无统计学意义`;
  document.getElementById(id + '-result').innerHTML =
    `H = ${Hstat.toFixed(3)} (χ²=${Hstat.toFixed(3)}, df=${df}, P≈${pDisplay}) — ${sigText}`;
}
registerViz('kruskal', renderKruskalWallis);

function renderFriedman(el) {
  const id = 'frd-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'Friedman M 检验';
  let blocks, treatments, data;
  if (el.dataset.data) {
    data = el.dataset.data.split(';').map(row => row.split(',').map(Number));
    blocks = el.dataset.rowLabels ? el.dataset.rowLabels.split(',') : data.map((_, i) => `B${i + 1}`);
    treatments = el.dataset.colLabels ? el.dataset.colLabels.split(',') : data[0].map((_, i) => `T${i + 1}`);
  } else {
    blocks = ['1','2','3','4','5','6','7','8'];
    treatments = ['A','B','C','D'];
    data = [
      [8.4, 9.6, 9.8, 11.7],
      [11.6, 12.7, 11.8, 12.0],
      [9.4, 9.1, 10.4, 9.8],
      [9.8, 8.7, 9.9, 12.0],
      [8.3, 8.0, 8.6, 8.6],
      [8.6, 9.8, 9.6, 10.6],
      [8.9, 9.0, 10.6, 11.4],
      [7.8, 8.2, 8.5, 10.8]
    ];
  }
  const W = 560, H = 320;
  el.innerHTML = `<div class="viz-card">
    <div class="viz-header">📊 ${title}</div>
    <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
    <div id="${id}-result" style="text-align:center;font-size:13px;margin-top:8px;color:#333;"></div>
  </div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const pad = {t:40, r:30, b:55, l:55};
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const colors = ['#2980b9','#27ae60','#e67e22','#8e44ad'];
  const nBlocks = blocks.length, nTreat = treatments.length;
  const blockW = iW / nBlocks;
  const allVals = data.flat();
  const yMin = Math.min(...allVals) - 2, yMax = Math.max(...allVals) + 2;
  const yOf = v => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;

  const pointData = [];
  data.forEach((blockData, bi) => {
    const bx = pad.l + blockW * (bi + 0.5);
    blockData.forEach((val, ti) => {
      const x = bx + (ti - (nTreat-1)/2) * (blockW * 0.15);
      pointData.push({ x, y: yOf(val), val, blockLabel: blocks[bi], treatLabel: treatments[ti] });
    });
  });

  const card = canvas.parentElement;
  const tip = createTooltip(card);

  function drawChart(hlIndex) {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H-pad.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l, H-pad.b); ctx.lineTo(W-pad.r, H-pad.b); ctx.stroke();
    const yTicks = 4;
    for (let y = 0; y <= yTicks; y++) {
      const yVal = yMin + (yMax-yMin) * y / yTicks;
      const yPx = yOf(yVal);
      ctx.strokeStyle = '#eee'; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(pad.l, yPx); ctx.lineTo(W-pad.r, yPx); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(0), pad.l - 5, yPx + 4);
    }
    data.forEach((blockData, bi) => {
      const bx = pad.l + blockW * (bi + 0.5);
      ctx.strokeStyle = '#ccc'; ctx.setLineDash([2,2]);
      ctx.beginPath(); ctx.moveTo(bx, pad.t); ctx.lineTo(bx, H-pad.b); ctx.stroke();
      ctx.setLineDash([]);
      blockData.forEach((val, ti) => {
        const x = bx + (ti - (nTreat-1)/2) * (blockW * 0.15);
        const ptIdx = pointData.findIndex(p => p.val === val && p.blockLabel === blocks[bi] && p.treatLabel === treatments[ti]);
        const isHl = ptIdx === hlIndex;
        const r = isHl ? 7 : 5;
        ctx.fillStyle = colors[ti % colors.length];
        ctx.beginPath(); ctx.arc(x, yOf(val), r, 0, Math.PI*2); ctx.fill();
      });
      for (let ti = 0; ti < nTreat - 1; ti++) {
        const x1 = bx + (ti - (nTreat-1)/2) * (blockW * 0.15);
        const x2 = bx + (ti+1 - (nTreat-1)/2) * (blockW * 0.15);
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
        ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(x1, yOf(blockData[ti])); ctx.lineTo(x2, yOf(blockData[ti+1])); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(blocks[bi], bx, H - pad.b + 15);
    });
    const legendSpacing = iW / (nTreat + 1);
    treatments.forEach((t, ti) => {
      const lx = pad.l + legendSpacing * (ti + 1);
      ctx.fillStyle = colors[ti % colors.length]; ctx.beginPath(); ctx.arc(lx, pad.t - 15, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(t, lx + 8, pad.t - 11);
    });
  }

  drawChart(-1);

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found = -1;
    for (let i = 0; i < pointData.length; i++) {
      const p = pointData[i];
      if (Math.hypot(mx - p.x, my - p.y) < 10) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      const p = pointData[found];
      const text = `受试者 ${p.blockLabel} | ${p.treatLabel}=${p.val}`;
      tip.show(text);
      tip.move(e);
      drawChart(found);
    } else {
      tip.hide();
      drawChart(-1);
    }
  });

  const b = nBlocks, t = nTreat;
  const blockRanks = data.map(blockData => {
    const indexed = blockData.map((v, ti) => ({ v, ti }));
    indexed.sort((a, b) => a.v - b.v);
    const ranks = new Array(t);
    let i = 0;
    while (i < t) {
      let j = i;
      while (j < t - 1 && indexed[j + 1].v === indexed[i].v) j++;
      const avgRank = (i + 1 + j + 1) / 2;
      for (let k = i; k <= j; k++) ranks[indexed[k].ti] = avgRank;
      i = j + 1;
    }
    return ranks;
  });
  const treatRankSums = treatments.map((_, ti) => blockRanks.reduce((s, br) => s + br[ti], 0));
  const meanRank = (t + 1) / 2;
  const expectedSum = b * meanRank;
  const M = treatRankSums.reduce((s, Ri) => s + (Ri - expectedSum) ** 2, 0);
  let tieCorrection = 0;
  blockRanks.forEach(br => {
    const freq = {};
    br.forEach(r => { freq[r] = (freq[r] || 0) + 1; });
    Object.values(freq).forEach(f => { if (f > 1) tieCorrection += (f ** 3 - f); });
  });
  const Cf = 1 - tieCorrection / (b * t * (t ** 2 - 1));
  const chiSq = Cf > 0 && b > 1 ? (12 * M) / (b * t * (t + 1)) : 0;
  const df = t - 1;
  const pDisplay = (1 - jStat.chisquare.cdf(chiSq, df)).toFixed(4);
  const sigText = pDisplay < 0.05 ? `${t}个处理间差异有统计学意义 ✱` : `${t}个处理间差异无统计学意义`;
  document.getElementById(id + '-result').innerHTML =
    `Friedman M = ${M.toFixed(3)} (χ²=${chiSq.toFixed(3)}, df=${df}, P≈${pDisplay}) — ${sigText}`;
}
registerViz('friedman', renderFriedman);

function renderRepeatedMeasuresInteraction(el) {
  const id = 'rm-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '重复测量交互效应图';
  const W = 560, H = 300;
  el.innerHTML = `<div class="viz-card">
    <div class="viz-header">📊 ${title}</div>
    <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
    <div style="text-align:center;font-size:12px;color:#666;margin-top:6px;">
      两因素两水平：时间(治疗前/治疗后) × 组别(实验组/对照组)<br>交互效应：实验组治疗后升高，对照组无变化
    </div>
  </div>`;
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const pad = {t:40, r:30, b:50, l:50};
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const timePoints = ['治疗前','治疗后'];
  const groups = [
    {name: '实验组', values: [7.2, 9.8], color: '#2980b9'},
    {name: '对照组', values: [7.4, 7.6], color: '#27ae60'},
  ];
  const yMin = 5, yMax = 12;
  const xOf = ti => pad.l + iW * (ti / (timePoints.length - 1));
  const yOf = v => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H-pad.b); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.l, H-pad.b); ctx.lineTo(W-pad.r, H-pad.b); ctx.stroke();
  for (let y = 0; y <= 4; y++) {
    const yVal = yMin + (yMax-yMin) * y / 4;
    const yPx = yOf(yVal);
    ctx.strokeStyle = '#eee'; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(pad.l, yPx); ctx.lineTo(W-pad.r, yPx); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(yVal.toFixed(1), pad.l - 5, yPx + 4);
  }
  timePoints.forEach((tp, ti) => {
    const x = pad.l + (ti / (timePoints.length-1)) * iW;
    ctx.fillStyle = '#555'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(tp, x, H - pad.b + 20);
  });
  groups.forEach(g => {
    const xs = timePoints.map((_, ti) => xOf(ti));
    const ys = g.values.map(v => yOf(v));
    ctx.strokeStyle = g.color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(xs[0], ys[0]); ctx.lineTo(xs[1], ys[1]); ctx.stroke();
    xs.forEach((x, ti) => {
      ctx.fillStyle = g.color; ctx.beginPath(); ctx.arc(x, ys[ti], 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, ys[ti], 3, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = g.color; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(g.name, xs[1] + 8, ys[1]);
  });
  ctx.fillStyle = '#c0392b'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('↗ 存在正交互效应（组间差异随时间增大）', W/2, pad.t - 12);
}
registerViz('rminteraction', renderRepeatedMeasuresInteraction);