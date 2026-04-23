export function resolveNavigationTarget(groupKey, index, chapters) {
  const list = chapters[groupKey] || [];
  const chapter = list[index];
  if (!chapter) return null;
  return { groupKey, index, chapter };
}

export function shouldSkipNavigation(currentPosition, groupKey, index) {
  return currentPosition.group === groupKey && currentPosition.index === index;
}

export function getActiveLinkSelector(groupKey, index) {
  return `.chapter-link[data-group="${groupKey}"][data-index="${index}"]`;
}
