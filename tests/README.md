# 统计组件轻量验证基线

这不是完整的自动化测试框架，而是一套**后续重构时的回归校验基线**。

## 文件

- `stat_calculator_cases.json`
  - 机器可读的关键 case 集合
  - 适合未来接入脚本、Playwright、Vitest 或手工校验工具
- `run_validation.js`
  - 零依赖 Node 脚本
  - 当前可执行最小校验器
  - 用于检查 case 文件结构、关键字段和部分基线数值

## 当前目标

优先保护下列高风险组件，避免后续重构时把数值逻辑悄悄改坏：

- `ttest`
- `chisq` / Fisher exact
- `kruskal`
- `friedman`
- `survival`（Kaplan-Meier 的基本不变量）

## 推荐使用方式

### 1. 先跑最小脚本
在项目根目录执行：

```bash
node tests/run_validation.js
```

当前脚本会做这些事：

- 读取 `stat_calculator_cases.json`
- 检查 JSON 是否合法
- 检查 case 是否有重复 id
- 检查关键组件输入结构是否合理
- 计算并校验部分真实统计量，例如：
  - one-sample t-test 的样本均值、df、t 统计量是否可计算
  - Welch t-test 的 df / t 统计量是否可计算
  - 卡方表的 df / minimum expected count 是否合理
  - Kruskal H / Friedman chi-square 近似量是否可计算

### 2. 手工校验页面组件
每次修改统计组件后：

1. 打开对应章节页面
2. 把 `stat_calculator_cases.json` 里的输入喂给组件
3. 核对以下内容：
   - 关键统计量是否合理
   - P 值数量级是否合理
   - 自由度是否符合预期
   - 是否显示必要字段（例如 mean difference、95% CI、Fisher exact、minimum expected count）
   - 生存曲线是否单调不增

### 3. 后续自动化
未来可以把这些 case 接到：

- 浏览器端回归脚本
- Playwright 截图/文本断言
- Node 脚本做页面输出校验

## 为什么先用这种轻量方案

当前仓库是静态站点，没有正式测试基础设施。相比直接引入一整套测试框架，先把：

- **关键组件**
- **关键输入**
- **关键输出约束**

固化下来，收益更直接，接入成本也更低。

## 后续建议

如果后面继续工程化，可以优先做两步：

1. 让 `run_validation.js` 增加更多数值断言
2. 再加一层浏览器端脚本，自动检查页面输出中的关键字段

这样就能把“文档化基线”逐步升级成真正可执行的 regression test。
