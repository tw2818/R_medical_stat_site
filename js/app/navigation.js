export function resolveNavigationTarget(groupKey, index, chapters) {
  const list = chapters[groupKey] || [];
  const numericIndex = Number(index);
  if (!Number.isInteger(numericIndex) || numericIndex < 0) return null;

  const chapter = list[numericIndex];
  if (!chapter || !chapter.file || !chapter.id) return null;
  return { groupKey, index: numericIndex, chapter };
}

export function shouldSkipNavigation(currentPosition, groupKey, index) {
  return currentPosition.group === groupKey && currentPosition.index === index;
}

export function getActiveLinkSelector(groupKey, index) {
  return `.chapter-link[data-group="${groupKey}"][data-index="${index}"]`;
}
