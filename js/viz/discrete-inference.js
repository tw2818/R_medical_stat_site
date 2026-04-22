import { registerViz } from './_core.js';

function renderRateCompare(el) {
  const id = 'ratecmp-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '率比较可视化';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-mode1" class="path-tab active" type="button">单样本率</button>
        <button id="${id}-mode2" class="path-tab" type="button">两样本率</button>
      </div>
      <div id="${id}-panel1" style="display:block;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:end;margin-bottom:10px;">
          <label style="font-size:13px;">阳性数 x<br><input id="${id}-x" type="number" min="0" value="42" style="width:88px;padding:6px;"></label>
          <label style="font-size:13px;">样本量 n<br><input id="${id}-n" type="number" min="1" value="100" style="width:88px;padding:6px;"></label>
          <label style="font-size:13px;">比较值 p₀<br><input id="${id}-p0" type="number" min="0" max="1" step="0.01" value="0.30" style="width:88px;padding:6px;"></label>
          <button id="${id}-calc1" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">计算</button>
        </div>
      </div>
      <div id="${id}-panel2" style="display:none;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:end;margin-bottom:10px;">
          <label style="font-size:13px;">组1 阳性 x₁<br><input id="${id}-x1" type="number" min="0" value="48" style="width:88px;padding:6px;"></label>
          <label style="font-size:13px;">组1 样本量 n₁<br><input id="${id}-n1" type="number" min="1" value="100" style="width:88px;padding:6px;"></label>
          <label style="font-size:13px;">组2 阳性 x₂<br><input id="${id}-x2" type="number" min="0" value="32" style="width:88px;padding:6px;"></label>
          <label style="font-size:13px;">组2 样本量 n₂<br><input id="${id}-n2" type="number" min="1" value="100" style="width:88px;padding:6px;"></label>
          <button id="${id}-calc2" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">计算</button>
        </div>
      </div>
      <canvas id="${id}-canvas" width="560" height="220" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
      <div style="margin-top:8px;font-size:12px;color:#666;text-align:center;">结果为教学近似展示：单样本区间使用 Wilson 近似，两样本比较使用常见 z 近似。</div>
    </div>`;

  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const result = document.getElementById(`${id}-result`);
  const mode1Btn = document.getElementById(`${id}-mode1`);
  const mode2Btn = document.getElementById(`${id}-mode2`);
  const panel1 = document.getElementById(`${id}-panel1`);
  const panel2 = document.getElementById(`${id}-panel2`);

  function setMode(mode) {
    const one = mode === 1;
    panel1.style.display = one ? 'block' : 'none';
    panel2.style.display = one ? 'none' : 'block';
    mode1Btn.classList.toggle('active', one);
    mode2Btn.classList.toggle('active', !one);
  }

  function drawBars(values, labels, target = null, titleText = '率比较示意', yMax = 1, suffix = '%', formatter = v => (v * 100).toFixed(1) + '%') {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 60, r: 30, t: 25, b: 45 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;

    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, W / 2, 18);

    ctx.strokeStyle = '#ddd';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + plotH);
    ctx.lineTo(pad.l + plotW, pad.t + plotH);
    ctx.stroke();

    const barSpace = plotW / values.length;
    const barW = Math.min(120, barSpace * 0.45);

    values.forEach((v, i) => {
      const x = pad.l + barSpace * i + (barSpace - barW) / 2;
      const scaled = yMax > 0 ? Math.max(0, Math.min(yMax, v)) / yMax : 0;
      const h = scaled * plotH;
      const y = pad.t + plotH - h;
      ctx.fillStyle = i === values.length - 1 && target !== null ? '#95a5a6' : '#3498db';
      ctx.fillRect(x, y, barW, h);
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.fillText(labels[i], x + barW / 2, pad.t + plotH + 18);
      ctx.fillText(formatter(v), x + barW / 2, y - 8);
    });

    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = yMax * (1 - i / 4);
      const y = pad.t + (i / 4) * plotH;
      ctx.fillText(val.toFixed(yMax <= 1 ? 2 : 1) + (suffix || ''), pad.l - 6, y + 4);
    }
  }

  function wilsonCI(x, n, z = 1.96) {
    const p = x / n;
    const denom = 1 + (z * z) / n;
    const center = (p + (z * z) / (2 * n)) / denom;
    const half = (z / denom) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    return [Math.max(0, center - half), Math.min(1, center + half)];
  }

  function calcOne() {
    const x = Number(document.getElementById(`${id}-x`).value);
    const n = Number(document.getElementById(`${id}-n`).value);
    const p0 = Number(document.getElementById(`${id}-p0`).value);
    if (!(n > 0) || x < 0 || x > n || p0 < 0 || p0 > 1) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">请输入合法参数。</div>';
      return;
    }
    const p = x / n;
    const se0 = Math.sqrt((p0 * (1 - p0)) / n);
    const z = se0 > 0 ? (p - p0) / se0 : 0;
    const pval = Math.min(1, 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1)));
    const [lo, hi] = wilsonCI(x, n);
    drawBars([p, p0], ['样本率', '比较值 p₀'], p0);
    result.innerHTML = `
      <div><strong>样本率</strong> p̂ = ${p.toFixed(4)} (${(p * 100).toFixed(1)}%)</div>
      <div><strong>95% CI</strong> ≈ [${lo.toFixed(4)}, ${hi.toFixed(4)}]</div>
      <div><strong>与 p₀ 的差值</strong> = ${(p - p0).toFixed(4)}</div>
      <div><strong>近似 z 检验</strong>: z = ${z.toFixed(3)}, P ≈ ${pval.toFixed(4)}</div>`;
  }

  function calcTwo() {
    const x1 = Number(document.getElementById(`${id}-x1`).value);
    const n1 = Number(document.getElementById(`${id}-n1`).value);
    const x2 = Number(document.getElementById(`${id}-x2`).value);
    const n2 = Number(document.getElementById(`${id}-n2`).value);
    if (!(n1 > 0 && n2 > 0) || x1 < 0 || x2 < 0 || x1 > n1 || x2 > n2) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">请输入合法参数。</div>';
      return;
    }
    const p1 = x1 / n1;
    const p2 = x2 / n2;
    const pooled = (x1 + x2) / (n1 + n2);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
    const z = se > 0 ? (p1 - p2) / se : 0;
    const pval = Math.min(1, 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1)));
    const diff = p1 - p2;
    const seDiff = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
    const lo = diff - 1.96 * seDiff;
    const hi = diff + 1.96 * seDiff;
    drawBars([p1, p2], ['组1', '组2']);
    result.innerHTML = `
      <div><strong>组1率</strong> p̂₁ = ${p1.toFixed(4)} (${(p1 * 100).toFixed(1)}%)；<strong>组2率</strong> p̂₂ = ${p2.toFixed(4)} (${(p2 * 100).toFixed(1)}%)</div>
      <div><strong>率差</strong> p̂₁ - p̂₂ = ${diff.toFixed(4)}</div>
      <div><strong>95% CI</strong> ≈ [${lo.toFixed(4)}, ${hi.toFixed(4)}]</div>
      <div><strong>两样本率近似 z 检验</strong>: z = ${z.toFixed(3)}, P ≈ ${pval.toFixed(4)}</div>`;
  }

  mode1Btn.addEventListener('click', () => { setMode(1); calcOne(); });
  mode2Btn.addEventListener('click', () => { setMode(2); calcTwo(); });
  document.getElementById(`${id}-calc1`).addEventListener('click', calcOne);
  document.getElementById(`${id}-calc2`).addEventListener('click', calcTwo);

  setMode(1);
  calcOne();
}

registerViz('ratecompare', renderRateCompare);

function renderPoissonRateCompare(el) {
  const id = 'poicmp-' + Math.random().toString(36).slice(2, 8);
  const title = el.dataset.title || '泊松事件率比较';

  el.innerHTML = `
    <div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
        <button id="${id}-mode1" class="path-tab active" type="button">单样本事件率</button>
        <button id="${id}-mode2" class="path-tab" type="button">两样本事件率</button>
      </div>
      <div id="${id}-panel1" style="display:block;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:end;margin-bottom:10px;">
          <label style="font-size:13px;">事件数 x<br><input id="${id}-x" type="number" min="0" value="86" style="width:88px;padding:6px;"></label>
          <label style="font-size:13px;">观察量 T<br><input id="${id}-t" type="number" min="0.1" step="0.1" value="200" style="width:88px;padding:6px;"></label>
          <label style="font-size:13px;">参考率 r₀<br><input id="${id}-r0" type="number" min="0" step="0.01" value="0.30" style="width:88px;padding:6px;"></label>
          <button id="${id}-calc1" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">计算</button>
        </div>
      </div>
      <div id="${id}-panel2" style="display:none;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:end;margin-bottom:10px;">
          <label style="font-size:13px;">组1 事件数 x₁<br><input id="${id}-x1" type="number" min="0" value="44" style="width:88px;padding:6px;"></label>
          <label style="font-size:13px;">组1 观察量 T₁<br><input id="${id}-t1" type="number" min="0.1" step="0.1" value="120" style="width:88px;padding:6px;"></label>
          <label style="font-size:13px;">组2 事件数 x₂<br><input id="${id}-x2" type="number" min="0" value="28" style="width:88px;padding:6px;"></label>
          <label style="font-size:13px;">组2 观察量 T₂<br><input id="${id}-t2" type="number" min="0.1" step="0.1" value="140" style="width:88px;padding:6px;"></label>
          <button id="${id}-calc2" type="button" style="padding:8px 16px;background:#3498db;color:#fff;border:none;border-radius:6px;cursor:pointer;">计算</button>
        </div>
      </div>
      <canvas id="${id}-canvas" width="560" height="220" style="display:block;margin:0 auto;"></canvas>
      <div id="${id}-result" style="margin-top:10px;font-size:14px;color:#2c3e50;line-height:1.7;"></div>
      <div style="margin-top:8px;font-size:12px;color:#666;text-align:center;">结果为教学近似展示：区间与检验基于泊松分布的大样本近似。</div>
    </div>`;

  const canvas = document.getElementById(`${id}-canvas`);
  const ctx = canvas.getContext('2d');
  const result = document.getElementById(`${id}-result`);
  const mode1Btn = document.getElementById(`${id}-mode1`);
  const mode2Btn = document.getElementById(`${id}-mode2`);
  const panel1 = document.getElementById(`${id}-panel1`);
  const panel2 = document.getElementById(`${id}-panel2`);

  function setMode(mode) {
    const one = mode === 1;
    panel1.style.display = one ? 'block' : 'none';
    panel2.style.display = one ? 'none' : 'block';
    mode1Btn.classList.toggle('active', one);
    mode2Btn.classList.toggle('active', !one);
  }

  function drawRates(values, labels, target = null) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 60, r: 30, t: 25, b: 45 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const ymax = Math.max(...values, target ?? 0) * 1.25 || 1;

    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('事件率比较示意', W / 2, 18);

    ctx.strokeStyle = '#ddd';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * plotH;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + plotW, y); ctx.stroke();
    }

    ctx.strokeStyle = '#333';
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + plotH); ctx.lineTo(pad.l + plotW, pad.t + plotH); ctx.stroke();

    const barSpace = plotW / values.length;
    const barW = Math.min(120, barSpace * 0.45);
    values.forEach((v, i) => {
      const x = pad.l + barSpace * i + (barSpace - barW) / 2;
      const h = (v / ymax) * plotH;
      const y = pad.t + plotH - h;
      ctx.fillStyle = i === values.length - 1 && target !== null ? '#95a5a6' : '#16a085';
      ctx.fillRect(x, y, barW, h);
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.fillText(labels[i], x + barW / 2, pad.t + plotH + 18);
      ctx.fillText(v.toFixed(3), x + barW / 2, y - 8);
    });

    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = ymax * (1 - i / 4);
      const y = pad.t + (i / 4) * plotH;
      ctx.fillText(val.toFixed(2), pad.l - 6, y + 4);
    }
  }

  function calcOne() {
    const x = Number(document.getElementById(`${id}-x`).value);
    const T = Number(document.getElementById(`${id}-t`).value);
    const r0 = Number(document.getElementById(`${id}-r0`).value);
    if (!(T > 0) || x < 0 || r0 < 0) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">请输入合法参数。</div>';
      return;
    }
    const rate = x / T;
    const seLog = x > 0 ? 1 / Math.sqrt(x) : Infinity;
    const lo = x > 0 ? rate * Math.exp(-1.96 * seLog) : 0;
    const hi = x > 0 ? rate * Math.exp(1.96 * seLog) : 0;
    const se0 = T > 0 ? Math.sqrt((r0 * T)) / T : 0;
    const z = se0 > 0 ? (rate - r0) / se0 : 0;
    const pval = Math.min(1, 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1)));
    drawRates([rate, r0], ['样本率', '参考率 r₀'], r0);
    result.innerHTML = `
      <div><strong>事件率</strong> = ${rate.toFixed(4)} /单位观察量</div>
      <div><strong>近似 95% CI</strong> ≈ [${lo.toFixed(4)}, ${hi.toFixed(4)}]</div>
      <div><strong>与 r₀ 的差值</strong> = ${(rate - r0).toFixed(4)}</div>
      <div><strong>近似 z 检验</strong>: z = ${z.toFixed(3)}, P ≈ ${pval.toFixed(4)}</div>`;
  }

  function calcTwo() {
    const x1 = Number(document.getElementById(`${id}-x1`).value);
    const T1 = Number(document.getElementById(`${id}-t1`).value);
    const x2 = Number(document.getElementById(`${id}-x2`).value);
    const T2 = Number(document.getElementById(`${id}-t2`).value);
    if (!(T1 > 0 && T2 > 0) || x1 < 0 || x2 < 0) {
      result.innerHTML = '<div style="color:#c0392b;text-align:center;">请输入合法参数。</div>';
      return;
    }
    const r1 = x1 / T1;
    const r2 = x2 / T2;
    const ratio = r2 > 0 ? r1 / r2 : Infinity;
    const diff = r1 - r2;
    const seDiff = Math.sqrt(x1 / (T1 * T1) + x2 / (T2 * T2));
    const loDiff = diff - 1.96 * seDiff;
    const hiDiff = diff + 1.96 * seDiff;
    const seLogRR = (x1 > 0 && x2 > 0) ? Math.sqrt(1 / x1 + 1 / x2) : Infinity;
    const loRR = (x1 > 0 && x2 > 0) ? Math.exp(Math.log(ratio) - 1.96 * seLogRR) : 0;
    const hiRR = (x1 > 0 && x2 > 0) ? Math.exp(Math.log(ratio) + 1.96 * seLogRR) : 0;
    const z = seLogRR < Infinity ? Math.log(ratio) / seLogRR : 0;
    const pval = Math.min(1, 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1)));
    drawRates([r1, r2], ['组1', '组2']);
    result.innerHTML = `
      <div><strong>组1事件率</strong> = ${r1.toFixed(4)}；<strong>组2事件率</strong> = ${r2.toFixed(4)} /单位观察量</div>
      <div><strong>事件率差</strong> = ${diff.toFixed(4)}，近似 95% CI ≈ [${loDiff.toFixed(4)}, ${hiDiff.toFixed(4)}]</div>
      <div><strong>事件率比 RR</strong> = ${ratio.toFixed(4)}，近似 95% CI ≈ [${loRR.toFixed(4)}, ${hiRR.toFixed(4)}]</div>
      <div><strong>两样本事件率近似检验</strong>: z = ${z.toFixed(3)}, P ≈ ${pval.toFixed(4)}</div>`;
  }

  mode1Btn.addEventListener('click', () => { setMode(1); calcOne(); });
  mode2Btn.addEventListener('click', () => { setMode(2); calcTwo(); });
  document.getElementById(`${id}-calc1`).addEventListener('click', calcOne);
  document.getElementById(`${id}-calc2`).addEventListener('click', calcTwo);

  setMode(1);
  calcOne();
}

registerViz('poissonratecompare', renderPoissonRateCompare);
