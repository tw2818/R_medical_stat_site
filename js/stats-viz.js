// ================================================================
// stats-viz.js - 主入口，ES Module
// 依赖: jStat (https://cdn.jsdelivr.net/npm/jstat@1.9.6/dist/jstat.min.js)
// ================================================================

import { init, setupObserver } from './viz/_core.js';
import './viz/distributions.js';
import './viz/hypothesis-nonparametric.js';
import './viz/hypothesis-remaining.js';
import './viz/clinical-models.js';
import './viz/structure-diagrams.js';
import './viz/survival.js';
import './viz/visualization.js';
import './viz/advanced.js';
import './viz/meta.js';
import './viz/calculators.js';
import './viz/discrete-inference.js';
import './viz/categorical-trends.js';
import './viz/categorical-tests.js';
import './viz/categorical-displays.js';
import './viz/overrides.js';

// 暴露到 window，让 app.js 在章节内容加载完成后可调用
window.initStatViz = init;
window.setupStatVizObserver = setupObserver;

init();
setupObserver();
