import { registerViz } from './_core.js';

const STATIC_GUIDES = {
  'randomization-methods': {
    icon: '🎲',
    title: '随机分组怎么选',
    cards: [
      ['简单随机', '每个受试者独立随机，最容易实现；样本量小时组间人数可能不平衡。', '入门'],
      ['完全随机', '预先固定各组人数，再打乱分配顺序；适合需要严格 1:1 的设计。', '平衡'],
      ['区组随机', '每个区组内保持比例平衡，适合受试者逐个入组的临床试验。', '临床常用'],
      ['分层随机', '先按关键预后因素分层，再在层内随机；适合性别、中心等因素很重要时。', '控制混杂'],
    ],
  },
  'block-random-flow': {
    icon: '🧱',
    title: '区组随机：逐个入组时保持平衡',
    cards: [
      ['设定区组', '例如每 4 或 6 名受试者组成一个区组，区组大小可固定或随机。', 'Block'],
      ['区组内打乱', '在每个区组中放入等量的试验组/对照组标签，再随机排列。', 'Shuffle'],
      ['按顺序发放', '受试者逐个入组时，按随机表顺序拿到下一个分配结果。', 'Sequence'],
      ['做好隐匿', '区组大小过小且固定时可能被猜到下一组，临床试验要配合分配隐藏。', 'Concealment'],
    ],
  },
  'stratified-random-matrix': {
    icon: '🧬',
    title: '分层随机：先分层，再在层内随机',
    cards: [
      ['选择分层因素', '只选少数关键因素，如性别、中心、疾病分期；分层太多会让执行变复杂。', 'Strata'],
      ['层内独立随机', '男性 60 例和女性 60 例分别生成随机表，而不是混在一起随机。', 'Within'],
      ['各组保持平衡', '本例每个性别层内 4 组各 15 例，合并后总体也更均衡。', 'Balance'],
      ['报告要说明', '方案和论文中应写清分层因素、区组大小、随机比例和隐藏方法。', 'Report'],
    ],
  },
  'allocation-concealment-note': {
    icon: '✉️',
    title: '随机表生成后：重点是分配隐藏',
    cards: [
      ['随机序列', '由非实施者或独立系统生成，并保存随机种子/软件/版本信息。', 'Generate'],
      ['隐藏分配', '信封或中心随机系统应确保入组前看不到下一位受试者分组。', 'Hide'],
      ['按序执行', '受试者编号、信封编号、入组顺序要一一对应，避免跳号或补抽。', 'Apply'],
      ['留痕审计', '保留随机表、开启记录、偏离记录，便于监查和论文方法学描述。', 'Audit'],
    ],
  },
};

function ensureRandomizationGuideStyles() {
  if (document.getElementById('randomization-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'randomization-guide-styles';
  style.textContent = `
    .rg-guide-card{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:960px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .rg-guide-header{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .rg-guide-icon{font-size:18px;line-height:1;}
    .rg-guide-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px;}
    .rg-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 14px;box-shadow:0 2px 8px rgba(15,23,42,.035);min-height:130px;}
    .rg-guide-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:11px;}
    .rg-guide-title{font-size:16px;font-weight:750;line-height:1.35;color:#0f172a;margin:0 0 8px;}
    .rg-guide-desc{font-size:13.5px;line-height:1.7;color:#64748b;margin:0;}
    .rg-balance-body{display:grid;grid-template-columns:280px 1fr;gap:14px;padding:14px;}
    .rg-balance-controls,.rg-balance-panel{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;}
    .rg-balance-controls label{display:block;margin:0 0 12px;color:#334155;font-size:13px;font-weight:700;}
    .rg-balance-controls input[type="range"]{width:100%;margin-top:8px;}
    .rg-balance-button{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:9px;background:#4f46e5;color:#fff;font-size:13px;font-weight:750;padding:8px 12px;cursor:pointer;box-shadow:0 2px 8px rgba(79,70,229,.25);}
    .rg-balance-bars{display:grid;gap:10px;margin:2px 0 12px;}
    .rg-balance-row{display:grid;grid-template-columns:90px 1fr 64px;align-items:center;gap:10px;font-size:13px;color:#334155;}
    .rg-balance-track{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden;}
    .rg-balance-fill{height:100%;border-radius:999px;background:#818cf8;}
    .rg-balance-note{font-size:13px;line-height:1.65;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin:0;}
    .rg-mini-seq{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;}
    .rg-chip{font-size:12px;font-weight:750;padding:4px 7px;border-radius:999px;background:#eef2ff;color:#3730a3;}
    .rg-chip.control{background:#ecfeff;color:#155e75;}
    @media (max-width:980px){.rg-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.rg-balance-body{grid-template-columns:1fr;}}
    @media (max-width:640px){.rg-guide-grid{grid-template-columns:1fr;}.rg-guide-item{min-height:auto;}.rg-balance-row{grid-template-columns:74px 1fr 52px;}}
  `;
  document.head.appendChild(style);
}

function renderRandomizationStatic(el) {
  ensureRandomizationGuideStyles();
  const type = el.dataset.type;
  const config = STATIC_GUIDES[type] || STATIC_GUIDES['randomization-methods'];
  const title = el.dataset.title || config.title;
  el.innerHTML = `
    <section class="rg-guide-card" aria-label="${title}">
      <div class="rg-guide-header"><span class="rg-guide-icon">${config.icon}</span><span>${title}</span></div>
      <div class="rg-guide-grid">
        ${config.cards.map(([heading, desc, badge]) => `
          <article class="rg-guide-item">
            <span class="rg-guide-badge">${badge}</span>
            <h4 class="rg-guide-title">${heading}</h4>
            <p class="rg-guide-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function simulateSimpleRandom(n, seed) {
  let state = seed;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    out.push((state / 2 ** 32) < 0.5 ? 'T' : 'C');
  }
  return out;
}

function renderSimpleBalance(el) {
  ensureRandomizationGuideStyles();
  const id = `rg-balance-${Math.random().toString(36).slice(2, 8)}`;
  const title = el.dataset.title || '简单随机 vs 完全随机：人数平衡差别';
  el.innerHTML = `
    <section class="rg-guide-card" aria-label="${title}">
      <div class="rg-guide-header"><span class="rg-guide-icon">⚖️</span><span>${title}</span></div>
      <div class="rg-balance-body">
        <div class="rg-balance-controls">
          <label>受试者数量 N：<span id="${id}-n-label">30</span>
            <input id="${id}-n" type="range" min="20" max="200" value="30" step="10">
          </label>
          <button class="rg-balance-button" id="${id}-reroll" type="button">重新模拟简单随机</button>
          <p class="rg-balance-note" style="margin-top:12px;">简单随机像连续抛硬币；完全随机则先固定各组人数再打乱顺序。这个交互只用于说明“人数是否平衡”这一点。</p>
        </div>
        <div class="rg-balance-panel">
          <div class="rg-balance-bars" id="${id}-bars"></div>
          <p class="rg-balance-note" id="${id}-note"></p>
          <div class="rg-mini-seq" id="${id}-seq" aria-label="前20个分组结果"></div>
        </div>
      </div>
    </section>
  `;

  let seed = 20260427;
  const nSlider = document.getElementById(`${id}-n`);
  const nLabel = document.getElementById(`${id}-n-label`);
  const bars = document.getElementById(`${id}-bars`);
  const note = document.getElementById(`${id}-note`);
  const seq = document.getElementById(`${id}-seq`);
  const reroll = document.getElementById(`${id}-reroll`);

  function render() {
    const n = Number(nSlider.value);
    const simple = simulateSimpleRandom(n, seed);
    const simpleT = simple.filter(v => v === 'T').length;
    const completeT = Math.floor(n / 2);
    const rows = [
      ['简单随机', simpleT, n - simpleT, '#818cf8'],
      ['完全随机', completeT, n - completeT, '#14b8a6'],
    ];
    nLabel.textContent = n;
    bars.innerHTML = rows.map(([label, t, c, color]) => {
      const pct = Math.round((t / n) * 100);
      return `
        <div class="rg-balance-row">
          <strong>${label}</strong>
          <div class="rg-balance-track"><div class="rg-balance-fill" style="width:${pct}%;background:${color};"></div></div>
          <span>${t}:${c}</span>
        </div>
      `;
    }).join('');
    const imbalance = Math.abs(simpleT - (n - simpleT));
    note.textContent = `本次简单随机的两组人数差为 ${imbalance}。样本量越小，简单随机越容易出现肉眼可见的不平衡；完全随机可以保证预设比例。`;
    seq.innerHTML = simple.slice(0, 20).map(v => `<span class="rg-chip ${v === 'C' ? 'control' : ''}">${v}</span>`).join('');
  }

  nSlider.addEventListener('input', render);
  reroll.addEventListener('click', () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    render();
  });
  render();
}

registerViz('randomization-methods', renderRandomizationStatic);
registerViz('simple-random-balance', renderSimpleBalance);
registerViz('block-random-flow', renderRandomizationStatic);
registerViz('stratified-random-matrix', renderRandomizationStatic);
registerViz('allocation-concealment-note', renderRandomizationStatic);
