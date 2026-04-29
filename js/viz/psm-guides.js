import { registerViz } from './_core.js';

const STYLE_ID = 'psm-guides-style';

const GUIDE_CARDS = {
  'psm-concept-guide': {
    badge: 'PS 概念',
    icon: 'PS',
    title: '倾向性评分的基本概念',
    lead: '倾向性评分(Propensity Score)是将多个混杂因素用一个综合值表示，从而降低协变量维度的统计方法，特别适用于协变量较多的情况。',
    steps: [
      ['估计 PS 值', '以处理因素为因变量，混杂因素为自变量，通过 logistic 回归等模型估计每个研究对象接受处理的可能性'],
      ['均衡协变量', '利用 PS 值均衡组间协变量分布：匹配、分层、协变量调整、加权'],
      ['均衡性检验', '使用 SMD、VR 等指标检验匹配后协变量是否达到平衡'],
      ['处理效应估计', '在平衡的协变量基础上，估计处理因素的效应值']
    ],
    note: '4种均衡协变量方法各有特点：匹配（Matching）最直观，分层（Stratification）不损失样本，加权（Weighting）利用全部数据，协变量调整（Adjustment）类似回归'
  },
  'psm-balance-metrics-guide': {
    badge: '平衡性指标',
    icon: 'SMD',
    title: 'SMD 与 VR 平衡性判断标准',
    lead: '匹配后需要检验协变量是否在组间达到平衡，主要使用 SMD（标准化均值差）和 VR（方差比）两个指标。',
    steps: [
      ['SMD < 0.1', '协变量已达到平衡，这是文献推荐的常用阈值'],
      ['VR 接近 1', 'VR = Var(Treated)/Var(Control)，越接近1表示方差越均衡'],
      ['VR > 2 或 VR < 0.5', '方差严重不均衡，需要调整匹配方案'],
      ['假设检验', '也可以用 t 检验、卡方检验等传统方法检验组间差异']
    ],
    note: '推荐使用 cobalt 包的 bal.tab()，它比 matchIt 默认输出的 SMD 更准确，尤其对分类变量'
  },
  'psm-matching-method-guide': {
    badge: '匹配参数',
    icon: 'M',
    title: 'matchIt() 匹配参数详解',
    lead: 'matchIt() 有4个核心参数：method（匹配方法）、caliper（卡钳值）、replace（是否放回）、ratio（匹配比例）。',
    steps: [
      ['method', 'nearest（最近邻）最常用，其他：exact、optimal、full、genetic、cem 等'],
      ['caliper', '配对标准差倍数，默认不设置。PS差距超过这个阈值则不配对，常用 0.1~0.2'],
      ['replace', 'FALSE=无放回（常用）；TRUE=有放回，对照组样本可重复匹配'],
      ['ratio', '1:1 默认；1:n 时 n 一般不超过4，n越大损失样本越少但匹配质量可能下降']
    ],
    note: '有放回匹配(replace=TRUE)可以匹配更多处理组样本，但可能导致某些对照被重复使用而增加偏倚'
  },
  'psm-cobalt-guide': {
    badge: 'cobalt',
    icon: 'Co',
    title: 'cobalt 包平衡性诊断',
    lead: 'cobalt 包的 bal.tab() 函数是进行平衡性检验的推荐方法，比 matchIt 默认输出更可靠。',
    steps: [
      ['m.threshold', '设置 SMD 阈值，默认 0.1；小于阈值显示 "Balanced"'],
      ['v.threshold', '设置 VR 阈值，默认 2.0；VR 在 [1/2, 2] 区间内视为平衡'],
      ['un=TRUE', '同时输出匹配前(Unadjusted)和匹配后(Adjusted)的平衡指标'],
      ['Diff.Un / Diff.Adj', '匹配前/匹配后的标准化均值差；Adj 列是匹配后数据']
    ],
    note: 'cobalt 对分类变量的 SMD 计算比默认方法更准确，推荐在所有平衡性检验中使用 bal.tab()'
  },
  'psm-visualization-guide': {
    badge: '可视化',
    icon: 'Viz',
    title: '匹配结果可视化解读',
    lead: 'cobalt 和 love.plot() 可以可视化匹配前后的平衡性，是检验匹配质量的重要工具。',
    steps: [
      ['Love Plot', '横轴为 SMD 值，纵轴为协变量；匹配后在两条0.1阈值线之间表示平衡'],
      ['bal.plot()', '密度图（连续变量）或柱状图（分类变量）展示匹配前后分布'],
      ['ecdf 图', '经验累积分布函数图，展示协变量在两组间的重叠程度'],
      ['psdist 组件', '上方交互组件可拖动滑块查看不同卡钳值对匹配结果的影响']
    ],
    note: '匹配后所有协变量的 SMD 点都应在阈值线内，且分布应高度重叠，才是好的匹配结果'
  },
  'psm-imbalance-guide': {
    badge: '应对策略',
    icon: 'Fix',
    title: '不平衡时的处理策略',
    lead: '当匹配后协变量仍然不平衡时，有5种常用应对策略，按优先级排列：',
    steps: [
      ['换 PS 计算方法', '尝试不同算法（logistic / rpart / nnet）或增加二次项、交互项'],
      ['调整匹配参数', '设置 caliper、改为 1:n 匹配、使用不同 method（genetic、cem 等）'],
      ['精确匹配', '对某些变量用 exact= 参数要求完全匹配，但会损失大量样本'],
      ['增加样本量', '样本量越大越容易找到平衡的匹配'],
      ['匹配后回归/分层', '对匹配后数据再进行回归分析或分层，控制剩余不平衡']
    ],
    note: '精确匹配(exact)虽然能达到完美平衡，但代价是大量样本被丢弃，实际中要权衡平衡性与样本损失'
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['psm-concept-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="psm-guide-card">
      <div class="psm-guide-head">
        <div class="psm-guide-icon">${cfg.icon}</div>
        <div><span class="psm-guide-badge">${cfg.badge}</span><h3 class="psm-guide-title">${title}</h3></div>
      </div>
      <p class="psm-guide-lead">${cfg.lead}</p>
      <div class="psm-guide-grid">
        ${cfg.steps.map(([stepTitle, text]) => `<div class="psm-guide-item"><strong>${stepTitle}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="psm-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('psm-concept-guide', renderGuide);
registerViz('psm-balance-metrics-guide', renderGuide);
registerViz('psm-matching-method-guide', renderGuide);
registerViz('psm-cobalt-guide', renderGuide);
registerViz('psm-visualization-guide', renderGuide);
registerViz('psm-imbalance-guide', renderGuide);