import { registerViz } from './_core.js';

const GUIDE_CARDS = {
  'table1-workflow': {
    icon: '📋',
    title: '三线表怎么做：从数据到 Table 1',
    cards: [
      ['明确分组', '先确定 Table 1 的列：治疗组、年份、暴露组或结局组。分组变量决定后续比较方向。', '第一步'],
      ['compareGroups()', '负责计算每个变量的描述统计和组间检验，返回可继续加工的结果对象。', '计算'],
      ['createTable()', '负责组织表格显示方式，例如总体列、P 值、OR/HR、缺失值和小数位。', '排版'],
      ['export2xxx()', '导出到 Word、Excel、HTML、PDF 等格式；发表前仍需按期刊模板微调。', '导出'],
    ],
  },
  'table1-variable-guide': {
    icon: '🔎',
    title: '变量类型决定表格写法',
    cards: [
      ['连续正态', '常用均数（标准差）表示；两组用 t 检验，多组用方差分析。', 'mean (SD)'],
      ['连续偏态', '常用中位数 [Q1; Q3] 表示；检验更接近秩和或 Kruskal-Wallis 思路。', 'median [IQR]'],
      ['分类变量', '先转为因子，再报告 n（%）；常用卡方检验或 Fisher 精确检验。', 'n (%)'],
      ['生存结局', '用 Surv() 包装时间和事件；可进一步显示 HR、95% CI 和 P 值。', 'time-to-event'],
    ],
  },
  'table1-pvalue-guide': {
    icon: '📈',
    title: '表格统计量怎么读：P 值、OR/HR 与注释',
    cards: [
      ['p.overall', '回答“各组总体是否存在差异”。它是筛查组间不平衡的提示，不等于临床重要性。', '整体差异'],
      ['p.ratio', '显示 OR/HR 时的回归检验 P 值，通常围绕参考组或连续变量单位变化解释。', '回归检验'],
      ['OR / HR', '表示效应量方向和大小。写结果时应优先结合 95% CI，而不是只看 P 值。', '效应量'],
      ['表下注释', '说明变量表达方式、检验方法、缩写、缺失值和多重检验校正。', '发表前检查'],
    ],
  },
};

function ensureTable1GuideStyles() {
  if (document.getElementById('table1-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'table1-guide-styles';
  style.textContent = `
    .t1-guide-card{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:960px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .t1-guide-header{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .t1-guide-icon{font-size:18px;line-height:1;}
    .t1-guide-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px;}
    .t1-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 14px;box-shadow:0 2px 8px rgba(15,23,42,.035);min-height:128px;}
    .t1-guide-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:11px;}
    .t1-guide-title{font-size:16px;font-weight:750;line-height:1.35;color:#0f172a;margin:0 0 8px;}
    .t1-guide-desc{font-size:13.5px;line-height:1.7;color:#64748b;margin:0;}
    @media (max-width:980px){.t1-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media (max-width:640px){.t1-guide-grid{grid-template-columns:1fr;}.t1-guide-item{min-height:auto;}}
  `;
  document.head.appendChild(style);
}

function renderTable1Guide(el) {
  ensureTable1GuideStyles();
  const type = el.dataset.type;
  const config = GUIDE_CARDS[type] || GUIDE_CARDS['table1-workflow'];
  const title = el.dataset.title || config.title;
  el.innerHTML = `
    <section class="t1-guide-card" aria-label="${title}">
      <div class="t1-guide-header"><span class="t1-guide-icon">${config.icon}</span><span>${title}</span></div>
      <div class="t1-guide-grid">
        ${config.cards.map(([heading, desc, badge]) => `
          <article class="t1-guide-item">
            <span class="t1-guide-badge">${badge}</span>
            <h4 class="t1-guide-title">${heading}</h4>
            <p class="t1-guide-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

registerViz('table1-workflow', renderTable1Guide);
registerViz('table1-variable-guide', renderTable1Guide);
registerViz('table1-pvalue-guide', renderTable1Guide);
