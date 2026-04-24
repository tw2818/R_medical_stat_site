const LEGACY_TITLE_FILE_ALIASES = new Map([
  ['亚组分析和多因素回归的森林图.html', '1041-subgroupanalysis'],
]);

export function createChapterLookupMaps(allChapters) {
  const byFile = new Map(allChapters.map(chapter => [chapter.file, chapter]));
  const byTitleFile = new Map(allChapters.map(chapter => [`${chapter.title}.html`, chapter]));
  const byId = new Map(allChapters.map(chapter => [chapter.id, chapter]));

  LEGACY_TITLE_FILE_ALIASES.forEach((chapterId, legacyTitleFile) => {
    const chapter = byId.get(chapterId);
    if (chapter) byTitleFile.set(legacyTitleFile, chapter);
  });

  return { byFile, byTitleFile };
}

export function findChapterByHref(href, lookupMaps) {
  if (!href) return null;

  const cleaned = href.split('#')[0].replace(/^\.\//, '').trim();
  if (!cleaned || cleaned === 'index.html') return { type: 'home' };

  if (cleaned.startsWith('data/')) {
    const file = cleaned.slice('data/'.length);
    const chapter = lookupMaps.byFile.get(file);
    if (chapter) return { type: 'chapter', chapter };
  }

  const fileCandidate = cleaned.split('/').pop();
  const byFile = lookupMaps.byFile.get(fileCandidate);
  if (byFile) return { type: 'chapter', chapter: byFile };

  const byTitleFile = lookupMaps.byTitleFile.get(fileCandidate);
  if (byTitleFile) return { type: 'chapter', chapter: byTitleFile };

  return null;
}

export function injectCopyButtons(html) {
  return html.replace(
    /<button([^>]*)class="code-copy-button"([^>]*)>[\s\S]*?<\/button>/g,
    '<button$1class="code-copy-button chapter-copy-button"$2 type="button" title="复制代码" aria-label="复制代码">📋</button>'
  );
}

export function getHashChapterTarget(hash, allChapters) {
  const chapter = allChapters.find(item => item.id === hash);
  if (!chapter) return null;
  return { group: chapter.group, index: chapter.index };
}
