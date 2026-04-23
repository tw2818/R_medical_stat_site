export function findCodeBlockText(button) {
  const wrapper = button.closest ? button.closest('div') : null;
  const pre = wrapper ? wrapper.querySelector('pre') : button.nextElementSibling;
  if (!pre || pre.tagName !== 'PRE') return null;
  const code = pre.querySelector ? pre.querySelector('code') : null;
  return code ? code.textContent : pre.textContent;
}

export function ensureDetailsHaveSummary(detailsList, documentRef = document) {
  detailsList.forEach(detail => {
    if (!detail.querySelector('summary')) {
      const summary = documentRef.createElement('summary');
      summary.textContent = '详情';
      detail.insertBefore(summary, detail.firstChild);
    }
  });
}

export function createCalloutController(callout, header, documentRef = document) {
  const toggle = documentRef.createElement('span');
  toggle.className = 'callout-toggle';
  toggle.textContent = '▶';
  toggle.style.cursor = 'pointer';
  header.appendChild(toggle);
  header.addEventListener('click', () => {
    callout.classList.toggle('callout-collapsed');
    toggle.textContent = callout.classList.contains('callout-collapsed') ? '▶' : '▼';
  });
  return toggle;
}

export function prepareCallouts(callouts, documentRef = document) {
  callouts.forEach(callout => {
    callout.classList.add('callout-collapsed');
    const header = callout.querySelector('.callout-header');
    if (header) createCalloutController(callout, header, documentRef);
  });
}
