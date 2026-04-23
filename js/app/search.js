export function findMatchingChapters(query, allChapters, limit = 8) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return allChapters
    .filter(chapter => [chapter.title, chapter.groupName, chapter.file, String(chapter.num)]
      .some(field => String(field).toLowerCase().includes(normalizedQuery)))
    .slice(0, limit);
}
