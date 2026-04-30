import { registerViz } from './_core.js';

const STYLE_ID = 'pssc-guides-style';

const GUIDE_CARDS = {
  'pssc-workflow-guide': {
    badge: 'workflow',
    icon: 'WF',
    title: '倾向性评分的工作流程',
    lead: '倾向性评分(PS)是控制混杂因素的核心方法。',
    steps: [
      ['选择混杂因素', '建立logistic模型选择与结局相关的混杂因素'],
      ['计算PS值', '计算每个个体的PS值'],
      ['检验重叠', '检验PS分布重叠（共同支持域）'],
      ['选择应用方式', '根据研究目的选择：PS回归调整、PS分层、PS匹配或PS加权'],
      ['平衡性检验', '检验混杂因素平衡性'],
      ['效应估计', '估计处理效应']
    ],
    note: '本章介绍回归调整和分层两种方式'
  },
  'pssc-psmodel-guide': {
    badge: '模型',
    icon: 'PS',
    title: '倾向性评分模型的建立',
    lead: 'PS通过logistic回归估计，模型为：处理因素 ~ 混杂因素₁ + 混杂因素₂ + ...',
    steps: [
      ['处理因素为因变量', 'PS模型的处理因素作为因变量(y)'],
      ['纳入混杂因素', '只纳入与结局相关的混杂因素'],
      ['避免中介变量', '不纳入处理因素的后效（中介变量）'],
      ['PS值含义', 'PS值范围0~1，表示给定混杂因素下接受处理的预测概率']
    ],
    note: '本例：catholic ~ race_white + w3momed_hsb + p5hmage + w3momscr + w3dadscr'
  },
  'pssc-distribution-guide': {
    badge: '分布',
    icon: 'DS',
    title: '倾向性评分分布与共同支持域',
    lead: '共同支持域(common support)指两组PS值的重叠范围。',
    steps: [
      ['查看PS直方图', '检查两组PS分布是否有重叠区域'],
      ['评估重叠程度', '重叠范围越大，分层/匹配效果越好'],
      ['判断可行性', '若两组PS范围完全不重叠，则无法进行PS分析']
    ],
    note: '本例：公立学校PS范围0.037~0.477，天主教学校0.049~0.404，重叠良好'
  },
  'pssc-regression-guide': {
    badge: '回归',
    icon: 'RG',
    title: '倾向性评分回归解读',
    lead: 'PS回归将PS作为协变量纳入回归模型：结局 ~ 处理因素 + PS',
    steps: [
      ['处理因素系数', '处理因素系数=调整混杂后的净效应'],
      ['PS系数', 'PS系数反映PS与结局的关联（验证PS建模质量）'],
      ['外推限制', 'PS范围外不宜做外推推断']
    ],
    note: '本例：catholic系数=-0.108，p=0.000893，控制PS后天主教学校成绩显著较低'
  },
  'pssc-stratification-guide': {
    badge: '分层',
    icon: 'ST',
    title: '倾向性评分分层方法',
    lead: 'PS分层将PS值划分为若干层（通常5~10层），在层内混杂因素分布可认为均衡。',
    steps: [
      ['确定层数', '太少残余混杂，太多每层样本不足'],
      ['确定切点', '本例四分位：≤0.1, 0.1~0.2, 0.2~0.3, >0.3'],
      ['分层估计', '在每层内分别估计处理效应'],
      ['汇总效应', '汇总各层效应（加权平均）'],
      ['平衡性检验', '分层后需重新检验平衡性']
    ],
    note: '分层后需重新检验平衡性'
  },
  'pssc-balance-guide': {
    badge: '平衡',
    icon: 'BL',
    title: '分层后平衡性检验',
    lead: '平衡性检验是PS分层的核心诊断。',
    steps: [
      ['连续变量', '用t检验或标准化均值差(SMD)'],
      ['分类变量', '用卡方检验'],
      ['理想结果', '所有混杂因素在组间p>0.05（或SMD<0.1）'],
      ['效应差异', '因变量在各组间应有显著差异']
    ],
    note: '本例分层效果不佳：部分混杂因素（特别是连续变量）在分层后仍不平衡，说明该数据需要调整分层方案'
  },
  'pssc-cathexp-guide': {
    badge: '案例',
    icon: 'EX',
    title: '天主教 vs 公立学校案例解读',
    lead: '研究问题：学校类型（天主教/公立）是否影响学生标准化成绩。',
    steps: [
      ['样本不均衡', '公立学校4597人，天主教学校951人'],
      ['原始分析', '天主教学校平均成绩0.221 vs 公立0.156，p=0.038'],
      ['混杂不平衡', 'race、mother education、family income等混杂因素在两组间显著不平衡（均p<0.001）'],
      ['需要PS分析', '因此需要PS分析控制混杂']
    ],
    note: '两组在race、mother education、family income等混杂因素上显著不平衡（均p<0.001），因此需要PS分析控制混杂'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .psm-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .psm-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .psm-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;box-shadow:0 8px 18px rgba(147,51,234,.22);}
    .psm-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .psm-guide-badge{display:inline-block;background:#f3e8ff;color:#7c3aed;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .psm-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .psm-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:12px;}
    .psm-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .psm-guide-item strong{display:block;color:#6d28d9;margin-bottom:6px;}
    .psm-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #a855f7;border-radius:10px;padding:10px 12px;}
    @media(max-width:720px){.psm-guide-card{padding:14px}.psm-guide-head{align-items:flex-start}}
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
  const cfg = GUIDE_CARDS[el.dataset.type];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="psm-guide-card">
      <div class="psm-guide-head">
        <div class="psm-guide-icon">${cfg.icon}</div>
        <div><span class="psm-guide-badge">${escapeHtml(cfg.badge)}</span><h3 class="psm-guide-title">${title}</h3></div>
      </div>
      <p class="psm-guide-lead">${cfg.lead}</p>
      <div class="psm-guide-grid">
        ${cfg.steps.map(([s, t]) => `<div class="psm-guide-item"><strong>${s}</strong><span>${t}</span></div>`).join('')}
      </div>
      <div class="psm-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('pssc-workflow-guide', renderGuide);
registerViz('pssc-psmodel-guide', renderGuide);
registerViz('pssc-distribution-guide', renderGuide);
registerViz('pssc-regression-guide', renderGuide);
registerViz('pssc-stratification-guide', renderGuide);
registerViz('pssc-balance-guide', renderGuide);
registerViz('pssc-cathexp-guide', renderGuide);