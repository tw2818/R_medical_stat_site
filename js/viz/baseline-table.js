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
  card.className = 'viz-card table1-baseline-card';
  card.style.cssText = 'font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; max-width:960px;';

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

  // 计算 Total 列的值
  const totalN = ns.reduce((a, b) => a + b, 0);
  const calcTotal = (row) => {
    if (row.type === 'num') {
      // 数值变量：加权平均 ± 合并SD
      const parts = row.values.map(v => v.split('±').map(p => parseFloat(p)));
      const wmean = parts.reduce((a, p, i) => a + p[0] * ns[i], 0) / totalN;
      // 合并方差（简化版：加权方差）
      const wvar = parts.reduce((a, p, i) => a + ns[i] * Math.pow(p[1], 2), 0) / totalN;
      const wsd = Math.sqrt(wvar);
      return `${wmean.toFixed(1)}±${wsd.toFixed(1)}`;
    } else {
      // 分类变量：合计 n(%)
      const totals = row.values.map(v => {
        const m = v.match(/^(\d+)/);
        return m ? parseInt(m[1]) : 0;
      });
      const total = totals.reduce((a, b) => a + b, 0);
      const pct = (total / totalN * 100).toFixed(1);
      return `${total}(${pct})`;
    }
  };

  const trs = rows.map(row => {
    const pClass = row.sig ? 'p-sig' : 'p-ns';
    const tooltip = row.note ? `<span class="tbl-note" title="${row.note}">ⓘ</span>` : '';
    const unit = row.unit ? `<span class="tbl-unit">(${row.unit})</span>` : '';
    const valuesTd = row.values.slice(0, groups).map(v => `<td>${v}</td>`).join('');
    return `<tr>
      <td class="tbl-var">${row.var} ${tooltip} ${unit}</td>
      <td>${calcTotal(row)}</td>
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
    .table1-baseline-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;}
    .table1-baseline-card .viz-header{background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:750;}
    .baseline-table{width:100%;border-collapse:collapse;font-size:13.5px;table-layout:fixed;background:#fff;color:#475569;border-top:2px solid #334155;border-bottom:2px solid #334155;}
    .baseline-table thead{border-bottom:1px solid #94a3b8;}
    .baseline-table th{background:#fff;padding:10px 12px;text-align:left;font-weight:750;color:#0f172a;white-space:nowrap;}
    .baseline-table td{padding:9px 12px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-variant-numeric:tabular-nums;}
    .baseline-table .tbl-var{color:#0f172a;min-width:180px;font-weight:600;}
    .baseline-table th:not(.tbl-var),.baseline-table td:not(.tbl-var){text-align:right;min-width:88px;}
    .baseline-table .tbl-unit{color:#94a3b8;font-size:11px;margin-left:3px;font-weight:400;}
    .baseline-table .tbl-note{cursor:help;color:#6366f1;margin-left:3px;font-size:11px;}
    .baseline-table tr:hover td{background:#f8fafc;}
    .baseline-table .tbl-total td{border-top:1px solid #cbd5e1;font-weight:700;background:#f8fafc;color:#0f172a;}
    .p-sig{color:#be123c;font-weight:700;}
    .p-ns{color:#64748b;}
    .tbl-badge{background:#eef2ff;color:#3730a3;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:750;margin-left:auto;}
    .tbl-wrapper{overflow-x:auto;padding:16px 18px 12px;background:#fff;}
    .tbl-footer{margin:0 18px 12px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:12.5px;line-height:1.7;color:#64748b;}
    .tbl-footer p{margin:4px 0;}
    .tbl-formula{background:#eef2ff;color:#3730a3;padding:1px 6px;border-radius:999px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;}
    .tbl-legend{padding:0 18px 16px;font-size:12.5px;color:#64748b;}
    .tbl-legend .p-sig,.tbl-legend .p-ns{font-size:14px;}
  `;
  card.appendChild(style);
}

registerViz('baseline-table', renderBaselineTable);
