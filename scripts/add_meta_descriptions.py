#!/usr/bin/env python3
"""
为 ~/R_medical_stat_site/data/*.html 章节文件批量添加 <meta name="description">。

- 跳过 index.html
- 跳过已有 description 的文件
- 在 </title> 之后、<style> 之前插入 (附录在 </head> 之前)
- 保持原文件 LF 行尾与原有内容不变
- 输出 JSONL: ~/R_medical_stat_site/.hermes-meta-tmp.jsonl
- 幂等: 第二次运行跳过数=总数,新增数=0
"""
import os
import re
import json
import sys
from pathlib import Path

ROOT = Path("/home/twebery/R_medical_stat_site")
DATA_DIR = ROOT / "data"
SCRIPTS_DIR = ROOT / "scripts"
SCRIPTS_DIR.mkdir(exist_ok=True)
JSONL_PATH = ROOT / ".hermes-meta-tmp.jsonl"

# ---------------------------------------------------------------------------
# 章节描述生成: filename (去掉 .html) -> 描述 (80-160 字符)
# 描述要求:
#  - 中文为主
#  - 包含 "R"、"统计"、"医学" 核心词
#  - 教什么 + 给谁用 + 解决什么问题
#  - 80-160 字符
# ---------------------------------------------------------------------------

# 每个章节定制: chapter (key) -> 描述
# key 与 filename (无 .html) 一致
CHAPTER_DESCRIPTIONS = {
    "1001-ttest": "R 医学统计教程:本章讲解 t 检验(单样本、配对、两独立样本)适用条件、公式推导与 R 代码实现,面向临床科研工作者解决两组均数比较问题,配套孙振球《医学统计学》例题。",
    "1002-anova": "R 医学统计教程:本章讲解多组均数比较的方差分析(完全随机设计、ANOVA 假设检验),含正态性/方差齐性判断与 R 代码实现,面向医学科研人员解决三组及以上连续变量比较问题。",
    "1003-dysanova": "R 医学统计教程:本章讲解多因素方差分析(析因设计、交互作用、协变量控制),含 aov/lm 模型构建与 R 代码,面向医学科研人员解决多因素实验的统计推断与主效应分析问题。",
    "1004-repeatedanova": "R 医学统计教程:本章讲解重复测量方差分析(球对称检验、Greenhouse-Geisser 校正),含 lme/aov 混合模型 R 实现,面向临床科研人员解决同一对象多次测量数据的统计推断问题。",
    "1005-ancova": "R 医学统计教程:本章讲解协方差分析(ANCOVA)原理、模型拟合、协变量调整与 R 代码实现,面向医学科研工作者解决连续因变量受协变量影响时组间比较的混杂控制问题。",
    "1006-chisq": "R 医学统计教程:本章讲解四格表、R×C 列联表卡方检验(期望频数、连续性校正、Fisher 确切概率),含 chisq.test R 代码,面向医学科研人员解决分类资料组间差异比较问题。",
    "1007-wilcoxon": "R 医学统计教程:本章讲解秩和检验、秩转换的非参数检验(Wilcoxon、Mann-Whitney、Kruskal-Wallis),含 wilcox.test R 代码实现,面向医学科研人员解决不满足正态假设数据的组间比较问题。",
    "1008-mauchly": "R 医学统计教程:本章讲解 Mauchly 球形度检验与重复测量资料方差分析前提条件判断,含 R 代码实现与违反球形时校正策略,面向医学统计研究者处理纵向/重复测量数据分析问题。",
    "1009-cochranarmitage": "R 医学统计教程:本章讲解 Cochran-Armitage 趋势检验(剂量-反应关系、有序分类结局),含 R 代码与二分类/有序分组应用场景,面向流行病学研究人员分析有序暴露因素与疾病关系问题。",
    "1010-anovaattention": "R 医学统计教程:本章总结方差分析的常见注意事项(数据转换、离群值、多重比较校正),含 R 实操建议,面向医学科研人员避免误用 ANOVA 与正确解读方差分析结果。",
    "1011-samplesize": "R 医学统计教程:本章讲解医学研究中样本量计算(均数比较、率比较、相关/回归、生存分析),含 pwr、power.t.test、power.prop.test 等 R 函数,面向医学科研人员解决临床研究设计阶段样本量估算问题。",
    "1012-randomgroup": "R 医学统计教程:本章讲解临床试验中随机分组方法(简单随机、分层随机、区组随机),含 set.seed、sample、blockrand 等 R 代码,面向医学科研人员解决实验分组偏倚控制与分配隐藏问题。",
    "1014-batchttest": "R 医学统计教程:本章讲解 tidy 流风格的批量 t 检验(purrr/broom 自动建模、结果整理成 tibble),面向医学科研人员解决多组数据并行统计与可视化报告生成问题。",
    "1015-twocorrelation": "R 医学统计教程:本章讲解双变量回归与相关分析(Pearson、Spearman、Kendall,直线回归方程),含 cor、cor.test、lm R 代码,面向医学科研人员解决两连续变量关联性与回归建模问题。",
    "1016-partialcorrelation": "R 医学统计教程:本章讲解偏相关与典型相关分析(控制混杂变量后的线性关联、多组变量综合相关),含 R 代码实现,面向医学科研人员解决多变量研究中净相关与多维关联度量问题。",
    "1017-multireg": "R 医学统计教程:本章讲解多元线性回归(变量筛选、逐步回归、模型诊断、多重共线性、交互作用),含 lm、step、car R 包代码,面向医学科研人员解决多自变量连续因变量预测建模问题。",
    "1018-logistic": "R 医学统计教程:本章讲解二分类与多分类 Logistic 回归(模型构建、OR 值解读、Hosmer-Lemeshow 拟合优度、ROC 评价),含 glm R 代码,面向医学科研人员解决临床风险因素与二分类结局问题。",
    "1019-codescheme": "R 医学统计教程:本章讲解分类变量重编码(因子化、哑变量设置、参考水平调整),含 forcats、relevel、model.matrix 等 R 函数,面向医学科研人员解决统计分析前数据清洗与因子化问题。",
    "1020-discriminant": "R 医学统计教程:本章讲解判别分析(线性判别 LDA、二次判别 QDA、贝叶斯判别),含 MASS 包 lda R 代码,面向医学科研人员解决多类结局辅助诊断与个体分类问题。",
    "1021-cluster": "R 医学统计教程:本章讲解聚类分析(系统聚类、K-means、层次聚类、轮廓系数评价),含 hclust、kmeans R 代码,面向医学科研人员解决样本/指标无监督分组与探索性分类问题。",
    "1022-pca": "R 医学统计教程:本章讲解主成分分析(PCA 数据降维、特征值、方差贡献率、生物医学指标综合评价),含 prcomp、FactoMineR R 代码,面向医学科研人员解决多指标数据降维与综合得分问题。",
    "1023-factoranalysis": "R 医学统计教程:本章讲解探索性因子分析(EFA,因子提取、旋转、因子载荷、问卷效度),含 psych、factanal R 代码,面向医学科研人员解决量表结构效度与潜在因子识别问题。",
    "1032-survival": "R 医学统计教程:本章讲解生存分析(Kaplan-Meier 曲线、Log-rank 检验、Cox 比例风险模型),含 survival、survfit、coxph R 代码,面向医学科研人员解决临床随访数据生存时间与影响因素问题。",
    "1033-survivalvis": "R 医学统计教程:本章讲解生存曲线可视化(K-M 曲线美化、风险表、累积事件、ggsurvplot、survminer),面向医学科研人员解决生存分析结果论文级图表绘制与发布问题。",
    "1034-finegray": "R 医学统计教程:本章讲解 Fine-Gray 竞争风险模型(竞争事件、CIF 累积发生率、子分布风险),含 cmprsk、R cmprsk 包 R 代码,面向医学研究者解决多结局竞争风险生存分析问题。",
    "1035-psm": "R 医学统计教程:本章讲解倾向性评分匹配(PSM,最邻近匹配、卡钳匹配、协变量平衡诊断),含 MatchIt、optmatch R 代码,面向医学研究人员解决观察性研究处理组混杂控制与因果推断问题。",
    "1036-pssc": "R 医学统计教程:本章讲解倾向性评分回归调整与分层分析(PS 回归、PS 分层、协变量加权),含 R 代码实现,面向医学研究人员解决非随机对照观察性研究混杂偏倚控制问题。",
    "1037-psw": "R 医学统计教程:本章讲解倾向性评分加权(IPTW、SMRW、逆概率加权、权重截断),含 WeightIt、ipw R 代码,面向医学研究人员解决观察性研究处理效应估计与基线平衡问题。",
    "1038-p4trend": "R 医学统计教程:本章讲解 p-for-trend、p-for-interaction、per-1-SD 趋势检验与交互作用 P 值计算,含 R 代码,面向医学研究人员解决剂量反应关系与亚组异质性统计推断问题。",
    "1039-nonlinear": "R 医学统计教程:本章讲解多项式拟合(二次/三次曲线、非线性趋势、约束条件),含 poly、lm、nls R 代码,面向医学研究人员解决连续自变量与因变量非线性关系建模问题。",
    "1040-rcs": "R 医学统计教程:本章讲解限制性立方样条(RCS,节点选择、平滑非线性剂量反应关系),含 rms、rcs R 代码,面向医学研究人员解决连续暴露因素与结局非线性关联可视化与建模问题。",
    "1041-subgroupanalysis": "R 医学统计教程:本章讲解亚组分析与森林图绘制(交互作用检验、分层回归、jforest、forestplot R 包),面向医学研究人员解决亚组异质性探索与多组效应可视化问题。",
    "1042-subgroup1code": "R 医学统计教程:本章讲解一行 R 代码实现亚组分析(交互模型自动批量输出、forestplot 森林图),面向医学研究人员简化临床研究中亚组分析与论文图表制作流程。",
    "9999-appendix": "R 医学统计教程附录:站点使用说明、章节索引、参考资料、数据来源、版本与更新日志,以及孙振球《医学统计学》第 5 版配套资源,帮助读者快速检索和定位本站全部教程内容。",
    "discrete": "R 医学统计教程:本章讲解二项分布、泊松分布、负二项分布等离散型变量分布在医学研究中的应用,含 dbinom/dpois/dnbinom R 函数,面向医学统计人员解决计数资料概率建模问题。",
    "gee": "R 医学统计教程:本章讲解广义估计方程(GEE,重复测量、纵向数据、作业相关矩阵),含 geepack R 代码,面向医学研究人员解决非独立重复测量数据边际模型估计与统计推断问题。",
    "hotelling": "R 医学统计教程:本章讲解多变量数据的统计描述与 Hotelling T² 统计推断(均值向量比较、协差阵检验),含 ICS、Hotelling R 代码,面向医学科研人员解决多指标联合组间比较问题。",
    "loglinear": "R 医学统计教程:本章讲解多维列联表的对数线性模型(独立性检验、高阶交互作用、饱和模型),含 MASS loglin R 代码,面向医学研究人员解决多维分类资料关联结构与因素分析问题。",
    "multilevel": "R 医学统计教程:本章讲解多水平模型(层次数据、随机效应、组内相关系数 ICC、HLM 与 lme4 R 代码),面向医学研究人员解决医院-患者、地区-个体等嵌套结构数据建模问题。",
    "pca-vis": "R 医学统计教程:本章讲解主成分分析的可视化(碎石图、双标图 biplot、个体/变量因子图、factoextra、FactoMineR),面向医学科研人员解决 PCA 结果解读与论文图表呈现问题。",
    "pcareg": "R 医学统计教程:本章讲解主成分回归(PCR,降维后回归建模、共线性缓解),含 pls、pcr R 代码,面向医学研究人员解决自变量多重共线性强时的预测建模问题。",
    "plotting": "R 医学统计教程:本章讲解医学统计常用科研绘图(直方图、箱线图、散点图、误差棒、热图、ggplot2 高级主题),面向医学科研人员解决数据可视化与论文图表规范制作问题。",
    "poisson": "R 医学统计教程:本章讲解泊松回归与负二项回归(计数资料、过度离散、发生率比 IRR),含 glm、MASS glm.nb R 代码,面向医学研究人员解决稀有事件计数与发病率建模问题。",
    "roc": "R 医学统计教程:本章讲解 ROC 曲线与诊断实验评价(灵敏度、特异度、AUC、最佳截断值、DeLong 比较),含 pROC、ROCR R 代码,面向医学研究人员解决诊断试验准确性与比较问题。",
    "sem": "R 医学统计教程:本章讲解结构方程模型(SEM,潜变量、路径分析、验证性因子分析、模型拟合指标),含 lavaan R 代码,面向医学研究人员解决多变量因果路径与潜变量建模问题。",
    "table3": "R 医学统计教程:本章讲解医学论文三线表(Table 3)规范绘制(基线特征表、统计量标注、gtsummary、tableone),面向医学科研人员解决论文中规范化统计表格生成与发表问题。",
}

# ---------------------------------------------------------------------------
# 处理逻辑
# ---------------------------------------------------------------------------

def get_title_and_first_p(filepath: Path):
    """从 HTML 中提取 title 与第一个有意义的 <p>"""
    with open(filepath, "r", encoding="utf-8") as fp:
        content = fp.read()
    title_m = re.search(r"<title>(.*?)</title>", content, re.S)
    title = title_m.group(1).strip() if title_m else ""
    title = title.replace("&nbsp;", " ").replace("\u00a0", " ")
    # 去掉网站后缀
    title = re.sub(r"\s*[–\-—]\s*R\s*语言实战医学统计\s*$", "", title).strip()

    # 第一个有意义的 <p>
    p_match = ""
    for p_m in re.finditer(r"<p[^>]*>(.*?)</p>", content, re.S):
        text = re.sub(r"<[^>]+>", "", p_m.group(1))
        text = re.sub(r"\s+", " ", text).strip()
        # 跳过过短/明显是"无内容"的
        if len(text) >= 25 and "本页为" not in text[:6]:
            p_match = text[:160]
            break
    return title, p_match


def build_description(key: str, title: str, first_p: str) -> str:
    """根据 key 返回定制描述;若未定制则回退到基于 title 的通用描述"""
    if key in CHAPTER_DESCRIPTIONS:
        return CHAPTER_DESCRIPTIONS[key]
    # 兜底:从 title 拼一个 80-160 字的通用描述
    fallback = (
        f"R 医学统计教程:本章讲解《{title}》,面向医学科研工作者,"
        f"使用 R 语言进行医学统计方法的实操、代码实现与结果解读,"
        f"配套孙振球《医学统计学》第 5 版例题。"
    )
    return fallback[:160]


def has_existing_description(content: str) -> bool:
    return bool(re.search(r'<meta\s+name=["\']description["\']', content, re.I))


def insert_description(content: str, description: str) -> tuple[str, str]:
    """返回 (new_content, insertion_point_name)
    insertion_point_name: 'after_title_before_style' 或 'before_head_close'"""
    meta_line = f'<meta name="description" content="{description}">\n'

    # 标准 45 个文件: </title> 之后、<style> 之前
    # 用 multiline 匹配,保留缩进
    pattern = re.compile(r"(</title>\s*\n)(\s*)(<style)", re.S)
    if pattern.search(content):
        new_content = pattern.sub(lambda m: m.group(1) + m.group(2) + meta_line + m.group(2) + m.group(3), content, count=1)
        return new_content, "after_title_before_style"

    # 兜底: 9999-appendix 没有 <style>,在 </head> 之前插入
    pattern2 = re.compile(r"(\n)(\s*</head>)", re.S)
    if pattern2.search(content):
        new_content = pattern2.sub(lambda m: "\n" + meta_line + m.group(1) + m.group(2), content, count=1)
        return new_content, "before_head_close"

    # 最后兜底: 在 <head> 后插入
    pattern3 = re.compile(r"(<head[^>]*>\s*\n)", re.S)
    if pattern3.search(content):
        new_content = pattern3.sub(lambda m: m.group(1) + meta_line, content, count=1)
        return new_content, "after_head_open"

    return content, "no_insertion_point"


def main():
    if not DATA_DIR.is_dir():
        print(f"ERROR: 找不到目录 {DATA_DIR}", file=sys.stderr)
        sys.exit(1)

    files = sorted([f.name for f in DATA_DIR.glob("*.html")])
    # 排除 index.html (虽然在 ROOT,但保险起见)
    files = [f for f in files if f != "index.html"]

    stats = {
        "total": len(files),
        "skipped_existing_desc": 0,
        "added": 0,
        "failed": 0,
        "fallback_used": 0,
    }
    failed_list = []
    jsonl_records = []

    # 清空 JSONL
    if JSONL_PATH.exists():
        JSONL_PATH.unlink()

    for fname in files:
        fpath = DATA_DIR / fname
        key = fname[:-5]  # 去掉 .html
        try:
            with open(fpath, "r", encoding="utf-8") as fp:
                content = fp.read()

            # 1. 已存在 description -> 跳过
            if has_existing_description(content):
                stats["skipped_existing_desc"] += 1
                jsonl_records.append({
                    "file": str(fpath.relative_to(ROOT)),
                    "key": key,
                    "title": "",
                    "first_p_excerpt": "",
                    "description": "",
                    "action": "skipped_existing",
                })
                continue

            # 2. 提取标题与首段
            title, first_p = get_title_and_first_p(fpath)
            description = build_description(key, title, first_p)

            # 长度检查
            if len(description) < 80 or len(description) > 160:
                print(f"WARN: {fname} description 长度异常: {len(description)}")
                if len(description) < 80:
                    description = description + "含 R 代码实现与详细结果解读,适合医学统计初学者和临床科研人员使用。"
                description = description[:160]

            # 3. 插入
            new_content, point = insert_description(content, description)
            if new_content == content:
                stats["failed"] += 1
                failed_list.append((fname, "no_insertion_point_found"))
                jsonl_records.append({
                    "file": str(fpath.relative_to(ROOT)),
                    "key": key,
                    "title": title,
                    "first_p_excerpt": first_p,
                    "description": description,
                    "action": "failed",
                    "reason": "no_insertion_point",
                })
                continue

            # 4. 写回
            # 显式用 LF 行尾写回 (Patch 工具会保持原行尾,但 Python 文件 IO 默认平台相关)
            with open(fpath, "w", encoding="utf-8", newline="\n") as fp:
                fp.write(new_content)

            stats["added"] += 1
            if key not in CHAPTER_DESCRIPTIONS:
                stats["fallback_used"] += 1
            jsonl_records.append({
                "file": str(fpath.relative_to(ROOT)),
                "key": key,
                "title": title,
                "first_p_excerpt": first_p,
                "description": description,
                "action": "added",
                "insertion_point": point,
                "desc_length": len(description),
            })

        except Exception as e:
            stats["failed"] += 1
            failed_list.append((fname, repr(e)))
            print(f"ERROR 处理 {fname}: {e}", file=sys.stderr)

    # 写 JSONL
    with open(JSONL_PATH, "w", encoding="utf-8") as fp:
        for rec in jsonl_records:
            fp.write(json.dumps(rec, ensure_ascii=False) + "\n")

    # 打印统计
    print("=" * 60)
    print("Meta description 批量处理完成")
    print("=" * 60)
    print(f"总文件数:        {stats['total']}")
    print(f"跳过(已有 desc):  {stats['skipped_existing_desc']}")
    print(f"新增 description: {stats['added']}")
    print(f"失败:             {stats['failed']}")
    print(f"  兜底描述数:     {stats['fallback_used']}")
    print(f"JSONL 路径:       {JSONL_PATH}")

    if failed_list:
        print("\n失败列表:")
        for f, reason in failed_list:
            print(f"  - {f}: {reason}")

    return stats


if __name__ == "__main__":
    main()
