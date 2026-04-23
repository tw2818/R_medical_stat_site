const WELCOME_ACTIONS = new Set(['scroll-task-nav', 'open-all-chapters']);

export function getWelcomeAction(action) {
  return WELCOME_ACTIONS.has(action) ? action : null;
}

export function shouldOpenSidebarFromOverlayClick(eventTarget, sidebar) {
  return eventTarget === sidebar;
}
