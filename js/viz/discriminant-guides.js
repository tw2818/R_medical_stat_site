import { registerViz } from './_core.js';

const STYLE_ID = 'discriminant-guides-style';

const GUIDE_CARDS = {
  'discriminant-workflow-guide': {
    badge: 'workflow',
    icon: 'LDA',
    title: '判别分析不是只跑一个函数：先问“分得开吗”，再问“分错多少”',
    lead: '判别分析的主线是：已有分组 + 多个指标 → 估计判别规则 → 预测类别与后验概率 → 用混淆矩阵评价错分。',
    steps: [
      ['1. 建模对象', '因变量是已知类别，自变量是多个连续指标；本章例 20-1 用 3 个指标判别早期/晚期肝硬化。'],
      ['2. 判别规则', 'LDA 寻找能拉开组间差异、压缩组内差异的线性组合；QDA 允许各组协方差不同。'],
      ['3. 结果评价', '不要只看散点图是否分开，还要看 posterior、predict class 和混淆矩阵中的错分方向。']
    ],
    note: '和 Logistic 回归相比，判别分析更依赖分布与协方差假设；当关系复杂或假设不稳时，Logistic/树模型等方法可能更稳。'
  },
  'lda-output-guide': {
    badge: 'read lda()',
    icon: 'fit',
    title: 'lda() 输出四件事：先验、均值、判别轴和解释比例',
    lead: 'MASS::lda() 的打印结果不是“显著性检验表”，而是告诉你类别基线比例、各组中心、判别方向，以及多分类时每条判别轴贡献多少。',
    steps: [
      ['Prior probabilities', '例 20-1 中 1 类为 12/22=0.545，2 类为 10/22=0.455；先验概率会影响最终分类阈值。'],
      ['Group means', '类别 1 的均值为 x1=-3、x2=4、x3=-1；类别 2 为 x1=4、x2=-5、x3=1，这是判别轴要拉开的中心差异。'],
      ['Coefficients / trace', '二分类只有 LD1；k 个类别最多得到 k-1 个判别函数。iris 三分类给出 LD1 和 LD2，其中 LD1 解释 99.12% 的判别信息。']
    ],
    note: '读 LDA 输出时先看组均值是否有可解释方向，再看 predict() 的后验概率与混淆矩阵。'
  },
  'lda-newdata-posterior-guide': {
    badge: 'predict()',
    icon: 'post',
    title: 'predict(fit, newdata=...) 同时给类别、后验概率和判别得分',
    lead: '新样本预测时，class 是最终类别，posterior 是模型认为它属于各类的概率，x 是投影到判别轴后的坐标。',
    steps: [
      ['第 1 个新样本', '预测为 2 类，posterior=0.983；这是很明确的晚期方向。'],
      ['第 2 个新样本', '预测为 2 类，但 posterior=0.642；比第 1 个更接近边界，解释时要更谨慎。'],
      ['第 3 个新样本', '预测为 1 类，posterior=0.880；LD1=-0.938，落在早期患者方向。']
    ],
    note: '报告判别结果时，最好同时给出类别和后验概率；只给“分到哪类”会隐藏模型的不确定性。'
  },
  'bayes-warning-guide': {
    badge: 'warning literacy',
    icon: '0P',
    title: 'NaiveBayes 的 Numerical 0 probability warning 怎么看',
    lead: '这个 warning 表示某个观测在所有类别下的数值似然都接近 0，常见于样本量小、方差估计窄、变量值非常极端或朴素独立假设不稳。',
    steps: [
      ['不是代码中断', 'warning 后仍然生成混淆矩阵，说明函数没有报错停止；但这个样本的概率解释要谨慎。'],
      ['先查异常值', '本章例 20-4 中 x1 出现 -100、90.2 等极端值，小样本下容易让正态条件密度非常小。'],
      ['可考虑平滑/稳健方法', '正式分析可尝试核密度、变量变换、标准化、交叉验证，或改用 LDA/QDA/Logistic 等替代模型。']
    ],
    note: 'warning 不等于模型完全无效，但提醒我们：Bayes 判别的概率数值不应机械解释。'
  }
};

const MODEL_SCENARIOS = {
  lda: {
    label: '两类或多类，组内协方差近似相等',
    model: 'LDA / Fisher 判别',
    rule: '线性边界；样本量小到中等时比 QDA 更稳。',
    example: 'MASS::lda(y ~ x1 + x2 + x3, data = df)'
  },
  qda: {
    label: '各类别离散程度明显不同',
    model: 'QDA / 二次判别',
    rule: '允许每组有自己的协方差矩阵，边界可弯曲；参数更多，更怕小样本过拟合。',
    example: 'MASS::qda(y ~ x1 + x2 + x3, data = df)'
  },
  naive: {
    label: '变量条件独立近似可接受，想得到概率分类器',
    model: 'Naive Bayes',
    rule: '把每个变量的条件密度相乘并乘以先验概率；简单、快，但独立性假设较强。',
    example: 'klaR::NaiveBayes(y ~ ., data = df)'
  }
};

const NB_VARIABLES = {
  x1: {
    label: 'x1',
    rows: [
      ['脑囊肿（1）', '-14.43', '38.26'],
      ['胶质瘤（2）', '0.80', '78.11'],
      ['转移瘤（3）', '-6.65', '19.78']
    ],
    comment: 'x1 的组间均值差不算稳定，且标准差很大；单独依赖它分类风险较高。'
  },
  x2: {
    label: 'x2',
    rows: [
      ['脑囊肿（1）', '-17.34', '4.10'],
      ['胶质瘤（2）', '-17.43', '3.09'],
      ['转移瘤（3）', '-17.33', '4.14']
    ],
    comment: 'x2 三组均值几乎相同，提供的区分信息很弱。'
  },
  x3: {
    label: 'x3',
    rows: [
      ['脑囊肿（1）', '12.71', '4.99'],
      ['胶质瘤（2）', '17.50', '2.08'],
      ['转移瘤（3）', '20.17', '6.49']
    ],
    comment: 'x3 均值随类别升高而增大，是本例中相对更有方向感的变量。'
  },
  x4: {
    label: 'x4',
    rows: [
      ['脑囊肿（1）', '31.14', '44.04'],
      ['胶质瘤（2）', '0.00', '30.76'],
      ['转移瘤（3）', '-15.00', '35.83']
    ],
    comment: 'x4 方向上 1 类偏高、3 类偏低，但各组标准差也不小，需要和其他变量共同判断。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .disc-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .disc-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .disc-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#6d28d9,#2563eb);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 8px 18px rgba(109,40,217,.22);padding:0 8px;}
    .disc-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .disc-guide-badge{display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .disc-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .disc-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;}
    .disc-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .disc-guide-item strong{display:block;color:#4338ca;margin-bottom:6px;}
    .disc-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #8b5cf6;border-radius:10px;padding:10px 12px;}
    .disc-demo-panel{display:grid;grid-template-columns:minmax(220px,.85fr) minmax(280px,1.15fr);gap:14px;align-items:stretch;}
    .disc-demo-control,.disc-demo-output{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;}
    .disc-demo-control label{display:block;font-weight:700;color:#4338ca;margin-bottom:8px;}
    .disc-demo-control select{width:100%;accent-color:#6d28d9;border:1px solid #cbd5e1;border-radius:10px;padding:8px;background:#fff;}
    .disc-demo-metric{font-size:24px;font-weight:800;color:#0f172a;margin:4px 0;}
    .disc-demo-small{font-size:13px;color:#64748b;line-height:1.65;}
    .disc-code-pill{display:block;background:#0f172a;color:#e2e8f0;border-radius:12px;padding:10px;margin:8px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;white-space:normal;}
    .disc-matrix{display:grid;grid-template-columns:80px repeat(2,1fr);gap:6px;max-width:420px;margin:10px 0;}
    .disc-matrix div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:9px;text-align:center;font-size:13px;}
    .disc-matrix .disc-hit{background:#ecfdf5;border-color:#86efac;color:#166534;font-weight:800;}
    .disc-matrix .disc-miss{background:#fff7ed;border-color:#fed7aa;color:#9a3412;font-weight:800;}
    .disc-kv{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0;}
    .disc-kv div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px;text-align:center;}
    .disc-kv strong{display:block;color:#4338ca;font-size:18px;}
    .disc-table{width:100%;border-collapse:collapse;margin:10px 0;background:#fff;}
    .disc-table th,.disc-table td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:right;font-size:13px;}
    .disc-table th:first-child,.disc-table td:first-child{text-align:left;}
    .disc-table thead th{border-top:2px solid #334155;border-bottom:1px solid #94a3b8;color:#1e293b;}
    .disc-table tbody tr:last-child td{border-bottom:2px solid #334155;}
    @media(max-width:720px){.disc-demo-panel{grid-template-columns:1fr}.disc-guide-card{padding:14px}.disc-guide-head{align-items:flex-start}.disc-kv{grid-template-columns:1fr}.disc-matrix{grid-template-columns:70px repeat(2,1fr)}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['discriminant-workflow-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="disc-guide-card">
      <div class="disc-guide-head">
        <div class="disc-guide-icon">${cfg.icon}</div>
        <div><span class="disc-guide-badge">${cfg.badge}</span><h3 class="disc-guide-title">${title}</h3></div>
      </div>
      <p class="disc-guide-lead">${cfg.lead}</p>
      <div class="disc-guide-grid">
        ${cfg.steps.map(([title, text]) => `<div class="disc-guide-item"><strong>${title}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="disc-guide-note">${cfg.note}</div>
    </div>`;
}

function renderConfusionGuide(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || '例 20-1 LDA 混淆矩阵：不要只说“分错 3 个”');
  el.innerHTML = `
    <div class="disc-guide-card">
      <div class="disc-guide-head">
        <div class="disc-guide-icon">2×2</div>
        <div><span class="disc-guide-badge">confusion matrix</span><h3 class="disc-guide-title">${title}</h3></div>
      </div>
      <p class="disc-guide-lead">原始输出是 <code>table(df$y, pred)</code>：行是真实类别，列是预测类别。对角线是分对的样本，非对角线是错分。</p>
      <div class="disc-demo-panel">
        <div class="disc-demo-control">
          <div class="disc-matrix" aria-label="LDA confusion matrix">
            <div></div><div>预测 1</div><div>预测 2</div>
            <div>真实 1</div><div class="disc-hit">11</div><div class="disc-miss">1</div>
            <div>真实 2</div><div class="disc-miss">2</div><div class="disc-hit">8</div>
          </div>
          <p class="disc-demo-small">错分方向不同，临床含义也可能不同：晚期被判成早期通常比早期被判成晚期更需要警惕。</p>
        </div>
        <div class="disc-demo-output">
          <div class="disc-kv">
            <div><strong>86.4%</strong><span>总体准确率</span></div>
            <div><strong>3/22</strong><span>错分数</span></div>
            <div><strong>LD1</strong><span>单一判别轴</span></div>
          </div>
          <p class="disc-demo-small">本章示例样本很小，这个准确率更适合理解流程；正式模型评价应考虑交叉验证或外部验证。</p>
        </div>
      </div>
    </div>`;
}

function renderModelChoice(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || 'LDA、QDA、Naive Bayes 怎么选');
  el.innerHTML = `
    <div class="disc-guide-card">
      <div class="disc-guide-head">
        <div class="disc-guide-icon">pick</div>
        <div><span class="disc-guide-badge">interactive model chooser</span><h3 class="disc-guide-title">${title}</h3></div>
      </div>
      <div class="disc-demo-panel">
        <div class="disc-demo-control">
          <label for="disc-model-choice">选择数据场景</label>
          <select id="disc-model-choice" data-role="scenario">
            <option value="lda">协方差近似相等</option>
            <option value="qda">各组方差/协方差明显不同</option>
            <option value="naive">想用条件概率快速分类</option>
          </select>
          <p class="disc-demo-small">这里是教学判断框架，不替代模型诊断和验证。</p>
        </div>
        <div class="disc-demo-output">
          <div class="disc-demo-small" data-role="label"></div>
          <div class="disc-demo-metric" data-role="model"></div>
          <code class="disc-code-pill" data-role="example"></code>
          <p class="disc-demo-small" data-role="rule"></p>
        </div>
      </div>
    </div>`;
  const select = el.querySelector('[data-role="scenario"]');
  const label = el.querySelector('[data-role="label"]');
  const model = el.querySelector('[data-role="model"]');
  const example = el.querySelector('[data-role="example"]');
  const rule = el.querySelector('[data-role="rule"]');
  const update = () => {
    const cfg = MODEL_SCENARIOS[select.value];
    label.textContent = cfg.label;
    model.textContent = cfg.model;
    example.textContent = cfg.example;
    rule.textContent = cfg.rule;
  };
  select.addEventListener('change', update);
  update();
}

function renderNaiveBayesCondist(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || 'NaiveBayes 的 $tables：每个变量在每一类中的条件分布');
  el.innerHTML = `
    <div class="disc-guide-card">
      <div class="disc-guide-head">
        <div class="disc-guide-icon">NB</div>
        <div><span class="disc-guide-badge">conditional distribution</span><h3 class="disc-guide-title">${title}</h3></div>
      </div>
      <p class="disc-guide-lead">本章输出中的 <code>$tables</code> 不是普通描述表；每行给出某个类别下该变量的均值和标准差，用来计算新样本在该类别下出现的可能性。</p>
      <div class="disc-demo-panel">
        <div class="disc-demo-control">
          <label for="disc-nb-variable">查看变量</label>
          <select id="disc-nb-variable" data-role="variable">
            <option value="x1">x1</option>
            <option value="x2">x2</option>
            <option value="x3">x3</option>
            <option value="x4">x4</option>
          </select>
          <p class="disc-demo-small">均值/标准差来自本章 <code>NaiveBayes</code> 输出，四个变量共同参与最终后验概率计算。</p>
        </div>
        <div class="disc-demo-output">
          <table class="disc-table">
            <thead><tr><th>类别</th><th>均值</th><th>标准差</th></tr></thead>
            <tbody data-role="tbody"></tbody>
          </table>
          <p class="disc-demo-small" data-role="comment"></p>
        </div>
      </div>
    </div>`;
  const select = el.querySelector('[data-role="variable"]');
  const tbody = el.querySelector('[data-role="tbody"]');
  const comment = el.querySelector('[data-role="comment"]');
  const update = () => {
    const cfg = NB_VARIABLES[select.value];
    tbody.innerHTML = cfg.rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('');
    comment.textContent = cfg.comment;
  };
  select.addEventListener('change', update);
  update();
}

registerViz('discriminant-workflow-guide', renderGuide);
registerViz('lda-output-guide', renderGuide);
registerViz('lda-confusion-guide', renderConfusionGuide);
registerViz('lda-newdata-posterior-guide', renderGuide);
registerViz('qda-vs-lda-guide', renderModelChoice);
registerViz('naivebayes-condist-guide', renderNaiveBayesCondist);
registerViz('bayes-warning-guide', renderGuide);
