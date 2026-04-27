# Chapter 11 randomization teaching optimization

## Scope

Optimize `data/1012-randomgroup.html` (Chapter 11: 随机分组) with concise teaching components while preserving all original R examples and outputs.

## Constraints

- Preserve original code blocks (`cb1`–`cb13`).
- Keep existing widgets (`sequential`, `samplesizecalc`) unless broken.
- No large Quarto callouts; use stat-viz style components + short explanatory paragraphs.
- Interaction only where it directly supports learning.

## Findings

The chapter is concept-heavy: simple randomization, block randomization, and stratified randomization. It already contains useful R code, but the conceptual differences are mostly text-only.

Best additions:
- static overview of randomization method choice;
- interactive comparison of simple randomization vs complete randomization balance;
- static block randomization flow for sequential clinical enrollment;
- static stratified allocation matrix;
- static allocation concealment checklist around PDF/envelope generation.

## Plan

1. Add `tests/randomgroup-content.test.mjs` to guard:
   - code block IDs/count remain `cb1`–`cb13`;
   - existing widgets remain;
   - new randomization guide components exist;
   - no heavy Quarto callouts are introduced;
   - interactive code is limited to the balance demo.
2. Add `js/viz/randomization-guides.js`:
   - `randomization-methods`: method choice card grid;
   - `simple-random-balance`: interactive balance demo;
   - `block-random-flow`: static block/clinical enrollment flow;
   - `stratified-random-matrix`: static gender × group teaching matrix;
   - `allocation-concealment-note`: static concealment/reporting checklist.
3. Import the new module from `_bundle-presentation-modules.js`.
4. Insert components into the chapter intro, simple randomization, block randomization, and stratified randomization sections.
5. Verify with targeted test, full test suite, validation, syntax checks, and registry consistency.
