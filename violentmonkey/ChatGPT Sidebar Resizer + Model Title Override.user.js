// ==UserScript==
// @name         ChatGPT Sidebar Resizer + Model Title Override
// @name:zh-CN   ChatGPT 侧边栏宽度调整 + 模型标题替换
// @namespace    LMFuture.tools
// @version      1.3.0
// @description  Adds a draggable handle to resize chatgpt.com’s sidebar (persists width) and lets you override the “ChatGPT” model button title while preserving the version (e.g., “5”).
// @description:zh-CN  在 chatgpt.com 添加可拖拽的侧边栏宽度调整（自动保存），并允许用 GM_setValue 将“ChatGPT”模型按钮标题替换为自定义文本（保留版本号，例如 5）。
// @author       You
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=openai.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ChatGPT%20Sidebar%20Resizer%20+%20Model%20Title%20Override.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ChatGPT%20Sidebar%20Resizer%20+%20Model%20Title%20Override.user.js
// ==/UserScript==

(function () {
  'use strict';

  // =========================
  //       Module A:
  //  Sidebar Width Resizer
  // =========================

  const SIDEBAR_WIDTH_KEY = 'chatgpt_sidebar_width';
  const MIN_WIDTH = 200;        // px
  const MAX_WIDTH = 800;        // px
  const DEFAULT_WIDTH = '260px';

  let sidebarA;
  let resizerA;
  let isResizingA = false;

  function injectStylesA() {
    const style = document.createElement('style');
    style.textContent = `
      /* Ensure the sidebar exists and can host the handle */
      #stage-slideover-sidebar {
        position: relative !important;
        transition: none !important;
        /* Make width use the CSS var (with sensible fallback) */
        width: var(--sidebar-width, ${DEFAULT_WIDTH}) !important;
      }

      /* Resize handle */
      #sidebar-resizer-handle {
        position: absolute;
        top: 0;
        right: -2px; /* slightly outwards for easier grabbing */
        width: 5px;
        height: 100%;
        cursor: col-resize;
        background-color: transparent;
        z-index: 1000;
        transition: background-color 0.2s;
      }
      #sidebar-resizer-handle:hover {
        background-color: #007bff;
      }
    `;
    document.head.appendChild(style);
  }

  function initResizerA(sidebarElement) {
    if (sidebarElement.querySelector('#sidebar-resizer-handle')) return;
    sidebarA = sidebarElement;

    // Create the handle
    resizerA = document.createElement('div');
    resizerA.id = 'sidebar-resizer-handle';
    sidebarA.appendChild(resizerA);

    // Apply saved width
    const savedWidth = GM_getValue(SIDEBAR_WIDTH_KEY, DEFAULT_WIDTH);
    document.documentElement.style.setProperty('--sidebar-width', savedWidth);

    // Mouse down to start resizing
    resizerA.addEventListener('mousedown', function (e) {
      e.preventDefault();
      isResizingA = true;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      document.addEventListener('mousemove', handleMouseMoveA);
      document.addEventListener('mouseup', handleMouseUpA);
    });
  }

  function handleMouseMoveA(e) {
    if (!isResizingA) return;

    // Compute width relative to the sidebar's left edge (robust on layouts)
    const rect = sidebarA.getBoundingClientRect();
    let newWidth = e.clientX - rect.left;

    if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
    if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;

    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
  }

  function handleMouseUpA() {
    if (!isResizingA) return;
    isResizingA = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    document.removeEventListener('mousemove', handleMouseMoveA);
    document.removeEventListener('mouseup', handleMouseUpA);

    const finalWidth = document.documentElement.style.getPropertyValue('--sidebar-width');
    GM_setValue(SIDEBAR_WIDTH_KEY, finalWidth);
  }

  const observerA = new MutationObserver(() => {
    const sidebarElement = document.getElementById('stage-slideover-sidebar');
    if (sidebarElement) {
      injectStylesA();
      initResizerA(sidebarElement);
      // Keep observing; ChatGPT is SPA and may re-render
    }
  });

  observerA.observe(document.body, { childList: true, subtree: true });


  // =========================
  //       Module B:
  //  Model Title Override
  // =========================

  const MODEL_TITLE_KEY = 'cgpt_model_title_override';

  const getOverrideB = () => {
    const v = GM_getValue(MODEL_TITLE_KEY, '');
    return (typeof v === 'string') ? v.trim() : '';
  };

  const setOverrideB = (v) => {
    GM_setValue(MODEL_TITLE_KEY, (v || '').trim());
  };

  // Find the div holding "ChatGPT " and the version <span class="text-token-text-tertiary">
  function findLabelDivB(btn) {
    const divs = btn.querySelectorAll('div');
    for (const d of divs) {
      if (d.querySelector('span.text-token-text-tertiary')) return d;
    }
    return null;
  }

  // Apply the override: replace the leading "ChatGPT " text node with custom title, keep version span
  function applyB() {
    const title = getOverrideB();
    if (!title) return; // Nothing to override

    const buttons = document.querySelectorAll(
      '[data-testid="model-switcher-dropdown-button"], button[aria-label^="Model selector"]'
    );

    for (const btn of buttons) {
      const labelDiv = findLabelDivB(btn);
      if (!labelDiv) continue;

      const versionSpan = labelDiv.querySelector('span.text-token-text-tertiary');
      const firstNode = (labelDiv.firstChild && labelDiv.firstChild.nodeType === Node.TEXT_NODE)
        ? labelDiv.firstChild
        : null;

      const currentTitle = firstNode ? firstNode.nodeValue.trim() : '';

      if (currentTitle === title) continue;

      if (firstNode) {
        firstNode.nodeValue = title + ' ';
      } else {
        const tnode = document.createTextNode(title + ' ');
        if (versionSpan) {
          labelDiv.insertBefore(tnode, versionSpan);
        } else {
          labelDiv.insertBefore(tnode, labelDiv.firstChild);
        }
      }
    }
  }

  // Menu commands
  GM_registerMenuCommand('Set custom model title…', () => {
    const cur = getOverrideB() || 'Not ChatGPT';
    const v = prompt('Enter custom title to replace "ChatGPT":', cur);
    if (v !== null) {
      setOverrideB(v);
      applyB();
      alert('Title set to: ' + (v.trim() || '(empty – no change will be applied)'));
    }
  });

  GM_registerMenuCommand('Reset (use original "ChatGPT")', () => {
    setOverrideB('');
    applyB();
    alert('Custom title cleared. The original "ChatGPT" label will show.');
  });

  // Observe SPA updates and re-apply
  const moB = new MutationObserver(() => applyB());
  moB.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('readystatechange', applyB);
  window.addEventListener('load', applyB);
  setTimeout(applyB, 800);

})();

