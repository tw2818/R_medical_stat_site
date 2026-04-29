import { registerViz } from './_core.js';

const STYLE_ID = 'factoranalysis-guides-style';

const GUIDE_CARDS = {
  'fa-vs-pca-guide': {
    badge: 'FA vs PCA',
    icon: '⊕',
    title: '因子分析 vs 主成分分析',
    lead: 'PCA提取主成分；FA提取潜在因子。PCA分解总方差；FA建模共享方差（公因子方差）。需要降维时用PCA，需要探索潜在结构时用FA。',
    steps: [
      ['PCA', '主成分分析分解总方差，第一成分解释最大方差'],
      ['FA', '因子分析分解共享方差，需要先估计公因子方差(communality)'],
      ['选择', '需要降维时用PCA，需要探索潜在结构时用FA']
    ],
    note: 'PCA是"提取"，FA是"建模"——FA更接近验证性因子分析(CFA)'
  },
  'nfactors-guide': {
    badge: 'n_factors',
    icon: 'K',
    title: '如何确定因子数量',
    lead: '因子数量没有绝对标准，需要结合多种方法综合判断。',
    steps: [
      ['Kaiser', '特征值>1的因子（默认方法，但可能高估）'],
      ['碎石图', '找"拐点"，陡峭下降前的主成分'],
      ['平行分析', '与随机数据特征值比较'],
      ['MAP/BIC', '最小平均偏相关/贝叶斯信息准则']
    ],
    note: '本章多种方法均建议3个因子，最终选择4个以便与原书一致'
  },
  'extraction-guide': {
    badge: 'fm',
    icon: '∑',
    title: '因子提取方法',
    lead: 'fm参数选择提取公共因子的计算方法，不同方法假设不同、结果略有差异。',
    steps: [
      ['ml', '最大似然法，假设多元正态分布'],
      ['pa', '主轴迭代法，迭代估计公因子方差'],
      ['minres', '最小残差法，加权最小二乘（默认）'],
      ['wls/gls', '加权/广义最小二乘']
    ],
    note: '不同方法结果通常相似，若结果不稳定需检查数据质量'
  },
  'rotation-guide': {
    badge: 'rotate',
    icon: '⟳',
    title: '因子旋转方法',
    lead: '旋转让因子载荷更易解释，使每个变量在少数因子上有高载荷。',
    steps: [
      ['none', '不旋转，保持因子正交'],
      ['varimax', '正交旋转，最大化载荷方差（最常用）'],
      ['promax', '斜交旋转，允许因子相关'],
      ['oblimin', '斜交旋转，广义版本']
    ],
    note: '正交旋转因子间相关系数为0；斜交旋转允许相关，结果解读需同时看载荷和因子相关矩阵'
  },
  'loading-interpretation-guide': {
    badge: 'loadings',
    icon: '⊤',
    title: '因子载荷矩阵解读',
    lead: '载荷矩阵是因子分析的核心输出，每行代表一个变量，每列代表一个因子。',
    steps: [
      ['loadings', '载荷值，绝对值越大相关性越强（>0.4通常认为显著）'],
      ['h2', '公因子方差/共性方差，变量被因子解释的比例'],
      ['u2', '独特性，u2=1-h2，不能被因子解释的比例'],
      ['complexity', '复杂性，变量在多少个因子上有实质载荷']
    ],
    note: 'h2越接近1说明该变量越能被因子结构解释；u2过高可能需要更多因子'
  },
  'model-fit-guide': {
    badge: 'fit',
    icon: 'χ²',
    title: '模型拟合指标',
    lead: '因子分析也是假设检验，需要评估模型与数据的匹配程度。',
    steps: [
      ['TLI', '>0.9可接受，>0.95优秀（Tucker-Lewis指数）'],
      ['RMSEA', '<0.05良好，<0.08可接受（均方误差近似）'],
      ['BIC', '越小越好（贝叶斯信息准则）'],
      ['RMSR', '残差均方根，越小越好']
    ],
    note: '卡方检验对大样本敏感，大样本时p值总是显著；优先看TLI和RMSEA'
  },
  'factor-scores-guide': {
    badge: 'scores',
    icon: '→z',
    title: '因子得分',
    lead: '因子得分是每个样本在各个因子上的标准化得分（均值0，标准差1）。',
    steps: [
      ['scores', 'fa$scores获取因子得分矩阵'],
      ['regression', 'Thomson回归法（默认），快速但有误差'],
      ['Bartlett', 'Bartlett精确得分'],
      ['Anderson', 'Anderson修正得分']
    ],
    note: '因子得分可用于后续分析（回归、聚类等），但会引入测量误差'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .factoranalysis-guide-card{background:#f6f7fb;border:1px solid #dbe3ef;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .factoranalysis-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .factoranalysis-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 8px 18px rgba(8,145,178,.22);padding:0 8px;}
    .factoranalysis-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .factoranalysis-guide-badge{display:inline-block;background:#cffafe;color:#155e75;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .factoranalysis-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .factoranalysis-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;}
    .factoranalysis-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .factoranalysis-guide-item strong{display:block;color:#155e75;margin-bottom:6px;}
    .factoranalysis-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #0891b2;border-radius:10px;padding:10px 12px;}
    @media(max-width:720px){.factoranalysis-guide-card{padding:14px}.factoranalysis-guide-head{align-items:flex-start}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['fa-vs-pca-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="factoranalysis-guide-card">
      <div class="factoranalysis-guide-head">
        <div class="factoranalysis-guide-icon">${cfg.icon}</div>
        <div><span class="factoranalysis-guide-badge">${cfg.badge}</span><h3 class="factoranalysis-guide-title">${title}</h3></div>
      </div>
      <p class="factoranalysis-guide-lead">${cfg.lead}</p>
      <div class="factoranalysis-guide-grid">
        ${cfg.steps.map(([stepTitle, text]) => `<div class="factoranalysis-guide-item"><strong>${stepTitle}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="factoranalysis-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('fa-vs-pca-guide', renderGuide);
registerViz('nfactors-guide', renderGuide);
registerViz('extraction-guide', renderGuide);
registerViz('rotation-guide', renderGuide);
registerViz('loading-interpretation-guide', renderGuide);
registerViz('model-fit-guide', renderGuide);
registerViz('factor-scores-guide', renderGuide);