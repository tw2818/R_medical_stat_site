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

function patchAnovaWidgets(container) {
  if (container.querySelector('.anova-teaching-widget')) return;

  const completelyRandomHeading = findHeading(container, '完全随机设计资料的方差分析');
  if (completelyRandomHeading) {
    insertAfter(
      completelyRandomHeading,
      makeViz('anovadecomp', 'ANOVA 核心逻辑：总变异 = 组间变异 + 组内变异'),
      makeViz('anovadesign', '完全随机设计结构示意', { design: 'crd' })
    );
  }

  const blockHeading = findHeading(container, '随机区组设计资料的方差分析');
  if (blockHeading) {
    insertAfter(blockHeading, makeViz('anovadesign', '随机区组设计结构示意', { design: 'block' }));
  }

  const latinHeading = findHeading(container, '拉丁方设计方差分析');
  if (latinHeading) {
    insertAfter(latinHeading, makeViz('anovadesign', '拉丁方设计结构示意', { design: 'latin' }));
  }

  const crossoverHeading = findHeading(container, '两阶段交叉设计资料方差分析');
  if (crossoverHeading) {
    insertAfter(crossoverHeading, makeViz('anovadesign', '两阶段交叉设计结构示意', { design: 'crossover' }));
  }

  const multipleCompareHeading = findHeading(container, '多个样本均数间的多重比较');
  if (multipleCompareHeading) {
    insertAfter(multipleCompareHeading, makeViz('multiplecompareguide', '多重比较选择指南'));
  }
}

function patchDiscreteWidgets(container) {
  const rateHeading = Array.from(container.querySelectorAll('h3')).find(h => h.textContent.includes('样本率和总体率的比较'));
  if (rateHeading && !container.querySelector('.stat-calc[data-type="ratecompare"]')) {
    const widget = document.createElement('div');
    widget.className = 'stat-calc';
    widget.dataset.type = 'ratecompare';
    widget.dataset.title = '率比较可视化';
    rateHeading.insertAdjacentElement('afterend', widget);
  }

  const poissonRateHeading = Array.from(container.querySelectorAll('h3')).find(h => h.textContent.includes('样本均数和总体均数的比较'));
  if (poissonRateHeading && !container.querySelector('.stat-calc[data-type="poissonratecompare"]')) {
    const widget = document.createElement('div');
    widget.className = 'stat-calc';
    widget.dataset.type = 'poissonratecompare';
    widget.dataset.title = '泊松事件率比较';
    poissonRateHeading.insertAdjacentElement('afterend', widget);
  }

  const nbViz = container.querySelector('h2#负二项分布略 + .stat-viz[data-type="poisson"]');
  if (nbViz) nbViz.remove();
}

function patchPlottingWidgets(container) {
  if (container.querySelector('.stat-viz[data-type="blandaltman"]')) return;

  const anchor = Array.from(container.querySelectorAll('h2, h3')).find(h =>
    h.textContent.includes('散点图') || h.textContent.includes('点线图')
  );

  const note = document.createElement('p');
  note.innerHTML = '<strong>Bland-Altman 图</strong>用于评价两种测量方法的一致性：横轴为两种方法的均值，纵轴为两种方法的差值；重点观察平均差异和 95% 一致性限。它不用于替代配对 t 检验的前后差异检验。';

  const widget = document.createElement('div');
  widget.className = 'stat-viz';
  widget.dataset.type = 'blandaltman';
  widget.dataset.title = 'Bland-Altman 一致性分析：两种测量方法比较';
  widget.dataset.method1 = '110,118,120,125,130,128,140,138,145,150';
  widget.dataset.method2 = '112,116,123,124,133,126,143,136,148,151';
  widget.dataset.xlabel = '两种方法测量均值';
  widget.dataset.ylabel = '差值（方法1 - 方法2）';

  if (anchor) {
    anchor.insertAdjacentElement('afterend', widget);
    anchor.insertAdjacentElement('afterend', note);
  } else {
    container.appendChild(note);
    container.appendChild(widget);
  }
}

function removeByType(container, selector) {
  container.querySelectorAll(selector).forEach(el => el.remove());
}

export const CHAPTER_WIDGET_PATCHES = {
  '1001-ttest.html': [patchTTestWidgets],
  '1002-anova.html': [patchAnovaWidgets],
  'plotting.html': [patchPlottingWidgets],
  'discrete.html': [patchDiscreteWidgets],
  '1012-randomgroup.html': [container => removeByType(container, '.stat-viz[data-type="samplesizecalc"]')],
  '1038-p4trend.html': [container => removeByType(container, '.stat-viz[data-type="subgroupforest"]')],
  '1039-nonlinear.html': [container => removeByType(container, '.stat-viz[data-type="dose"]')]
};
