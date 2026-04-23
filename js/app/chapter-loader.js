export function shouldUseCachedChapter(appState, filename) {
  return appState.hasCachedChapter(filename);
}

export function createLoaderLifecycle(appState, clearTimer) {
  return {
    beforeLoad() {
      const progressTimer = appState.getProgressTimer();
      if (progressTimer) {
        clearTimer(progressTimer);
        appState.clearProgressTimer();
      }
    },
  };
}

export function createChapterProgressTimer({ chapterId, appState, schedule, saveProgress, delay = 30000 }) {
  if (!chapterId) return null;
  const timer = schedule(() => {
    saveProgress(chapterId);
    appState.clearProgressTimer();
  }, delay);
  appState.setProgressTimer(timer);
  return timer;
}
