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
      <div style="margin:6px 0 12px;text-align:center;font-size:12px;color:#666;">这个组件不教统计检验本身，而是演示“同一份统计结果如何排成更像样的三线表成品”。</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;">
        <button id="${id}-g2" class="path-tab" type="button">两组版式</button>
        <button id="${id}-g3" class="path-tab active" type="button">三组版式</button>
        <button id="${id}-total" class="path-tab active" type="button">显示 Total</button>
        <button id="${id}-p" class="path-tab active" type="button">显示 P 值</button>
        <button id="${id}-note" class="path-tab active" type="button">显示脚注</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;align-items:start;">
        <div id="${id}-summary" style="background:#f8f9fb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;"></div>
        <div id="${id}-preview" style="overflow:auto;"></div>
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
      <div style="font-weight:600;margin-bottom:8px;color:#1f2937;">这张三线表当前的排版决策</div>
      <div style="font-size:13px;line-height:1.8;color:#4b5563;">
        <div>• 当前版式：<strong>${state.groups === 3 ? '三组比较表' : '两组比较表'}</strong></div>
        <div>• Total 列：<strong>${state.showTotal ? '保留' : '隐藏'}</strong></div>
        <div>• P 值列：<strong>${state.showP ? '保留' : '隐藏'}</strong></div>
        <div>• 脚注说明：<strong>${state.showNote ? '保留' : '隐藏'}</strong></div>
      </div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #d1d5db;font-size:12px;color:#6b7280;line-height:1.7;">
        这章的重点不是“再算一次统计量”，而是把已经得到的结果整理成结构清楚、脚注规范、投稿时更像样的 Table 1 / 三线表。
      </div>`;

    preview.innerHTML = `
      <div class="table-demo-shell">
        <div class="table-demo-title">表 1 研究对象基线资料比较</div>
        <table class="table-demo">
          <thead>
            <tr>
              <th style="min-width:180px">变量</th>
              ${totalHead}
              ${groupHeaders.map(g => `<th>${g.label}<br><span style="font-weight:400;font-size:11px;">n=${g.n}</span></th>`).join('')}
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

  btnG2.addEventListener('click', () => {
    state.groups = 2;
    render();
  });
  btnG3.addEventListener('click', () => {
    state.groups = 3;
    render();
  });
  btnTotal.addEventListener('click', () => {
    state.showTotal = !state.showTotal;
    render();
  });
  btnP.addEventListener('click', () => {
    state.showP = !state.showP;
    render();
  });
  btnNote.addEventListener('click', () => {
    state.showNote = !state.showNote;
    render();
  });

  render();

  const style = document.createElement('style');
  style.textContent = `
    .table-demo-shell{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px;}
    .table-demo-title{font-weight:600;color:#1f2937;text-align:center;margin-bottom:10px;}
    .table-demo{width:100%;border-collapse:collapse;font-size:13px;table-layout:auto;}
    .table-demo thead th{padding:8px 10px;text-align:left;border-top:2px solid #333;border-bottom:1.5px solid #333;background:#fafafa;}
    .table-demo tbody td{padding:8px 10px;border-bottom:1px solid #ececec;}
    .table-demo tbody tr:last-child td{border-bottom:2px solid #333;}
    .table-demo .td-var{color:#1f2937;font-weight:500;}
    .table-demo .td-psig{color:#c0392b;font-weight:600;}
    .table-demo .td-pns{color:#4b5563;}
    .table-demo-note{margin-top:10px;font-size:12px;color:#555;line-height:1.7;background:#f8f9fb;border-left:3px solid #60a5fa;padding:8px 10px;}
    .table-demo-card code{background:#eef2f7;padding:1px 5px;border-radius:4px;}
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
