import { registerViz } from './_core.js';

const STYLE_ID = 'codescheme-guides-style';

const GUIDE_CARDS = {
  'codescheme-factor-workflow': {
    badge: 'factor workflow',
    icon: 'K→K-1',
    title: '分类变量进入模型前发生了什么',
    lead: '分类变量不是直接把文字标签丢进回归模型，而是先经历 factor → contrast matrix → 设计矩阵 这条路径，再变成模型可以估计的数值列。',
    steps: [
      ['factor 水平', '先确认水平顺序：Hispanic、Asian、African-Am、Caucasian。第一个水平常常决定参考组。'],
      ['contrast matrix', 'R 用 contrasts() 保存每个水平对应的编码行；K 个水平通常生成 K-1 列。'],
      ['设计矩阵', 'lm()/glm() 会把每个观测的 factor 水平替换成对应编码行，再估计截距和系数。']
    ],
    note: '先看 contrast，再看回归系数；不要只盯着 summary() 的 P 值。'
  },
  'codescheme-design-matrix': {
    badge: 'dummy coding',
    icon: '0/1',
    title: 'Dummy coding：参考组与三列哑变量',
    lead: '本章 race.f 有 4 个水平，因此进入模型时生成 3 列哑变量；Hispanic 作为参考组时，Asian、African-Am、Caucasian 都分别与参考组比较。',
    steps: [
      ['参考组', 'Hispanic 行为 0,0,0，截距就是参考组 write 均值 46.45833。'],
      ['非参考组', 'Asian 行为 1,0,0；race.f2 系数 11.5417 = 58.00000 - 46.45833。'],
      ['和第21章相连', 'Logistic 回归中的哑变量也是同一套参考组逻辑，只是系数处在 logit/OR 尺度。']
    ],
    note: 'dummy / simple / deviation 改变的是系数含义，不改变这个例子的总体模型拟合。'
  },
  'codescheme-reference-mean-guide': {
    badge: 'intercept meaning',
    icon: 'β₀',
    title: '同一组均值，不同编码，截距含义会变',
    lead: 'dummy / simple / deviation 的差异主要体现在截距和系数解释：同样的四组均值，会因 contrast 改变而映射成不同的 β。',
    steps: [
      ['Dummy', '截距 = 参考组均值；系数 = 某组均值 - 参考组均值。'],
      ['Simple', '截距 = 四组均值的平均值；系数仍可看作相对参考组的差异。'],
      ['Deviation', '截距 = 总均值；系数 = 某组均值 - 总均值，适合关心各组偏离总体中心。']
    ],
    note: '读系数前先问：这套 contrast 的“零点”是谁？是参考组、总均值，还是相邻组？'
  },
  'codescheme-ordinal-polynomial-guide': {
    badge: 'ordered factor',
    icon: '.L',
    title: '有序因子：正交多项式看趋势',
    lead: '正交多项式编码适合有自然顺序的分类变量，把组间差异拆成线性、二次、三次等趋势。',
    steps: [
      ['.L 线性项', '本例 readcat.L = 14.2587，说明阅读分组越高，write 均值呈明显上升趋势。'],
      ['.Q/.C', '二次项和三次项用于检查弯曲或更复杂形态；本例并不明显。'],
      ['使用条件', '只有水平有明确顺序时才这样解释；无序分类变量不要硬套趋势。']
    ],
    note: '正交多项式回答的是“是否存在趋势”，不是“哪两个具体组不同”。'
  },
  'codescheme-helmert-difference-guide': {
    badge: 'sequential contrasts',
    icon: '↔',
    title: 'Helmert 与 Difference：比较对象不同',
    lead: 'Helmert、Reverse Helmert、Forward/Backward Difference 都是连续比较思路，但比较对象并不一样。',
    steps: [
      ['Helmert', '当前类别与后续多个类别均值比较，例如类别1 vs 类别2/3/4。'],
      ['Reverse Helmert', '当前类别与前面类别比较，R 的 contr.helmert(4) 默认给出这个方向。'],
      ['Difference', '相邻类别比较：Forward 看当前 vs 下一个，Backward 看当前 vs 前一个。']
    ],
    note: '看到 race.f1、race.f2、race.f3 时，不要默认它们都是“相对参考组”；本章后半部分尤其要先确认比较方向。'
  },
  'codescheme-glm-bridge-guide': {
    badge: 'GLM bridge',
    icon: 'GLM',
    title: '把分类变量编码带回 GLM 家族',
    lead: '同一套 contrast 逻辑会进入 Logistic、Poisson、负二项、Cox 等模型；区别在于 link 函数和系数解释尺度。',
    steps: [
      ['第21章 Logistic', 'contrast 决定“谁和谁比”，logit link 决定 exp(β) 解释为 OR。'],
      ['第22章 Log-linear', '分类变量交互项同样来自设计矩阵，决定列联表频数模型中的比较对象。'],
      ['第23章 Poisson', 'contrast 决定组别比较，log link 使 exp(β) 进入 RR/IRR 尺度。']
    ],
    note: '报告任何分类变量模型时，至少说明参考组/编码方式、link 函数，以及 β 或 exp(β) 的解释尺度。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .codescheme-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .codescheme-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .codescheme-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#475569,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;box-shadow:0 8px 18px rgba(71,85,105,.24);padding:0 8px;}
    .codescheme-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .codescheme-guide-badge{display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .codescheme-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .codescheme-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;}
    .codescheme-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .codescheme-guide-item strong{display:block;color:#334155;margin-bottom:6px;}
    .codescheme-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #a78bfa;border-radius:10px;padding:10px 12px;}
    @media(max-width:680px){.codescheme-guide-card{padding:14px}.codescheme-guide-head{align-items:flex-start}.codescheme-guide-icon{min-width:44px;height:44px}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['codescheme-factor-workflow'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="codescheme-guide-card">
      <div class="codescheme-guide-head">
        <div class="codescheme-guide-icon">${cfg.icon}</div>
        <div><span class="codescheme-guide-badge">${cfg.badge}</span><h3 class="codescheme-guide-title">${title}</h3></div>
      </div>
      <p class="codescheme-guide-lead">${cfg.lead}</p>
      <div class="codescheme-guide-grid">
        ${cfg.steps.map(([title, text]) => `<div class="codescheme-guide-item"><strong>${title}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="codescheme-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('codescheme-factor-workflow', renderGuide);
registerViz('codescheme-design-matrix', renderGuide);
registerViz('codescheme-reference-mean-guide', renderGuide);
registerViz('codescheme-ordinal-polynomial-guide', renderGuide);
registerViz('codescheme-helmert-difference-guide', renderGuide);
registerViz('codescheme-glm-bridge-guide', renderGuide);
