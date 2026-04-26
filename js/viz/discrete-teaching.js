import { registerViz } from './_core.js';

const boxStyle = 'border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;padding:12px;box-shadow:0 1px 2px rgba(15,23,42,.04);';
const muted = 'color:#64748b;font-size:13px;line-height:1.6;';
const badge = 'display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;margin-right:6px;';
const grid3 = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;align-items:stretch;';

function card(title, body) {
  return `
    <div class="viz-card">
      <div class="viz-header"><span>📊 ${title}</span></div>
      <div style="padding:14px;background:#f8fafc;">
        ${body}
      </div>
    </div>
  `;
}

function renderDiscreteDistributionGuide(el) {
  const title = el.dataset.title || '离散分布选择指南';
  el.innerHTML = card(title, `
    <div style="${grid3}">
      <div style="${boxStyle}">
        <span style="${badge}">二项分布</span>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">固定 n 中的阳性数</div>
        <div style="${muted}">适合成功/失败、阳性/阴性这类二分类结局。核心问题通常是率的估计和率的比较。</div>
        <div style="margin-top:10px;font-size:14px;color:#0f172a;"><strong>X ~ B(n, p)</strong></div>
      </div>
      <div style="${boxStyle}">
        <span style="${badge}">泊松分布</span>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">固定观察量内的事件数</div>
        <div style="${muted}">适合单位时间、单位面积、人年等观察量中的事件次数。比较时应看事件率，而不是只看原始事件数。</div>
        <div style="margin-top:10px;font-size:14px;color:#0f172a;"><strong>X ~ Poisson(λ)</strong></div>
      </div>
      <div style="${boxStyle}">
        <span style="${badge}">负二项分布</span>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">过度离散的计数资料</div>
        <div style="${muted}">当计数资料的方差明显大于均数时，泊松分布的“均数 = 方差”假设可能不合适，可考虑负二项分布。</div>
        <div style="margin-top:10px;font-size:14px;color:#0f172a;"><strong>Var(X) &gt; E(X)</strong></div>
      </div>
    </div>
    <div style="${boxStyle};margin-top:12px;${muted}">
      本章的判断顺序：先看数据生成机制，再看参数含义。二项分布回答“多少人阳性”，泊松分布回答“单位观察量内发生多少次”，负二项分布处理比泊松更分散的计数资料。
    </div>
  `);
}
registerViz('discretedistguide', renderDiscreteDistributionGuide);

function renderDiscreteParameterGuide(el) {
  const mode = (el.dataset.mode || 'binomial').toLowerCase();
  const title = el.dataset.title || (mode === 'poisson' ? '泊松分布参数含义' : '二项分布参数含义');

  const body = mode === 'poisson'
    ? `
      <div style="${grid3}">
        <div style="${boxStyle}">
          <span style="${badge}">X</span>
          <div style="font-weight:700;color:#0f172a;margin:8px 0;">事件数</div>
          <div style="${muted}">在固定观察时间、观察面积或人年内记录到的事件次数。</div>
        </div>
        <div style="${boxStyle}">
          <span style="${badge}">λ</span>
          <div style="font-weight:700;color:#0f172a;margin:8px 0;">期望事件数</div>
          <div style="${muted}">单位观察量内的平均事件数；在标准化观察量后，也可理解为事件率参数。</div>
        </div>
        <div style="${boxStyle}">
          <span style="${badge}">注意</span>
          <div style="font-weight:700;color:#0f172a;margin:8px 0;">均数 ≠ 连续变量均数</div>
          <div style="${muted}">这里的“均数”指计数分布的期望事件数，不是 t 检验中的连续变量样本均数。</div>
        </div>
      </div>`
    : `
      <div style="${grid3}">
        <div style="${boxStyle}">
          <span style="${badge}">n</span>
          <div style="font-weight:700;color:#0f172a;margin:8px 0;">固定试验次数 / 样本量</div>
          <div style="${muted}">例如调查 100 人，n = 100。</div>
        </div>
        <div style="${boxStyle}">
          <span style="${badge}">p</span>
          <div style="font-weight:700;color:#0f172a;margin:8px 0;">每次成功概率 / 总体率</div>
          <div style="${muted}">例如总体阳性率、治愈率、患病率。</div>
        </div>
        <div style="${boxStyle}">
          <span style="${badge}">X</span>
          <div style="font-weight:700;color:#0f172a;margin:8px 0;">成功数 / 阳性数</div>
          <div style="${muted}">实际观察到的阳性人数或成功次数。</div>
        </div>
      </div>`;

  el.innerHTML = card(title, body);
}
registerViz('discreteparamguide', renderDiscreteParameterGuide);

function renderNegativeBinomialGuide(el) {
  const title = el.dataset.title || '负二项分布：为什么需要它';
  el.innerHTML = card(title, `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:stretch;">
      <div style="${boxStyle}">
        <span style="${badge}">泊松分布</span>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">均数 = 方差</div>
        <div style="font-size:18px;color:#0f172a;margin:8px 0;"><strong>E(X)=λ, Var(X)=λ</strong></div>
        <div style="${muted}">适合事件发生相对独立且离散程度与均数接近的计数资料。</div>
      </div>
      <div style="${boxStyle}">
        <span style="${badge}">负二项分布</span>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">方差大于均数</div>
        <div style="font-size:18px;color:#0f172a;margin:8px 0;"><strong>Var(X) &gt; E(X)</strong></div>
        <div style="${muted}">用于处理过度离散，例如不同个体风险差异较大、事件聚集发生等情况。</div>
      </div>
    </div>
    <div style="${boxStyle};margin-top:12px;${muted}">
      因此，负二项分布不是泊松分布的简单替代图，而是针对“计数资料过度离散”的建模选择。实际分析时通常先检查均数与方差，或在回归模型中检查过度离散。
    </div>
  `);
}
registerViz('negativebinomialguide', renderNegativeBinomialGuide);
