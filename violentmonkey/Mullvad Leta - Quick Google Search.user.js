// ==UserScript==
// @name         Mullvad Leta - Quick Google Search
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Adds an icon to the Google engine button to open your search in a new tab on google.com.
// @match        https://leta.mullvad.net/*
// @match        https://search.mullvad.net/*
// @run-at       document-idle
// @grant        GM_addStyle
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/Mullvad%20Leta%20-%20Quick%20Google%20Search.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/Mullvad%20Leta%20-%20Quick%20Google%20Search.user.js
// ==/UserScript==

(function () {
  'use strict';

  const STYLE = `
    /* Reserve space on the right of the Google label for the icon */
    .gm-google-label {
      position: relative;
      padding-right: 30px !important;
    }
    /* Minimalist external link icon: subtle by default, brightens on hover */
    .gm-google-open {
      position: absolute;
      top: 50%;
      right: 8px;
      transform: translateY(-50%);
      display: inline-flex;
      width: 18px;
      height: 18px;
      opacity: .55;
      cursor: pointer;
      outline: none;
      color: currentColor; /* Inherits foreground color from the theme */
      transition: opacity 0.2s ease; /* Added a smooth transition for opacity */
    }
    /* Only light up when the icon itself is hovered or focused (no scaling) */
    .gm-google-open:hover,
    .gm-google-open:focus-visible {
      opacity: 1;
    }
    .gm-google-open svg {
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    /* Ensure SVG stroke uses currentColor and isn't filled by theme styles */
    .gm-google-open path {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `;

  // Inject CSS into the page
  if (typeof GM_addStyle === 'function') {
    GM_addStyle(STYLE);
  } else {
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLE;
    document.head.appendChild(styleEl);
  }

  // Shorthand for querySelector
  const $ = (sel, root = document) => root.querySelector(sel);

  /**
   * Creates the "open in new tab" icon button.
   * @returns {HTMLSpanElement} The icon element.
   */
  function createIcon() {
    const btn = document.createElement('span');
    btn.className = 'gm-google-open';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-label', 'Search on Google in a new tab');
    // Minimalist "external link" arrow icon
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 4h6v6M20 4l-9.5 9.5M10 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/>
      </svg>
    `;

    function openInGoogle(ev) {
      ev.stopPropagation(); // Prevent the radio button from being selected
      ev.preventDefault();
      const input = $('#search');
      const query = (input?.value || '').trim();
      const url = query
        ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
        : 'https://www.google.com/';
      window.open(url, '_blank', 'noopener');
    }

    btn.addEventListener('click', openInGoogle);
    // Support middle-mouse click
    btn.addEventListener('auxclick', (e) => {
      if (e.button === 1) openInGoogle(e);
    });
    // Support keyboard activation
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openInGoogle(e);
    });

    return btn;
  }

  /**
   * Finds the Google engine label and injects the icon.
   */
  function injectIcon() {
    // Find the radio input for the "Google" engine
    const googleInput = $('fieldset.engine-selector input[type="radio"][name="engine"][value="google"]');
    if (!googleInput) return;

    const label = googleInput.closest('label');
    // Exit if the label is not found or the icon already exists
    if (!label || label.querySelector('.gm-google-open')) return;

    // Add a class for styling and append the icon
    label.classList.add('gm-google-label');
    label.appendChild(createIcon());
  }

  // --- Main Execution ---
  // Mullvad Leta uses a framework (Svelte) that renders content dynamically.
  // A MutationObserver is the most reliable way to act when the elements appear.

  // Initial attempt to inject the icon
  injectIcon();

  // Set up an observer to re-inject if the page content changes (e.g., on SPA navigation)
  const observer = new MutationObserver(() => injectIcon());
  observer.observe(document.documentElement, { childList: true, subtree: true });

})();
