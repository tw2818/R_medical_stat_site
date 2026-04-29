import { registerViz } from './_core.js';

const STYLE_ID = 'rcs-guides-style';

const GUIDE_CARDS = {
  'rcs-workflow-guide': {
    badge: '样条回归',
    icon: 'RC',
    title: '何时使用限制性立方样条 (RCS)',
    lead: '限制性立方样条（RCS）是文献中最常用的非线性建模方法，适用于线性回归、Logistic回归和Cox回归。',
    steps: [
      ['线性回归', '当自变量与因变量呈非线性关系时，用 rcs(x, k) 替代 x'],
      ['Logistic回归', '用 lrm() + rcs() 拟合非线性概率关系，解读 OR 值曲线'],
      ['Cox回归', '用 cph() + rcs() 拟合非线性风险比（HR），用于探索协变量的非线性影响']
    ],
    note: '相比多项式回归，RCS在两端不会外推翘起，是医学文献中报告非线性关系的标准方法'
  },
  'rcs-knot-formula-guide': {
    badge: '公式写法',
    icon: 'KF',
    title: 'rcs() 函数的节点选择',
    lead: 'rcs(x, k) 中 k 表示节点数，节点位置默认按数据分位数确定。',
    steps: [
      ['节点数选择', '通常选3-6个节点；节点越多曲线越灵活，但过多易过拟合'],
      ['默认行为', '不指定knots时，rms包默认使用4个节点（k=4）'],
      ['手动指定', '可按分位数指定，如 rcs(x, c(10, 25, 50, 75, 90)) 表示百分位数节点']
    ],
    note: 'Harrell (Regression Modeling Strategies) 建议多数情况下4-5个节点足够'
  },
  'rcs-nonlinear-guide': {
    badge: '非线性检验',
    icon: 'NL',
    title: '如何判断是否符合非线性：ANOVA 的 Nonlinear 项',
    lead: 'anova() 输出的 Nonlinear 项可检验该变量是否真的需要非线性拟合。',
    steps: [
      ['Nonlinear P值', 'P < 0.05 表示数据确实存在非线性趋势，线性假设被拒绝'],
      ['解读示例', '本章age的 Nonlinear P=0.0055，说明年龄与结局的关系是非线性的'],
      ['决策', 'P < 0.05 → 用RCS；P ≥ 0.05 → 可用普通线性/Logistic回归替代']
    ],
    note: '这是选择RCS还是简单回归的统计依据，也是审稿人常问的检验方法'
  },
  'rcs-interpretation-guide': {
    badge: '结果解读',
    icon: 'IN',
    title: 'RCS 结果解读：HR / OR 与临床意义',
    lead: 'RCS输出曲线表示相对于参考点（默认中位数）的效应量（HR或OR）。',
    steps: [
      ['HR=1参考线', '横轴每一点的HR=1表示该处效应与参考水平相同'],
      ['HR>1 / HR<1', 'HR>1表示该区间为风险因素；HR<1表示保护因素'],
      ['临床拐点', 'HR曲线穿过HR=1的年龄点即为一个临床意义的分界点']
    ],
    note: '可通过 Predict(fit, age, fun=exp, ref.zero=T) 获取HR及95%CI，HR=1对应的x值即为拐点'
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
  if (!cfg) return;
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

registerViz('rcs-workflow-guide', renderGuide);
registerViz('rcs-knot-formula-guide', renderGuide);
registerViz('rcs-nonlinear-guide', renderGuide);
registerViz('rcs-interpretation-guide', renderGuide);