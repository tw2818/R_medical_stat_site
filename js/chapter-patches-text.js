function patchTTestText(container) {
  const introPs = Array.from(container.querySelectorAll('p'));
  const introLead = introPs.find(p => p.textContent.includes('t检验主要适用于1组或2组的均数的比较'));
  if (introLead) {
    introLead.textContent = 't检验用于比较一组均数、配对差值均数或两组均数。经典两样本 t 检验通常要求数据近似正态且方差齐；若两组方差不齐，可使用 Welch t 检验。这里不展开推导，只聚焦如何用 R 完成常见 t 检验。';
  }

  const introExplore = introPs.find(p => p.textContent.trim() === '正态性检验与分布探索：');
  if (introExplore) {
    introExplore.textContent = '先用图形直观感受正态分布和样本分布：';
  }

  const introFunc = introPs.find(p => p.textContent.includes('在R中进行t检验非常简单，就是'));
  if (introFunc) {
    introFunc.textContent = '在 R 中进行 t 检验非常简单，核心函数就是 t.test()。单样本、配对样本和两样本 t 检验都可以通过这个函数完成。';
  }

  const oneSampleResult = introPs.find(p => p.textContent.includes('结果显示t=-2.1367'));
  if (oneSampleResult) {
    oneSampleResult.textContent = '结果显示 t = -2.1367，df = 35，P = 0.03969，和课本一致。下面两个组件分别用于直观看 P 值所在位置，以及自己动手改参数体会 t 检验结果如何变化。';
  }

  const pairedData = introPs.find(p => p.textContent.includes('数据一共3列10行，第1列是样本编号'));
  if (pairedData) {
    pairedData.textContent = '数据一共 3 列 10 行：第 1 列是样本编号，第 2 列和第 3 列分别是配对比较的两次测量值。';
  }

  const twoSampleRead = introPs.find(p => p.textContent.trim() === '首先是读取数据.');
  if (twoSampleRead) {
    twoSampleRead.textContent = '首先读取数据。';
  }

  const h14 = container.querySelector('h2#正态性检验和两样本方差比较的f检验');
  if (h14) {
    h14.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) node.textContent = '\u00A0 正态性检验与方差齐性检验';
    });
    const chapterTitle = h14.querySelector('.header-section-number');
    if (chapterTitle && chapterTitle.nextSibling) {
      chapterTitle.nextSibling.textContent = '\u00A0 正态性检验与方差齐性检验';
    }
  }

  const toc14 = container.querySelector('a[href="#正态性检验和两样本方差比较的f检验"]');
  if (toc14) {
    toc14.innerHTML = '<span class="header-section-number">1.4</span> 正态性检验与方差齐性检验';
  }
}

function patchAnovaText(container) {
  const anovaPs = Array.from(container.querySelectorAll('p'));

  const crossoverHint = anovaPs.find(p => p.textContent.includes('进行两阶段交叉设计资料方差分析：'));
  if (crossoverHint) {
    crossoverHint.textContent = '进行两阶段交叉设计资料方差分析：这里的 phase 表示阶段效应，type 表示处理（药物）效应，testid 用来控制受试对象之间的个体差异。';
  }

  const snkNote = anovaPs.find(p => p.textContent.includes('结果和课本不一样，试了多种方法，q值全都不一样。'));
  if (snkNote) {
    snkNote.textContent = '结果和课本不完全一样。这里更适合把它理解为 R 中 SNK-q 检验的一种实现演示：不同软件、算法细节或分步规则可能导致 q 值略有差异；若需要逐项与教材完全核对，应以教材所采用的方法或软件输出为准。';
  }
}

function patchDiscreteText(container) {
  const discretePs = Array.from(container.querySelectorAll('p'));
  const poissonApprox = discretePs.find(p => p.textContent.includes('例6-11。正态近似法。直接根据公式（6-18）计算。'));
  if (poissonApprox) {
    const note = document.createElement('p');
    note.textContent = '按正态近似法，99%可信区间应写为 68 ± 2.58×√68；也就是下限用减号、上限用加号。这里保留思路说明，但不再用错误的重复下界表达。';
    note.style.color = '#555';
    note.style.fontSize = '0.95em';
    poissonApprox.insertAdjacentElement('afterend', note);
  }

  const nbHeading = container.querySelector('h2#负二项分布略');
  if (nbHeading && !nbHeading.nextElementSibling) {
    const note = document.createElement('p');
    note.textContent = '本节暂略。本站当前未提供负二项分布专用组件，因此不再用泊松分布图替代展示，以免把两种分布混为一谈。';
    note.style.color = '#555';
    note.style.fontSize = '0.95em';
    nbHeading.insertAdjacentElement('afterend', note);
  } else if (nbHeading) {
    const existing = Array.from(container.querySelectorAll('p')).find(p => p.textContent.includes('本站当前未提供负二项分布专用组件'));
    if (!existing) {
      const note = document.createElement('p');
      note.textContent = '本节暂略。本站当前未提供负二项分布专用组件，因此不再用泊松分布图替代展示，以免把两种分布混为一谈。';
      note.style.color = '#555';
      note.style.fontSize = '0.95em';
      nbHeading.insertAdjacentElement('afterend', note);
    }
  }
}

export const CHAPTER_TEXT_PATCHES = {
  '1001-ttest.html': [patchTTestText],
  '1002-anova.html': [patchAnovaText],
  'discrete.html': [patchDiscreteText]
};
