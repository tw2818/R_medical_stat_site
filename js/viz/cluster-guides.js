import { registerViz } from './_core.js';

const STYLE_ID = 'cluster-guides-style';

const GUIDE_CARDS = {
  'cluster-workflow-guide': {
    badge: 'workflow',
    icon: 'CLU',
    title: '聚类分析的主线：先定义相似，再解释分组',
    lead: '聚类是无监督方法，结果不是“诊断标签”，而是基于距离和算法得到的相似性分组。读本章时先抓住数据预处理、距离定义、k 值选择、结果解释四步。',
    steps: [
      ['1. 预处理', '不同量纲的变量必须先标准化；本章 nutrient 和 wine 示例都先用 scale() 或 stand=TRUE 处理。'],
      ['2. 定义相似性', '层次聚类需要先算距离矩阵，再选择 linkage；K-means 用簇中心迭代；PAM 用真实观测 medoid 代表簇。'],
      ['3. 解释与验证', 'k 值不是唯一真理，需要结合 NbClust、肘部图、轮廓系数、领域可解释性和样本量一起判断。']
    ],
    note: '聚类结果适合做探索和分型假设生成；正式报告时要说明标准化、距离、算法、k 值来源和稳定性评价。'
  },
  'hclust-distance-linkage-guide': {
    badge: 'hclust anatomy',
    icon: 'tree',
    title: 'hclust() 三件套：scale → dist → linkage',
    lead: '层次聚类看起来只是一句 hclust()，但真正影响结果的是前面的标准化、距离度量和合并规则。',
    steps: [
      ['scale(nutrient)', 'energy、protein、fat、calcium、iron 量纲不同；不标准化时，数值范围大的变量会主导距离。'],
      ['dist(..., euclidean)', '欧氏距离把每个食物看成 5 维空间中的点，距离越小表示营养构成越相似。'],
      ['method = "average"', 'average linkage 用两簇之间所有点对距离的平均值决定合并顺序，通常比 single linkage 更稳。']
    ],
    note: '同一份数据换距离或 linkage，树状图可能改变；因此方法参数必须在结果中交代。'
  },
  'cluster-k-decision-guide': {
    badge: 'choose k',
    icon: 'k?',
    title: '聚类数 k：多数规则、肘部和可解释性要一起看',
    lead: 'NbClust 会汇总多种指标，但这些指标可能给出并列或分散的建议。不要把 k 当作软件自动给出的唯一答案。',
    steps: [
      ['层次聚类示例', '输出中 2、3、5、10 类各有 5 个指标支持；多数规则结论写成 2 类，但本章后续切 5 类用于演示更细分组。'],
      ['K-means 示例', 'wine 数据中 19 个指标支持 3 类，且与已知葡萄酒类型数量一致，更适合作为后续 K-means 的 k。'],
      ['报告原则', '说明“为什么选这个 k”：指标支持、图形拐点、样本数量、簇规模和医学/营养学解释都要交代。']
    ],
    note: '如果不同 k 都有合理解释，可以把多个方案作为敏感性分析，而不是只展示最漂亮的一张图。'
  },
  'kmeans-output-guide': {
    badge: 'read kmeans()',
    icon: 'KM',
    title: 'kmeans() 输出怎么读：size、centers、withinss 和解释比例',
    lead: 'K-means 的打印结果很长，核心只要先看 4 项：每簇样本数、簇中心、簇内平方和、组间平方和占总平方和比例。',
    steps: [
      ['Cluster sizes', '本章 wine 示例分成 3 类，大小为 51、62、65；没有出现极端空簇或很小的簇。'],
      ['Cluster means', '中心是标准化后的变量均值。第 2 类 Alcohol、Phenols、Flavanoids、Proline 偏高，第 1 类 Color 偏高且 Hue/Dilution 偏低。'],
      ['between_SS / total_SS', '44.8% 表示该 3 类方案解释了约 44.8% 的总变异；它是质量线索，不是显著性检验。']
    ],
    note: 'K-means 对初始中心和异常值敏感；设置 set.seed() 与 nstart=25 是为了提高结果可重复性和稳定性。'
  },
  'cluster-silhouette-guide': {
    badge: 'quality check',
    icon: 'sil',
    title: '轮廓系数：每个样本“更像本簇还是隔壁簇”',
    lead: '轮廓系数 s(i) 同时考虑簇内紧密度和最近其他簇的分离度，是解释聚类质量时常用的补充指标。',
    steps: [
      ['接近 1', '样本离本簇很近、离其他簇远，分组较清楚。'],
      ['接近 0', '样本位于两个簇边界附近，归属不稳定。'],
      ['小于 0', '样本可能更接近别的簇，提示错分、异常点或 k 值不合适。']
    ],
    note: '平均轮廓宽度可以用于比较不同 k；但仍需结合专业解释，不能只追求数值最大。'
  }
};

const METHOD_SCENARIOS = {
  hclust: {
    label: '样本量不大，想看从细到粗的合并过程',
    model: '层次聚类 hclust()',
    rule: '不必预先指定 k，可先看树状图，再用 cutree() 切成若干类；适合教学和小样本探索。',
    example: 'hclust(dist(scale(x)), method = "average")'
  },
  kmeans: {
    label: '样本量较大，变量为连续型，已大致确定 k',
    model: 'K-means',
    rule: '用质心迭代最小化簇内平方和；速度快，但对初始值和异常值敏感。',
    example: 'kmeans(x, centers = 3, nstart = 25)'
  },
  pam: {
    label: '担心异常值，或希望用真实样本作为簇代表',
    model: 'PAM / medoid clustering',
    rule: '用 medoid 而不是均值代表簇，稳健性更好；可配合多种距离，适合中等规模数据。',
    example: 'cluster::pam(x, k = 3, stand = TRUE)'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .cluster-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .cluster-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .cluster-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#0f766e,#4f46e5);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 8px 18px rgba(15,118,110,.22);padding:0 8px;}
    .cluster-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .cluster-guide-badge{display:inline-block;background:#ccfbf1;color:#0f766e;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .cluster-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .cluster-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;}
    .cluster-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .cluster-guide-item strong{display:block;color:#0f766e;margin-bottom:6px;}
    .cluster-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #14b8a6;border-radius:10px;padding:10px 12px;}
    .cluster-demo-panel{display:grid;grid-template-columns:minmax(220px,.85fr) minmax(280px,1.15fr);gap:14px;align-items:stretch;}
    .cluster-demo-control,.cluster-demo-output{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;}
    .cluster-demo-control label{display:block;font-weight:700;color:#0f766e;margin-bottom:8px;}
    .cluster-demo-control select{width:100%;accent-color:#0f766e;border:1px solid #cbd5e1;border-radius:10px;padding:8px;background:#fff;}
    .cluster-demo-metric{font-size:24px;font-weight:800;color:#0f172a;margin:4px 0;}
    .cluster-demo-small{font-size:13px;color:#64748b;line-height:1.65;}
    .cluster-code-pill{display:block;background:#0f172a;color:#e2e8f0;border-radius:12px;padding:10px;margin:8px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;white-space:normal;}
    .cluster-kv{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0;}
    .cluster-kv div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px;text-align:center;}
    .cluster-kv strong{display:block;color:#0f766e;font-size:18px;}
    .cluster-medoid-row{display:flex;align-items:center;gap:10px;margin:10px 0;}
    .cluster-dot{width:14px;height:14px;border-radius:999px;background:#94a3b8;display:inline-block;}
    .cluster-dot.medoid{width:20px;height:20px;background:#f97316;box-shadow:0 0 0 5px rgba(249,115,22,.16);}
    .cluster-dot.centroid{width:20px;height:20px;border-radius:4px;background:#4f46e5;box-shadow:0 0 0 5px rgba(79,70,229,.14);}
    @media(max-width:720px){.cluster-demo-panel{grid-template-columns:1fr}.cluster-guide-card{padding:14px}.cluster-guide-head{align-items:flex-start}.cluster-kv{grid-template-columns:1fr}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['cluster-workflow-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="cluster-guide-card">
      <div class="cluster-guide-head">
        <div class="cluster-guide-icon">${cfg.icon}</div>
        <div><span class="cluster-guide-badge">${cfg.badge}</span><h3 class="cluster-guide-title">${title}</h3></div>
      </div>
      <p class="cluster-guide-lead">${cfg.lead}</p>
      <div class="cluster-guide-grid">
        ${cfg.steps.map(([title, text]) => `<div class="cluster-guide-item"><strong>${title}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="cluster-guide-note">${cfg.note}</div>
    </div>`;
}

function renderMethodChoice(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || '层次聚类、K-means、PAM 怎么选');
  el.innerHTML = `
    <div class="cluster-guide-card">
      <div class="cluster-guide-head">
        <div class="cluster-guide-icon">pick</div>
        <div><span class="cluster-guide-badge">interactive method chooser</span><h3 class="cluster-guide-title">${title}</h3></div>
      </div>
      <div class="cluster-demo-panel">
        <div class="cluster-demo-control">
          <label for="cluster-method-choice">选择分析场景</label>
          <select id="cluster-method-choice" data-role="scenario">
            <option value="hclust">想看树状合并过程</option>
            <option value="kmeans">大样本连续变量快速分组</option>
            <option value="pam">担心异常值或想要真实代表点</option>
          </select>
          <p class="cluster-demo-small">方法选择先看研究目的、样本量、变量类型和异常值，再看图形是否好看。</p>
        </div>
        <div class="cluster-demo-output">
          <div class="cluster-demo-small" data-role="label"></div>
          <div class="cluster-demo-metric" data-role="model"></div>
          <code class="cluster-code-pill" data-role="example"></code>
          <p class="cluster-demo-small" data-role="rule"></p>
        </div>
      </div>
    </div>`;
  const select = el.querySelector('[data-role="scenario"]');
  const label = el.querySelector('[data-role="label"]');
  const model = el.querySelector('[data-role="model"]');
  const example = el.querySelector('[data-role="example"]');
  const rule = el.querySelector('[data-role="rule"]');
  const update = () => {
    const cfg = METHOD_SCENARIOS[select.value];
    label.textContent = cfg.label;
    model.textContent = cfg.model;
    example.textContent = cfg.example;
    rule.textContent = cfg.rule;
  };
  select.addEventListener('change', update);
  update();
}

function renderPamMedoid(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || 'PAM 的 medoid：簇里真实存在的代表点');
  el.innerHTML = `
    <div class="cluster-guide-card">
      <div class="cluster-guide-head">
        <div class="cluster-guide-icon">PAM</div>
        <div><span class="cluster-guide-badge">medoid vs centroid</span><h3 class="cluster-guide-title">${title}</h3></div>
      </div>
      <p class="cluster-guide-lead">K-means 的 centroid 是各变量均值构成的“虚拟中心”，不一定对应真实样本；PAM 的 medoid 是簇中真实存在、到同簇其他观测总体距离最小的代表点。</p>
      <div class="cluster-demo-panel">
        <div class="cluster-demo-control">
          <div class="cluster-medoid-row"><span class="cluster-dot centroid"></span><span>centroid：均值中心，可能不是任何真实观测</span></div>
          <div class="cluster-medoid-row"><span class="cluster-dot medoid"></span><span>medoid：真实观测，可作为该簇代表样本</span></div>
          <div class="cluster-medoid-row"><span class="cluster-dot"></span><span>普通样本点：围绕代表点形成簇</span></div>
        </div>
        <div class="cluster-demo-output">
          <div class="cluster-kv">
            <div><strong>35</strong><span>第1类 medoid</span></div>
            <div><strong>106</strong><span>第2类 medoid</span></div>
            <div><strong>148</strong><span>第3类 medoid</span></div>
          </div>
          <p class="cluster-demo-small">这些编号来自本章 PAM 输出的 Medoids 表。因为 medoid 是真实酒样，更容易回到原始数据解释该类的典型特征。</p>
        </div>
      </div>
    </div>`;
}

registerViz('cluster-workflow-guide', renderGuide);
registerViz('hclust-distance-linkage-guide', renderGuide);
registerViz('cluster-k-decision-guide', renderGuide);
registerViz('cluster-method-choice-guide', renderMethodChoice);
registerViz('kmeans-output-guide', renderGuide);
registerViz('cluster-silhouette-guide', renderGuide);
registerViz('pam-medoid-guide', renderPamMedoid);
