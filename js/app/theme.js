export function updateThemeToggle({ root, button }) {
  if (!button) return;
  const isDark = root.getAttribute('data-theme') === 'dark';
  button.textContent = isDark ? '☀️' : '🌙';
  button.setAttribute('aria-label', isDark ? '切换浅色模式' : '切换深色模式');
}

export function initTheme({ root, button, storage }) {
  const saved = storage.getItem('rstat_theme');
  if (saved === 'dark' || saved === 'light') {
    root.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }
  updateThemeToggle({ root, button });
}

export function toggleTheme({ root, button, storage }) {
  const isDark = root.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  if (next === 'light') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', 'dark');
  }
  storage.setItem('rstat_theme', next);
  updateThemeToggle({ root, button });
}
