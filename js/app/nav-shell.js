export function getNextExpandedState(ariaExpanded) {
  return ariaExpanded !== 'true';
}

export function getPathTargetId(pathName) {
  return `path-${pathName}`;
}
