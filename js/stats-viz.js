// ================================================================
// stats-viz.js - 主入口，ES Module
// 依赖: jStat (https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js)
// ================================================================

import { init, setupObserver } from './viz/_core.js';
import './viz/distributions.js';
import './viz/hypothesis.js';
import './viz/regression.js';
import './viz/survival.js';
import './viz/visualization.js';
import './viz/advanced.js';
import './viz/meta.js';
import './viz/calculators.js';
import './viz/overrides.js';

// 暴露到 window，让 app.js 在章节内容加载完成后可调用
window.initStatViz = init;
window.setupStatVizObserver = setupObserver;

init();
setupObserver();
