import { registerViz } from './_core.js';

const STYLE_ID = 'p4trend-guides-style';

const GUIDE_CARDS = {
  'p4trend-workflow-guide': {
    badge: 'workflow',
    icon: 'WF',
    title: 'P for trend / p for interaction / per 1 sd 工作流程',
    lead: '本章介绍三个SCI论文中常见但教材少见的统计概念。',
    steps: [
      ['P for trend', '将连续变量分箱后作为数值型纳入回归，检验自变量与因变量的线性趋势'],
      ['p for interaction', '检验两个因素间是否存在交互作用，常用方法有交互项法和似然比检验法'],
      ['per 1 sd', '将连续变量标准化后纳入模型，效应量表示该变量每增加1个标准差时的OR/HR变化']
    ],
    note: '三个概念各有用途：P for trend 检验线性趋势，p for interaction 检验交互作用，per 1 sd 标准化效应量便于比较'
  },
  'p4trend-dummy-guide': {
    badge: '哑变量',
    icon: 'DV',
    title: '分类变量的哑变量编码解读',
    lead: '将连续变量转为因子后进行回归，R语言会自动进行哑变量编码。',
    steps: [
      ['哑变量编码', '以年龄x1为例（1=<45岁，2=45-55，3=55-65，4=>65岁），以第1组为参考组，模型输出x1.f2、x1.f3、x1.f4分别表示第2/3/4组与第1组的OR值及95%置信区间'],
      ['P for trend 要求', '将分箱后的因子当作数值型（coding as 1,2,3,4）而非分类变量纳入模型，才能得到线性趋势检验的P值']
    ],
    note: '哑变量编码让分类变量的组间比较成为可能，而P for trend利用编码的数值特性来检验线性趋势'
  },
  'p4trend-interaction-guide': {
    badge: '交互',
    icon: 'IA',
    title: 'P for interaction：交互作用的检验',
    lead: '交互作用指一个因素对因变量的效应受另一个因素水平的影响。',
    steps: [
      ['方法1（交互项法）', '在模型中直接加入主效应与交互项（如x1×x7），交互项的P值即为p for interaction'],
      ['方法2（似然比检验法）', '分别构建有交互项和无交互项的两个模型，用似然比检验比较两个模型的差异']
    ],
    note: '此处演示年龄(x1)与BMI(x7)对冠心病的交互效应'
  },
  'p4trend-methods-guide': {
    badge: '方法对比',
    icon: 'MT',
    title: '两种 p for interaction 方法对比',
    lead: '两种检验交互作用的方法各有适用场景。',
    steps: [
      ['方法1（交互项）', '直接看交互项系数的P值，简洁直观，但仅适用于数值型×数值型或二分类×二分类的交互'],
      ['方法2（似然比检验）', '先构建基础模型，再加入交互项构建完整模型，用lrtest()比较两个模型的偏差差异（ΔDeviance），服从卡方分布，自由度为新增交互项个数'],
      ['方法2优势', '可处理多分类变量的多个交互项整体检验']
    ],
    note: '本例两种方法P值接近（0.217 vs 0.165），结论一致'
  },
  'p4trend-persd-guide': {
    badge: 'per 1 sd',
    icon: 'SD',
    title: 'Per 1 SD：标准化效应量的报告方式',
    lead: 'Per 1 SD将连续变量标准化（均值=0，SD=1）后纳入回归模型。',
    steps: [
      ['原理', '标准化后变量每增加1个单位等于增加1个标准差，因此OR/HR表示该变量每增加1个SD时的效应变化'],
      ['优势', '消除量纲影响，使不同变量间的效应量可比；适用于单位不熟悉的变量；可降低共线性'],
      ['示例', 'weight.scaled = (weight - mean(weight)) / sd(weight)，系数1.05表示体重每增加1个标准差（约11kg），OR增加5%']
    ],
    note: 'per 1 sd 特别适合比较不同变量的效应量，是Meta分析中常用的报告方式'
  }
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

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

registerViz('p4trend-workflow-guide', renderGuide);
registerViz('p4trend-dummy-guide', renderGuide);
registerViz('p4trend-interaction-guide', renderGuide);
registerViz('p4trend-methods-guide', renderGuide);
registerViz('p4trend-persd-guide', renderGuide);