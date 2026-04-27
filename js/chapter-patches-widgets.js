function patchTTestWidgets(container) {
  const pvalues = container.querySelectorAll('.stat-viz[data-type="pvalue"]');
  if (pvalues.length > 1) {
    pvalues[0].remove();
  }

  const introBox = container.querySelector('.stat-viz[data-type="box"]');
  if (introBox) introBox.remove();

  const pairedScatter = Array.from(container.querySelectorAll('.stat-viz[data-type="scatter"]')).find(el =>
    (el.dataset.title || '').includes('配对数据') ||
    (el.dataset.xlabel || '').includes('用药前') ||
    (el.dataset.ylabel || '').includes('用药后')
  );
  if (pairedScatter) {
    pairedScatter.dataset.type = 'pairedttestviz';
    pairedScatter.dataset.title = '配对 t 检验可视化：连线图与差值图';
  }

  const blandAltmanWidgets = Array.from(container.querySelectorAll('.stat-viz')).filter(el =>
    (el.dataset.type || '').toLowerCase().includes('bland') ||
    (el.dataset.title || '').toLowerCase().includes('bland-altman') ||
    (el.dataset.title || '').includes('一致性分析')
  );
  blandAltmanWidgets.forEach(el => el.remove());

  const startP = Array.from(container.querySelectorAll('p')).find(p =>
    p.textContent.includes('如果数据格式是两列数据')
  );
  if (startP) {
    let node = startP;
    while (node) {
      const next = node.nextElementSibling;
      const stop = node.tagName === 'BLOCKQUOTE';
      node.remove();
      if (stop) break;
      node = next;
    }
  }
}

function makeViz(type, title, attrs = {}) {
  const widget = document.createElement('div');
  widget.className = 'stat-viz anova-teaching-widget';
  widget.dataset.type = type;
  widget.dataset.title = title;
  Object.entries(attrs).forEach(([key, value]) => {
    widget.dataset[key] = value;
  });
  return widget;
}

function makeDiscreteViz(type, title, attrs = {}) {
  const widget = document.createElement('div');
  widget.className = 'stat-viz discrete-teaching-widget';
  widget.dataset.type = type;
  widget.dataset.title = title;
  Object.entries(attrs).forEach(([key, value]) => {
    widget.dataset[key] = value;
  });
  return widget;
}

function makeChisqViz(type, title, attrs = {}) {
  const widget = document.createElement('div');
  widget.className = 'stat-viz chisq-teaching-widget';
  widget.dataset.type = type;
  widget.dataset.title = title;
  Object.entries(attrs).forEach(([key, value]) => {
    widget.dataset[key] = value;
  });
  return widget;
}

function makeTrendViz(type, title, attrs = {}) {
  const widget = document.createElement('div');
  widget.className = 'stat-viz trend-teaching-widget';
  widget.dataset.type = type;
  widget.dataset.title = title;
  Object.entries(attrs).forEach(([key, value]) => {
    widget.dataset[key] = value;
  });
  return widget;
}

function makeNonparametricViz(type, title, attrs = {}) {
  const widget = document.createElement('div');
  widget.className = 'stat-viz nonparametric-teaching-widget';
  widget.dataset.type = type;
  widget.dataset.title = title;
  Object.entries(attrs).forEach(([key, value]) => {
    widget.dataset[key] = value;
  });
  return widget;
}

function insertAfter(anchor, ...nodes) {
  if (!anchor || !nodes.length) return;
  let current = anchor;
  nodes.forEach(node => {
    current.insertAdjacentElement('afterend', node);
    current = node;
  });
}

function findHeading(container, text) {
  return Array.from(container.querySelectorAll('h1, h2, h3')).find(h => h.textContent.includes(text));
}

function insertionAnchor(heading, noteSelector) {
  if (!heading) return null;
  const next = heading.nextElementSibling;
  if (noteSelector && next && next.matches(noteSelector)) return next;
  return heading;
}

function patchAnovaWidgets(container) {
  if (container.querySelector('.anova-teaching-widget')) return;

  const completelyRandomHeading = findHeading(container, '完全随机设计资料的方差分析');
  if (completelyRandomHeading) {
    insertAfter(
      insertionAnchor(completelyRandomHeading, '[data-crd-note="true"]'),
      makeViz('anovadecomp', 'ANOVA 核心逻辑：总变异 = 组间变异 + 组内变异'),
      makeViz('anovadesign', '完全随机设计结构示意', { design: 'crd' })
    );
  }

  const blockHeading = findHeading(container, '随机区组设计资料的方差分析');
  if (blockHeading) {
    insertAfter(insertionAnchor(blockHeading, '[data-block-note="true"]'), makeViz('anovadesign', '随机区组设计结构示意', { design: 'block' }));
  }

  const latinHeading = findHeading(container, '拉丁方设计方差分析');
  if (latinHeading) {
    insertAfter(insertionAnchor(latinHeading, '[data-latin-note="true"]'), makeViz('anovadesign', '拉丁方设计结构示意', { design: 'latin' }));
  }

  const crossoverHeading = findHeading(container, '两阶段交叉设计资料方差分析');
  if (crossoverHeading) {
    insertAfter(insertionAnchor(crossoverHeading, '[data-crossover-note="true"]'), makeViz('anovadesign', '两阶段交叉设计结构示意', { design: 'crossover' }));
  }

  const multipleCompareHeading = findHeading(container, '多个样本均数间的多重比较');
  if (multipleCompareHeading) {
    insertAfter(insertionAnchor(multipleCompareHeading, '[data-multiple-note="true"]'), makeViz('multiplecompareguide', '多重比较选择指南'));
  }
}

function removePoissonWidgetsFromNegativeBinomialSection(container) {
  const nbHeading = findHeading(container, '负二项分布');
  if (!nbHeading) return;

  let node = nbHeading.nextElementSibling;
  while (node && !['H1', 'H2'].includes(node.tagName)) {
    const next = node.nextElementSibling;
    if (node.matches?.('.stat-viz[data-type="poisson"]')) {
      node.remove();
    } else {
      node.querySelectorAll?.('.stat-viz[data-type="poisson"]').forEach(el => el.remove());
    }
    node = next;
  }
}

function replaceBinomialCIWidget(container) {
  const candidates = Array.from(container.querySelectorAll('.stat-viz, .stat-calc')).filter(el => {
    const title = el.dataset.title || '';
    const type = (el.dataset.type || '').toLowerCase();
    return title.includes('二项分布置信区间') || title.includes('Clopper-Pearson') || type.includes('binomci') || type.includes('binomialci');
  });

  candidates.forEach(el => {
    el.classList.remove('stat-calc');
    el.classList.add('stat-viz');
    el.dataset.type = 'binomialcifixed';
    el.dataset.title = '二项分布置信区间 — Clopper-Pearson 精确区间 & 正态近似';
    delete el.dataset.rendered;
  });

  if (!candidates.length && !container.querySelector('.stat-viz[data-type="binomialcifixed"]')) {
    const ciHeading = findHeading(container, '总体率的区间估计');
    const widget = makeDiscreteViz('binomialcifixed', '二项分布置信区间 — Clopper-Pearson 精确区间 & 正态近似', { x: '2', n: '20', conf: '0.95' });
    widget.classList.remove('discrete-teaching-widget');
    insertAfter(ciHeading, widget);
  }
}

function replaceBinomialDistributionWidget(container) {
  const candidates = Array.from(container.querySelectorAll('.stat-viz, .stat-calc')).filter(el => {
    const title = el.dataset.title || '';
    const type = (el.dataset.type || '').toLowerCase();
    if (type.includes('binomci') || type.includes('binomialci')) return false;
    return title.includes('二项分布') || type === 'binom' || type === 'binomial' || type === 'binomdist' || type === 'binomialdist';
  });

  candidates.forEach(el => {
    const title = el.dataset.title || '';
    if (title.includes('置信区间') || title.includes('Clopper-Pearson')) return;
    el.classList.remove('stat-calc');
    el.classList.add('stat-viz');
    el.dataset.type = 'binomialdistfixed';
    el.dataset.title = '二项分布 B(n, p)：成功次数的分布';
    if (!el.dataset.n) el.dataset.n = '20';
    if (!el.dataset.p) el.dataset.p = '0.30';
    if (!el.dataset.k) el.dataset.k = '6';
    delete el.dataset.rendered;
  });

  if (!container.querySelector('.stat-viz[data-type="binomialdistfixed"]')) {
    const binomialHeading = findHeading(container, '二项分布');
    const widget = makeDiscreteViz('binomialdistfixed', '二项分布 B(n, p)：成功次数的分布', { n: '20', p: '0.30', k: '6' });
    widget.classList.remove('discrete-teaching-widget');
    insertAfter(insertionAnchor(binomialHeading, '[data-binomial-note="true"]'), widget);
  }
}

function replacePoissonCIWidget(container) {
  const candidates = Array.from(container.querySelectorAll('.stat-viz, .stat-calc')).filter(el => {
    const title = el.dataset.title || '';
    const type = (el.dataset.type || '').toLowerCase();
    return title.includes('泊松分布置信区间') || title.includes('泊松均数') && title.includes('区间') || title.includes('Poisson') && title.includes('CI') || type.includes('poissonci') || type.includes('poissoncinterval');
  });

  candidates.forEach(el => {
    el.classList.remove('stat-calc');
    el.classList.add('stat-viz');
    el.dataset.type = 'poissoncifixed';
    el.dataset.title = '泊松分布置信区间 — Garwood 精确区间 & 正态近似';
    if (!el.dataset.x) el.dataset.x = '68';
    if (!el.dataset.exposure) el.dataset.exposure = el.dataset.t || '1';
    if (!el.dataset.conf) el.dataset.conf = '0.99';
    delete el.dataset.rendered;
  });

  if (!container.querySelector('.stat-viz[data-type="poissoncifixed"]')) {
    const ciHeading = findHeading(container, '总体均数的区间估计');
    const widget = makeDiscreteViz('poissoncifixed', '泊松分布置信区间 — Garwood 精确区间 & 正态近似', { x: '68', exposure: '1', conf: '0.99' });
    widget.classList.remove('discrete-teaching-widget');
    insertAfter(ciHeading, widget);
  }
}

function replacePoissonDistributionWidget(container) {
  const candidates = Array.from(container.querySelectorAll('.stat-viz, .stat-calc')).filter(el => {
    const title = el.dataset.title || '';
    const type = (el.dataset.type || '').toLowerCase();
    if (type.includes('poissonrate') || type.includes('ratecompare') || type.includes('poissonci')) return false;
    if (title.includes('置信区间') || title.includes('区间') || title.includes('事件率比较') || title.includes('率比较')) return false;
    return title.includes('泊松分布') || type === 'poisson' || type === 'poissondist' || type === 'poissondistribution';
  });

  candidates.forEach(el => {
    el.classList.remove('stat-calc');
    el.classList.add('stat-viz');
    el.dataset.type = 'poissondistfixed';
    el.dataset.title = '泊松分布 Poisson(λ)：单位观察量内事件数';
    if (!el.dataset.lambda) el.dataset.lambda = el.dataset.rate || '4';
    if (!el.dataset.k) el.dataset.k = '4';
    delete el.dataset.rendered;
  });

  if (!container.querySelector('.stat-viz[data-type="poissondistfixed"]')) {
    const poissonHeading = findHeading(container, '泊松分布');
    const widget = makeDiscreteViz('poissondistfixed', '泊松分布 Poisson(λ)：单位观察量内事件数', { lambda: '4', k: '4' });
    widget.classList.remove('discrete-teaching-widget');
    insertAfter(insertionAnchor(poissonHeading, '[data-poisson-note="true"]'), widget);
  }
}

function insertDiscreteWidgetOnce(container, selector, anchor, type, title, attrs = {}) {
  if (container.querySelector(selector)) return;
  insertAfter(anchor, makeDiscreteViz(type, title, attrs));
}

function patchDiscreteWidgets(container) {
  removePoissonWidgetsFromNegativeBinomialSection(container);
  replaceBinomialCIWidget(container);
  replaceBinomialDistributionWidget(container);
  replacePoissonCIWidget(container);
  replacePoissonDistributionWidget(container);

  const chapterHeading = findHeading(container, '几种离散型变量的分布及其应用') || container.querySelector('h1');
  insertDiscreteWidgetOnce(container,'.discrete-teaching-widget[data-type="discretedistguide"]',insertionAnchor(chapterHeading, '[data-discrete-intro-note="true"]'),'discretedistguide','第三章总览：离散分布怎么选');

  const binomialHeading = findHeading(container, '二项分布');
  insertDiscreteWidgetOnce(container,'.discrete-teaching-widget[data-type="discreteparamguide"][data-mode="binomial"]',insertionAnchor(binomialHeading, '[data-binomial-note="true"]'),'discreteparamguide','二项分布参数含义：X ~ B(n, p)',{ mode: 'binomial' });

  const poissonHeading = findHeading(container, '泊松分布');
  insertDiscreteWidgetOnce(container,'.discrete-teaching-widget[data-type="discreteparamguide"][data-mode="poisson"]',insertionAnchor(poissonHeading, '[data-poisson-note="true"]'),'discreteparamguide','泊松分布参数含义：X ~ Poisson(λ)',{ mode: 'poisson' });

  const nbHeading = findHeading(container, '负二项分布');
  insertDiscreteWidgetOnce(container,'.discrete-teaching-widget[data-type="negativebinomialguide"]',insertionAnchor(nbHeading, '[data-nb-note="true"]'),'negativebinomialguide','负二项分布：处理过度离散计数资料');

  const rateHeading = Array.from(container.querySelectorAll('h3')).find(h => h.textContent.includes('样本率和总体率的比较'));
  if (rateHeading && !container.querySelector('.stat-calc[data-type="ratecompare"]')) {
    const widget = document.createElement('div'); widget.className = 'stat-calc'; widget.dataset.type = 'ratecompare'; widget.dataset.title = '率比较可视化：单样本率与两样本率'; rateHeading.insertAdjacentElement('afterend', widget);
  }

  const poissonRateHeading = Array.from(container.querySelectorAll('h3')).find(h => h.textContent.includes('样本均数和总体均数的比较'));
  if (poissonRateHeading && !container.querySelector('.stat-calc[data-type="poissonratecompare"]')) {
    const widget = document.createElement('div'); widget.className = 'stat-calc'; widget.dataset.type = 'poissonratecompare'; widget.dataset.title = '泊松事件率比较：单样本与两样本'; poissonRateHeading.insertAdjacentElement('afterend', widget);
  }
}

function insertChisqWidgetOnce(container, selector, anchor, type, title, attrs = {}) { if (container.querySelector(selector)) return; insertAfter(anchor, makeChisqViz(type, title, attrs)); }
function patchChisqWidgets(container) {
  const choiceHeading = findHeading(container, '不同类型卡方检验的选择') || container.querySelector('h1');
  insertChisqWidgetOnce(container,'.chisq-teaching-widget[data-type="chisqchoiceguide"]',insertionAnchor(choiceHeading, '[data-chisq-intro-note="true"]'),'chisqchoiceguide','卡方检验选择指南');
  const independentHeading = findHeading(container, '四格表资料的卡方检验');
  insertChisqWidgetOnce(container,'.chisq-teaching-widget[data-type="chisq2x2"]',insertionAnchor(independentHeading, '[data-chisq-2x2-note="true"]'),'chisq2x2','独立四格表：观察频数、理论频数与 χ² 贡献');
  const pairedHeading = findHeading(container, '配对四格表资料的卡方检验');
  insertChisqWidgetOnce(container,'.chisq-teaching-widget[data-type="mcnemarguide"]',insertionAnchor(pairedHeading, '[data-mcnemar-note="true"]'),'mcnemarguide','配对四格表：McNemar 检验只看不一致格子');
  const fisherHeading = findHeading(container, 'Fisher确切概率法');
  if (fisherHeading && !container.querySelector('[data-fisher-widget-note="true"]')) { const note = document.createElement('p'); note.dataset.fisherWidgetNote = 'true'; note.textContent = 'Fisher 确切概率法适合小样本 2×2 表。它不依赖大样本 χ² 近似，因此在理论频数过小或总例数较少时更稳健。'; fisherHeading.insertAdjacentElement('afterend', note); }
  const rcHeading = findHeading(container, '行 x 列表资料的卡方检验');
  insertChisqWidgetOnce(container,'.chisq-teaching-widget[data-type="chisqresidualheatmap"]',insertionAnchor(rcHeading, '[data-rc-chisq-note="true"]'),'chisqresidualheatmap','R×C 表：用标准化残差定位主要贡献格子');
}

function insertTrendWidgetOnce(container, selector, anchor, type, title, attrs = {}) { if (container.querySelector(selector)) return; insertAfter(anchor, makeTrendViz(type, title, attrs)); }
function patchCochranArmitageWidgets(container) {
  const chapterHeading = findHeading(container, 'Cochran-Armitage检验') || container.querySelector('h1');
  insertTrendWidgetOnce(container,'.trend-teaching-widget[data-type="trendchoiceguide"]',insertionAnchor(chapterHeading, '[data-ca-audit-scope-note="true"]'),'trendchoiceguide','趋势检验怎么选');
  const scatter = Array.from(container.querySelectorAll('.stat-viz[data-type="scatter"]')).find(el => (el.dataset.title || '').includes('Cochran-Armitage'));
  insertTrendWidgetOnce(container,'.trend-teaching-widget[data-type="ordinaltrendstructure"]',scatter || insertionAnchor(chapterHeading, '[data-ca-scatter-note="true"]'),'ordinaltrendstructure','Cochran-Armitage 数据结构：2×k 有序列联表');
  insertTrendWidgetOnce(container,'.trend-teaching-widget[data-type="cochrantrend"]',container.querySelector('.trend-teaching-widget[data-type="ordinaltrendstructure"]') || scatter || chapterHeading,'cochrantrend','Cochran-Armitage 趋势检验',{ labels: '50mg,100mg,200mg,300mg,500mg', successes: '87,119,133,177,167', totals: '1000,1000,1000,1000,1000', scores: '50,100,200,300,500' });
}

function insertNonparametricWidgetOnce(container, selector, anchor, type, title, attrs = {}) {
  if (container.querySelector(selector)) return;
  insertAfter(anchor, makeNonparametricViz(type, title, attrs));
}

function patchWilcoxonWidgets(container) {
  const chapterHeading = findHeading(container, '秩转换的非参数检验') || container.querySelector('h1');
  insertNonparametricWidgetOnce(container,'.nonparametric-teaching-widget[data-type="nonparametricchoiceguide"]',insertionAnchor(chapterHeading, '[data-wilcoxon-scope-note="true"]'),'nonparametricchoiceguide','非参数检验选择指南');

  const pairedHeading = findHeading(container, '配对样本比较的Wilcoxon符号秩检验');
  insertNonparametricWidgetOnce(container,'.nonparametric-teaching-widget[data-type="signedrankguide"]',insertionAnchor(pairedHeading, '[data-wilcoxon-paired-note="true"]'),'signedrankguide','Wilcoxon 符号秩检验：差值、绝对值排序和符号秩');

  const independentHeading = findHeading(container, '两独立样本比较的Wilcoxon秩和检验');
  insertNonparametricWidgetOnce(container,'.nonparametric-teaching-widget[data-type="ranksumguide"]',insertionAnchor(independentHeading, '[data-wilcoxon-independent-note="true"]'),'ranksumguide','Wilcoxon 秩和检验：两独立样本合并排序');

  const kwHeading = findHeading(container, '完全随机设计多个样本比较的 Kruskal-Wallis H 检验');
  insertNonparametricWidgetOnce(container,'.nonparametric-teaching-widget[data-type="kruskalwallisguide"]',insertionAnchor(kwHeading, '[data-kw-overview-note="true"]'),'kruskalwallisguide','Kruskal-Wallis H 检验：多组独立样本的秩比较');
}

function patchPlottingWidgets(container) {
  if (container.querySelector('.stat-viz[data-type="blandaltman"]')) return;
  const anchor = Array.from(container.querySelectorAll('h2, h3')).find(h => h.textContent.includes('散点图') || h.textContent.includes('点线图'));
  const note = document.createElement('p');
  note.innerHTML = '<strong>Bland-Altman 图</strong>用于评价两种测量方法的一致性：横轴为两种方法的均值，纵轴为两种方法的差值；重点观察平均差异和 95% 一致性限。它不用于替代配对 t 检验的前后差异检验。';
  const widget = document.createElement('div'); widget.className = 'stat-viz'; widget.dataset.type = 'blandaltman'; widget.dataset.title = 'Bland-Altman 一致性分析：两种测量方法比较'; widget.dataset.method1 = '110,118,120,125,130,128,140,138,145,150'; widget.dataset.method2 = '112,116,123,124,133,126,143,136,148,151'; widget.dataset.xlabel = '两种方法测量均值'; widget.dataset.ylabel = '差值（方法1 - 方法2）';
  if (anchor) { anchor.insertAdjacentElement('afterend', widget); anchor.insertAdjacentElement('afterend', note); } else { container.appendChild(note); container.appendChild(widget); }
}

function removeByType(container, selector) { container.querySelectorAll(selector).forEach(el => el.remove()); }

export const CHAPTER_WIDGET_PATCHES = {
  '1001-ttest.html': [patchTTestWidgets],
  '1002-anova.html': [patchAnovaWidgets],
  '1006-chisq.html': [patchChisqWidgets],
  '1009-cochranarmitage.html': [patchCochranArmitageWidgets],
  '1007-wilcoxon.html': [patchWilcoxonWidgets],
  'plotting.html': [patchPlottingWidgets],
  'discrete.html': [patchDiscreteWidgets],
  '1012-randomgroup.html': [container => removeByType(container, '.stat-viz[data-type="samplesizecalc"]')],
  '1038-p4trend.html': [container => removeByType(container, '.stat-viz[data-type="subgroupforest"]')],
  '1039-nonlinear.html': [container => removeByType(container, '.stat-viz[data-type="dose"]')]
};
