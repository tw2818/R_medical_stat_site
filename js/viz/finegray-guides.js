import { registerViz } from './_core.js';

const STYLE_ID = 'finegray-guides-style';

const GUIDE_CARDS = {
  'finegray-concept-guide': {
    badge: 'competing risk',
    icon: 'CR',
    title: '竞争风险模型的基本概念',
    lead: '竞争风险模型(Competing Risk Model)适用于多个终点的生存数据，处理存在竞争风险事件时的生存分析问题。',
    steps: [
      ['竞争风险事件', '可能阻止感兴趣事件发生或改变其发生概率的事件，如心梗死亡 vs 肿瘤复发'],
      ['累计发生函数', 'CIF：某时间点前特定事件（包括竞争事件）累计发生的概率'],
      ['与传统生存分析', '传统KM要求删失与事件独立；竞争风险模型显式处理竞争事件']
    ],
    note: '本章研究骨髓移植疗效，感兴趣事件为"复发"，竞争风险事件为"移植不良反应死亡"'
  },
  'finegray-cif-guide': {
    badge: 'CIF',
    icon: 'F(t)',
    title: '累计发生函数 CIF 解读',
    lead: '累计发生函数(Cumulative Incidence Function)描述在存在竞争风险时，特定事件在时间t前的累计发生概率。',
    steps: [
      ['CIF 计算', 'CIF(t) = Σ λ(s)×S(s)，其中λ(s)是子分布风险率，S(s)是 Kaplan-Meier 生存函数'],
      ['与1-S(t)的区别', '1-S(t)高估了感兴趣事件的累计发生率，因为未考虑竞争事件'],
      ['曲线解读', '曲线上升表示事件发生，水平段表示无新事件，+号表示删失']
    ],
    note: '图中 ALL1/AML1 为累计复发率，ALL2/AML2 为累计竞争风险事件发生率'
  },
  'finegray-fg-test-guide': {
    badge: 'Fine-Gray',
    icon: 'FG',
    title: 'Fine-Gray检验 vs log-rank 检验',
    lead: 'Fine-Gray检验是竞争风险版本的 log-rank 检验，用于比较组间累计发生率差异。',
    steps: [
      ['检验思想', '比较各组在每个时间点的子分布风险率差异，累积得到检验统计量'],
      ['结果解读', '第一行统计量=2.86, P=0.091：控制竞争风险后，两疾病类型累计复发率无显著差异'],
      ['与log-rank区别', 'log-rank假设无竞争风险；Fine-Gray考虑竞争事件的竞争效应']
    ],
    note: 'P=0.09067592 > 0.05，说明 ALL 和 AML 组的复发风险差异无统计学意义'
  },
  'finegray-crr-guide': {
    badge: 'crr',
    icon: 'HR',
    title: '竞争风险回归 crr() 结果解读',
    lead: 'crr() 函数拟合竞争风险回归模型，效应量 exp(coef) 为 SHR（子分布风险比）。',
    steps: [
      ['failcode=1', '指定感兴趣事件为1（本章为复发）；其他非0非1默认为竞争风险事件'],
      ['cencode=0', '指定删失为0'],
      ['exp(coef)', 'SHR > 1 表示该因素增加感兴趣事件风险；Phase SHR=1.514，p=0.00052 是显著影响因素']
    ],
    note: '多因素分析：Phase(疾病阶段)是复发的独立影响因素，SHR=1.514，95%CI 1.198-1.91'
  },
  'finegray-competing-event-guide': {
    badge: 'event type',
    icon: '0/1/2',
    title: '竞争事件与删失的区别',
    lead: 'Status 编码：0=删失、1=感兴趣事件、2=竞争风险事件，三类处理方式不同。',
    steps: [
      ['删失(0)', '到最后随访仍未观察到任何事件，可能是"永远不会发生"'],
      ['感兴趣事件(1)', '研究的主要终点，如本章的"复发"'],
      ['竞争事件(2)', '阻止感兴趣事件发生的其他事件，如本章的"移植不良反应死亡"']
    ],
    note: 'Fine-Gray模型对感兴趣事件和竞争事件采用不同的处理方式，删失者仍留在风险集'
  }
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .finegray-guide-card{background:#f6f7fb;border:1px solid #d9e0ea;border-radius:18px;padding:18px;margin:18px 0;box-shadow:0 10px 28px rgba(31,41,55,.08);color:#334155;}
    .finegray-guide-head{display:flex;gap:14px;align-items:center;margin-bottom:12px;}
    .finegray-guide-icon{min-width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;box-shadow:0 8px 18px rgba(147,51,234,.22);}
    .finegray-guide-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;}
    .finegray-guide-badge{display:inline-block;background:#f3e8ff;color:#7c3aed;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:4px;}
    .finegray-guide-lead{margin:8px 0 14px;color:#475569;line-height:1.75;}
    .finegray-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:12px;}
    .finegray-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;line-height:1.65;}
    .finegray-guide-item strong{display:block;color:#6d28d9;margin-bottom:6px;}
    .finegray-guide-note{margin-top:12px;font-size:13px;color:#64748b;background:#fff;border-left:4px solid #a855f7;border-radius:10px;padding:10px 12px;}
    @media(max-width:720px){.finegray-guide-card{padding:14px}.finegray-guide-head{align-items:flex-start}}
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
  const cfg = GUIDE_CARDS[el.dataset.type] || GUIDE_CARDS['finegray-concept-guide'];
  const title = escapeHtml(el.dataset.title || cfg.title);
  el.innerHTML = `
    <div class="finegray-guide-card">
      <div class="finegray-guide-head">
        <div class="finegray-guide-icon">${cfg.icon}</div>
        <div><span class="finegray-guide-badge">${cfg.badge}</span><h3 class="finegray-guide-title">${title}</h3></div>
      </div>
      <p class="finegray-guide-lead">${cfg.lead}</p>
      <div class="finegray-guide-grid">
        ${cfg.steps.map(([stepTitle, text]) => `<div class="finegray-guide-item"><strong>${stepTitle}</strong><span>${text}</span></div>`).join('')}
      </div>
      <div class="finegray-guide-note">${cfg.note}</div>
    </div>`;
}

registerViz('finegray-concept-guide', renderGuide);
registerViz('finegray-cif-guide', renderGuide);
registerViz('finegray-fg-test-guide', renderGuide);
registerViz('finegray-crr-guide', renderGuide);
registerViz('finegray-competing-event-guide', renderGuide);