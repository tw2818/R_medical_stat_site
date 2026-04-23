export function createAppState() {
  let currentGroup = null;
  let currentIndex = 0;
  let progressTimer = null;
  const chapterCache = new Map();

  return {
    getCurrentPosition() {
      return { group: currentGroup, index: currentIndex };
    },
    setCurrentPosition(group, index) {
      currentGroup = group;
      currentIndex = index;
    },
    resetCurrentPosition() {
      currentGroup = null;
      currentIndex = 0;
    },
    getProgressTimer() {
      return progressTimer;
    },
    setProgressTimer(timer) {
      progressTimer = timer;
    },
    clearProgressTimer() {
      progressTimer = null;
    },
    getCachedChapter(filename) {
      return chapterCache.get(filename);
    },
    cacheChapter(filename, html) {
      chapterCache.set(filename, html);
    },
    hasCachedChapter(filename) {
      return chapterCache.has(filename);
    },
  };
}
