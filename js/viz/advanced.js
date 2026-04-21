import { registerViz } from './_core.js';

// ==========================================================
// ADVANCED - 统计可视化模块
// ==========================================================

// ============================================================
// ADVANCED - 统计可视化模块
// ============================================================

  function renderLDA(el) {
    const id = 'lda-' + Math.random().toString(36).slice(2, 8);
    const W = 500, H = 400;
    const padL = 45, padR = 15, padT = 30, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 Fisher 判别分析分类边界</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        拖动两类数据中心调整判别边界 | 红色虚线为决策边界
      </div>
      <div style="text-align:center;margin-top:8px;">
        <button id="${id}-reset" style="padding:4px 14px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;">重置</button>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    let g1x = 0.35, g1y = 0.6; // group 1 center (normalized 0-1)
    let g2x = 0.65, g2y = 0.4; // group 2 center

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fafafa'; ctx.fillRect(padL, padT, plotW, plotH);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(padL + (i/5)*plotW, padT); ctx.lineTo(padL + (i/5)*plotW, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, padT + (i/5)*plotH); ctx.lineTo(padL + plotW, padT + (i/5)*plotH); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('变量 X1', padL + plotW/2, H - 4);
      ctx.save(); ctx.translate(12, padT + plotH/2); ctx.rotate(-Math.PI/2); ctx.fillText('变量 X2', 0, 0); ctx.restore();

      // LDA decision boundary: simplified linear discriminant
      const m1x = g1x * plotW, m1y = (1 - g1y) * plotH;
      const m2x = g2x * plotW, m2y = (1 - g2y) * plotH;
      const slope = (m2y - m1y) / (m2x - m1x + 0.001);
      const perpSlope = -1 / slope;
      const midX = (m1x + m2x) / 2, midY = (m1y + m2y) / 2;
      // Draw perpendicular bisector (decision boundary)
      const b = midY - perpSlope * midX;
      ctx.setLineDash([5, 5]); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, perpSlope * padL + b);
      ctx.lineTo(padL + plotW, perpSlope * (padL + plotW) + b);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw class regions (colored)
      const grad1 = ctx.createLinearGradient(padL, 0, padL + plotW, 0);
      grad1.addColorStop(0, 'rgba(52,152,219,0.08)'); grad1.addColorStop((m1x + m2x) / 2 / plotW, 'rgba(52,152,219,0.15)'); grad1.addColorStop(1, 'rgba(231,76,60,0.08)');
      ctx.fillStyle = grad1;
      ctx.fillRect(padL, padT, plotW, plotH);

      // Points
      const rng = (c, s) => { const arr = []; for (let i = 0; i < 20; i++) arr.push(c + (Math.random() - 0.5) * s); return arr; };
      const px1 = rng(g1x, 0.12), py1 = rng(g1y, 0.12);
      const px2 = rng(g2x, 0.12), py2 = rng(g2y, 0.12);
      ctx.fillStyle = 'rgba(52,152,219,0.7)';
      px1.forEach((x, i) => { const cx = padL + x * plotW, cy = padT + (1 - py1[i]) * plotH; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.fill(); });
      ctx.fillStyle = 'rgba(231,76,60,0.7)';
      px2.forEach((x, i) => { const cx = padL + x * plotW, cy = padT + (1 - py2[i]) * plotH; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.fill(); });

      // Centers
      ctx.fillStyle = '#2c3e50'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.beginPath(); ctx.arc(padL + m1x, padT + m1y, 8, 0, Math.PI*2); ctx.fill(); ctx.fillText('G1', padL + m1x, padT + m1y - 14);
      ctx.beginPath(); ctx.arc(padL + m2x, padT + m2y, 8, 0, Math.PI*2); ctx.fill(); ctx.fillText('G2', padL + m2x, padT + m2y - 14);

      // Legend
      ctx.fillStyle = 'rgba(52,152,219,0.7)'; ctx.beginPath(); ctx.arc(padL + 20, padT + 18, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.textAlign = 'left'; ctx.font = '12px sans-serif';
      ctx.fillText('组1', padL + 32, padT + 22);
      ctx.fillStyle = 'rgba(231,76,60,0.7)'; ctx.beginPath(); ctx.arc(padL + 80, padT + 18, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillText('组2', padL + 92, padT + 22);
    }

    draw();
    document.getElementById(id + '-reset').addEventListener('click', () => { g1x = 0.35; g1y = 0.6; g2x = 0.65; g2y = 0.4; draw(); });

    // Drag interaction
    let dragging = null;
    canvas.addEventListener('mousedown', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width * W;
      const my = (e.clientY - rect.top) / rect.height * H;
      const m1x = padL + g1x * plotW, m1y = padT + (1 - g1y) * plotH;
      const m2x = padL + g2x * plotW, m2y = padT + (1 - g2y) * plotH;
      if (Math.hypot(mx - m1x, my - m1y) < 20) dragging = 1;
      else if (Math.hypot(mx - m2x, my - m2y) < 20) dragging = 2;
    });
    canvas.addEventListener('mousemove', e => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width * W;
      const my = (e.clientY - rect.top) / rect.height * H;
      const nx = Math.max(0.05, Math.min(0.95, (mx - padL) / plotW));
      const ny = Math.max(0.05, Math.min(0.95, 1 - (my - padT) / plotH));
      if (dragging === 1) { g1x = nx; g1y = ny; } else { g2x = nx; g2y = ny; }
      draw();
    });
    canvas.addEventListener('mouseup', () => dragging = null);
    canvas.addEventListener('mouseleave', () => dragging = null);
  }
registerViz('lda', renderLDA);

  function renderFactorLoad(el) {
    const id = 'factorload-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '因子载荷热图';
    const rawItems = el.dataset.items || 'X1,X2,X3,X4,X5,X6,X7,X8';
    const rawFactors = el.dataset.factors || 'Factor1,Factor2';
    const rawLoads = el.dataset.loads || '0.85,0.12,0.78,0.21,0.15,0.88,0.09,0.79,0.18,0.91,0.25,0.14,0.82,0.11,0.93,0.19';

    const items = rawItems.split(',');
    const factors = rawFactors.split(',');
    const loads = rawLoads.split(',').map(Number);
    const nItems = items.length, nFactors = factors.length;

    const cellW = 70, cellH = 40, padL = 100, padT = 50, padB = 30, padR = 20;
    const W = padL + nFactors * cellW + padR + 80;
    const H = padT + nItems * cellH + padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        颜色越深表示载荷越强 | 红色=正载荷，蓝色=负载荷
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // Title
    ctx.fillStyle = '#333'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, (padL + nFactors * cellW) / 2 + padL / 2, 22);

    // Factor labels (top)
    factors.forEach((f, j) => {
      const x = padL + j * cellW + cellW / 2;
      ctx.fillStyle = '#333'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(f, x, padT - 10);
    });

    // Color scale
    const scaleW = 20, scaleH = nItems * cellH;
    const scaleX = padL + nFactors * cellW + 20;
    const grad = ctx.createLinearGradient(0, padT, 0, padT + scaleH);
    grad.addColorStop(0, '#e74c3c'); grad.addColorStop(0.5, '#f8f8f8'); grad.addColorStop(1, '#3498db');
    ctx.fillStyle = grad; ctx.fillRect(scaleX, padT, scaleW, scaleH);
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(scaleX, padT, scaleW, scaleH);
    ctx.fillStyle = '#666'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('+1', scaleX + scaleW / 2, padT - 4);
    ctx.fillText('0', scaleX + scaleW / 2, padT + scaleH / 2 + 4);
    ctx.fillText('-1', scaleX + scaleW / 2, padT + scaleH + 14);

    items.forEach((item, i) => {
      const y = padT + i * cellH + cellH / 2;
      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(item, padL - 8, y + 4);
      factors.forEach((f, j) => {
        const val = loads[i * nFactors + j] || 0;
        const x = padL + j * cellW;
        const alpha = Math.abs(val);
        if (val >= 0) ctx.fillStyle = `rgba(231,76,60,${alpha})`;
        else ctx.fillStyle = `rgba(52,152,219,${alpha})`;
        ctx.fillRect(x + 2, y - cellH / 2 + 2, cellW - 4, cellH - 4);
        ctx.fillStyle = Math.abs(val) > 0.5 ? '#fff' : '#333';
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(val.toFixed(2), x + cellW / 2, y + 4);
      });
    });
  }
registerViz('factorload', renderFactorLoad);

  function renderPSDist(el) {
    const id = 'psdist-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '倾向评分分布 (PSM)';
    const W = 560, H = 320;
    const padL = 50, padR = 20, padT = 30, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        蓝色: 处理组 | 红色: 对照组 | 重叠区域表示可匹配的样本
      </div>
      <div style="text-align:center;margin-top:8px;">
        <button id="${id}-overlap" style="padding:4px 14px;background:#27ae60;color:white;border:none;border-radius:4px;cursor:pointer;">高亮重叠区</button>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // Generate synthetic PS data (two groups, some overlap)
    const treated = Array.from({length: 120}, () => Math.random() * 0.4 + 0.4);
    const control = Array.from({length: 180}, () => Math.random() * 0.4 + 0.2);
    const allPS = treated.concat(control);
    const minPS = 0, maxPS = 1;

    const bins = 30;
    function hist(data, bins) {
      const h = Array(bins).fill(0);
      data.forEach(v => { const b = Math.min(Math.floor((v - minPS) / (maxPS - minPS) * bins), bins - 1); h[b]++; });
      return h;
    }
    const hT = hist(treated, bins), hC = hist(control, bins);
    const maxH = Math.max(...hT, ...hC);

    let highlightOverlap = false;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 18);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(padL + (i/5)*plotW, padT); ctx.lineTo(padL + (i/5)*plotW, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, padT + (i/5)*plotH); ctx.lineTo(padL + plotW, padT + (i/5)*plotH); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
      for (let i = 0; i <= 5; i++) {
        ctx.textAlign = 'center'; ctx.fillText((i/5).toFixed(1), padL + (i/5)*plotW, padT + plotH + 16);
        ctx.textAlign = 'right'; ctx.fillText(Math.round((1 - i/5) * maxH), padL - 6, padT + (i/5)*plotH + 4);
      }
      ctx.save(); ctx.translate(12, padT + plotH/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.fillText('频数', 0, 0); ctx.restore();
      ctx.textAlign = 'center'; ctx.fillText('倾向评分 (Propensity Score)', padL + plotW/2, H - 4);

      const barW = plotW / bins;
      const scaleY = v => (v / maxH) * plotH * 0.9;

      // Draw bars
      for (let b = 0; b < bins; b++) {
        const x = padL + (b / bins) * plotW;
        const inOverlap = treated[bins - 1 - b] > 0 && control[bins - 1 - b] > 0;
        if (highlightOverlap && inOverlap) {
          ctx.fillStyle = 'rgba(39,174,96,0.6)';
          ctx.fillRect(x, padT + plotH - scaleY(hT[bins - 1 - b]), barW - 1, scaleY(hT[bins - 1 - b]));
          ctx.fillStyle = 'rgba(39,174,96,0.6)';
          ctx.fillRect(x, padT + plotH - scaleY(hC[bins - 1 - b]), barW - 1, scaleY(hC[bins - 1 - b]));
        } else {
          ctx.fillStyle = 'rgba(52,152,219,0.65)';
          ctx.fillRect(x, padT + plotH - scaleY(hT[bins - 1 - b]), barW - 1, scaleY(hT[bins - 1 - b]));
          ctx.fillStyle = 'rgba(231,76,60,0.55)';
          ctx.fillRect(x, padT + plotH - scaleY(hC[bins - 1 - b]), barW - 1, scaleY(hC[bins - 1 - b]));
        }
      }

      // Legend
      ctx.fillStyle = 'rgba(52,152,219,0.7)'; ctx.beginPath(); ctx.arc(padL + 15, padT + 15, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('处理组', padL + 28, padT + 19);
      ctx.fillStyle = 'rgba(231,76,60,0.7)'; ctx.beginPath(); ctx.arc(padL + 100, padT + 15, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillText('对照组', padL + 113, padT + 19);
    }

    draw();
    document.getElementById(id + '-overlap').addEventListener('click', () => { highlightOverlap = !highlightOverlap; draw(); });
  }
registerViz('psdist', renderPSDist);

  function renderDoseResponse(el) {
    const id = 'dose-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '剂量-反应曲线';
    const W = 560, H = 320;
    const padL = 55, padR = 20, padT = 30, padB = 45;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:10px;">
        <label style="font-size:13px;">IC50:
          <input type="range" id="${id}-ic50" min="1" max="99" value="50" step="1" style="width:100px;">
          <span id="${id}-ic50v">50</span>
        </label>
        <label style="font-size:13px;">斜率:
          <input type="range" id="${id}-hill" min="1" max="20" value="5" step="1" style="width:100px;">
          <span id="${id}-hillv">1.0</span>
        </label>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    function sigmoid(x, ic50, hill) {
      return 1 / (1 + Math.pow(x / ic50, hill));
    }

    function drawCurve() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 18);

      const ic50 = parseFloat(document.getElementById(id + '-ic50v').textContent) / 100;
      const hill = parseFloat(document.getElementById(id + '-hillv').textContent);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(padL + (i/5)*plotW, padT); ctx.lineTo(padL + (i/5)*plotW, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, padT + (i/5)*plotH); ctx.lineTo(padL + plotW, padT + (i/5)*plotH); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
      for (let i = 0; i <= 5; i++) {
        ctx.textAlign = 'center'; ctx.fillText((i/5).toFixed(1), padL + (i/5)*plotW, padT + plotH + 16);
        ctx.textAlign = 'right'; ctx.fillText((1 - i/5).toFixed(1), padL - 6, padT + (i/5)*plotH + 4);
      }
      ctx.save(); ctx.translate(12, padT + plotH/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.fillText('反应率', 0, 0); ctx.restore();
      ctx.textAlign = 'center'; ctx.fillText('剂量 (对数刻度)', padL + plotW/2, H - 4);

      // IC50 reference
      const ic50X = padL + ic50 * plotW;
      ctx.setLineDash([4, 4]); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ic50X, padT); ctx.lineTo(ic50X, padT + plotH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('IC50=' + ic50.toFixed(2), ic50X, padT - 6);

      // Sigmoid curve
      ctx.beginPath(); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2.5;
      for (let i = 0; i <= 200; i++) {
        const dose = Math.pow(10, (i / 200) * 2 - 1); // 0.1 to 10 in log scale
        const normDose = (Math.log10(dose) + 1) / 2; // normalize to 0-1
        const resp = sigmoid(normDose, ic50, hill);
        const x = padL + normDose * plotW;
        const y = padT + (1 - resp) * plotH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Data points (simulated)
      const doses = [0.1, 0.2, 0.5, 1, 2, 5, 10];
      ctx.fillStyle = '#3498db';
      doses.forEach(d => {
        const normD = (Math.log10(d) + 1) / 2;
        const resp = sigmoid(normD, ic50, hill) + (Math.random() - 0.5) * 0.1;
        const x = padL + normD * plotW;
        const y = padT + (1 - Math.max(0, Math.min(1, resp))) * plotH;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      });
    }

    drawCurve();
    document.getElementById(id + '-ic50').addEventListener('input', () => {
      document.getElementById(id + '-ic50v').textContent = document.getElementById(id + '-ic50').value;
      drawCurve();
    });
    document.getElementById(id + '-hill').addEventListener('input', () => {
      document.getElementById(id + '-hillv').textContent = (document.getElementById(id + '-hill').value / 10).toFixed(1);
      drawCurve();
    });
  }
registerViz('dose', renderDoseResponse);

  function renderSplineRCS(el) {
    const id = 'splinercs-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '限制性立方样条 (RCS)';
    const W = 560, H = 320;
    const padL = 55, padR = 20, padT = 30, padB = 45;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📊 ${title}</div>
      <canvas id="${id}" width="${W}" height="${H}" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;font-size:13px;color:#555;margin-top:6px;">
        蓝色: 效应曲线 | 阴影: 95% CI | 红色虚线: 参考线 (OR=1)
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:8px;">
        <label style="font-size:13px;">弯曲度:
          <input type="range" id="${id}-k" min="2" max="6" value="4" step="1" style="width:80px;">
          <span id="${id}-kv">4</span> 节点
        </label>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // Simulate RCS curve with knots
    function rcsCurve(x, k) {
      const knots = [0.1, 0.275, 0.45, 0.625, 0.8, 0.9];
      // Simplified RCS: piecewise cubic
      const t = Math.max(0, Math.min(1, x));
      const base = Math.sin(t * Math.PI * 1.5) * 0.5 + 0.3;
      const curve = base + Math.sin(t * Math.PI * (k / 2)) * 0.2 * (k - 2) / 4;
      return Math.exp(curve);
    }

    function draw(k) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 18);

      // Grid
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(padL + (i/5)*plotW, padT); ctx.lineTo(padL + (i/5)*plotW, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, padT + (i/5)*plotH); ctx.lineTo(padL + plotW, padT + (i/5)*plotH); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
      for (let i = 0; i <= 5; i++) {
        ctx.textAlign = 'center'; ctx.fillText((i/5).toFixed(1), padL + (i/5)*plotW, padT + plotH + 16);
        ctx.fillText((1 - i/5).toFixed(1), padL - 6, padT + (i/5)*plotH + 4);
      }
      ctx.save(); ctx.translate(12, padT + plotH/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.fillText('log(OR)', 0, 0); ctx.restore();
      ctx.textAlign = 'center'; ctx.fillText('连续变量 X', padL + plotW/2, H - 4);

      // Reference line at y=0 (log(OR)=0 => OR=1)
      const refY = padT + plotH * 0.6;
      ctx.setLineDash([4, 4]); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(padL, refY); ctx.lineTo(padL + plotW, refY); ctx.stroke();
      ctx.setLineDash([]);

      // CI band
      ctx.fillStyle = 'rgba(52,152,219,0.15)';
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = padL + (i/200)*plotW;
        const y = padT + (1 - rcsCurve(i/200, k)) * plotH;
        const ciW = 20 + Math.sin(i/20) * 10;
        if (i === 0) ctx.moveTo(x, y - ciW); else ctx.lineTo(x, y - ciW);
      }
      for (let i = 200; i >= 0; i--) {
        const x = padL + (i/200)*plotW;
        const y = padT + (1 - rcsCurve(i/200, k)) * plotH;
        const ciW = 20 + Math.sin(i/20) * 10;
        ctx.lineTo(x, y + ciW);
      }
      ctx.closePath(); ctx.fill();

      // Curve
      ctx.beginPath(); ctx.strokeStyle = '#3498db'; ctx.lineWidth = 2.5;
      for (let i = 0; i <= 200; i++) {
        const x = padL + (i/200)*plotW;
        const y = padT + (1 - rcsCurve(i/200, k)) * plotH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    draw(4);
    document.getElementById(id + '-k').addEventListener('input', () => {
      document.getElementById(id + '-kv').textContent = document.getElementById(id + '-k').value;
      draw(parseInt(document.getElementById(id + '-k').value));
    });
  }
registerViz('splinercs', renderSplineRCS);
