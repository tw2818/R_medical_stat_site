import { registerViz } from './_core.js';

const STATIC_GUIDES = {
  'diagnostic-metrics-guide': {
    icon: '🧪',
    title: '诊断试验四格表怎么读',
    cards: [
      ['灵敏度 Sensitivity', '真实患病者中被检出的比例：a/(a+c)。用于回答“别漏掉患者”的能力。', '检出患者'],
      ['特异度 Specificity', '真实未患病者中被排除的比例：d/(b+d)。用于回答“别误伤正常人”的能力。', '排除非病'],
      ['预测值 PPV/NPV', '阳性/阴性结果有多可信，受疾病患病率影响明显，不能只看检验本身。', '临床解释'],
      ['似然比 LR+/LR-', '把检验结果转化为诊后概率，比单看阳性/阴性更适合临床决策。', '概率更新'],
    ],
  },
  'auc-interpretation-guide': {
    icon: '📈',
    title: 'AUC 如何解释',
    cards: [
      ['0.5', '接近随机猜测，指标没有区分能力。', '无效'],
      ['0.7 左右', '有一定区分能力，但通常不足以单独决定诊断。', '一般'],
      ['0.8–0.9', '区分能力较好，可作为候选诊断或预测指标。', '较好'],
      ['接近 1', '近乎完美，但也要警惕样本量小、过拟合或验证不足。', '谨慎'],
    ],
  },
  'roc-reporting-guide': {
    icon: '🧾',
    title: 'pROC 结果报告要点',
    cards: [
      ['response', '真实结局变量，要确认阳性/阴性水平方向是否正确。', '结局'],
      ['predictor', '连续指标或模型预测概率，而不是最终分类标签。', '预测值'],
      ['AUC + CI', '报告 AUC 时最好同时给 95%CI，必要时做模型间比较。', '区间'],
      ['cutoff', '最佳截点常用 Youden 指数，但临床上还要看漏诊/误诊代价。', '截点'],
    ],
  },
  'prediction-roc-guide': {
    icon: '🤖',
    title: '预测模型中的 ROC：用概率，不是用硬分类',
    cards: [
      ['硬分类', '只有“阳性/阴性”一个结果，只对应一个四格表和一个点。', 'Class'],
      ['预测概率', '每个样本都有 0–1 的风险分数，可改变阈值得到整条 ROC 曲线。', 'Risk'],
      ['模型比较', '比较 AUC 时要在同一验证集上进行，避免训练集乐观偏倚。', 'Compare'],
      ['临床落地', 'ROC 反映区分度，但不能替代校准曲线、DCA 和外部验证。', 'Use'],
    ],
  },
};

function ensureRocGuideStyles() {
  if (document.getElementById('roc-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'roc-guide-styles';
  style.textContent = `
    .roc-guide-card{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:960px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .roc-guide-header{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .roc-guide-icon{font-size:18px;line-height:1;}
    .roc-guide-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px;}
    .roc-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 14px;box-shadow:0 2px 8px rgba(15,23,42,.035);min-height:130px;}
    .roc-guide-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:11px;}
    .roc-guide-title{font-size:16px;font-weight:750;line-height:1.35;color:#0f172a;margin:0 0 8px;}
    .roc-guide-desc{font-size:13.5px;line-height:1.7;color:#64748b;margin:0;}
    .roc-trade-body{display:grid;grid-template-columns:280px 1fr;gap:14px;padding:14px;}
    .roc-trade-controls,.roc-trade-panel{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;}
    .roc-trade-controls label{display:block;margin:0 0 12px;color:#334155;font-size:13px;font-weight:700;}
    .roc-trade-controls input[type="range"]{width:100%;margin-top:8px;}
    .roc-trade-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px;}
    .roc-stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:9px;text-align:center;}
    .roc-stat b{display:block;color:#0f172a;font-size:15px;margin-bottom:3px;}
    .roc-stat span{font-size:12px;color:#64748b;}
    .roc-threshold-table{width:100%;border-collapse:collapse;font-size:13px;color:#334155;}
    .roc-threshold-table th,.roc-threshold-table td{border-bottom:1px solid #e2e8f0;padding:7px 8px;text-align:center;}
    .roc-threshold-table th{background:#f8fafc;color:#475569;font-weight:750;}
    .roc-note{font-size:13px;line-height:1.65;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin:10px 0 0;}
    @media (max-width:980px){.roc-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.roc-trade-body{grid-template-columns:1fr;}}
    @media (max-width:640px){.roc-guide-grid{grid-template-columns:1fr;}.roc-guide-item{min-height:auto;}.roc-trade-stats{grid-template-columns:repeat(2,minmax(0,1fr));}}
  `;
  document.head.appendChild(style);
}

function renderRocStatic(el) {
  ensureRocGuideStyles();
  const config = STATIC_GUIDES[el.dataset.type] || STATIC_GUIDES['diagnostic-metrics-guide'];
  const title = el.dataset.title || config.title;
  el.innerHTML = `
    <section class="roc-guide-card" aria-label="${title}">
      <div class="roc-guide-header"><span class="roc-guide-icon">${config.icon}</span><span>${title}</span></div>
      <div class="roc-guide-grid">
        ${config.cards.map(([heading, desc, badge]) => `
          <article class="roc-guide-item">
            <span class="roc-guide-badge">${badge}</span>
            <h4 class="roc-guide-title">${heading}</h4>
            <p class="roc-guide-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

const DEMO_VALUES = [52, 82, 114, 63, 98, 63, 74, 80, 83, 99, 43, 55, 49, 66, 45, 46, 56, 43, 61, 65, 51, 43, 47, 45, 68, 61, 53, 60, 46, 30];
const DEMO_LABELS = DEMO_VALUES.map((_, idx) => idx < 10 ? 1 : 0);

function metricsAtCutoff(cutoff) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  DEMO_VALUES.forEach((value, idx) => {
    const positive = value > cutoff;
    const diseased = DEMO_LABELS[idx] === 1;
    if (positive && diseased) tp += 1;
    else if (positive && !diseased) fp += 1;
    else if (!positive && diseased) fn += 1;
    else tn += 1;
  });
  const sens = tp / (tp + fn || 1);
  const spec = tn / (tn + fp || 1);
  return { tp, fp, tn, fn, sens, spec, youden: sens + spec - 1 };
}

function renderThresholdTradeoff(el) {
  ensureRocGuideStyles();
  const id = `roc-threshold-${Math.random().toString(36).slice(2, 8)}`;
  const title = el.dataset.title || '截断值改变时，灵敏度和特异度怎么变';
  el.innerHTML = `
    <section class="roc-guide-card" aria-label="${title}">
      <div class="roc-guide-header"><span class="roc-guide-icon">🎚️</span><span>${title}</span></div>
      <div class="roc-trade-body">
        <div class="roc-trade-controls">
          <label>CA125 截断值：<span id="${id}-cutoff-label">60</span>
            <input id="${id}-cutoff" type="range" min="30" max="113" value="60" step="1">
          </label>
          <p class="roc-note">移动截断值会改变四格表。截断值越低，通常越不容易漏诊，但误诊会增加；截断值越高则相反。</p>
        </div>
        <div class="roc-trade-panel">
          <div class="roc-trade-stats" id="${id}-stats"></div>
          <table class="roc-threshold-table" aria-label="当前截断值四格表">
            <thead><tr><th></th><th>真实肿瘤</th><th>真实非肿瘤</th></tr></thead>
            <tbody id="${id}-table"></tbody>
          </table>
          <p class="roc-note" id="${id}-note"></p>
        </div>
      </div>
    </section>
  `;
  const slider = document.getElementById(`${id}-cutoff`);
  const label = document.getElementById(`${id}-cutoff-label`);
  const stats = document.getElementById(`${id}-stats`);
  const table = document.getElementById(`${id}-table`);
  const note = document.getElementById(`${id}-note`);

  function render() {
    const cutoff = Number(slider.value);
    const m = metricsAtCutoff(cutoff);
    label.textContent = cutoff;
    stats.innerHTML = [
      ['灵敏度', m.sens], ['特异度', m.spec], ['1-特异度', 1 - m.spec], ['Youden', m.youden],
    ].map(([name, value]) => `<div class="roc-stat"><b>${value.toFixed(2)}</b><span>${name}</span></div>`).join('');
    table.innerHTML = `
      <tr><th>判断肿瘤</th><td>${m.tp}</td><td>${m.fp}</td></tr>
      <tr><th>判断非肿瘤</th><td>${m.fn}</td><td>${m.tn}</td></tr>
    `;
    note.textContent = `当前 cutoff=${cutoff}：ROC 曲线上的点是 (1-特异度=${(1 - m.spec).toFixed(2)}, 灵敏度=${m.sens.toFixed(2)})。`;
  }
  slider.addEventListener('input', render);
  render();
}

registerViz('diagnostic-metrics-guide', renderRocStatic);
registerViz('roc-threshold-tradeoff', renderThresholdTradeoff);
registerViz('auc-interpretation-guide', renderRocStatic);
registerViz('roc-reporting-guide', renderRocStatic);
registerViz('prediction-roc-guide', renderRocStatic);
