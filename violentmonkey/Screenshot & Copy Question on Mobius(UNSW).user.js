// ==UserScript==
// @name         Möbius Power Tools (UNSW)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Adds screenshot & text copy buttons, and makes the question sidebar sticky on UNSW Möbius.
// @author       Gemini
// @match        https://*.mobius.cloud/*
// @match        https://*.digitaled.com/modules/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @icon         https://unsw.mobius.cloud/skins/default/favicon.ico
// @run-at       document-idle
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/536832/Screenshot%20%20Copy%20Question%20on%20Mobius%28UNSW%29.user.js
// @updateURL https://update.greasyfork.org/scripts/536832/Screenshot%20%20Copy%20Question%20on%20Mobius%28UNSW%29.meta.js
// ==/UserScript==

(function () {
  'use strict';

  // --- Combined Styles ---
  GM_addStyle(`
        /* Sticky sidebar styles */
        .sectionName.col-sm-3 {
            position: -webkit-sticky !important; /* Safari */
            position: sticky !important;         /* Standard */
            top: 20px !important;               /* Distance from top */
            z-index: 1000 !important;           /* Stay on top */
        }

        /* Screenshot button styles (top toolbar) */
        li.copy-ques-screenshot a.btn { margin-left:5px; }
        li.copy-ques-screenshot.disabled a.btn { cursor:not-allowed; opacity:.65; pointer-events:none; }
        li.copy-ques-screenshot a.btn.success { background:#28a745!important; color:#fff!important; border-color:#28a745!important; }
        li.copy-ques-screenshot a.btn.error   { background:#dc3545!important; color:#fff!important; border-color:#dc3545!important; }

        /* Copy Text link styles (in sidebar) */
        .copy-text-ul-gemini {
            margin-top: 10px !important; /* Space above the copy link */
        }
    `);


  // ===================================================
  // == FEATURE 1: Copy Question Screenshot (Top Bar) ==
  // ===================================================

  const SCREENSHOT_BTN_CONFIG = {
    questionContainerSelector: 'div[name="questioncontainer"]',
    toolbarSelector: '#assignmentButtons ul',
    buttonClass: 'copy-ques-screenshot',
    text: {
      idle: 'Copy Question Screenshot',
      capture: 'Capturing...',
      copy: 'Copying...',
      ok: 'Copied!',
      err: 'Error!'
    }
  };
  let screenshotBtn;

  const updateScreenshotBtn = (txt, disabled = false, cls = '') => {
    if (!screenshotBtn) return;
    screenshotBtn.textContent = txt;
    screenshotBtn.parentElement.classList.toggle('disabled', disabled);
    screenshotBtn.className = `btn btn-default${cls ? ` ${cls}` : ''}`;
  };

  const takeScreenshotAction = async (ev) => {
    ev.preventDefault();
    if (!screenshotBtn || screenshotBtn.parentElement.classList.contains('disabled')) return;

    const target = document.querySelector(SCREENSHOT_BTN_CONFIG.questionContainerSelector);
    if (!target) {
      updateScreenshotBtn(SCREENSHOT_BTN_CONFIG.text.err, false, 'error');
      return setTimeout(() => updateScreenshotBtn(SCREENSHOT_BTN_CONFIG.text.idle), 2000);
    }

    try {
      updateScreenshotBtn(SCREENSHOT_BTN_CONFIG.text.capture, true);
      await new Promise(r => setTimeout(r, 50)); // UI repaint

      const canvas = await html2canvas(target, {
        useCORS: true,
        scale: window.devicePixelRatio || 1,
      });

      updateScreenshotBtn(SCREENSHOT_BTN_CONFIG.text.copy, true);
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      if (!blob) throw new Error('Blob creation failed');

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      updateScreenshotBtn(SCREENSHOT_BTN_CONFIG.text.ok, false, 'success');
    } catch (error) {
      console.error("Screenshot Error:", error);
      updateScreenshotBtn(SCREENSHOT_BTN_CONFIG.text.err, false, 'error');
    } finally {
      setTimeout(() => updateScreenshotBtn(SCREENSHOT_BTN_CONFIG.text.idle), 2000);
    }
  };

  const injectScreenshotButton = () => {
    const ul = document.querySelector(SCREENSHOT_BTN_CONFIG.toolbarSelector);
    if (!ul || ul.querySelector(`.${SCREENSHOT_BTN_CONFIG.buttonClass}`)) return;

    const li = document.createElement('li');
    li.className = SCREENSHOT_BTN_CONFIG.buttonClass;

    screenshotBtn = Object.assign(document.createElement('a'), {
      href: '#',
      textContent: SCREENSHOT_BTN_CONFIG.text.idle,
      className: 'btn btn-default'
    });

    screenshotBtn.addEventListener('click', takeScreenshotAction);
    li.appendChild(screenshotBtn);
    ul.insertAdjacentElement('afterbegin', li);
  };


  // ====================================================
  // == FEATURE 2: Copy Question Text (Side Panel)     ==
  // ====================================================

  function copySingleQuestionText(section, btn) {
    const headerEl = section.querySelector('.sectionName');
    const mainContentEl = section.querySelector('.questionstyle');
    if (!headerEl || !mainContentEl) return;

    // Clone header, remove the copy button from the clone, then get text
    const headerClone = headerEl.cloneNode(true);
    headerClone.querySelectorAll('.copy-text-ul-gemini').forEach(b => b.remove());
    const headerText = headerClone.innerText.trim();

    // Clone main content for manipulation
    const clone = mainContentEl.cloneNode(true);

    // Remove unwanted elements
    clone.querySelectorAll('.numericQuestion, .mathQuestion, .menuDisplay, .doInSession, .helpLinks, link, style, script, button').forEach(el => el.remove());
    clone.querySelectorAll('.multiCh input, .multiCh select').forEach(el => el.remove());

    // Convert MathJax spans to LaTeX strings
    clone.querySelectorAll('span.MathJax').forEach(mathSpan => {
      const frameId = mathSpan.id;
      if (frameId && frameId.endsWith('-Frame')) {
        const scriptId = frameId.replace('-Frame', '');
        const scriptEl = mainContentEl.querySelector(`#${scriptId}`); // Query original document
        if (scriptEl && scriptEl.type === 'math/tex') {
          const latexCode = scriptEl.textContent.trim();
          // Use $$ for centered math, $ for inline math
          const delimiter = mathSpan.closest('p[style*="text-align: center"]') ? '$$' : '$';
          const textNode = document.createTextNode(` ${delimiter}${latexCode}${delimiter} `);
          mathSpan.parentNode.replaceChild(textNode, mathSpan);
        }
      }
    });

    // Convert iframes to text links
    clone.querySelectorAll('iframe').forEach(iframe => {
      const textNode = document.createTextNode(`\n\n[IFRAME]: ${iframe.src}\n\n`);
      iframe.parentNode.replaceChild(textNode, iframe);
    });

    // Clean up the final text
    let questionText = clone.innerText
      .replace(/[\u00A0\s]+/g, ' ')      // Replace non-breaking spaces and multiple spaces with a single space
      .replace(/(\r\n|\n|\r){2,}/g, '\n') // Collapse multiple newlines into one
      .trim();

    const finalString = `${headerText}\n\n${questionText}`;
    GM_setClipboard(finalString);

    // Provide user feedback on the button
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Copied!';
      btn.style.color = '#28a745';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.color = '';
      }, 2000);
    }
  }

  function setupQuestionCopyButtons() {
    const questionSections = document.querySelectorAll('.section.row');
    questionSections.forEach((section) => {
      if (section.dataset.copyButtonAdded === 'true') {
        return; // Prevents adding duplicate buttons
      }

      const targetForButton = section.querySelector('.sectionName');
      if (!targetForButton) return;

      // Create a structure similar to "How Did I Do?" for style consistency
      const copyBtnContainer = document.createElement('ul');
      copyBtnContainer.className = 'copy-text-ul-gemini';

      const copyBtnLi = document.createElement('li');

      const copyBtnLink = document.createElement('a');
      copyBtnLink.href = '#';
      copyBtnLink.innerHTML = 'Copy Text';
      copyBtnLink.className = 'doInSession'; // Use Mobius's own class for styling

      copyBtnLi.appendChild(copyBtnLink);
      copyBtnContainer.appendChild(copyBtnLi);

      targetForButton.appendChild(copyBtnContainer);
      section.dataset.copyButtonAdded = 'true'; // Mark as added

      copyBtnLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        copySingleQuestionText(section, copyBtnLink);
      });
    });
  }

  // ===================================
  // == Initialization and Observation ==
  // ===================================

  // Run setup functions once on initial load
  injectScreenshotButton();
  setupQuestionCopyButtons();

  // Use a single observer to watch for dynamic content changes
  const observer = new MutationObserver(() => {
    // When the page changes, try to inject both types of buttons if they don't exist
    injectScreenshotButton();
    setupQuestionCopyButtons();
  });

  // Observe the entire document body for changes
  observer.observe(document.body, { childList: true, subtree: true });
})();