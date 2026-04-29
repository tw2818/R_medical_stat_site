import { registerViz } from './_core.js';

const STYLE_ID = 'sem-guides-style';

const GUIDE_CARDS = {
  'sem-concept-guide': {
    badge: 'SEM概念',
    icon: 'SEM',
    title: 'SEM概念与工作流程',
    lead: '结构方程模型(SEM)是基于变量协方差矩阵的多变量统计方法，用于研究可观测变量与潜变量之间的结构关系，同时处理测量误差。',
    steps: [
      ['潜变量与显变量', '潜变量无法直接测量（如"学习能力"），需通过显变量（如"考试成绩"）间接反映'],
      ['测量模型', '描述观测变量与潜变量之间的关系，用=~表示，如：学习能力=~语文+数学+英语'],
      ['结构模型', '描述潜变量之间的因果关系，用~表示，如：学习成绩~学习能力+学习态度'],
      ['SEM工作流程', '模型设定→识别→估计→评价→修正，迭代优化直至模型拟合良好']
    ],
    note: '本章使用lavaan包进行SEM分析，数据为Stroke-PRO量表（295例脑卒中患者）'
  },
  'sem-measurement-structural-guide': {
    badge: '模型类型',
    icon: 'M/S',
    title: '测量模型与结构模型的区别',
    lead: 'SEM包含测量模型（潜变量与显变量的关系）和结构模型（潜变量之间的关系）两大部分。',
    steps: [
      ['测量模型', '用=~定义，表示潜变量由哪些观测变量测量，如：f1=~x1+x2+x3'],
      ['结构模型', '用~定义，表示潜变量之间的回归关系，如：f2~f1（f1影响f2）'],
      ['CFA', '只有测量模型，没有结构模型时，称验证性因子分析(CFA)'],
      ['路径分析', '只有结构模型，没有测量模型时，称路径分析(Path Analysis)']
    ],
    note: '本章例题中34.3.3是CFA，34.3.4是完整SEM'
  },
  'sem-lavaan-syntax-guide': {
    badge: 'lavaan',
    icon: 'Lv',
    title: 'lavaan语法入门',
    lead: 'lavaan是R中专门用于潜变量分析的包，语法包含4类运算符：~、=~、~~、~1。',
    steps: [
      ['~ 回归', 'y~x1+x2，表示y由x1、x2预测（类似普通回归）'],
      ['=~ 潜变量定义', 'f=~x1+x2+x3，表示潜变量f由显变量x1、x2、x3测量'],
      ['~~ 协方差/方差', 'x1~~x2估计协方差；x1~~x1估计方差（残差）'],
      ['~1 截距', 'y~1，~1表示截距项']
    ],
    note: '完整模型用单引号括起来，如：model <- "f1=~x1+x2; f2~f1"'
  },
  'sem-cfa-result-guide': {
    badge: 'CFA',
    icon: 'CFA',
    title: 'CFA结果解读',
    lead: 'CFA结果主要看三部分：因子载荷（测量模型）、因子间协方差、结构模型拟合指标。',
    steps: [
      ['因子载荷', 'Estimate为非标准化载荷，Std.lv为潜变量标准化，Std.all为完全标准化'],
      ['载荷判断', '载荷绝对值越大（通常>0.4），说明该显变量对潜变量的测量越准确'],
      ['因子间协方差', '两个潜变量之间的相关程度，P<0.05表示显著相关'],
      ['R²', '各显变量能被潜变量解释的比例，R²越大测量越准确']
    ],
    note: '本章CFA例题χ²=630.894, df=164, CFI=0.867, RMSEA=0.098'
  },
  'sem-fit-index-guide': {
    badge: '拟合指标',
    icon: 'Fit',
    title: 'SEM拟合指标解读',
    lead: '模型拟合评价需综合多个指标，绝不仅是看p值。',
    steps: [
      ['χ²检验', 'χ²越小越好，但受样本量影响大，样本量大时容易拒绝好模型'],
      ['CFI/TLI', '比较拟合指数，CFI>0.9为良好，TLI>0.9为良好'],
      ['RMSEA', '近似误差均方根，RMSEA<0.05为良好，<0.08为可接受'],
      ['SRMR', '标准化残差均方根，SRMR<0.08为良好，<0.05为非常好']
    ],
    note: '单一指标不能判断模型好坏，需综合多个指标以及理论意义'
  },
  'sem-model-modification-guide': {
    badge: '模型修正',
    icon: 'Mod',
    title: '模型修正策略',
    lead: '模型拟合不佳时可通过修正指数(MI)指导添加参数，但需有理论依据。',
    steps: [
      ['修正指数MI', 'lavaan提供修正指数，提示添加某参数后χ²减少量'],
      ['先测后结', '修正应先解决测量模型问题，再考虑结构模型问题'],
      ['一次一项', '每次只做一个修正，避免影响其他参数估计'],
      ['有据可循', '修正应有理论支持，不能仅凭数据驱动随意添加路径']
    ],
    note: '模型修正应基于理论和先验知识，不能纯粹数据驱动'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .sem-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .sem-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .sem-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;box-shadow:0 8px 18px rgba(99,102,241,.22);}
    .sem-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .sem-guide-badge{display:inline-block;background:#eef2ff;color:#4f46e5;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .sem-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .sem-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:12px;}
    .sem-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .sem-guide-item strong{display:block;color:#4f46e5;margin-bottom:6px;}
    .sem-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #6366f1;border-radius:10px;padding:10px 12px;}
    @media(max-width:720px){.sem-guide-card{padding:14px}.sem-guide-head{align-items:flex-start}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['sem-concept-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="sem-guide-card">
      <div class="sem-guide-head">
        <div class="sem-guide-icon">${cfg.icon}</div>
        <div><span class="sem-guide-badge">${cfg.badge}</span><h3 class="sem-guide-title">${title}</h3></div>
      </div>
      <p class="sem-guide-lead">${cfg.lead}</p>
      <div class="sem-guide-grid">
        ${cfg.steps.map(([stepTitle, text]) => `<div class="sem-guide-item"><strong>${stepTitle}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="sem-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('sem-concept-guide', renderGuide);
registerViz('sem-measurement-structural-guide', renderGuide);
registerViz('sem-lavaan-syntax-guide', renderGuide);
registerViz('sem-cfa-result-guide', renderGuide);
registerViz('sem-fit-index-guide', renderGuide);
registerViz('sem-model-modification-guide', renderGuide);