import { registerViz } from './_core.js';

const GUIDE_CARDS = {
  'rm-wide-to-long-guide': {
    icon: '🔁',
    title: '重复测量数据第一步：宽表变长表',
    cards: [
      ['宽表', '每个受试者一行，多个时间点分散在 x1、x2 或 t0–t4 多列，适合录入和核对原始数据。', 'wide'],
      ['长表', '每个受试者 × 每个时间点各占一行，形成 id、组别、时间、结局四类变量。', 'long'],
      ['受试者编号', 'n 或 No 必须转为因子，因为它代表“同一个人被重复测量”，不是连续数值协变量。', 'id'],
      ['分析目的', '长表让 R 明确区分组间差别、时间变化，以及组别 × 时间交互。', 'ANOVA'],
    ],
  },
  'rm-formula-guide': {
    icon: '🧮',
    title: '公式怎么读：time * group + Error(id/time)',
    cards: [
      ['time * group', '等价于 time + group + time:group，同时检验时间主效应、组别主效应和交互效应。', 'fixed effects'],
      ['Error(n/time)', '表示同一受试者 n 内嵌套时间 time；时间效应要用受试者内误差层检验。', 'error strata'],
      ['Error(No/(times))', '多时间点时写法相同：No 是受试者，times 是组内重复测量因素。', 'repeated'],
      ['别把 id 当组别', '受试者编号只用于描述相关结构，不能和处理组 group 混在同一个解释层。', 'pitfall'],
    ],
  },
  'rm-factor-type-guide': {
    icon: '🧩',
    title: '先分清：组内因素 vs 组间因素',
    cards: [
      ['组内因素', '同一个受试者会经历所有水平，例如治疗前/后或 t0–t4。英文常称 within-subject factor。', 'within-subject'],
      ['组间因素', '每个受试者只属于一个水平，例如处理组/对照组或 A/B/C 麻醉诱导方法。', 'between-subject'],
      ['交互效应', '如果不同组随时间变化的曲线不平行，就要重点解释 group:time 或 group:times。', 'interaction'],
      ['医学表述', '先说总体组别差异，再说时间变化，最后说明“变化趋势是否因组别而异”。', 'report'],
    ],
  },
  'rm-result-strata-guide': {
    icon: '📚',
    title: 'summary(aov) 为什么输出两张表',
    cards: [
      ['Error: n / No', '这是受试者之间误差层，主要用于检验组间因素 group。', 'between'],
      ['Error: n:time', '这是受试者内误差层，用于检验 time 以及 time:group。', 'within'],
      ['看哪张表', 'group 看第一张；time 和交互效应看第二张。不要把 F 值跨误差层比较。', 'read'],
      ['例12-1结论', 'time 与 time:group 显著，提示血压前后变化明显，且两组变化幅度不同。', 'example'],
    ],
  },
  'rm-anova-test-result-guide': {
    icon: '🧾',
    title: 'anova_test() 输出怎么读：ANOVA、Mauchly、校正',
    cards: [
      ['ANOVA 表', '先看 Effect、F、p 和 ges：group、times、group:times 分别对应组别、时间和交互。', 'ANOVA'],
      ['Mauchly', 'Mauchly W 和 p 用来判断球形假设；p < 0.05 时要查看球形校正结果。', 'sphericity'],
      ['GGe / HFe', 'GGe 是 Greenhouse-Geisser ε，HFe 是 Huynh-Feldt ε，越接近 1 说明校正越小。', 'epsilon'],
      ['p[GG] / p[HF]', '球形不满足时，优先报告校正后的自由度和 P 值，尤其是 GG 或 HF 列。', 'corrected p'],
    ],
  },
  'rm-multcompare-guide': {
    icon: '🎯',
    title: '重复测量多重比较要先问清楚三个问题',
    cards: [
      ['组间差别', '比较 A/B/C 或处理组/对照组整体均值差异，可沿用 LSD、Tukey、Bonferroni 等思路。', 'between groups'],
      ['时间趋势比较', '把有序时间点拆成线性、二次、三次等正交多项式，判断变化形状。', 'trend'],
      ['时间点比较', '在每组内比较 t0 与 t1、t2、t3、t4，常用配对 t 检验并做 P 值校正。', 'time points'],
      ['先验 vs 事后', '课本中的“事前检验”通常围绕预先指定的基线时间点，不应无限制两两比较。', 'planned'],
    ],
  },
};

function ensureRepeatedAnovaStyles() {
  if (document.getElementById('rm-anova-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'rm-anova-guide-styles';
  style.textContent = `
    .rm-anova-card{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:980px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .rm-anova-header{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .rm-anova-icon{font-size:18px;line-height:1;}
    .rm-anova-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px;}
    .rm-anova-item{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 14px;box-shadow:0 2px 8px rgba(15,23,42,.035);min-height:144px;}
    .rm-anova-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:11px;}
    .rm-anova-title{font-size:16px;font-weight:750;line-height:1.35;color:#0f172a;margin:0 0 8px;}
    .rm-anova-desc{font-size:13.5px;line-height:1.7;color:#64748b;margin:0;}
    @media (max-width:980px){.rm-anova-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media (max-width:640px){.rm-anova-grid{grid-template-columns:1fr;}.rm-anova-item{min-height:auto;}}
  `;
  document.head.appendChild(style);
}

function renderRepeatedAnovaGuide(el) {
  ensureRepeatedAnovaStyles();
  const type = el.dataset.type;
  const config = GUIDE_CARDS[type] || GUIDE_CARDS['rm-wide-to-long-guide'];
  const title = el.dataset.title || config.title;
  el.innerHTML = `
    <section class="rm-anova-card" aria-label="${title}">
      <div class="rm-anova-header"><span class="rm-anova-icon">${config.icon}</span><span>${title}</span></div>
      <div class="rm-anova-grid">
        ${config.cards.map(([heading, desc, badge]) => `
          <article class="rm-anova-item">
            <span class="rm-anova-badge">${badge}</span>
            <h4 class="rm-anova-title">${heading}</h4>
            <p class="rm-anova-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

registerViz('rm-wide-to-long-guide', renderRepeatedAnovaGuide);
registerViz('rm-formula-guide', renderRepeatedAnovaGuide);
registerViz('rm-factor-type-guide', renderRepeatedAnovaGuide);
registerViz('rm-result-strata-guide', renderRepeatedAnovaGuide);
registerViz('rm-anova-test-result-guide', renderRepeatedAnovaGuide);
registerViz('rm-multcompare-guide', renderRepeatedAnovaGuide);
