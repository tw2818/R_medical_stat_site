function findHeading(container, text, selector = 'h1, h2, h3') {
  return Array.from(container.querySelectorAll(selector)).find(h => h.textContent.includes(text));
}

function addNoteAfterHeading(container, headingText, selector, text, headingSelector = 'h1, h2, h3') {
  const heading = findHeading(container, headingText, headingSelector);
  if (!heading || container.querySelector(selector)) return;
  const note = document.createElement('p');
  const dataName = selector.match(/data-([^=]+)=/)?.[1];
  if (dataName) note.dataset[dataName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = 'true';
  note.textContent = text;
  heading.insertAdjacentElement('afterend', note);
}

function renameHeadingAndToc(container, headingSelector, oldText, number, newText, tocHref) {
  const heading = Array.from(container.querySelectorAll(headingSelector)).find(h => h.textContent.includes(oldText));
  if (heading && !heading.dataset.ch4Renamed) {
    const num = heading.querySelector('.header-section-number')?.outerHTML || `<span class="header-section-number">${number}</span>`;
    heading.innerHTML = `${num} ${newText}`;
    heading.dataset.ch4Renamed = 'true';
  }
  const toc = container.querySelector(`a[href="${tocHref}"]`);
  if (toc) toc.innerHTML = `<span class="header-section-number">${number}</span> ${newText}`;
}

function patchChisqTextAudit(container) {
  addNoteAfterHeading(
    container,
    '卡方检验',
    '[data-chisq-audit-scope-note="true"]',
    '卡方检验处理的是频数资料，而不是均数资料。实际分析时应使用每个类别中的例数；如果手里只有百分比，应尽量回到分子和分母，否则无法正确计算理论频数和检验统计量。',
    'h1'
  );

  addNoteAfterHeading(
    container,
    '不同类型卡方检验的选择',
    '[data-chisq-audit-decision-note="true"]',
    '本章的选择顺序可以压缩为三步：先判断是否配对；再判断是 2×2 表还是 R×C 表；最后检查理论频数是否过小。只有独立样本且理论频数条件合适时，Pearson χ² 近似才是默认选择。'
  );

  addNoteAfterHeading(
    container,
    '四格表资料的卡方检验',
    '[data-chisq-audit-yates-note="true"]',
    'R 的 chisq.test() 在 2×2 表中默认使用连续性校正，即 correct = TRUE。若要得到未校正的 Pearson χ²，需要显式设置 correct = FALSE；报告结果时应说明是否使用了连续性校正。'
  );

  renameHeadingAndToc(container, 'h3', '方法1', '4.2.1', '方法1：直接输入四格表频数', '#方法1');
  addNoteAfterHeading(
    container,
    '方法1：直接输入四格表频数',
    '[data-chisq-audit-method1-note="true"]',
    '这种写法适合资料已经整理成列联表的场景，例如论文表格中已经给出每组阳性/阴性例数。注意矩阵的行列方向会影响率的解释，但不会改变 χ² 统计量本身。',
    'h3'
  );

  renameHeadingAndToc(container, 'h3', '方法2', '4.2.2', '方法2：由原始分类变量生成列联表', '#方法2');
  addNoteAfterHeading(
    container,
    '方法2：由原始分类变量生成列联表',
    '[data-chisq-audit-method2-note="true"]',
    '这种写法适合每一行代表一个研究对象的原始数据。应先用 table() 检查分组变量和结局变量的交叉频数，再把列联表交给 chisq.test() 或 fisher.test()。',
    'h3'
  );

  addNoteAfterHeading(
    container,
    '配对四格表资料的卡方检验',
    '[data-chisq-audit-paired-note="true"]',
    '配对四格表不能当作两个独立样本率比较。行和列通常代表同一对象的两次分类结果或两种检测方法，检验信息主要来自不一致对子 b 和 c；一致对子只参与描述一致情况。'
  );

  addNoteAfterHeading(
    container,
    '四格表资料的Fisher确切概率法',
    '[data-chisq-audit-fisher-note="true"]',
    'Fisher 确切概率法给出的是在固定边际合计条件下的精确 P 值。样本量很小、理论频数过低或出现 0 格时，Fisher 法通常比大样本 χ² 近似更稳健；但它仍要求资料结构是独立样本四格表。'
  );

  addNoteAfterHeading(
    container,
    '行 x 列表资料的卡方检验',
    '[data-chisq-audit-rc-note="true"]',
    'R×C 表的 χ² 检验是总体检验。若行或列存在天然顺序，它不等同于趋势检验；若研究问题是率随等级递增或递减的趋势，应考虑下一章的 Cochran-Armitage 趋势检验。'
  );
}

export const CHAPTER_TEXT_EXTRA_PATCHES = {
  '1006-chisq.html': [patchChisqTextAudit]
};
