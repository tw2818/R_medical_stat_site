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

function removeByType(container, selector) {
  container.querySelectorAll(selector).forEach(el => el.remove());
}

export const CHAPTER_WIDGET_PATCHES = {
  '1001-ttest.html': [patchTTestWidgets],
  'discrete.html': [patchDiscreteWidgets],
  '1012-randomgroup.html': [container => removeByType(container, '.stat-viz[data-type="samplesizecalc"]')],
  '1038-p4trend.html': [container => removeByType(container, '.stat-viz[data-type="subgroupforest"]')],
  '1039-nonlinear.html': [container => removeByType(container, '.stat-viz[data-type="dose"]')]
};
