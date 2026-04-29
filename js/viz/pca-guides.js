import { registerViz } from './_core.js';

const STYLE_ID = 'pca-guides-style';

const GUIDE_CARDS = {
  'pca-workflow-guide': {
    badge: 'workflow',
    icon: 'PCA',
    title: '主成分分析的主线：把相关变量压缩成少数综合指标',
    lead: 'PCA 的目的不是预测结局，而是在保留主要变异信息的同时，把多个相关变量转换成少数互不相关的主成分。',
    steps: [
      ['1. 检查数据', '确认变量是数值型、缺失值已处理，并先看相关矩阵：完全独立的变量通常不适合用 PCA 压缩。'],
      ['2. 标准化与分解', 'center = TRUE 做中心化，scale. = TRUE 做标准化，再从相关/协方差结构中提取特征值和特征向量。'],
      ['3. 解释与使用', '用载荷理解主成分含义，用得分定位样本，用贡献率决定保留几个主成分。']
    ],
    note: '报告 PCA 时至少说明是否标准化、保留主成分的依据、每个主成分的主要载荷变量，以及累计解释方差。'
  },
  'pca-standardization-guide': {
    badge: 'scale matters',
    icon: 'z',
    title: '为什么 prcomp() 常写 scale. = TRUE',
    lead: 'PCA 会寻找“方差最大”的方向。如果变量量纲不同，数值范围大的变量会天然拥有更大方差，从而支配主成分。',
    steps: [
      ['center = TRUE', '先把每个变量的均值移到 0，使主成分描述的是围绕均值的变异方向。'],
      ['scale. = TRUE', '再把标准差统一为 1，相当于基于相关矩阵做 PCA，适合身高、体重、肺活量等量纲不同的指标。'],
      ['何时不用 scale', '如果所有变量同量纲且绝对方差本身就是研究对象，可以考虑基于协方差矩阵分析，但要在方法中说明。']
    ],
    note: '本章 iris 四个测量指标量纲接近但仍使用 scale. = TRUE，是教学中更稳妥、可迁移的默认做法。'
  },
  'pca-kmo-bartlett-guide': {
    badge: 'suitability checks',
    icon: 'KMO',
    title: 'KMO 与 Bartlett：回答“这些变量适合压缩吗”',
    lead: '相关矩阵、KMO 和 Bartlett 检验共同帮助判断变量之间是否存在可被少数维度概括的共同结构。',
    steps: [
      ['相关矩阵', '先看变量之间是否有成组相关；若大部分相关都接近 0，PCA 很难压缩出有意义的综合指标。'],
      ['KMO / MSA', '衡量共同因素结构是否足够清楚；本章 Overall MSA = 0.54，偏低但仍可作为演示。'],
      ['Bartlett', '原假设是相关矩阵等于单位阵；P 很小时说明变量并非彼此独立，可以继续考虑 PCA/因子分析。']
    ],
    note: 'KMO 偏低不等于绝对不能做 PCA，而是提示解释要保守，并考虑变量选择、样本量和研究目的。'
  },
  'pca-loading-formula-guide': {
    badge: 'rotation → formula',
    icon: 'β',
    title: '$rotation 怎样变成主成分公式',
    lead: 'prcomp() 的 $rotation 每一列就是一个主成分的线性组合系数，也可称为载荷向量/特征向量。',
    steps: [
      ['看列', 'PC1 这一列给出四个原始变量在第一主成分中的权重。'],
      ['乘变量', '标准化后的变量分别乘以对应权重，再相加，得到该样本的 PC1 得分。'],
      ['看方向', '同号变量沿同一方向变化，异号变量代表对该主成分的贡献方向相反。']
    ],
    note: '载荷绝对值越大，变量越影响该主成分；但主成分整体正负号可翻转，解释时重点看相对方向和大小。'
  },
  'pca-loadings-scores-guide': {
    badge: 'loadings vs scores',
    icon: 'L/S',
    title: '载荷 loadings 与得分 scores 不要混淆',
    lead: '$rotation 说明主成分是什么，$x 说明每个样本落在哪里。二者一个解释变量方向，一个描述样本坐标。',
    steps: [
      ['$rotation', '行是原始变量，列是主成分；用于命名和解释 PC1、PC2 等综合指标。'],
      ['$x', '行是样本，列是主成分得分；用于排序、聚类、绘制样本在 PC 空间中的位置。'],
      ['biplot', '点来自 scores，箭头来自 loadings；读图时不要把箭头当作样本，也不要把点当作变量。']
    ],
    note: '如果要把 PCA 结果接到后续模型，通常使用前几个 PC 得分作为新变量，而不是直接使用载荷矩阵。'
  },
  'pca-variance-decision-guide': {
    badge: 'variance explained',
    icon: 'λ',
    title: '特征值、贡献率、累计贡献率怎么连起来',
    lead: '特征值表示某个主成分解释的方差量；把每个特征值除以总方差，就得到方差贡献率。',
    steps: [
      ['特征值 λ', 'λ 越大，该主成分保留的原始变异越多；Kaiser 准则常保留 λ > 1 的成分。'],
      ['贡献率', '单个主成分解释多少信息，本章 PC1 约解释 72.96%。'],
      ['累计贡献率', '前 k 个主成分合计保留多少信息，本章前两个 PC 累计约 95.81%。']
    ],
    note: '不要只看累计贡献率，还要检查主成分是否有可解释的变量载荷结构。'
  },
  'pca-pitfalls-guide': {
    badge: 'caveats',
    icon: '!',
    title: 'PCA 结果解释的三个常见坑',
    lead: 'PCA 很适合降维和探索结构，但它不是监督学习模型，也不会自动保证和结局变量最相关。',
    steps: [
      ['无监督', 'PCA 是无监督方法，不使用分组或结局信息；能分开样本不等于已经建立了预测模型。'],
      ['符号可翻转', '主成分方向的正负号可以整体翻转，PC1 与 -PC1 解释的是同一条轴。'],
      ['线性组合', '主成分不是某一个原始变量，而是多个变量的线性组合；命名需要回到载荷矩阵。']
    ],
    note: '正式论文中应避免把 PCA 直接解释成“因果因素”或“诊断指标”，除非有额外设计和验证支持。'
  }
};

const COMPONENT_SCENARIOS = {
  kaiser: {
    label: '想要简单、可复现的初筛规则',
    choice: 'Kaiser 准则：保留特征值 λ > 1 的主成分',
    detail: '适合标准化后的变量，但变量数少或相关结构特殊时可能偏保守或偏激进。',
    example: 'pca.res$sdev^2 > 1'
  },
  cumulative: {
    label: '希望保留足够多的信息量',
    choice: '累计贡献率：常用 70%、80% 或 90% 作为阈值',
    detail: '医学综合评价常需要说明信息保留比例；本章前两个主成分累计约 95.81%。',
    example: 'summary(pca.res)$importance[3, ]'
  },
  scree: {
    label: '想看边际收益何时明显变小',
    choice: '碎石图：寻找曲线由陡变平的拐点',
    detail: '适合作为直观辅助，但拐点可能不明显，建议与其他规则共同判断。',
    example: 'screeplot(pca.res, type = "lines")'
  },
  interpretability: {
    label: '论文中需要解释主成分的医学含义',
    choice: '解释性优先：保留能被变量载荷合理命名的成分',
    detail: '如果多保留一个主成分只增加少量方差且难解释，可以在敏感性分析中报告。',
    example: 'pca.res$rotation[, 1:2]'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .pca-guide-card{background:#f6f7fb;border:1px solid #dbe3ef;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .pca-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .pca-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 8px 18px rgba(79,70,229,.22);padding:0 8px;}
    .pca-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .pca-guide-badge{display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .pca-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .pca-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;}
    .pca-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .pca-guide-item strong{display:block;color:#5b21b6;margin-bottom:6px;}
    .pca-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #7c3aed;border-radius:10px;padding:10px 12px;}
    .pca-choice-panel{display:grid;grid-template-columns:minmax(220px,.85fr) minmax(280px,1.15fr);gap:14px;align-items:stretch;}
    .pca-choice-control,.pca-choice-output{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;}
    .pca-choice-control label{display:block;font-weight:700;color:#5b21b6;margin-bottom:8px;}
    .pca-choice-control select{width:100%;accent-color:#7c3aed;border:1px solid #cbd5e1;border-radius:10px;padding:8px;background:#fff;}
    .pca-choice-label{font-size:13px;color:#64748b;line-height:1.65;}
    .pca-choice-metric{font-size:21px;font-weight:800;color:#0f172a;margin:6px 0;line-height:1.35;}
    .pca-code-pill{display:block;background:#0f172a;color:#e2e8f0;border-radius:12px;padding:10px;margin:8px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;white-space:normal;}
    @media(max-width:720px){.pca-choice-panel{grid-template-columns:1fr}.pca-guide-card{padding:14px}.pca-guide-head{align-items:flex-start}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['pca-workflow-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="pca-guide-card">
      <div class="pca-guide-head">
        <div class="pca-guide-icon">${cfg.icon}</div>
        <div><span class="pca-guide-badge">${cfg.badge}</span><h3 class="pca-guide-title">${title}</h3></div>
      </div>
      <p class="pca-guide-lead">${cfg.lead}</p>
      <div class="pca-guide-grid">
        ${cfg.steps.map(([stepTitle, text]) => `<div class="pca-guide-item"><strong>${stepTitle}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="pca-guide-note">${cfg.note}</div>
    </div>`;
}

function renderComponentChoice(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || '保留几个主成分：规则要组合使用');
  el.innerHTML = `
    <div class="pca-guide-card">
      <div class="pca-guide-head">
        <div class="pca-guide-icon">k?</div>
        <div><span class="pca-guide-badge">interactive component choice</span><h3 class="pca-guide-title">${title}</h3></div>
      </div>
      <div class="pca-choice-panel">
        <div class="pca-choice-control">
          <label for="pca-component-choice">选择判断视角</label>
          <select id="pca-component-choice" data-role="scenario">
            <option value="kaiser">Kaiser：λ &gt; 1</option>
            <option value="cumulative">累计贡献率阈值</option>
            <option value="scree">碎石图拐点</option>
            <option value="interpretability">研究解释性</option>
          </select>
          <p class="pca-choice-label">PCA 保留维度没有唯一标准；报告时最好说明多个规则是否一致。</p>
        </div>
        <div class="pca-choice-output">
          <div class="pca-choice-label" data-role="label"></div>
          <div class="pca-choice-metric" data-role="choice"></div>
          <code class="pca-code-pill" data-role="example"></code>
          <p class="pca-choice-label" data-role="detail"></p>
        </div>
      </div>
    </div>`;
  const select = el.querySelector('[data-role="scenario"]');
  const label = el.querySelector('[data-role="label"]');
  const choice = el.querySelector('[data-role="choice"]');
  const example = el.querySelector('[data-role="example"]');
  const detail = el.querySelector('[data-role="detail"]');
  const update = () => {
    const cfg = COMPONENT_SCENARIOS[select.value];
    label.textContent = cfg.label;
    choice.textContent = cfg.choice;
    example.textContent = cfg.example;
    detail.textContent = cfg.detail;
  };
  select.addEventListener('change', update);
  update();
}

registerViz('pca-workflow-guide', renderGuide);
registerViz('pca-standardization-guide', renderGuide);
registerViz('pca-kmo-bartlett-guide', renderGuide);
registerViz('pca-loading-formula-guide', renderGuide);
registerViz('pca-loadings-scores-guide', renderGuide);
registerViz('pca-variance-decision-guide', renderGuide);
registerViz('pca-component-choice-guide', renderComponentChoice);
registerViz('pca-pitfalls-guide', renderGuide);
