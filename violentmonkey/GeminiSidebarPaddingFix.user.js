// ==UserScript==
// @name         Gemini Toolkit: Copy Bubble + Logo Renamer + Sidebar Padding Fix
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adjusts Gemini's sidebar padding for a symmetrical look in Firefox by balancing the space around the chat history list.
// @author       Your AI Assistant
// @match        https://gemini.google.com/*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/GeminiSidebarPaddingFix.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/GeminiSidebarPaddingFix.user.js
// ==/UserScript==

(function () {
  "use strict";

  /* =========================
   *  A) CONFIG / CONSTANTS
   * ========================= */
  // --- Copy button visuals ---
  const ICON_HTML = `<mat-icon role="img" class="mat-icon notranslate gds-icon-m action-button-icon google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="content_copy">content_copy</mat-icon>`;
  const BTN_CLASSES = "mdc-icon-button mat-mdc-icon-button mat-mdc-button-base mat-mdc-tooltip-trigger action-button mat-unthemed";

  // --- Toast CSS (used by copy feature) ---
  const TOAST_CSS = `
    .__copy-toast{position:fixed;right:20px;bottom:20px;background:rgba(60,60,60,.92);color:#fff;
      padding:8px 12px;border-radius:8px;font:12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial;
      z-index:2147483647;opacity:0;transition:opacity .15s;}
    .__copy-toast.__show{opacity:1;}
  `;

  // --- Sidebar padding fix (Firefox) ---
  const SIDEBAR_FIX_CSS = `
    /* Balance chat history padding to compensate for FF scrollbar look */
    .chat-history {
      padding-right: 10px !important;
    }
  `;

  // --- Logo renamer storage ---
  const STORAGE_KEY = "customGeminiLabel";
  const DEFAULT_LABEL = "Gemini";
  let currentLabel =
    (typeof GM_getValue === "function"
      ? GM_getValue(STORAGE_KEY, DEFAULT_LABEL)
      : DEFAULT_LABEL) || DEFAULT_LABEL;
  currentLabel = (currentLabel || "").trim() || DEFAULT_LABEL;

  /* =========================
   *  B) UTILITIES
   * ========================= */
  function addGlobalStyles() {
    if (typeof GM_addStyle === "function") {
      GM_addStyle(TOAST_CSS);
      GM_addStyle(SIDEBAR_FIX_CSS);
    } else {
      // Fallback for managers without GM_addStyle
      const s = document.createElement("style");
      s.textContent = TOAST_CSS + "\n" + SIDEBAR_FIX_CSS;
      (document.head || document.documentElement).appendChild(s);
    }
  }

  function showToast(text = "Copied") {
    let t = document.querySelector(".__copy-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "__copy-toast";
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add("__show");
    setTimeout(() => t.classList.remove("__show"), 1200);
  }

  /* =========================
   *  C) FEATURE: LOGO RENAMER
   * ========================= */
  function applyLabel(root = document) {
    try {
      // Target the exact logo text span by data-test-id & class seen in DOM
      const nodes = root.querySelectorAll('span.bard-text[data-test-id="bard-text"]');
      nodes.forEach((el) => {
        if (el.textContent.trim() !== currentLabel) {
          // Surround with spaces like the original (" Gemini ")
          el.textContent = ` ${currentLabel} `;
          el.dataset.lmfutureRenamed = "1";
        }
      });
    } catch (e) {
      console.debug("[Gemini Toolkit] applyLabel error:", e);
    }
  }

  function promptAndSaveLabel() {
    const val = prompt("Set the Gemini logo label to:", currentLabel);
    if (val === null) return; // cancelled
    const trimmed = (val || "").trim();
    currentLabel = trimmed || DEFAULT_LABEL;
    if (typeof GM_setValue === "function") {
      GM_setValue(STORAGE_KEY, currentLabel);
    }
    applyLabel();
  }

  // Menu commands (if supported)
  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand("Set Gemini label…", promptAndSaveLabel);
    GM_registerMenuCommand("Reset label to default", () => {
      currentLabel = DEFAULT_LABEL;
      GM_setValue && GM_setValue(STORAGE_KEY, currentLabel);
      applyLabel();
    });
  }

  // Keyboard shortcut: Ctrl+Alt+G opens label prompt
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.ctrlKey && e.altKey && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        promptAndSaveLabel();
      }
    },
    true
  );

  /* =========================
   *  D) FEATURE: COPY BUTTON
   * ========================= */
  function getBubble(el) {
    return (
      el.closest('[id^="user-query-content-"]') ||
      el.closest(".user-query-bubble-with-background") ||
      el.closest(".query-content") ||
      el
    );
  }

  function extractText(bubble) {
    const lines = bubble.querySelectorAll(".query-text-line, .query-text");
    if (lines.length) {
      return Array.from(lines)
        .map((n) => n.innerText.trim())
        .filter(Boolean)
        .join("\n");
    }
    return (bubble.innerText || "").trim();
  }

  function onCopyClick(e) {
    e.stopPropagation();
    const editBtn = e.currentTarget.__relatedEditBtn;
    const bubble = getBubble(editBtn);
    const text = extractText(bubble);
    if (!text) {
      showToast("No text to copy");
      return;
    }

    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        showToast("Copied to clipboard");
      } catch {
        showToast("Copy failed");
      } finally {
        document.body.removeChild(ta);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast("Copied to clipboard"))
        .catch(() => fallback());
    } else {
      fallback();
    }
  }

  function makeCopyButton(editBtn) {
    if (!editBtn || editBtn.parentElement.querySelector("button.__copy-injected")) return;
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = BTN_CLASSES + " __copy-injected";
    copyBtn.setAttribute("aria-label", "Copy");
    copyBtn.setAttribute("mat-icon-button", "");
    copyBtn.innerHTML = `
      <span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span>${ICON_HTML}
      <span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span>
      <span class="mat-ripple mat-mdc-button-ripple"></span>
    `;
    copyBtn.__relatedEditBtn = editBtn;
    copyBtn.addEventListener("click", onCopyClick);
    editBtn.parentElement.appendChild(copyBtn);
  }

  function scanForEditIconsAndInjectCopy() {
    const icons = document.querySelectorAll(
      'mat-icon[data-mat-icon-name="edit"], mat-icon[fonticon="edit"]'
    );
    icons.forEach((icon) => {
      const btn = icon.closest("button");
      if (!btn) return;
      makeCopyButton(btn);
    });
  }

  /* =========================
   *  E) OBSERVERS & BOOT
   * ========================= */
  // Global observer to (1) keep logo renamed and (2) keep copy buttons injected on dynamic pages
  const globalObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        // Re-apply label in newly added nodes and scan for edit icons
        m.addedNodes.forEach((n) => {
          if (n && n.nodeType === 1) {
            applyLabel(n);
          }
        });
        // Batch a scan; avoid scanning on every single node
        requestAnimationFrame(scanForEditIconsAndInjectCopy);
      } else if (m.type === "attributes") {
        applyLabel(m.target);
      }
    }
  });

  function startObserver() {
    const target = document.documentElement || document.body;
    if (!target) return;
    globalObserver.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-test-id"],
    });
  }

  // Run ASAP (document-start)
  addGlobalStyles();
  applyLabel();
  startObserver();

  // Also run once when DOM is ready to ensure initial UI gets patched
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        applyLabel();
        scanForEditIconsAndInjectCopy();
      },
      { once: true }
    );
  } else {
    // If the DOM is already there (rare at document-start), do an initial pass
    scanForEditIconsAndInjectCopy();
  }
})();
