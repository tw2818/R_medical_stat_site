import { registerViz } from './_core.js';

const boxStyle = 'border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;padding:12px;box-shadow:0 1px 2px rgba(15,23,42,.04);';
const muted = 'color:#64748b;font-size:13px;line-height:1.6;';
const badge = 'display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;margin-right:6px;';
const grid = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:stretch;';

function card(title, body) {
  return `<div class="viz-card"><div class="viz-header"><span>📊 ${title}</span></div><div style="padding:14px;background:#f8fafc;">${body}</div></div>`;
}

function parseNums(text) {
  return String(text || '').split(',').map(v => Number(v.trim())).filter(v => !Number.isNaN(v));
}
function sum(arr) { return arr.reduce((s, v) => s + v, 0); }
function mean(arr) { return sum(arr) / arr.length; }
function fmt(v, d = 3) { return Number.isFinite(v) ? v.toFixed(d) : '—'; }
function rankValues(values) {
  const indexed = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(values.length);
  let tieGroups = 0;
  let i = 0;
  while (i < indexed.length) {
    let j = i + 1;
    while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
    const avg = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) ranks[indexed[k].i] = avg;
    if (j - i > 1) tieGroups++;
    i = j;
  }
  return { ranks, tieGroups };
}
function pearson(x, y) {
  const mx = mean(x), my = mean(y);
  const sxx = sum(x.map(v => (v - mx) ** 2));
  const syy = sum(y.map(v => (v - my) ** 2));
  const sxy = sum(x.map((v, i) => (v - mx) * (y[i] - my)));
  if (sxx <= 0 || syy <= 0) return { r: NaN, sxx, syy, sxy, mx, my };
  return { r: sxy / Math.sqrt(sxx * syy), sxx, syy, sxy, mx, my };
}
function linearFit(x, y) {
  const p = pearson(x, y);
  const slope = p.sxx > 0 ? p.sxy / p.sxx : NaN;
  const intercept = Number.isFinite(slope) ? p.my - slope * p.mx : NaN;
  return { ...p, slope, intercept, r2: p.r * p.r };
}

function renderCorrelationChoiceGuide(el) {
  const title = el.dataset.title || '双变量关系怎么选：回归、相关与曲线拟合';
  el.innerHTML = card(title, `<div style="${grid}">
    <div style="${boxStyle}"><span style="${badge}">直线回归</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">有明确 X 和 Y</div><div style="${muted}">用于建立 Y 随 X 改变的预测/解释模型。重点是斜率、截距、残差和模型适用范围。</div></div>
    <div style="${boxStyle}"><span style="${badge}">Pearson 相关</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">两个连续变量的线性关联</div><div style="${muted}">相关系数 r 描述线性关联方向和强度。它不区分自变量/因变量，也不等于因果效应。</div></div>
    <div style="${boxStyle}"><span style="${badge}">Spearman 秩相关</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">单调关系或等级资料</div><div style="${muted}">先把原始值转为秩，再对秩计算相关。适合偏态、异常值影响较大或等级变量。</div></div>
    <div style="${boxStyle}"><span style="${badge}">曲线拟合</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">关系明显非线性</div><div style="${muted}">用于描述或预测非线性趋势。应警惕过拟合和外推风险，不能因拟合好就推断机制成立。</div></div>
  </div>`);
}
registerViz('correlationchoiceguide', renderCorrelationChoiceGuide);

function renderRegressionCorrelationGuide(el) {
  const id = 'regcor-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '直线回归与相关：同一组点的两种读法';
  const defaultX = el.dataset.x || '1,2,3,4,5,6,7,8';
  const defaultY = el.dataset.y || '2.1,2.8,3.2,4.5,5.1,5.8,7.0,7.3';
  el.innerHTML = card(title, `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;align-items:start;">
    <div style="${boxStyle}"><label style="font-size:13px;">X<br><input id="${id}-x" type="text" value="${defaultX}" style="width:100%;padding:6px;"></label><br><br><label style="font-size:13px;">Y<br><input id="${id}-y" type="text" value="${defaultY}" style="width:100%;padding:6px;"></label><br><br><button id="${id}-calc" type="button" style="padding:8px 14px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;">计算</button></div>
    <div id="${id}-summary" style="${boxStyle}"></div>
  </div><canvas id="${id}-canvas" width="640" height="310" style="display:block;margin:12px auto 0;max-width:100%;"></canvas>`);
  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  function calc() {
    const x = parseNums(document.getElementById(`${id}-x`).value);
    const y = parseNums(document.getElementById(`${id}-y`).value);
    const summary = document.getElementById(`${id}-summary`);
    if (x.length !== y.length || x.length < 3) { summary.innerHTML = '<div style="color:#b91c1c;">X 和 Y 必须为长度一致且不少于 3 个的数值。</div>'; return; }
    const fit = linearFit(x, y);
    if (!Number.isFinite(fit.slope)) { summary.innerHTML = '<div style="color:#b91c1c;">X 或 Y 没有变异，无法计算相关或回归。</div>'; return; }
    summary.innerHTML = `<div style="font-weight:700;color:#0f172a;margin-bottom:8px;">结果解释</div><div style="${muted}"><strong>回归方程</strong>：ŷ = ${fmt(fit.intercept, 3)} + ${fmt(fit.slope, 3)}X。</div><div style="${muted}"><strong>Pearson r</strong> = ${fmt(fit.r, 3)}，表示线性关联方向和强度。</div><div style="${muted}"><strong>R²</strong> = ${fmt(fit.r2, 3)}。在简单线性回归中 R² = r²，但 R² 是模型解释变异比例，r 是相关系数。</div><div style="${muted}">相关不等于因果；回归斜率也需要结合研究设计和混杂控制解释。</div>`;
    draw(x, y, fit);
  }
  function draw(x, y, fit) {
    const W = canvas.width, H = canvas.height;
    const pad = { l: 56, r: 24, t: 28, b: 46 };
    const minX = Math.min(...x), maxX = Math.max(...x), minY = Math.min(...y), maxY = Math.max(...y);
    const xRange = maxX - minX || 1, yRange = maxY - minY || 1;
    const sx = v => pad.l + ((v - minX) / xRange) * (W - pad.l - pad.r);
    const sy = v => H - pad.b - ((v - minY) / yRange) * (H - pad.t - pad.b);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
    ctx.fillStyle = '#2563eb';
    x.forEach((v, i) => { ctx.beginPath(); ctx.arc(sx(v), sy(y[i]), 4, 0, Math.PI * 2); ctx.fill(); });
    const y1 = fit.intercept + fit.slope * minX;
    const y2 = fit.intercept + fit.slope * maxX;
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx(minX), sy(y1)); ctx.lineTo(sx(maxX), sy(y2)); ctx.stroke();
    ctx.fillStyle = '#0f172a'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('X', pad.l + (W - pad.l - pad.r) / 2, H - 10);
    ctx.save(); ctx.translate(16, pad.t + (H - pad.t - pad.b) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Y', 0, 0); ctx.restore();
  }
  document.getElementById(`${id}-calc`).addEventListener('click', calc);
  calc();
}
registerViz('regressioncorrelationguide', renderRegressionCorrelationGuide);

function renderSpearmanRankGuide(el) {
  const id = 'spearman-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'Spearman 秩相关：原始值 → 排名 → 相关';
  const defaultX = el.dataset.x || '10,20,30,40,50,60,70';
  const defaultY = el.dataset.y || '4,6,5,9,10,13,12';
  el.innerHTML = card(title, `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;align-items:start;"><div style="${boxStyle}"><label style="font-size:13px;">变量 X<br><input id="${id}-x" type="text" value="${defaultX}" style="width:100%;padding:6px;"></label><br><br><label style="font-size:13px;">变量 Y<br><input id="${id}-y" type="text" value="${defaultY}" style="width:100%;padding:6px;"></label><br><br><button id="${id}-calc" type="button" style="padding:8px 14px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;">计算秩相关</button></div><div id="${id}-summary" style="${boxStyle}"></div></div><div id="${id}-table" style="margin-top:12px;overflow:auto;"></div>`);
  function calc() {
    const x = parseNums(document.getElementById(`${id}-x`).value);
    const y = parseNums(document.getElementById(`${id}-y`).value);
    const summary = document.getElementById(`${id}-summary`);
    if (x.length !== y.length || x.length < 3) { summary.innerHTML = '<div style="color:#b91c1c;">X 和 Y 必须为长度一致且不少于 3 个的数值。</div>'; return; }
    const rx = rankValues(x), ry = rankValues(y);
    const rho = pearson(rx.ranks, ry.ranks).r;
    summary.innerHTML = `<div style="font-weight:700;color:#0f172a;margin-bottom:8px;">读图重点</div><div style="${muted}">Spearman 相关就是对两个变量的秩计算 Pearson 相关。</div><div style="${muted}"><strong>Spearman ρ</strong> = ${fmt(rho, 3)}。</div><div style="${muted}">${rx.tieGroups || ry.tieGroups ? `存在结值：X 有 ${rx.tieGroups} 组，Y 有 ${ry.tieGroups} 组；使用平均秩。` : '无结值。'}</div>`;
    document.getElementById(`${id}-table`).innerHTML = `<table class="anova-table"><tr><th>序号</th><th>X</th><th>rank(X)</th><th>Y</th><th>rank(Y)</th></tr>${x.map((v, i) => `<tr><td>${i + 1}</td><td>${v}</td><td>${fmt(rx.ranks[i], 1)}</td><td>${y[i]}</td><td>${fmt(ry.ranks[i], 1)}</td></tr>`).join('')}</table>`;
  }
  document.getElementById(`${id}-calc`).addEventListener('click', calc);
  calc();
}
registerViz('spearmanrankguide', renderSpearmanRankGuide);

function renderSlopeCompareGuide(el) {
  const title = el.dataset.title || '两条回归直线比较：看交互项';
  el.innerHTML = card(title, `<div style="${grid}">
    <div style="${boxStyle}"><span style="${badge}">模型</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">y ~ x * group</div><div style="${muted}">展开后为 y = β0 + β1x + β2group + β3(x×group)。其中 β3 是斜率差异。</div></div>
    <div style="${boxStyle}"><span style="${badge}">先看斜率</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">β3 是否显著</div><div style="${muted}">若交互项显著，说明两组 x 与 y 的关系强度不同，不宜只比较截距或合并成一条线。</div></div>
    <div style="${boxStyle}"><span style="${badge}">再看截距</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">β2 的解释依赖 x=0</div><div style="${muted}">截距差异表示在 x=0 时两组均值差异。若 x=0 没有实际意义，可先中心化 x。</div></div>
    <div style="${boxStyle}"><span style="${badge}">报告</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">图 + 模型系数</div><div style="${muted}">建议画分组散点和两条拟合线，同时报告交互项估计值、置信区间和 P 值。</div></div>
  </div>`);
}
registerViz('slopecompareguide', renderSlopeCompareGuide);

function renderCurveFitGuide(el) {
  const title = el.dataset.title || '曲线拟合：非线性、过拟合与外推风险';
  el.innerHTML = card(title, `<div style="${grid}">
    <div style="${boxStyle}"><span style="${badge}">线性模型</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">y = β0 + β1x</div><div style="${muted}">适合近似直线关系。残差图若显示弯曲结构，说明线性假设可能不足。</div></div>
    <div style="${boxStyle}"><span style="${badge}">二次/多项式</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">加入 x²、x³ 等项</div><div style="${muted}">可描述弯曲趋势，但高阶项容易过拟合；应结合散点图、残差图和外部合理性。</div></div>
    <div style="${boxStyle}"><span style="${badge}">拟合好 ≠ 机制真</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">警惕解释过度</div><div style="${muted}">曲线拟合主要是描述/预测工具。观察性资料中，非线性关联仍可能来自混杂或选择偏倚。</div></div>
    <div style="${boxStyle}"><span style="${badge}">外推风险</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">不要超出数据范围太远</div><div style="${muted}">曲线在观测范围内拟合良好，不代表在低于最小值或高于最大值的区域仍有效。</div></div>
  </div>`);
}
registerViz('curvefitguide', renderCurveFitGuide);
