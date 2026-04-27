import { registerViz } from './_core.js';

const GUIDE_CONFIG = {
  'factorial-formula-guide': {
    icon: '🧩',
    title: '三因素析因设计：公式和结果怎么读',
    cards: [
      ['a * b * c', '等价于 a + b + c + a:b + a:c + b:c + a:b:c。先看高阶交互，再解释主效应。', '完整模型'],
      ['主效应', '回答“某个因素平均而言是否影响结局”。本例 a、b、c 都有主效应，其中 c 的影响最大。', 'main effects'],
      ['二阶交互', '回答“一个因素的效应是否随另一个因素水平而变”。本例 b:c 显著，说明环境和活动状态存在联合作用。', 'interaction'],
      ['三阶交互', '若 a:b:c 不显著，通常不强行解释三因素联合效应，回到显著的主效应和二阶交互。', 'a:b:c'],
    ],
  },
  'orthogonal-design-guide': {
    icon: '🎛️',
    title: '正交设计：用更少组合估计主要因素',
    cards: [
      ['完整析因', '4 个两水平因素完整组合需要 2⁴ = 16 次试验；每种组合都出现。', '完整'],
      ['L8 正交表', '本例只做 8 次试验，用均衡安排保留主要信息，因此常被说成“残缺不全版本的析因设计”。', '省试验'],
      ['模型指定', '不能默认包含全部交互。这里写 a + b + c + d + a:b，是按设计表和研究目的指定要估计的效应。', '公式'],
      ['解释边界', '样本/试验次数少，自由度紧张；显著性要结合设计目的、效应方向和实验可重复性解释。', '谨慎'],
    ],
  },
  'nested-design-guide': {
    icon: '🌳',
    title: '嵌套设计：二级因素只属于某个一级因素',
    cards: [
      ['一级因素', 'factor1 是催化剂 A/B/C。每个催化剂下面有自己的温度设置。', 'factor1'],
      ['二级因素', 'factor2 不是所有催化剂共享的同一组水平，而是“嵌套在 factor1 内”的温度。', 'factor2'],
      ['R 公式', 'factor1 / factor2 等价于 factor1 + factor1:factor2，重点不是普通交互，而是层级来源。', '/'],
      ['误差理解', '先比较催化剂之间差异，再看同一催化剂内部不同温度造成的差异。', '层级'],
    ],
  },
  'split-plot-guide': {
    icon: '🐇',
    title: '裂区设计：整区因素和裂区因素用不同误差项',
    cards: [
      ['整区因素', 'factorA 作用在家兔这个一级实验单位上：每只家兔只接受 A 的一个水平。', 'whole plot'],
      ['裂区因素', 'factorB 作用在二级实验单位上：每只家兔内有两个注射部位/浓度水平。', 'subplot'],
      ['两层误差', 'A 用家兔间误差检验；B 和 A:B 用家兔内的 id:factorB 误差检验。', 'error strata'],
      ['R 公式', 'Error(id/factorB) 告诉 aov()：id 是整区，factorB 在 id 内重复/裂分。', 'Error()'],
    ],
  },
};

function ensureFactorialGuideStyles() {
  if (document.getElementById('factorial-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'factorial-guide-styles';
  style.textContent = `
    .factorial-guide-card{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:980px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .factorial-guide-header{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .factorial-guide-icon{font-size:18px;line-height:1;}
    .factorial-guide-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px;}
    .factorial-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 14px;box-shadow:0 2px 8px rgba(15,23,42,.035);min-height:140px;}
    .factorial-guide-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:11px;}
    .factorial-guide-title{font-size:16px;font-weight:750;line-height:1.35;color:#0f172a;margin:0 0 8px;}
    .factorial-guide-desc{font-size:13.5px;line-height:1.7;color:#64748b;margin:0;}
    @media (max-width:980px){.factorial-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media (max-width:640px){.factorial-guide-grid{grid-template-columns:1fr;}.factorial-guide-item{min-height:auto;}}
  `;
  document.head.appendChild(style);
}

function renderFactorialDesignGuide(el) {
  ensureFactorialGuideStyles();
  const config = GUIDE_CONFIG[el.dataset.type] || GUIDE_CONFIG['factorial-formula-guide'];
  const title = el.dataset.title || config.title;
  el.innerHTML = `
    <section class="factorial-guide-card" aria-label="${title}">
      <div class="factorial-guide-header"><span class="factorial-guide-icon">${config.icon}</span><span>${title}</span></div>
      <div class="factorial-guide-grid">
        ${config.cards.map(([heading, desc, badge]) => `
          <article class="factorial-guide-item">
            <span class="factorial-guide-badge">${badge}</span>
            <h4 class="factorial-guide-title">${heading}</h4>
            <p class="factorial-guide-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

registerViz('factorial-formula-guide', renderFactorialDesignGuide);
registerViz('orthogonal-design-guide', renderFactorialDesignGuide);
registerViz('nested-design-guide', renderFactorialDesignGuide);
registerViz('split-plot-guide', renderFactorialDesignGuide);
