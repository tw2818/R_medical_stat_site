import { registerViz } from './_core.js';

const GUIDE_CARDS = {
  'sample-size-params': {
    icon: '⚖️',
    title: '功效分析的四个核心量',
    cards: [
      ['样本量 n', '研究要纳入多少对象。样本量越大，越容易发现真实差异，但成本和伦理压力也更高。', '求解目标'],
      ['α 水平', '一类错误概率，医学研究常用 0.05。α 越小，检验越保守，通常需要更多样本。', '假阳性'],
      ['Power', '功效 = 1-β，表示真实差异存在时能检出的概率。常用 0.80 或 0.90。', '检出能力'],
      ['Effect size', '效应量描述差异有多大，是最难估计也最影响样本量的输入。', '关键输入'],
    ],
  },
  'pwr-t-params': {
    icon: '🧮',
    title: 'pwr.t.test() 参数怎么读',
    cards: [
      ['d', '标准化均值差，常写作 (μ1-μ2)/σ；例题中“差别是标准差的60%”就是 d=0.6。', '效应量'],
      ['sig.level', '显著性水平 α，默认 0.05；除非研究方案明确要求，不要随意更改。', 'α'],
      ['power', '目标检验效能，常用 0.8 或 0.9；本章例题多用 1-β=0.9。', '1-β'],
      ['type / alternative', '指定单样本、两样本、配对，以及单侧或双侧检验；这会直接改变样本量。', '设计类型'],
    ],
  },
  'sample-size-output-guide': {
    icon: '📌',
    title: '样本量输出怎么解释',
    cards: [
      ['永远向上取整', 'R 输出 54.9 时，实际方案不能写 54.9 例，应写至少 55 例。', '取整'],
      ['每组 vs 总量', 'two.sample 的 n 通常是每组样本量；卡方的 N 常是总样本量。一定要看输出 NOTE。', '单位'],
      ['考虑失访', '正式方案还要按预计失访率放大，例如 n / (1-失访率)。', '膨胀'],
      ['方法差异', 'pwr、R base、PASS、课本公式可能略有差异；论文中要写清楚计算方法。', '报告'],
    ],
  },
  'anova-sample-size-note': {
    icon: '🧭',
    title: '多组均数样本量：为什么常推荐 PASS',
    cards: [
      ['设计更复杂', '多组均数比较涉及组数、组间差异模式、组内方差和多重比较目标。', 'ANOVA'],
      ['效应量难估计', 'pwr.anova.test() 需要 f，但临床例题往往给出多组均数和标准差，转换并不直观。', 'f 值'],
      ['R 可做但不总顺手', 'R 适合复现和验证；遇到复杂设计时，PASS/G*Power 往往更适合方案阶段。', '工具选择'],
      ['报告要透明', '无论用什么软件，都要报告 α、power、效应量假设、组数和每组样本量。', '写作'],
    ],
  },
};

function ensureSampleSizeGuideStyles() {
  if (document.getElementById('sample-size-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'sample-size-guide-styles';
  style.textContent = `
    .ss-guide-card{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:960px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .ss-guide-header{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .ss-guide-icon{font-size:18px;line-height:1;}
    .ss-guide-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px;}
    .ss-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 14px;box-shadow:0 2px 8px rgba(15,23,42,.035);min-height:128px;}
    .ss-guide-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:11px;}
    .ss-guide-title{font-size:16px;font-weight:750;line-height:1.35;color:#0f172a;margin:0 0 8px;}
    .ss-guide-desc{font-size:13.5px;line-height:1.7;color:#64748b;margin:0;}
    @media (max-width:980px){.ss-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media (max-width:640px){.ss-guide-grid{grid-template-columns:1fr;}.ss-guide-item{min-height:auto;}}
  `;
  document.head.appendChild(style);
}

function renderSampleSizeGuide(el) {
  ensureSampleSizeGuideStyles();
  const type = el.dataset.type;
  const config = GUIDE_CARDS[type] || GUIDE_CARDS['sample-size-params'];
  const title = el.dataset.title || config.title;
  el.innerHTML = `
    <section class="ss-guide-card" aria-label="${title}">
      <div class="ss-guide-header"><span class="ss-guide-icon">${config.icon}</span><span>${title}</span></div>
      <div class="ss-guide-grid">
        ${config.cards.map(([heading, desc, badge]) => `
          <article class="ss-guide-item">
            <span class="ss-guide-badge">${badge}</span>
            <h4 class="ss-guide-title">${heading}</h4>
            <p class="ss-guide-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

registerViz('sample-size-params', renderSampleSizeGuide);
registerViz('pwr-t-params', renderSampleSizeGuide);
registerViz('sample-size-output-guide', renderSampleSizeGuide);
registerViz('anova-sample-size-note', renderSampleSizeGuide);
