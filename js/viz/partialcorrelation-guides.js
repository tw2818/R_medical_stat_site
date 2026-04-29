import { registerViz } from './_core.js';

const STYLE_ID = 'partialcorrelation-guides-style';

const GUIDE_CARDS = {
  'partialcorr-concept-guide': {
    badge: 'partial',
    icon: '⊥',
    title: '偏相关的概念',
    lead: '偏相关是在控制其他变量影响后，衡量两个变量之间纯相关关系的统计方法。',
    steps: [
      ['控制变量', '控制第三个（或更多）变量的影响，剥离出两个变量间的"净相关"'],
      ['公式', '偏相关系数 r_xy.z = (r_xy - r_xz*r_yz) / sqrt((1-r_xz²)(1-r_yz²))'],
      ['应用', '当变量间存在混杂因素时，简单相关系数会高估或低估真实相关']
    ],
    note: '偏相关要求数据服从多元正态分布；控制变量不宜过多（样本量的1/10）'
  },
  'partialcorr-vs-simple-guide': {
    badge: 'r vs pr',
    icon: 'Δ',
    title: '偏相关与简单相关',
    lead: '简单相关系数可能受混杂变量驱动，偏相关系数揭示真实成对关系。',
    steps: [
      ['简单相关', 'r_xy：x和y的直接相关性，不考虑其他变量'],
      ['偏相关', 'r_xy.z：在控制z后x和y的相关性'],
      ['差异原因', '混杂变量在两个方向上都与x和y相关时，简单相关会失真']
    ],
    note: '若简单相关与偏相关差异大，提示存在混杂；差异小说明关系真实'
  },
  'canonicalcorr-concept-guide': {
    badge: 'cancor',
    icon: '↔',
    title: '典型相关的概念',
    lead: '典型相关分析研究两组变量之间的整体相关性，是简单相关向多维扩展。',
    steps: [
      ['两组变量', '一组因变量(Y1,Y2,...)、一组自变量(X1,X2,...)'],
      ['典型变量', '每个组合投影为一个典型变量U=a\'Y, V=b\'X'],
      ['典型相关系数', '找到使U和V相关性最大的权重(a,b)']
    ],
    note: '典型相关是Pearson相关的多元扩展；需要足够样本量（每组变量×10）'
  },
  'canonicalcorr-interpretation-guide': {
    badge: '解读',
    icon: '⊤',
    title: '典型相关结果解读',
    lead: '典型相关输出包含多个典型相关系数及其显著性检验。',
    steps: [
      ['典型相关系数', 'λ1 ≥ λ2 ≥ ...，反映每对典型变量的相关性强度'],
      ['载荷系数', '原始变量在典型变量上的权重，解释典型变量的含义'],
      ['显著性检验', 'Wilks λ / Pillai / Hotelling-Lawley / Roy 检验']
    ],
    note: '载荷系数的绝对值越大，该变量对典型变量的贡献越大'
  },
  'canonicalcorr-redundancy-guide': {
    badge: 'redundancy',
    icon: '%',
    title: '典型相关系数与冗余度',
    lead: '冗余度指数衡量一个典型变量组能解释另一组变量的程度。',
    steps: [
      ['冗余度指数', '典型变量U能被原始Y组解释的比例'],
      ['解释能力', '第一典型变量通常解释最多，后续递减'],
      ['应用', '选择冗余度高、对结果解释力强的典型变量对']
    ],
    note: '冗余度帮助判断哪些原始变量对canonical correlation贡献最大'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .partialcorrelation-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .partialcorrelation-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .partialcorrelation-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#0f766e,#14b8a6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;box-shadow:0 8px 18px rgba(15,118,110,.22);}
    .partialcorrelation-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .partialcorrelation-guide-badge{display:inline-block;background:#ccfbf1;color:#0f766e;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .partialcorrelation-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .partialcorrelation-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:12px;}
    .partialcorrelation-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .partialcorrelation-guide-item strong{display:block;color:#115e59;margin-bottom:6px;}
    .partialcorrelation-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #14b8a6;border-radius:10px;padding:10px 12px;}
    @media(max-width:720px){.partialcorrelation-guide-card{padding:14px}.partialcorrelation-guide-head{align-items:flex-start}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['partialcorr-concept-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="partialcorrelation-guide-card">
      <div class="partialcorrelation-guide-head">
        <div class="partialcorrelation-guide-icon">${cfg.icon}</div>
        <div><span class="partialcorrelation-guide-badge">${cfg.badge}</span><h3 class="partialcorrelation-guide-title">${title}</h3></div>
      </div>
      <p class="partialcorrelation-guide-lead">${cfg.lead}</p>
      <div class="partialcorrelation-guide-grid">
        ${cfg.steps.map(([stepTitle, text]) => `<div class="partialcorrelation-guide-item"><strong>${stepTitle}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="partialcorrelation-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('partialcorr-concept-guide', renderGuide);
registerViz('partialcorr-vs-simple-guide', renderGuide);
registerViz('canonicalcorr-concept-guide', renderGuide);
registerViz('canonicalcorr-interpretation-guide', renderGuide);
registerViz('canonicalcorr-redundancy-guide', renderGuide);