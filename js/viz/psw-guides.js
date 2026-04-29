import { registerViz } from './_core.js';

const STYLE_ID = 'psw-guides-style';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .psw-guide-card{background:#f8f9fa;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .psw-guide-badge{display:inline-block;background:#ede9fe;color:#6d28d9;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:8px;}
    .psw-guide-title{font-size:17px;font-weight:700;color:#1e293b;margin:0 0 10px;}
    .psw-guide-body{color:#475569;line-height:1.8;font-size:14px;}
    @media(max-width:720px){.psw-guide-card{padding:14px}}
  `;
  document.head.appendChild(style);
}

function renderGuide(el, cfg) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="psw-guide-card">
      <div class="psw-guide-badge">${escapeHtml(cfg.badge)}</div>
      <div class="psw-guide-title">${title}</div>
      <div class="psw-guide-body">${cfg.body || ''}</div>
    </div>
  `;
}

const GUIDE_CARDS = {
  'psw-workflow-guide': {
    badge: 'workflow',
    title: '倾向性评分加权的工作流程',
    body: '倾向性评分加权（PS Weighting）通过加权使处理组和对照组的协变量分布均衡。工作流程：①选择协变量建立logistic模型计算PS → ②根据研究目的选择加权类型（IPTW/重叠加权）→ ③计算每个样本的权重 → ④检验协变量平衡性（SMD<0.1） → ⑤使用加权后的数据估计处理效应。本章介绍 IPTW（逆概率加权）和重叠加权两种方法。',
  },
  'psw-iptw-guide': {
    badge: 'IPTW',
    title: '逆概率加权（IPTW）公式与人群选择',
    body: 'IPTW 以全部研究对象为目标人群（ATE），权重为所在组概率的倒数：干预组权重=1/PS，对照组权重=1/(1-PS)。另一种 IPTW 以处理组为目标人群（ATT），公式相同但含义不同：干预组权重=1，对照组权重=PS/(1-PS)。IPTW 的有效样本量（ESS）会小于原始样本量：加权后 control ESS=202.27，treated ESS=671.09（本例），极端PS值会产生极大权重，需进行裁剪（trimming）。',
  },
  'psw-balance-guide': {
    badge: '平衡',
    title: '加权后平衡性检验的解读',
    body: '使用 cobalt::bal.tab 或 CreateTableOne 的 SMD 检验平衡性。判断标准：①SMD<0.1 表示协变量已均衡（本例 IPTW 加权后 13 项全部<0.1）②有效样本量（ESS）反映加权后的信息量，ESS 越小说明权重越不均匀③权重裁剪可减小极端权重但会损失部分样本。加权前：stent(SMD=0.255)、acutemi(SMD=0.372)、ves1proc(SMD=0.427) 不均衡；IPTW 加权后全部<0.1。',
  },
  'psw-survey-guide': {
    badge: '分析',
    title: '加权数据的回归分析流程',
    body: 'IPTW 加权后使用 survey 包进行分析：①svydesign(ids=~1, data, weights=~wt) 建立加权设计对象 → ②svyCreateTableOne() 产出加权后的基线资料表 → ③在 glm(..., weights=wt) 或 svyglm() 中纳入权重。注意：R 自带的 glm/lm weights 参数不是样本权重，须使用 survey 包的 svydesign 框架。本例加权后逻辑回归结果：abcix1 系数=1.785，p=2.84e-08，提示 abcix=1 处理组的 6 个月生存率显著更高。',
  },
  'psw-overlap-guide': {
    badge: '重叠加权',
    title: '重叠加权（Overlap Weighting）的原理与优势',
    body: '重叠加权的目标人群是两组 PS 值分布相似的人（ATO，Average Treatment effect in the Overlap），权重公式：干预组权重=1-PS，对照组权重=PS。相比 IPTW，重叠加权的优势：①极端 PS 值产生的权重更小更稳定（本例 overlap ESS=287/570 vs IPTW ESS=202/671）②仅使用重叠区域样本，估计的是重叠人群的效应③更稳健于模型假设的偏倚。适用场景：当研究关注同质人群、PS 分布重叠较好时优先使用。',
  },
  'psw-comparison-guide': {
    badge: '对比',
    title: 'IPTW 与重叠加权的选择',
    body: '三种加权目标人群对比：①ATE（IPW）：全人群，A=T，权重=1/PS 或 1/(1-PS)，适合政策评估 ②ATT（IPTW）：处理组人群，权重=PS/(1-PS) 或 1，适合治疗效果研究 ③ATO（重叠加权）：重叠人群，权重=1-PS 或 PS，适合异质性治疗效果研究、PS 分布重叠良好时。本例 overlap 加权后所有 SMD=0（完全均衡），ESS 损失更少，效应估计=1134.91（cardbill 结局）。',
  },
};

registerViz('psw-workflow-guide', (el) => renderGuide(el, GUIDE_CARDS['psw-workflow-guide']));
registerViz('psw-iptw-guide', (el) => renderGuide(el, GUIDE_CARDS['psw-iptw-guide']));
registerViz('psw-balance-guide', (el) => renderGuide(el, GUIDE_CARDS['psw-balance-guide']));
registerViz('psw-survey-guide', (el) => renderGuide(el, GUIDE_CARDS['psw-survey-guide']));
registerViz('psw-overlap-guide', (el) => renderGuide(el, GUIDE_CARDS['psw-overlap-guide']));
registerViz('psw-comparison-guide', (el) => renderGuide(el, GUIDE_CARDS['psw-comparison-guide']));