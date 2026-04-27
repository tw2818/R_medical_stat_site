# Chapter 9 plotting teaching optimization

## Scope

Optimize `data/plotting.html` (Chapter 9: 统计绘图) with compact teaching components that match the style established in earlier chapters, especially the Chapter 8 Table 1 cards.

## Constraints

- Preserve all original R code blocks and generated figure output.
- Do not add large Quarto callouts.
- Use `stat-viz` style compact cards with short explanatory paragraphs.
- Reuse existing chart renderers where sufficient.
- Add a small dedicated guide renderer only for high-level plotting decisions and workflow guidance.
- Keep the slice focused on Chapter 9 content and related lightweight renderer/tests.

## Findings

Chapter 9 already has many chart widgets (`bar`, `scatter`, `hist`, `box`, `stemleaf`, `errorbar`, `area`, `heatmap`, `ridgeline`, `radar`, `qqplot`, `blandaltman`, etc.). The main gap is not a lack of chart types, but lack of a chapter-level learning scaffold for choosing and polishing charts.

Early sections 9.2–9.5 also lack immediate interactive examples despite having clear tabular data in code blocks.

## Plan

1. Add `tests/plotting-content.test.mjs` to guard:
   - original code block ids/count stay present (`cb1`–`cb29`)
   - new guide markers exist
   - selected early-section widgets exist
   - no Quarto callout blocks are introduced
2. Add `js/viz/plotting-guides.js`:
   - `plotting-workflow`
   - `plotting-chart-choice`
   - `plotting-polish-checklist`
3. Import the guide module through the existing presentation bundle.
4. Edit `data/plotting.html` only around prose/component insertion points:
   - after intro resource list: chart workflow card
   - after 9.1 first widget: chart choice card
   - add concise widgets after 9.2, 9.3, 9.4, 9.5 examples using existing `bar`, `spine`, `scatter` where appropriate
   - near the end after Bland-Altman: final polish checklist
5. Verify with targeted test, full tests, validation, syntax checks, and registry consistency.
