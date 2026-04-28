import { registerViz } from './_core.js';

const STYLE_ID = 'loglinear-guides-style';

const GUIDE_CARDS = {
  'loglinear-glm-connection': {
    badge: 'GLM bridge',
    icon: 'GLM',
    title: '从 Logistic 到对数线性模型',
    lead: '第21章 Logistic 回归处理“个体是否发生事件”；本章把列联表每个格子的频数当作结局，用 Poisson/log 连接描述分类变量之间的关联。',
    steps: [
      ['第21章', 'binomial() + logit：解释事件概率、odds 与 OR。'],
      ['第22章', 'poisson() + log：解释理论频数 μ 与交互项。'],
      ['第23章', '继续使用 Poisson/log 连接分析率和计数，并讨论过度离散与负二项。']
    ],
    note: '关键变化：Logistic 通常区分结局与解释变量；log-linear 在列联表中先把所有分类变量对称处理，再用交互项判断变量是否有关联。'
  },
  'loglinear-formula-guide': {
    badge: 'log(μ) formula',
    icon: 'log',
    title: '对数线性模型的公式读法',
    lead: '模型不是直接拟合观察频数 n，而是拟合每个格子的理论频数 μ，并让 log(μ) 等于主效应和交互项的线性组合。',
    steps: [
      ['主效应', '控制各变量边际合计下，不同水平的平均频数差异。'],
      ['二阶交互', '两个变量之间的关联；二维表中常对应卡方检验要检出的关系。'],
      ['高阶交互', '三维及以上列联表中，“关联是否随第三个变量分层而改变”。']
    ],
    note: '层次原则：如果模型保留 A:B:C，也必须保留 A:B、A:C、B:C 和 A、B、C。'
  },
  'loglinear-fit-test-guide': {
    badge: 'G² / Pearson X²',
    icon: 'χ²',
    title: '拟合优度检验怎么读',
    lead: 'loglm 输出同时给似然比 G² 和 Pearson X²；二者都在比较“当前简化模型”与“饱和模型”对格子频数的拟合差距。',
    steps: [
      ['本例简化模型', '性别 + 血压，不含 性别:血压 交互项。'],
      ['G²', 'Likelihood Ratio = 49.84297，df=1，P=1.665557e-12。'],
      ['Pearson X²', 'Pearson = 50.04632，df=1，P=1.501577e-12。']
    ],
    note: 'P 很小表示去掉交互项后拟合明显变差，因此性别与血压并不独立，应保留交互项或使用饱和模型。'
  },
  'loglinear-or-bridge-guide': {
    badge: 'interaction β → OR',
    icon: 'OR',
    title: '为什么 Poisson GLM 也能算 OR',
    lead: '2×2 列联表用 Poisson GLM 拟合频数时，交互项系数可转回 odds ratio；这正好衔接第21章 Logistic 回归中的 OR 解释。',
    steps: [
      ['交互系数', '性别女性:血压高血压 = -0.5820837。'],
      ['取指数', 'exp(-0.5820837) = 0.5587329。'],
      ['解释', '女性相对男性的高血压 odds 比约为 0.559；方向和关联强度来自交互项。']
    ],
    note: '这里的 OR 是 2×2 表交互项的另一种表达；不要把主效应系数单独解释成调整后的因果效应。'
  },
  'loglinear-model-hierarchy-guide': {
    badge: 'hierarchical model',
    icon: 'AIC',
    title: '三维列联表：从饱和模型往下删',
    lead: '三维列联表的核心不是只做一个总体卡方，而是比较不同层次模型：哪些交互项必须保留，哪些可以删除。',
    steps: [
      ['饱和模型', '包含所有主效应、二阶交互和三阶交互，拟合完美但解释复杂。'],
      ['逐步筛选', 'step() 根据 AIC 删除三阶交互和部分二阶交互。'],
      ['最终模型', 'G²=0.09702652，df=2，P=0.9526447；简化模型与饱和模型无显著差异。']
    ],
    note: '教学示意：AIC 只是自动筛选线索，正式分析还要结合研究设计、分层变量和事先假设。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .loglinear-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .loglinear-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .loglinear-guide-icon{width:46px;height:46px;border-radius:15px;background:linear-gradient(135deg,#475569,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;box-shadow:0 8px 18px rgba(71,85,105,.22);}
    .loglinear-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .loglinear-guide-badge{display:inline-block;background:#e0e7ff;color:#4338ca;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .loglinear-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .loglinear-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;}
    .loglinear-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;}
    .loglinear-guide-item strong{display:block;color:#312e81;margin-bottom:6px;}
    .loglinear-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #818cf8;border-radius:10px;padding:10px 12px;}
    .loglinear-strata{display:grid;grid-template-columns:1.05fr .95fr;gap:14px;align-items:stretch;}
    .loglinear-mini-table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;}
    .loglinear-mini-table th,.loglinear-mini-table td{padding:8px 10px;text-align:right;border-bottom:1px solid #eef2f7;font-size:13px;}
    .loglinear-mini-table th:first-child,.loglinear-mini-table td:first-child{text-align:left;}
    .loglinear-pill{display:inline-block;border-radius:999px;padding:3px 9px;background:#ede9fe;color:#5b21b6;font-weight:700;font-size:12px;}
    .loglinear-signal{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;}
    .loglinear-signal-row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px dashed #e2e8f0;padding-bottom:7px;}
    .loglinear-signal-row strong{color:#1e293b;}
    @media(max-width:760px){.loglinear-strata{grid-template-columns:1fr}.loglinear-guide-card{padding:14px}}
  `;
  document.head.appendChild(style);
}

function renderGuide(el) {
  ensureStyles();
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['loglinear-glm-connection'];
  el.innerHTML = `
    <div class="loglinear-guide-card">
      <div class="loglinear-guide-head">
        <div class="loglinear-guide-icon">${cfg.icon}</div>
        <div><span class="loglinear-guide-badge">${cfg.badge}</span><h3 class="loglinear-guide-title">${el.dataset.title || cfg.title}</h3></div>
      </div>
      <p class="loglinear-guide-lead">${cfg.lead}</p>
      <div class="loglinear-guide-grid">
        ${cfg.steps.map(([title, text]) => `<div class="loglinear-guide-item"><strong>${title}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="loglinear-guide-note">${cfg.note}</div>
    </div>`;
}

function renderMarginalStratifiedDemo(el) {
  ensureStyles();
  el.innerHTML = `
    <div class="loglinear-guide-card">
      <div class="loglinear-guide-head">
        <div class="loglinear-guide-icon">2×2×2</div>
        <div><span class="loglinear-guide-badge">marginal vs stratified</span><h3 class="loglinear-guide-title">${el.dataset.title || '合并显著，分层不显著：为什么要用多维模型'}</h3></div>
      </div>
      <p class="loglinear-guide-lead">例17-1的真实输出说明：把两个诊所合并后，护理量与存活情况看似有关；但在每个诊所内，这个关系并不显著，同时护理量与诊所高度相关。性别×血压示例的真实频数为 579、485、1032、483，用于后续 G²、Pearson X² 与 OR 衔接。</p>
      <div class="loglinear-strata">
        <table class="loglinear-mini-table" aria-label="例17-1合并和分层卡方结果">
          <thead><tr><th>分析层次</th><th>X²</th><th>P值</th><th>结论</th></tr></thead>
          <tbody>
            <tr><td>合并 2×2 表</td><td>5.2555</td><td>0.02188</td><td><span class="loglinear-pill">有关联</span></td></tr>
            <tr><td>诊所甲内</td><td>0.083522</td><td>0.7726</td><td>不显著</td></tr>
            <tr><td>诊所乙内</td><td>0.000096</td><td>0.9922</td><td>不显著</td></tr>
            <tr><td>护理量 × 诊所</td><td>173.37</td><td>&lt;2.2e-16</td><td><span class="loglinear-pill">强相关</span></td></tr>
          </tbody>
        </table>
        <div class="loglinear-signal">
          <div class="loglinear-signal-row"><span>简单合并</span><strong>可能混杂</strong></div>
          <div class="loglinear-signal-row"><span>按 Z 分层</span><strong>关系改变</strong></div>
          <div class="loglinear-signal-row"><span>log-linear</span><strong>同时建模 X、Y、Z</strong></div>
          <div class="loglinear-guide-note">教学示意：多维列联表的目的，是把“边际关联”和“条件关联”放在同一个模型框架里比较。</div>
        </div>
      </div>
    </div>`;
}

registerViz('loglinear-glm-connection', renderGuide);
registerViz('loglinear-marginal-stratified-demo', renderMarginalStratifiedDemo);
registerViz('loglinear-formula-guide', renderGuide);
registerViz('loglinear-fit-test-guide', renderGuide);
registerViz('loglinear-or-bridge-guide', renderGuide);
registerViz('loglinear-model-hierarchy-guide', renderGuide);
