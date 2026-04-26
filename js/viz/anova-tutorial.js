import { registerViz } from './_core.js';

const boxStyle = 'border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;padding:12px;box-shadow:0 1px 2px rgba(15,23,42,.04);';
const muted = 'color:#64748b;font-size:13px;line-height:1.6;';
const badge = 'display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;margin-right:6px;';

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

function miniTable(headers, rows) {
  const th = headers.map(h => `<th style="padding:7px 8px;border:1px solid #cbd5e1;background:#f1f5f9;text-align:center;font-size:13px;">${h}</th>`).join('');
  const trs = rows.map(row => `<tr>${row.map(c => `<td style="padding:7px 8px;border:1px solid #cbd5e1;text-align:center;font-size:13px;background:#fff;">${c}</td>`).join('')}</tr>`).join('');
  return `<table style="border-collapse:collapse;width:100%;margin:8px 0;">${th ? `<thead><tr>${th}</tr></thead>` : ''}<tbody>${trs}</tbody></table>`;
}

function renderAnovaDecomposition(el) {
  const title = el.dataset.title || '方差分析的核心：把总变异拆开';
  el.innerHTML = card(title, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:stretch;">
      <div style="${boxStyle}">
        <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">1. 变异来源</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 12px;">
          <span style="${badge}">SST</span><strong>总变异</strong>
          <span style="font-weight:700;color:#64748b;">=</span>
          <span style="${badge}">SSB</span><strong>组间变异</strong>
          <span style="font-weight:700;color:#64748b;">+</span>
          <span style="${badge}">SSW</span><strong>组内变异</strong>
        </div>
        <div style="${muted}">
          组间变异主要反映处理组均数之间的差别；组内变异主要反映同一组内个体差异和随机误差。
        </div>
      </div>
      <div style="${boxStyle}">
        <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">2. F 值判断</div>
        <div style="font-size:20px;text-align:center;margin:10px 0;color:#0f172a;">
          <strong>F = MS<sub>组间</sub> / MS<sub>组内</sub></strong>
        </div>
        <div style="${muted}">
          如果组间均方明显大于组内均方，F 值变大，P 值变小，提示至少有一组总体均数可能不同。
        </div>
      </div>
      <div style="${boxStyle}">
        <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">3. 自由度</div>
        <div style="${muted}">
          总自由度：N − 1<br>
          组间自由度：k − 1<br>
          组内自由度：N − k
        </div>
      </div>
      <div style="${boxStyle}">
        <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">4. 结论边界</div>
        <div style="${muted}">
          ANOVA 的总体检验只能说明“多组均数不全相等”。要判断具体哪两组不同，需要进入多重比较。
        </div>
      </div>
    </div>
  `);
}
registerViz('anovadecomp', renderAnovaDecomposition);

function renderAnovaDesign(el) {
  const design = (el.dataset.design || 'crd').toLowerCase();
  const titles = {
    crd: '完全随机设计：处理组之间独立比较',
    block: '随机区组设计：先按区组控制个体差异',
    latin: '拉丁方设计：同时控制行因素和列因素',
    crossover: '两阶段交叉设计：同一受试者接受不同处理'
  };

  let body = '';
  if (design === 'block') {
    body = `
      <div style="display:grid;grid-template-columns:1.1fr .9fr;gap:12px;">
        <div style="${boxStyle}">
          ${miniTable(['区组', '处理 A', '处理 B', '处理 C'], [
            ['区组1', 'A₁', 'B₁', 'C₁'], ['区组2', 'A₂', 'B₂', 'C₂'], ['区组3', 'A₃', 'B₃', 'C₃'], ['区组4', 'A₄', 'B₄', 'C₄']
          ])}
        </div>
        <div style="${boxStyle}">
          <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">读图</div>
          <div style="${muted}">
            每个区组内都包含各处理。分析时把“区组差异”单独拿出来，误差项会更纯，处理效应判断更敏感。
          </div>
        </div>
      </div>`;
  } else if (design === 'latin') {
    body = `
      <div style="display:grid;grid-template-columns:1.1fr .9fr;gap:12px;">
        <div style="${boxStyle}">
          ${miniTable(['', '列1', '列2', '列3'], [
            ['行1', 'A', 'B', 'C'], ['行2', 'B', 'C', 'A'], ['行3', 'C', 'A', 'B']
          ])}
        </div>
        <div style="${boxStyle}">
          <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">读图</div>
          <div style="${muted}">
            每种处理在每一行、每一列各出现一次。模型同时分离行效应、列效应和处理效应。
          </div>
        </div>
      </div>`;
  } else if (design === 'crossover') {
    body = `
      <div style="display:grid;grid-template-columns:1.1fr .9fr;gap:12px;">
        <div style="${boxStyle}">
          ${miniTable(['序列', '阶段1', '阶段2'], [
            ['AB', '处理 A', '处理 B'], ['BA', '处理 B', '处理 A']
          ])}
        </div>
        <div style="${boxStyle}">
          <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">读图</div>
          <div style="${muted}">
            交叉设计通常要同时考虑处理效应、阶段效应和受试者个体差异。若存在明显残留效应，解释需要谨慎。
          </div>
        </div>
      </div>`;
  } else {
    body = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        ${['处理 A', '处理 B', '处理 C'].map((g, i) => `
          <div style="${boxStyle};text-align:center;">
            <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">${g}</div>
            <div style="font-size:24px;line-height:1.5;color:#334155;">● ● ●<br>● ● ●</div>
            <div style="${muted}">不同受试对象随机进入该组</div>
          </div>
        `).join('')}
      </div>
      <div style="${boxStyle};margin-top:12px;${muted}">
        完全随机设计只设置一个主要处理因素。总体检验的问题是：这些处理组的总体均数是否完全相等？
      </div>`;
  }

  el.innerHTML = card(el.dataset.title || titles[design] || titles.crd, body);
}
registerViz('anovadesign', renderAnovaDesign);

function renderMultipleCompareGuide(el) {
  const title = el.dataset.title || '多重比较怎么选';
  el.innerHTML = card(title, `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <div style="${boxStyle}">
        <div style="${badge}">总体检验</div>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">先看 ANOVA</div>
        <div style="${muted}">若总体 F 检验提示多组均数不全相等，再进入事后比较。</div>
      </div>
      <div style="${boxStyle}">
        <div style="${badge}">所有两两比较</div>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">LSD / SNK / Tukey</div>
        <div style="${muted}">用于探索多组之间哪些组不同；不同方法控制错误率的强弱不同。</div>
      </div>
      <div style="${boxStyle}">
        <div style="${badge}">对照组比较</div>
        <div style="font-weight:700;color:#0f172a;margin:8px 0;">Dunnett</div>
        <div style="${muted}">适合多个实验组分别与同一个对照组比较，不强调实验组之间两两比较。</div>
      </div>
    </div>
    <div style="${boxStyle};margin-top:12px;${muted}">
      报告时应说明采用哪一种多重比较方法。不要只写“组间两两比较”，否则无法判断 P 值如何校正。
    </div>
  `);
}
registerViz('multiplecompareguide', renderMultipleCompareGuide);
