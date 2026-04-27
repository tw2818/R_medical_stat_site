# Chapter 10 sample-size teaching optimization

## Scope

Optimize `data/1011-samplesize.html` (Chapter 10: 样本量计算) with teaching components that clarify power-analysis concepts while preserving original examples and code.

## Constraints

- Preserve all original R code blocks (`cb1`–`cb9`).
- Keep existing meaningful interactive calculators (`power`, `samplesizecalc`, `proppower`, `corrpower`).
- Do not add calculators just for novelty; interaction must serve learning.
- Prefer compact stat-viz teaching cards and short explanatory paragraphs.
- Avoid large Quarto callouts.

## Findings

The chapter already has useful interactive calculation widgets. The main gaps are:
- the four core parameters of power analysis are introduced as a plain list;
- the long `pwr.t.test()` argument explanation is a wall of text;
- learners may miss whether `n` means total sample size or per-group sample size;
- ANOVA sample-size calculation needs a static decision note explaining why PASS is preferred.

## Plan

1. Add `tests/samplesize-content.test.mjs` to guard:
   - original code block IDs/count remain (`cb1`–`cb9`)
   - existing calculators remain present
   - new guide markers exist
   - no large Quarto callouts are introduced
2. Add `js/viz/sample-size-guides.js` with compact teaching cards:
   - `sample-size-params`: four-parameter relationship (`n`, `α`, power, effect size)
   - `pwr-t-params`: `pwr.t.test()` argument guide
   - `sample-size-output-guide`: how to read `n`, per-group vs total, and rounding up
   - `anova-sample-size-note`: why ANOVA sample size is hard in R and when to use PASS
3. Import the guide module through `_bundle-presentation-modules.js`.
4. Insert components around the chapter intro, t-test section, two-sample output, ANOVA section, and rate-comparison sections.
5. Verify with targeted test, full test suite, validation, syntax checks, and registry consistency.
