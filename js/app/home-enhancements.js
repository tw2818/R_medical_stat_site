import { ALL_CHAPTERS, getProgress } from '../chapters.js';

const METHOD_RECOMMENDATIONS = [
  {
    id: '1001-ttest',
    title: 't检验',
    group: 'basic',
    index: 0,
    reason: '连续型结局、两组均值比较或配对前后比较的首选入口。',
    tags: ['连续型', '两组', '配对'],
    match: { outcome: ['continuous'], design: ['two-groups', 'paired'], goal: ['description'] }
  },
  {
    id: '1002-anova',
    title: '方差分析',
    group: 'basic',
    index: 1,
    reason: '连续型结局、多组均值比较，适合先掌握单因素 ANOVA。',
    tags: ['连续型', '多组', 'ANOVA'],
    match: { outcome: ['continuous'], design: ['multi-groups'], goal: ['description'] }
  },
  {
    id: '1007-wilcoxon',
    title: '秩转换的非参数检验',
    group: 'basic',
    index: 5,
    reason: '连续或等级资料不满足正态假设时，用作均值比较的稳健替代。',
    tags: ['非正态', '等级资料', '秩和'],
    match: { outcome: ['continuous', 'ordinal'], design: ['two-groups', 'multi-groups', 'paired'], goal: ['description'] }
  },
  {
    id: '1006-chisq',
    title: '卡方检验',
    group: 'basic',
    index: 3,
    reason: '分类结局与分组变量之间的关联分析入口。',
    tags: ['分类资料', '率比较', '列联表'],
    match: { outcome: ['binary', 'categorical'], design: ['two-groups', 'multi-groups'], goal: ['description'] }
  },
  {
    id: '1018-logistic',
    title: 'Logistic回归',
    group: 'advanced',
    index: 7,
    reason: '二分类结局、多因素校正、危险因素分析与 OR 报告。',
    tags: ['二分类', 'OR', '多因素'],
    match: { outcome: ['binary'], design: ['multivariable'], goal: ['modeling'] }
  },
  {
    id: '1032-survival',
    title: '生存分析',
    group: 'advanced',
    index: 11,
    reason: '时间-事件结局、删失数据、KM 曲线与 Cox 回归的核心入口。',
    tags: ['生存时间', 'KM', 'Cox'],
    match: { outcome: ['survival'], design: ['two-groups', 'multi-groups', 'multivariable'], goal: ['modeling', 'paper'] }
  },
  {
    id: 'poisson',
    title: '泊松回归和负二项回归',
    group: 'advanced',
    index: 9,
    reason: '计数结局、发生次数、发病密度等资料的建模入口。',
    tags: ['计数资料', '发生率', '回归'],
    match: { outcome: ['count'], design: ['multivariable'], goal: ['modeling'] }
  },
  {
    id: '1035-psm',
    title: '倾向性评分：匹配',
    group: 'literature',
    index: 1,
    reason: '观察性研究中进行组间可比性调整和 PSM 论文复现。',
    tags: ['PSM', '混杂校正', '观察性研究'],
    match: { outcome: ['continuous', 'binary', 'survival'], design: ['two-groups'], goal: ['paper'] }
  },
  {
    id: '1040-rcs',
    title: '样条回归',
    group: 'literature',
    index: 6,
    reason: '连续暴露与结局之间存在潜在非线性关系时使用。',
    tags: ['RCS', '非线性', '剂量反应'],
    match: { outcome: ['continuous', 'binary', 'survival'], design: ['multivariable'], goal: ['paper', 'modeling'] }
  },
  {
    id: '1041-subgroupanalysis',
    title: '亚组分析及森林图绘制',
    group: 'literature',
    index: 7,
    reason: '论文中展示分层效应、交互作用和森林图结果。',
    tags: ['亚组', '森林图', '交互作用'],
    match: { outcome: ['binary', 'survival'], design: ['multivariable'], goal: ['paper'] }
  },
  {
    id: 'table3',
    title: '三线表绘制',
    group: 'basic',
    index: 7,
    reason: '论文表 1、基线特征表和规范统计表格输出。',
    tags: ['Table 1', '三线表', '论文'],
    match: { outcome: ['continuous', 'binary', 'categorical'], design: ['two-groups', 'multi-groups'], goal: ['paper'] }
  },
  {
    id: 'roc',
    title: 'ROC曲线',
    group: 'basic',
    index: 11,
    reason: '诊断试验、预测模型区分度和 AUC 报告。',
    tags: ['AUC', '诊断试验', '预测模型'],
    match: { outcome: ['binary'], design: ['multivariable'], goal: ['paper', 'modeling'] }
  }
];

const FILTERS = [
  {
    key: 'outcome',
    label: '结局变量',
    options: [
      ['continuous', '连续型'],
      ['binary', '二分类'],
      ['categorical', '多分类/率'],
      ['ordinal', '等级/非正态'],
      ['count', '计数资料'],
      ['survival', '生存时间']
    ]
  },
  {
    key: 'design',
    label: '研究设计',
    options: [
      ['two-groups', '两组'],
      ['multi-groups', '多组'],
      ['paired', '配对/前后'],
      ['multivariable', '多因素']
    ]
  },
  {
    key: 'goal',
    label: '分析目标',
    options: [
      ['description', '描述比较'],
      ['modeling', '回归建模'],
      ['paper', '论文复现']
    ]
  }
];

function $(id) {
  return document.getElementById(id);
}

function findChapterTitleById(id) {
  const chapter = ALL_CHAPTERS.find(item => item.id === id);
  return chapter ? chapter.title : '';
}

function createContinuePanel() {
  const hero = document.querySelector('.welcome-hero');
  if (!hero || document.querySelector('.home-continue-panel')) return;

  const visited = getProgress();
  const lastId = visited[visited.length - 1];
  if (!lastId) return;

  const lastTitle = findChapterTitleById(lastId);
  if (!lastTitle) return;

  const panel = document.createElement('div');
  panel.className = 'home-continue-panel';
  panel.innerHTML = `<span>已完成 <strong>${visited.length}/${ALL_CHAPTERS.length}</strong> · 上次学到：<strong>${lastTitle}</strong></span><button type="button" class="home-continue-link">继续学习</button>`;
  panel.querySelector('button').addEventListener('click', () => {
    const continueBtn = $('btn-continue');
    if (continueBtn) continueBtn.click();
  });

  const cta = hero.querySelector('.welcome-cta');
  if (cta) cta.insertAdjacentElement('afterend', panel);
}

function updateHeroCopy() {
  const title = document.querySelector('.welcome-hero h1');
  const lead = document.querySelector('.welcome-hero .lead');
  const leadSub = document.querySelector('.welcome-hero .lead-sub');
  const primary = document.querySelector('.welcome-cta .btn-primary');
  const secondary = document.querySelector('.welcome-cta .btn-secondary');
  const ghost = document.querySelector('.welcome-cta .btn-ghost');
  const searchInput = $('search-input');

  if (title) title.textContent = '不会选统计方法？从研究问题开始找 R 代码';
  if (lead) lead.textContent = '按结局类型、研究设计和论文场景，快速定位对应医学统计章节。';
  if (leadSub) leadSub.textContent = 't 检验 · 方差分析 · 卡方检验 · Logistic 回归 · Cox 回归 · 倾向评分 · RCS · 森林图';
  if (primary) primary.textContent = '从 t 检验开始';
  if (secondary) secondary.textContent = '按问题选方法';
  if (ghost) ghost.textContent = '浏览 46 个专题';
  if (searchInput) searchInput.placeholder = '搜 OR、PSM、RCS、二分类、三线表...';
}

function scoreRecommendation(rec, selected) {
  let score = 0;
  for (const [key, value] of Object.entries(selected)) {
    if (!value) continue;
    if (rec.match[key]?.includes(value)) score += key === 'outcome' ? 3 : 2;
  }
  return score;
}

function renderResults(container, selected) {
  const activeFilters = Object.values(selected).filter(Boolean).length;
  const scored = METHOD_RECOMMENDATIONS
    .map(rec => ({ ...rec, score: scoreRecommendation(rec, selected) }))
    .filter(rec => activeFilters === 0 ? ['1001-ttest', '1006-chisq', '1018-logistic', '1032-survival', '1035-psm', '1040-rcs'].includes(rec.id) : rec.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (!scored.length) {
    container.innerHTML = '<div class="method-empty">暂未找到完全匹配的章节，可尝试减少筛选条件或使用左侧搜索。</div>';
    return;
  }

  container.innerHTML = scored.map(rec => `
    <button type="button" class="method-result-card" data-nav-group="${rec.group}" data-nav-index="${rec.index}">
      <span class="method-result-title">${rec.title}</span>
      <span class="method-result-reason">${rec.reason}</span>
      <span class="method-result-tags">${rec.tags.map(tag => `<span>${tag}</span>`).join('')}</span>
    </button>
  `).join('');
}

function createMethodFinder() {
  const taskNav = $('task-nav');
  if (!taskNav || document.querySelector('.method-finder')) return;

  const selected = { outcome: '', design: '', goal: '' };
  const section = document.createElement('section');
  section.className = 'method-finder';
  section.innerHTML = `
    <div class="method-finder-header">
      <div>
        <h2>🧭 快速选方法</h2>
        <p class="method-finder-subtitle">先选资料类型和研究设计，再跳到最接近的章节。</p>
      </div>
      <span class="method-finder-tip">适合论文方法选择</span>
    </div>
    <div class="method-finder-controls">
      ${FILTERS.map(filter => `
        <div class="method-filter-row" data-filter="${filter.key}">
          <div class="method-filter-label">${filter.label}</div>
          <div class="method-options">
            ${filter.options.map(([value, label]) => `<button type="button" class="method-option" data-value="${value}">${label}</button>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    <div class="method-results" aria-live="polite"></div>
  `;

  const results = section.querySelector('.method-results');
  section.addEventListener('click', event => {
    const option = event.target.closest('.method-option');
    if (!option) return;

    const row = option.closest('[data-filter]');
    const key = row.dataset.filter;
    const value = option.dataset.value;
    const isActive = option.classList.contains('active');

    row.querySelectorAll('.method-option').forEach(btn => btn.classList.remove('active'));
    selected[key] = isActive ? '' : value;
    if (!isActive) option.classList.add('active');

    renderResults(results, selected);
  });

  renderResults(results, selected);
  taskNav.insertAdjacentElement('beforebegin', section);
}

export function initHomeEnhancements() {
  updateHeroCopy();
  createContinuePanel();
  createMethodFinder();
}
