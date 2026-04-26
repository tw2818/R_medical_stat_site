function patchTTestText(container) {
  const introPs = Array.from(container.querySelectorAll('p'));
  const introLead = introPs.find(p => p.textContent.includes('t检验主要适用于1组或2组的均数的比较'));
  if (introLead) {
    introLead.textContent = 't 检验用于比较一组均数、配对差值均数或两组均数。本章对应三种常见场景：单样本 t 检验、配对样本 t 检验和两独立样本 t 检验。经典 t 检验要求资料为定量资料，样本来自近似正态总体；两独立样本 t 检验还通常要求方差齐。若两组方差不齐，可使用 Welch t 检验。这里不展开推导，重点说明如何在 R 中完成常见 t 检验并解释输出。';
  }

  const introExplore = introPs.find(p => p.textContent.trim() === '正态性检验与分布探索：');
  if (introExplore) {
    introExplore.textContent = '先用图形直观感受正态分布、t 分布和 P 值的含义：';
  }

  const introFunc = introPs.find(p => p.textContent.includes('在R中进行t检验非常简单，就是'));
  if (introFunc) {
    introFunc.textContent = '在 R 中进行 t 检验，核心函数是 t.test()。单样本、配对样本和两样本 t 检验都可以通过这个函数完成，关键是根据研究设计正确设置参数。';
  }

  const oneSampleResult = introPs.find(p => p.textContent.includes('结果显示t=-2.1367'));
  if (oneSampleResult) {
    oneSampleResult.textContent = '结果显示 t = -2.1367，df = 35，P = 0.03969，和课本一致。这里 t 值为负，表示样本均数低于假设总体均数；P < 0.05，提示差异有统计学意义。下面两个组件分别用于直观看 P 值所在位置，以及自己动手改参数体会 t 检验结果如何变化。';
  }

  const pairedData = introPs.find(p => p.textContent.includes('数据一共3列10行，第1列是样本编号'));
  if (pairedData) {
    pairedData.textContent = '数据一共 3 列 10 行：第 1 列是样本编号，第 2 列和第 3 列分别是配对比较的两次测量值。配对 t 检验的分析单位不是两列原始值本身，而是每一对的差值。';
  }

  const pairedConclusion = introPs.find(p => p.textContent.includes('t.test第1个数据是用药前，第2个数据是用药后'));
  if (pairedConclusion) {
    pairedConclusion.textContent = '在 t.test() 中，第 1 个向量是用药前，第 2 个向量是用药后，paired = TRUE 表示按配对资料处理。此时 R 实际检验的是每一对差值的均数是否为 0，而不是检验用药前和用药后两列数据是否相关。';
  }

  const blandAltmanLead = introPs.find(p =>
    p.textContent.includes('Bland-Altman') &&
    p.textContent.includes('一致性')
  );
  if (blandAltmanLead) {
    blandAltmanLead.remove();
  }

  const twoSampleRead = introPs.find(p => p.textContent.trim() === '首先是读取数据.');
  if (twoSampleRead) {
    twoSampleRead.textContent = '首先读取数据。';
  }

  const twoSampleData = introPs.find(p => p.textContent.includes('这是两组数据，一组是患者组，一组是对照组'));
  if (twoSampleData) {
    twoSampleData.textContent = '这是两组相互独立的数据，一组是患者组，一组是对照组。两独立样本 t 检验比较的是两组总体均数是否不同，不能把两组观测值强行配对。';
  }

  const twoSampleVarEqual = introPs.find(p => p.textContent.includes('直接进行方差齐性的两样本t检验'));
  if (twoSampleVarEqual) {
    twoSampleVarEqual.textContent = '若根据研究设计和方差齐性判断采用等方差两样本 t 检验，可设置 var.equal = TRUE；若不假定方差齐，R 默认使用 Welch t 检验。';
  }

  const normalityIntro = introPs.find(p => p.textContent.includes('这个内容在之前介绍过'));
  if (normalityIntro) {
    normalityIntro.textContent = 't 检验要求资料近似来自正态总体。实际分析中可结合直方图、Q-Q 图和 Shapiro-Wilk 检验判断正态性；样本量较小时尤其需要重视分布形态和异常值。';
  }

  const varianceIntro = introPs.find(p => p.textContent.includes('这个主要是适用于两样本t检验'));
  if (varianceIntro) {
    varianceIntro.textContent = '方差齐性主要影响两独立样本 t 检验。若两组方差差异明显，应优先考虑 Welch t 检验，或在报告中明确说明采用了不等方差校正。';
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

  const firstHeading = Array.from(container.querySelectorAll('h1, h2')).find(h => h.textContent.includes('多样本均数比较的方差分析'));
  if (firstHeading && !container.querySelector('[data-anova-intro-note="true"]')) {
    const note = document.createElement('p');
    note.dataset.anovaIntroNote = 'true';
    note.innerHTML = '方差分析用于比较三个及以上总体均数。它的基本思路不是反复做两两 t 检验，而是先进行总体 F 检验：把总变异分解为处理因素解释的组间变异和随机误差造成的组内变异。若总体检验提示多组均数不全相等，再根据研究目的选择合适的多重比较方法。';
    firstHeading.insertAdjacentElement('afterend', note);
  }

  const completelyRandomHeading = Array.from(container.querySelectorAll('h2')).find(h => h.textContent.includes('完全随机设计资料的方差分析'));
  if (completelyRandomHeading && !container.querySelector('[data-crd-note="true"]')) {
    const note = document.createElement('p');
    note.dataset.crdNote = 'true';
    note.textContent = '完全随机设计只考虑一个主要处理因素，适用于多个相互独立处理组的均数比较。分析重点是判断处理组之间的均数差异是否明显大于组内随机波动。';
    completelyRandomHeading.insertAdjacentElement('afterend', note);
  }

  const blockHeading = Array.from(container.querySelectorAll('h2')).find(h => h.textContent.includes('随机区组设计资料的方差分析'));
  if (blockHeading && !container.querySelector('[data-block-note="true"]')) {
    const note = document.createElement('p');
    note.dataset.blockNote = 'true';
    note.textContent = '随机区组设计的目的，是在比较处理效应的同时控制区组间差异。区组可以是受试对象、批次、中心、时间段等已知会影响结果的因素。';
    blockHeading.insertAdjacentElement('afterend', note);
  }

  const latinHeading = Array.from(container.querySelectorAll('h2')).find(h => h.textContent.includes('拉丁方设计方差分析'));
  if (latinHeading && !container.querySelector('[data-latin-note="true"]')) {
    const note = document.createElement('p');
    note.dataset.latinNote = 'true';
    note.textContent = '拉丁方设计用于同时控制两个方向的干扰因素，例如行因素和列因素。每种处理在每一行、每一列各出现一次，从而把行效应、列效应和处理效应分开估计。';
    latinHeading.insertAdjacentElement('afterend', note);
  }

  const crossoverHeading = Array.from(container.querySelectorAll('h2')).find(h => h.textContent.includes('两阶段交叉设计资料方差分析'));
  if (crossoverHeading && !container.querySelector('[data-crossover-note="true"]')) {
    const note = document.createElement('p');
    note.dataset.crossoverNote = 'true';
    note.textContent = '两阶段交叉设计通常让同一受试者在不同阶段接受不同处理。分析时需要区分处理效应、阶段效应和受试者个体差异；若存在残留效应，处理效应解释要更谨慎。';
    crossoverHeading.insertAdjacentElement('afterend', note);
  }

  const multiCompareHeading = Array.from(container.querySelectorAll('h2')).find(h => h.textContent.includes('多个样本均数间的多重比较'));
  if (multiCompareHeading && !container.querySelector('[data-multiple-note="true"]')) {
    const note = document.createElement('p');
    note.dataset.multipleNote = 'true';
    note.textContent = '多重比较回答的是“具体哪些组不同”。通常先完成总体 ANOVA，再根据比较目的选择方法：所有组两两比较、多个实验组与同一对照组比较，或按均数排序进行分层比较。';
    multiCompareHeading.insertAdjacentElement('afterend', note);
  }

  const crossoverHint = anovaPs.find(p => p.textContent.includes('进行两阶段交叉设计资料方差分析：'));
  if (crossoverHint) {
    crossoverHint.textContent = '进行两阶段交叉设计资料方差分析：这里的 phase 表示阶段效应，type 表示处理（药物）效应，testid 用来控制受试对象之间的个体差异。';
  }

  const snkNote = anovaPs.find(p => p.textContent.includes('结果和课本不一样，试了多种方法，q值全都不一样。'));
  if (snkNote) {
    snkNote.textContent = '结果和课本不完全一样。这里更适合把它理解为 R 中 SNK-q 检验的一种实现演示：不同软件、算法细节或分步规则可能导致 q 值略有差异；若需要逐项与教材完全核对，应以教材所采用的方法或软件输出为准。';
  }
}

function addNoteAfterHeading(container, headingText, selector, text) {
  const heading = Array.from(container.querySelectorAll('h1, h2, h3')).find(h => h.textContent.includes(headingText));
  if (!heading || container.querySelector(selector)) return;
  const note = document.createElement('p');
  const dataName = selector.match(/data-([^=]+)=/)?.[1];
  if (dataName) note.dataset[dataName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = 'true';
  note.textContent = text;
  heading.insertAdjacentElement('afterend', note);
}

function patchDiscreteText(container) {
  const discretePs = Array.from(container.querySelectorAll('p'));

  addNoteAfterHeading(
    container,
    '几种离散型变量的分布及其应用',
    '[data-discrete-intro-note="true"]',
    '本章讨论离散型资料的常见分布。固定样本量中的阳性数通常对应二项分布；固定观察时间、面积或人年中的事件数通常对应泊松分布；当计数资料的方差明显大于均数时，需要考虑负二项分布。'
  );

  addNoteAfterHeading(
    container,
    '二项分布',
    '[data-binomial-note="true"]',
    '二项分布适用于固定试验次数 n 下的成功次数 X，例如阳性人数、治愈人数或某结局发生人数。它的核心参数是总体率 p。'
  );

  addNoteAfterHeading(
    container,
    '样本率和总体率的比较',
    '[data-ratecompare-note="true"]',
    '下方组件可切换单样本率比较和两样本率比较；3.1.2 关注样本率与给定总体率的比较，3.1.3 关注两个独立样本率之间的比较。'
  );

  addNoteAfterHeading(
    container,
    '泊松分布',
    '[data-poisson-note="true"]',
    '泊松分布适用于固定观察量内的事件次数。这里的“均数”通常指单位观察量下的期望事件数或事件率参数，不是 t 检验、方差分析中的连续变量均数。'
  );

  addNoteAfterHeading(
    container,
    '样本均数和总体均数的比较',
    '[data-poissonrate-note="true"]',
    '泊松资料的比较应注意观察量或暴露量。下方组件比较的是标准化后的事件率，既可用于单样本事件率与参考值比较，也可用于两样本事件率比较。'
  );

  addNoteAfterHeading(
    container,
    '负二项分布',
    '[data-nb-note="true"]',
    '负二项分布主要用于过度离散的计数资料。若计数资料的方差明显大于均数，泊松分布的“均数 = 方差”假设可能过强。'
  );

  const poissonApprox = discretePs.find(p => p.textContent.includes('例6-11。正态近似法。直接根据公式（6-18）计算。'));
  if (poissonApprox && !container.querySelector('[data-poisson-approx-fix="true"]')) {
    const note = document.createElement('p');
    note.dataset.poissonApproxFix = 'true';
    note.textContent = '按正态近似法，99%可信区间应写为 68 ± 2.58×√68；也就是下限用减号、上限用加号。这里保留思路说明，但不再用错误的重复下界表达。';
    note.style.color = '#555';
    note.style.fontSize = '0.95em';
    poissonApprox.insertAdjacentElement('afterend', note);
  }

  const nbHeading = Array.from(container.querySelectorAll('h2')).find(h => h.textContent.includes('负二项分布'));
  if (nbHeading) {
    const existing = Array.from(container.querySelectorAll('p')).find(p => p.textContent.includes('本站当前未提供负二项分布专用组件'));
    if (!existing) {
      const note = document.createElement('p');
      note.textContent = '本站当前未提供负二项分布的完整推断计算组件，因此不再用泊松分布图替代展示，以免把两种分布混为一谈。';
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
