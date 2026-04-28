import { registerViz } from './_core.js';

const GUIDE_CARDS = {
  'multireg-formula-guide': {
    icon: '🧮',
    title: '多元线性回归：公式先讲清楚',
    lead: '多元线性回归不是多个 y，而是一个连续因变量 y 同时由多个自变量解释。',
    cards: [
      ['因变量', '本例是空腹血糖 fpg，是模型要解释或预测的连续结局。'],
      ['自变量', 'cho、tg、ri、hba 同时进入模型，每个系数是在控制其他变量后的独立斜率。'],
      ['核心语义', 'lm(fpg ~ cho + tg + ri + hba) 读作：用四个指标共同解释 fpg。'],
    ],
    note: '解释系数时一定加上“在其他变量保持不变时”，否则容易把多元回归误读成单因素关系。',
  },
  'multireg-coef-guide': {
    icon: '📌',
    title: '系数表：估计值、标准误、t 值、P 值分工不同',
    lead: 'summary(lm()) 的系数表要按列读：先方向和大小，再看不确定性和显著性。',
    cards: [
      ['Estimate', '回归系数：自变量增加 1 单位时，因变量平均改变多少。'],
      ['Std. Error', '系数估计的不确定性；共线性、样本小、噪声大都会让它变大。'],
      ['Pr(>|t|)', '检验该系数是否可认为不等于 0，不等于临床重要性。'],
    ],
    note: '本例 hba 和 ri 的 P 值较小，但仍要结合诊断、共线性和研究背景解释。',
  },
  'multireg-metrics-guide': {
    icon: '📊',
    title: '模型评价：解释度和误差指标不要混着读',
    lead: 'R²、调整 R²、AIC、BIC、RMSE回答的是不同问题。',
    cards: [
      ['R² / adj.R²', '模型解释了多少变异；自变量越多 R² 越容易上升，所以更常看调整 R²。'],
      ['AIC / BIC', '用于候选模型之间比较，数值越小越好；BIC 对复杂模型惩罚更强。'],
      ['RMSE', '预测误差的典型量级，单位与因变量 fpg 相同。'],
    ],
    note: '评价模型不是只看 R²：用于解释、预测、变量筛选时，优先指标会不同。',
  },
  'multireg-diagnostics-guide': {
    icon: '🩺',
    title: '回归诊断：先看假设，再谈结论',
    lead: '回归系数和 P 值成立依赖模型假设；诊断图和检验是保护结论可信度的步骤。',
    cards: [
      ['线性', '残差应围绕 0 随机分布；系统性曲线提示可能需要非线性项。'],
      ['等方差/正态/独立', '影响标准误、置信区间和 P 值的可靠性。'],
      ['异常/强影响点', 'Cook 距离提示个别样本是否过度影响模型。'],
    ],
    note: '本章的 check_model()、gvlma、car 系列函数是在从不同角度回答同一个问题：这个线性模型能不能信。',
  },
  'multireg-selection-guide': {
    icon: '🧭',
    title: '变量选择：不要把逐步回归当作真理机器',
    lead: '逐步回归和全子集回归是候选模型筛选工具，不是自动生成因果结论的工具。',
    cards: [
      ['逐步 AIC', '每一步尝试加入/删除变量，看 AIC 是否下降。'],
      ['全子集', '比较不同变量组合，常用 Cp、BIC、调整 R² 等尺度。'],
      ['最终判断', '统计指标 + 临床意义 + 稳健性检查，三者都要看。'],
    ],
    note: '本例 AIC/Cp 都倾向保留 tg、ri、hba，但报告时仍应说明选择策略和候选变量来源。',
  },
};

function ensureMultiregStyles() {
  if (document.getElementById('multireg-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'multireg-guide-styles';
  style.textContent = `
    .multireg-card{margin:1.2rem 0;padding:1.1rem;border:1px solid #dbe4f0;border-radius:18px;background:linear-gradient(135deg,#f8fafc,#eef2ff);box-shadow:0 12px 28px rgba(15,23,42,.08);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#334155;}
    .multireg-head{display:flex;align-items:center;gap:.55rem;margin-bottom:.55rem;font-weight:800;color:#1e293b;font-size:1.05rem;}
    .multireg-icon{display:inline-flex;width:2rem;height:2rem;align-items:center;justify-content:center;border-radius:999px;background:#e0e7ff;}
    .multireg-lead{margin:.25rem 0 .85rem;color:#475569;line-height:1.75;}
    .multireg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem;}
    .multireg-mini{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:.85rem;min-height:7rem;}
    .multireg-mini strong{display:inline-flex;margin-bottom:.35rem;color:#3730a3;background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;padding:.18rem .55rem;font-size:.82rem;}
    .multireg-mini p{margin:0;color:#475569;line-height:1.65;font-size:.92rem;}
    .multireg-note{margin:.8rem 0 0;padding:.7rem .85rem;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;line-height:1.7;}
    .multireg-demo{display:grid;grid-template-columns:minmax(260px,1fr) minmax(220px,.85fr);gap:1rem;align-items:center;}
    .multireg-panel{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:1rem;}
    .multireg-control{display:flex;gap:.65rem;align-items:center;flex-wrap:wrap;font-weight:700;color:#334155;margin-bottom:.85rem;}
    .multireg-control input{accent-color:#4f46e5;min-width:190px;}
    .multireg-value{font-variant-numeric:tabular-nums;color:#4f46e5;background:#eef2ff;border-radius:999px;padding:.15rem .5rem;}
    .multireg-bars{display:grid;gap:.55rem;}
    .multireg-bar-row{display:grid;grid-template-columns:5rem 1fr 4rem;gap:.55rem;align-items:center;font-size:.9rem;color:#475569;}
    .multireg-track{height:1rem;background:#e2e8f0;border-radius:999px;overflow:hidden;}
    .multireg-fill{height:100%;background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444);border-radius:999px;}
    .multireg-badge{display:inline-flex;border-radius:999px;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;padding:.16rem .55rem;font-size:.82rem;font-weight:800;}
    .multireg-caption{font-size:.92rem;color:#475569;line-height:1.75;margin:.55rem 0 0;}
    @media (max-width:720px){.multireg-demo{grid-template-columns:1fr}.multireg-control input{width:100%;}}
  `;
  document.head.appendChild(style);
}

function renderGuide(el, config) {
  const title = el.dataset.title || config.title;
  const cards = config.cards.map(([label, text]) => `
    <div class="multireg-mini"><strong>${label}</strong><p>${text}</p></div>
  `).join('');
  el.innerHTML = `
    <section class="multireg-card" aria-label="${title}">
      <div class="multireg-head"><span class="multireg-icon">${config.icon}</span><span>${title}</span></div>
      <p class="multireg-lead">${config.lead}</p>
      <div class="multireg-grid">${cards}</div>
      <p class="multireg-note">${config.note}</p>
    </section>
  `;
}

function renderVifDemo(el) {
  const title = el.dataset.title || '交互演示：相关越高，VIF 和标准误越膨胀';
  const id = `multireg-${Math.random().toString(36).slice(2, 8)}`;
  el.innerHTML = `
    <section class="multireg-card" aria-label="${title}">
      <div class="multireg-head"><span class="multireg-icon">⚠️</span><span>${title}</span></div>
      <div class="multireg-demo">
        <div class="multireg-panel">
          <label class="multireg-control">预测变量相关 r <input type="range" id="${id}-slider" min="0" max="0.95" step="0.05" value="0.45"><span id="${id}-r" class="multireg-value">0.45</span></label>
          <div class="multireg-bars">
            <div class="multireg-bar-row"><span>VIF</span><div class="multireg-track"><div id="${id}-vifbar" class="multireg-fill" style="width:22%"></div></div><strong id="${id}-vif">1.25</strong></div>
            <div class="multireg-bar-row"><span>标准误倍数</span><div class="multireg-track"><div id="${id}-sebar" class="multireg-fill" style="width:35%"></div></div><strong id="${id}-se">1.12×</strong></div>
          </div>
        </div>
        <div class="multireg-panel">
          <p><span class="multireg-badge">教学要点</span></p>
          <p id="${id}-text" class="multireg-caption">当预测变量之间相关性升高时，方差膨胀因子 VIF = 1/(1-r²) 变大，系数标准误随之变大。</p>
          <p class="multireg-caption"><strong>对应第20.3.3：</strong>本例 VIF 都小于 4，说明共线性问题不突出；如果 VIF 很高，系数 P 值和方向可能不稳定。</p>
        </div>
      </div>
    </section>
  `;
  const slider = document.getElementById(`${id}-slider`);
  const rLabel = document.getElementById(`${id}-r`);
  const vifLabel = document.getElementById(`${id}-vif`);
  const seLabel = document.getElementById(`${id}-se`);
  const vifBar = document.getElementById(`${id}-vifbar`);
  const seBar = document.getElementById(`${id}-sebar`);
  const text = document.getElementById(`${id}-text`);
  const update = () => {
    const r = Number(slider.value);
    const vif = 1 / (1 - r * r);
    const se = Math.sqrt(vif);
    rLabel.textContent = r.toFixed(2);
    vifLabel.textContent = vif.toFixed(2);
    seLabel.textContent = `${se.toFixed(2)}×`;
    vifBar.style.width = `${Math.min(100, (vif / 5) * 100).toFixed(0)}%`;
    seBar.style.width = `${Math.min(100, (se / 2.3) * 100).toFixed(0)}%`;
    if (vif < 2) {
      text.textContent = 'VIF 较低：预测变量之间信息重叠少，系数估计通常比较稳定。';
    } else if (vif < 4) {
      text.textContent = 'VIF 中等：需要留意标准误膨胀，但通常还不是严重共线性。';
    } else {
      text.textContent = 'VIF 偏高：变量高度相关会放大标准误，导致系数不稳定、P 值变大或方向摇摆。';
    }
  };
  slider.addEventListener('input', update);
  update();
}

function renderMultiregGuide(el) {
  ensureMultiregStyles();
  if (el.dataset.type === 'multireg-vif-demo') {
    renderVifDemo(el);
    return;
  }
  const config = GUIDE_CARDS[el.dataset.type];
  if (!config) {
    el.innerHTML = '<div class="multireg-card">未配置的多元回归教学组件</div>';
    return;
  }
  renderGuide(el, config);
}

registerViz('multireg-formula-guide', renderMultiregGuide);
registerViz('multireg-coef-guide', renderMultiregGuide);
registerViz('multireg-metrics-guide', renderMultiregGuide);
registerViz('multireg-diagnostics-guide', renderMultiregGuide);
registerViz('multireg-vif-demo', renderMultiregGuide);
registerViz('multireg-selection-guide', renderMultiregGuide);
