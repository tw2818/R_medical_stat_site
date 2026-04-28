import { registerViz } from './_core.js';

const GUIDE_CARDS = {
  'hotelling-vector-matrix-guide': {
    icon: '🧭',
    title: '多变量描述：三个对象要一起看',
    lead: '多变量资料不是把每一列分别描述完就结束，而是同时描述“中心、变异、相关结构”。',
    cards: [
      ['均值向量', '每个反应变量一个均值，合在一起表示多维中心位置。'],
      ['协方差矩阵', '对角线是各变量方差，非对角线记录变量之间共同变动。'],
      ['相关矩阵', '把协方差标准化后，更容易判断变量之间是否同向变化。'],
    ],
    note: '本章后面的 Hotelling T²、MANOVA、轮廓分析，本质上都在比较均值向量，同时利用协方差/相关结构。',
  },
  'hotelling-t2-decision-guide': {
    icon: '🎯',
    title: 'Hotelling T²：t 检验的多变量版本',
    lead: 'Hotelling T² 检验的是均值向量，而不是单个均值。',
    cards: [
      ['单组资料', '样本均值向量 vs 已知总体均值向量：X 是否偏离 μ₀。'],
      ['两组资料', '两组均值向量是否相等：μ₁ 是否等于 μ₂。'],
      ['结果读取', '有些 R 包输出的 T.2 实际是换算后的 F 值，要结合函数说明和 df 读取。'],
    ],
    note: '如果只有一个反应变量，Hotelling T² 会退化到 t 检验的思想；多个反应变量时，它同时利用变量相关性。',
  },
  'hotelling-manova-stat-guide': {
    icon: '📚',
    title: 'MANOVA：多组均值向量的整体检验',
    lead: '多组资料从 ANOVA 扩展到 MANOVA：比较的对象从一个均值变成一组均值向量。',
    cards: [
      ['Wilks Λ', '常用默认口径；值越小，组间多变量差异通常越明显。'],
      ['Pillai trace', '通常更稳健，特别适合样本量小或假设略不理想时参考。'],
      ['单变量补充', 'summary.aov() 用来定位哪些反应变量贡献差异，但不能替代 MANOVA。'],
    ],
    note: '先看多变量整体差异，再把单变量 ANOVA 当作解释和定位工具。',
  },
  'hotelling-repeated-vector-guide': {
    icon: '⏱️',
    title: '重复测量：把每个人的多次改变看成一个向量',
    lead: '不直接把每个时间点拆开检验，而是先把“服药后相对基线的变化”组合成变化向量。',
    cards: [
      ['宽表矩阵', '每个受试者一行，多个时间点是一组相关反应变量。'],
      ['变化值', '用 t2−t1、t3−t1、t4−t1、t5−t1 表示整体减重轨迹。'],
      ['整体检验', 'Hotelling T² 检验变化向量是否整体偏离 0。'],
    ],
    note: '这和重复测量 ANOVA 的问题相近，但这里选择多变量路径，不依赖球对称假设。',
  },
  'hotelling-profile-guide': {
    icon: '📈',
    title: '轮廓分析：三个问题按顺序读',
    lead: '轮廓分析不是只问两条线是否完全一样，而是分成平行、相合、水平三个层次。',
    cards: [
      ['平行检验', '两组在不同指标上的变化形状是否相似。'],
      ['相合检验', '在平行前提下，两组整体水平是否相同。'],
      ['水平检验', '合并后各指标均值是否都差不多，还是某些问题更突出。'],
    ],
    note: '第19章例14-8的结论：两组轮廓可认为平行且相合，但整体轮廓不是水平线。',
  },
};

function ensureHotellingStyles() {
  if (document.getElementById('hotelling-guide-styles')) return;
  const style = document.createElement('style');
  style.id = 'hotelling-guide-styles';
  style.textContent = `
    .hotelling-card{margin:1.2rem 0;padding:1.1rem;border:1px solid #dbe4f0;border-radius:18px;background:linear-gradient(135deg,#f8fafc,#eef2ff);box-shadow:0 12px 28px rgba(15,23,42,.08);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#334155;}
    .hotelling-head{display:flex;align-items:center;gap:.55rem;margin-bottom:.55rem;font-weight:800;color:#1e293b;font-size:1.05rem;}
    .hotelling-icon{display:inline-flex;width:2rem;height:2rem;align-items:center;justify-content:center;border-radius:999px;background:#e0e7ff;}
    .hotelling-lead{margin:.25rem 0 .85rem;color:#475569;line-height:1.75;}
    .hotelling-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem;}
    .hotelling-mini{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:.85rem;min-height:7rem;}
    .hotelling-mini strong{display:inline-flex;margin-bottom:.35rem;color:#3730a3;background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;padding:.18rem .55rem;font-size:.82rem;}
    .hotelling-mini p{margin:0;color:#475569;line-height:1.65;font-size:.92rem;}
    .hotelling-note{margin:.8rem 0 0;padding:.7rem .85rem;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;line-height:1.7;}
    .hotelling-demo{display:grid;grid-template-columns:minmax(260px,1.15fr) minmax(220px,.85fr);gap:1rem;align-items:center;}
    .hotelling-panel{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:1rem;}
    .hotelling-control{display:flex;gap:.65rem;align-items:center;flex-wrap:wrap;font-weight:700;color:#334155;margin-bottom:.75rem;}
    .hotelling-control input{accent-color:#4f46e5;min-width:180px;}
    .hotelling-value{font-variant-numeric:tabular-nums;color:#4f46e5;background:#eef2ff;border-radius:999px;padding:.15rem .5rem;}
    .hotelling-svg{width:100%;max-width:420px;display:block;margin:0 auto;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;}
    .hotelling-axis{stroke:#94a3b8;stroke-width:1.3;stroke-dasharray:5 5;}
    .hotelling-proj{stroke:#4f46e5;stroke-width:3;stroke-linecap:round;}
    .hotelling-caption{font-size:.9rem;color:#475569;line-height:1.65;margin:.55rem 0 0;}
    .hotelling-badge{display:inline-flex;border-radius:999px;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;padding:.16rem .55rem;font-size:.82rem;font-weight:800;}
    @media (max-width:720px){.hotelling-demo{grid-template-columns:1fr}.hotelling-control input{width:100%;}}
  `;
  document.head.appendChild(style);
}

function renderGuide(el, config) {
  const title = el.dataset.title || config.title;
  const cards = config.cards.map(([label, text]) => `
    <div class="hotelling-mini"><strong>${label}</strong><p>${text}</p></div>
  `).join('');
  el.innerHTML = `
    <section class="hotelling-card" aria-label="${title}">
      <div class="hotelling-head"><span class="hotelling-icon">${config.icon}</span><span>${title}</span></div>
      <p class="hotelling-lead">${config.lead}</p>
      <div class="hotelling-grid">${cards}</div>
      <p class="hotelling-note">${config.note}</p>
    </section>
  `;
}

function renderUnivarMultivarDemo(el) {
  const title = el.dataset.title || '为什么单变量不显著，多变量可以显著？';
  const id = `hotelling-${Math.random().toString(36).slice(2, 8)}`;
  el.innerHTML = `
    <section class="hotelling-card" aria-label="${title}">
      <div class="hotelling-head"><span class="hotelling-icon">🧩</span><span>${title}</span></div>
      <div class="hotelling-demo">
        <div class="hotelling-panel">
          <label class="hotelling-control">投影方向 <input type="range" id="${id}-slider" min="0" max="90" step="5" value="35"><span id="${id}-value" class="hotelling-value">35°</span></label>
          <svg class="hotelling-svg" viewBox="0 0 360 240" role="img" aria-label="两组二维散点和多变量投影方向">
            <line x1="40" y1="200" x2="325" y2="200" class="hotelling-axis"></line>
            <line x1="40" y1="200" x2="40" y2="30" class="hotelling-axis"></line>
            <ellipse cx="145" cy="132" rx="76" ry="38" fill="rgba(79,70,229,.12)" stroke="#6366f1" stroke-width="2" transform="rotate(-28 145 132)"></ellipse>
            <ellipse cx="205" cy="105" rx="76" ry="38" fill="rgba(8,145,178,.12)" stroke="#0891b2" stroke-width="2" transform="rotate(-28 205 105)"></ellipse>
            <g fill="#4f46e5"><circle cx="118" cy="150" r="5"/><circle cx="146" cy="128" r="5"/><circle cx="172" cy="139" r="5"/><circle cx="130" cy="107" r="5"/><circle cx="160" cy="161" r="5"/></g>
            <g fill="#0891b2"><circle cx="185" cy="118" r="5"/><circle cx="216" cy="101" r="5"/><circle cx="232" cy="125" r="5"/><circle cx="202" cy="76" r="5"/><circle cx="191" cy="145" r="5"/></g>
            <line id="${id}-line" x1="180" y1="120" x2="260" y2="76" class="hotelling-proj"></line>
            <text x="282" y="213" font-size="12" fill="#64748b">变量1</text>
            <text x="18" y="42" font-size="12" fill="#64748b">变量2</text>
          </svg>
        </div>
        <div class="hotelling-panel">
          <p><span class="hotelling-badge">教学要点</span></p>
          <p class="hotelling-caption" id="${id}-text">单独看体重或身长时，两组投影重叠较多；沿两变量共同形成的方向看，组间距离会被放大。</p>
          <p class="hotelling-caption"><strong>对应第19.3.4：</strong>两次单变量 t 检验都不显著，但 Hotelling T² 对“二维均值向量”给出整体差异。</p>
        </div>
      </div>
    </section>
  `;
  const slider = document.getElementById(`${id}-slider`);
  const value = document.getElementById(`${id}-value`);
  const line = document.getElementById(`${id}-line`);
  const text = document.getElementById(`${id}-text`);
  const update = () => {
    const deg = Number(slider.value);
    const rad = deg * Math.PI / 180;
    const x2 = 180 + 92 * Math.cos(rad);
    const y2 = 120 - 92 * Math.sin(rad);
    line.setAttribute('x2', x2.toFixed(1));
    line.setAttribute('y2', y2.toFixed(1));
    value.textContent = `${deg}°`;
    if (deg < 20) {
      text.textContent = '接近单一横轴时，看到的主要是某一个变量的差异，容易忽略二维组合的信息。';
    } else if (deg > 65) {
      text.textContent = '接近单一纵轴时，仍然像是在做单变量比较，组间重叠依旧明显。';
    } else {
      text.textContent = '沿两变量共同形成的多变量方向投影时，组间分离更清楚，这正是 Hotelling T² 的教学重点。';
    }
  };
  slider.addEventListener('input', update);
  update();
}

function renderHotellingGuide(el) {
  ensureHotellingStyles();
  if (el.dataset.type === 'hotelling-univar-multivar-demo') {
    renderUnivarMultivarDemo(el);
    return;
  }
  const config = GUIDE_CARDS[el.dataset.type];
  if (!config) {
    el.innerHTML = '<div class="hotelling-card">未配置的 Hotelling 教学组件</div>';
    return;
  }
  renderGuide(el, config);
}

registerViz('hotelling-vector-matrix-guide', renderHotellingGuide);
registerViz('hotelling-t2-decision-guide', renderHotellingGuide);
registerViz('hotelling-manova-stat-guide', renderHotellingGuide);
registerViz('hotelling-univar-multivar-demo', renderHotellingGuide);
registerViz('hotelling-repeated-vector-guide', renderHotellingGuide);
registerViz('hotelling-profile-guide', renderHotellingGuide);
