import { registerViz } from './_core.js';

const WORKFLOW_STEPS = [
  {
    key: 'data',
    label: '1 变量结构',
    title: '先看变量结构',
    desc: '连续变量、分类变量、时间变量、空间变量对应的图形家族不同。先判断变量结构，后面才不会乱选图。',
    code: 'str(data)\n# 连续？分类？时间？空间？',
    hint: '例如：rate 是连续数值，year/sex 是分类或时间分组。'
  },
  {
    key: 'goal',
    label: '2 展示目的',
    title: '再明确图形要回答的问题',
    desc: '同一份数据可以画很多图，但医学论文图形应服务问题：比较、趋势、构成、分布、相关或一致性。',
    code: '# 目的：比较组间率\n# 或：展示随时间变化趋势',
    hint: '例如：患龋率适合比较；布氏菌病例数适合趋势图。'
  },
  {
    key: 'mapping',
    label: '3 映射与图层',
    title: '把变量映射到 aes，再选择 geom',
    desc: 'ggplot2 的核心是映射和图层：x/y/fill/color/linetype 决定信息怎样进入图形。',
    code: 'ggplot(data, aes(x, y, fill = group)) +\n  geom_col(position = "dodge")',
    hint: '分组条形图常用 fill + position="dodge"。'
  },
  {
    key: 'polish',
    label: '4 发表修饰',
    title: '最后统一成发表级图形',
    desc: '坐标轴、单位、图例、颜色、字号和导出尺寸决定读者能不能准确理解图形。',
    code: 'labs(x = "年份", y = "发病人数") +\n  theme_classic() +\n  ggsave("figure.png", dpi = 300)',
    hint: '默认图只是草稿，投稿前一定要二次整理。'
  }
];

const CHART_CHOICES = {
  compare: {
    title: '分类/分组比较',
    badge: 'bar / grouped bar',
    desc: '用于比较率、均数、构成比等分类结果。常见图形包括条形图、分组条形图、误差条图。',
    code: 'ggplot(df, aes(group, value, fill = year)) +\n  geom_col(position = "dodge")',
    preview: 'bar'
  },
  composition: {
    title: '构成比例',
    badge: 'stack / spine',
    desc: '用于回答“每一类占多少”。医学论文中排序条形图或百分比堆叠图通常比饼图更容易比较。',
    code: 'ggplot(df, aes(year, percent, fill = reason)) +\n  geom_col(position = "stack") +\n  coord_flip()',
    preview: 'stack'
  },
  distribution: {
    title: '连续变量分布',
    badge: 'hist / box / violin',
    desc: '用于观察中心位置、离散程度、偏态和异常值。直方图看形态，箱线图/小提琴图适合组间比较。',
    code: 'ggplot(df, aes(group, value)) +\n  geom_boxplot() +\n  geom_jitter(width = .1)',
    preview: 'box'
  },
  trend: {
    title: '时间趋势',
    badge: 'line / point-line',
    desc: '用于展示随年份、月份或随访时间变化的率、病例数或指标。重点看斜率、拐点和组间趋势差异。',
    code: 'ggplot(df, aes(year, count, linetype = sex)) +\n  geom_line() + geom_point()',
    preview: 'line'
  },
  relation: {
    title: '相关/模型诊断',
    badge: 'scatter / QQ / BA',
    desc: '散点图看两个连续变量关系；Q-Q 图看正态性；Bland-Altman 图看两种测量方法一致性。',
    code: 'ggplot(df, aes(x, y)) +\n  geom_point() +\n  geom_smooth(method = "lm")',
    preview: 'scatter'
  }
};

const POLISH_ITEMS = [
  ['axis', '坐标轴和单位', 'x/y 轴名称、单位、刻度范围和百分比格式是否清楚。'],
  ['legend', '图例和分组', '图例标题、分组名称、颜色/线型是否与正文保持一致。'],
  ['annotation', '图题与注释', '图题是否说明研究对象、变量含义、缩写和必要统计方法。'],
  ['export', '导出参数', '宽高、分辨率、字体大小、文件格式是否满足投稿或汇报要求。']
];

function ensurePlottingGuideStyles() {
  if (document.getElementById('plotting-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'plotting-guide-styles';
  style.textContent = `
    .plot-lab{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:960px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .plot-lab-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .plot-lab-subtitle{font-size:12px;color:#64748b;font-weight:500;}
    .plot-lab-body{display:grid;grid-template-columns:260px 1fr;gap:14px;padding:14px;}
    .plot-lab-controls{display:flex;flex-direction:column;gap:8px;}
    .plot-lab-btn{width:100%;border:1px solid #dbe3ef;background:#fff;color:#334155;border-radius:10px;padding:10px 12px;text-align:left;font-size:13px;line-height:1.35;cursor:pointer;transition:all .15s;}
    .plot-lab-btn:hover{background:#f1f5f9;transform:translateY(-1px);}
    .plot-lab-btn.active{border-color:#818cf8;background:#eef2ff;color:#312e81;box-shadow:0 2px 8px rgba(99,102,241,.12);font-weight:750;}
    .plot-lab-panel{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;min-height:230px;box-shadow:0 2px 8px rgba(15,23,42,.035);}
    .plot-lab-kicker{display:inline-block;padding:4px 9px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:10px;}
    .plot-lab-title{font-size:18px;font-weight:800;margin:0 0 8px;color:#0f172a;}
    .plot-lab-desc{font-size:13.5px;line-height:1.75;color:#64748b;margin:0 0 12px;}
    .plot-lab-code{background:#0f172a;color:#e2e8f0;border-radius:10px;padding:11px 12px;font-size:12px;line-height:1.55;white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow:auto;}
    .plot-lab-hint{margin-top:10px;padding:9px 11px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:9px;color:#64748b;font-size:12.5px;line-height:1.6;}
    .plot-preview{height:120px;margin:6px 0 12px;background:linear-gradient(180deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:10px;position:relative;overflow:hidden;}
    .plot-preview svg{width:100%;height:100%;display:block;}
    .plot-check-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px;}
    .plot-check-item{border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:12px;transition:all .15s;}
    .plot-check-item:hover{background:#f8fafc;}
    .plot-check-title{display:flex;align-items:center;gap:7px;font-weight:750;color:#0f172a;font-size:14px;margin-bottom:5px;}
    .plot-check-desc{font-size:12.5px;color:#64748b;line-height:1.6;margin:0;}
    .plot-progress{height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin:4px 0 12px;}
    .plot-progress-bar{height:100%;width:0;background:linear-gradient(90deg,#818cf8,#22c55e);transition:width .2s;}
    @media (max-width:760px){.plot-lab-body{grid-template-columns:1fr}.plot-check-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function renderMiniPreview(type) {
  if (type === 'bar') {
    return `<svg viewBox="0 0 360 120" aria-hidden="true"><line x1="35" y1="92" x2="330" y2="92" stroke="#94a3b8"/><line x1="35" y1="18" x2="35" y2="92" stroke="#94a3b8"/><rect x="70" y="48" width="38" height="44" rx="4" fill="#818cf8"/><rect x="130" y="34" width="38" height="58" rx="4" fill="#60a5fa"/><rect x="190" y="62" width="38" height="30" rx="4" fill="#a78bfa"/><rect x="250" y="25" width="38" height="67" rx="4" fill="#38bdf8"/></svg>`;
  }
  if (type === 'stack') {
    return `<svg viewBox="0 0 360 120" aria-hidden="true"><rect x="52" y="30" width="105" height="58" rx="8" fill="#818cf8"/><rect x="92" y="30" width="40" height="58" fill="#60a5fa"/><rect x="132" y="30" width="25" height="58" fill="#a78bfa"/><rect x="205" y="30" width="105" height="58" rx="8" fill="#818cf8"/><rect x="250" y="30" width="36" height="58" fill="#60a5fa"/><rect x="286" y="30" width="24" height="58" fill="#a78bfa"/><text x="105" y="105" text-anchor="middle" font-size="12" fill="#64748b">1996</text><text x="258" y="105" text-anchor="middle" font-size="12" fill="#64748b">2000</text></svg>`;
  }
  if (type === 'box') {
    return `<svg viewBox="0 0 360 120" aria-hidden="true"><line x1="40" y1="96" x2="320" y2="96" stroke="#94a3b8"/><g stroke="#334155" fill="#bfdbfe"><line x1="95" y1="28" x2="95" y2="86"/><rect x="72" y="45" width="46" height="28" rx="3"/><line x1="72" y1="60" x2="118" y2="60" stroke="#be123c"/></g><g stroke="#334155" fill="#ddd6fe"><line x1="180" y1="20" x2="180" y2="82"/><rect x="157" y="38" width="46" height="26" rx="3"/><line x1="157" y1="52" x2="203" y2="52" stroke="#be123c"/></g><g stroke="#334155" fill="#c7d2fe"><line x1="265" y1="34" x2="265" y2="90"/><rect x="242" y="55" width="46" height="22" rx="3"/><line x1="242" y1="66" x2="288" y2="66" stroke="#be123c"/></g></svg>`;
  }
  if (type === 'line') {
    return `<svg viewBox="0 0 360 120" aria-hidden="true"><line x1="38" y1="92" x2="330" y2="92" stroke="#94a3b8"/><line x1="38" y1="20" x2="38" y2="92" stroke="#94a3b8"/><polyline points="50,76 110,68 170,52 230,36 295,34" fill="none" stroke="#6366f1" stroke-width="4"/><polyline points="50,86 110,78 170,70 230,56 295,54" fill="none" stroke="#38bdf8" stroke-width="4"/><g fill="#6366f1"><circle cx="50" cy="76" r="4"/><circle cx="110" cy="68" r="4"/><circle cx="170" cy="52" r="4"/><circle cx="230" cy="36" r="4"/><circle cx="295" cy="34" r="4"/></g></svg>`;
  }
  return `<svg viewBox="0 0 360 120" aria-hidden="true"><line x1="38" y1="92" x2="330" y2="92" stroke="#94a3b8"/><line x1="38" y1="20" x2="38" y2="92" stroke="#94a3b8"/><line x1="58" y1="82" x2="300" y2="34" stroke="#c084fc" stroke-width="3" stroke-dasharray="5 5"/><g fill="#6366f1" opacity=".9"><circle cx="70" cy="78" r="5"/><circle cx="105" cy="72" r="5"/><circle cx="145" cy="58" r="5"/><circle cx="185" cy="54" r="5"/><circle cx="225" cy="44" r="5"/><circle cx="275" cy="35" r="5"/></g></svg>`;
}

function renderWorkflow(el) {
  const title = el.dataset.title || '统计绘图的基本流程';
  el.innerHTML = `
    <section class="plot-lab" aria-label="${title}">
      <div class="plot-lab-header"><span>🎨 ${title}</span><span class="plot-lab-subtitle">点击左侧步骤查看对应代码思路</span></div>
      <div class="plot-lab-body">
        <div class="plot-lab-controls">
          ${WORKFLOW_STEPS.map((step, idx) => `<button class="plot-lab-btn ${idx === 0 ? 'active' : ''}" type="button" data-step="${step.key}">${step.label}<br><span>${step.title}</span></button>`).join('')}
        </div>
        <div class="plot-lab-panel" data-panel></div>
      </div>
    </section>`;
  const panel = el.querySelector('[data-panel]');
  const buttons = [...el.querySelectorAll('.plot-lab-btn')];
  function show(stepKey) {
    const step = WORKFLOW_STEPS.find(item => item.key === stepKey) || WORKFLOW_STEPS[0];
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.step === step.key));
    panel.innerHTML = `<span class="plot-lab-kicker">${step.label}</span><h4 class="plot-lab-title">${step.title}</h4><p class="plot-lab-desc">${step.desc}</p><pre class="plot-lab-code">${step.code}</pre><div class="plot-lab-hint">💡 ${step.hint}</div>`;
  }
  buttons.forEach(btn => btn.addEventListener('click', () => show(btn.dataset.step)));
  show(WORKFLOW_STEPS[0].key);
}

function renderChartChoice(el) {
  const title = el.dataset.title || '常见医学统计图怎么选';
  const keys = Object.keys(CHART_CHOICES);
  el.innerHTML = `
    <section class="plot-lab" aria-label="${title}">
      <div class="plot-lab-header"><span>🧭 ${title}</span><span class="plot-lab-subtitle">点击问题类型，右侧即时推荐图形</span></div>
      <div class="plot-lab-body">
        <div class="plot-lab-controls">
          ${keys.map((key, idx) => `<button class="plot-lab-btn ${idx === 0 ? 'active' : ''}" type="button" data-choice="${key}">${CHART_CHOICES[key].title}<br><span>${CHART_CHOICES[key].badge}</span></button>`).join('')}
        </div>
        <div class="plot-lab-panel" data-panel></div>
      </div>
    </section>`;
  const panel = el.querySelector('[data-panel]');
  const buttons = [...el.querySelectorAll('.plot-lab-btn')];
  function show(choiceKey) {
    const choice = CHART_CHOICES[choiceKey] || CHART_CHOICES.compare;
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.choice === choiceKey));
    panel.innerHTML = `<span class="plot-lab-kicker">推荐：${choice.badge}</span><h4 class="plot-lab-title">${choice.title}</h4><div class="plot-preview">${renderMiniPreview(choice.preview)}</div><p class="plot-lab-desc">${choice.desc}</p><pre class="plot-lab-code">${choice.code}</pre>`;
  }
  buttons.forEach(btn => btn.addEventListener('click', () => show(btn.dataset.choice)));
  show(keys[0]);
}

function renderPolishChecklist(el) {
  const title = el.dataset.title || '发表前图形检查清单';
  el.innerHTML = `
    <section class="plot-lab" aria-label="${title}">
      <div class="plot-lab-header"><span>✅ ${title}</span><span class="plot-lab-subtitle">静态核对模板</span></div>
      <div style="padding:14px;">
        <div class="plot-check-grid">
          ${POLISH_ITEMS.map(([, heading, desc]) => `<article class="plot-check-item static"><div class="plot-check-title"><span>✓</span>${heading}</div><p class="plot-check-desc">${desc}</p></article>`).join('')}
        </div>
      </div>
    </section>`;
}

function renderPlottingGuide(el) {
  ensurePlottingGuideStyles();
  if (el.dataset.type === 'plotting-chart-choice') return renderChartChoice(el);
  if (el.dataset.type === 'plotting-polish-checklist') return renderPolishChecklist(el);
  return renderWorkflow(el);
}

registerViz('plotting-workflow', renderPlottingGuide);
registerViz('plotting-chart-choice', renderPlottingGuide);
registerViz('plotting-polish-checklist', renderPlottingGuide);
