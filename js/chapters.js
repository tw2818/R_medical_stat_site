// 章节数据
const CHAPTERS = {
  basic: [
    { id: "1001-ttest",       title: "t检验",                          file: "1001-ttest.html",       num: "1" },
    { id: "1002-anova",       title: "多样本均数比较的方差分析",          file: "1002-anova.html",       num: "2" },
    { id: "discrete",         title: "几种离散型变量的分布及其应用",       file: "discrete.html",         num: "3" },
    { id: "1006-chisq",       title: "卡方检验",                        file: "1006-chisq.html",       num: "4" },
    { id: "1009-cochranarmitage", title: "Cochran-Armitage检验",        file: "1009-cochranarmitage.html", num: "5" },
    { id: "1007-wilcoxon",    title: "秩转换的非参数检验",               file: "1007-wilcoxon.html",    num: "6" },
    { id: "1015-twocorrelation", title: "双变量回归与相关",               file: "1015-twocorrelation.html", num: "7" },
    { id: "table3",           title: "三线表绘制",                      file: "table3.html",           num: "8" },
    { id: "plotting",         title: "统计绘图",                         file: "plotting.html",         num: "9" },
    { id: "1011-samplesize",  title: "样本量计算",                      file: "1011-samplesize.html",  num: "10" },
    { id: "1012-randomgroup", title: "随机分组",                        file: "1012-randomgroup.html", num: "11" },
    { id: "roc",              title: "ROC曲线",                          file: "roc.html",              num: "12" },
    { id: "1014-batchttest",  title: '"tidy"流统计分析',                file: "1014-batchttest.html",  num: "13" },
  ],
  advanced: [
    { id: "1003-dysanova",    title: "多因素方差分析",                   file: "1003-dysanova.html",    num: "14" },
    { id: "1008-mauchly",     title: "球对称检验",                       file: "1008-mauchly.html",     num: "15" },
    { id: "1004-repeatedanova", title: "重复测量方差分析",                file: "1004-repeatedanova.html", num: "16" },
    { id: "1005-ancova",      title: "协方差分析",                        file: "1005-ancova.html",      num: "17" },
    { id: "1010-anovaattention", title: "方差分析注意事项",              file: "1010-anovaattention.html", num: "18" },
    { id: "hotelling",        title: "多变量数据的统计描述和统计推断",    file: "hotelling.html",        num: "19" },
    { id: "1017-multireg",    title: "多元线性回归",                     file: "1017-multireg.html",    num: "20" },
    { id: "1018-logistic",    title: "Logistic回归",                     file: "1018-logistic.html",    num: "21" },
    { id: "loglinear",        title: "多维列联表的对数线性模型",          file: "loglinear.html",        num: "22" },
    { id: "poisson",          title: "泊松回归和负二项回归",              file: "poisson.html",          num: "23" },
    { id: "1019-codescheme",  title: "分类变量重编码",                   file: "1019-codescheme.html",  num: "24" },
    { id: "1032-survival",    title: "生存分析",                         file: "1032-survival.html",    num: "25" },
    { id: "1033-survivalvis", title: "生存曲线可视化",                   file: "1033-survivalvis.html", num: "26" },
    { id: "1020-discriminant", title: "判别分析",                        file: "1020-discriminant.html", num: "27" },
    { id: "1021-cluster",     title: "聚类分析",                          file: "1021-cluster.html",     num: "28" },
    { id: "1022-pca",         title: "主成分分析",                       file: "1022-pca.html",         num: "29" },
    { id: "pca-vis",          title: "主成分分析可视化",                  file: "pca-vis.html",          num: "30" },
    { id: "pcareg",           title: "主成分回归",                        file: "pcareg.html",           num: "31" },
    { id: "1023-factoranalysis", title: "探索性因子分析",                 file: "1023-factoranalysis.html", num: "32" },
    { id: "1016-partialcorrelation", title: "偏相关和典型相关分析",        file: "1016-partialcorrelation.html", num: "33" },
    { id: "sem",              title: "结构方程模型",                      file: "sem.html",              num: "34" },
    { id: "multilevel",       title: "多水平模型",                        file: "multilevel.html",       num: "35" },
    { id: "gee",              title: "广义估计方程",                      file: "gee.html",              num: "36" },
  ],
  literature: [
    { id: "1034-finegray",    title: "Fine-Gray检验和竞争风险模型",      file: "1034-finegray.html",    num: "37" },
    { id: "1035-psm",         title: "倾向性评分：匹配",                  file: "1035-psm.html",        num: "38" },
    { id: "1036-pssc",        title: "倾向性评分：回归和分层",             file: "1036-pssc.html",       num: "39" },
    { id: "1037-psw",         title: "倾向性评分：加权",                  file: "1037-psw.html",        num: "40" },
    { id: "1038-p4trend",     title: "p-for-trend / p-for-interaction / per-1-sd", file: "1038-p4trend.html", num: "41" },
    { id: "1039-nonlinear",   title: "多项式拟合",                        file: "1039-nonlinear.html",  num: "42" },
    { id: "1040-rcs",         title: "样条回归",                          file: "1040-rcs.html",        num: "43" },
    { id: "1041-subgroupanalysis", title: "亚组分析及森林图绘制",         file: "1041-subgroupanalysis.html", num: "44" },
    { id: "1042-subgroup1code", title: "亚组分析1行代码实现",             file: "1042-subgroup1code.html", num: "45" },
  ],
  other: [
    { id: "9999-appendix",    title: "其他合集",                          file: "9999-appendix.html",    num: "A" },
  ]
};

// 全部章节列表（用于搜索）
const ALL_CHAPTERS = [
  ...CHAPTERS.basic.map(c => ({ ...c, group: "basic", groupName: "基础统计分析" })),
  ...CHAPTERS.advanced.map(c => ({ ...c, group: "advanced", groupName: "高级统计分析" })),
  ...CHAPTERS.literature.map(c => ({ ...c, group: "literature", groupName: "文献常见统计分析" })),
  ...CHAPTERS.other.map(c => ({ ...c, group: "other", groupName: "其他合集" })),
];

// 加载进度
function getProgress() {
  try {
    return JSON.parse(localStorage.getItem('rstat_progress') || '{}');
  } catch { return {}; }
}
function saveProgress(chapterId) {
  const p = getProgress();
  p[chapterId] = true;
  localStorage.setItem('rstat_progress', JSON.stringify(p));
  updateProgressBar();
}
function updateProgressBar() {
  const p = getProgress();
  const total = ALL_CHAPTERS.length;
  const done = Object.keys(p).length;
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  if (progressText) progressText.textContent = `${done}/${total}`;
  if (progressFill) progressFill.style.width = `${(done/total*100).toFixed(1)}%`;

  if (typeof GROUP_CONFIG !== 'undefined') {
    GROUP_CONFIG.forEach(({ key }) => {
      const groupDone = CHAPTERS[key].filter(ch => p[ch.id]).length;
      const groupTotal = CHAPTERS[key].length;
      const countEl = document.getElementById(`${key}-count`);
      if (countEl) countEl.textContent = `${groupDone}/${groupTotal}`;
    });
  }
}
