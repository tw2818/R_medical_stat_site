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

init();
setupObserver();
