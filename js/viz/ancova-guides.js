import { registerViz } from './_core.js';

const GUIDE_CARDS = {
  'ancova-workflow-guide': {
    icon: '📐',
    title: 'ANCOVA 怎么做：先校正，再比较',
    cards: [
      ['明确目的', '协方差分析不是普通 ANOVA，而是在扣除协变量影响后比较各组结局均值。', 'goal'],
      ['选协变量', '协变量常是治疗前基线值、年龄、BMI 等；它应与结局相关，并在统计上需要控制。', 'covariate'],
      ['先查假设', '重点确认协变量与结局近似线性，且不同组回归斜率相同。', 'assumption'],
      ['解释组效应', '模型中的 group 代表“在协变量相同水平下”的调整后组间差异。', 'group'],
    ],
  },
  'ancova-formula-guide': {
    icon: '🧮',
    title: '公式怎么读：y ~ x + group',
    cards: [
      ['y', '结局变量，例如治疗后糖化血红蛋白或测量后的反应值。', 'outcome'],
      ['x', '协变量，例如治疗前基线值；先进入模型以扣除它对 y 的线性影响。', 'covariate'],
      ['group', '处理组或分类因素；检验的是调整协变量后的组间差异。', 'factor'],
      ['顺序', 'Type I SS 中顺序会影响结果，所以教学示例强调把协变量放在主变量前面。', 'order'],
    ],
  },
  'ancova-assumption-guide': {
    icon: '✅',
    title: 'ANCOVA 条件：别只看 P 值',
    cards: [
      ['线性关系', '协变量 x 与结局 y 应近似线性；散点图和残差图都要先看。', 'linearity'],
      ['平行斜率', '不同组的 x→y 回归斜率应相同。可用含交互项的模型 y ~ x * group 检查 x:group。', 'x:group'],
      ['残差正态', '模型残差近似正态比原始变量正态更关键。样本较大时 ANCOVA 相对稳健。', 'residuals'],
      ['方差齐性', '各组残差方差应相近；必要时报告 Levene 检验或使用稳健方法。', 'variance'],
    ],
  },
  'ancova-adjusted-mean-guide': {
    icon: '📊',
    title: '调整后均值：ANCOVA 真正比较的对象',
    cards: [
      ['原始均值', '直接比较各组 y 的平均数，可能混入基线 x 不平衡带来的偏倚。', 'raw mean'],
      ['调整后均值', '把协变量固定在同一水平后得到各组预测均值，也常称 LS means / estimated marginal means。', 'adjusted mean'],
      ['报告重点', '结果应写成“经基线 x 校正后，三组 y 的调整后均值差异有/无统计学意义”。', 'report'],
      ['下一步', '若 group 显著，通常继续比较调整后组间差异，并给出 95% CI。', '95% CI'],
    ],
  },
  'ancova-result-guide': {
    icon: '🧾',
    title: 'ANCOVA 表怎么读：x、group、Residuals',
    cards: [
      ['x 行', '协变量贡献。例13-1中 x 的 F 很大，说明基线值与结局高度相关。', 'covariate'],
      ['group 行', '核心研究问题：扣除 x 后各组是否仍有差异。例13-1中 group F = 58.48。', 'group'],
      ['Residuals', '残差平方和、自由度和均方提供误差项，是 F 检验的分母。', 'error'],
      ['效应量', 'rstatix 输出 ges，可辅助说明调整后组效应大小，而不只是 P 值。', 'ges'],
    ],
  },
  'ancova-block-guide': {
    icon: '🧱',
    title: '随机区组 ANCOVA：多控制一个 block',
    cards: [
      ['完全随机', '模型 y ~ x + group：只控制协变量 x，再比较 group。', 'one-way'],
      ['随机区组', '模型 y ~ x + block + group：同时控制协变量和区组差异。', 'block'],
      ['block 作用', '区组吸收批次、中心、窝别或个体配对带来的系统差异，提高比较精度。', 'control'],
      ['解释顺序', '先确认 x 与 block 的贡献，再看 group 是否仍有调整后差异。', 'read'],
    ],
  },
  'ancova-multcompare-guide': {
    icon: '🔍',
    title: 'group 显著以后：比较调整后组间差异',
    cards: [
      ['先看总体', '只有 ANCOVA 中 group 总体检验有意义时，才进入调整后均值的两两比较。', 'overall'],
      ['推荐工具', '可用 emmeans 获取 adjusted mean / LS means，并进行 pairwise comparisons。', 'emmeans'],
      ['校正方法', '常见 Bonferroni、Tukey、Holm 等；报告时说明多重比较校正方法。', 'adjust'],
      ['报告格式', '给出调整后均值差异、95% CI 和校正后 P 值，比只写“有差异”更完整。', '95% CI'],
    ],
  },
};

function ensureAncovaGuideStyles() {
  if (document.getElementById('ancova-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'ancova-guide-styles';
  style.textContent = `
    .ancova-guide-card{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:980px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .ancova-guide-header{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .ancova-guide-icon{font-size:18px;line-height:1;}
    .ancova-guide-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px;}
    .ancova-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 14px;box-shadow:0 2px 8px rgba(15,23,42,.035);min-height:144px;}
    .ancova-guide-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:11px;}
    .ancova-guide-title{font-size:16px;font-weight:750;line-height:1.35;color:#0f172a;margin:0 0 8px;}
    .ancova-guide-desc{font-size:13.5px;line-height:1.7;color:#64748b;margin:0;}
    @media (max-width:980px){.ancova-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media (max-width:640px){.ancova-guide-grid{grid-template-columns:1fr;}.ancova-guide-item{min-height:auto;}}
  `;
  document.head.appendChild(style);
}

function renderAncovaGuide(el) {
  ensureAncovaGuideStyles();
  const type = el.dataset.type;
  const config = GUIDE_CARDS[type] || GUIDE_CARDS['ancova-workflow-guide'];
  const title = el.dataset.title || config.title;
  el.innerHTML = `
    <section class="ancova-guide-card" aria-label="${title}">
      <div class="ancova-guide-header"><span class="ancova-guide-icon">${config.icon}</span><span>${title}</span></div>
      <div class="ancova-guide-grid">
        ${config.cards.map(([heading, desc, badge]) => `
          <article class="ancova-guide-item">
            <span class="ancova-guide-badge">${badge}</span>
            <h4 class="ancova-guide-title">${heading}</h4>
            <p class="ancova-guide-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

registerViz('ancova-workflow-guide', renderAncovaGuide);
registerViz('ancova-formula-guide', renderAncovaGuide);
registerViz('ancova-assumption-guide', renderAncovaGuide);
registerViz('ancova-adjusted-mean-guide', renderAncovaGuide);
registerViz('ancova-result-guide', renderAncovaGuide);
registerViz('ancova-block-guide', renderAncovaGuide);
registerViz('ancova-multcompare-guide', renderAncovaGuide);
