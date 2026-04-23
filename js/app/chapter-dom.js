export function removeChapterScripts(mainElement) {
  mainElement.querySelectorAll('script').forEach(script => script.remove());
}

export function parseChapterMainContent(html, parser = new DOMParser()) {
  const doc = parser.parseFromString(html, 'text/html');
  const main = doc.getElementById('quarto-document-content');
  if (!main) throw new Error('无法解析章节内容');
  removeChapterScripts(main);
  return main.innerHTML;
}

export function removeBreadcrumbs(container) {
  container.querySelectorAll('.quarto-page-breadcrumbs').forEach(breadcrumb => breadcrumb.remove());
}
