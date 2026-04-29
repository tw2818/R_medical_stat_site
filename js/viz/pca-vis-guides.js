import { registerViz } from './_core.js';

const STYLE_ID = 'pca-vis-guides-style';

const GUIDE_CARDS = {
  'fviz-workflow-guide': {
    badge: 'workflow',
    icon: '→',
    title: 'factoextra 可视化主线：从结果提取到图形定制',
    lead: 'factoextra 的 fviz_* 系列函数封装了 ggplot2，可以让用户一行代码画出 publication-ready 的 PCA 图。',
    steps: [
      ['PCA() / prcomp()', '先做主成分分析，提取 $eig、$var、$ind 三个核心结果对象。'],
      ['get_eig / get_pca_var / get_pca_ind', '用专用函数提取特征值、变量结果、样本结果。'],
      ['fviz_*()', '用 fviz_eig()、fviz_pca_var()、fviz_pca_ind()、fviz_pca_biplot() 等函数绑定结果并绑图。']
    ],
    note: '所有 fviz_* 函数底层都是 ggplot2，可以用 + 添加自定义主题、配色、图例。'
  },
  'fviz-scree-guide': {
    badge: 'scree plot',
    icon: '📊',
    title: '碎石图：怎么看"拐点"和"阈值"',
    lead: '碎石图（Scree Plot）把每个主成分解释的方差比例可视化，帮助判断保留几个主成分。',
    steps: [
      ['看柱子高度', 'PC1 最大（72.96%），PC2 次之（22.85%），后面快速衰减。'],
      ['找拐点', '曲线由陡变平的拐点位置：PC2 之后明显变缓，PC3 之后趋于平坦。'],
      ['Kaiser 准则', '特征值 λ > 1 的主成分才保留；本例 PC1(λ=2.92) 和 PC2(λ=0.91) 接近阈值。']
    ],
    note: '累计方差贡献率达到 80%~90% 也常作为阈值；但拐点不总是明显，需要结合 Kaiser 准则和实际可解释性综合判断。'
  },
  'fviz-varcoord-guide': {
    badge: 'variables',
    icon: '→↓',
    title: '变量相关图：怎么看箭头和坐标轴',
    lead: 'fviz_pca_var() 画的图里，箭头代表原始变量在主成分空间的投影。',
    steps: [
      ['看与轴的角度', '箭头与 PC1 夹角越小，该变量在 PC1 上的载荷（相关）越强。'],
      ['看箭头长度', '箭头长度代表 cos2 值；长箭头 = 该变量在当前二维图中质量高。'],
      ['看变量间夹角', '同方向箭头代表变量在 PC1-PC2 空间正相关；垂直箭头代表无关；相反方向代表负相关。']
    ],
    note: '解读时注意：这是变量在主成分空间的投影关系，不是原始变量之间的散点图。'
  },
  'fviz-cos2-guide': {
    badge: 'cos2',
    icon: 'cos²',
    title: 'Cos2：变量在主成分空间的质量',
    lead: 'cos2（squared cosine）是变量在主成分空间中投影质量的衡量指标，取值 0~1。',
    steps: [
      ['越接近 1 越好', 'cos2 = 1 表示该变量完全落在当前二维平面内；cos2 接近 0 表示投影质量差。'],
      ['看颜色强度', 'fviz_pca_var(cos2=TRUE) 用颜色深浅表示 cos2 大小；深色 = 高 cos2 = 解释力强。'],
      ['结合方差贡献', 'Petal.Length 在 PC1 上 cos2 = 0.983，说明它对 PC1 的代表性极强。']
    ],
    note: '所有变量在同一主成分上的 cos2 之和等于该主成分的方差贡献率。'
  },
  'fviz-contrib-guide': {
    badge: 'contrib',
    icon: '%',
    title: '贡献率：谁在"驱动"这个主成分',
    lead: '每个变量对某个主成分的贡献率，以该变量对该主成分的方差占总方差的比例表示。',
    steps: [
      ['看柱子高度', 'Sepal.Width 对 PC2 贡献率 85.25%，是 PC2 的绝对主导变量。'],
      ['参考阈值', '对于 4 个变量的分析，3%（= 100%/4）以下是"平均贡献"；超过越多越重要。'],
      ['结合 cos2 看', '高贡献变量不一定有高 cos2；Petal.Length 在 PC1 贡献 33.69% 但 cos2 高是因为它和 PC1 相关强。']
    ],
    note: 'contrib 关注"谁在驱动主成分"，cos2 关注"变量在当前二维图中的投影质量"，二者含义不同。'
  },
  'fviz-group-coloring-guide': {
    badge: 'coloring',
    icon: '🎨',
    title: '样本点着色：什么时候用什么颜色映射',
    lead: 'fviz_pca_ind() 支持多种颜色映射方式，不同场景选不同策略。',
    steps: [
      ['col.ind = Species', '按真实的分组着色，用于探索组间差异；本例 setosa 与另两类明显分开。'],
      ['col.ind = "cos2"', '按样本在主成分空间的投影质量着色；高 cos2 样本更可信。'],
      ['col.ind = "contrib"', '按样本对主成分的贡献着色；高贡献样本对结果影响更大。']
    ],
    note: '颜色映射要服务于可视化目的：探索分组用真实分组，探索质量用 cos2，探索影响用 contrib。'
  },
  'fviz-biplot-guide': {
    badge: 'biplot',
    icon: '⬌',
    title: 'Biplot：变量和样本同时看',
    lead: 'biplot 同时展示样本（点）和变量（箭头），可以快速判断整体结构。',
    steps: [
      ['坐标含义', '点坐标 = 样本在 PC1-PC2 空间的得分；箭头坐标 = 变量的相关系数。'],
      ['箭头方向', '同方向变量正相关；垂直变量无关；相反方向变量负相关。'],
      ['样本与箭头距离', '样本点沿某变量箭头方向投影的位置 = 该变量在样本上的得分近似。']
    ],
    note: 'biplot 有两种 scaling 模式（1 和 2），变量箭头长度含义不同；factoextra 默认 scaling=1。'
  },
  'ggplot2-pca-guide': {
    badge: 'ggplot2',
    icon: '📈',
    title: 'ggplot2 手动绑图：获得完全控制权',
    lead: '当 fviz_* 函数无法满足需求时，可以手动提取 PC 得分用 ggplot2 绑图。',
    steps: [
      ['提取得分', 'pca.res$x 是样本在各个主成分上的得分，直接作为 ggplot 的数据。'],
      ['绑定坐标', 'geom_point(aes(PC1, PC2, color = group)) 即可绑出散点图。'],
      ['加置信椭圆', 'stat_ellipse() 可以添加 95% 置信椭圆，帮助展示组间分离情况。']
    ],
    note: '手动绑图的好处：可以添加任意的 ggplot2 主题、配色、图例；缺点是需要更多代码。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .pca-vis-guide-card{background:#f6f7fb;border:1px solid #dbe3ef;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .pca-vis-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .pca-vis-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 8px 18px rgba(79,70,229,.22);padding:0 8px;}
    .pca-vis-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .pca-vis-guide-badge{display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .pca-vis-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .pca-vis-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;}
    .pca-vis-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .pca-vis-guide-item strong{display:block;color:#5b21b6;margin-bottom:6px;}
    .pca-vis-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #7c3aed;border-radius:10px;padding:10px 12px;}
    .pca-vis-scree-cutoff-panel{display:flex;flex-direction:column;gap:12px;margin-top:14px;}
    .pca-vis-scree-cutoff-control{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;}
    .pca-vis-scree-cutoff-control label{display:flex;align-items:center;gap:10px;font-size:14px;color:#475569;}
    .pca-vis-scree-cutoff-control input[type=range]{flex:1;accent-color:#7c3aed}
    .pca-vis-scree-cutoff-value{font-weight:700;color:#5b21b6;font-size:16px;min-width:50px;text-align:right;}
    .pca-vis-scree-cutoff-output{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;}
    .pca-vis-scree-cutoff-pcs{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}
    .pca-vis-scree-pc-tag{display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:4px 12px;font-size:13px;font-weight:600;}
    .pca-vis-scree-pc-tag.excluded{background:#f1f5f9;color:#94a3b8}
    .pca-vis-coloring-scenario-panel{display:flex;flex-direction:column;gap:12px;margin-top:14px;}
    .pca-vis-coloring-scenario-control{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;}
    .pca-vis-coloring-scenario-control select{width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;color:#334155;background:#fff;margin-top:8px;}
    .pca-vis-coloring-scenario-output{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;}
    .pca-vis-coloring-scenario-output pre{background:#1e293b;color:#e2e8f0;padding:12px;border-radius:8px;font-size:13px;overflow-x:auto;margin:8px 0}
    .pca-vis-coloring-scenario-explain{font-size:14px;color:#475569;line-height:1.65;margin-top:8px}
    @media(max-width:720px){.pca-vis-guide-card{padding:14px}.pca-vis-guide-head{align-items:flex-start}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['fviz-workflow-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="pca-vis-guide-card">
      <div class="pca-vis-guide-head">
        <div class="pca-vis-guide-icon">${cfg.icon}</div>
        <div><span class="pca-vis-guide-badge">${cfg.badge}</span><h3 class="pca-vis-guide-title">${title}</h3></div>
      </div>
      <p class="pca-vis-guide-lead">${cfg.lead}</p>
      <div class="pca-vis-guide-grid">
        ${cfg.steps.map(([stepTitle, text]) => `<div class="pca-vis-guide-item"><strong>${stepTitle}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="pca-vis-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('fviz-workflow-guide', renderGuide);
registerViz('fviz-scree-guide', renderGuide);
registerViz('fviz-varcoord-guide', renderGuide);
registerViz('fviz-cos2-guide', renderGuide);
registerViz('fviz-contrib-guide', renderGuide);
registerViz('fviz-group-coloring-guide', renderGuide);
registerViz('fviz-biplot-guide', renderGuide);
registerViz('ggplot2-pca-guide', renderGuide);

const SCREE_CUTOFF_DATA = {
  pcs: [
    { name: 'PC1', variance: 72.96 },
    { name: 'PC2', variance: 22.85 },
    { name: 'PC3', variance: 3.12 },
    { name: 'PC4', variance: 1.07 }
  ]
};

function renderScreeCutoffGuide(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || '累计方差阈值：滑动选择保留几个主成分');
  el.innerHTML = `
    <div class="pca-vis-guide-card">
      <div class="pca-vis-guide-head">
        <div class="pca-vis-guide-icon">%</div>
        <div><span class="pca-vis-guide-badge">interactive scree cutoff</span><h3 class="pca-vis-guide-title">${title}</h3></div>
      </div>
      <p class="pca-vis-guide-lead">拖动滑块设定累计方差贡献率阈值，系统实时显示在该阈值下应保留哪些主成分。</p>
      <div class="pca-vis-scree-cutoff-panel">
        <div class="pca-vis-scree-cutoff-control">
          <label>
            累计方差阈值：
            <input type="range" min="50" max="100" value="80" data-role="threshold">
            <span class="pca-vis-scree-cutoff-value" data-role="threshold-display">80%</span>
          </label>
        </div>
        <div class="pca-vis-scree-cutoff-output">
          <div>保留的主成分：</div>
          <div class="pca-vis-scree-cutoff-pcs" data-role="pc-container"></div>
        </div>
      </div>
    </div>`;
  const input = el.querySelector('[data-role="threshold"]');
  const thresholdDisplay = el.querySelector('[data-role="threshold-display"]');
  const pcContainer = el.querySelector('[data-role="pc-container"]');
  const update = () => {
    const threshold = Number(input.value);
    thresholdDisplay.textContent = threshold + '%';
    let cumulative = 0;
    const retained = [];
    const excluded = [];
    for (const pc of SCREE_CUTOFF_DATA.pcs) {
      cumulative += pc.variance;
      if (cumulative <= threshold) {
        retained.push(pc);
      } else {
        excluded.push(pc);
      }
    }
    pcContainer.innerHTML = retained.map(pc =>
      `<span class="pca-vis-scree-pc-tag">${pc.name} (${pc.variance}%)</span>`
    ).join('') + excluded.map(pc =>
      `<span class="pca-vis-scree-pc-tag excluded">${pc.name} (${pc.variance}%)</span>`
    ).join('');
  };
  input.addEventListener('input', update);
  update();
}

const COLORING_SCENARIOS = {
  species: {
    label: '按分组着色 (Species)',
    code: 'fviz_pca_ind(pca.result,\n            col.ind = iris$Species,\n            palette = "jco",\n            addEllipses = TRUE)',
    explain: '按原始分组着色，适合探索已知分组之间的差异。本例中 setosa 与另两类明显分开，virginica 和 versicolor 有部分重叠。'
  },
  cos2: {
    label: '按投影质量着色 (cos2)',
    code: 'fviz_pca_ind(pca.result,\n            col.ind = "cos2",\n            gradient.cols = c("white", "#2E86AB"),\n            repel = TRUE)',
    explain: '按样本在主成分空间的投影质量（cos2）着色。高 cos2 的样本更可信，低 cos2 样本可能是异常值或投影质量差。'
  },
  contrib: {
    label: '按贡献率着色 (contrib)',
    code: 'fviz_pca_ind(pca.result,\n            col.ind = "contrib",\n            gradient.cols = c("white", "#E63946"),\n            repel = TRUE)',
    explain: '按样本对主成分的贡献率着色。高贡献样本对结果影响更大，可能值得关注或进一步调查。'
  }
};

function renderColoringScenarioGuide(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || '着色策略选择：按分组、按 cos2、还是按 contrib');
  el.innerHTML = `
    <div class="pca-vis-guide-card">
      <div class="pca-vis-guide-head">
        <div class="pca-vis-guide-icon">🎨</div>
        <div><span class="pca-vis-guide-badge">interactive coloring scenario</span><h3 class="pca-vis-guide-title">${title}</h3></div>
      </div>
      <p class="pca-vis-guide-lead">选择不同的着色策略，服务于不同的分析目的。</p>
      <div class="pca-vis-coloring-scenario-panel">
        <div class="pca-vis-coloring-scenario-control">
          <label for="pca-coloring-scenario">选择着色策略</label>
          <select id="pca-coloring-scenario" data-role="scenario">
            <option value="species">按分组着色 (Species)</option>
            <option value="cos2">按投影质量 (cos2)</option>
            <option value="contrib">按贡献率 (contrib)</option>
          </select>
        </div>
        <div class="pca-vis-coloring-scenario-output">
          <div data-role="label"></div>
          <pre data-role="code"></pre>
          <p class="pca-vis-coloring-scenario-explain" data-role="explain"></p>
        </div>
      </div>
    </div>`;
  const select = el.querySelector('[data-role="scenario"]');
  const label = el.querySelector('[data-role="label"]');
  const code = el.querySelector('[data-role="code"]');
  const explain = el.querySelector('[data-role="explain"]');
  const update = () => {
    const cfg = COLORING_SCENARIOS[select.value];
    label.textContent = cfg.label;
    code.textContent = cfg.code;
    explain.textContent = cfg.explain;
  };
  select.addEventListener('change', update);
  update();
}

registerViz('fviz-scree-cutoff-guide', renderScreeCutoffGuide);
registerViz('fviz-coloring-scenario-guide', renderColoringScenarioGuide);