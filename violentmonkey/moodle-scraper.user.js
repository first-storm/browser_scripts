// ==UserScript==
// @name         Moodle Question Scraper to Markdown
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Scrapes a Moodle question, uploads images to sm.ms, and formats it as Markdown in a floating panel.
// @author       Genshin
// @match        https://moodle.telt.unsw.edu.au/mod/quiz/attempt.php*
// @match        https://moodle.telt.unsw.edu.au/mod/quiz/review.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=unsw.edu.au
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @connect      sm.ms
// @connect      moodle.telt.unsw.edu.au
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/moodle-scraper.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/moodle-scraper.user.js
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    let SMMS_API_KEY = GM_getValue('SMMS_API_KEY', null);

    // --- UI SETUP ---
    /**
     * Injects CSS styles into the page to style the scraper panel,
     * mimicking the Moodle UI for a consistent look and feel.
     */
    function addStyles() {
        GM_addStyle(`
            #scraper-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 450px;
                max-height: 80vh;
                background-color: #fff;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                display: none; /* start hidden (collapsed) */
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            /* Side toggle button (collapsed state trigger) */
            #scraper-toggle {
                position: fixed;
                top: 100px;
                right: 0;
                width: 44px;
                height: 44px;
                background-color: #0073b2;
                color: #fff;
                border-radius: 8px 0 0 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: -2px 2px 8px rgba(0,0,0,0.2);
                z-index: 10001;
                transition: all 0.2s ease;
                user-select: none;
            }
            #scraper-toggle:hover { background-color: #005a8c; width: 48px; }
            #scraper-toggle svg { width: 24px; height: 24px; }
            /* Close button inside header */
            #scraper-close-btn {
                background: none;
                border: none;
                color: #666;
                font-size: 20px;
                cursor: pointer;
                padding: 0 4px;
                line-height: 1;
                opacity: 0.8;
            }
            #scraper-close-btn:hover { opacity: 1; }
            #scraper-header {
                padding: 12px 15px;
                cursor: move;
                background-color: #f7f7f7;
                color: #333;
                border-bottom: 1px solid #ddd;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                user-select: none;
                font-weight: 600;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }
            #scraper-content {
                padding: 15px;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
                background-color: #fff;
            }
            #scraper-output {
                width: 100%;
                flex-grow: 1;
                box-sizing: border-box;
                font-family: 'Consolas', 'Monaco', 'Menlo', monospace;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 4px;
                resize: vertical;
                min-height: 250px;
                padding: 10px;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }
            #scraper-output:focus {
                outline: none;
                border-color: #0073b2;
                box-shadow: 0 0 0 2px rgba(0, 115, 178, 0.2);
            }
            #scraper-footer {
                padding: 10px 15px;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                border-top: 1px solid #ddd;
                background-color: #f7f7f7;
                border-bottom-left-radius: 4px;
                border-bottom-right-radius: 4px;
                align-items: center;
            }
            .scraper-btn {
                padding: 8px 16px;
                border: 1px solid transparent;
                border-radius: 4px;
                color: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
            }
            #scrape-btn {
                background-color: #0073b2; /* Moodle Primary Blue */
                border-color: #0073b2;
            }
            #scrape-btn:hover {
                background-color: #005a8c;
                border-color: #005a8c;
            }
            #copy-btn {
                background-color: #28a745; /* Moodle Success Green */
                border-color: #28a745;
            }
            #copy-btn:hover {
                background-color: #218838;
                border-color: #218838;
            }
            /* Spinner */
            .scraper-spinner {
                width: 18px; height: 18px; border: 2px solid rgba(0,0,0,0.15);
                border-top-color: #0073b2; border-radius: 50%;
                animation: scraper-spin 0.8s linear infinite; display: none;
            }
            @keyframes scraper-spin { to { transform: rotate(360deg); } }
            /* Loading state for scrape button */
            .scraper-btn.loading {
                opacity: 0.7; cursor: wait;
            }
        `);
    }

    /**
     * Creates and injects the main panel into the page body.
     */
    function createPanel() {
        // Create side toggle button
        const toggle = document.createElement('div');
        toggle.id = 'scraper-toggle';
        toggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M8 12h8M12 8v8"></path>
            </svg>
        `;
        document.body.appendChild(toggle);

        const panel = document.createElement('div');
        panel.id = 'scraper-panel';
        panel.innerHTML = `
            <div id="scraper-header">
                <span>📋 Question Scraper</span>
                <button id="scraper-close-btn" title="Collapse">✕</button>
            </div>
            <div id="scraper-content">
                <textarea id="scraper-output" placeholder="Click 'Scrape Question' to begin..."></textarea>
            </div>
            <div id="scraper-footer">
                <div class="scraper-spinner" id="scraper-spinner" aria-label="Loading"></div>
                <button id="scrape-btn" class="scraper-btn">Scrape Question</button>
                <button id="copy-btn" class="scraper-btn">Copy Markdown</button>
            </div>
        `;
        document.body.appendChild(panel);

        // Default collapsed
        panel.style.display = 'none';
        toggle.style.display = 'flex';

        // Add event listeners
        document.getElementById('scrape-btn').addEventListener('click', processQuestion);
        document.getElementById('copy-btn').addEventListener('click', copyMarkdown);
        document.getElementById('scraper-close-btn').addEventListener('click', togglePanel);
        toggle.addEventListener('click', togglePanel);

        makeDraggable(panel);
    }

    /**
     * Makes the panel draggable by its header.
     * @param {HTMLElement} element - The panel element to make draggable.
     */
    function makeDraggable(element) {
        const header = element.querySelector('#scraper-header');
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        header.onmousedown = (e) => {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }


    // --- API & CORE LOGIC ---
    /**
     * Prompts the user to set their sm.ms API token.
     */
    function setApiKey() {
        const key = prompt("Please enter your sm.ms API Token:", SMMS_API_KEY || '');
        if (key) {
            SMMS_API_KEY = key;
            GM_setValue('SMMS_API_KEY', key);
            alert("API Key saved successfully!");
        }
    }

    /**
     * Uploads an image from a Moodle URL to sm.ms.
     * @param {string} imageUrl - The source URL of the image on Moodle.
     * @returns {Promise<string>} A promise that resolves with the new sm.ms URL.
     */
    function uploadImageToSmms(imageUrl) {
        return new Promise((resolve, reject) => {
            if (!SMMS_API_KEY) {
                return reject("sm.ms API key is not set.");
            }
            // 1. Fetch image from Moodle as a blob
            GM_xmlhttpRequest({
                method: "GET",
                url: imageUrl,
                responseType: 'blob',
                onload: function(response) {
                    const blob = response.response;
                    const formData = new FormData();
                    formData.append('smfile', blob, 'image.png');

                    // 2. Upload blob to sm.ms
                    GM_xmlhttpRequest({
                        method: "POST",
                        url: 'https://sm.ms/api/v2/upload',
                        headers: {
                            "Authorization": SMMS_API_KEY
                        },
                        data: formData,
                        onload: function(uploadResponse) {
                            try {
                                const json = JSON.parse(uploadResponse.responseText);
                                if (json.success) {
                                    resolve(json.data.url);
                                } else if (json.code === 'image_repeated') {
                                    resolve(json.images); // Use existing image URL
                                } else {
                                    reject(json.message || "Unknown upload error");
                                }
                            } catch (e) {
                                reject("Failed to parse sm.ms response.");
                            }
                        },
                        onerror: function(error) {
                            reject("Network error during upload.");
                        }
                    });
                },
                onerror: function(error) {
                    reject("Failed to fetch image from Moodle.");
                }
            });
        });
    }

    /**
     * Recursively converts an HTML node and its children to a Markdown string.
     * @param {Node} node - The HTML node to convert.
     * @returns {string} The resulting Markdown string.
     */
    function convertNodeToMarkdown(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.replace(/\s\s+/g, ' ');
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        let innerMarkdown = Array.from(node.childNodes).map(convertNodeToMarkdown).join('');
        switch (node.tagName.toLowerCase()) {
            case 'p': return `\n\n${innerMarkdown.trim()}`;
            case 'strong': case 'b': return `**${innerMarkdown}**`;
            case 'u': return `${innerMarkdown}`;
            case 'em': case 'i': return `*${innerMarkdown}*`;
            case 'span':
                if (node.style.textDecoration === 'underline') {
                    return `${innerMarkdown}`;
                }
                return innerMarkdown;
            case 'h4':
                // Ignore Moodle's "Question text" accessibility header
                if (node.classList.contains('accesshide')) return '';
                return `\n\n#### ${innerMarkdown}\n\n`;
            default: return innerMarkdown;
        }
    }

    /**
     * Main function to find the question, process its content, and display the Markdown.
     */
    async function processQuestion() {
        const output = document.getElementById('scraper-output');
        const spinner = document.getElementById('scraper-spinner');
        const scrapeBtn = document.getElementById('scrape-btn');
        const copyBtn = document.getElementById('copy-btn');

        const startLoading = () => {
            if (spinner) spinner.style.display = 'inline-block';
            if (scrapeBtn) {
                scrapeBtn.classList.add('loading');
                scrapeBtn.disabled = true;
            }
            if (copyBtn) copyBtn.disabled = true;
        };
        const stopLoading = () => {
            if (spinner) spinner.style.display = 'none';
            if (scrapeBtn) {
                scrapeBtn.classList.remove('loading');
                scrapeBtn.disabled = false;
            }
            if (copyBtn) copyBtn.disabled = false;
        };

        startLoading();
        try {
            output.value = "Processing... Please wait.";
            if (!SMMS_API_KEY) {
                output.value = "Error: sm.ms API key not set.\nPlease set it via the Tampermonkey menu (top right extension icon).";
                return;
            }

            const questionEl = document.querySelector('div.que');
            if (!questionEl) {
                output.value = "Error: Could not find a question element (div.que) on this page.";
                return;
            }

            const questionNo = questionEl.querySelector('.qno')?.textContent || 'N/A';
            const formulationEl = questionEl.querySelector('.formulation')?.cloneNode(true);

            if (!formulationEl) {
                output.value = "Error: Could not find question content (div.formulation).";
                return;
            }
            output.value = "Found question. Uploading images...";

            // --- Step 1: Process and upload images asynchronously ---
            const images = formulationEl.querySelectorAll('img');
            const uploadPromises = [];
            for (const img of images) {
                const promise = uploadImageToSmms(img.src)
                    .then(newUrl => {
                        const alt = img.getAttribute('alt') || 'image';
                        const markdownImg = document.createTextNode(`\n\n![${alt}](${newUrl})\n\n`);
                        img.parentNode.replaceChild(markdownImg, img);
                    })
                    .catch(error => {
                        console.error('Image upload failed:', error);
                        const errorText = document.createTextNode(`\n[IMAGE UPLOAD FAILED: ${error}]\n`);
                        img.parentNode.replaceChild(errorText, img);
                    });
                uploadPromises.push(promise);
            }
            await Promise.all(uploadPromises);
            output.value = "Images processed. Converting text and LaTeX...";

            // --- Step 2: Process MathJax/LaTeX ---
            const mathSpans = formulationEl.querySelectorAll('span.nolink');
            mathSpans.forEach(span => {
                const script = span.querySelector('script[type="math/tex"]') || span.nextElementSibling;
                if (script && script.tagName === 'SCRIPT' && script.type === 'math/tex') {
                    const tex = script.textContent.trim();
                    const mathNode = document.createTextNode(`$${tex}$`);
                    span.parentNode.replaceChild(mathNode, span);
                }
            });

            // --- Step 3: Clean up unwanted HTML elements ---
            formulationEl.querySelectorAll('input, .stackinputfeedback, .im-controls, button, script').forEach(el => el.remove());

            // --- Step 4: Convert remaining HTML to Markdown ---
            let contentMarkdown = Array.from(formulationEl.childNodes).map(convertNodeToMarkdown).join('');

            // Final cleanup
            contentMarkdown = contentMarkdown
                .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
                .replace(/\n{3,}/g, '\n\n') // Collapse excess newlines
                .trim();

            const finalMarkdown = `## Question ${questionNo}\n\n${contentMarkdown}`;
            output.value = finalMarkdown;
        } catch (e) {
            console.error(e);
            output.value = `Error: ${e?.message || 'Unexpected error.'}`;
        } finally {
            stopLoading();
        }
    }

    /**
     * Copies the generated Markdown from the output textarea to the clipboard.
     */
    function copyMarkdown() {
        const output = document.getElementById('scraper-output');
        const copyBtn = document.getElementById('copy-btn');
        
        if (!output.value || output.value.startsWith("Processing...") || output.value.startsWith("Error:")) {
            alert("Nothing to copy yet. Please scrape a question first.");
            return;
        }
        
        navigator.clipboard.writeText(output.value).then(() => {
            // Show "Copied" feedback on button
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            copyBtn.style.backgroundColor = "#28a745";
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = "#28a745"; // Keep original green color
            }, 2000);
        }).catch(err => {
            alert("Failed to copy text. See console for details.");
            console.error('Copy failed', err);
        });
    }

    // Toggle expand/collapse like Coles scraper
    function togglePanel() {
        const panel = document.getElementById('scraper-panel');
        const toggle = document.getElementById('scraper-toggle');
        const isHidden = panel.style.display === 'none' || getComputedStyle(panel).display === 'none';
        panel.style.display = isHidden ? 'flex' : 'none';
        toggle.style.display = isHidden ? 'none' : 'flex';
    }

    // --- SCRIPT INITIALIZATION ---
    function init() {
        addStyles();
        createPanel();
        GM_registerMenuCommand('Set sm.ms API Key', setApiKey);
    }

    init();

})();