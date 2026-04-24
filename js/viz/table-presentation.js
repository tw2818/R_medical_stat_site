import { registerViz } from './_core.js';

function renderTableLayoutDemo(el) {
  const id = 'tablelayout-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '三线表成品布局演示';

  const rows = [
    { label: '年龄（岁）', type: 'num', total: '64.3 ± 11.8', groups3: ['62.5 ± 12.1', '58.3 ± 11.5', '71.2 ± 10.8'], groups2: ['60.2 ± 11.6', '68.4 ± 11.1'], p: '0.032' },
    { label: '男性', type: 'cat', total: '113 (56.5%)', groups3: ['35 (50.7%)', '32 (44.1%)', '46 (52.3%)'], groups2: ['51 (51.0%)', '62 (62.0%)'], p: '0.118' },
    { label: '高血压史', type: 'cat', total: '74 (37.0%)', groups3: ['21 (30.4%)', '22 (30.3%)', '31 (35.2%)'], groups2: ['28 (28.0%)', '46 (46.0%)'], p: '0.009' },
    { label: 'BMI（kg/m²）', type: 'num', total: '25.8 ± 3.7', groups3: ['25.1 ± 3.4', '24.8 ± 3.2', '27.3 ± 4.0'], groups2: ['24.9 ± 3.3', '26.7 ± 3.9'], p: '0.004' }
  ];

  el.innerHTML = `
    <div class="viz-card table-demo-card">
      <div class="viz-header">🧾 ${title}</div>
      <div class="table-demo-intro">这个组件不教统计检验本身，而是演示「同一份统计结果如何排成更像样的三线表成品」。</div>
      <div class="table-demo-layout">
        <div class="table-demo-controls">
          <div class="ctrl-group">
            <span class="ctrl-label">分组版式</span>
            <button id="${id}-g2" class="path-tab" type="button">两组</button>
            <button id="${id}-g3" class="path-tab active" type="button">三组</button>
          </div>
          <div class="ctrl-group">
            <span class="ctrl-label">显示选项</span>
            <button id="${id}-total" class="path-tab active" type="button">Total 列</button>
            <button id="${id}-p" class="path-tab active" type="button">P 值</button>
            <button id="${id}-note" class="path-tab active" type="button">脚注</button>
          </div>
        </div>
        <div class="table-demo-body">
          <div id="${id}-summary" class="table-demo-summary"></div>
          <div id="${id}-preview" class="table-demo-preview"></div>
        </div>
      </div>
    </div>`;

  const summary = document.getElementById(`${id}-summary`);
  const preview = document.getElementById(`${id}-preview`);
  const btnG2 = document.getElementById(`${id}-g2`);
  const btnG3 = document.getElementById(`${id}-g3`);
  const btnTotal = document.getElementById(`${id}-total`);
  const btnP = document.getElementById(`${id}-p`);
  const btnNote = document.getElementById(`${id}-note`);

  const state = {
    groups: 3,
    showTotal: true,
    showP: true,
    showNote: true
  };

  function render() {
    btnG2.classList.toggle('active', state.groups === 2);
    btnG3.classList.toggle('active', state.groups === 3);
    btnTotal.classList.toggle('active', state.showTotal);
    btnP.classList.toggle('active', state.showP);
    btnNote.classList.toggle('active', state.showNote);

    const groupHeaders = state.groups === 3
      ? [
          { label: '治疗前', n: 69 },
          { label: '治疗中', n: 72 },
          { label: '治疗后', n: 88 }
        ]
      : [
          { label: '对照组', n: 100 },
          { label: '试验组', n: 100 }
        ];

    const rowsHtml = rows.map(row => {
      const groupValues = (state.groups === 3 ? row.groups3 : row.groups2)
        .map(v => `<td>${v}</td>`)
        .join('');
      return `
        <tr>
          <td class="td-var">${row.label}</td>
          ${state.showTotal ? `<td>${row.total}</td>` : ''}
          ${groupValues}
          ${state.showP ? `<td class="${Number(row.p) < 0.05 ? 'td-psig' : 'td-pns'}">${row.p}</td>` : ''}
        </tr>`;
    }).join('');

    const totalHead = state.showTotal ? '<th>Total</th>' : '';
    const pHead = state.showP ? '<th>P 值</th>' : '';
    const noteHtml = state.showNote
      ? `<div class="table-demo-note"><strong>注：</strong>数值变量一般写作 <code>均值 ± 标准差</code>，分类变量一般写作 <code>n (%)</code>。若表内已有 P 值，脚注中应注明所用统计方法。</div>`
      : '';

    summary.innerHTML = `
      <div class="summary-title">当前排版决策</div>
      <div class="summary-body">
        <div class="summary-item"><span class="summary-key">版式</span><span class="summary-val">${state.groups === 3 ? '三组比较表' : '两组比较表'}</span></div>
        <div class="summary-item"><span class="summary-key">Total 列</span><span class="summary-val">${state.showTotal ? '保留' : '隐藏'}</span></div>
        <div class="summary-item"><span class="summary-key">P 值</span><span class="summary-val">${state.showP ? '保留' : '隐藏'}</span></div>
        <div class="summary-item"><span class="summary-key">脚注</span><span class="summary-val">${state.showNote ? '保留' : '隐藏'}</span></div>
      </div>
      <div class="summary-footer">三线表的重点不是「再算一次统计量」，而是把已经得到的结果整理成结构清楚、脚注规范、投稿时更像样的 Table 1。</div>`;

    preview.innerHTML = `
      <div class="table-demo-shell">
        <div class="table-demo-title">表 1 研究对象基线资料比较</div>
        <table class="table-demo">
          <thead>
            <tr>
              <th class="th-var">变量</th>
              ${totalHead}
              ${groupHeaders.map(g => `<th class="th-group">${g.label}<br><span class="th-n">n=${g.n}</span></th>`).join('')}
              ${pHead}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${noteHtml}
      </div>`;
  }

  btnG2.addEventListener('click', () => { state.groups = 2; render(); });
  btnG3.addEventListener('click', () => { state.groups = 3; render(); });
  btnTotal.addEventListener('click', () => { state.showTotal = !state.showTotal; render(); });
  btnP.addEventListener('click', () => { state.showP = !state.showP; render(); });
  btnNote.addEventListener('click', () => { state.showNote = !state.showNote; render(); });

  render();

  const style = document.createElement('style');
  style.textContent = `
    .table-demo-card{padding:16px;}
    .table-demo-intro{margin:6px 0 14px;text-align:center;font-size:13px;color:#6b7280;line-height:1.6;}
    .table-demo-layout{display:flex;flex-direction:column;gap:14px;}
    .table-demo-controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;}
    .ctrl-group{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
    .ctrl-label{font-size:12px;font-weight:600;color:#374151;margin-right:2px;}
    .path-tab{padding:4px 12px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;font-size:12px;cursor:pointer;transition:all .15s;}
    .path-tab:hover{background:#f3f4f6;}
    .path-tab.active{background:#2c7874;color:#fff;border-color:#2c7874;font-weight:500;}
    .table-demo-body{display:grid;grid-template-columns:220px 1fr;gap:14px;align-items:start;}
    .table-demo-summary{background:#f8f9fb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;}
    .summary-title{font-weight:600;color:#1f2937;margin-bottom:10px;font-size:13px;}
    .summary-body{display:flex;flex-direction:column;gap:6px;}
    .summary-item{display:flex;justify-content:space-between;align-items:center;font-size:12px;}
    .summary-key{color:#6b7280;}
    .summary-val{font-weight:600;color:#1f2937;}
    .summary-footer{margin-top:12px;padding-top:10px;border-top:1px dashed #d1d5db;font-size:11px;color:#9ca3af;line-height:1.7;}
    .table-demo-preview{overflow:hidden;}
    .table-demo-shell{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px 18px;}
    .table-demo-title{font-weight:600;color:#1f2937;text-align:center;margin-bottom:12px;font-size:14px;}
    .table-demo{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;}
    .table-demo thead th{padding:7px 10px;text-align:center;border-top:2px solid #222;border-bottom:1.5px solid #222;background:#fafafa;font-weight:600;color:#1f2937;}
    .table-demo thead th.th-var{text-align:left;border-left:2px solid #222;border-right:2px solid #222;}
    .table-demo thead th.th-group{border-right:1px solid #e5e7eb;}
    .table-demo thead th.th-group:last-of-type{border-right:2px solid #222;}
    .table-demo tbody td{padding:7px 10px;border-bottom:1px solid #ececec;border-right:1px solid #ececec;text-align:center;}
    .table-demo tbody td:first-child{border-left:2px solid #ececec;}
    .table-demo tbody td.td-var{text-align:left;font-weight:500;color:#1f2937;border-left:2px solid #ececec;}
    .table-demo tbody tr:last-child td{border-bottom:2px solid #222;}
    .table-demo tbody tr:last-child td:first-child{border-bottom:2px solid #222;}
    .table-demo .td-var{color:#1f2937;}
    .table-demo .td-psig{color:#c0392b;font-weight:600;}
    .table-demo .td-pns{color:#6b7280;}
    .table-demo-note{margin-top:12px;font-size:12px;color:#555;line-height:1.75;background:#f8f9fb;border-left:3px solid #60a5fa;padding:8px 12px;border-radius:0 6px 6px 0;}
    .table-demo-card code{background:#eef2f7;padding:1px 5px;border-radius:4px;font-size:11px;}
    @media(max-width:640px){
      .table-demo-body{grid-template-columns:1fr;}
      .table-demo-shell{padding:12px;}
      .table-demo{font-size:12px;}
    }
  `;
  el.appendChild(style);
}

registerViz('tablelayoutdemo', renderTableLayoutDemo);

function injectChapter8Widgets() {
  const root = document.getElementById('chapter-content');
  if (!root) return;
  const title = root.querySelector('h1 .chapter-title');
  if (!title || !title.textContent.includes('三线表绘制')) return;

  const detailHeading = Array.from(root.querySelectorAll('h2, h3')).find(node => node.textContent.includes('详细介绍'));
  if (!detailHeading) return;

  if (!root.querySelector('.stat-viz[data-type="baseline-table"]')) {
    const note1 = document.createElement('p');
    note1.textContent = '下方先直接展示一个更贴近论文 Table 1 的三线表成品。它的作用不是再做统计检验，而是让读者先看到“最终交付物应该长什么样”。';
    note1.style.color = '#555';
    note1.style.fontSize = '0.95em';

    const table1 = document.createElement('div');
    table1.className = 'stat-viz';
    table1.dataset.type = 'baseline-table';
    table1.dataset.title = '基线资料三线表示例';
    table1.dataset.groups = '3';
    table1.dataset.labels = '["1995","2000","2005"]';
    table1.dataset.ns = '[431,786,1077]';

    detailHeading.insertAdjacentElement('afterend', note1);
    note1.insertAdjacentElement('afterend', table1);
  }

  if (!root.querySelector('.stat-calc[data-type="tablelayoutdemo"]')) {
    const anchor = root.querySelector('.stat-viz[data-type="baseline-table"]') || detailHeading;
    const note2 = document.createElement('p');
    note2.textContent = '再往下这个组件演示：同一份结果在“两组/三组”“是否保留 Total”“是否显示 P 值”“是否保留脚注”之间切换后，三线表成品会怎样变化。';
    note2.style.color = '#555';
    note2.style.fontSize = '0.95em';

    const demo = document.createElement('div');
    demo.className = 'stat-calc';
    demo.dataset.type = 'tablelayoutdemo';
    demo.dataset.title = '三线表成品布局演示';

    anchor.insertAdjacentElement('afterend', note2);
    note2.insertAdjacentElement('afterend', demo);
  }
}

function setupChapter8Injection() {
  injectChapter8Widgets();
  const root = document.getElementById('chapter-content');
  if (!root) return;
  const observer = new MutationObserver(() => injectChapter8Widgets());
  observer.observe(root, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupChapter8Injection, { once: true });
} else {
  setupChapter8Injection();
}
