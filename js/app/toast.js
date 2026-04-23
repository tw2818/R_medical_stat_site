export function createToastLifecycle(documentRef = document, schedule = setTimeout) {
  return {
    show(message) {
      const existing = documentRef.querySelector('.toast');
      if (existing) existing.remove();
      const toast = documentRef.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      documentRef.body.appendChild(toast);
      schedule(() => toast.classList.add('show'), 10);
      schedule(() => {
        toast.classList.remove('show');
        schedule(() => toast.remove(), 300);
      }, 2000);
    },
  };
}
