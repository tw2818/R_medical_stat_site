import { registerViz } from './_core.js';

const STYLE_ID = 'gee-guides-style';

const GUIDE_CARDS = {
  'gee-workflow-guide': {
    badge: 'workflow',
    icon: 'GEE',
    title: 'GEE 主线：广义线性模型的纵向推广',
    lead: 'GEE 将广义线性模型（GLM）推广到重复测量数据，通过作业相关矩阵校正组内相关，输出人群平均水平效应。',
    steps: [
      ['1. 识别数据结构', '纵向数据：同一受试者在多个时间点被测量；本章：340名患者，3个时间点，抑郁治疗有效性（二分类）'],
      ['2. 选择分布族', '因变量分布决定 family：连续→正态/Gaussian，二分类→二项/binomial，计数→泊松/Poisson'],
      ['3. 指定作业相关矩阵', 'corstr 参数：independence/exchangeable/ar1/unstructured；事先不知相关结构时，exchangeable 或 QIC 比较是常用策略'],
      ['4. 解释系数', 'GEE 输出 β（logit尺度）；exp(β) = OR/IRR，表示人群平均效应；这是边际（population-averaged）效应']
    ],
    note: 'GEE 与混合效应模型的区别：GEE 给出边际效应（人群平均），混合模型给出条件效应（个体水平）。GEE 对相关结构指定不敏感，但若结构严重误设，效率会下降。'
  },
  'gee-correlation-guide': {
    badge: 'correlation',
    icon: 'ρ',
    title: '5种作业相关矩阵：选对了吗？',
    lead: '作业相关矩阵（working correlation matrix）描述重复测量之间的时间相关结构。选对了，参数估计更高效；选错了也不一定偏，但效率降低。',
    steps: [
      ['independence', '独立结构：各时间点测量完全独立；相当于普通 GLM，适用于真实独立数据；本章用 independence'],
      ['exchangeable', '等相关：任意两次测量相关相同；适合时间点对称、相关不随间隔变化的场景'],
      ['ar1', '一阶自相关：相邻时间点相关最强，间隔越远越弱；适合等间隔纵向数据，如随访时间等距的场景'],
      ['autocorrelation', '自相关：相关随间隔增加持续下降，比 ar1 更灵活；可由数据估计'],
      ['unstructured', '无结构：每个时间点对都有一个独立相关系数；最灵活但参数最多，小样本不推荐']
    ],
    note: '选择策略：事先有理论依据按理论；无明确依据时用 QIC 比较（越小越好）；或用稳健标准误（sandwich estimator）即使矩阵误设也保证一致性。'
  },
  'gee-interpretation-guide': {
    badge: 'interpretation',
    icon: 'β→OR',
    title: 'GEE 系数解读：从 logit 到 OR',
    lead: 'GEE 系数 β 在 logit 尺度，exp(β) 给出比值比（OR）或发生率比（IRR）。注意 GEE 报告的是边际（population-averaged）效应，不是条件效应。',
    steps: [
      ['(Intercept)', '基准对数几率：time=0、drug=standard、diagnose=mild 时的 log(odds)=-0.028'],
      ['diagnosesevere', 'β=-1.3139，OR=exp(-1.3139)=0.27：重度抑郁治疗有效率仅为轻度患者的27%，显著负向预测'],
      ['drugnew', 'β=-0.0596，OR=0.94，P=0.79：基线（time=0）两组无差异，说明随机化成功'],
      ['time', 'β=0.48，OR=1.62：标准药每增1个时间单位，有效率增加约62%'],
      ['drugnew:time', 'β=1.02，OR=2.77：新药组随时间改善速度是标准药组的2.77倍，疗效优势不断扩大']
    ],
    note: '解释时注意研究问题：时间用 linear trend（time）还是因子（factor(time)）建模？前者适合等距间隔的线性趋势，后者适合捕捉非线性变化。'
  },
  'gee-interaction-guide': {
    badge: 'interaction',
    icon: '×',
    title: 'drug × time 交互项解读：新药疗效随时间放大',
    lead: '交互项 β=1.02（OR=2.77）表示：新药与时间的效应不是简单相加，而是新药组随时间的效果增速远快于标准药组。',
    steps: [
      ['标准药斜率', 'time 主效应 β=0.48，OR=1.62：每增加1个时间单位，有效率增加约62%'],
      ['新药斜率', '实际斜率 = 0.48 + 1.02 = 1.50，OR=exp(1.50)=4.48：新药每增1个时间单位，有效率增加约4.48倍'],
      ['比值比解释', '交互项 OR=2.77：新药相对于标准药的疗效优势，在每个时间单位内扩大约2.77倍'],
      ['time=2 时', '新药 vs 标准药 OR = exp(-0.0596 + 1.0174×2) = exp(1.9748) ≈ 7.21：第2时间点新药有效率约为标准药7倍']
    ],
    note: '解读交互项时，先分别计算各组简单斜率，再比较。本例时间间隔等距（0,1,2），用 time 作为连续变量建模是合理的。若随访时间不规则，建议用 factor(time) 建模。'
  },
  'gee-qic-guide': {
    badge: 'QIC',
    icon: 'QIC',
    title: 'QIC 模型比较：越小越好',
    lead: 'QIC（准信息准则）是 GEE 的模型选择指标，类似 AIC，越小越好。用于比较不同作业相关矩阵或不同变量组合的模型。',
    steps: [
      ['独立性', 'independence：QIC=1172'],
      ['等相关', 'exchangeable：QIC=1172（相等）'],
      ['AR(1)', 'ar1：QIC=1172（相等）'],
      ['无结构', 'unstructured：QIC=1172（相等）；参数最多（5个相关参数），但 QIC 未明显更差']
    ],
    note: '本例各矩阵 QIC 相同，可能原因：数据相关性不强（时间点少，或真实相关接近 independence）；二分类因变量信息有限；建议在实际研究中仍做 QIC 比较，不应直接假设 independence 最优。'
  },
  'gee-marginal-effect-guide': {
    badge: 'marginal',
    icon: 'MA',
    title: '边际效应 vs 条件效应：GEE 的核心优势',
    lead: 'GEE 报告的是边际（population-averaged）效应，即人群平均水平上干预的效应。混合效应模型报告的是条件（subject-specific）效应，即给定个体随机效应后的效应。',
    steps: [
      ['GEE 边际效应', 'β_GEE = 人群中平均处理效应；解释为：施加处理 vs 不施加处理，人群中结果概率的平均差异'],
      ['混合模型条件效应', 'β_mixed = 给定特定个体随机效应后的处理效应；解释为：在同一受试者身上施加处理 vs 不施加的效应差异'],
      ['数值关系', '对于 logit 模型，边际效应 ≈ 条件效应 × 0.65（粗略近似）；当ICC较大时，两者差距扩大'],
      ['选择建议', '若研究问题关注人群平均干预效果 → GEE（边际效应）；若关注个体水平预测或因果推断 → 混合模型（条件效应）']
    ],
    note: 'GEE 使用广义估计方程通过稳健sandwich方差估计器（HC0）校正作业相关矩阵误设的影响，即使相关结构不精确，系数估计仍一致（但标准误更有效当结构正确时）。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .gee-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .gee-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .gee-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#0891b2,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 8px 18px rgba(8,145,178,.22);padding:0 8px;}
    .gee-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .gee-guide-badge{display:inline-block;background:#ecfeff;color:#0891b2;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .gee-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .gee-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;}
    .gee-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .gee-guide-item strong{display:block;color:#0891b2;margin-bottom:6px;}
    .gee-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #06b6d4;border-radius:10px;padding:10px 12px;}
    @media(max-width:720px){.gee-guide-card{padding:14px}.gee-guide-head{align-items:flex-start}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['gee-workflow-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="gee-guide-card">
      <div class="gee-guide-head">
        <div class="gee-guide-icon">${cfg.icon}</div>
        <div><span class="gee-guide-badge">${cfg.badge}</span><h3 class="gee-guide-title">${title}</h3></div>
      </div>
      <p class="gee-guide-lead">${cfg.lead}</p>
      <div class="gee-guide-grid">
        ${cfg.steps.map(([title, text]) => `<div class="gee-guide-item"><strong>${title}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="gee-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('gee-workflow-guide', renderGuide);
registerViz('gee-correlation-guide', renderGuide);
registerViz('gee-interpretation-guide', renderGuide);
registerViz('gee-interaction-guide', renderGuide);
registerViz('gee-qic-guide', renderGuide);
registerViz('gee-marginal-effect-guide', renderGuide);
