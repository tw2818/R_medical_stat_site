import { registerViz } from './_core.js';

const STYLE_ID = 'psw-guides-style';

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

const GUIDE_CARDS = {
  'psw-workflow-guide': {
    badge: 'workflow',
    icon: 'WF',
    title: '倾向性评分加权的工作流程',
    lead: '倾向性评分加权（PS Weighting）通过加权使处理组和对照组的协变量分布均衡。本章介绍 IPTW（逆概率加权）和重叠加权两种方法。',
    steps: [
      ['选择协变量', '建立 logistic 模型计算每个研究对象的 PS 值'],
      ['选择加权类型', '根据研究目的选择 IPTW 或重叠加权'],
      ['计算样本权重', '根据加权类型和 PS 值计算每个样本的权重'],
      ['检验平衡性', '使用 SMD<0.1 判断协变量是否达到平衡'],
      ['估计处理效应', '使用加权后的数据进行效应估计']
    ],
    note: 'IPTW 和重叠加权各有适用场景：IPTW 适合估计 ATE，重叠加权适合估计 ATO 或 PS 分布重叠良好时'
  },
  'psw-iptw-guide': {
    badge: 'IPTW',
    icon: 'IW',
    title: '逆概率加权（IPTW）公式与人群选择',
    lead: 'IPTW 以全部研究对象为目标人群（ATE），权重为所在组概率的倒数。另一种 IPTW 以处理组为目标人群（ATT），公式相同但含义不同。',
    steps: [
      ['ATE（IPW）', '干预组权重=1/PS，对照组权重=1/(1-PS)，以全部研究对象为目标人群'],
      ['ATT（IPTW）', '干预组权重=1，对照组权重=PS/(1-PS)，以处理组为目标人群'],
      ['有效样本量', 'IPTW 的 ESS 会小于原始样本量（本例：control ESS=202.27，treated ESS=671.09）'],
      ['权重裁剪', '极端 PS 值会产生极大权重，需要进行裁剪（trimming）以稳定估计']
    ],
    note: 'IPTW 的有效样本量（ESS）会小于原始样本量，极端 PS 值会产生极大权重，需进行裁剪'
  },
  'psw-balance-guide': {
    badge: '平衡',
    icon: 'BL',
    title: '加权后平衡性检验的解读',
    lead: '使用 cobalt::bal.tab 或 CreateTableOne 的 SMD 检验平衡性。判断标准包括 SMD<0.1、有效样本量（ESS）和权重裁剪。',
    steps: [
      ['SMD<0.1', '协变量已均衡，这是文献推荐的常用阈值（本例 IPTW 加权后 13 项全部<0.1）'],
      ['ESS', '有效样本量反映加权后的信息量，ESS 越小说明权重越不均匀'],
      ['权重裁剪', '可减小极端权重但会损失部分样本'],
      ['不平衡变量', '加权前 stent(SMD=0.255)、acutemi(SMD=0.372)、ves1proc(SMD=0.427) 不均衡']
    ],
    note: 'IPTW 加权后所有 SMD<0.1，达到平衡。加权前需使用 cobalt::bal.tab 或 CreateTableOne 进行检验'
  },
  'psw-survey-guide': {
    badge: '分析',
    icon: 'SY',
    title: '加权数据的回归分析流程',
    lead: 'IPTW 加权后使用 survey 包进行分析。R 自带的 glm/lm weights 参数不是样本权重，须使用 survey 包的 svydesign 框架。',
    steps: [
      ['建立加权设计', 'svydesign(ids=~1, data, weights=~wt) 建立加权设计对象'],
      ['产出基线表', 'svyCreateTableOne() 产出加权后的基线资料表'],
      ['加权回归', '在 glm(..., weights=wt) 或 svyglm() 中纳入权重进行回归分析'],
      ['结果解读', '本例：abcix1 系数=1.785，p=2.84e-08，提示 abcix=1 处理组的 6 个月生存率显著更高']
    ],
    note: '须使用 survey 包的 svydesign 框架，R 自带的 glm/lm weights 参数不是样本权重'
  },
  'psw-overlap-guide': {
    badge: '重叠加权',
    icon: 'OW',
    title: '重叠加权（Overlap Weighting）的原理与优势',
    lead: '重叠加权的目标人群是两组 PS 值分布相似的人（ATO，Average Treatment effect in the Overlap），权重公式为干预组权重=1-PS，对照组权重=PS。',
    steps: [
      ['权重公式', '干预组权重=1-PS，对照组权重=PS'],
      ['极端权重更小', '相比 IPTW，极端 PS 值产生的权重更小更稳定（本例 overlap ESS=287/570 vs IPTW ESS=202/671）'],
      ['估计目标', '仅使用重叠区域样本，估计的是重叠人群的效应（ATO）'],
      ['稳健性', '更稳健于模型假设的偏倚，适用场景为研究关注同质人群、PS 分布重叠较好时']
    ],
    note: '相比 IPTW，重叠加权的 ESS 损失更少，权重更稳定，适合 PS 分布重叠良好时使用'
  },
  'psw-comparison-guide': {
    badge: '对比',
    icon: 'CP',
    title: 'IPTW 与重叠加权的选择',
    lead: '三种加权目标人群对比：ATE（IPW）适用于全人群政策评估，ATT（IPTW）适用于治疗效果研究，ATO（重叠加权）适用于异质性治疗效果研究和 PS 分布重叠良好时。',
    steps: [
      ['ATE（IPW）', '全人群，A=T，权重=1/PS 或 1/(1-PS)，适合政策评估'],
      ['ATT（IPTW）', '处理组人群，权重=PS/(1-PS) 或 1，适合治疗效果研究'],
      ['ATO（重叠加权）', '重叠人群，权重=1-PS 或 PS，适合异质性治疗效果研究'],
      ['ESS 对比', '本例 overlap 加权后所有 SMD=0（完全均衡），ESS 损失更少，效应估计=1134.91']
    ],
    note: 'overlap 加权后所有 SMD=0（完全均衡），ESS 损失更少，效应估计更稳定'
  }
};

registerViz('psw-workflow-guide', renderGuide);
registerViz('psw-iptw-guide', renderGuide);
registerViz('psw-balance-guide', renderGuide);
registerViz('psw-survey-guide', renderGuide);
registerViz('psw-overlap-guide', renderGuide);
registerViz('psw-comparison-guide', renderGuide);