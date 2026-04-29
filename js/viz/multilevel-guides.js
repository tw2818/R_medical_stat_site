import { registerViz } from './_core.js';

const STYLE_ID = 'multilevel-guides-style';

const GUIDE_CARDS = {
  'multilevel-workflow-guide': {
    badge: 'workflow',
    icon: 'MLM',
    title: '多水平模型的主线：先看层次，再分解方差',
    lead: '学生嵌套于学校，测量嵌套于患者——多水平模型的核心是把总体方差分解到不同层次。',
    steps: [
      ['1. 识别层次', '本章：学生(水平1)嵌套于学校(水平2)；重复测量中，时间点(水平1)嵌套于患者(水平2)'],
      ['2. 空模型', '先拟合无预测变量的模型，用 ICC = σ²_学校 / (σ²_学校 + σ²_残差) 衡量组间变异占比'],
      ['3. 逐步加入预测变量', '先加水平1变量(ses)，再加水2变量(public)，观察 ICC 和 AIC/BIC 变化'],
      ['4. 检验随机效应', '根据研究问题决定是否加入随机斜率；交叉水平交互项用 1|cluster + x|cluster 语法']
    ],
    note: '本章示例均用 lme4 + lmerTest；lmerTest 提供 P 值，lme4 本身不提供。'
  },
  'multilevel-icc-guide': {
    badge: 'ICC',
    icon: 'ρ',
    title: '组内相关系数：群体间变异占总变异的比例',
    lead: 'ICC = σ²_群体间 / (σ²_群体间 + σ²_群体内)，取值 0~1，ICC 越大说明群体效应越明显。',
    steps: [
      ['ICC = 0', '群体间无差异，等同于普通线性回归，无需使用多水平模型'],
      ['ICC ≈ 0.05', '弱群体效应，但仍值得用多水平模型；本章空模型 ICC = 0.138，说明 13.8% 的成绩变异来自学校间差异'],
      ['ICC > 0.10', '强群体效应，必须用多水平模型，否则标准误会被低估']
    ],
    note: '加入预测变量后 ICC 会下降，因为新变量解释了原本归于群体间的部分变异。本章 ses_l1 模型的 ICC 从 0.138 降到 0.052。'
  },
  'multilevel-random-intercept-guide': {
    badge: 'random intercept',
    icon: '∩₁',
    title: '随机截距模型：每个群体有自己的基准线',
    lead: '随机截距模型假设所有群体的斜率相同，但截距不同。截距的变异由随机效应 σ²_截距 量化。',
    steps: [
      ['公式', 'math ~ ses + (1|schcode)：1 表示随机截距，schcode 是分组变量'],
      ['截距含义', '57.60 是所有学校的平均成绩；各学校的实际截距围绕此值波动，σ = 3.26'],
      ['与普通回归对比', '普通回归只有一个截距；随机截距模型允许截距随群体变化，等于给每个群体加了一个随机偏移']
    ],
    note: '随机截距模型又叫方差成分模型，是最简单的多水平模型。'
  },
  'multilevel-random-slope-guide': {
    badge: 'random slope',
    icon: '↗↘',
    title: '随机斜率模型：每个群体的效应大小不同',
    lead: '随机斜率模型不仅截距随群体变化，斜率也随群体变化。ses 对成绩的影响在不同学校可能完全不同。',
    steps: [
      ['公式', 'math ~ ses + (ses|schcode)：ses 的系数也作为随机效应估计'],
      ['斜率变异', 'σ_ses = 0.88 表示不同学校 ses 斜率的标准差；有些学校斜率大，有些小'],
      ['相关结构', 'Corr = -1.00：截距越高，ses 斜率越低——好学校截距高但 SES 效应反而弱'],
      ['边界奇异性', 'corr = -1 是边界解，说明模型可能过度参数化；但仍提供了有价值的教学信息']
    ],
    note: '随机斜率模型比随机截距模型更复杂，收敛可能有问题。`boundary (singular) fit` 提示检查是否真的需要如此复杂的随机结构。'
  },
  'multilevel-crosslevel-interaction-guide': {
    badge: 'interaction',
    icon: '×',
    title: '交叉水平交互：学校类型调节 SES 对成绩的影响',
    lead: '水平1变量(ses)与水平2变量(public)的交互叫交叉水平交互，检验的是高一层变量对低一层变量效应大小的调节。',
    steps: [
      ['交互项含义', 'ses:public = -0.625：SES 对成绩的影响在公立学校比私立学校弱 0.625 分'],
      ['简单斜率', '私立学校(public=0)：SES 每增1分，成绩增 4.42 分；公立学校(public=1)：增 3.80 分'],
      ['报告规范', '必须同时报告主效应和交互效应；解释时需分不同水平阐述，不能只读主效应']
    ],
    note: '交叉水平交互的检验需要将水平1变量中心化(如用 femses)以减少多重共线性，但本章为教学简单使用原始 ses。'
  },
  'multilevel-model-comparison-guide': {
    badge: 'model comparison',
    icon: '≃',
    title: '模型比较：AIC、BIC、ICC、R² 一起看',
    lead: '多水平模型没有单一的 R²，需要用 ICC、R²_marginal、R²_conditional、AIC/BIC 组合评价。',
    steps: [
      ['ICC', '空模型 0.138 → ses_l1 0.052：加入 ses 后学校间差异解释力下降，因为 ses 部分解释了学校差异'],
      ['AIC/BIC', '越小越好；ses_l1 (48219) vs null_model (48882)：差 663，AIC 大幅改善'],
      ['R² conditional', '包含随机效应解释的总变异；R² marginal 只含固定效应'],
      ['REM vs ML', 'REML 是限制性最大似然估计，默认用 REML；比较固定效应时可用 ML']
    ],
    note: 'performance::icc() 自动计算调整后 ICC，lme4 默认 REML 估计。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .mlm-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .mlm-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .mlm-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#0891b2,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 8px 18px rgba(8,145,178,.22);padding:0 8px;}
    .mlm-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .mlm-guide-badge{display:inline-block;background:#ecfeff;color:#0891b2;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .mlm-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .mlm-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;}
    .mlm-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .mlm-guide-item strong{display:block;color:#0891b2;margin-bottom:6px;}
    .mlm-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #06b6d4;border-radius:10px;padding:10px 12px;}
    @media(max-width:720px){.mlm-guide-card{padding:14px}.mlm-guide-head{align-items:flex-start}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['multilevel-workflow-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="mlm-guide-card">
      <div class="mlm-guide-head">
        <div class="mlm-guide-icon">${cfg.icon}</div>
        <div><span class="mlm-guide-badge">${cfg.badge}</span><h3 class="mlm-guide-title">${title}</h3></div>
      </div>
      <p class="mlm-guide-lead">${cfg.lead}</p>
      <div class="mlm-guide-grid">
        ${cfg.steps.map(([title, text]) => `<div class="mlm-guide-item"><strong>${title}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="mlm-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('multilevel-workflow-guide', renderGuide);
registerViz('multilevel-icc-guide', renderGuide);
registerViz('multilevel-random-intercept-guide', renderGuide);
registerViz('multilevel-random-slope-guide', renderGuide);
registerViz('multilevel-crosslevel-interaction-guide', renderGuide);
registerViz('multilevel-model-comparison-guide', renderGuide);