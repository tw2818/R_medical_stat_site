# Chapter 16 repeated-measures ANOVA teaching optimization

## Scope

Target file: `data/1004-repeatedanova.html` (Chapter 16: 重复测量方差分析).

Goal: improve teaching flow and component style while preserving all original R code/output examples.

## Constraints

- Preserve original generated HTML structure as much as possible.
- Preserve all original code-block anchors `cb1`–`cb22` with no duplicates or gaps.
- Do not replace the existing `rminteraction` visualization; fix its semantic mismatch if needed.
- Prefer compact `stat-viz` teaching cards plus short explanatory paragraphs (`⬆ 上方...`).
- Avoid large Quarto callout blocks and broad app-shell refactors.

## Audit summary

- Existing chapter has only one `stat-viz`: `data-type="rminteraction"`.
- Existing `rminteraction` renderer uses dummy values that contradict chapter 16.1 blood-pressure data.
- One prose typo: “第3例是治疗后血压” should be “第3列是治疗后血压”.
- Best teaching gaps:
  - wide-to-long data conversion
  - `Error(n/time)` and `Error(No/(times))` formula semantics
  - between-subject vs within-subject factor distinction
  - how to read the two ANOVA strata (`Error: n` / `Error: n:time`)
  - `anova_test()` output: Mauchly + GG/HF corrections
  - three kinds of post-hoc/multiple comparison in repeated-measures designs

## Implementation slice

1. Add `tests/repeated-anova-content.test.mjs`.
2. Add `js/viz/repeated-anova-guides.js` with compact card renderers:
   - `rm-wide-to-long-guide`
   - `rm-formula-guide`
   - `rm-factor-type-guide`
   - `rm-result-strata-guide`
   - `rm-anova-test-result-guide`
   - `rm-multcompare-guide`
3. Import the renderer from:
   - `js/viz/_bundle-presentation-modules.js`
   - `js/stats-viz.js` (consistent with prior chapter-specific guide imports)
4. Insert `stat-viz` placeholders in chapter 16 at natural teaching points:
   - after initial 16.1 design paragraph
   - after first long-format conversion output
   - before/after first `aov(... Error(n/time))` result explanation
   - after 16.2 long-format conversion output
   - after `anova_test()` output
   - before 16.3 multiple comparison subsections
5. Fix `rminteraction` data in `js/viz/hypothesis-nonparametric.js` so it reflects example 12-1 means:
   - treatment group: 125.2 → 113.6
   - control group: 121.6 → 103.6
6. Fix typo “第3例” → “第3列”.

## Verification

```bash
node --test tests/repeated-anova-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
python3 -m http.server 8000
curl -I http://127.0.0.1:8000/
curl -I http://127.0.0.1:8000/data/1004-repeatedanova.html
```
