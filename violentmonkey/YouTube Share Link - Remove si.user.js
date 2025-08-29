// ==UserScript==
// @name         YouTube Share Link - Remove si
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Automatically remove the `si` param from YouTube share links and ensure the copy button copies a clean link (keep other params like `t`). Supports watch/shorts/m.youtube.com.
// @author       LMFuture
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/YouTube%20Share%20Link%20-%20Remove%20si.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/YouTube%20Share%20Link%20-%20Remove%20si.user.js
// ==/UserScript==

(function () {
  'use strict';

  // --- Utilities ---
  function cleanShareUrl(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    try {
      // Support youtu.be / youtube.com / shorts etc
      const url = new URL(raw);
      // Remove si in search
      url.searchParams.delete('si');
      // Rarely si may appear in fragment; handle it too
      if (url.hash && url.hash.includes('si=')) {
        const u2 = new URL(url.toString().replace('#', '?'));
        u2.searchParams.delete('si');
        const newHashParams = u2.searchParams.toString();
        url.hash = newHashParams ? '#' + newHashParams : '';
      }
      return url.toString();
    } catch {
      // Fallback: simple replace; avoid dangling ? or &
      return raw
        .replace(/([?&])si=[^&#]*(&)?/i, (m, p1, p2) => (p1 === '?' && !p2 ? '' : (p2 ? p1 : '')))
        .replace(/\?$/, '');
    }
  }

  // Optional: add a small badge "si removed"
  function badgeOnce(container) {
    if (!container || container.querySelector('.lmf-clean-badge')) return;
    const tip = document.createElement('div');
    tip.className = 'lmf-clean-badge';
    tip.textContent = 'si removed';
    tip.style.cssText = `
      margin-top: 6px;
      font-size: 12px;
      color: var(--yt-spec-text-secondary, #888);
    `;
    container.appendChild(tip);
  }

  // Handle <yt-copy-link-renderer>: update input & intercept copy button
  function processRenderer(renderer) {
    if (!renderer || renderer.__lmf_patched) return;
    const input = renderer.querySelector('input#share-url, input[readonly][dir="ltr"]');
    if (input) {
      // One-time cleanup
      const cleaned = cleanShareUrl(input.value || input.getAttribute('value') || '');
      if (cleaned && cleaned !== input.value) {
        input.value = cleaned;
        input.setAttribute('value', cleaned);
        try { input.select?.(); } catch {}
      }

      // Observe attribute changes; YouTube may rewrite value
      const obs = new MutationObserver(() => {
        const v = input.value || input.getAttribute('value') || '';
        const c = cleanShareUrl(v);
        if (c !== v) {
          input.value = c;
          input.setAttribute('value', c);
        }
      });
      obs.observe(input, { attributes: true, attributeFilter: ['value'] });
      renderer.__lmf_inputObserver = obs;
    }

    // Intercept copy button to write clean link
    renderer.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      if (!renderer.contains(btn)) return;

      const inputNow = renderer.querySelector('input#share-url, input[readonly][dir="ltr"]');
      if (!inputNow) return;

      const cleaned = cleanShareUrl(inputNow.value || inputNow.getAttribute('value') || '');
      if (!cleaned) return;

      ev.stopImmediatePropagation?.();
      ev.preventDefault?.();

      navigator.clipboard.writeText(cleaned).then(() => {
        btn.setAttribute('aria-label', 'Copied clean link');
        const textSpan = btn.querySelector('.yt-spec-button-shape-next__button-text-content span');
        const old = textSpan?.textContent;
        if (textSpan) {
          textSpan.textContent = 'Copied';
          setTimeout(() => { textSpan.textContent = old || 'Copy'; }, 900);
        }
      }).catch(() => {
        try {
          inputNow.removeAttribute('readonly');
          inputNow.value = cleaned;
          inputNow.select();
          document.execCommand('copy');
          inputNow.setAttribute('readonly', '');
        } catch {}
      });
    }, true);

    badgeOnce(renderer);
    renderer.__lmf_patched = true;
  }

  // Observe document for share dialog
  const globalObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.tagName?.toLowerCase() === 'yt-copy-link-renderer') {
          processRenderer(node);
        }
        const renders = node.querySelectorAll?.('yt-copy-link-renderer');
        if (renders && renders.length) renders.forEach(processRenderer);
      }
    }
  });

  function initialScan() {
    document.querySelectorAll('yt-copy-link-renderer').forEach(processRenderer);
  }

  initialScan();
  globalObserver.observe(document.documentElement || document.body, { childList: true, subtree: true });

  window.addEventListener('beforeunload', () => {
    globalObserver.disconnect();
    document.querySelectorAll('yt-copy-link-renderer').forEach(r => {
      if (r.__lmf_inputObserver) r.__lmf_inputObserver.disconnect();
    });
  });
})();

