// ================================================================
// stats-viz.js - 主入口，ES Module
// 依赖: jStat (https://cdn.jsdelivr.net/npm/jstat@1.9.6/dist/jstat.min.js)
// ================================================================

import { init, setupObserver } from './viz/_core.js';
import './viz/_bundle-core-modules.js';
import './viz/_bundle-categorical-modules.js';
import './viz/_bundle-bivariate-modules.js';
import './viz/_bundle-presentation-modules.js';
import './viz/table1-guides.js';
import './viz/tidy-flow-guides.js';
import './viz/factorial-design-guides.js';
import './viz/repeated-measures-guides.js';
import './viz/repeated-anova-guides.js';
import './viz/ancova-guides.js';
import './viz/anova-attention-guides.js';
import './viz/hotelling-guides.js';
import './viz/multireg-guides.js';
import './viz/logistic-guides.js';
import './viz/loglinear-guides.js';
import './viz/poisson-guides.js';
import './viz/codescheme-guides.js';
import './viz/survival-guides.js';
import './viz/survivalvis-guides.js';
import './viz/discriminant-guides.js';

// 暴露到 window，让 app.js 在章节内容加载完成后可调用
window.initStatViz = init;
window.setupStatVizObserver = setupObserver;

init();
setupObserver();
