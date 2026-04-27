import { CHAPTER_TEXT_PATCHES } from './chapter-patches-text.js';
import { CHAPTER_TEXT_EXTRA_PATCHES } from './chapter-patches-text-extra.js';
import { CHAPTER_WIDGET_PATCHES } from './chapter-patches-widgets.js';

function composePatches(filename) {
  return [
    ...(CHAPTER_TEXT_PATCHES[filename] || []),
    ...(CHAPTER_TEXT_EXTRA_PATCHES[filename] || []),
    ...(CHAPTER_WIDGET_PATCHES[filename] || [])
  ];
}

export function applyChapterPatches(container, filename) {
  const patches = composePatches(filename);
  patches.forEach(patch => patch(container));
}

export function listChapterPatchFiles() {
  const all = new Set([
    ...Object.keys(CHAPTER_TEXT_PATCHES),
    ...Object.keys(CHAPTER_TEXT_EXTRA_PATCHES),
    ...Object.keys(CHAPTER_WIDGET_PATCHES)
  ]);
  return Array.from(all).sort();
}
