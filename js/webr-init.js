// WebR 初始化
(function() {
  const statusEl = document.getElementById('webr-status');
  const outputEl = document.getElementById('code-output');

  window.webRInstance = null;
  window.webRReady = false;

  async function initWebR() {
    try {
      statusEl.textContent = '⚙️ 加载 WebR...';
      const { WebR } = await import('https://cdn.jsdelivr.net/npm/webr@0.2.1/+esm');
      window.webRInstance = new WebR();
      await window.webRInstance.init();
      window.webRReady = true;
      statusEl.textContent = '✅ WebR 就绪';
      statusEl.style.color = '#51cf66';
    } catch (err) {
      statusEl.textContent = '❌ WebR 加载失败';
      statusEl.style.color = '#ff6b6b';
      outputEl.innerHTML = '<span class="error">WebR 加载失败，请刷新页面重试。</span>';
    }
  }

  initWebR();
})();
