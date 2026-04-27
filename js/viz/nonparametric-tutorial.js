import { registerViz } from './_core.js';

const boxStyle = 'border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;padding:12px;box-shadow:0 1px 2px rgba(15,23,42,.04);';
const muted = 'color:#64748b;font-size:13px;line-height:1.6;';
const badge = 'display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;margin-right:6px;';
const grid = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:stretch;';

function card(title, body) {
  return `<div class="viz-card"><div class="viz-header"><span>📊 ${title}</span></div><div style="padding:14px;background:#f8fafc;">${body}</div></div>`;
}

function normalCDF(x) {
  if (window.jStat?.normal?.cdf) return window.jStat.normal.cdf(x, 0, 1);
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x / Math.SQRT2);
  const t = 1 / (1 + 0.3275911 * ax);
  const erf = sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax));
  return 0.5 * (1 + erf);
}

function fmt(v, d = 3) { return Number.isFinite(v) ? v.toFixed(d) : '—'; }
function fmtP(p) { if (!Number.isFinite(p)) return '—'; if (p < 0.001) return '< 0.001'; return Math.min(1, Math.max(0, p)).toFixed(4); }
function sum(a) { return a.reduce((s, v) => s + v, 0); }
function mean(a) { return sum(a) / a.length; }
function isNumberArray(a) { return a.length > 0 && a.every(v => Number.isFinite(v)); }
function parseNums(s) { return String(s || '').split(',').map(v => Number(v.trim())).filter(v => !Number.isNaN(v)); }

function rankValues(values) {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array(values.length);
  let i = 0;
  let tieGroups = 0;
  while (i < indexed.length) {
    let j = i + 1;
    while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) ranks[indexed[k].i] = avgRank;
    if (j - i > 1) tieGroups++;
    i = j;
  }
  return { ranks, tieGroups };
}

function renderNonparametricChoiceGuide(el) {
  const title = el.dataset.title || '非参数检验选择指南';
  el.innerHTML = card(title, `<div style="${grid}">
    <div style="${boxStyle}"><span style="${badge}">配对设计</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">Wilcoxon 符号秩检验</div><div style="${muted}">先计算每对差值，去掉 0 差值，再按差值绝对值排序并加回正负号。</div></div>
    <div style="${boxStyle}"><span style="${badge}">两独立组</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">Wilcoxon 秩和检验 / Mann-Whitney U</div><div style="${muted}">把两组合并排序，再比较两组秩和。它主要比较分布位置，不是直接比较均数。</div></div>
    <div style="${boxStyle}"><span style="${badge}">多个独立组</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">Kruskal-Wallis H 检验</div><div style="${muted}">多组资料合并排序，检验各组分布位置是否不全相同。显著后需事后多重比较。</div></div>
    <div style="${boxStyle}"><span style="${badge}">注意</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">不是万能替代</div><div style="${muted}">非参数检验减少对正态分布的依赖，但仍要求研究设计正确；配对和独立样本不能混用。</div></div>
  </div>`);
}
registerViz('nonparametricchoiceguide', renderNonparametricChoiceGuide);

function renderSignedRankGuide(el) {
  const id = 'signedrank-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'Wilcoxon 符号秩检验：差值、绝对值排序和符号秩';
  const before = el.dataset.before || '12,15,11,18,20,17,16,14';
  const after = el.dataset.after || '15,16,10,20,21,19,16,18';
  el.innerHTML = card(title, `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;align-items:start;">
    <div style="${boxStyle}"><label style="font-size:13px;">配对前<br><input id="${id}-before" type="text" value="${before}" style="width:100%;padding:6px;"></label><br><br><label style="font-size:13px;">配对后<br><input id="${id}-after" type="text" value="${after}" style="width:100%;padding:6px;"></label><br><br><button id="${id}-calc" type="button" style="padding:8px 14px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;">计算秩</button></div>
    <div id="${id}-summary" style="${boxStyle}"></div>
  </div><div id="${id}-table" style="margin-top:12px;overflow:auto;"></div>`);
  function calc() {
    const b = parseNums(document.getElementById(`${id}-before`).value);
    const a = parseNums(document.getElementById(`${id}-after`).value);
    if (!isNumberArray(b) || !isNumberArray(a) || b.length !== a.length) {
      document.getElementById(`${id}-summary`).innerHTML = '<div style="color:#b91c1c;">两列必须是长度一致的数值。</div>'; return;
    }
    const rows = b.map((v, i) => ({ i: i + 1, before: v, after: a[i], diff: a[i] - v })).filter(r => r.diff !== 0);
    if (!rows.length) { document.getElementById(`${id}-summary`).innerHTML = '<div style="color:#b91c1c;">所有差值均为 0，符号秩检验没有可用信息。</div>'; return; }
    const { ranks, tieGroups } = rankValues(rows.map(r => Math.abs(r.diff)));
    rows.forEach((r, i) => { r.abs = Math.abs(r.diff); r.rank = ranks[i]; r.signed = r.diff > 0 ? r.rank : -r.rank; });
    const wPlus = sum(rows.filter(r => r.diff > 0).map(r => r.rank));
    const wMinus = sum(rows.filter(r => r.diff < 0).map(r => r.rank));
    document.getElementById(`${id}-summary`).innerHTML = `<div style="font-weight:700;color:#0f172a;margin-bottom:8px;">读图重点</div><div style="${muted}">原始配对数 = ${b.length}；去掉 0 差值后 n = ${rows.length}。</div><div style="${muted}">正秩和 W+ = ${fmt(wPlus, 1)}；负秩和 W− = ${fmt(wMinus, 1)}。</div><div style="${muted}">${tieGroups ? `存在 ${tieGroups} 组结值，R 会使用平均秩并可能改用近似 P 值。` : '无结值。'}</div>`;
    document.getElementById(`${id}-table`).innerHTML = `<table class="anova-table"><tr><th>编号</th><th>前</th><th>后</th><th>差值 d</th><th>|d|</th><th>秩</th><th>符号秩</th></tr>${rows.map(r => `<tr><td>${r.i}</td><td>${r.before}</td><td>${r.after}</td><td>${fmt(r.diff, 2)}</td><td>${fmt(r.abs, 2)}</td><td>${fmt(r.rank, 1)}</td><td>${fmt(r.signed, 1)}</td></tr>`).join('')}</table>`;
  }
  document.getElementById(`${id}-calc`).addEventListener('click', calc);
  calc();
}
registerViz('signedrankguide', renderSignedRankGuide);

function renderRankSumGuide(el) {
  const id = 'ranksum-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || 'Wilcoxon 秩和检验：两独立样本合并排序';
  const g1 = el.dataset.group1 || '8,9,12,13,15,16';
  const g2 = el.dataset.group2 || '11,14,17,18,20,22';
  el.innerHTML = card(title, `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;align-items:start;"><div style="${boxStyle}"><label style="font-size:13px;">组1<br><input id="${id}-g1" type="text" value="${g1}" style="width:100%;padding:6px;"></label><br><br><label style="font-size:13px;">组2<br><input id="${id}-g2" type="text" value="${g2}" style="width:100%;padding:6px;"></label><br><br><button id="${id}-calc" type="button" style="padding:8px 14px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;">计算秩和</button></div><div id="${id}-summary" style="${boxStyle}"></div></div><div id="${id}-table" style="margin-top:12px;overflow:auto;"></div>`);
  function calc() {
    const a = parseNums(document.getElementById(`${id}-g1`).value);
    const b = parseNums(document.getElementById(`${id}-g2`).value);
    if (!isNumberArray(a) || !isNumberArray(b)) { document.getElementById(`${id}-summary`).innerHTML = '<div style="color:#b91c1c;">两组都必须输入数值。</div>'; return; }
    const combined = [...a.map(v => ({ value: v, group: '组1' })), ...b.map(v => ({ value: v, group: '组2' }))];
    const { ranks, tieGroups } = rankValues(combined.map(r => r.value));
    combined.forEach((r, i) => r.rank = ranks[i]);
    const r1 = sum(combined.filter(r => r.group === '组1').map(r => r.rank));
    const r2 = sum(combined.filter(r => r.group === '组2').map(r => r.rank));
    const n1 = a.length, n2 = b.length;
    const u1 = r1 - n1 * (n1 + 1) / 2;
    const u2 = r2 - n2 * (n2 + 1) / 2;
    document.getElementById(`${id}-summary`).innerHTML = `<div style="font-weight:700;color:#0f172a;margin-bottom:8px;">读图重点</div><div style="${muted}">两组样本合并后一起排序，再比较各组秩和。</div><div style="${muted}">组1秩和 = ${fmt(r1, 1)}；组2秩和 = ${fmt(r2, 1)}；U = ${fmt(Math.min(u1, u2), 1)}。</div><div style="${muted}">${tieGroups ? `存在 ${tieGroups} 组结值，精确 P 值可能不可用。` : '无结值。'}</div>`;
    const sorted = [...combined].sort((x, y) => x.value - y.value);
    document.getElementById(`${id}-table`).innerHTML = `<table class="anova-table"><tr><th>值</th><th>组别</th><th>秩</th></tr>${sorted.map(r => `<tr><td>${r.value}</td><td>${r.group}</td><td>${fmt(r.rank, 1)}</td></tr>`).join('')}</table>`;
  }
  document.getElementById(`${id}-calc`).addEventListener('click', calc);
  calc();
}
registerViz('ranksumguide', renderRankSumGuide);

function renderKruskalWallisGuide(el) {
  const title = el.dataset.title || 'Kruskal-Wallis H 检验：多组独立样本的秩比较';
  el.innerHTML = card(title, `<div style="${grid}">
    <div style="${boxStyle}"><span style="${badge}">第一步</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">合并所有观测值排序</div><div style="${muted}">不在每个组内部排序，而是把所有组放在一起赋秩；结值使用平均秩。</div></div>
    <div style="${boxStyle}"><span style="${badge}">第二步</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">比较各组平均秩</div><div style="${muted}">若各组来自相同分布，平均秩应大致接近；偏离越大，H 统计量越大。</div></div>
    <div style="${boxStyle}"><span style="${badge}">第三步</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">总体检验后再做多重比较</div><div style="${muted}">H 检验显著只说明多组不全相同，不能直接说明哪两组不同；需 Dunn 检验或 pairwise Wilcoxon 并校正 P 值。</div></div>
    <div style="${boxStyle}"><span style="${badge}">解释</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">比较分布位置而非均数</div><div style="${muted}">当各组分布形状相近时，可近似解释为中位数或位置差异；分布形状不同则解释更谨慎。</div></div>
  </div>`);
}
registerViz('kruskalwallisguide', renderKruskalWallisGuide);
