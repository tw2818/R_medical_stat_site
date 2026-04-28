import { registerViz } from './_core.js';

const SUMMARY_ROWS = [
  ['表12-3', '4 时间点 / 单组', '0.063', '0.008', 'GGe = 0.528', '拒绝球形，优先报告 GG 校正'],
  ['例12-3', '5 时间点 / 3组', '0.113', '0.001', 'GGe = 0.597', '拒绝球形，优先报告 GG 校正'],
];

const GUIDE_CONFIG = {
  'sphericity-decision-guide': {
    icon: '🧭',
    title: 'Mauchly 检验怎么决策',
    cards: [
      ['看 W 统计量', 'W 介于 0 和 1 之间。越接近 1，重复测量差值的协方差结构越接近球形。', 'W'],
      ['先看 P 值', 'p ≥ 0.05：暂不拒绝球形假设；p < 0.05：拒绝球形，需要查看 ε 校正。', 'p value'],
      ['再看 ε̂GG', 'ε̂ 越接近 1 越好。经验上 ε̂GG < 0.75 时，优先使用 Greenhouse-Geisser 校正。', 'ε̂GG'],
      ['报告方式', '重复测量 ANOVA 应说明 Mauchly 结果，并报告未校正或 GG/HF 校正后的 df、F 和 P。', 'report'],
    ],
  },
  'epsilon-correction-guide': {
    icon: '📐',
    title: 'ε 校正怎么选：GG 还是 HF',
    cards: [
      ['球形成立', 'Mauchly p ≥ 0.05 时，一般报告常规重复测量 ANOVA 的组内效应结果。', 'no correction'],
      ['GG 校正', 'ε̂GG 较小，尤其 < 0.75 时，Greenhouse-Geisser 更保守，常作为首选。', 'GG'],
      ['HF 校正', 'ε̂GG ≥ 0.75 时，Huynh-Feldt 通常没有 GG 那么保守，可作为替代报告。', 'HF'],
      ['本章两个例子', '表12-3 与例12-3 的 ε̂GG 都 < 0.75，所以教学上都推荐看 GG 校正结果。', 'example'],
    ],
  },
  'mauchly-profile-guide': {
    icon: '📉',
    title: '表12-3轮廓图：4 个时间点血糖趋势',
    profile: true,
  },
};

function ensureRepeatedMeasuresStyles() {
  if (document.getElementById('rm-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'rm-guide-styles';
  style.textContent = `
    .rm-guide-card{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:980px;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,.055);overflow:hidden;color:#0f172a;}
    .rm-guide-header{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-size:15px;font-weight:750;color:#0f172a;}
    .rm-guide-icon{font-size:18px;line-height:1;}
    .rm-guide-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px;}
    .rm-guide-item{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 14px;box-shadow:0 2px 8px rgba(15,23,42,.035);min-height:140px;}
    .rm-guide-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:750;margin-bottom:11px;}
    .rm-guide-title{font-size:16px;font-weight:750;line-height:1.35;color:#0f172a;margin:0 0 8px;}
    .rm-guide-desc{font-size:13.5px;line-height:1.7;color:#64748b;margin:0;}
    .rm-profile-wrap{display:grid;grid-template-columns:minmax(280px,1.2fr) minmax(220px,.8fr);gap:14px;padding:14px;align-items:stretch;}
    .rm-profile-plot,.rm-profile-note,.rm-summary-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 2px 8px rgba(15,23,42,.035);}
    .rm-profile-plot{padding:12px;}
    .rm-profile-note{padding:16px 14px;}
    .rm-profile-svg{width:100%;height:auto;display:block;}
    .rm-profile-point{fill:#4f46e5;stroke:#fff;stroke-width:2;}
    .rm-profile-line{fill:none;stroke:#4f46e5;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}
    .rm-profile-axis{stroke:#cbd5e1;stroke-width:1;}
    .rm-profile-label{font-size:12px;fill:#64748b;text-anchor:middle;}
    .rm-profile-value{font-size:12px;fill:#334155;font-weight:700;text-anchor:middle;}
    .rm-summary-wrap{padding:14px;overflow-x:auto;}
    .rm-summary-table{width:100%;border-collapse:collapse;border-top:2px solid #334155;border-bottom:2px solid #334155;background:#fff;}
    .rm-summary-table th{font-size:13px;color:#334155;font-weight:750;text-align:left;padding:10px 11px;border-bottom:1px solid #cbd5e1;background:#f8fafc;white-space:nowrap;}
    .rm-summary-table td{font-size:13.2px;color:#475569;line-height:1.55;padding:10px 11px;border-bottom:1px solid #e2e8f0;vertical-align:top;}
    .rm-summary-table tr:last-child td{border-bottom:0;}
    .rm-pill{display:inline-block;padding:3px 8px;border-radius:999px;background:#fff7ed;color:#9a3412;font-weight:700;white-space:nowrap;}
    @media (max-width:980px){.rm-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.rm-profile-wrap{grid-template-columns:1fr;}}
    @media (max-width:640px){.rm-guide-grid{grid-template-columns:1fr;}.rm-guide-item{min-height:auto;}.rm-summary-table th,.rm-summary-table td{font-size:12.5px;padding:8px 9px;}}
  `;
  document.head.appendChild(style);
}

function renderGridGuide(el, config) {
  const title = el.dataset.title || config.title;
  el.innerHTML = `
    <section class="rm-guide-card" aria-label="${title}">
      <div class="rm-guide-header"><span class="rm-guide-icon">${config.icon}</span><span>${title}</span></div>
      <div class="rm-guide-grid">
        ${config.cards.map(([heading, desc, badge]) => `
          <article class="rm-guide-item">
            <span class="rm-guide-badge">${badge}</span>
            <h4 class="rm-guide-title">${heading}</h4>
            <p class="rm-guide-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderProfileGuide(el, config) {
  const title = el.dataset.title || config.title;
  const labels = ['t0', 't45', 't90', 't135'];
  const values = [5.62, 5.45, 5.28, 4.88];
  const points = values.map((value, index) => {
    const x = 48 + index * 110;
    const y = 38 + (6.0 - value) / (6.0 - 4.6) * 188;
    return { x, y, value, label: labels[index] };
  });
  const polyline = points.map(point => `${point.x},${point.y}`).join(' ');
  el.innerHTML = `
    <section class="rm-guide-card" aria-label="${title}">
      <div class="rm-guide-header"><span class="rm-guide-icon">${config.icon}</span><span>${title}</span></div>
      <div class="rm-profile-wrap">
        <div class="rm-profile-plot">
          <svg class="rm-profile-svg" viewBox="0 0 400 270" role="img" aria-label="血糖均值随时间下降">
            <line class="rm-profile-axis" x1="40" y1="230" x2="380" y2="230"></line>
            <line class="rm-profile-axis" x1="40" y1="30" x2="40" y2="230"></line>
            <polyline class="rm-profile-line" points="${polyline}"></polyline>
            ${points.map(point => `
              <circle class="rm-profile-point" cx="${point.x}" cy="${point.y}" r="6"></circle>
              <text class="rm-profile-value" x="${point.x}" y="${point.y - 12}">${point.value.toFixed(2)}</text>
              <text class="rm-profile-label" x="${point.x}" y="252">${point.label}</text>
            `).join('')}
          </svg>
        </div>
        <div class="rm-profile-note">
          <span class="rm-guide-badge">profile</span>
          <h4 class="rm-guide-title">先看趋势，再看球形假设</h4>
          <p class="rm-guide-desc">均值从 t0 的 5.62 下降到 t135 的 4.88，提示时间效应可能存在；但重复测量 ANOVA 还要检查“各时间差值的方差是否足够相似”。</p>
        </div>
      </div>
    </section>
  `;
}

function renderSummary(el) {
  const title = el.dataset.title || '两个例子的球形检验和 ε 校正对照';
  el.innerHTML = `
    <section class="rm-guide-card" aria-label="${title}">
      <div class="rm-guide-header"><span class="rm-guide-icon">📋</span><span>${title}</span></div>
      <div class="rm-summary-wrap">
        <table class="rm-summary-table">
          <thead><tr><th>数据</th><th>设计</th><th>W</th><th>P</th><th>ε̂GG</th><th>建议</th></tr></thead>
          <tbody>
            ${SUMMARY_ROWS.map(row => `
              <tr>
                <td><strong>${row[0]}</strong></td><td>${row[1]}</td><td>${row[2]}</td><td><span class="rm-pill">${row[3]}</span></td><td>${row[4]}</td><td>${row[5]}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderRepeatedMeasuresGuide(el) {
  ensureRepeatedMeasuresStyles();
  const config = GUIDE_CONFIG[el.dataset.type] || GUIDE_CONFIG['sphericity-decision-guide'];
  if (el.dataset.type === 'mauchly-profile-guide') {
    renderProfileGuide(el, config);
  } else if (el.dataset.type === 'mauchly-result-summary') {
    renderSummary(el);
  } else {
    renderGridGuide(el, config);
  }
}

registerViz('mauchly-profile-guide', renderRepeatedMeasuresGuide);
registerViz('sphericity-decision-guide', renderRepeatedMeasuresGuide);
registerViz('epsilon-correction-guide', renderRepeatedMeasuresGuide);
registerViz('mauchly-result-summary', renderRepeatedMeasuresGuide);
