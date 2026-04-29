import { registerViz } from './_core.js';

const STYLE_ID = 'p4trend-guides-style';

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
    .p4trend-guide-card{background:#f8f9fa;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .p4trend-guide-badge{display:inline-block;background:#ede9fe;color:#6d28d9;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:8px;}
    .p4trend-guide-title{font-size:17px;font-weight:700;color:#1e293b;margin:0 0 10px;}
    .p4trend-guide-body{color:#475569;line-height:1.8;font-size:14px;}
    @media(max-width:720px){.p4trend-guide-card{padding:14px}}
  `;
  document.head.appendChild(style);
}

function renderGuide(el, cfg) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="p4trend-guide-card">
      <div class="p4trend-guide-badge">${escapeHtml(cfg.badge)}</div>
      <div class="p4trend-guide-title">${title}</div>
      <div class="p4trend-guide-body">${cfg.body || ''}</div>
    </div>
  `;
}

const GUIDE_CARDS = {
  'p4trend-workflow-guide': {
    badge: 'workflow',
    title: 'P for trend / p for interaction / per 1 sd 工作流程',
    body: '本章介绍三个SCI论文中常见但教材少见的统计概念。①<strong>P for trend</strong>：将连续变量分箱后作为数值型纳入回归，检验自变量与因变量的线性趋势；②<strong>p for interaction</strong>：检验两个因素间是否存在交互作用，常用方法有交互项法和似然比检验法；③<strong>per 1 sd</strong>：将连续变量标准化后纳入模型，效应量表示该变量每增加1个标准差时的OR/HR变化。',
  },
  'p4trend-dummy-guide': {
    badge: '哑变量',
    title: '分类变量的哑变量编码解读',
    body: '将连续变量转为因子后进行回归，R语言会自动进行哑变量编码。以年龄x1为例（1=<45岁，2=45-55，3=55-65，4=>65岁），以第1组为参考组，模型输出x1.f2、x1.f3、x1.f4分别表示第2/3/4组与第1组的OR值及95%置信区间。注意：P for trend要求将分箱后的因子当作数值型（coding as 1,2,3,4）而非分类变量纳入模型，才能得到线性趋势检验的P值。',
  },
  'p4trend-interaction-guide': {
    badge: '交互',
    title: 'P for interaction：交互作用的检验',
    body: '交互作用指一个因素对因变量的效应受另一个因素水平的影响。两种检验方法：①<strong>方法1（交互项法）</strong>：在模型中直接加入主效应与交互项（如x1×x7），交互项的P值即为p for interaction；②<strong>方法2（似然比检验法）</strong>：分别构建有交互项和无交互项的两个模型，用似然比检验比较两个模型的差异。此处演示年龄(x1)与BMI(x7)对冠心病的交互效应。',
  },
  'p4trend-methods-guide': {
    badge: '方法对比',
    title: '两种 p for interaction 方法对比',
    body: '方法1（交互项）：直接看交互项系数的P值，简洁直观，但仅适用于数值型×数值型或二分类×二分类的交互。方法2（似然比检验）：先构建基础模型，再加入交互项构建完整模型，用<strong>lrtest()</strong>比较两个模型的偏差差异（ΔDeviance），服从卡方分布，自由度为新增交互项个数。方法2可处理多分类变量的多个交互项整体检验。本例两种方法P值接近（0.217 vs 0.165），结论一致。',
  },
  'p4trend-persd-guide': {
    badge: 'per 1 sd',
    title: 'Per 1 SD：标准化效应量的报告方式',
    body: 'Per 1 SD将连续变量标准化（均值=0，SD=1）后纳入回归模型。原理：标准化后变量每增加1个单位等于增加1个标准差，因此OR/HR表示该变量每增加1个SD时的效应变化。优势：①消除量纲影响，使不同变量间的效应量可比；②适用于单位不熟悉的变量；③可降低共线性。本例对weight进行标准化：weight.scaled = (weight - mean(weight)) / sd(weight)，系数1.05表示体重每增加1个标准差（约11kg），OR增加5%。',
  },
};

registerViz('p4trend-workflow-guide', (el) => renderGuide(el, GUIDE_CARDS['p4trend-workflow-guide']));
registerViz('p4trend-dummy-guide', (el) => renderGuide(el, GUIDE_CARDS['p4trend-dummy-guide']));
registerViz('p4trend-interaction-guide', (el) => renderGuide(el, GUIDE_CARDS['p4trend-interaction-guide']));
registerViz('p4trend-methods-guide', (el) => renderGuide(el, GUIDE_CARDS['p4trend-methods-guide']));
registerViz('p4trend-persd-guide', (el) => renderGuide(el, GUIDE_CARDS['p4trend-persd-guide']));