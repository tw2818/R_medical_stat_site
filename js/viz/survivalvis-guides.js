import { registerViz } from './_core.js';

const STYLE_ID = 'survivalvis-guides-style';

const GUIDE_CARDS = {
  'survivalvis-anatomy-guide': {
    badge: 'plot anatomy',
    icon: 'KM',
    title: '一张 ggsurvplot 图应该先读哪几层',
    lead: '生存曲线图不是只有一条线。主曲线、置信区间、删失标记、中位生存线、P 值、risk table 和 ncensor plot 分别回答不同问题。',
    steps: [
      ['主曲线', '每次发生事件时曲线下降；删失只减少后续风险集人数，不直接让曲线下降。'],
      ['置信区间 / 中位线', 'conf.int 展示估计不确定性；surv.median.line 用水平和垂直辅助线定位中位生存时间。'],
      ['表格层', 'risk.table 解释每个时间点还剩多少人在风险集中；ncensor.plot 显示删失人数随时间的分布。']
    ],
    note: '读图顺序：先看曲线方向和分离程度，再看删失与风险集，最后看 P 值和置信区间。'
  },
  'survivalvis-parameter-map-guide': {
    badge: 'parameter map',
    icon: 'args',
    title: '把 ggsurvplot 参数按用途归类',
    lead: '本章参数很多，建议按“统计含义层、读图辅助层、外观层、分面/组合层”来记，而不是逐个死记函数参数。',
    steps: [
      ['统计含义', 'fun = "event" 显示累计事件概率，fun = "cumhaz" 显示累计风险；它们改变纵轴含义。'],
      ['读图辅助', 'risk.table、ncensor.plot、surv.median.line、pval 帮助解释曲线背后的风险集和检验结果。'],
      ['外观与布局', 'palette、ggtheme、xlim、break.time.by、facet.by、group.by 控制颜色、主题、坐标与拆图方式。']
    ],
    note: '参数选择先服务于读图目的，再做美化；不要为了“好看”牺牲 status 编码、风险表和纵轴含义的清晰度。'
  },
  'survivalvis-combine-guide': {
    badge: 'multi-curve tools',
    icon: 'list',
    title: '分面、拆图、合并曲线：四个函数怎么选',
    lead: '同样是多条生存曲线，survminer 提供了不同组织方式：放同一坐标系、分面、按组拆成列表，或把多个终点合并到一张图。',
    steps: [
      ['ggsurvplot_facet()', '一个模型按变量分面显示，适合比较同一模型在多个层级中的曲线形态。'],
      ['ggsurvplot_group_by()', '按某个变量把数据拆组后分别出图，适合输出多张独立图。'],
      ['ggsurvplot_combine()', '把 PFS、OS 等多个 survfit 对象合并到同一张图，适合多终点对照展示。']
    ],
    note: '如果目标是“同一人群不同终点”，优先想 combine；如果目标是“同一终点不同亚组”，优先想 facet 或 group_by。'
  },
  'survivalvis-warning-guide': {
    badge: 'warning literacy',
    icon: '!',
    title: '本章 geom_segment() warning 怎么看',
    lead: '这些 geom_segment() warning 是 ggplot2 对辅助线图层的长度提示，常见于中位生存线、辅助线或 annotation 层与分组数据长度不一致时。',
    steps: [
      ['不是主曲线失败', '如果图形、risk table 和主要曲线仍正常出现，warning 多半不影响本章的核心教学结论。'],
      ['应该保留', '课程中保留 warning 可以提醒读者：复制代码后看到提示不要立刻误判为统计模型错误。'],
      ['何时处理', '正式制图时可用 annotate() 或提供单行辅助图层数据来减少提示。']
    ],
    note: '区分 warning、error 和统计结论错误：warning 需要解释，error 才会中断运行。'
  }
};

const RISK_TABLE_POINTS = [
  { time: 0, atRisk: 138, events: 0, censored: 0, comment: '起点时所有受试者都还在风险集中，曲线尚未因为事件下降。' },
  { time: 100, atRisk: 114, events: 20, censored: 4, comment: '事件会让曲线阶梯式下降，删失不会让曲线下降，但会减少之后的 at risk。' },
  { time: 200, atRisk: 79, events: 45, censored: 14, comment: '时间越往后，风险集变小；尾部曲线的不确定性通常更大。' },
  { time: 300, atRisk: 50, events: 67, censored: 21, comment: 'risk table 让读者知道后段曲线基于多少人，而不是只看线条形状。' },
  { time: 500, atRisk: 20, events: 94, censored: 24, comment: '尾部 at risk 很少时，曲线跳动和置信区间都要更谨慎解释。' }
];

const GROUPING_SCENARIOS = {
  facet: {
    label: '按 rx / adhere 分面展示同一模型',
    fn: 'ggsurvplot_facet()',
    example: 'ggsurvplot_facet(fit, colon, facet.by = c("rx", "adhere"))',
    advice: '适合在一页内比较多个分层面板，强调不同亚组中的曲线形态。'
  },
  group: {
    label: '按治疗方式拆成多张独立图',
    fn: 'ggsurvplot_group_by()',
    example: 'ggsurvplot_group_by(fit, colon, group.by = "rx")',
    advice: '适合每个组需要单独导出或单独排版时使用。'
  },
  addall: {
    label: '在分组曲线上叠加总体曲线',
    fn: 'add.all = TRUE',
    example: 'ggsurvplot(fit, data = lung, add.all = TRUE)',
    advice: '适合让读者同时看到分组曲线与全人群平均趋势。'
  },
  combine: {
    label: '把 PFS 和 OS 放到同一张图',
    fn: 'ggsurvplot_combine()',
    example: 'ggsurvplot_combine(list(PFS = pfs, OS = os), demo.data)',
    advice: '适合多终点曲线对照；注意图例要清楚说明每条线代表的终点。'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .survivalvis-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .survivalvis-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .survivalvis-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#0f766e,#2563eb);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 8px 18px rgba(15,118,110,.22);padding:0 8px;}
    .survivalvis-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .survivalvis-guide-badge{display:inline-block;background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .survivalvis-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .survivalvis-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:12px;}
    .survivalvis-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .survivalvis-guide-item strong{display:block;color:#115e59;margin-bottom:6px;}
    .survivalvis-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #38bdf8;border-radius:10px;padding:10px 12px;}
    .survivalvis-demo-panel{display:grid;grid-template-columns:minmax(220px,.85fr) minmax(270px,1.15fr);gap:14px;align-items:stretch;}
    .survivalvis-demo-control,.survivalvis-demo-output{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;}
    .survivalvis-demo-control label{display:block;font-weight:700;color:#115e59;margin-bottom:8px;}
    .survivalvis-demo-control input[type="range"],.survivalvis-demo-control select{width:100%;accent-color:#0f766e;}
    .survivalvis-demo-metric{font-size:24px;font-weight:800;color:#0f172a;margin:4px 0;}
    .survivalvis-demo-small{font-size:13px;color:#64748b;line-height:1.65;}
    .survivalvis-kv{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0;}
    .survivalvis-kv div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px;text-align:center;}
    .survivalvis-kv strong{display:block;color:#0f766e;font-size:18px;}
    .survivalvis-code-pill{display:block;background:#0f172a;color:#e2e8f0;border-radius:12px;padding:10px;margin:8px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;white-space:normal;}
    @media(max-width:720px){.survivalvis-demo-panel{grid-template-columns:1fr}.survivalvis-guide-card{padding:14px}.survivalvis-guide-head{align-items:flex-start}.survivalvis-kv{grid-template-columns:1fr}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['survivalvis-anatomy-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="survivalvis-guide-card">
      <div class="survivalvis-guide-head">
        <div class="survivalvis-guide-icon">${cfg.icon}</div>
        <div><span class="survivalvis-guide-badge">${cfg.badge}</span><h3 class="survivalvis-guide-title">${title}</h3></div>
      </div>
      <p class="survivalvis-guide-lead">${cfg.lead}</p>
      <div class="survivalvis-guide-grid">
        ${cfg.steps.map(([title, text]) => `<div class="survivalvis-guide-item"><strong>${title}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="survivalvis-guide-note">${cfg.note}</div>
    </div>`;
}

function renderRiskTableDemo(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || '交互理解 risk table：曲线后面还剩多少人');
  el.innerHTML = `
    <div class="survivalvis-guide-card">
      <div class="survivalvis-guide-head">
        <div class="survivalvis-guide-icon">risk</div>
        <div><span class="survivalvis-guide-badge">interactive risk table</span><h3 class="survivalvis-guide-title">${title}</h3></div>
      </div>
      <div class="survivalvis-demo-panel">
        <div class="survivalvis-demo-control">
          <label>读图时间点：<span data-role="time-label">0</span> 天</label>
          <input type="range" min="0" max="4" value="0" step="1" data-role="time-index">
          <p class="survivalvis-demo-small">拖动滑块模拟在不同横轴时间点读取 risk table。数值为教学示意，用来说明 at risk、events、censored 的关系。</p>
        </div>
        <div class="survivalvis-demo-output">
          <div class="survivalvis-kv">
            <div><strong data-role="at-risk">138</strong><span>at risk</span></div>
            <div><strong data-role="events">0</strong><span>events</span></div>
            <div><strong data-role="censored">0</strong><span>censored</span></div>
          </div>
          <p class="survivalvis-demo-small" data-role="comment"></p>
        </div>
      </div>
    </div>`;
  const input = el.querySelector('[data-role="time-index"]');
  const timeLabel = el.querySelector('[data-role="time-label"]');
  const atRisk = el.querySelector('[data-role="at-risk"]');
  const events = el.querySelector('[data-role="events"]');
  const censored = el.querySelector('[data-role="censored"]');
  const comment = el.querySelector('[data-role="comment"]');
  const update = () => {
    const point = RISK_TABLE_POINTS[Number(input.value)];
    timeLabel.textContent = point.time;
    atRisk.textContent = point.atRisk;
    events.textContent = point.events;
    censored.textContent = point.censored;
    comment.textContent = point.comment;
  };
  input.addEventListener('input', update);
  update();
}

function renderGroupingGuide(el) {
  ensureStyles();
  const title = escapeHtml(el.dataset.title || '场景选择：facet、group_by、add.all 还是 combine');
  el.innerHTML = `
    <div class="survivalvis-guide-card">
      <div class="survivalvis-guide-head">
        <div class="survivalvis-guide-icon">plot</div>
        <div><span class="survivalvis-guide-badge">interactive function chooser</span><h3 class="survivalvis-guide-title">${title}</h3></div>
      </div>
      <div class="survivalvis-demo-panel">
        <div class="survivalvis-demo-control">
          <label for="survivalvis-grouping-choice">选择绘图目标</label>
          <select id="survivalvis-grouping-choice" data-role="scenario">
            <option value="facet">多变量分面展示</option>
            <option value="group">按组拆成多张图</option>
            <option value="addall">叠加总体曲线</option>
            <option value="combine">多个终点合并展示</option>
          </select>
          <p class="survivalvis-demo-small">同样是“多条线”，先判断研究问题，再选择函数。</p>
        </div>
        <div class="survivalvis-demo-output">
          <div class="survivalvis-demo-small" data-role="label"></div>
          <div class="survivalvis-demo-metric" data-role="fn"></div>
          <code class="survivalvis-code-pill" data-role="example"></code>
          <p class="survivalvis-demo-small" data-role="advice"></p>
        </div>
      </div>
    </div>`;
  const select = el.querySelector('[data-role="scenario"]');
  const label = el.querySelector('[data-role="label"]');
  const fn = el.querySelector('[data-role="fn"]');
  const example = el.querySelector('[data-role="example"]');
  const advice = el.querySelector('[data-role="advice"]');
  const update = () => {
    const cfg = GROUPING_SCENARIOS[select.value];
    label.textContent = cfg.label;
    fn.textContent = cfg.fn;
    example.textContent = cfg.example;
    advice.textContent = cfg.advice;
  };
  select.addEventListener('change', update);
  update();
}

registerViz('survivalvis-anatomy-guide', renderGuide);
registerViz('survivalvis-risk-table-demo', renderRiskTableDemo);
registerViz('survivalvis-parameter-map-guide', renderGuide);
registerViz('survivalvis-grouping-guide', renderGroupingGuide);
registerViz('survivalvis-combine-guide', renderGuide);
registerViz('survivalvis-warning-guide', renderGuide);
