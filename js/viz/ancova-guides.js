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
    .ancova-demo-wrap{display:grid;grid-template-columns:minmax(300px,1.25fr) minmax(220px,.75fr);gap:14px;padding:14px;align-items:stretch;}
    .ancova-demo-panel,.ancova-demo-note{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 2px 8px rgba(15,23,42,.035);padding:14px;}
    .ancova-demo-svg{width:100%;height:auto;display:block;}
    .ancova-demo-control{display:flex;gap:10px;align-items:center;margin:12px 0 4px;color:#475569;font-size:13px;}
    .ancova-demo-control input[type="range"]{flex:1;accent-color:#4f46e5;}
    .ancova-demo-value{font-weight:800;color:#3730a3;min-width:46px;text-align:right;}
    .ancova-demo-table{width:100%;border-collapse:collapse;margin-top:10px;border-top:2px solid #334155;border-bottom:2px solid #334155;}
    .ancova-demo-table th,.ancova-demo-table td{font-size:12.5px;text-align:left;padding:7px 8px;border-bottom:1px solid #e2e8f0;color:#475569;}
    .ancova-demo-table th{color:#334155;background:#f8fafc;font-weight:750;}
    @media (max-width:980px){.ancova-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.ancova-demo-wrap{grid-template-columns:1fr;}}
    @media (max-width:640px){.ancova-guide-grid{grid-template-columns:1fr;}.ancova-guide-item{min-height:auto;}}
  `;
  document.head.appendChild(style);
}

function xToSvg(x) {
  return 42 + ((x - 8) / 4) * 330;
}

function yToSvg(y) {
  return 230 - ((y - 6.5) / 4) * 190;
}

function linePath(intercept, slope, dx = 0) {
  const x1 = 8.2, x2 = 11.8;
  const y1 = intercept + slope * (x1 - 10) + dx;
  const y2 = intercept + slope * (x2 - 10) + dx;
  return `M${xToSvg(x1)} ${yToSvg(y1)} L${xToSvg(x2)} ${yToSvg(y2)}`;
}

function renderAdjustedMeansDemo(el) {
  const title = el.dataset.title || '交互演示：协变量取值改变时，调整后均值怎么变';
  const id = 'ancova-adj-' + Math.random().toString(36).slice(2, 8);
  const groups = [
    { name: '1组', intercept: 8.80, color: '#4f46e5' },
    { name: '2组', intercept: 8.45, color: '#0891b2' },
    { name: '3组', intercept: 7.55, color: '#dc2626' },
  ];
  const slope = 0.82;
  el.innerHTML = `
    <section class="ancova-guide-card" aria-label="${title}">
      <div class="ancova-guide-header"><span class="ancova-guide-icon">📈</span><span>${title}</span></div>
      <div class="ancova-demo-wrap">
        <div class="ancova-demo-panel">
          <svg class="ancova-demo-svg" viewBox="0 0 420 280" role="img" aria-label="调整后均值随协变量取值变化">
            <line x1="42" y1="230" x2="382" y2="230" stroke="#cbd5e1"></line>
            <line x1="42" y1="35" x2="42" y2="230" stroke="#cbd5e1"></line>
            <text x="210" y="264" text-anchor="middle" font-size="12" fill="#64748b">协变量 x（基线）</text>
            <text x="16" y="136" text-anchor="middle" font-size="12" fill="#64748b" transform="rotate(-90 16 136)">结局 y</text>
            ${groups.map(g => `<path d="${linePath(g.intercept, slope)}" stroke="${g.color}" stroke-width="3" fill="none" stroke-linecap="round"></path>`).join('')}
            <line id="${id}-vline" x1="0" y1="35" x2="0" y2="230" stroke="#334155" stroke-dasharray="4 4"></line>
            ${groups.map((g, i) => `<circle id="${id}-pt-${i}" r="6" fill="${g.color}" stroke="#fff" stroke-width="2"></circle>`).join('')}
            ${groups.map((g, i) => `<text x="390" y="${70 + i * 22}" font-size="12" fill="${g.color}" font-weight="700">${g.name}</text>`).join('')}
          </svg>
          <label class="ancova-demo-control">协变量固定到 x = <input id="${id}-slider" type="range" min="8" max="12" step="0.1" value="10"><span id="${id}-value" class="ancova-demo-value">10.0</span></label>
        </div>
        <div class="ancova-demo-note">
          <span class="ancova-guide-badge">调整到 x̄</span>
          <h4 class="ancova-guide-title">调整后均值是在同一协变量水平下比较</h4>
          <p class="ancova-guide-desc">拖动滑块相当于把三组都放到同一个协变量取值上，再读取各条平行回归线的预测值。实际报告中通常固定在协变量均值 x̄。</p>
          <table class="ancova-demo-table"><thead><tr><th>组别</th><th>预测 adjusted mean</th></tr></thead><tbody id="${id}-rows"></tbody></table>
        </div>
      </div>
    </section>`;
  const slider = document.getElementById(`${id}-slider`);
  const value = document.getElementById(`${id}-value`);
  const rows = document.getElementById(`${id}-rows`);
  const vline = document.getElementById(`${id}-vline`);
  function update() {
    const x = Number(slider.value);
    value.textContent = x.toFixed(1);
    const sx = xToSvg(x);
    vline.setAttribute('x1', sx);
    vline.setAttribute('x2', sx);
    rows.innerHTML = groups.map((g, i) => {
      const y = g.intercept + slope * (x - 10);
      const point = document.getElementById(`${id}-pt-${i}`);
      point.setAttribute('cx', sx);
      point.setAttribute('cy', yToSvg(y));
      return `<tr><td style="color:${g.color};font-weight:750;">${g.name}</td><td>${y.toFixed(2)}</td></tr>`;
    }).join('');
  }
  slider.addEventListener('input', update);
  update();
}

function renderParallelSlopesDemo(el) {
  const title = el.dataset.title || '交互演示：平行斜率假设为什么重要';
  const id = 'ancova-slope-' + Math.random().toString(36).slice(2, 8);
  const groups = [
    { name: '1组', intercept: 8.70, color: '#4f46e5' },
    { name: '2组', intercept: 8.20, color: '#0891b2' },
    { name: '3组', intercept: 7.55, color: '#dc2626' },
  ];
  el.innerHTML = `
    <section class="ancova-guide-card" aria-label="${title}">
      <div class="ancova-guide-header"><span class="ancova-guide-icon">🧭</span><span>${title}</span></div>
      <div class="ancova-demo-wrap">
        <div class="ancova-demo-panel">
          <svg class="ancova-demo-svg" viewBox="0 0 420 280" role="img" aria-label="平行斜率与交互项示意">
            <line x1="42" y1="230" x2="382" y2="230" stroke="#cbd5e1"></line>
            <line x1="42" y1="35" x2="42" y2="230" stroke="#cbd5e1"></line>
            <text x="210" y="264" text-anchor="middle" font-size="12" fill="#64748b">协变量 x</text>
            <text x="16" y="136" text-anchor="middle" font-size="12" fill="#64748b" transform="rotate(-90 16 136)">结局 y</text>
            ${groups.map((g, i) => `<path id="${id}-line-${i}" stroke="${g.color}" stroke-width="3" fill="none" stroke-linecap="round"></path>`).join('')}
            ${groups.map((g, i) => `<text x="390" y="${70 + i * 22}" font-size="12" fill="${g.color}" font-weight="700">${g.name}</text>`).join('')}
          </svg>
          <label class="ancova-demo-control">斜率差异强度 <input id="${id}-slider" type="range" min="0" max="1" step="0.05" value="0"><span id="${id}-value" class="ancova-demo-value">0.00</span></label>
        </div>
        <div class="ancova-demo-note">
          <span class="ancova-guide-badge">parallel slopes</span>
          <h4 class="ancova-guide-title">斜率不平行时，group 主效应会依赖 x 的位置</h4>
          <p id="${id}-desc" class="ancova-guide-desc"></p>
        </div>
      </div>
    </section>`;
  const slider = document.getElementById(`${id}-slider`);
  const value = document.getElementById(`${id}-value`);
  const desc = document.getElementById(`${id}-desc`);
  function update() {
    const delta = Number(slider.value);
    value.textContent = delta.toFixed(2);
    groups.forEach((g, i) => {
      const slope = 0.72 + (i - 1) * delta;
      document.getElementById(`${id}-line-${i}`).setAttribute('d', linePath(g.intercept, slope));
    });
    desc.innerHTML = delta < 0.15
      ? '三条线近似平行，符合 ANCOVA 的平行斜率假设；此时可以较稳定地解释 <code>group</code> 的调整后主效应。'
      : '斜率明显不平行，提示 <code>x:group</code> 交互可能存在；此时不同 x 水平下的组间差异不同，不宜只报告一个总体 group 主效应。';
  }
  slider.addEventListener('input', update);
  update();
}

function renderAncovaGuide(el) {
  ensureAncovaGuideStyles();
  const type = el.dataset.type;
  if (type === 'ancova-adjusted-means-demo') {
    renderAdjustedMeansDemo(el);
    return;
  }
  if (type === 'ancova-parallel-slopes-demo') {
    renderParallelSlopesDemo(el);
    return;
  }
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
registerViz('ancova-adjusted-means-demo', renderAncovaGuide);
registerViz('ancova-parallel-slopes-demo', renderAncovaGuide);
registerViz('ancova-result-guide', renderAncovaGuide);
registerViz('ancova-block-guide', renderAncovaGuide);
registerViz('ancova-multcompare-guide', renderAncovaGuide);
