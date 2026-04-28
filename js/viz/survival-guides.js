import { registerViz } from './_core.js';

const STYLE_ID = 'survival-guides-style';

const GUIDE_CARDS = {
  'survival-censor-riskset-guide': {
    badge: 'time + event + censor',
    icon: 'S(t)',
    title: '先读懂 Surv(time, status)：时间、事件、删失',
    lead: '生存分析的结局不是单个 0/1，而是“随访时间 + 事件状态”。带 + 的观察表示删失：到最后一次随访还没有观察到终点。',
    steps: [
      ['time', '从起点到事件或末次随访的时间，本章 lung 数据以天为单位。'],
      ['status', '本章前半把死亡记为 1、删失记为 0；Cox 段使用 survival 原始编码时 2 表示死亡。'],
      ['risk set', '每个事件时间点只把此前仍在随访中的受试者放进风险集，KM 与 Cox 都依赖它。']
    ],
    note: '读图口诀：曲线下降来自事件，曲线上 +/短线来自删失；删失不会让曲线下降，但会减少后续风险集人数。'
  },
  'survival-km-logrank-guide': {
    badge: 'KM → logrank',
    icon: 'KM',
    title: '从寿命表到 logrank：描述曲线，再比较曲线',
    lead: 'survfit() 给出生存概率、风险集和置信区间；survdiff() 则把两组每个事件时点的观察事件数 O 与期望事件数 E 累积起来检验曲线差异。',
    steps: [
      ['寿命表', 'n.risk、n.event、n.censor、surv、lower/upper 是 KM 图背后的表。'],
      ['logrank 输出', '本例 sex=1 观察死亡 112，高于期望 91.6；sex=2 观察死亡 53，低于期望 73.4。'],
      ['检验结论', 'Chisq=10.3，df=1，p≈0.00131，提示两条生存曲线不同。']
    ],
    note: 'KM 图回答“生存过程长什么样”，logrank 回答“不同组的曲线差异是否超过随机波动”。'
  },
  'survival-cox-hr-bridge-guide': {
    badge: 'Cox ↔ Logistic',
    icon: 'HR',
    title: 'Cox 回归怎么承接 Logistic 回归',
    lead: '第21章 Logistic 只建模是否发生事件；Cox 回归同时利用事件是否发生与发生时间，因此效应量从 OR 变为 HR（风险比）。',
    steps: [
      ['Logistic', 'glm(..., family=binomial)：结局是二分类，exp(β) 常解释为 OR。'],
      ['Cox', 'coxph(Surv(time,status)~x)：结局是生存时间+事件状态，exp(β) 解释为 HR。'],
      ['分类变量', '因子水平与参考组仍通过 model matrix / contrast 进入模型，逻辑与第24章一致。']
    ],
    note: '本例 sexmale HR=0.608：在当前编码下，male 相对 female 的瞬时风险约为 0.61 倍；解释时必须同时说明参考组。'
  },
  'survival-ph-diagnostic-guide': {
    badge: 'PH assumption',
    icon: 'PH',
    title: '比例风险假设：Cox 模型的关键门槛',
    lead: 'Cox 模型默认 HR 不随时间系统改变。cox.zph() 用 Schoenfeld 残差检查这种时间趋势；若 p 值较小，要考虑时间分层或时间依存系数。',
    steps: [
      ['变量检验', '本例 ph.karno：χ²=8.017，P=0.0046，提示 HR 随时间变化。'],
      ['整体检验', 'GLOBAL P=0.0157，说明模型整体也存在 PH 假设问题。'],
      ['处理分支', '可用 strata(tgroup) 分段，也可用 tt() 构造随时间变化的系数。']
    ],
    note: '不要只看 Cox 回归的 HR 表；PH 检验不通过时，单一 HR 可能掩盖“早期有效、后期减弱”等时间变化。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .survival-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .survival-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .survival-guide-icon{width:46px;height:46px;border-radius:15px;background:linear-gradient(135deg,#0f766e,#2563eb);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;box-shadow:0 8px 18px rgba(15,118,110,.22);}
    .survival-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .survival-guide-badge{display:inline-block;background:#ccfbf1;color:#0f766e;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .survival-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .survival-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:12px;}
    .survival-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;}
    .survival-guide-item strong{display:block;color:#115e59;margin-bottom:6px;}
    .survival-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #14b8a6;border-radius:10px;padding:10px 12px;}
    .survival-demo-panel{display:grid;grid-template-columns:minmax(220px,.85fr) minmax(260px,1.15fr);gap:14px;align-items:stretch;}
    .survival-demo-control,.survival-demo-output{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;}
    .survival-demo-control label{display:block;font-weight:700;color:#115e59;margin-bottom:8px;}
    .survival-demo-control input[type="range"]{width:100%;accent-color:#0f766e;}
    .survival-demo-metric{font-size:24px;font-weight:800;color:#0f172a;}
    .survival-demo-small{font-size:13px;color:#64748b;line-height:1.65;}
    .survival-split-row{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0;}
    .survival-split-cell{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px;text-align:center;font-size:13px;}
    .survival-split-head{font-weight:800;color:#0f766e;background:#ecfeff;}
    @media(max-width:720px){.survival-demo-panel{grid-template-columns:1fr}.survival-guide-card{padding:14px}.survival-guide-head{align-items:flex-start}.survival-split-row{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function renderGuide(el) {
  ensureStyles();
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['survival-censor-riskset-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="survival-guide-card">
      <div class="survival-guide-head">
        <div class="survival-guide-icon">${cfg.icon}</div>
        <div><span class="survival-guide-badge">${cfg.badge}</span><h3 class="survival-guide-title">${title}</h3></div>
      </div>
      <p class="survival-guide-lead">${cfg.lead}</p>
      <div class="survival-guide-grid">
        ${cfg.steps.map(([title, text]) => `<div class="survival-guide-item"><strong>${title}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="survival-guide-note">${cfg.note}</div>
    </div>`;
}

function renderLogrankDemo(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || '交互理解 logrank：O-E 越大，卡方越大');
  el.innerHTML = `
    <div class="survival-guide-card">
      <div class="survival-guide-head">
        <div class="survival-guide-icon">χ²</div>
        <div><span class="survival-guide-badge">interactive logrank</span><h3 class="survival-guide-title">${title}</h3></div>
      </div>
      <div class="survival-demo-panel">
        <div class="survival-demo-control">
          <label>组间观察事件偏离程度：<span data-role="delta-label">20</span></label>
          <input type="range" min="0" max="30" value="20" step="1" data-role="delta">
          <p class="survival-demo-small">固定总事件数，拖动滑块模拟“男/女两组 observed 与 expected 的差距”。本章真实输出 sex=1: O=112, E=91.6；sex=2: O=53, E=73.4。</p>
        </div>
        <div class="survival-demo-output">
          <div class="survival-demo-small">近似 logrank 统计量</div>
          <div class="survival-demo-metric" data-role="chisq">10.3</div>
          <div class="survival-demo-small" data-role="explain"></div>
        </div>
      </div>
    </div>`;
  const input = el.querySelector('[data-role="delta"]');
  const label = el.querySelector('[data-role="delta-label"]');
  const chisq = el.querySelector('[data-role="chisq"]');
  const explain = el.querySelector('[data-role="explain"]');
  const update = () => {
    const delta = Number(input.value);
    // 本章 sex 分组 logrank 输出中 (O-E)^2/V≈10.3，O-E≈20.2，故 V 约为 39.6；这里固定 V 只作教学示意。
    const stat = (delta * delta / 39.6).toFixed(1);
    label.textContent = delta.toFixed(0);
    chisq.textContent = stat;
    explain.textContent = `示意：O-E≈${delta} 时，(O-E)²/V 约为 ${stat}。偏离越大，曲线差异越不容易用随机波动解释。`;
  };
  input.addEventListener('input', update);
  update();
}

function renderTimeSplitDemo(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || '交互理解 survSplit：把一个人拆成多段风险区间');
  el.innerHTML = `
    <div class="survival-guide-card">
      <div class="survival-guide-head">
        <div class="survival-guide-icon">split</div>
        <div><span class="survival-guide-badge">interactive survSplit</span><h3 class="survival-guide-title">${title}</h3></div>
      </div>
      <div class="survival-demo-panel">
        <div class="survival-demo-control">
          <label>第二个切点（天）：<span data-role="cut-label">180</span></label>
          <input type="range" min="120" max="260" value="180" step="10" data-role="cut">
          <p class="survival-demo-small">示意受试者 id=2，总随访到 411 天并在最后死亡；第一个切点固定为 90 天，第二个切点可拖动。</p>
        </div>
        <div class="survival-demo-output">
          <div class="survival-split-row">
            <div class="survival-split-cell survival-split-head">tstart</div><div class="survival-split-cell survival-split-head">time</div><div class="survival-split-cell survival-split-head">status</div><div class="survival-split-cell survival-split-head">tgroup</div>
          </div>
          <div data-role="rows"></div>
          <p class="survival-demo-small">只有最后一段保留事件 status=1；前面的拆分行表示仍处在风险集中但事件尚未发生。</p>
        </div>
      </div>
    </div>`;
  const input = el.querySelector('[data-role="cut"]');
  const label = el.querySelector('[data-role="cut-label"]');
  const rows = el.querySelector('[data-role="rows"]');
  const update = () => {
    const cut2 = Number(input.value);
    const intervals = [[0, 90, 0, 1], [90, cut2, 0, 2], [cut2, 411, 1, 3]];
    label.textContent = cut2.toFixed(0);
    rows.innerHTML = intervals.map(([start, end, status, group]) => `
      <div class="survival-split-row">
        <div class="survival-split-cell">${start}</div><div class="survival-split-cell">${end}</div><div class="survival-split-cell">${status}</div><div class="survival-split-cell">${group}</div>
      </div>`).join('');
  };
  input.addEventListener('input', update);
  update();
}

registerViz('survival-censor-riskset-guide', renderGuide);
registerViz('survival-km-logrank-guide', renderGuide);
registerViz('survival-logrank-oe-demo', renderLogrankDemo);
registerViz('survival-cox-hr-bridge-guide', renderGuide);
registerViz('survival-ph-diagnostic-guide', renderGuide);
registerViz('survival-time-split-demo', renderTimeSplitDemo);
