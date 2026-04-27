const CHAPTER_SEARCH_KEYWORDS = {
  '1001-ttest': ['t检验', '均值比较', '两组', '配对', '连续变量', '正态', '方差齐性'],
  '1002-anova': ['方差分析', 'anova', '多组均值', '多样本', '组间比较'],
  'discrete': ['离散分布', '二项分布', '泊松分布', '率', '概率分布'],
  '1006-chisq': ['卡方', 'chisq', '列联表', '分类资料', '率比较', 'fisher', '四格表'],
  '1009-cochranarmitage': ['趋势检验', 'cochran', 'armitage', '有序分类', '率趋势'],
  '1007-wilcoxon': ['秩和', '非参数', 'wilcoxon', 'kruskal', 'friedman', '非正态', '等级资料'],
  '1015-twocorrelation': ['相关', '回归', 'pearson', 'spearman', 'kendall', '散点图'],
  'table3': ['三线表', 'table 1', '基线表', '论文表格', 'baseline'],
  'plotting': ['统计绘图', 'ggplot', '图形', '可视化'],
  '1011-samplesize': ['样本量', 'power', '把握度', '效能'],
  '1012-randomgroup': ['随机分组', '随机化', '分组'],
  'roc': ['roc', 'auc', '诊断试验', '灵敏度', '特异度', '预测模型'],
  '1014-batchttest': ['tidy', '批量检验', '批量分析', '管道'],
  '1003-dysanova': ['多因素方差', '析因设计', '交互作用'],
  '1008-mauchly': ['球形检验', 'mauchly', '重复测量'],
  '1004-repeatedanova': ['重复测量', 'repeated', '组内因素'],
  '1005-ancova': ['协方差分析', 'ancova', '协变量'],
  '1010-anovaattention': ['方差分析注意事项', '多重比较', '事后检验'],
  'hotelling': ['hotelling', '多变量', '多元统计'],
  '1017-multireg': ['多元线性回归', '线性回归', 'β', '多因素'],
  '1018-logistic': ['logistic', '二分类', 'or', '危险因素', '多因素', '临床预测'],
  'loglinear': ['对数线性模型', '多维列联表', 'loglinear'],
  'poisson': ['泊松回归', '负二项', '计数资料', '发生率', '过度离散'],
  '1019-codescheme': ['变量重编码', '哑变量', '分类变量', 'dummy'],
  '1032-survival': ['生存分析', 'cox', 'km', 'kaplan', 'meier', 'hr', '删失'],
  '1033-survivalvis': ['生存曲线', 'km曲线', '风险表', 'ggsurvplot'],
  '1020-discriminant': ['判别分析', '分类判别'],
  '1021-cluster': ['聚类', '层次聚类', 'kmeans'],
  '1022-pca': ['主成分', 'pca', '降维'],
  'pca-vis': ['主成分可视化', 'pca图', '双标图'],
  'pcareg': ['主成分回归', 'pcr'],
  '1023-factoranalysis': ['因子分析', 'efa', '探索性因子'],
  '1016-partialcorrelation': ['偏相关', '典型相关', 'partial correlation'],
  'sem': ['结构方程', 'sem', '路径分析'],
  'multilevel': ['多水平模型', '混合模型', '层级模型', '随机效应'],
  'gee': ['广义估计方程', 'gee', '重复测量', '相关数据'],
  '1034-finegray': ['fine-gray', 'finegray', '竞争风险', '累积发生率'],
  '1035-psm': ['psm', '倾向评分', '匹配', '观察性研究', '混杂校正'],
  '1036-pssc': ['倾向评分', '回归调整', '分层', 'ps score'],
  '1037-psw': ['倾向评分加权', 'iptw', '加权', 'psw'],
  '1038-p4trend': ['p for trend', 'p-for-trend', '趋势', '交互作用', 'per 1 sd'],
  '1039-nonlinear': ['多项式拟合', '非线性', '曲线拟合'],
  '1040-rcs': ['rcs', '样条回归', '限制性立方样条', '非线性', '剂量反应'],
  '1041-subgroupanalysis': ['亚组分析', '森林图', 'subgroup', 'forest', '交互作用'],
  '1042-subgroup1code': ['一行代码', '亚组分析', 'forestploter'],
  '9999-appendix': ['附录', '更新日志', 'changelog']
};

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function getSearchFields(chapter) {
  return [
    chapter.title,
    chapter.groupName,
    chapter.file,
    chapter.id,
    String(chapter.num),
    ...(CHAPTER_SEARCH_KEYWORDS[chapter.id] || [])
  ];
}

export function findMatchingChapters(query, allChapters, limit = 8) {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery) return [];

  return allChapters
    .map(chapter => {
      const fields = getSearchFields(chapter).map(normalizeText);
      const exactTitle = normalizeText(chapter.title).includes(normalizedQuery) ? 3 : 0;
      const exactKeyword = fields.some(field => field === normalizedQuery) ? 2 : 0;
      const fuzzy = fields.some(field => field.includes(normalizedQuery)) ? 1 : 0;
      return { chapter, score: exactTitle + exactKeyword + fuzzy };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(a.chapter.num) - Number(b.chapter.num))
    .map(item => item.chapter)
    .slice(0, limit);
}
