import { initHomeEnhancements } from './home-enhancements.js';

const WELCOME_ACTIONS = new Set(['scroll-task-nav', 'open-all-chapters']);

function ensureHomeEnhancementStylesheet() {
  if (document.querySelector('link[href="css/home-enhancements.css"]')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/home-enhancements.css';
  document.head.appendChild(link);
}

function bootHomeEnhancements() {
  ensureHomeEnhancementStylesheet();
  initHomeEnhancements();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootHomeEnhancements, { once: true });
  } else {
    bootHomeEnhancements();
  }
}

export function getWelcomeAction(action) {
  return WELCOME_ACTIONS.has(action) ? action : null;
}

export function shouldOpenSidebarFromOverlayClick(eventTarget, sidebar) {
  return eventTarget === sidebar;
}
