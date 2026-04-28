import { registerViz } from './_core.js';

const STYLE_ID = 'poisson-guides-style';

const GUIDE_CARDS = {
  'poisson-glm-connection': {
    badge: 'log link continuity',
    icon: 'log',
    title: '从第22章到第23章：同一个 log 连接',
    lead: '第22章用 Poisson/log 连接拟合列联表格子频数；第23章继续用 Poisson/log 连接，但把结局换成单位人年、空间或时间内的事件数。',
    steps: [
      ['第22章', 'log(μ)=主效应+交互项；重点是分类变量之间是否有关联。'],
      ['第23章', 'log(μ)=线性预测值+log(N)；重点是事件率和率比。'],
      ['共同点', '系数取指数后都进入乘法尺度，便于解释 RR/IRR 或相对频数。']
    ],
    note: '教学示意：本章不是重新发明一套模型，而是把 GLM 的 log 连接用于带暴露量/观察单位数的计数结局。'
  },
  'poisson-offset-guide': {
    badge: 'offset = log(N)',
    icon: 'N',
    title: '为什么要加 offset？',
    lead: '事件数 Y 会随观察人年 N 增加而自然增加。offset=log(N) 把不同观察量校准到“率”的比较，而不是简单比较死亡数。',
    steps: [
      ['模型写法', 'log(E[Y]) = β₀ + βX + log(N)。'],
      ['移项理解', 'log(E[Y]/N) = β₀ + βX，因此建模对象是事件率。'],
      ['本例 N', 'N 是观察单位数/人年；同样死亡数在不同 N 下代表不同风险。']
    ],
    note: 'offset 的系数固定为 1，不参与估计；它是“校正暴露量”的结构项，不是普通协变量。'
  },
  'poisson-irr-guide': {
    badge: 'β → IRR/RR',
    icon: 'RR',
    title: 'Poisson 回归系数怎么解释',
    lead: 'log 连接下，回归系数 β 位于对数率尺度；取指数后就是发生率比 IRR，也常在医学教材中解释为相对危险度 RR。',
    steps: [
      ['砷暴露系数', 'β=0.8108698，对应 exp(β)=2.249864。'],
      ['95%CI', 'exp(confint)：1.7726609281 到 2.850500。'],
      ['解释模板', '控制年龄后，暴露组呼吸道疾病死亡率约为非暴露组的 2.25 倍。']
    ],
    note: '与第21章 Logistic 的 OR 类似，Poisson 回归也常通过 exp(β) 进入临床可读的乘法效应尺度。'
  },
  'poisson-overdispersion-guide': {
    badge: 'overdispersion',
    icon: 'Var',
    title: '过度离散：Poisson 模型的关键诊断',
    lead: '标准 Poisson 假设 E(Y)=Var(Y)。当实际方差更大时，标准误会被低估，P 值容易偏小，需要改用 quasi-Poisson 或负二项模型。',
    steps: [
      ['残差偏差检验', 'deviance P=0.01916785，小于 0.05。'],
      ['Pearson 检验', 'Pearson P=0.02137005，也提示拟合不足。'],
      ['check_overdispersion()', 'dispersion ratio=3.231，Pearson X²=9.692，P=0.021。']
    ],
    note: '这里的 3.231 可以粗略理解为实际离散程度约为 Poisson 理想假设的 3.2 倍。'
  },
  'poisson-model-choice-guide': {
    badge: 'model choice',
    icon: '✓',
    title: 'Poisson、quasi-Poisson、负二项怎么选',
    lead: '先拟合 Poisson，再诊断过度离散；如果存在过度离散，quasi-Poisson 调整标准误，负二项则显式建模额外离散。',
    steps: [
      ['Poisson', '适合均值≈方差的独立计数；可用 AIC 比较模型。'],
      ['quasi-Poisson', '本例 dispersion=3.23081，系数不变、标准误变大；AIC=NA。'],
      ['负二项', '适合 Var(Y)>E(Y) 的计数结局，可估计 theta 并使用 AIC。']
    ],
    note: '教学示意：quasi-Poisson 更像“修正推断”，负二项更像“换一个能容纳过度离散的数据生成模型”。'
  },
  'poisson-nb-result-guide': {
    badge: 'glm.nb output',
    icon: 'NB',
    title: '负二项回归输出怎么读',
    lead: 'glm.nb() 仍使用 log 连接，因此系数取指数后也是计数均值或率的比值；额外的 theta 用来描述过度离散。',
    steps: [
      ['Theta', 'theta=0.3003，Std.Err.=0.0764；theta 越大越接近 Poisson 分布。'],
      ['模型拟合', 'AIC=426.23，可用于同类模型之间比较。'],
      ['城市 vs 农村', 'x1城市 β=-1.9572；反向解释为农村约为城市的 exp(1.9572)=7.08 倍。']
    ],
    note: '注意方向：输出中的负系数表示“城市相对农村更低”；若写成“农村相对城市”，需要把符号反过来取指数。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .poisson-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .poisson-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .poisson-guide-icon{width:46px;height:46px;border-radius:15px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;box-shadow:0 8px 18px rgba(37,99,235,.24);}
    .poisson-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .poisson-guide-badge{display:inline-block;background:#e0e7ff;color:#4338ca;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .poisson-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .poisson-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;}
    .poisson-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;}
    .poisson-guide-item strong{display:block;color:#1e3a8a;margin-bottom:6px;}
    .poisson-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #818cf8;border-radius:10px;padding:10px 12px;}
    @media(max-width:680px){.poisson-guide-card{padding:14px}.poisson-guide-head{align-items:flex-start}}
  `;
  document.head.appendChild(style);
}

function renderGuide(el) {
  ensureStyles();
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['poisson-glm-connection'];
  el.innerHTML = `
    <div class="poisson-guide-card">
      <div class="poisson-guide-head">
        <div class="poisson-guide-icon">${cfg.icon}</div>
        <div><span class="poisson-guide-badge">${cfg.badge}</span><h3 class="poisson-guide-title">${el.dataset.title || cfg.title}</h3></div>
      </div>
      <p class="poisson-guide-lead">${cfg.lead}</p>
      <div class="poisson-guide-grid">
        ${cfg.steps.map(([title, text]) => `<div class="poisson-guide-item"><strong>${title}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="poisson-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('poisson-glm-connection', renderGuide);
registerViz('poisson-offset-guide', renderGuide);
registerViz('poisson-irr-guide', renderGuide);
registerViz('poisson-overdispersion-guide', renderGuide);
registerViz('poisson-model-choice-guide', renderGuide);
registerViz('poisson-nb-result-guide', renderGuide);
