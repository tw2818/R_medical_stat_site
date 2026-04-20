"use strict";

// ===== 状态 =====
let currentGroup = null;
let currentIndex = 0;
let currentChapterData = null;
let codePanelOpen = false;

// ===== DOM =====
const $ = id => document.getElementById(id);

// ===== 主题 =====
function initTheme() {
  const saved = localStorage.getItem('rstat_theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
}
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('rstat_theme', 'light');
    $('theme-toggle').textContent = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('rstat_theme', 'dark');
    $('theme-toggle').textContent = '☀️';
  }
}

// ===== 导航构建 =====
function buildNav() {
  const groups = [
    { key: 'basic', el: 'basic-chapters', label: '基础统计分析', count: CHAPTERS.basic.length },
    { key: 'advanced', el: 'advanced-chapters', label: '高级统计分析', count: CHAPTERS.advanced.length },
    { key: 'literature', el: 'literature-chapters', label: '文献常见统计分析', count: CHAPTERS.literature.length },
    { key: 'other', el: 'other-chapters', label: '其他合集', count: CHAPTERS.other.length },
  ];

  groups.forEach(g => {
    const countEl = $(g.key + '-count');
    if (countEl) countEl.textContent = `0/${g.count}`;

    const header = document.querySelector(`[data-group="${g.key}"]`);
    if (!header) return;
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      header.classList.toggle('open');
      content.classList.toggle('open');
    });

    const container = $(g.el);
    CHAPTERS[g.key].forEach((ch, i) => {
      const item = document.createElement('div');
      item.className = 'nav-item';
      item.dataset.group = g.key;
      item.dataset.index = i;
      item.innerHTML = `<span class="nav-num">${ch.num}</span><span>${ch.title}</span>`;
      item.addEventListener('click', () => loadChapter(g.key, i));
      container.appendChild(item);
    });
  });
}

// ===== 搜索 =====
function initSearch() {
  const input = $('search-input');
  const results = $('search-results');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.classList.remove('show'); return; }
    const matches = ALL_CHAPTERS.filter(c =>
      c.title.toLowerCase().includes(q) || c.num.includes(q)
    );
    if (!matches.length) { results.classList.remove('show'); return; }
    results.innerHTML = matches.map(m =>
      `<div class="search-result-item" data-group="${m.group}" data-index="${ALL_CHAPTERS.indexOf(m)}">${m.num} · ${m.title} <small style="opacity:.5">— ${m.groupName}</small></div>`
    ).join('');
    results.classList.add('show');
    results.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const group = item.dataset.group;
        const idx = parseInt(item.dataset.index);
        const actualIdx = CHAPTERS[group].findIndex(c => c.id === ALL_CHAPTERS[idx].id);
        if (actualIdx >= 0) loadChapter(group, actualIdx);
        results.classList.remove('show');
        input.value = '';
      });
    });
  });
  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !results.contains(e.target)) results.classList.remove('show');
  });
}

// ===== 章节加载 =====
async function loadChapter(group, index) {
  const chapters = CHAPTERS[group];
  if (!chapters || index < 0 || index >= chapters.length) return;
  const ch = chapters[index];
  currentGroup = group;
  currentIndex = index;

  // 高亮
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll(`.nav-item[data-group="${group}"][data-index="${index}"]`).forEach(el => el.classList.add('active'));

  // 更新顶部栏
  $('current-chapter-title').textContent = `${ch.num}. ${ch.title}`;

  // 切换可见章节
  $('welcome').classList.remove('active');
  $('chapter-content').classList.add('active');

  // 渲染加载状态
  $('chapter-content').innerHTML = '<div class="content-block"><div style="text-align:center;padding:40px"><div class="loading-spinner"></div><br>正在加载章节内容...</div></div>';

  try {
    // 优先从本地缓存读取，否则远程获取
    let html;
    const localPath = `data/${ch.id}.html`;
    try {
      const resp = await fetch(localPath);
      if (resp.ok) {
        html = await resp.text();
      } else {
        throw new Error('local not found');
      }
    } catch {
      const resp = await fetch(ch.url);
      html = await resp.text();
    }

    const content = parseChapterHTML(html, ch, group);
    $('chapter-content').innerHTML = content;
    currentChapterData = content;
    saveProgress(ch.id);

    // 预填代码到编辑器
    const firstCode = $('chapter-content').querySelector('pre code');
    if (firstCode) {
      $('code-editor').value = firstCode.textContent;
    }

    // 渲染代码高亮
    Prism.highlightAll();

    // 绑定代码块按钮
    bindCodeBlockActions();

    // 滚动到顶部
    $('content-wrapper').scrollTop = 0;
  } catch (err) {
    $('chapter-content').innerHTML = `<div class="content-block"><h3>❌ 加载失败</h3><p>无法加载章节内容：${ch.title}</p><p>错误：${err.message}</p><button class='btn-primary' onclick='loadChapter("${group}",${index})'>重试</button></div>`;
  }

  // 关闭移动端侧边栏
  $('sidebar').classList.remove('open');
}

// ===== HTML 解析（核心）====
function parseChapterHTML(html, ch, group) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 移除不必要元素
  doc.querySelectorAll('nav, footer, header, .navbar, .sidebar, script, style, iframe, .related-chapters, .edit-link, .pagination').forEach(el => el.remove());

  // 提取标题
  const h1 = doc.querySelector('h1') || doc.querySelector('h2') || doc.querySelector('h3');
  const title = h1 ? h1.textContent.trim() : ch.title;
  const categoryMap = { basic: '📈 基础统计分析', advanced: '🔬 高级统计分析', literature: '📚 文献常见统计分析', other: '📎 其他合集' };
  const category = categoryMap[group] || '其他';

  // 构建输出
  let body = '';
  const main = doc.querySelector('main') || doc.body;
  const contentEls = main.children;

  for (const el of contentEls) {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent.trim();

    if (!text || text.length < 5) continue;

    // 标题层级
    if (tag === 'h1' && !text.includes('R语言实战医学统计')) {
      body += `<h2>${text}</h2>`;
    } else if (tag === 'h2') {
      body += `<h3>${text}</h3>`;
    } else if (tag === 'h3' || tag === 'h4') {
      body += `<h4>${text}</h4>`;
    }
    // 段落
    else if (tag === 'p') {
      body += `<p>${processInline(el.innerHTML)}</p>`;
    }
    // 列表
    else if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(el.querySelectorAll('li')).map(li => `<li>${processInline(li.innerHTML)}</li>`).join('');
      body += tag === 'ul' ? `<ul>${items}</ul>` : `<ol>${items}</ol>`;
    }
    // 预格式化
    else if (tag === 'pre') {
      const code = el.querySelector('code') || el;
      const lang = detectLang(code);
      const codeText = code.textContent;
      const escaped = escapeHtml(codeText);
      body += `
<div class="code-block">
  <div class="code-block-header">
    <span class="code-lang">${lang.toUpperCase()}</span>
    <div class="code-block-actions">
      <button onclick="runCode(\`${encodeURIComponent(codeText)}\`)">▶️ 运行</button>
      <button onclick="copyCode(this)" data-code="${encodeURIComponent(codeText)}">📋 复制</button>
    </div>
  </div>
  <pre class="line-numbers"><code class="language-${lang}">${escaped}</code></pre>
</div>`;
    }
    // 表格
    else if (tag === 'table') {
      body += parseTable(el);
    }
    // 图片
    else if (tag === 'img') {
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      if (src && !src.startsWith('data:')) {
        const fullSrc = src.startsWith('http') ? src : new URL(src, ch.url).href;
        body += `<img src="${fullSrc}" alt="${alt}" style="max-width:100%;border-radius:8px;margin:12px 0;">`;
      }
    }
    // 块引用
    else if (tag === 'blockquote') {
      body += `<blockquote style="border-left:4px solid var(--primary);padding:8px 16px;margin:12px 0;background:var(--bg);border-radius:0 8px 8px 0">${processInline(el.innerHTML)}</blockquote>`;
    }
    // hr
    else if (tag === 'hr') {
      body += '<hr style="border:none;border-top:1px solid var(--border);margin:20px 0">';
    }
    // 其他块级元素
    else if (['div', 'section', 'article'].includes(tag)) {
      const inner = el.innerHTML.trim();
      if (inner.length > 20) {
        body += `<div>${processInline(inner)}</div>`;
      }
    }
  }

  // 组装完整页面
  const prevCh = currentIndex > 0 ? CHAPTERS[group][currentIndex - 1] : null;
  const nextCh = currentIndex < CHAPTERS[group].length - 1 ? CHAPTERS[group][currentIndex + 1] : null;
  const groupNum = { basic: 13, advanced: 23, literature: 11, other: 1 }[group] || 1;
  const done = getProgress();
  const doneCount = Object.keys(done).length;

  return `
<div class="chapter-header">
  <div class="chapter-category">${category}</div>
  <h2>${title}</h2>
  <div class="chapter-meta">第${ch.num}章 · 共${groupNum}章 · 已学习 ${doneCount} 章</div>
</div>
<div class="chapter-nav-btns">
  ${prevCh ? `<button class="chapter-nav-btn" onclick="loadChapter('${group}',${currentIndex-1})">← 上一章：${prevCh.num}. ${prevCh.title}</button>` : '<span></span>'}
  ${nextCh ? `<button class="chapter-nav-btn" onclick="loadChapter('${group}',${currentIndex+1})">下一章：${nextCh.num}. ${nextCh.title} →</button>` : '<span></span>'}
</div>
${body}
<div class="chapter-nav-btns" style="margin-top:32px">
  ${prevCh ? `<button class="chapter-nav-btn" onclick="loadChapter('${group}',${currentIndex-1})">← 上一章：${prevCh.num}. ${prevCh.title}</button>` : '<span></span>'}
  ${nextCh ? `<button class="chapter-nav-btn" onclick="loadChapter('${group}',${currentIndex+1})">下一章：${nextCh.num}. ${nextCh.title} →</button>` : '<span></span>'}
</div>
<div style="text-align:center;margin-top:24px;padding:20px;background:var(--surface);border:1px solid var(--border);border-radius:8px">
  <p style="font-size:0.82rem;color:var(--text-muted)">📢 本内容改编自 <strong>阿越就是我</strong> 的《R语言实战医学统计》，采用 CC BY-SA 4.0 许可证发布。</p>
  <p style="font-size:0.78rem;color:var(--text-muted);margin-top:6px">教材：孙振球主编《医学统计学》第5版</p>
</div>`;
}

function processInline(html) {
  return html
    .replace(/<code>(.*?)<\/code>/gi, '<code>$1</code>')
    .replace(/<strong>(.*?)<\/strong>/gi, '<strong>$1</strong>')
    .replace(/<em>(.*?)<\/em>/gi, '<em>$1</em>')
    .replace(/<a href="([^"]+)">(.*?)<\/a>/gi, '<a href="$1" target="_blank">$2</a>')
    .replace(/<br\s*\/?>/gi, '<br>')
    .trim();
}

function detectLang(codeEl) {
  const cls = codeEl.className || '';
  if (cls.includes('language-r') || cls.includes('lang-r')) return 'r';
  if (cls.includes('python')) return 'python';
  if (cls.includes('bash') || cls.includes('shell')) return 'bash';
  if (cls.includes('css')) return 'css';
  if (cls.includes('js') || cls.includes('javascript')) return 'javascript';
  return 'r'; // 默认R语言
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#96;');
}

function parseTable(table) {
  const rows = table.querySelectorAll('tr');
  if (!rows.length) return '';
  const headers = Array.from(rows[0].querySelectorAll('th, td')).map(h => h.textContent.trim());
  const dataRows = Array.from(rows).slice(1).map(tr =>
    Array.from(tr.querySelectorAll('td')).map(d => d.textContent.trim())
  );

  let html = '<div class="table-wrapper"><table>';
  html += '<thead><tr>' + headers.map((h, i) => `<th>${i === 0 ? `<strong>${h}</strong>` : h}</th>`).join('') + '</tr></thead>';
  html += '<tbody>';
  dataRows.forEach(row => {
    html += '<tr>' + row.map((d, i) => `<td>${d}</td>`).join('') + '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

// ===== 代码块按钮 =====
function bindCodeBlockActions() {
  document.querySelectorAll('.code-block-actions button').forEach(btn => {
    if (btn.textContent.includes('运行')) {
      btn.style.display = 'none'; // 隐藏个别运行按钮，统一用底部面板
    }
  });
}

// ===== 运行代码 =====
async function runCode(encodedCode) {
  const code = decodeURIComponent(encodedCode);
  return executeCode(code);
}

async function executeCode(code) {
  const output = $('code-output');
  const runBtn = $('run-code-btn');
  if (!code.trim()) return;

  $('code-editor').value = code;
  if (!codePanelOpen) toggleCodePanel();
  output.innerHTML = '<span style="color:#888">运行中...</span>\n';
  runBtn.disabled = true;

  try {
    if (!window.webRReady || !window.webRInstance) {
      output.innerHTML = '<span class="error">❌ WebR 未就绪，请刷新页面</span>';
      return;
    }
    const webR = window.webRInstance;

    let result = '';
    try {
      const resultObj = await webR.run(code, {
        captureOutput: true,
        withAutoprint: true
      });
      const outputLines = [];
      for await (const line of resultObj) {
        if (line && line.type === 'stdout') {
          outputLines.push(escapeHtml(line.data || ''));
        } else if (line && line.type === 'error') {
          outputLines.push(`<span class="error">❌ ${escapeHtml(line.data || JSON.stringify(line))}</span>`);
        }
      }
      result = outputLines.join('\n');
    } catch (e) {
      result = `<span class="error">❌ 执行错误：${escapeHtml(e.message)}</span>`;
    }

    if (result) {
      output.innerHTML = result;
    } else {
      output.innerHTML = '<span class="success">✅ 代码执行完成</span>';
    }
  } catch (err) {
    output.innerHTML = `<span class="error">❌ 执行错误：${escapeHtml(err.message)}</span>`;
  } finally {
    runBtn.disabled = false;
  }
}

function copyCode(btn) {
  const code = decodeURIComponent(btn.dataset.code || '');
  navigator.clipboard.writeText(code).then(() => {
    showToast('代码已复制');
  });
}

$('copy-code-btn')?.addEventListener('click', () => {
  const code = $('code-editor').value;
  navigator.clipboard.writeText(code).then(() => showToast('已复制到剪贴板'));
});
$('copy-output-btn')?.addEventListener('click', () => {
  const text = $('code-output').textContent;
  navigator.clipboard.writeText(text).then(() => showToast('输出已复制'));
});
$('clear-output-btn')?.addEventListener('click', () => {
  $('code-output').innerHTML = '<span style="color:#555">输出区域</span>';
});
$('run-code-btn')?.addEventListener('click', () => executeCode($('code-editor').value));

// ===== 代码面板 =====
function toggleCodePanel() {
  codePanelOpen = !codePanelOpen;
  $('code-panel').classList.toggle('hidden', !codePanelOpen);
  $('toggle-code-panel').textContent = codePanelOpen ? '✕' : '📝';
}
$('toggle-code-panel')?.addEventListener('click', toggleCodePanel);
$('close-panel-btn')?.addEventListener('click', () => {
  if (codePanelOpen) toggleCodePanel();
});

// 快捷键
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    executeCode($('code-editor').value);
  }
  if (e.key === 'Escape' && codePanelOpen) toggleCodePanel();
});

// ===== 移动端 =====
$('menu-toggle')?.addEventListener('click', () => {
  const sidebar = $('sidebar');
  sidebar.classList.toggle('open');
  sidebar.classList.toggle('overlay', sidebar.classList.contains('open'));
});

// ===== Toast =====
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== 导航到章节（外部调用）=====
window.navigateToChapter = function(group, index) {
  // 展开导航组
  const header = document.querySelector(`[data-group="${group}"]`);
  if (header) { header.classList.add('open'); header.nextElementSibling?.classList.add('open'); }
  loadChapter(group, index);
};
window.loadChapter = loadChapter;
window.runCode = runCode;
window.executeCode = executeCode;
window.copyCode = copyCode;
window.toggleCodePanel = toggleCodePanel;
window.toggleTheme = toggleTheme;

// ===== 初始化 =====
function init() {
  initTheme();
  buildNav();
  initSearch();
  updateProgressBar();
  $('theme-toggle')?.addEventListener('click', toggleTheme);
}

document.addEventListener('DOMContentLoaded', init);
