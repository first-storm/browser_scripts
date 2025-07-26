// ==UserScript==
// @name         Gemini Sidebar Padding Fix for Firefox
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adjusts Gemini's sidebar padding for a symmetrical look in Firefox by balancing the space around the chat history list.
// @author       Your AI Assistant
// @match        https://gemini.google.com/*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/GeminiSidebarPaddingFix.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/GeminiSidebarPaddingFix.user.js
// ==/UserScript==

(function() {
    'use strict';

    // This CSS targets the container for the "Recent" chats list.
    // By enforcing equal horizontal padding, it counteracts the
    // asymmetry caused by Firefox's scrollbar rendering.
    // The value '12px' can be adjusted to your preference.
    const css = `
        .chat-history {
            padding-right: 10px !important;
        }
    `;

    GM_addStyle(css);
})();
