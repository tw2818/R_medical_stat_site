import { registerViz } from './_core.js';

const boxStyle = 'border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;padding:12px;box-shadow:0 1px 2px rgba(15,23,42,.04);';
const muted = 'color:#64748b;font-size:13px;line-height:1.6;';
const badge = 'display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;margin-right:6px;';
const grid = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:stretch;';

function card(title, body) {
  return `<div class="viz-card"><div class="viz-header"><span>🧾 ${title}</span></div><div style="padding:14px;background:#f8fafc;">${body}</div></div>`;
}

function injectStyleOnce(id, css) {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

function renderTableChoiceGuide(el) {
  const title = el.dataset.title || '三线表制作流程：先统计，后排版';
  el.innerHTML = card(title, `<div style="${grid}">
    <div style="${boxStyle}"><span style="${badge}">1 数据结构</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">每行一个研究对象</div><div style="${muted}">先整理分组变量、连续变量、分类变量。三线表不是手工拼数，而是对整洁数据的汇总呈现。</div></div>
    <div style="${boxStyle}"><span style="${badge}">2 描述方式</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">按变量类型选格式</div><div style="${muted}">近似正态连续变量常用均值±标准差；偏态变量常用中位数[IQR]；分类变量用 n(%)。</div></div>
    <div style="${boxStyle}"><span style="${badge}">3 检验方法</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">P 值必须和变量类型匹配</div><div style="${muted}">t 检验/ANOVA、Wilcoxon/Kruskal-Wallis、χ²/Fisher 等应在脚注中说明，不应只写一个 P 值列。</div></div>
    <div style="${boxStyle}"><span style="${badge}">4 排版交付</span><div style="font-weight:700;color:#0f172a;margin:8px 0;">表头、脚注、单位一致</div><div style="${muted}">三线表强调清晰和可复现。Total 列、缺失值、单位、统计方法和缩写都应交代清楚。</div></div>
  </div>`);
}
registerViz('tablechoiceguide', renderTableChoiceGuide);

function renderTableVariableGuide(el) {
  const title = el.dataset.title || 'Table 1 变量怎么写';
  el.innerHTML = card(title, `<div style="overflow-x:auto;"><table class="table-guide"><thead><tr><th>变量类型</th><th>推荐呈现</th><th>常用检验</th><th>脚注提醒</th></tr></thead><tbody>
    <tr><td>连续变量，近似正态</td><td>均值 ± 标准差</td><td>t 检验 / ANOVA</td><td>写明 mean ± SD</td></tr>
    <tr><td>连续变量，偏态</td><td>中位数 [Q1, Q3]</td><td>Wilcoxon / Kruskal-Wallis</td><td>写明 median [IQR]</td></tr>
    <tr><td>分类变量</td><td>n (%)</td><td>χ² 检验 / Fisher 确切法</td><td>百分比通常按列百分比计算</td></tr>
    <tr><td>有序分类变量</td><td>n (%) 或中位等级</td><td>趋势检验 / 秩和检验</td><td>说明等级方向和 score</td></tr>
    <tr><td>缺失值</td><td>Missing, n (%)</td><td>通常不参与主检验</td><td>说明每个变量的有效样本量</td></tr>
  </tbody></table></div>`);
  injectStyleOnce('table3-guide-style', `.table-guide{width:100%;border-collapse:collapse;font-size:13px;background:#fff}.table-guide th{padding:8px 10px;border-top:2px solid #222;border-bottom:1.5px solid #222;text-align:left;background:#f8fafc}.table-guide td{padding:8px 10px;border-bottom:1px solid #e5e7eb}.table-guide tr:last-child td{border-bottom:2px solid #222}`);
}
registerViz('tablevariableguide', renderTableVariableGuide);

function renderTableFootnoteGuide(el) {
  const title = el.dataset.title || '三线表脚注检查清单';
  el.innerHTML = card(title, `<div style="${grid}">
    <div style="${boxStyle}"><span style="${badge}">单位</span><div style="${muted};margin-top:8px;">年龄、BMI、血压、实验室指标应在变量名或脚注中写清单位。</div></div>
    <div style="${boxStyle}"><span style="${badge}">统计量</span><div style="${muted};margin-top:8px;">说明连续变量是 mean±SD 还是 median[IQR]，分类变量是否为 n(%）。</div></div>
    <div style="${boxStyle}"><span style="${badge}">P 值</span><div style="${muted};margin-top:8px;">说明每类变量采用的检验方法，必要时说明 Fisher、校正方法或非参数检验。</div></div>
    <div style="${boxStyle}"><span style="${badge}">缺失与缩写</span><div style="${muted};margin-top:8px;">交代缺失值处理和所有缩写含义，避免读者必须回正文猜测。</div></div>
  </div>`);
}
registerViz('tablefootnoteguide', renderTableFootnoteGuide);

function renderTableLayoutDemo(el) {
  const id = 'tablelayout-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '三线表成品布局演示';

  const rows = [
    { label: '年龄（岁）', type: 'num', total: '64.3 ± 11.8', groups3: ['62.5 ± 12.1', '58.3 ± 11.5', '71.2 ± 10.8'], groups2: ['60.2 ± 11.6', '68.4 ± 11.1'], p: '0.032', method: 'ANOVA/t 检验' },
    { label: '男性', type: 'cat', total: '113 (56.5%)', groups3: ['35 (50.7%)', '32 (44.1%)', '46 (52.3%)'], groups2: ['51 (51.0%)', '62 (62.0%)'], p: '0.118', method: 'χ² 检验' },
    { label: '高血压史', type: 'cat', total: '74 (37.0%)', groups3: ['21 (30.4%)', '22 (30.3%)', '31 (35.2%)'], groups2: ['28 (28.0%)', '46 (46.0%)'], p: '0.009', method: 'χ² 检验' },
    { label: 'BMI（kg/m²）', type: 'num', total: '25.8 ± 3.7', groups3: ['25.1 ± 3.4', '24.8 ± 3.2', '27.3 ± 4.0'], groups2: ['24.9 ± 3.3', '26.7 ± 3.9'], p: '0.004', method: 'ANOVA/t 检验' }
  ];

  el.innerHTML = `
    <div class="viz-card table-demo-card">
      <div class="viz-header">🧾 ${title}</div>
      <div class="table-demo-intro">这个组件演示同一份统计结果如何排成更像论文 Table 1 的三线表。重点是排版决策、脚注和解释边界。</div>
      <div class="table-demo-layout">
        <div class="table-demo-controls">
          <div class="ctrl-group"><span class="ctrl-label">分组版式</span><button id="${id}-g2" class="path-tab" type="button">两组</button><button id="${id}-g3" class="path-tab active" type="button">三组</button></div>
          <div class="ctrl-group"><span class="ctrl-label">显示选项</span><button id="${id}-total" class="path-tab active" type="button">Total 列</button><button id="${id}-p" class="path-tab active" type="button">P 值</button><button id="${id}-note" class="path-tab active" type="button">脚注</button></div>
        </div>
        <div class="table-demo-body"><div id="${id}-summary" class="table-demo-summary"></div><div id="${id}-preview" class="table-demo-preview"></div></div>
      </div>
    </div>`;

  const summary = document.getElementById(`${id}-summary`);
  const preview = document.getElementById(`${id}-preview`);
  const btnG2 = document.getElementById(`${id}-g2`);
  const btnG3 = document.getElementById(`${id}-g3`);
  const btnTotal = document.getElementById(`${id}-total`);
  const btnP = document.getElementById(`${id}-p`);
  const btnNote = document.getElementById(`${id}-note`);
  const state = { groups: 3, showTotal: true, showP: true, showNote: true };

  function render() {
    btnG2.classList.toggle('active', state.groups === 2);
    btnG3.classList.toggle('active', state.groups === 3);
    btnTotal.classList.toggle('active', state.showTotal);
    btnP.classList.toggle('active', state.showP);
    btnNote.classList.toggle('active', state.showNote);
    const groupHeaders = state.groups === 3 ? [{ label: '治疗前', n: 69 }, { label: '治疗中', n: 72 }, { label: '治疗后', n: 88 }] : [{ label: '对照组', n: 100 }, { label: '试验组', n: 100 }];
    const rowsHtml = rows.map(row => {
      const groupValues = (state.groups === 3 ? row.groups3 : row.groups2).map(v => `<td>${v}</td>`).join('');
      return `<tr><td class="td-var">${row.label}</td>${state.showTotal ? `<td>${row.total}</td>` : ''}${groupValues}${state.showP ? `<td class="${Number(row.p) < 0.05 ? 'td-psig' : 'td-pns'}">${row.p}</td>` : ''}</tr>`;
    }).join('');
    const noteHtml = state.showNote ? `<div class="table-demo-note"><strong>注：</strong>数值变量写作 mean ± SD，分类变量写作 n (%)。P 值方法：连续变量使用 t 检验/ANOVA，分类变量使用 χ² 检验或 Fisher 确切法；具体以数据分布和理论频数条件为准。</div>` : '';
    summary.innerHTML = `<div class="summary-title">当前排版决策</div><div class="summary-body"><div class="summary-item"><span class="summary-key">版式</span><span class="summary-val">${state.groups === 3 ? '三组比较表' : '两组比较表'}</span></div><div class="summary-item"><span class="summary-key">Total 列</span><span class="summary-val">${state.showTotal ? '保留' : '隐藏'}</span></div><div class="summary-item"><span class="summary-key">P 值</span><span class="summary-val">${state.showP ? '保留' : '隐藏'}</span></div><div class="summary-item"><span class="summary-key">脚注</span><span class="summary-val">${state.showNote ? '保留' : '隐藏'}</span></div></div><div class="summary-footer">Table 1 通常用于描述基线资料。P 值可辅助判断组间不平衡，但不应被当作随机化质量的唯一标准。</div>`;
    preview.innerHTML = `<div class="table-demo-shell"><div class="table-demo-title">表 1 研究对象基线资料比较</div><table class="table-demo"><thead><tr><th class="th-var">变量</th>${state.showTotal ? '<th>Total</th>' : ''}${groupHeaders.map(g => `<th class="th-group">${g.label}<br><span class="th-n">n=${g.n}</span></th>`).join('')}${state.showP ? '<th>P 值</th>' : ''}</tr></thead><tbody>${rowsHtml}</tbody></table>${noteHtml}</div>`;
  }
  btnG2.addEventListener('click', () => { state.groups = 2; render(); });
  btnG3.addEventListener('click', () => { state.groups = 3; render(); });
  btnTotal.addEventListener('click', () => { state.showTotal = !state.showTotal; render(); });
  btnP.addEventListener('click', () => { state.showP = !state.showP; render(); });
  btnNote.addEventListener('click', () => { state.showNote = !state.showNote; render(); });
  render();
  injectStyleOnce('table-demo-style', `
    .table-demo-card{padding:16px}.table-demo-intro{margin:6px 0 14px;text-align:center;font-size:13px;color:#6b7280;line-height:1.6}.table-demo-layout{display:flex;flex-direction:column;gap:14px}.table-demo-controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px}.ctrl-group{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.ctrl-label{font-size:12px;font-weight:600;color:#374151}.path-tab{padding:4px 12px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;font-size:12px;cursor:pointer}.path-tab.active{background:#2c7874;color:#fff;border-color:#2c7874;font-weight:500}.table-demo-body{display:grid;grid-template-columns:220px 1fr;gap:14px;align-items:start}.table-demo-summary{background:#f8f9fb;border:1px solid #e5e7eb;border-radius:10px;padding:14px}.summary-title{font-weight:600;color:#1f2937;margin-bottom:10px;font-size:13px}.summary-item{display:flex;justify-content:space-between;font-size:12px}.summary-key{color:#6b7280}.summary-val{font-weight:600;color:#1f2937}.summary-footer{margin-top:12px;padding-top:10px;border-top:1px dashed #d1d5db;font-size:11px;color:#6b7280;line-height:1.7}.table-demo-preview{overflow-x:auto}.table-demo-shell{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px 18px}.table-demo-title{font-weight:600;color:#1f2937;text-align:center;margin-bottom:12px;font-size:14px}.table-demo{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed}.table-demo thead th{padding:7px 10px;text-align:center;border-top:2px solid #222;border-bottom:1.5px solid #222;background:#fafafa;font-weight:600;color:#1f2937}.table-demo thead th.th-var{text-align:left}.table-demo tbody td{padding:7px 10px;border-bottom:1px solid #ececec;text-align:center}.table-demo tbody td.td-var{text-align:left;font-weight:500;color:#1f2937}.table-demo tbody tr:last-child td{border-bottom:2px solid #222}.table-demo .td-psig{color:#c0392b;font-weight:600}.table-demo .td-pns{color:#6b7280}.table-demo-note{margin-top:12px;font-size:12px;color:#555;line-height:1.75;background:#f8f9fb;border-left:3px solid #60a5fa;padding:8px 12px;border-radius:0 6px 6px 0}@media(max-width:640px){.table-demo-body{grid-template-columns:1fr}.table-demo-shell{padding:12px}.table-demo{font-size:12px}}
  `);
}

registerViz('tablelayoutdemo', renderTableLayoutDemo);
