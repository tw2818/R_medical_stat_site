import { registerViz } from './_core.js';

const STYLE_ID = 'pcareg-guides-style';

const GUIDE_CARDS = {
  'pcreg-workflow-guide': {
    badge: 'workflow',
    icon: 'PCR',
    title: '主成分回归的两步法：先降维，再回归',
    lead: 'PCR = PCA（降维）+ 线性回归（建模）。先把多个相关自变量压缩成少数主成分（得分），再用这些主成分做普通线性回归。',
    steps: [
      ['1. PCA 分解', '对自变量矩阵 X 做主成分分析，得到主成分得分（scores）和载荷（loadings）。'],
      ['2. 选择成分个数', '用交叉验证（CV）、RMSEP 或 R² 决定保留几个主成分。'],
      ['3. 回归建模', '用选定个数的主成分得分作为自变量，对因变量 Y 做普通线性回归。']
    ],
    note: 'PCR 本质上还是回归，只是用 PCA 预处理来解决多重共线性问题。回归系数是在主成分得分尺度上，需要转换才能解释原始变量的效应。'
  },
  'pcreg-pls-tidymodels-guide': {
    badge: 'method comparison',
    icon: 'pls',
    title: 'pls 包 vs tidymodels：简单 vs 标准化工作流',
    lead: '两种方法都能实现主成分回归，各有优劣。pls 简单直接，tidymodels 适合复杂流程和模型管理。',
    steps: [
      ['pls::pcr()', '一行函数搞定 PCA + 回归，直接返回带交叉验证的结果。可用 validationplot() 可视化 RMSEP/R²。'],
      ['tidymodels', '分步构建：recipe（预处理 PCA）+ workflow + tune_grid()。更规范但代码量大。'],
      ['选择建议', '快速探索用 pls，论文报告或复杂项目用 tidymodels（便于复现和分享）。']
    ],
    note: '两种方法结果应一致（都用同样的成分个数和同样的数据）。本章 tidymodels 演示用10折 CV，与 pls 默认一致。'
  },
  'pcreg-ncomp-selection-guide': {
    badge: 'ncomp selection',
    icon: 'k',
    title: '如何选择主成分个数：RMSEP + R² + 可解释性',
    lead: '成分个数太少欠拟合，太多过拟合。需要平衡预测误差和模型复杂度。',
    steps: [
      ['RMSEP（推荐）', '根均方预测误差，交叉验证得到。找最低点对应的成分个数。本章 pls 结果显示 2 成分 RMSE = 34.58，最低。'],
      ['R²', '解释方差比例，越高越好。但 R² 随成分数单调增加，需结合 RMSEP 判断拐点。'],
      ['可解释性', '有时候 2-3 个成分效果接近，选更少的更简单；若载荷难以解释，可尝试不同个数。']
    ],
    note: '不要只看 training R²，要看 validation（交叉验证）的 RMSEP。training R² 随成分数单调增加，是误导性指标。'
  },
  'pcreg-coef-interpretation-guide': {
    badge: 'coef interpretation',
    icon: 'β',
    title: 'PCR 回归系数不在原始变量尺度上',
    lead: 'PCR 的回归系数是针对主成分得分的。要把主成分系数转换回原始变量尺度，才能做有实际意义的解释。',
    steps: [
      ['得分尺度系数', 'pls::coef() 或 lm() 得到的系数，是自变量为 PC1、PC2... 的系数。'],
      ['转换到原始变量', '需要乘以 PCA 载荷矩阵（rotation）才能得到原始变量尺度的系数。'],
      ['解释注意事项', '主成分是多个变量的线性组合，一个主成分的系数不能简单等同于某个原始变量的"单独效应"。']
    ],
    note: '如果主要目的是预测而非解释，用原始尺度的系数也没问题。但如果想解释变量效应，需要做转换后再解释。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .pcreg-guide-card{background:#f6f7fb;border:1px solid #dbe3ef;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .pcreg-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .pcreg-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#0891b2,#0e7490);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 8px 18px rgba(8,145,178,.22);padding:0 8px;}
    .pcreg-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .pcreg-guide-badge{display:inline-block;background:#cffafe;color:#155e75;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .pcreg-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .pcreg-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;}
    .pcreg-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .pcreg-guide-item strong{display:block;color:#0e7490;margin-bottom:6px;}
    .pcreg-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #0891b2;border-radius:10px;padding:10px 12px;}
    @media(max-width:720px){.pcreg-guide-card{padding:14px}.pcreg-guide-head{align-items:flex-start}}
  `;
  document.head.appendChild(style);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function renderGuide(el) {
  ensureStyles();
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['pcreg-workflow-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="pcreg-guide-card">
      <div class="pcreg-guide-head">
        <div class="pcreg-guide-icon">${cfg.icon}</div>
        <div><span class="pcreg-guide-badge">${cfg.badge}</span><h3 class="pcreg-guide-title">${title}</h3></div>
      </div>
      <p class="pcreg-guide-lead">${cfg.lead}</p>
      <div class="pcreg-guide-grid">
        ${cfg.steps.map(([stepTitle, text]) => `<div class="pcreg-guide-item"><strong>${stepTitle}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="pcreg-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('pcreg-workflow-guide', renderGuide);
registerViz('pcreg-pls-tidymodels-guide', renderGuide);
registerViz('pcreg-ncomp-selection-guide', renderGuide);
registerViz('pcreg-coef-interpretation-guide', renderGuide);