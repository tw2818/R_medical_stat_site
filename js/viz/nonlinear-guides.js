import { registerViz } from './_core.js';

const STYLE_ID = 'nonlinear-guides-style';

const GUIDE_CARDS = {
  'nonlinear-workflow-guide': {
    badge: '多项式拟合',
    icon: 'WF',
    title: '何时使用多项式 / 分段 / 样条',
    lead: '非线性关系的建模有三种常用方法，各有适用场景。',
    steps: [
      ['多项式回归', '数据光滑且单调时适用；优点是简单，缺点是两端容易外推不佳'],
      ['分段回归', '当数据在某些节点有明显转折时适用；需预先确定节点位置'],
      ['样条回归', '灵活性高，无需指定函数形式；限制性立方样条是文献中最常用的方法']
    ],
    note: '本章重点介绍多项式回归，下一章（样条回归）将介绍样条方法'
  },
  'nonlinear-poly-formula-guide': {
    badge: '公式写法',
    icon: 'PF',
    title: '多项式回归的两种公式写法',
    lead: 'R语言中多项式回归有两种写法：I()语法和poly()函数。',
    steps: [
      ['I()语法', 'lm(y ~ x + I(x^2) + I(x^3))，显式写出每项，公式较长'],
      ['poly()函数', 'lm(y ~ poly(x, 3))，更简洁；poly()生成正交多项式，避免多重共线性'],
      ['正交多项式优点', '系数间不相关，统计推断更稳定；次数越高越容易过拟合']
    ],
    note: '推荐使用poly()，尤其是次数较高时；若需解释原始尺度系数，可用 raw=poly()'
  },
  'nonlinear-degree-guide': {
    badge: '模型选择',
    icon: 'DG',
    title: '如何根据统计检验选择多项式次数',
    lead: '通过似然比检验（或ANOVA）逐次比较相邻次数模型的拟合优度。',
    steps: [
      ['线性 vs 二次', 'P<0.001，二次项显著优于线性，说明数据存在弯曲趋势'],
      ['二次 vs 三次', 'P=0.082，在α=0.05水平下不显著，三次项无额外贡献'],
      ['决策', '选择二次项（degree=2）：最简单的充分模型，避免过拟合']
    ],
    note: '原则：选择使模型改善有统计学意义的最低次数'
  },
  'nonlinear-poly-glm-guide': {
    badge: 'GLM扩展',
    icon: 'GL',
    title: '多项式在 GLM / Cox 回归中的应用',
    lead: '多项式项同样可以纳入广义线性模型和Cox回归，只需更换连接函数。',
    steps: [
      ['Logistic回归', 'glm(y ~ poly(x,2), family=binomial)，用于非线性概率建模'],
      ['Cox回归', 'coxph(Surv(time,status) ~ poly(x,2))，用于非线性生存分析'],
      ['解读', '与普通OLS回归相同——关注系数方向和显著性，以及预测曲线形态']
    ],
    note: '多项式结构不变，只需将lm()替换为glm()或coxph()'
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

registerViz('nonlinear-workflow-guide', renderGuide);
registerViz('nonlinear-poly-formula-guide', renderGuide);
registerViz('nonlinear-degree-guide', renderGuide);
registerViz('nonlinear-poly-glm-guide', renderGuide);
