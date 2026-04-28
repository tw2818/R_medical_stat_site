import { registerViz } from './_core.js';

const GUIDE_CARDS = {
  'anova-type-guide': {
    icon: '🧮',
    title: 'Type I / II / III 平方和：先问“把谁先算进去”',
    cards: [
      ['类型Ⅰ', '顺序平方和：按公式右侧变量出现顺序逐项分配解释量。R 的 aov() 默认就是 Type I。', 'sequential'],
      ['类型Ⅱ', '边际平方和：检验某个主效应时，已控制其他主效应，但通常不把高阶交互纳入同一问题。', 'marginal'],
      ['类型Ⅲ', '部分平方和：在完整模型里检验每个项，SPSS/SAS 默认常用 Type III。', 'partial'],
      ['看设计', '均衡/正交时三者常相同；非均衡多因素或有协变量时，平方和归属会改变。', 'design first'],
    ],
  },
  'anova-balance-guide': {
    icon: '⚖️',
    title: '均衡 vs 非均衡：差别不只是每组 n 是否相等',
    cards: [
      ['均衡设计', '各因素组合样本量相等，因子之间近似正交，平方和更容易清楚分配。', 'balanced'],
      ['单因素非均衡', '只有一个分组因素时，Type I/II/III 通常仍给出相同的组效应检验。', 'one factor'],
      ['多因素非均衡', 'block、group 等因素相关时，先进入模型的变量会先“拿走”一部分平方和。', 'non-orthogonal'],
      ['医学实务', '失访、中心入组不均、病例分层不均都可能让原本设计变成非均衡。', 'clinical data'],
    ],
  },
  'anova-formula-order-guide': {
    icon: '🧭',
    title: '公式顺序怎么放：协变量 → 主效应 → 交互项',
    cards: [
      ['协变量优先', '若有 x、年龄、基线值等连续协变量，先放在公式前面，表示先扣除其线性影响。', 'covariate'],
      ['主效应其次', 'block、group 等主效应放在交互项前；Type I 下越靠前越先分配平方和。', 'main effects'],
      ['交互项最后', 'A:B 或 A*B 中的交互解释“效应是否因另一因素而改变”，不应抢在主效应前。', 'interaction'],
      ['报告要说明', '当设计非正交时，应说明使用 Type I/II/III 以及变量顺序，不只复制软件输出。', 'report'],
    ],
  },
  'anova-block-ancova-guide': {
    icon: '🔀',
    title: '同样是 y ~ x + group：ANCOVA 还是随机区组？',
    cards: [
      ['x 是连续变量', '例如治疗前基线、年龄、BMI；R 会把它当协变量，模型解释为 ANCOVA。', 'ANCOVA'],
      ['x 是因子/字符', '例如区组、中心、批次、窝别；R 会把它当分类因素，模型解释为随机区组/多因素 ANOVA。', 'block'],
      ['统计含义不同', '协变量控制连续线性趋势；区组因素吸收分类层面的系统差异。', 'meaning'],
      ['先改变量类型', '分析前明确 as.factor() 或 as.numeric()，不要让 R 靠默认类型替你决定模型含义。', 'type check'],
    ],
  },
};

function ensureAnovaAttentionStyles() {
  if (document.getElementById('anova-attn-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'anova-attn-guide-styles';
  style.textContent = `
    .anova-attn-card{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:980px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .anova-attn-header{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .anova-attn-icon{font-size:18px;line-height:1;}
    .anova-attn-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px;}
    .anova-attn-item{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 14px;box-shadow:0 2px 8px rgba(15,23,42,.035);min-height:144px;}
    .anova-attn-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:11px;}
    .anova-attn-title{font-size:16px;font-weight:750;line-height:1.35;color:#0f172a;margin:0 0 8px;}
    .anova-attn-desc{font-size:13.5px;line-height:1.7;color:#64748b;margin:0;}
    .anova-attn-demo{display:grid;grid-template-columns:minmax(300px,1.1fr) minmax(240px,.9fr);gap:14px;padding:14px;}
    .anova-attn-panel,.anova-attn-note{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 2px 8px rgba(15,23,42,.035);padding:14px;}
    .anova-attn-control{display:flex;gap:10px;align-items:center;margin:4px 0 14px;color:#475569;font-size:13px;}
    .anova-attn-control input[type="range"]{flex:1;accent-color:#4f46e5;}
    .anova-attn-value{font-weight:800;color:#3730a3;min-width:44px;text-align:right;}
    .anova-attn-table{width:100%;border-collapse:collapse;border-top:2px solid #334155;border-bottom:2px solid #334155;}
    .anova-attn-table th,.anova-attn-table td{font-size:12.5px;text-align:left;padding:8px;border-bottom:1px solid #e2e8f0;color:#475569;}
    .anova-attn-table th{color:#334155;background:#f8fafc;font-weight:750;}
    .anova-attn-ssbar{height:18px;border-radius:999px;background:#e2e8f0;overflow:hidden;display:flex;margin:12px 0;}
    .anova-attn-ssbar span{display:block;height:100%;}
    @media (max-width:980px){.anova-attn-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.anova-attn-demo{grid-template-columns:1fr;}}
    @media (max-width:640px){.anova-attn-grid{grid-template-columns:1fr;}.anova-attn-item{min-height:auto;}}
  `;
  document.head.appendChild(style);
}

function renderStaticGuide(el) {
  const config = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['anova-type-guide'];
  const title = el.dataset.title || config.title;
  el.innerHTML = `
    <section class="anova-attn-card" aria-label="${title}">
      <div class="anova-attn-header"><span class="anova-attn-icon">${config.icon}</span><span>${title}</span></div>
      <div class="anova-attn-grid">
        ${config.cards.map(([heading, desc, badge]) => `
          <article class="anova-attn-item">
            <span class="anova-attn-badge">${badge}</span>
            <h4 class="anova-attn-title">${heading}</h4>
            <p class="anova-attn-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </section>`;
}

function renderTypeResultDemo(el) {
  const title = el.dataset.title || '交互演示：非均衡越明显，平方和归属越敏感';
  const id = 'anova-type-' + Math.random().toString(36).slice(2, 8);
  el.innerHTML = `
    <section class="anova-attn-card" aria-label="${title}">
      <div class="anova-attn-header"><span class="anova-attn-icon">📊</span><span>${title}</span></div>
      <div class="anova-attn-demo">
        <div class="anova-attn-panel">
          <label class="anova-attn-control">非均衡/相关强度 <input type="range" id="${id}-slider" min="0" max="1" step="0.05" value="0"><span id="${id}-value" class="anova-attn-value">0.00</span></label>
          <div class="anova-attn-ssbar" aria-label="平方和分配示意"><span id="${id}-a" style="background:#4f46e5;width:34%"></span><span id="${id}-b" style="background:#0891b2;width:33%"></span><span id="${id}-r" style="background:#cbd5e1;width:33%"></span></div>
          <table class="anova-attn-table"><thead><tr><th>类型</th><th>问题</th><th>教学结论</th></tr></thead><tbody id="${id}-rows"></tbody></table>
        </div>
        <div class="anova-attn-note">
          <span class="anova-attn-badge">Type I/II/III</span>
          <h4 class="anova-attn-title">这不是“哪个软件对”，而是“检验问题不同”</h4>
          <p id="${id}-desc" class="anova-attn-desc"></p>
        </div>
      </div>
    </section>`;
  const slider = document.getElementById(`${id}-slider`);
  const value = document.getElementById(`${id}-value`);
  const rows = document.getElementById(`${id}-rows`);
  const desc = document.getElementById(`${id}-desc`);
  const a = document.getElementById(`${id}-a`);
  const b = document.getElementById(`${id}-b`);
  const r = document.getElementById(`${id}-r`);
  function update() {
    const v = Number(slider.value);
    value.textContent = v.toFixed(2);
    a.style.width = `${34 + v * 18}%`;
    b.style.width = `${33 - v * 14}%`;
    r.style.width = `${33 - v * 4}%`;
    const same = v < 0.15;
    rows.innerHTML = [
      ['类型Ⅰ', '按公式顺序逐项进入', same ? '与其他类型近似一致' : '对变量顺序最敏感'],
      ['类型Ⅱ', '控制其他主效应后检验', same ? '与类型Ⅰ/Ⅲ一致' : '更接近“主效应边际贡献”'],
      ['类型Ⅲ', '完整模型中检验每一项', same ? '与类型Ⅰ/Ⅱ一致' : '常与 SPSS/SAS 默认结果对应'],
    ].map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('');
    desc.textContent = same
      ? '当设计均衡、因素近似正交时，三种平方和通常给出相同结论。'
      : '当非均衡设计叠加多个因素或协变量时，同一部分变异可能被不同项“争夺”，所以要先定义研究问题，再选择 Type I/II/III。';
  }
  slider.addEventListener('input', update);
  update();
}

function renderVariableTypeDecisionDemo(el) {
  const title = el.dataset.title || '交互演示：变量类型决定模型含义';
  const id = 'anova-var-' + Math.random().toString(36).slice(2, 8);
  el.innerHTML = `
    <section class="anova-attn-card" aria-label="${title}">
      <div class="anova-attn-header"><span class="anova-attn-icon">🧩</span><span>${title}</span></div>
      <div class="anova-attn-demo">
        <div class="anova-attn-panel">
          <label class="anova-attn-control">x 的可取水平数 <input id="${id}-slider" type="range" min="2" max="30" step="1" value="3"><span id="${id}-value" class="anova-attn-value">3</span></label>
          <table class="anova-attn-table"><tbody id="${id}-rows"></tbody></table>
        </div>
        <div class="anova-attn-note">
          <span class="anova-attn-badge">变量类型</span>
          <h4 class="anova-attn-title">连续变量像协变量，分类变量像区组/因素</h4>
          <p id="${id}-desc" class="anova-attn-desc"></p>
        </div>
      </div>
    </section>`;
  const slider = document.getElementById(`${id}-slider`);
  const value = document.getElementById(`${id}-value`);
  const rows = document.getElementById(`${id}-rows`);
  const desc = document.getElementById(`${id}-desc`);
  function update() {
    const levels = Number(slider.value);
    value.textContent = String(levels);
    const likelyFactor = levels <= 8;
    rows.innerHTML = `
      <tr><th>如果 x 是</th><td>${likelyFactor ? '分类变量 / 因子' : '连续变量 / 数值型协变量'}</td></tr>
      <tr><th>模型读法</th><td>${likelyFactor ? '随机区组或多因素 ANOVA：控制区组/批次差异' : 'ANCOVA：控制 x 的连续线性影响'}</td></tr>
      <tr><th>R 操作</th><td>${likelyFactor ? '明确使用 as.factor(x)' : '确认 x 保持 numeric，并检查线性关系'}</td></tr>`;
    desc.textContent = likelyFactor
      ? '当 x 只有少数离散水平且代表中心、批次、窝别、区组时，应把它当分类因素，而不是协变量。'
      : '当 x 是基线值、年龄、BMI 等连续测量值时，模型 y ~ x + group 通常解释为协方差分析。';
  }
  slider.addEventListener('input', update);
  update();
}

function renderAnovaAttentionGuide(el) {
  ensureAnovaAttentionStyles();
  if (el.dataset.type === 'anova-type-result-demo') {
    renderTypeResultDemo(el);
    return;
  }
  if (el.dataset.type === 'anova-variable-type-decision-demo') {
    renderVariableTypeDecisionDemo(el);
    return;
  }
  renderStaticGuide(el);
}

registerViz('anova-type-guide', renderAnovaAttentionGuide);
registerViz('anova-balance-guide', renderAnovaAttentionGuide);
registerViz('anova-formula-order-guide', renderAnovaAttentionGuide);
registerViz('anova-type-result-demo', renderAnovaAttentionGuide);
registerViz('anova-block-ancova-guide', renderAnovaAttentionGuide);
registerViz('anova-variable-type-decision-demo', renderAnovaAttentionGuide);
