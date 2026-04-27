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
  addNoteAfterHeading(container,'卡方检验','[data-chisq-audit-scope-note="true"]','卡方检验处理的是频数资料，而不是均数资料。实际分析时应使用每个类别中的例数；如果手里只有百分比，应尽量回到分子和分母，否则无法正确计算理论频数和检验统计量。','h1');
  addNoteAfterHeading(container,'不同类型卡方检验的选择','[data-chisq-audit-decision-note="true"]','本章的选择顺序可以压缩为三步：先判断是否配对；再判断是 2×2 表还是 R×C 表；最后检查理论频数是否过小。只有独立样本且理论频数条件合适时，Pearson χ² 近似才是默认选择。');
  addNoteAfterHeading(container,'四格表资料的卡方检验','[data-chisq-audit-yates-note="true"]','R 的 chisq.test() 在 2×2 表中默认使用连续性校正，即 correct = TRUE。若要得到未校正的 Pearson χ²，需要显式设置 correct = FALSE；报告结果时应说明是否使用了连续性校正。');
  renameHeadingAndToc(container, 'h3', '方法1', '4.2.1', '方法1：直接输入四格表频数', '#方法1');
  addNoteAfterHeading(container,'方法1：直接输入四格表频数','[data-chisq-audit-method1-note="true"]','这种写法适合资料已经整理成列联表的场景，例如论文表格中已经给出每组阳性/阴性例数。注意矩阵的行列方向会影响率的解释，但不会改变 χ² 统计量本身。','h3');
  renameHeadingAndToc(container, 'h3', '方法2', '4.2.2', '方法2：由原始分类变量生成列联表', '#方法2');
  addNoteAfterHeading(container,'方法2：由原始分类变量生成列联表','[data-chisq-audit-method2-note="true"]','这种写法适合每一行代表一个研究对象的原始数据。应先用 table() 检查分组变量和结局变量的交叉频数，再把列联表交给 chisq.test() 或 fisher.test()。','h3');
  addNoteAfterHeading(container,'配对四格表资料的卡方检验','[data-chisq-audit-paired-note="true"]','配对四格表不能当作两个独立样本率比较。行和列通常代表同一对象的两次分类结果或两种检测方法，检验信息主要来自不一致对子 b 和 c；一致对子只参与描述一致情况。');
  addNoteAfterHeading(container,'四格表资料的Fisher确切概率法','[data-chisq-audit-fisher-note="true"]','Fisher 确切概率法给出的是在固定边际合计条件下的精确 P 值。样本量很小、理论频数过低或出现 0 格时，Fisher 法通常比大样本 χ² 近似更稳健；但它仍要求资料结构是独立样本四格表。');
  addNoteAfterHeading(container,'行 x 列表资料的卡方检验','[data-chisq-audit-rc-note="true"]','R×C 表的 χ² 检验是总体检验。若行或列存在天然顺序，它不等同于趋势检验；若研究问题是率随等级递增或递减的趋势，应考虑下一章的 Cochran-Armitage 趋势检验。');
}

function patchCochranArmitageText(container) {
  addNoteAfterHeading(container,'Cochran-Armitage检验','[data-ca-audit-scope-note="true"]','Cochran-Armitage 趋势检验用于 2×k 有序列联表：行通常是二分类结局，列是有序分组。它检验结局发生率是否随有序分组呈线性上升或下降趋势。若分组本身无序，应使用普通 R×C 卡方检验，而不是趋势检验。','h1');
  const firstParagraph = Array.from(container.querySelectorAll('p')).find(p => p.textContent.includes('Cochran Armitage') && p.textContent.includes('线性趋势检验'));
  if (firstParagraph && !firstParagraph.dataset.caPolished) { firstParagraph.textContent = 'Cochran-Armitage 检验是一种针对有序列联表的线性趋势检验。它常用于自变量为有序分类变量、因变量为二分类变量的资料，用来判断结局率是否随等级升高而呈线性上升或下降趋势。'; firstParagraph.dataset.caPolished = 'true'; }
  const cmhParagraph = Array.from(container.querySelectorAll('p')).find(p => p.textContent.includes('注意和') && p.textContent.includes('Cochran-Mantel-Haenszel'));
  if (cmhParagraph && !container.querySelector('[data-ca-cmh-note="true"]')) { const note = document.createElement('p'); note.dataset.caCmhNote = 'true'; note.textContent = '需要区分：Cochran-Armitage 检验关注一个有序因素下的率趋势；Cochran-Mantel-Haenszel 检验关注控制分层因素后的两个分类变量关联。前者强调“有序趋势”，后者强调“分层控制混杂”。'; cmhParagraph.insertAdjacentElement('afterend', note); }
  const scatter = Array.from(container.querySelectorAll('.stat-viz[data-type="scatter"]')).find(el => (el.dataset.title || '').includes('Cochran-Armitage'));
  if (scatter && !container.querySelector('[data-ca-scatter-note="true"]')) { const note = document.createElement('p'); note.dataset.caScatterNote = 'true'; note.textContent = '散点图只能帮助形成趋势直觉；正式的 Cochran-Armitage 检验使用的是每个等级中的阳性数、总数和有序 score，而不是只对百分比做普通线性回归。'; scatter.insertAdjacentElement('afterend', note); }
  addNoteAfterHeading(container,'Cochran-Armitage检验','[data-ca-score-note="true"]','score 的设定会影响检验统计量。等距等级常用 1,2,3,...；若等级对应真实剂量或暴露量，也可使用实际数值。score 应由研究设计或临床意义预先确定。','h1');
}

function patchWilcoxonText(container) {
  addNoteAfterHeading(container,'秩转换的非参数检验','[data-wilcoxon-scope-note="true"]','本章讨论基于秩的非参数检验。它们常用于偏态分布、等级资料或样本量较小且正态性难以满足的场景；但“非参数”不代表没有设计要求，配对资料、两独立样本和多独立样本必须分别选择不同方法。','h1');
  addNoteAfterHeading(container,'配对样本比较的Wilcoxon符号秩检验','[data-wilcoxon-paired-note="true"]','配对 Wilcoxon 符号秩检验的分析单位是每一对的差值，而不是两列原始值本身。计算时先去掉差值为 0 的对子，再对非零差值的绝对值排序，最后加回正负号。');
  addNoteAfterHeading(container,'两独立样本比较的Wilcoxon秩和检验','[data-wilcoxon-independent-note="true"]','两独立样本 Wilcoxon 秩和检验也称 Mann-Whitney U 检验。它把两组观测值合并排序，再比较两组秩和；解释重点通常是分布位置差异，不是直接比较均数。');
  addNoteAfterHeading(container,'完全随机设计多个样本比较的 Kruskal-Wallis H 检验','[data-kw-overview-note="true"]','Kruskal-Wallis H 检验可视为两独立样本秩和检验向多个独立组的扩展。总体检验显著只能说明多组分布位置不全相同，不能直接指出哪两组不同。');
  addNoteAfterHeading(container,'kruskal-Wallis H检验后的多重比较','[data-kw-posthoc-note="true"]','Kruskal-Wallis H 检验后若需要判断具体哪些组不同，应进行事后多重比较，并对多个 P 值进行校正，例如 Dunn 检验或 pairwise Wilcoxon 检验结合 Holm、Bonferroni、BH 等校正。');
}

function patchRegressionCorrelationText(container) {
  addNoteAfterHeading(container,'双变量回归与相关','[data-regcor-scope-note="true"]','本章讨论两个变量之间的关系。直线回归强调用自变量 X 解释或预测因变量 Y；相关分析强调两个变量关联的方向和强度。无论回归还是相关，统计关联都不自动等于因果关系，解释时应考虑研究设计、混杂和非线性。','h1');
  addNoteAfterHeading(container,'直线回归','[data-regcor-regression-note="true"]','直线回归需要区分自变量 X 和因变量 Y。斜率表示 X 每增加 1 个单位时 Y 的平均变化量；截距表示 X=0 时的预测值，只有当 X=0 有实际意义时才适合直接解释。');
  addNoteAfterHeading(container,'直线相关','[data-regcor-correlation-note="true"]','Pearson 相关系数 r 描述两个连续变量的线性关联方向和强度，取值范围为 -1 到 1。r 接近 0 只说明线性关联弱，不排除存在非线性关系。');
  addNoteAfterHeading(container,'秩相关','[data-regcor-spearman-note="true"]','Spearman 秩相关先把原始数值转换为秩，再计算秩之间的相关。它更关注单调关系，适合等级资料、明显偏态资料或存在异常值影响时。');
  addNoteAfterHeading(container,'两条回归直线的比较','[data-regcor-slope-note="true"]','比较两条回归直线时，首先应判断两组斜率是否不同。在线性模型中可使用交互项 y ~ x * group；若交互项显著，说明两组斜率不同，不宜简单合并为一条直线。');
  addNoteAfterHeading(container,'曲线拟合','[data-regcor-curve-note="true"]','曲线拟合用于描述或预测非线性关系。模型越复杂越容易贴合当前样本，但也更容易过拟合；不要把观测范围内的好拟合外推到数据范围之外。');
}

function patchTable3Text(container) {
  addNoteAfterHeading(container,'三线表绘制','[data-table3-scope-note="true"]','本章重点不是重新学习统计检验，而是把已有统计描述和检验结果整理成规范的论文表格。三线表应同时满足：变量命名清楚、单位完整、统计量格式一致、P 值方法可追溯、脚注能解释缩写和缺失值。','h1');
  addNoteAfterHeading(container,'数据简介','[data-table3-data-note="true"]','制作 Table 1 前应先明确每个变量的类型：连续变量、分类变量、有序变量或日期/时间变量。不同变量类型对应不同统计描述和检验方法，不能统一套用同一种格式。');
  addNoteAfterHeading(container,'详细介绍','[data-table3-detail-note="true"]','三线表一般只保留顶线、表头下横线和底线，避免过多竖线和网格线。更重要的是表格内容要可复现：每个数值都应能追溯到原始数据、汇总规则和统计方法。');
}

export const CHAPTER_TEXT_EXTRA_PATCHES = {
  '1006-chisq.html': [patchChisqTextAudit],
  '1009-cochranarmitage.html': [patchCochranArmitageText],
  '1007-wilcoxon.html': [patchWilcoxonText],
  '1015-twocorrelation.html': [patchRegressionCorrelationText],
  'table3.html': [patchTable3Text]
};
