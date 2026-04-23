export function shouldCloseLightboxOnClick(eventTarget, overlay) {
  return eventTarget === overlay || Boolean(eventTarget?.classList?.contains('lightbox-close'));
}

export function shouldCloseLightboxOnEscape(event, overlay) {
  return event.key === 'Escape' && Boolean(overlay?.classList?.contains('show'));
}

export function shouldOpenLightboxForTarget(event) {
  return event.target.closest('#chapter-content img');
}
