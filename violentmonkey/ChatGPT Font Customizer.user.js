// ==UserScript==
// @name         ChatGPT Font Customizer
// @namespace    https://example.com/userscripts
// @version      1.0
// @description  Google Fonts Noto Sans 全系+ Fira Code 等宽 + Settings 原生风格字体设置面板
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ChatGPT%20Font%20Customizer.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ChatGPT%20Font%20Customizer.user.js
// ==/UserScript==

(function () {
  'use strict';

  /* ── 注入 Google Fonts ── */
  function injectGoogleFonts() {
    const p1 = document.createElement('link');
    p1.rel = 'preconnect'; p1.href = 'https://fonts.googleapis.com';
    const p2 = document.createElement('link');
    p2.rel = 'preconnect'; p2.href = 'https://fonts.gstatic.com'; p2.crossOrigin = 'anonymous';
    const fl = document.createElement('link');
    fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?'
      + 'family=Fira+Code:wght@300..700'
      + '&family=Noto+Sans+HK:wght@100..900'
      + '&family=Noto+Sans+JP:wght@100..900'
      + '&family=Noto+Sans+KR:wght@100..900'
      + '&family=Noto+Sans+SC:wght@100..900'
      + '&family=Noto+Sans+TC:wght@100..900'
      + '&family=Noto+Sans:ital,wght@0,100..900;1,100..900'
      + '&display=swap';
    (document.head || document.documentElement).prepend(p1, p2, fl);
  }
  injectGoogleFonts();

  /* ── 配置 ── */
  const KEYS = {
    textSize: 'cgpt_font_size',    textLH: 'cgpt_line_height',
    textWT:'cgpt_font_weight',  codeFont: 'cgpt_code_font',
    codeSize: 'cgpt_code_size',    codeLH: 'cgpt_code_lh',
    codeTab:  'cgpt_code_tab',};
  const DEFAULTS = {
    textSize: '15px',   textLH: '1.65',    textWT: '500',
    codeFont: '"Fira Code","Noto Sans SC",monospace',
    codeSize: '14px',   codeLH: '1.6',     codeTab: '2',
  };
  const VAR_MAP = {
    textSize: '--cgpt-font-size',  textLH: '--cgpt-line-height',
    textWT:   '--cgpt-font-weight', codeFont: '--cgpt-code-font',
    codeSize: '--cgpt-code-size',  codeLH: '--cgpt-code-lh',
    codeTab:  '--cgpt-code-tab',
  };

  function cfg(k) { return GM_getValue(KEYS[k], DEFAULTS[k]); }
  function setCfg(k, v) { GM_setValue(KEYS[k], v); }
  function applyVar(k, v) { document.documentElement.style.setProperty(VAR_MAP[k], v); }

  /* ── 主样式 ── */
  GM_addStyle(`
:root {
  --cgpt-font-family: "Noto Sans","Noto Sans SC","Noto Sans TC","Noto Sans HK",
                      "Noto Sans JP","Noto Sans KR",
                      "Microsoft YaHei","Segoe UI",system-ui,-apple-system,
                      "Helvetica Neue",Arial,sans-serif;
  --cgpt-font-size:   ${cfg('textSize')};
  --cgpt-line-height: ${cfg('textLH')};
  --cgpt-font-weight: ${cfg('textWT')};
  --cgpt-code-font:   ${cfg('codeFont')};
  --cgpt-code-size:   ${cfg('codeSize')};
  --cgpt-code-lh:     ${cfg('codeLH')};
  --cgpt-code-tab:    ${cfg('codeTab')};
  --cgpt-input-lh:    1.55;
}
html, body, #__next {
  font-family: var(--cgpt-font-family) !important;
  font-size: var(--cgpt-font-size) !important;
  line-height: var(--cgpt-line-height) !important;
  font-optical-sizing: auto;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.markdown, .prose, [class*="markdown"] { font-weight: var(--cgpt-font-weight) !important; }
.markdown p, .prose p { margin-bottom: .85em !important; }
.markdown a, .prose a { color: #3366cc; }
.markdown a:visited, .prose a:visited { color: #3366cc; }
.markdown pre, .markdown code, .prose pre, .prose code,
pre code, pre[class*="language-"], code[class*="language-"],
.hljs, .shiki, [class*="syntax"], [class*="code-block"],
[data-code-block], [data-testid*="code"],
.cm-editor, .cm-content, .cm-line {
  font-family: var(--cgpt-code-font) !important;
  font-size: var(--cgpt-code-size) !important;
  line-height: var(--cgpt-code-lh) !important;
  font-weight: 400 !important;
  font-optical-sizing: auto;
  font-variant-ligatures: contextual common-ligatures;
  font-feature-settings: "calt" 1, "liga" 1;
  tab-size: var(--cgpt-code-tab);
}
.markdown pre *, .prose pre *, .hljs *, .shiki *,
.cm-editor *, .cm-content *, .cm-line * {
  font-family: inherit !important; font-size: inherit !important;
  line-height: inherit !important; font-weight: inherit !important;
}
textarea, input, [contenteditable="true"] {
  font-family: var(--cgpt-font-family) !important;
  font-weight: 400 !important;
  line-height: var(--cgpt-input-lh) !important;
}
button, [role="button"], .btn, [class*="Button"], [class*="btn-"],
[class*="copy"], [data-testid*="copy"], [data-testid*="toolbar"], [class*="toolbar"] {
  font-family: var(--cgpt-font-family) !important;
}
.sidebar, [class*="sidebar"], nav, [class*="Nav"], .overflow-y-auto {
  font-weight: 500 !important;
}
.markdown, .prose { padding-top: .35em !important; padding-bottom: .35em !important; }

/* 设置面板内input 微调 —— 仅覆盖最小必要量 */
.cgpt-fc-input {
  height: 36px; border-radius: 8px; padding: 0 12px; font-size: 14px;
  border: 1px solid transparent; background: transparent;
  color: var(--token-text-primary, currentColor);
  outline: none; text-align: right; cursor: pointer;
  font-family: inherit !important;
}
.cgpt-fc-input:hover { background: var(--token-main-surface-secondary, rgba(0,0,0,.04)); }
.cgpt-fc-input:focus {
  background: var(--token-main-surface-secondary, rgba(0,0,0,.04));
  border-color: var(--token-border-light, rgba(0,0,0,.1));
  cursor: text;
}
.cgpt-fc-input-wide { width: min(340px, 50vw); text-align: left; }
`);

  /* ── 面板构建 ── */
  const TAB_ID = 'FontCustomizer';

  // 原生设置行结构
  function makeRow(label, controlEl, hintText) {
    const row = document.createElement('div');
    row.className = 'border-token-border-light flex min-h-15 items-center border-b py-2 last-of-type:border-none';

    const wrap = document.createElement('div');
    wrap.className = 'w-full';

    const flex = document.createElement('div');
    flex.className = 'flex items-center justify-between';

    const lbl = document.createElement('div');
    lbl.textContent = label;

    flex.append(lbl, controlEl);
    wrap.appendChild(flex);

    if (hintText) {
      const hint = document.createElement('div');
      hint.className = 'text-token-text-tertiary my-1 pe-12 text-xs text-balance';
      hint.textContent = hintText;
      wrap.appendChild(hint);
    }

    row.appendChild(wrap);
    return row;
  }

  // 文本输入（模仿原生 combobox 按钮的外观）
  function makeInput(key, wide) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'cgpt-fc-input' + (wide ? ' cgpt-fc-input-wide' : '');
    inp.value = cfg(key);
    inp.dataset.cfgKey = key;
    inp.addEventListener('change', () => {
      const v = inp.value.trim() || DEFAULTS[key];
      inp.value = v;
      setCfg(key, v);
      applyVar(key, v);
    });
    return inp;
  }

  // 下拉选择（用原生 combobox 按钮样式包裹 <select>）
  function makeSelect(key, options) {
    const sel = document.createElement('select');
    sel.className = 'cgpt-fc-input';
    sel.dataset.cfgKey = key;
    const cur = cfg(key);
    for (const [val, text] of options) {
      const o = document.createElement('option');
      o.value = val; o.textContent = text;
      if (val === cur) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      setCfg(key, sel.value);
      applyVar(key, sel.value);
    });
    return sel;
  }

  function buildPanel() {
    const panel = document.createElement('div');
    panel.dataset.state = 'inactive';
    panel.dataset.orientation = 'vertical';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('hidden', '');
    panel.setAttribute('aria-labelledby', `radix-fc-trigger-${TAB_ID}`);
    panel.id = `radix-fc-content-${TAB_ID}`;
    panel.tabIndex = 0;
    panel.className = 'text-token-text-primary relative flex w-full flex-col overflow-y-auto px-4 text-sm max-md:max-h-[calc(100vh-150px)] md:min-h-[380px]';
    panel.style.animationDuration = '0s';

    const section = document.createElement('section');
    section.className = 'relative mb-4';

    // ── 标题（与原生 General 标题一致）──
    const header = document.createElement('div');
    header.className = 'flex min-h-15 items-center py-3 border-token-border-default border-b';
    header.innerHTML = '<h3 class="w-full text-lg font-normal"><div class="truncate select-none">Fonts</div></h3>';
    section.appendChild(header);

    // ── 正文设置 ──
    section.appendChild(
      makeRow('Text size', makeInput('textSize'),
        'e.g. 14px, 15px, 16px')
    );
    section.appendChild(
      makeRow('Text line height', makeInput('textLH'),
        'e.g. 1.5, 1.65, 1.8')
    );
    section.appendChild(
      makeRow('Text weight', makeSelect('textWT', [
        ['400','Regular (400)'],
        ['500', 'Medium (500)'],
        ['600', 'SemiBold (600)'],
        ['700', 'Bold (700)'],]))
    );

    // ── 代码设置 ──
    section.appendChild(
      makeRow('Code font stack', makeInput('codeFont', true),
        'Comma-separated font families. Monospace first, CJK fallback last.')
    );
    section.appendChild(
      makeRow('Code size', makeInput('codeSize'),
        'e.g. 13px, 14px, 15px')
    );
    section.appendChild(
      makeRow('Code line height', makeInput('codeLH'),
        'e.g. 1.4, 1.5, 1.6')
    );
    section.appendChild(
      makeRow('Code tab width', makeSelect('codeTab', [
        ['2', '2'], ['4', '4'], ['8', '8'],
      ]))
    );

    // ── Reset按钮行 ──
    const resetRow = document.createElement('div');
    resetRow.className = 'border-token-border-light flex min-h-15 items-center py-2 last-of-type:border-none';
    const resetWrap = document.createElement('div');
    resetWrap.className = 'w-full';
    const resetFlex = document.createElement('div');
    resetFlex.className = 'flex items-center justify-between';

    const resetLabel = document.createElement('div');
    resetLabel.textContent = 'Reset all font settings';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'text-token-text-primary border border-transparent inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-white px-3 text-sm dark:transparent dark:bg-transparent leading-none outline-hidden cursor-pointer hover:bg-token-main-surface-secondary dark:hover:bg-token-main-surface-secondary';
    resetBtn.innerHTML = '<span style="pointer-events:none;">Reset</span>';
    resetBtn.addEventListener('click', () => {
      for (const k of Object.keys(DEFAULTS)) {
        setCfg(k, DEFAULTS[k]);
        applyVar(k, DEFAULTS[k]);
      }
      // 刷新面板内所有控件的值
      panel.querySelectorAll('[data-cfg-key]').forEach(el => {
        const k = el.dataset.cfgKey;
        if (k && DEFAULTS[k] !== undefined) el.value = DEFAULTS[k];
      });});

    resetFlex.append(resetLabel, resetBtn);
    resetWrap.appendChild(resetFlex);
    resetRow.appendChild(resetWrap);
    section.appendChild(resetRow);

    panel.appendChild(section);
    return panel;
  }

  function buildTab() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('aria-controls', `radix-fc-content-${TAB_ID}`);
    btn.dataset.state = 'inactive';
    btn.id = `radix-fc-trigger-${TAB_ID}`;
    btn.tabIndex = 0;
    btn.dataset.fill = '';
    btn.className = 'group __menu-item hoverable gap-1.5';
    btn.dataset.orientation = 'vertical';
    btn.dataset.radixCollectionItem = '';
    // 用一个 "T" 字形icon 代表字体
    btn.innerHTML = `
      <div class="flex items-center justify-center group-disabled:opacity-50 group-data-disabled:opacity-50 icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" class="icon" aria-hidden="true">
          <polyline points="4 7 4 4 20 4 20 7"></polyline>
          <line x1="9" y1="20" x2="15" y2="20"></line>
          <line x1="12" y1="4" x2="12" y2="20"></line>
        </svg>
      </div>
      <div class="flex min-w-0 grow items-center gap-2.5">
        <div class="truncate">Fonts</div>
      </div>`;
    return btn;
  }

  /* ── Tab 切换 ── */
  function wireTab(tabList, tabBtn, panel, container) {
    function deactivateAll() {
      tabList.querySelectorAll('[role="tab"]').forEach(t => {
        t.setAttribute('aria-selected', 'false');
        t.dataset.state = 'inactive';
      });
      container.querySelectorAll('[role="tabpanel"]').forEach(p => {
        p.dataset.state = 'inactive';
        p.setAttribute('hidden', '');
      });
    }

    tabBtn.addEventListener('click', () => {
      deactivateAll();
      tabBtn.setAttribute('aria-selected', 'true');
      tabBtn.dataset.state = 'active';
      panel.dataset.state = 'active';
      panel.removeAttribute('hidden');
    });

    // 原生 tab 被点击时，确保我们的 panel 隐藏
    tabList.querySelectorAll('[role="tab"]').forEach(t => {
      if (t === tabBtn) return;
      t.addEventListener('click', () => {
        tabBtn.setAttribute('aria-selected', 'false');
        tabBtn.dataset.state = 'inactive';
        panel.dataset.state = 'inactive';
        panel.setAttribute('hidden', '');
      });
    });
  }

  /* ── 注入检测 ── */
  function tryInject() {
    const tabList = document.querySelector('[role="tablist"][aria-orientation="vertical"]');
    if (!tabList || tabList.querySelector(`#radix-fc-trigger-${TAB_ID}`)) return;

    const container = tabList.parentElement;
    if (!container) return;

    const tabBtn = buildTab();
    const panel  = buildPanel();

    // 插到最后一个渐变 div 前面（移动端右侧渐变遮罩）
    const kids = [...tabList.children];
    const lastNonTab = kids.reverse().find(c => !c.getAttribute('role'));
    if (lastNonTab) tabList.insertBefore(tabBtn, lastNonTab);
    else tabList.appendChild(tabBtn);

    container.appendChild(panel);
    wireTab(tabList, tabBtn, panel, container);
  }

  const observer = new MutationObserver(() => tryInject());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== 'loading') tryInject();
  else document.addEventListener('DOMContentLoaded', tryInject);
})();
