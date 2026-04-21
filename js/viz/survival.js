import { registerViz } from './_core.js';

// ==========================================================
// SURVIVAL - 统计可视化模块
// ==========================================================

// ============================================================
// SURVIVAL - 统计可视化模块
// ============================================================

  function renderKM(el) {
    const times = JSON.parse(el.dataset.times || '[3,5,8,12,15,20,25]');
    const status = JSON.parse(el.dataset.status || '[1,1,0,1,0,1,0]');
    const title = el.dataset.title || 'Kaplan-Meier 生存曲线';

    el.innerHTML = `
      <div class="viz-card">
        <div class="viz-header">📊 ${title}</div>
        <div class="viz-body">
          <canvas class="viz-canvas" style="width:100%;max-width:640px;height:300px;display:block;margin:0 auto;"></canvas>
        </div>
        <div class="viz-result" style="text-align:center;font-size:13px;padding:6px;color:#555;background:#f8f9fa;border-top:1px solid #eee;"></div>
      </div>
    `;

    const canvas = el.querySelector('canvas');
    const resultDiv = el.querySelector('.viz-result');

    function draw() {
      const ctx = canvas.getContext('2d');
      const W = canvas.offsetWidth * 2, H = 600;
      canvas.width = W; canvas.height = H;
      const pad = { l: 60, r: 30, t: 30, b: 55 };
      const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

      ctx.clearRect(0, 0, W, H);

      // Compute KM curve — sort by time, track events vs censored
      const n = times.length;
      // Pair times with status, sort by time
      const paired = times.map((t, i) => ({ t, e: status[i] }));
      paired.sort((a, b) => a.t - b.t);
      const sortedTimes = paired.map(p => p.t);
      const sortedEvents = paired.map(p => p.e);

      let surv = 1.0;
      const steps = [{ t: 0, s: 1 }]; // (time, survival probability)
      let atRisk = n;

      for (let i = 0; i < n; i++) {
        // Skip duplicate time entries — process each unique time only once
        if (i > 0 && sortedTimes[i] === sortedTimes[i - 1]) continue;
        const t = sortedTimes[i];
        // Count all observations (events + censored) at this exact time
        let countAtTime = 0, eventsAtTime = 0;
        for (let j = i; j < n && sortedTimes[j] === t; j++) {
          countAtTime++;
          if (sortedEvents[j] === 1) eventsAtTime++;
        }
        if (eventsAtTime > 0) {
          surv *= (atRisk - eventsAtTime) / atRisk;
          steps.push({ t, s: surv });
        }
        // Reduce at-risk by ALL observations at this time (events + censored)
        atRisk -= countAtTime;
        if (countAtTime > 0 && eventsAtTime === 0) {
          steps.push({ t, s: surv });
        }
      }

      // Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b);
      ctx.stroke();
      ctx.fillStyle = '#555'; ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('生存时间', W / 2, H - 6);
      ctx.save(); ctx.translate(16, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('生存概率 S(t)', 0, 0); ctx.restore();

      // Grid
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (i / 4) * ih;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
        ctx.fillStyle = '#666'; ctx.font = '18px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText((1 - i * 0.25).toFixed(2), pad.l - 6, y + 6);
      }

      // Step function — horizontal then vertical at each event
      ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t + ih * (1 - steps[0].s));
      let prevX = pad.l;
      for (let i = 1; i < steps.length; i++) {
        const x = pad.l + (steps[i].t / sortedTimes[n - 1]) * iw;
        const currY = pad.t + ih * (1 - steps[i].s);
        // Horizontal line from previous x to current x at previous y
        ctx.lineTo(x, pad.t + ih * (1 - steps[i - 1].s));
        // Vertical drop at current x
        ctx.lineTo(x, currY);
        prevX = x;
      }
      // Extend to end of time axis
      ctx.lineTo(W - pad.r, pad.t + ih * (1 - steps[steps.length - 1].s));
      ctx.stroke();

      // Censored marks — find plateau y for each censored time
      for (let i = 0; i < n; i++) {
        if (sortedEvents[i] === 0) {
          const x = pad.l + (sortedTimes[i] / sortedTimes[n - 1]) * iw;
          // Find the plateau y at this censored time (last step before this time)
          let plateauS = 1;
          for (let j = steps.length - 1; j >= 0; j--) {
            if (steps[j].t <= sortedTimes[i]) { plateauS = steps[j].s; break; }
          }
          const y = pad.t + ih * (1 - plateauS);
          ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke();
        }
      }

      // Median survival (S=0.5 line)
      const medianY = pad.t + ih * 0.5;
      ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(pad.l, medianY); ctx.lineTo(W - pad.r, medianY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#27ae60'; ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('S=0.5', W - pad.r - 50, medianY - 4);

      // Legend
      ctx.fillStyle = '#2980b9'; ctx.fillRect(pad.l + 10, pad.t + 8, 20, 3);
      ctx.fillStyle = '#555'; ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('生存曲线', pad.l + 38, pad.t + 12);
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pad.l + 10, pad.t + 24); ctx.lineTo(pad.l + 30, pad.t + 24); ctx.stroke();
      ctx.fillStyle = '#555';
      ctx.fillText('截尾', pad.l + 38, pad.t + 28);

      // Result text
      const events = sortedEvents.filter(e => e === 1).length;
      const censored = n - events;
      // Median survival time: first step where S(t) <= 0.5
      let medianSurv = 'N/A';
      for (let i = 0; i < steps.length; i++) {
        if (steps[i].s <= 0.5) { medianSurv = steps[i].t; break; }
      }
      resultDiv.innerHTML = `n=${n} &nbsp;|&nbsp; 事件数=${events} &nbsp;|&nbsp; 截尾数=${censored} &nbsp;|&nbsp; 中位生存时间=${medianSurv}`;
    }

    draw();
  }
registerViz('km', renderKM);

  // ── 泊松分布可视化 ──────────────────────────────────
  // <div class="stat-viz" data-type="poisson" data-lambda="5" data-title="泊松分布 P(λ)"></div>

  function renderSurvivalComp(el) {
    const id = 'surv-comp-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '两组生存曲线比较';

    el.innerHTML = `<div class="viz-card">
      <div class="viz-header">📈 ${title}</div>
      <canvas id="${id}" width="560" height="320" style="display:block;margin:0 auto;"></canvas>
      <div style="text-align:center;margin-top:8px;">
        <span style="display:inline-block;width:20px;height:3px;background:#e74c3c;vertical-align:middle;margin-right:4px;"></span> 组1
        <span style="display:inline-block;width:20px;height:3px;background:#2980b9;vertical-align:middle;margin-left:16px;margin-right:4px;"></span> 组2
        <span style="margin-left:16px;font-size:13px;color:#555;">中位生存时间: <strong id="${id}-med1">--</strong> vs <strong id="${id}-med2">--</strong></span>
      </div>
    </div>`;

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const W = 560, H = 320;
    const padL = 55, padR = 15, padT = 20, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    // Generate two survival curve datasets (模拟肺癌 male vs female 分组)
    function generateKMData(n, lambda, seed) {
      const events = [], times = [];
      for (let i = 0; i < n; i++) {
        const t = -Math.log(1 - Math.random()) / lambda * (0.7 + Math.random() * 0.6);
        const status = Math.random() > 0.3 ? 1 : 0;
        times.push(t); events.push(status);
      }
      const sorted = times.map((t, i) => ({ t, e: events[i] })).sort((a, b) => a.t - b.t);
      // 标准 Kaplan-Meier product-limit 估计
      // Step 1: 按时间排序（已在上面完成）
      // Step 2: 按时间点聚合（同一时间可能有多个事件）
      let surv = 1, S = [1], T = [0];
      let atRisk = sorted.length; // 初始 at-risk = 总样本量
      let i = 0;
      while (i < sorted.length) {
        const currentTime = sorted[i].t;
        // Count events at this exact time
        let d = 0;
        while (i < sorted.length && sorted[i].t === currentTime && sorted[i].e === 1) {
          d++; i++;
        }
        // Count censored at this exact time
        let c = 0;
        while (i < sorted.length && sorted[i].t === currentTime && sorted[i].e === 0) {
          c++; i++;
        }
        // Update KM product-limit: reduce at-risk by ALL observations at this time
        if (atRisk > 0 && d > 0) {
          surv *= (atRisk - d) / atRisk;
          S.push(surv);
          T.push(currentTime);
        }
        atRisk -= (d + c);
      }
      return { T, S };
    }

    const group1 = generateKMData(138, 0.015);
    const group2 = generateKMData(90, 0.022);

    const allTimes = [...group1.T, ...group2.T].sort((a, b) => a - b);
    const maxT = Math.max(...allTimes);

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW, y = padT + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

    // Y axis label
    ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('生存概率 S(t)', W / 2, H - 4);
    ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('生存时间', 0, 0); ctx.restore();

    // X axis label
    ctx.fillText('时间', padL + plotW / 2, H - 4);

    // Y tick labels
    ctx.font = '11px sans-serif';
    for (let i = 0; i <= 5; i++) {
      ctx.textAlign = 'right';
      ctx.fillText((1 - i / 5).toFixed(1), padL - 6, padT + (i / 5) * plotH + 4);
      ctx.textAlign = 'center';
      ctx.fillText(Math.round((i / 5) * maxT) + '', padL + (i / 5) * plotW, padT + plotH + 16);
    }

    function drawStepCurve(T, S, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath();
      T.forEach((t, i) => {
        const x = padL + (t / maxT) * plotW;
        const y = padT + (1 - S[i]) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else {
          const prevX = padL + (T[i - 1] / maxT) * plotW;
          ctx.lineTo(x, padT + (1 - S[i - 1]) * plotH);
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    drawStepCurve(group1.T, group1.S, '#e74c3c');
    drawStepCurve(group2.T, group2.S, '#2980b9');

    // Median survival (approximate)
    function getMedian(T, S) {
      for (let i = 0; i < S.length; i++) { if (S[i] <= 0.5) return T[i]; }
      return T[T.length - 1];
    }
    document.getElementById(id + '-med1').textContent = getMedian(group1.T, group1.S).toFixed(0) + 'd';
    document.getElementById(id + '-med2').textContent = getMedian(group2.T, group2.S).toFixed(0) + 'd';

    // Legend
    ctx.fillStyle = '#e74c3c'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('● 组1 (n=138)', padL + 10, padT + 18);
    ctx.fillStyle = '#2980b9';
    ctx.fillText('● 组2 (n=90)', padL + 120, padT + 18);
  }
registerViz('survcomp', renderSurvivalComp);

  // ============================================================
  // Histogram with Normal Distribution Overlay
  // ============================================================

  function renderCalibrationCurve(el) {
    const id = 'cal-' + Math.random().toString(36).slice(2, 8);
    const title = el.dataset.title || '校准曲线';
    let pred = el.dataset.pred ? JSON.parse(el.dataset.pred) : [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    let obs = el.dataset.obs ? JSON.parse(el.dataset.obs) : [0.12, 0.18, 0.28, 0.38, 0.52, 0.65, 0.72, 0.82, 0.88];
    const W = 480, H = 380;
    el.innerHTML = '<div class="viz-card"><div class="viz-header">📊 ' + title + '</div><canvas id="' + id + '" width="' + W + '" height="' + H + '" style="display:block;margin:0 auto;"></canvas><div id="' + id + '-info" style="text-align:center;font-size:12px;color:#555;margin-top:4px;"></div></div>';
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const pad = {t: 35, r: 30, b: 50, l: 55};
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 22);
    // Grid
    ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const xv = pad.l + (i / 5) * iW, yv = pad.t + (i / 5) * iH;
      ctx.beginPath(); ctx.moveTo(xv, pad.t); ctx.lineTo(xv, pad.t + iH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.l, yv); ctx.lineTo(pad.l + iW, yv); ctx.stroke();
    }
    // Perfect calibration line (45°)
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t + iH); ctx.lineTo(pad.l + iW, pad.t); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('完美校准', pad.l + iW * 0.65, pad.t + iH * 0.3);
    // LOESS/line of best fit through points
    const xOf = v => pad.l + v * iW;
    const yOf = v => pad.t + (1 - v) * iH;
    // Draw observed points
    ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 2;
    ctx.beginPath();
    pred.forEach((p, i) => {
      const x = xOf(p), y = yOf(obs[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    pred.forEach((p, i) => {
      const x = xOf(p), y = yOf(obs[i]);
      ctx.fillStyle = '#2980b9'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    });
    // Axes
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + iH); ctx.lineTo(pad.l + iW, pad.t + iH); ctx.stroke();
    ctx.fillStyle = '#666'; ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const v = i / 5;
      ctx.fillText(v.toFixed(1), xOf(v), pad.t + iH + 15);
      ctx.textAlign = 'right'; ctx.fillText(v.toFixed(1), pad.l - 5, yOf(v) + 4);
    }
    ctx.save(); ctx.translate(14, pad.t + iH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
    ctx.fillText('预测概率', 0, 0); ctx.restore();
    ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
    ctx.fillText('实际发生率', pad.l + iW / 2, H - 4);
    // Stats: Hosmer-Lemeshow approximation
    let hlChi2 = 0;
    pred.forEach((p, i) => { const e = (obs[i] - p); hlChi2 += e * e / (p * (1 - p) + 0.001); });
    document.getElementById(id + '-info').textContent = '提示：点越接近对角线，模型校准越好';
  }
registerViz('calibration', renderCalibrationCurve);
