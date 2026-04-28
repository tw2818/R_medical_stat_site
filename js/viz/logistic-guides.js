import { registerViz } from './_core.js';

const STYLE_ID = 'logistic-guides-style';

const GUIDE_CARDS = {
  'logistic-equation-explainer': {
    badge: 'logit → probability',
    icon: '𝑃',
    title: 'Logistic 回归方程怎么读',
    lead: '二项 Logistic 先建立线性预测值，再用 S 型函数把 logit 转成 0–1 的概率。',
    steps: [
      ['线性部分', 'η = β₀ + β₁x₁ + …，可以为任意实数。'],
      ['logit', 'logit(P)=log(P/(1-P))，对应的是 odds 的对数。'],
      ['概率', 'P = 1/(1+e⁻η)，因此预测值一定落在 0–1。']
    ],
    note: '看 glm(..., family = binomial()) 输出时，Estimate 位于 logit 标尺；解释给临床读者时通常再转成 OR 或概率。'
  },
  'logistic-dummy-guide': {
    badge: 'reference coding',
    icon: '0/1',
    title: '哑变量与参考组',
    lead: 'R 默认把因子的第一个水平作为参考组，其余水平与参考组比较。',
    steps: [
      ['x1 年龄', '四水平因子会变成 x12、x13、x14，均与 x1=1 比较。'],
      ['二分类变量', '如 x6=1 的系数表示高动物脂肪摄入相对 x6=0 的 log odds 差。'],
      ['换参考组', '需要改变比较基准时用 relevel() 或重新设置 factor(levels=...)。']
    ],
    note: '不要把 x12 理解为一个新测量变量；它是“x1 第2水平 vs 第1水平”的比较。'
  },
  'logistic-or-ci-guide': {
    badge: 'β → OR',
    icon: 'OR',
    title: '从 β、95%CI 到 OR 森林图',
    lead: 'OR = exp(β)，95%CI 也要对 confint(β) 的上下限分别取指数。',
    steps: [
      ['OR = 1', '表示两组 odds 没有差异，是森林图的无效线。'],
      ['OR > 1', '事件 odds 增加；例如 x61 的 OR≈50.43。'],
      ['CI 跨 1', '通常提示该项统计学证据不足，即使点估计很大也要谨慎。']
    ],
    note: '本章 OR 森林图使用 cb4 中 exp(coef(f)) 与 exp(confint(f)) 的真实输出，避免手工数组错位。'
  },
  'logistic-stepwise-guide': {
    badge: 'AIC selection',
    icon: 'AIC',
    title: '逐步回归：看 AIC，不只看 P 值',
    lead: 'step() 每一步比较加入或删除变量后的 AIC，AIC 越小代表在拟合与复杂度之间更优。',
    steps: [
      ['起始模型', '完整模型 AIC=64.03，包含 x1–x8。'],
      ['逐步比较', '删除或加入变量后，选择使 AIC 下降最多的方向。'],
      ['最终模型', '本例最终为 y ~ x2 + x3 + x6 + x8，AIC=57.537。']
    ],
    note: '逐步法适合教学理解变量筛选流程；正式研究仍要结合先验机制、样本量与验证集。'
  },
  'logistic-ordinal-parallel-guide': {
    badge: 'Brant test',
    icon: '∥',
    title: '有序 Logistic 的平行线假设',
    lead: '有序 Logistic 假设每个阈值下自变量效应相同，也称 proportional odds / 平行线假设。',
    steps: [
      ['H0', '平行回归假设成立。'],
      ['Brant 检验', '若 P>0.05，通常认为未发现违反平行线假设的证据。'],
      ['本例', 'Omnibus P=0.40，X1女 P=0.21，X2新型疗法 P=0.94。']
    ],
    note: '若假设不满足，可考虑部分比例优势模型或多项 Logistic。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .logistic-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .logistic-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .logistic-guide-icon{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;box-shadow:0 8px 18px rgba(79,70,229,.25);}
    .logistic-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .logistic-guide-badge{display:inline-block;background:#e0e7ff;color:#4338ca;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .logistic-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .logistic-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;}
    .logistic-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;}
    .logistic-guide-item strong{display:block;color:#312e81;margin-bottom:6px;}
    .logistic-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #818cf8;border-radius:10px;padding:10px 12px;}
    .logistic-threshold-panel{display:grid;grid-template-columns:minmax(210px,1fr) 1.1fr;gap:16px;align-items:center;}
    .logistic-slider{width:100%;accent-color:#4f46e5;}
    .logistic-metric{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #e2e8f0;padding:8px 0;font-size:14px;}
    .logistic-metric strong{color:#1e293b;}
    .logistic-threshold-bars{display:flex;align-items:end;gap:12px;height:150px;padding:10px 4px;border-bottom:1px solid #cbd5e1;}
    .logistic-bar{flex:1;border-radius:10px 10px 0 0;background:linear-gradient(180deg,#818cf8,#4f46e5);min-height:18px;position:relative;}
    .logistic-bar.alt{background:linear-gradient(180deg,#f59e0b,#ea580c);}
    .logistic-bar span{position:absolute;left:50%;bottom:-24px;transform:translateX(-50%);font-size:12px;color:#475569;white-space:nowrap;}
    @media(max-width:680px){.logistic-threshold-panel{grid-template-columns:1fr}.logistic-guide-card{padding:14px}}
  `;
  document.head.appendChild(style);
}

function renderGuide(el) {
  ensureStyles();
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['logistic-equation-explainer'];
  el.innerHTML = `
    <div class="logistic-guide-card">
      <div class="logistic-guide-head">
        <div class="logistic-guide-icon">${cfg.icon}</div>
        <div><span class="logistic-guide-badge">${cfg.badge}</span><h3 class="logistic-guide-title">${el.dataset.title || cfg.title}</h3></div>
      </div>
      <p class="logistic-guide-lead">${cfg.lead}</p>
      <div class="logistic-guide-grid">
        ${cfg.steps.map(([title, text]) => `<div class="logistic-guide-item"><strong>${title}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="logistic-guide-note">${cfg.note}</div>
    </div>`;
}

function renderThresholdDemo(el) {
  ensureStyles();
  el.innerHTML = `
    <div class="logistic-guide-card">
      <div class="logistic-guide-head">
        <div class="logistic-guide-icon">τ</div>
        <div><span class="logistic-guide-badge">threshold demo</span><h3 class="logistic-guide-title">${el.dataset.title || '预测概率与分类阈值'}</h3></div>
      </div>
      <p class="logistic-guide-lead">Logistic 模型输出的是概率；把概率转成“阳性/阴性”需要阈值。阈值升高通常提高特异度、降低敏感度。</p>
      <div class="logistic-threshold-panel">
        <div>
          <label>分类阈值：<strong class="threshold-value">0.50</strong></label>
          <input type="range" class="logistic-slider" min="0.20" max="0.80" value="0.50" step="0.05" aria-label="Logistic 分类阈值">
          <div class="logistic-metric"><span>敏感度 sensitivity</span><strong class="sens-value">0.78</strong></div>
          <div class="logistic-metric"><span>特异度 specificity</span><strong class="spec-value">0.76</strong></div>
          <div class="logistic-metric"><span>平衡准确率</span><strong class="bal-value">0.77</strong></div>
        </div>
        <div class="logistic-threshold-bars" aria-label="阈值对敏感度和特异度的影响">
          <div class="logistic-bar sens-bar" style="height:78%"><span>敏感度</span></div>
          <div class="logistic-bar alt spec-bar" style="height:76%"><span>特异度</span></div>
        </div>
      </div>
      <div class="logistic-guide-note">ROC 曲线就是把多个阈值下的敏感度与 1-特异度组合起来看；AUC 接近 1 说明区分度更好。</div>
    </div>`;

  const slider = el.querySelector('input[type="range"]');
  const thresholdValue = el.querySelector('.threshold-value');
  const sensValue = el.querySelector('.sens-value');
  const specValue = el.querySelector('.spec-value');
  const balValue = el.querySelector('.bal-value');
  const sensBar = el.querySelector('.sens-bar');
  const specBar = el.querySelector('.spec-bar');

  const update = () => {
    const threshold = Number(slider.value);
    const sensitivity = Math.max(0.42, Math.min(0.94, 1.08 - threshold * 0.60));
    const specificity = Math.max(0.46, Math.min(0.96, 0.36 + threshold * 0.80));
    const balanced = (sensitivity + specificity) / 2;
    thresholdValue.textContent = threshold.toFixed(2);
    sensValue.textContent = sensitivity.toFixed(2);
    specValue.textContent = specificity.toFixed(2);
    balValue.textContent = balanced.toFixed(2);
    sensBar.style.height = `${Math.round(sensitivity * 100)}%`;
    specBar.style.height = `${Math.round(specificity * 100)}%`;
  };

  slider.addEventListener('input', update);
  update();
}

registerViz('logistic-equation-explainer', renderGuide);
registerViz('logistic-dummy-guide', renderGuide);
registerViz('logistic-or-ci-guide', renderGuide);
registerViz('logistic-probability-threshold-demo', renderThresholdDemo);
registerViz('logistic-stepwise-guide', renderGuide);
registerViz('logistic-ordinal-parallel-guide', renderGuide);
