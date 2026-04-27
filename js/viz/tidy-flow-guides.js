import { registerViz } from './_core.js';

const GUIDE_CONFIG = {
  'tidy-flow-workflow': {
    icon: '🧭',
    title: 'tidy 流批量检验：从宽表到结果表',
    mode: 'steps',
    items: [
      ['宽表原始数据', '每个患者一行，多个结局变量分散在多列，例如排便困难、生活质量、粪便性状、排便时间。', 'df'],
      ['pivot_longer()', '把多个结局列折叠成“变量”和“积分”两列，让同一套检验代码可以重复用于多个指标。', '整理'],
      ['group_by()', '按变量、组别分层，告诉 rstatix 每一组要单独完成哪些统计检验。', '分组'],
      ['shapiro / levene / t_test', '先查假设，再做比较；输出都是 tibble，方便筛选、合并和导出。', '检验'],
    ],
  },
  'tidy-flow-assumption-guide': {
    icon: '✅',
    title: '批量 t 检验前先看三件事',
    mode: 'checks',
    items: [
      ['变量尺度', 't 检验适合连续型近似正态指标。像粪便性状、排便时间这类等级/计数评分，即使能跑出结果，也要考虑秩和检验。', '先判断'],
      ['正态性', '本例生活质量较接近正态；粪便性状、排便时间明显不满足正态，不能只因为代码方便就机械做 t 检验。', 'Shapiro'],
      ['方差齐性', 'Levene 检验用于判断两组方差是否接近。生活质量 p=0.0514 很接近阈值，解释时应谨慎。', 'Levene'],
      ['多重检验', '一次检验 4 个变量会增加假阳性风险。正式分析可补充 p.adjust(method = "BH") 或预先指定主要结局。', 'p.adjust'],
    ],
  },
  'tidy-flow-result-guide': {
    icon: '📊',
    title: '本例结果怎么读：先假设，后结论',
    mode: 'results',
    rows: [
      ['粪便性状', '不满足', '通过', '0.723', '更适合考虑秩和检验或有序资料方法'],
      ['排便困难', '两组均偏离', '通过', '0.929', 't 检验可演示流程，正式报告需说明假设问题'],
      ['排便时间', '不满足', '通过', '0.786', '等级/计数特征明显，优先考虑非参数方法'],
      ['生活质量', '较接近', '临界', '0.920', '最接近 t 检验适用场景，但方差齐性接近阈值'],
    ],
  },
};

function ensureTidyFlowStyles() {
  if (document.getElementById('tidy-flow-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'tidy-flow-guide-styles';
  style.textContent = `
    .tidy-flow-card{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:980px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .tidy-flow-header{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .tidy-flow-icon{font-size:18px;line-height:1;}
    .tidy-flow-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px;}
    .tidy-flow-item{position:relative;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 14px;box-shadow:0 2px 8px rgba(15,23,42,.035);min-height:138px;}
    .tidy-flow-item:not(:last-child)::after{content:'→';position:absolute;right:-12px;top:45%;color:#94a3b8;font-weight:800;z-index:2;}
    .tidy-flow-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:11px;}
    .tidy-flow-title{font-size:16px;font-weight:750;line-height:1.35;color:#0f172a;margin:0 0 8px;}
    .tidy-flow-desc{font-size:13.5px;line-height:1.7;color:#64748b;margin:0;}
    .tidy-flow-checks .tidy-flow-item:not(:last-child)::after{content:'';display:none;}
    .tidy-flow-checks .tidy-flow-badge{background:#ecfeff;color:#155e75;}
    .tidy-flow-table-wrap{padding:14px;overflow-x:auto;}
    .tidy-flow-table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border-top:2px solid #334155;border-bottom:2px solid #334155;box-shadow:0 2px 8px rgba(15,23,42,.035);}
    .tidy-flow-table th{font-size:13px;color:#334155;font-weight:750;text-align:left;padding:11px 12px;border-bottom:1px solid #cbd5e1;background:#f8fafc;white-space:nowrap;}
    .tidy-flow-table td{font-size:13.2px;color:#475569;line-height:1.55;padding:11px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;}
    .tidy-flow-table tr:last-child td{border-bottom:0;}
    .tidy-flow-pill{display:inline-block;padding:3px 8px;border-radius:999px;background:#f1f5f9;color:#475569;font-weight:650;white-space:nowrap;}
    .tidy-flow-pill.warn{background:#fff7ed;color:#9a3412;}
    .tidy-flow-pill.ok{background:#ecfdf5;color:#047857;}
    .tidy-flow-footnote{font-size:12.5px;line-height:1.7;color:#64748b;margin:10px 16px 16px;}
    @media (max-width:980px){.tidy-flow-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.tidy-flow-item::after{display:none;}}
    @media (max-width:640px){.tidy-flow-grid{grid-template-columns:1fr;}.tidy-flow-item{min-height:auto;}.tidy-flow-table th,.tidy-flow-table td{font-size:12.5px;padding:9px 10px;}}
  `;
  document.head.appendChild(style);
}

function renderTidyFlowGrid(el, config) {
  const checkClass = config.mode === 'checks' ? ' tidy-flow-checks' : '';
  el.innerHTML = `
    <section class="tidy-flow-card${checkClass}" aria-label="${config.title}">
      <div class="tidy-flow-header"><span class="tidy-flow-icon">${config.icon}</span><span>${config.title}</span></div>
      <div class="tidy-flow-grid">
        ${config.items.map(([heading, desc, badge]) => `
          <article class="tidy-flow-item">
            <span class="tidy-flow-badge">${badge}</span>
            <h4 class="tidy-flow-title">${heading}</h4>
            <p class="tidy-flow-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function pillClass(text) {
  if (text.includes('通过') || text.includes('接近')) return 'ok';
  return 'warn';
}

function renderTidyFlowResults(el, config) {
  el.innerHTML = `
    <section class="tidy-flow-card" aria-label="${config.title}">
      <div class="tidy-flow-header"><span class="tidy-flow-icon">${config.icon}</span><span>${config.title}</span></div>
      <div class="tidy-flow-table-wrap">
        <table class="tidy-flow-table">
          <thead><tr><th>变量</th><th>正态性</th><th>方差齐性</th><th>t_test P</th><th>教学解读</th></tr></thead>
          <tbody>
            ${config.rows.map(([name, normality, variance, p, note]) => `
              <tr>
                <td><strong>${name}</strong></td>
                <td><span class="tidy-flow-pill ${pillClass(normality)}">${normality}</span></td>
                <td><span class="tidy-flow-pill ${pillClass(variance)}">${variance}</span></td>
                <td>${p}</td>
                <td>${note}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p class="tidy-flow-footnote">提示：批量检验输出整洁，不代表每一行都自动满足模型假设；正式报告时应结合变量类型、预设主要结局和多重检验校正。</p>
    </section>
  `;
}

function renderTidyFlowGuide(el) {
  ensureTidyFlowStyles();
  const config = GUIDE_CONFIG[el.dataset.type] || GUIDE_CONFIG['tidy-flow-workflow'];
  config.mode === 'results' ? renderTidyFlowResults(el, config) : renderTidyFlowGrid(el, config);
}

registerViz('tidy-flow-workflow', renderTidyFlowGuide);
registerViz('tidy-flow-assumption-guide', renderTidyFlowGuide);
registerViz('tidy-flow-result-guide', renderTidyFlowGuide);
