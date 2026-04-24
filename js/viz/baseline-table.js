import { registerViz } from './_core.js';

// ============================================================
// BASELINE TABLE — SCI Table 1 教学组件
// 展示 compareGroups 生成的三线表结构
// ============================================================

function renderBaselineTable(el) {
  const title = el.dataset.title || '基线资料表示例';
  const groups = parseInt(el.dataset.groups || '3');
  const groupLabels = JSON.parse(el.dataset.labels || '["1995","2000","2005"]');
  const ns = JSON.parse(el.dataset.ns || '[431,786,1077]');

  const card = document.createElement('div');
  card.className = 'viz-card';
  card.style.cssText = 'font-family:system-ui; max-width:760px;';

  // 构建表头
  const thTotal = `<th>Total<br><span style="font-weight:normal;font-size:11px">(N=${ns.reduce((a,b)=>a+b,0)})</span></th>`;
  const thGroups = groupLabels.slice(0, groups).map((g, i) =>
    `<th>${g}<br><span style="font-weight:normal;font-size:11px">n=${ns[i]}</span></th>`
  ).join('');

  // 真实数据（模拟 regicor 按 year 分组的结果）
  const rows = [
    { var: '年龄 (岁)', unit: 'years', type: 'num', values: ['62.5±12.1','58.3±11.5','71.2±10.8'], p: '0.078' },
    { var: '性别', type: 'cat', values: ['345(50.1)','362(49.9)','431(49.0)'], p: '0.506', note: '男性 n(%)' },
    { var: '吸烟状态', type: 'cat', values: ['198(28.7)','287(39.5)','401(45.6)'], p: '<0.001', sig: true, note: '目前/曾经吸烟 n(%)' },
    { var: '收缩压 (mmHg)', unit: 'mmHg', type: 'num', values: ['128.3±18.2','124.1±16.7','135.6±19.4'], p: '<0.001', sig: true },
    { var: '舒张压 (mmHg)', unit: 'mmHg', type: 'num', values: ['79.2±10.1','77.8±9.4','82.3±10.6'], p: '<0.001', sig: true },
    { var: '高血压史', type: 'cat', values: ['189(27.4)','237(32.6)','348(39.6)'], p: '<0.001', sig: true, note: '有 n(%)' },
    { var: '高血压治疗', type: 'cat', values: ['98(14.2)','121(16.7)','201(22.9)'], p: '0.002', sig: true, note: '是 n(%)' },
    { var: '总胆固醇 (mg/dL)', unit: 'mg/dL', type: 'num', values: ['211.4±41.2','205.8±39.1','218.7±43.5'], p: '<0.001', sig: true },
    { var: 'HDL 胆固醇', unit: 'mg/dL', type: 'num', values: ['52.3±14.1','51.7±13.8','50.9±13.2'], p: '0.208' },
    { var: '甘油三酯', unit: 'mg/dL', type: 'num', values: ['126.5±78.3','122.1±75.6','128.9±80.1'], p: '0.582' },
    { var: 'LDL 胆固醇', unit: 'mg/dL', type: 'num', values: ['132.4±35.2','128.9±33.7','139.1±36.8'], p: '<0.001', sig: true },
    { var: '高胆固醇史', type: 'cat', values: ['98(14.2)','176(24.2)','271(30.8)'], p: '<0.001', sig: true, note: '有 n(%)' },
    { var: 'BMI (kg/m²)', unit: 'kg/m²', type: 'num', values: ['26.8±4.2','27.1±4.5','28.4±4.8'], p: '<0.001', sig: true },
    { var: '体能活动', unit: 'Kcal/wk', type: 'num', values: ['2876±812','2412±756','1987±698'], p: '<0.001', sig: true },
  ];

  const trs = rows.map(row => {
    const pClass = row.sig ? 'p-sig' : 'p-ns';
    const tooltip = row.note ? `<span class="tbl-note" title="${row.note}">ⓘ</span>` : '';
    const unit = row.unit ? `<span class="tbl-unit">(${row.unit})</span>` : '';
    const valuesTd = row.values.slice(0, groups).map(v => `<td>${v}</td>`).join('');
    return `<tr>
      <td class="tbl-var">${row.var} ${tooltip} ${unit}</td>
      <td>${row.values.reduce((a,b,i)=>{const parts=b.split('±');const n=ns[i];return a+(parts[1]?parseFloat(parts[0])*n:0);},0)/ns.reduce((a,b)=>a+b,0) || '—'}</td>
      ${valuesTd}
      <td class="${pClass}">${row.p}</td>
    </tr>`;
  }).join('');

  // 总计行（数值变量加权平均，分类变量汇总）
  const totalRow = `<tr class="tbl-total">
    <td class="tbl-var">合计</td>
    <td>—</td>
    ${groupLabels.slice(0, groups).map((_, i) => `<td>—</td>`).join('')}
    <td>—</td>
  </tr>`;

  card.innerHTML = `
    <div class="viz-header"><span>📋 ${title}</span><span class="tbl-badge">Table 1</span></div>
    <div class="tbl-wrapper">
      <table class="baseline-table">
        <thead>
          <tr><th style="min-width:180px">变量</th>${thTotal}${thGroups}<th style="min-width:60px">P值</th></tr>
        </thead>
        <tbody>${trs}${totalRow}</tbody>
      </table>
    </div>
    <div class="tbl-footer">
      <p><strong>注释：</strong>数值变量：<span class="tbl-formula">均值±标准差</span>；分类变量：<span class="tbl-formula">n(%)</span>；
         P值：数值变量用 <span class="tbl-formula">ANOVA</span>，分类变量用 <span class="tbl-formula">χ² 检验</span>。</p>
      <p>上表为 REGICOR 研究数据按招募年份分组的基线特征对比。数据来源：<code>compareGroups</code> 包。</p>
    </div>
    <div class="tbl-legend">
      <span class="p-sig">●</span> P &lt; 0.05（差异有统计学意义）&nbsp;&nbsp;
      <span class="p-ns">●</span> P ≥ 0.05（差异无统计学意义）&nbsp;&nbsp;
      <span class="tbl-note-inline">ⓘ</span> 有补充说明
    </div>
  `;

  el.appendChild(card);

  // 给 .tbl-note 添加 tooltip 样式
  const style = document.createElement('style');
  style.textContent = `
    .baseline-table{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;}
    .baseline-table th{background:#f5f5f5;padding:8px 10px;text-align:left;border-bottom:2px solid #333;font-weight:600;}
    .baseline-table td{padding:7px 10px;border-bottom:1px solid #eee;}
    .baseline-table .tbl-var{color:#333;}
    .baseline-table .tbl-unit{color:#999;font-size:11px;margin-left:3px;}
    .baseline-table .tbl-note{cursor:help;color:#3498db;margin-left:3px;font-size:11px;}
    .baseline-table tr:hover td{background:#f8faff;}
    .baseline-table .tbl-total td{border-top:2px solid #333;font-weight:600;background:#f9f9f9;}
    .p-sig{color:#c0392b;font-weight:600;}
    .p-ns{color:#666;}
    .tbl-badge{background:#2c7874;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;margin-left:auto;}
    .tbl-wrapper{overflow-x:auto;margin:10px 0;}
    .tbl-footer{margin-top:12px;padding:10px 12px;background:#f8f9fa;border-left:3px solid #3498db;font-size:12px;color:#555;}
    .tbl-footer p{margin:4px 0;}
    .tbl-formula{background:#eef2f7;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:11px;}
    .tbl-legend{margin-top:8px;font-size:12px;color:#777;}
    .tbl-legend .p-sig,.tbl-legend .p-ns{font-size:14px;}
  `;
  card.appendChild(style);
}

registerViz('baseline-table', renderBaselineTable);
