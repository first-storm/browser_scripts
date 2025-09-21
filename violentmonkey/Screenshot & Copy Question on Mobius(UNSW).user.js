// ==UserScript==
// @name         Mobius Tools: Screenshot & Sticky Sidebar (UNSW)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds a "Copy Question Screenshot" button and makes the question info box sticky on UNSW Möbius.
// @license      MIT
// @match        https://unsw.mobius.cloud/*
// @match        https://unsw.mobius.cloud/modules/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mobius.cloud
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  // --- Shared styles (button + sticky sidebar) ---
  GM_addStyle(`
    /* Screenshot button styles */
    li.copy-ques a.btn { margin-left:5px; }
    li.copy-ques.disabled a.btn { cursor:not-allowed; opacity:.65; pointer-events:none; }
    li.copy-ques a.btn.success { background:#28a745!important; color:#fff!important; border-color:#28a745!important; }
    li.copy-ques a.btn.error   { background:#dc3545!important; color:#fff!important; border-color:#dc3545!important; }

    /* Sticky sidebar styles */
    .sectionName.col-sm-3 {
      /* For Safari */
      position: -webkit-sticky !important;
      /* Standard */
      position: sticky !important;
      /* When sticky, distance from top of browser */
      top: 20px !important;
      /* Ensure it stays above other content when scrolling */
      z-index: 1000 !important;
    }
  `);

  // ===============================
  // Feature 1: Copy Question Screenshot
  // ===============================

  const QSEL = 'div[name="questioncontainer"]';
  const ULSEL = '#assignmentButtons ul';
  const TXT = {
    idle:    'Copy Question Screenshot',
    capture: 'Capturing...',
    copy:    'Copying...',
    ok:      'Copied!',
    err:     'Error!'
  };
  let btn;

  const update = (txt, disabled = false, cls = '') => {
    if (!btn) return;
    btn.textContent = txt;
    btn.parentElement.classList.toggle('disabled', disabled);
    btn.className = `btn btn-default${cls ? ` ${cls}` : ''}`;
  };

  const action = async ev => {
    ev.preventDefault();
    if (!btn || btn.parentElement.classList.contains('disabled')) return;

    const target = document.querySelector(QSEL);
    if (!target) {
      update(TXT.err, false, 'error');
      return setTimeout(() => update(TXT.idle), 2000);
    }

    try {
      update(TXT.capture, true);
      await new Promise(r => setTimeout(r, 50)); // allow UI repaint

      const canvas = await html2canvas(target, {
        useCORS: true,
        scale: devicePixelRatio || 1,
        scrollX: -scrollX,
        scrollY: -scrollY
      });

      update(TXT.copy, true);
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      if (!blob) throw new Error('blob failed');

      // Clipboard: requires page focus + permissions on HTTPS (Mobius is HTTPS)
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      update(TXT.ok, false, 'success');
    } catch (_) {
      update(TXT.err, false, 'error');
    } finally {
      setTimeout(() => update(TXT.idle), 2000);
    }
  };

  const injectButton = () => {
    const ul = document.querySelector(ULSEL);
    if (!ul || ul.querySelector('.copy-ques')) return;

    const li = document.createElement('li');
    li.className = 'copy-ques';

    btn = Object.assign(document.createElement('a'), {
      href: '#',
      textContent: TXT.idle,
      className: 'btn btn-default'
    });

    btn.addEventListener('click', action);
    li.appendChild(btn);
    ul.insertAdjacentElement('afterbegin', li);
  };

  // Try to inject repeatedly until toolbar is present
  const observer = new MutationObserver(() => injectButton());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  // Also try once on load
  injectButton();

  // ===============================
  // Feature 2: Sticky Sidebar (CSS-only, already applied via GM_addStyle)
  // ===============================
  // No JS needed beyond injected styles.
})();
