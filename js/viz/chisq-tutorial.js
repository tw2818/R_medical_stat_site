import { registerViz } from './_core.js';

const boxStyle = 'border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;padding:12px;box-shadow:0 1px 2px rgba(15,23,42,.04);';
const muted = 'color:#64748b;font-size:13px;line-height:1.6;';
const badge = 'display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;margin-right:6px;';
const grid = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;align-items:stretch;';

function card(title, body) {
  return `
    <div class="viz-card">
      <div class="viz-header"><span>📊 ${title}</span></div>
      <div style="padding:14px;background:#f8fafc;">
        ${body}
      </div>
    </div>
  `;
}

function erfApprox(x) {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

function normalCDF(x) {
  if (window.jStat?.normal?.cdf) return window.jStat.normal.cdf(x, 0, 1);
  return 0.5 * (1 + erfApprox(x / Math.SQRT2));
}

function logGamma(z) {
  const coeff = [676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < coeff.length; i++) x += coeff[i] / (z + i + 1);
  const t = z + coeff.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function regularizedGammaP(a, x) {
  if (x <= 0) return 0;
  if (a <= 0) return NaN;
  const gln = logGamma(a);
  if (x < a + 1) {
    let ap = a;
    let del = 1 / a;
    let sumVal = del;
    for (let n = 1; n <= 120; n++) {
      ap += 1;
      del *= x / ap;
      sumVal += del;
      if (Math.abs(del) < Math.abs(sumVal) * 1e-13) break;
    }
    return Math.min(1, Math.max(0, sumVal * Math.exp(-x + a * Math.log(x) - gln)));
  }
  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 120; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-13) break;
  }
  return Math.min(1, Math.max(0, 1 - Math.exp(-x + a * Math.log(x) - gln) * h));
}

function chiSquareP(stat, df = 1) {
  if (!Number.isFinite(stat) || stat < 0 || df <= 0) return NaN;
  if (window.jStat?.chisquare?.cdf) return Math.max(0, Math.min(1, 1 - window.jStat.chisquare.cdf(stat, df)));
  if (df === 1) return Math.max(0, Math.min(1, 2 * (1 - normalCDF(Math.sqrt(stat)))));
  return Math.max(0, Math.min(1, 1 - regularizedGammaP(df / 2, stat / 2)));
}

function fmt(x, digits = 3) { return Number.isFinite(x) ? x.toFixed(digits) : '—'; }
function fmtP(p) { if (!Number.isFinite(p)) return '—'; if (p < 0.001) return '< 0.001'; return Math.min(1, Math.max(0, p)).toFixed(4); }
function sum(arr) { return arr.reduce((s, v) => s + v, 0); }
function isCount(v) { return Number.isInteger(v) && v >= 0; }
function readNumber(id) { return Number(document.getElementById(id).value); }

function renderChisqChoiceGuide(el) {
  const title = el.dataset.title || '卡方检验选择指南';
  el.innerHTML = card(title, `
    <div style="${grid}">
      <div style="${boxStyle}"><span style="${badge}">独立 2×2 表</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">两组独立样本率比较</div><div style="${muted}">常用 Pearson χ²；理论频数偏小时考虑连续性校正或 Fisher 确切概率法。</div></div>
      <div style="${boxStyle}"><span style="${badge}">配对 2×2 表</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">同一对象两次分类结果</div><div style="${muted}">使用 McNemar 检验，重点看两个不一致格子 b 和 c，而不是普通独立样本 χ²。</div></div>
      <div style="${boxStyle}"><span style="${badge}">小样本 2×2 表</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">理论频数过小</div><div style="${muted}">优先考虑 Fisher 确切概率法，尤其是样本量小或某些理论频数明显小于 5 时。</div></div>
      <div style="${boxStyle}"><span style="${badge}">R×C 表</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">多组率或构成比比较</div><div style="${muted}">总体 χ² 检验只说明分布不全相同；需要结合期望频数和残差判断主要贡献格子。</div></div>
    </div>
  `);
}
registerViz('chisqchoiceguide', renderChisqChoiceGuide);

function renderChisq2x2(el) {
  const id = 'chisq2x2-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '独立四格表：观察频数、理论频数与 χ² 贡献';
  const init = { a: Number(el.dataset.a || 43), b: Number(el.dataset.b || 157), c: Number(el.dataset.c || 26), d: Number(el.dataset.d || 174) };
  el.innerHTML = card(title, `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;align-items:start;">
      <div style="${boxStyle}">
        <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">输入 2×2 观察频数</div>
        <table style="border-collapse:collapse;width:100%;margin-bottom:10px;"><thead><tr><th></th><th>阳性</th><th>阴性</th></tr></thead><tbody>
          <tr><th style="text-align:left;">组1</th><td><input id="${id}-a" type="number" min="0" step="1" value="${init.a}" style="width:80px;padding:5px;"></td><td><input id="${id}-b" type="number" min="0" step="1" value="${init.b}" style="width:80px;padding:5px;"></td></tr>
          <tr><th style="text-align:left;">组2</th><td><input id="${id}-c" type="number" min="0" step="1" value="${init.c}" style="width:80px;padding:5px;"></td><td><input id="${id}-d" type="number" min="0" step="1" value="${init.d}" style="width:80px;padding:5px;"></td></tr>
        </tbody></table>
        <button id="${id}-calc" type="button" style="padding:8px 14px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;">计算</button>
      </div>
      <div id="${id}-summary" style="${boxStyle}"></div>
    </div>
    <div id="${id}-details" style="margin-top:12px;"></div>`);
  function calc() {
    const obs = [[readNumber(`${id}-a`), readNumber(`${id}-b`)], [readNumber(`${id}-c`), readNumber(`${id}-d`)]];
    if (obs.flat().some(v => !isCount(v)) || sum(obs.flat()) === 0) { document.getElementById(`${id}-summary`).innerHTML = '<div style="color:#b91c1c;">请输入非负整数频数，且总例数不能为 0。</div>'; return; }
    const rowTotals = obs.map(row => sum(row));
    const colTotals = [obs[0][0] + obs[1][0], obs[0][1] + obs[1][1]];
    const total = sum(rowTotals);
    if (rowTotals.some(v => v === 0) || colTotals.some(v => v === 0)) { document.getElementById(`${id}-summary`).innerHTML = '<div style="color:#b91c1c;">每一行、每一列都至少需要有一个观察值。</div>'; return; }
    const exp = obs.map((row, i) => row.map((_, j) => rowTotals[i] * colTotals[j] / total));
    let chisq = 0;
    let yates = 0;
    const contrib = obs.map((row, i) => row.map((o, j) => { const c = (o - exp[i][j]) ** 2 / exp[i][j]; chisq += c; yates += (Math.max(0, Math.abs(o - exp[i][j]) - 0.5) ** 2) / exp[i][j]; return c; }));
    const p = chiSquareP(chisq, 1);
    const py = chiSquareP(yates, 1);
    const minExp = Math.min(...exp.flat());
    const small = minExp < 5;
    const r1 = obs[0][0] / rowTotals[0];
    const r2 = obs[1][0] / rowTotals[1];
    const or = obs[0][1] * obs[1][0] === 0 ? NaN : (obs[0][0] * obs[1][1]) / (obs[0][1] * obs[1][0]);
    document.getElementById(`${id}-summary`).innerHTML = `
      <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">结果解释</div>
      <div style="${muted}">组1阳性率 = ${(100 * r1).toFixed(1)}%；组2阳性率 = ${(100 * r2).toFixed(1)}%。</div>
      <div style="${muted}">Pearson χ² = ${fmt(chisq)}，P = ${fmtP(p)}；连续性校正 χ² = ${fmt(yates)}，P = ${fmtP(py)}。</div>
      <div style="${muted}">最小理论频数 = ${fmt(minExp)}。${small ? '<strong style="color:#b45309;">理论频数偏小，建议结合 Fisher 确切概率法。</strong>' : '理论频数通常可支持 Pearson χ²。'}</div>
      <div style="${muted}">OR ≈ ${fmt(or)}。${!Number.isFinite(or) ? '某个格子为 0，普通 OR 不能直接计算，可考虑连续性修正或精确方法。' : ''}</div>`;
    const rows = ['组1', '组2'];
    const cols = ['阳性', '阴性'];
    const tableRows = obs.map((row, i) => row.map((o, j) => `<td style="padding:8px;border:1px solid #cbd5e1;text-align:center;background:#fff;"><div><strong>O=${o}</strong></div><div style="font-size:12px;color:#64748b;">E=${fmt(exp[i][j])}</div><div style="font-size:12px;color:#64748b;">贡献=${fmt(contrib[i][j])}</div></td>`).join(''));
    document.getElementById(`${id}-details`).innerHTML = `<div style="${boxStyle}"><div style="font-weight:700;color:#0f172a;margin-bottom:8px;">观察频数 O、理论频数 E 与 χ² 贡献</div><table style="border-collapse:collapse;width:100%;"><thead><tr><th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;"></th>${cols.map(c => `<th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;">${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr><th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;text-align:left;">${r}</th>${tableRows[i]}</tr>`).join('')}</tbody></table></div>`;
  }
  ['a', 'b', 'c', 'd'].forEach(cell => document.getElementById(`${id}-${cell}`).addEventListener('input', calc));
  document.getElementById(`${id}-calc`).addEventListener('click', calc);
  calc();
}
registerViz('chisq2x2', renderChisq2x2);

function binomPMF(k, n, p) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  const kk = Math.min(k, n - k);
  let logComb = 0;
  for (let i = 1; i <= kk; i++) logComb += Math.log(n - kk + i) - Math.log(i);
  return Math.exp(logComb + k * Math.log(p) + (n - k) * Math.log1p(-p));
}
function exactMcNemarP(b, c) { const n = b + c; if (n === 0) return NaN; const x = Math.min(b, c); let lower = 0; for (let i = 0; i <= x; i++) lower += binomPMF(i, n, 0.5); return Math.min(1, 2 * lower); }

function renderMcNemarGuide(el) {
  const id = 'mcnemar-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '配对四格表：McNemar 检验只看不一致格子';
  const init = { a: Number(el.dataset.a || 35), b: Number(el.dataset.b || 12), c: Number(el.dataset.c || 4), d: Number(el.dataset.d || 49) };
  el.innerHTML = card(title, `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;align-items:start;"><div style="${boxStyle}"><table style="border-collapse:collapse;width:100%;margin-bottom:10px;"><thead><tr><th></th><th>方法B +</th><th>方法B −</th></tr></thead><tbody><tr><th style="text-align:left;">方法A +</th><td><input id="${id}-a" type="number" min="0" step="1" value="${init.a}" style="width:80px;padding:5px;"></td><td><input id="${id}-b" type="number" min="0" step="1" value="${init.b}" style="width:80px;padding:5px;"></td></tr><tr><th style="text-align:left;">方法A −</th><td><input id="${id}-c" type="number" min="0" step="1" value="${init.c}" style="width:80px;padding:5px;"></td><td><input id="${id}-d" type="number" min="0" step="1" value="${init.d}" style="width:80px;padding:5px;"></td></tr></tbody></table></div><div id="${id}-result" style="${boxStyle}"></div></div>`);
  function calc() {
    const a = readNumber(`${id}-a`), b = readNumber(`${id}-b`), c = readNumber(`${id}-c`), d = readNumber(`${id}-d`);
    if ([a, b, c, d].some(v => !isCount(v))) { document.getElementById(`${id}-result`).innerHTML = '<div style="color:#b91c1c;">请输入非负整数频数。</div>'; return; }
    const discordant = b + c;
    const stat = discordant > 0 ? ((b - c) ** 2) / discordant : NaN;
    const yates = discordant > 0 ? ((Math.max(0, Math.abs(b - c) - 1)) ** 2) / discordant : NaN;
    const p = chiSquareP(stat, 1), py = chiSquareP(yates, 1), exact = exactMcNemarP(b, c);
    document.getElementById(`${id}-result`).innerHTML = `<div style="font-weight:700;color:#0f172a;margin-bottom:8px;">读图重点</div><div style="${muted}">一致格子 a=${a}、d=${d} 不决定 McNemar 检验统计量；核心是不一致格子 b=${b} 与 c=${c} 是否对称。</div><div style="${muted}">不校正 χ² = ${fmt(stat)}，P = ${fmtP(p)}。</div><div style="${muted}">连续性校正 χ² = ${fmt(yates)}，P = ${fmtP(py)}。</div><div style="${muted}">精确二项检验 P = ${fmtP(exact)}。${discordant === 0 ? '<strong style="color:#b45309;">没有不一致对子，McNemar 检验不能提供有效差异证据。</strong>' : discordant < 25 ? '<strong style="color:#b45309;">不一致对子较少时更建议报告精确 P 值。</strong>' : ''}</div>`;
  }
  ['a', 'b', 'c', 'd'].forEach(cell => document.getElementById(`${id}-${cell}`).addEventListener('input', calc));
  calc();
}
registerViz('mcnemarguide', renderMcNemarGuide);

function renderChisqResidualHeatmap(el) {
  const title = el.dataset.title || 'R×C 表：用标准化残差定位主要贡献格子';
  const observed = [[28, 14, 8], [18, 22, 10], [10, 18, 22]];
  const rowTotals = observed.map(row => sum(row));
  const colTotals = observed[0].map((_, j) => sum(observed.map(row => row[j])));
  const total = sum(rowTotals);
  const expected = observed.map((row, i) => row.map((_, j) => rowTotals[i] * colTotals[j] / total));
  let chisq = 0;
  const residuals = observed.map((row, i) => row.map((o, j) => { const e = expected[i][j]; chisq += (o - e) ** 2 / e; return (o - e) / Math.sqrt(e); }));
  const df = (observed.length - 1) * (observed[0].length - 1);
  const p = chiSquareP(chisq, df);
  function bg(r) { const a = Math.min(0.85, Math.abs(r) / 3 * 0.85); return r >= 0 ? `rgba(37,99,235,${a})` : `rgba(220,38,38,${a})`; }
  el.innerHTML = card(title, `<div style="${boxStyle};margin-bottom:12px;${muted}">总体 χ² = ${fmt(chisq)}，df = ${df}，P = ${fmtP(p)}。总体检验说明分类分布是否不全相同；标准化残差用于判断哪些格子偏离期望最多。</div><div style="overflow-x:auto;"><table style="border-collapse:collapse;width:100%;min-width:520px;"><thead><tr><th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;"></th><th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;">结局1</th><th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;">结局2</th><th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;">结局3</th></tr></thead><tbody>${observed.map((row, i) => `<tr><th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;text-align:left;">组${i + 1}</th>${row.map((o, j) => { const r = residuals[i][j]; return `<td style="padding:8px;border:1px solid #cbd5e1;text-align:center;background:${bg(r)};color:${Math.abs(r) > 1.6 ? '#fff' : '#0f172a'};"><div><strong>O=${o}</strong></div><div style="font-size:12px;">E=${fmt(expected[i][j])}</div><div style="font-size:12px;">残差=${fmt(r)}</div></td>`; }).join('')}</tr>`).join('')}</tbody></table></div><div style="${boxStyle};margin-top:12px;${muted}">残差为正：观察频数高于理论频数；残差为负：观察频数低于理论频数。绝对值越大，对总体 χ² 的贡献越大。</div>`);
}
registerViz('chisqresidualheatmap', renderChisqResidualHeatmap);
