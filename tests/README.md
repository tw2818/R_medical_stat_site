# 统计组件轻量验证基线

这不是完整的自动化测试框架，而是一套**后续重构时的回归校验基线**。

## 文件

- `stat_calculator_cases.json`
  - 机器可读的关键 case 集合
  - 适合未来接入脚本、Playwright、Vitest 或手工校验工具

## 当前目标

优先保护下列高风险组件，避免后续重构时把数值逻辑悄悄改坏：

- `ttest`
- `chisq` / Fisher exact
- `kruskal`
- `friedman`
- `survival`（Kaplan-Meier 的基本不变量）

## 推荐使用方式

### 1. 手工校验
每次修改统计组件后：

1. 打开对应章节页面
2. 把 `stat_calculator_cases.json` 里的输入喂给组件
3. 核对以下内容：
   - 关键统计量是否合理
   - P 值数量级是否合理
   - 自由度是否符合预期
   - 是否显示必要字段（例如 mean difference、95% CI、Fisher exact、minimum expected count）
   - 生存曲线是否单调不增

### 2. 后续自动化
未来可以把这些 case 接到：

- 浏览器端回归脚本
- Playwright 截图/文本断言
- Node 脚本做文本结果校验

## 为什么先用这种轻量方案

当前仓库是静态站点，没有正式测试基础设施。相比直接引入一整套测试框架，先把：

- **关键组件**
- **关键输入**
- **关键输出约束**

固化下来，收益更直接，接入成本也更低。

## 后续建议

如果后面继续工程化，可以优先做两步：

1. 增加一个最小脚本，读取 `stat_calculator_cases.json`
2. 让脚本自动检查页面输出中的关键字段是否出现

这样就能把“文档化基线”升级成真正的 regression test。
