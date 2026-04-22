#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`✅ ${message}`);
}

function warn(message) {
  console.warn(`⚠️ ${message}`);
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sampleVariance(arr) {
  const m = mean(arr);
  return arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
}

function sd(arr) {
  return Math.sqrt(sampleVariance(arr));
}

function approxEqual(a, b, tolerance = 1e-6) {
  return Math.abs(a - b) <= tolerance;
}

function validateCaseShape(testCase, index) {
  const prefix = `case[${index}]${testCase.id ? ` (${testCase.id})` : ''}`;
  if (!testCase.id || typeof testCase.id !== 'string') {
    fail(`${prefix}: missing string id`);
    return false;
  }
  if (!testCase.component || typeof testCase.component !== 'string') {
    fail(`${prefix}: missing string component`);
    return false;
  }
  if (!testCase.input || typeof testCase.input !== 'object') {
    fail(`${prefix}: missing input object`);
    return false;
  }
  if (!testCase.expected || typeof testCase.expected !== 'object') {
    fail(`${prefix}: missing expected object`);
    return false;
  }
  return true;
}

function validateTTestCase(testCase) {
  if (testCase.mode === 'one-sample') {
    const sample = testCase.input.sample;
    const mu0 = testCase.input.mu0;
    if (!Array.isArray(sample) || sample.length < 2 || !sample.every(isNumber)) {
      fail(`${testCase.id}: one-sample t-test requires numeric sample length >= 2`);
      return;
    }
    if (!isNumber(mu0)) {
      fail(`${testCase.id}: one-sample t-test requires numeric mu0`);
      return;
    }

    const n = sample.length;
    const m = mean(sample);
    const s = sd(sample);
    const se = s / Math.sqrt(n);
    const df = n - 1;
    const tStat = (m - mu0) / se;

    const expectedN = testCase.expected.n;
    if (expectedN != null && expectedN !== n) {
      fail(`${testCase.id}: expected n=${expectedN} but sample length is ${n}`);
    } else {
      ok(`${testCase.id}: sample size matches expected n`);
    }

    if (typeof testCase.expected.xbar_approx === 'number') {
      if (!approxEqual(m, testCase.expected.xbar_approx)) {
        fail(`${testCase.id}: mean mismatch, computed ${m}, expected ${testCase.expected.xbar_approx}`);
      } else {
        ok(`${testCase.id}: sample mean matches expected baseline`);
      }
    }

    if (typeof testCase.expected.df === 'number') {
      if (df !== testCase.expected.df) {
        fail(`${testCase.id}: df mismatch, computed ${df}, expected ${testCase.expected.df}`);
      } else {
        ok(`${testCase.id}: one-sample df matches expected baseline`);
      }
    }

    if (!Number.isFinite(tStat)) {
      fail(`${testCase.id}: computed t statistic is not finite`);
    } else {
      ok(`${testCase.id}: one-sample t statistic is finite (${tStat.toFixed(4)})`);
    }
  }

  if (testCase.mode === 'two-sample-welch') {
    const g1 = testCase.input.group1;
    const g2 = testCase.input.group2;
    if (!Array.isArray(g1) || !Array.isArray(g2) || g1.length < 2 || g2.length < 2) {
      fail(`${testCase.id}: Welch test requires two numeric groups length >= 2`);
      return;
    }
    if (![...g1, ...g2].every(isNumber)) {
      fail(`${testCase.id}: Welch test groups must be numeric`);
      return;
    }

    const n1 = g1.length;
    const n2 = g2.length;
    const s1 = sd(g1);
    const s2 = sd(g2);
    const x1 = mean(g1);
    const x2 = mean(g2);
    const se = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2);
    const diff = x1 - x2;
    const num = (s1 * s1 / n1 + s2 * s2 / n2) ** 2;
    const denom = (s1 ** 4 / (n1 * n1 * (n1 - 1))) + (s2 ** 4 / (n2 * n2 * (n2 - 1)));
    const df = num / denom;
    const tStat = diff / se;

    ok(`${testCase.id}: Welch input shape valid`);

    if (!Number.isFinite(df) || df <= 0) {
      fail(`${testCase.id}: Welch df is invalid (${df})`);
    } else {
      ok(`${testCase.id}: Welch df is finite (${df.toFixed(4)})`);
    }

    if (testCase.expected.df_relation === 'non-integer allowed' && Number.isInteger(df)) {
      warn(`${testCase.id}: Welch df happened to be integer for this case; verify case sensitivity if needed`);
    }

    if (!Number.isFinite(tStat)) {
      fail(`${testCase.id}: Welch t statistic is not finite`);
    } else {
      ok(`${testCase.id}: Welch t statistic is finite (${tStat.toFixed(4)})`);
    }
  }
}

function validateChisqCase(testCase) {
  const table = testCase.input.table;
  if (!Array.isArray(table) || table.length < 2 || !table.every(row => Array.isArray(row) && row.length >= 2 && row.every(isNumber))) {
    fail(`${testCase.id}: chi-square case must provide numeric matrix at least 2x2`);
    return;
  }

  ok(`${testCase.id}: contingency table shape valid`);

  const rows = table.length;
  const cols = table[0].length;
  if (table.some(row => row.length !== cols)) {
    fail(`${testCase.id}: contingency table must be rectangular`);
    return;
  }

  const rowTotals = table.map(row => row.reduce((a, b) => a + b, 0));
  const colTotals = Array.from({ length: cols }, (_, j) => table.reduce((s, row) => s + row[j], 0));
  const total = rowTotals.reduce((a, b) => a + b, 0);
  const df = (rows - 1) * (cols - 1);
  let minExpected = Infinity;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / total;
      minExpected = Math.min(minExpected, expected);
    }
  }

  if (typeof testCase.expected.df === 'number') {
    if (df !== testCase.expected.df) {
      fail(`${testCase.id}: df mismatch, computed ${df}, expected ${testCase.expected.df}`);
    } else {
      ok(`${testCase.id}: chi-square df matches expected baseline`);
    }
  }

  if (!Number.isFinite(minExpected) || minExpected <= 0) {
    fail(`${testCase.id}: minimum expected count is invalid (${minExpected})`);
  } else {
    ok(`${testCase.id}: minimum expected count is finite (${minExpected.toFixed(4)})`);
  }
}

function validateKruskalCase(testCase) {
  const groups = testCase.input.groups;
  if (!groups || typeof groups !== 'object') {
    fail(`${testCase.id}: Kruskal case requires groups object`);
    return;
  }
  const values = Object.values(groups);
  if (values.length < 2 || values.some(arr => !Array.isArray(arr) || arr.length < 2 || !arr.every(isNumber))) {
    fail(`${testCase.id}: Kruskal groups must be numeric arrays length >= 2`);
    return;
  }
  ok(`${testCase.id}: Kruskal input groups valid`);

  const all = [];
  values.forEach((arr, groupIndex) => arr.forEach(v => all.push({ v, groupIndex })));
  all.sort((a, b) => a.v - b.v);
  let i = 0;
  while (i < all.length) {
    let j = i;
    while (j + 1 < all.length && all[j + 1].v === all[i].v) j++;
    const avgRank = (i + 1 + j + 1) / 2;
    for (let k = i; k <= j; k++) all[k].rank = avgRank;
    i = j + 1;
  }
  const rankSums = new Array(values.length).fill(0);
  all.forEach(item => { rankSums[item.groupIndex] += item.rank; });
  const N = all.length;
  const H = (12 / (N * (N + 1))) * rankSums.reduce((s, Ri, idx) => s + (Ri * Ri) / values[idx].length, 0) - 3 * (N + 1);
  if (!Number.isFinite(H)) {
    fail(`${testCase.id}: Kruskal H statistic is invalid`);
  } else {
    ok(`${testCase.id}: Kruskal H statistic is finite (${H.toFixed(4)})`);
  }
}

function validateFriedmanCase(testCase) {
  const blocks = testCase.input.blocks;
  if (!Array.isArray(blocks) || blocks.length < 2) {
    fail(`${testCase.id}: Friedman case requires block matrix`);
    return;
  }
  const width = blocks[0]?.length;
  if (!width || blocks.some(row => !Array.isArray(row) || row.length !== width || !row.every(isNumber))) {
    fail(`${testCase.id}: Friedman blocks must be rectangular numeric matrix`);
    return;
  }
  ok(`${testCase.id}: Friedman block matrix valid`);

  const b = blocks.length;
  const t = width;
  const rankSums = new Array(t).fill(0);
  blocks.forEach(row => {
    const indexed = row.map((v, idx) => ({ v, idx })).sort((a, b) => a.v - b.v);
    const ranks = new Array(t);
    let i = 0;
    while (i < t) {
      let j = i;
      while (j + 1 < t && indexed[j + 1].v === indexed[i].v) j++;
      const avgRank = (i + 1 + j + 1) / 2;
      for (let k = i; k <= j; k++) ranks[indexed[k].idx] = avgRank;
      i = j + 1;
    }
    ranks.forEach((r, idx) => { rankSums[idx] += r; });
  });
  const chiSq = (12 / (b * t * (t + 1))) * rankSums.reduce((s, Rj) => s + Rj * Rj, 0) - 3 * b * (t + 1);
  if (!Number.isFinite(chiSq)) {
    fail(`${testCase.id}: Friedman chi-square approximation is invalid`);
  } else {
    ok(`${testCase.id}: Friedman chi-square approximation is finite (${chiSq.toFixed(4)})`);
  }
}

function validateSurvivalCase(testCase) {
  if (!testCase.expected.step_function_monotone) {
    warn(`${testCase.id}: no monotonicity invariant declared`);
  } else {
    ok(`${testCase.id}: survival invariant declared`);
  }
}

function main() {
  const filePath = path.join(__dirname, 'stat_calculator_cases.json');
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${filePath}`);
    process.exit(process.exitCode || 1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON: ${error.message}`);
    process.exit(process.exitCode || 1);
  }

  if (!parsed || !Array.isArray(parsed.cases)) {
    fail('Top-level `cases` array is missing');
    process.exit(process.exitCode || 1);
  }

  ok(`Loaded ${parsed.cases.length} validation cases`);

  const seenIds = new Set();
  parsed.cases.forEach((testCase, index) => {
    if (!validateCaseShape(testCase, index)) return;
    if (seenIds.has(testCase.id)) {
      fail(`${testCase.id}: duplicate id`);
      return;
    }
    seenIds.add(testCase.id);

    switch (testCase.component) {
      case 'ttest':
        validateTTestCase(testCase);
        break;
      case 'chisq':
        validateChisqCase(testCase);
        break;
      case 'kruskal':
        validateKruskalCase(testCase);
        break;
      case 'friedman':
        validateFriedmanCase(testCase);
        break;
      case 'survival':
        validateSurvivalCase(testCase);
        break;
      default:
        warn(`${testCase.id}: no specialized validator for component ${testCase.component}`);
    }
  });

  if (process.exitCode && process.exitCode !== 0) {
    console.error('\nValidation finished with errors.');
    process.exit(process.exitCode);
  }

  console.log('\nValidation finished successfully.');
}

main();
