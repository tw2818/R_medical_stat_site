import { registerViz } from './_core.js';

const STYLE_ID = 'pssc-guides-style';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .pssc-guide-card{background:#f8f9fa;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .pssc-guide-badge{display:inline-block;background:#ede9fe;color:#6d28d9;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:8px;}
    .pssc-guide-title{font-size:17px;font-weight:700;color:#1e293b;margin:0 0 10px;}
    .pssc-guide-body{color:#475569;line-height:1.8;font-size:14px;}
    @media(max-width:720px){.pssc-guide-card{padding:14px}}
  `;
  document.head.appendChild(style);
}

function renderGuide(el, cfg) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="pssc-guide-card">
      <div class="pssc-guide-badge">${escapeHtml(cfg.badge)}</div>
      <div class="pssc-guide-title">${title}</div>
      <div class="pssc-guide-body">${cfg.body || ''}</div>
    </div>
  `;
}

const GUIDE_CARDS = {
  'pssc-workflow-guide': {
    badge: 'workflow',
    title: '倾向性评分的工作流程',
    body: '倾向性评分(PS)是控制混杂因素的核心方法。工作流程：①选择混杂因素建立logistic模型 → ②计算每个个体的PS值 → ③检验PS分布重叠（共同支持域）→ ④根据研究目的选择应用方式：PS回归调整、PS分层、PS匹配或PS加权 → ⑤检验混杂因素平衡性 → ⑥估计处理效应。本章介绍回归调整和分层两种方式。',
  },
  'pssc-psmodel-guide': {
    badge: '模型',
    title: '倾向性评分模型的建立',
    body: 'PS通过logistic回归估计，模型为：处理因素 ~ 混杂因素₁ + 混杂因素₂ + ...。要点：①处理因素为因变量(y)②只纳入与结局相关的混杂因素 ③不纳入处理因素的后效（中介变量）④PS值范围0~1，表示给定混杂因素下接受处理的预测概率。本例：catholic ~ race_white + w3momed_hsb + p5hmage + w3momscr + w3dadscr。',
  },
  'pssc-distribution-guide': {
    badge: '分布',
    title: '倾向性评分分布与共同支持域',
    body: '共同支持域(common support)指两组PS值的重叠范围。判断标准：①查看两组PS直方图是否有重叠 ②重叠范围越大，分层/匹配效果越好 ③若两组PS范围完全不重叠，则无法进行PS分析。本例：公立学校PS范围0.037~0.477，天主教学校0.049~0.404，重叠良好。',
  },
  'pssc-regression-guide': {
    badge: '回归',
    title: '倾向性评分回归解读',
    body: 'PS回归将PS作为协变量纳入回归模型：结局 ~ 处理因素 + PS。回归系数解读：①处理因素系数=调整混杂后的净效应 ②PS系数反映PS与结局的关联（验证PS建模质量）③PS范围外不宜做外推推断。本例：catholic系数=-0.108，p=0.000893，控制PS后天主教学校成绩显著较低。',
  },
  'pssc-stratification-guide': {
    badge: '分层',
    title: '倾向性评分分层方法',
    body: 'PS分层将PS值划分为若干层（通常5~10层），在层内混杂因素分布可认为均衡。分层步骤：①确定层数（太少残余混杂，太多每层样本不足）②确定切点（本例四分位：≤0.1, 0.1~0.2, 0.2~0.3, >0.3）③在每层内分别估计处理效应 ④汇总各层效应（加权平均）。分层后需重新检验平衡性。',
  },
  'pssc-balance-guide': {
    badge: '平衡',
    title: '分层后平衡性检验',
    body: '平衡性检验是PS分层的核心诊断：①连续变量用t检验或标准化均值差(SMD) ②分类变量用卡方检验 ③理想结果：所有混杂因素在组间p>0.05（或SMD<0.1）④因变量在各组间应有显著差异。本例分层效果不佳：部分混杂因素（特别是连续变量）在分层后仍不平衡，说明该数据需要调整分层方案。',
  },
  'pssc-cathexp-guide': {
    badge: '案例',
    title: '天主教 vs 公立学校案例解读',
    body: '研究问题：学校类型（天主教/公立）是否影响学生标准化成绩。数据：公立学校4597人，天主教学校951人（样本不均衡）。原始分析：天主教学校平均成绩0.221 vs 公立0.156，p=0.038。但两组在race、mother education、family income等混杂因素上显著不平衡（均p<0.001），因此需要PS分析控制混杂。',
  },
};

registerViz('pssc-workflow-guide', (el) => renderGuide(el, GUIDE_CARDS['pssc-workflow-guide']));
registerViz('pssc-psmodel-guide', (el) => renderGuide(el, GUIDE_CARDS['pssc-psmodel-guide']));
registerViz('pssc-distribution-guide', (el) => renderGuide(el, GUIDE_CARDS['pssc-distribution-guide']));
registerViz('pssc-regression-guide', (el) => renderGuide(el, GUIDE_CARDS['pssc-regression-guide']));
registerViz('pssc-stratification-guide', (el) => renderGuide(el, GUIDE_CARDS['pssc-stratification-guide']));
registerViz('pssc-balance-guide', (el) => renderGuide(el, GUIDE_CARDS['pssc-balance-guide']));
registerViz('pssc-cathexp-guide', (el) => renderGuide(el, GUIDE_CARDS['pssc-cathexp-guide']));