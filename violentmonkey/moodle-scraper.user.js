// ==UserScript==
// @name         Moodle Question Scraper to Markdown
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Scrapes Moodle questions to Markdown, uploads images, and can automatically follow Next page across reloads.
// @author       Genshin
// @match        https://moodle.telt.unsw.edu.au/mod/quiz/attempt.php*
// @match        https://moodle.telt.unsw.edu.au/mod/quiz/review.php*
// @match        https://moodle.telt.unsw.edu.au/mod/quiz/summary.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=unsw.edu.au
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @connect      sm.ms
// @connect      api.imgbb.com
// @connect      moodle.telt.unsw.edu.au
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/moodle-scraper.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/moodle-scraper.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================

    let SMMS_API_KEY = GM_getValue('SMMS_API_KEY', null);
    let IMGBB_API_KEY = GM_getValue('IMGBB_API_KEY', null);
    let IMAGE_HOST_SERVICE = GM_getValue('IMAGE_HOST_SERVICE', 'smms');
    let SCRAPE_SUMMARY = GM_getValue('SCRAPE_SUMMARY', false);

    /**
     * 持久化自动抓取状态。
     *
     * Moodle 点击 Next 后会重新加载整个页面，因此普通变量会丢失。
     * 这里使用 GM_setValue / GM_getValue 保存进度和 Markdown。
     */
    const AUTO_KEYS = {
        ACTIVE: 'MOODLE_AUTO_SCRAPE_ACTIVE',
        DATA: 'MOODLE_AUTO_SCRAPE_DATA',
        COUNT: 'MOODLE_AUTO_SCRAPE_COUNT',
        PAGES: 'MOODLE_AUTO_SCRAPE_PAGES',
        LAST_SIGNATURE: 'MOODLE_AUTO_SCRAPE_LAST_SIGNATURE',
        LAST_RESULT: 'MOODLE_AUTO_SCRAPE_LAST_RESULT',
        ATTEMPT_ID: 'MOODLE_AUTO_SCRAPE_ATTEMPT_ID'
    };

    let autoStepRunning = false;

    // ============================================================
    // UI STYLES
    // ============================================================

    function addStyles() {
        GM_addStyle(`
            #scraper-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 500px;
                max-width: calc(100vw - 40px);
                max-height: 85vh;
                background-color: #fff;
                border: 1px solid #ddd;
                border-radius: 6px;
                box-shadow: 0 4px 18px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                display: none;
                flex-direction: column;
                font-family:
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    Roboto,
                    "Helvetica Neue",
                    Arial,
                    sans-serif;
            }

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
                box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.2);
                z-index: 10001;
                transition:
                    width 0.2s ease,
                    background-color 0.2s ease;
                user-select: none;
            }

            #scraper-toggle:hover {
                width: 48px;
                background-color: #005a8c;
            }

            #scraper-toggle svg {
                width: 24px;
                height: 24px;
            }

            #scraper-header {
                padding: 12px 15px;
                cursor: move;
                background-color: #f7f7f7;
                color: #333;
                border-bottom: 1px solid #ddd;
                border-top-left-radius: 6px;
                border-top-right-radius: 6px;
                user-select: none;
                font-weight: 600;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

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

            #scraper-close-btn:hover {
                opacity: 1;
            }

            #scraper-status {
                display: none;
                padding: 8px 15px;
                background-color: #eaf5fb;
                color: #005a8c;
                border-bottom: 1px solid #c9e4f2;
                font-size: 13px;
                line-height: 1.4;
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
                font-family: Consolas, Monaco, Menlo, monospace;
                font-size: 14px;
                line-height: 1.5;
                border: 1px solid #ccc;
                border-radius: 4px;
                resize: vertical;
                min-height: 300px;
                padding: 10px;
                transition:
                    border-color 0.2s ease,
                    box-shadow 0.2s ease;
            }

            #scraper-output:focus {
                outline: none;
                border-color: #0073b2;
                box-shadow: 0 0 0 2px rgba(0, 115, 178, 0.2);
            }

            #scraper-footer {
                padding: 10px 15px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: flex-end;
                border-top: 1px solid #ddd;
                background-color: #f7f7f7;
                border-bottom-left-radius: 6px;
                border-bottom-right-radius: 6px;
                align-items: center;
            }

            .scraper-btn {
                padding: 8px 13px;
                border: 1px solid transparent;
                border-radius: 4px;
                color: #fff;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition:
                    background-color 0.15s ease-in-out,
                    border-color 0.15s ease-in-out,
                    opacity 0.15s ease-in-out;
            }

            .scraper-btn:disabled {
                cursor: not-allowed;
                opacity: 0.6;
            }

            #scrape-btn {
                background-color: #0073b2;
                border-color: #0073b2;
            }

            #scrape-btn:hover:not(:disabled) {
                background-color: #005a8c;
                border-color: #005a8c;
            }

            #copy-btn {
                background-color: #28a745;
                border-color: #28a745;
            }

            #copy-btn:hover:not(:disabled) {
                background-color: #218838;
                border-color: #218838;
            }

            #scrape-all-btn {
                background-color: #6c757d;
                border-color: #6c757d;
            }

            #scrape-all-btn:hover:not(:disabled) {
                background-color: #5a6268;
                border-color: #545b62;
            }

            #auto-scrape-btn {
                background-color: #6f42c1;
                border-color: #6f42c1;
            }

            #auto-scrape-btn:hover:not(:disabled) {
                background-color: #59339d;
                border-color: #59339d;
            }

            #auto-stop-btn {
                background-color: #dc3545;
                border-color: #dc3545;
            }

            #auto-stop-btn:hover:not(:disabled) {
                background-color: #bd2130;
                border-color: #b21f2d;
            }

            .scraper-spinner {
                width: 18px;
                height: 18px;
                border: 2px solid rgba(0, 0, 0, 0.15);
                border-top-color: #0073b2;
                border-radius: 50%;
                animation: scraper-spin 0.8s linear infinite;
                display: none;
                flex-shrink: 0;
            }

            @keyframes scraper-spin {
                to {
                    transform: rotate(360deg);
                }
            }

            .scraper-btn.loading {
                opacity: 0.7;
                cursor: wait;
            }

            @media (max-width: 600px) {
                #scraper-panel {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    width: auto;
                    max-width: none;
                    max-height: 90vh;
                }

                #scraper-footer {
                    justify-content: stretch;
                }

                .scraper-btn {
                    flex-grow: 1;
                }
            }
        `);
    }

    // ============================================================
    // PANEL CREATION
    // ============================================================

    function createPanel() {
        if (
            document.getElementById('scraper-panel') ||
            document.getElementById('scraper-toggle')
        ) {
            return;
        }

        const toggle = document.createElement('div');
        toggle.id = 'scraper-toggle';
        toggle.title = 'Open Moodle Question Scraper';
        toggle.innerHTML = `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M8 12h8M12 8v8"></path>
            </svg>
        `;
        document.body.appendChild(toggle);

        const panel = document.createElement('div');
        panel.id = 'scraper-panel';
        panel.innerHTML = `
            <div id="scraper-header">
                <span>📋 Moodle Question Scraper</span>
                <button id="scraper-close-btn" title="Collapse">✕</button>
            </div>

            <div id="scraper-status"></div>

            <div id="scraper-content">
                <textarea
                    id="scraper-output"
                    placeholder="Click a scrape button to begin..."
                ></textarea>
            </div>

            <div id="scraper-footer">
                <div
                    class="scraper-spinner"
                    id="scraper-spinner"
                    aria-label="Loading"
                ></div>

                <button
                    id="scrape-btn"
                    class="scraper-btn"
                    style="display: none;"
                >
                    Scrape Question
                </button>

                <button
                    id="scrape-all-btn"
                    class="scraper-btn"
                    style="display: none;"
                >
                    Scrape All
                </button>

                <button
                    id="auto-scrape-btn"
                    class="scraper-btn"
                    style="display: none;"
                >
                    🤖 Auto-Scrape Pages
                </button>

                <button
                    id="auto-stop-btn"
                    class="scraper-btn"
                    style="display: none;"
                >
                    ⛔ Stop
                </button>

                <button id="copy-btn" class="scraper-btn">
                    Copy Markdown
                </button>
            </div>
        `;

        document.body.appendChild(panel);

        panel.style.display = 'none';
        toggle.style.display = 'flex';

        document
            .getElementById('scrape-btn')
            .addEventListener('click', processQuestion);

        document
            .getElementById('scrape-all-btn')
            .addEventListener('click', processAllQuestions);

        document
            .getElementById('auto-scrape-btn')
            .addEventListener('click', beginAutoScrape);

        document
            .getElementById('auto-stop-btn')
            .addEventListener('click', cancelAutoScrape);

        document
            .getElementById('copy-btn')
            .addEventListener('click', copyMarkdown);

        document
            .getElementById('scraper-close-btn')
            .addEventListener('click', togglePanel);

        toggle.addEventListener('click', togglePanel);

        const isReviewPage =
            window.location.pathname.includes('/mod/quiz/review.php');

        const isAttemptPage =
            window.location.pathname.includes('/mod/quiz/attempt.php');

        if (isAttemptPage) {
            document.getElementById('scrape-btn').style.display = 'inline-block';
            document.getElementById('auto-scrape-btn').style.display =
                'inline-block';
        }

        if (isReviewPage) {
            document.getElementById('scrape-all-btn').style.display =
                'inline-block';
        }

        makeDraggable(panel);
    }

    function togglePanel() {
        const panel = document.getElementById('scraper-panel');
        const toggle = document.getElementById('scraper-toggle');

        if (!panel || !toggle) {
            return;
        }

        const isHidden =
            panel.style.display === 'none' ||
            getComputedStyle(panel).display === 'none';

        panel.style.display = isHidden ? 'flex' : 'none';
        toggle.style.display = isHidden ? 'none' : 'flex';
    }

    function openPanel() {
        const panel = document.getElementById('scraper-panel');
        const toggle = document.getElementById('scraper-toggle');

        if (panel) {
            panel.style.display = 'flex';
        }

        if (toggle) {
            toggle.style.display = 'none';
        }
    }

    function setStatus(message, visible = true) {
        const status = document.getElementById('scraper-status');

        if (!status) {
            return;
        }

        status.textContent = message;
        status.style.display = visible ? 'block' : 'none';
    }

    // ============================================================
    // DRAGGABLE PANEL
    // ============================================================

    function makeDraggable(element) {
        const header = element.querySelector('#scraper-header');

        let pos1 = 0;
        let pos2 = 0;
        let pos3 = 0;
        let pos4 = 0;

        header.onmousedown = (event) => {
            if (
                event.target instanceof HTMLElement &&
                event.target.closest('button')
            ) {
                return;
            }

            event.preventDefault();

            pos3 = event.clientX;
            pos4 = event.clientY;

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };

        function elementDrag(event) {
            event.preventDefault();

            pos1 = pos3 - event.clientX;
            pos2 = pos4 - event.clientY;
            pos3 = event.clientX;
            pos4 = event.clientY;

            const nextTop = element.offsetTop - pos2;
            const nextLeft = element.offsetLeft - pos1;

            const maxLeft = Math.max(
                0,
                window.innerWidth - element.offsetWidth
            );

            const maxTop = Math.max(
                0,
                window.innerHeight - 50
            );

            element.style.top =
                Math.min(Math.max(0, nextTop), maxTop) + 'px';

            element.style.left =
                Math.min(Math.max(0, nextLeft), maxLeft) + 'px';

            element.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // ============================================================
    // SETTINGS
    // ============================================================

    function setSmmsApiKey() {
        const key = prompt(
            'Please enter your sm.ms API Token:',
            SMMS_API_KEY || ''
        );

        if (key && key.trim()) {
            SMMS_API_KEY = key.trim();
            GM_setValue('SMMS_API_KEY', SMMS_API_KEY);
            alert('sm.ms API Key saved successfully!');
        }
    }

    function setImgbbApiKey() {
        const key = prompt(
            'Please enter your ImgBB API Key:',
            IMGBB_API_KEY || ''
        );

        if (key && key.trim()) {
            IMGBB_API_KEY = key.trim();
            GM_setValue('IMGBB_API_KEY', IMGBB_API_KEY);
            alert('ImgBB API Key saved successfully!');
        }
    }

    function selectImageHostService() {
        const currentChoice =
            IMAGE_HOST_SERVICE === 'smms' ? '1' : '2';

        const choice = prompt(
            [
                'Select image hosting service:',
                '',
                '1. sm.ms',
                '2. ImgBB',
                '',
                `Current: ${IMAGE_HOST_SERVICE}`,
                '',
                'Enter 1 or 2:'
            ].join('\n'),
            currentChoice
        );

        if (choice === '1') {
            IMAGE_HOST_SERVICE = 'smms';
            GM_setValue('IMAGE_HOST_SERVICE', 'smms');
            alert('Image hosting service set to sm.ms');
        } else if (choice === '2') {
            IMAGE_HOST_SERVICE = 'imgbb';
            GM_setValue('IMAGE_HOST_SERVICE', 'imgbb');
            alert('Image hosting service set to ImgBB');
        }
    }

    function toggleScrapeSummary() {
        SCRAPE_SUMMARY = !SCRAPE_SUMMARY;
        GM_setValue('SCRAPE_SUMMARY', SCRAPE_SUMMARY);

        alert(
            `Scrape quiz summary: ${SCRAPE_SUMMARY ? 'ON' : 'OFF'}`
        );
    }

    // ============================================================
    // IMAGE UPLOAD
    // ============================================================

    function uploadImageToSmms(imageUrl) {
        return new Promise((resolve, reject) => {
            if (!SMMS_API_KEY) {
                reject('sm.ms API key is not set.');
                return;
            }

            GM_xmlhttpRequest({
                method: 'GET',
                url: imageUrl,
                responseType: 'blob',

                onload(response) {
                    if (
                        response.status < 200 ||
                        response.status >= 300
                    ) {
                        reject(
                            `Failed to fetch image from Moodle: HTTP ${response.status}`
                        );
                        return;
                    }

                    const blob = response.response;
                    const formData = new FormData();

                    formData.append(
                        'smfile',
                        blob,
                        getImageFilename(imageUrl, blob)
                    );

                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://sm.ms/api/v2/upload',
                        headers: {
                            Authorization: SMMS_API_KEY
                        },
                        data: formData,

                        onload(uploadResponse) {
                            try {
                                const json = JSON.parse(
                                    uploadResponse.responseText
                                );

                                if (json.success && json.data?.url) {
                                    resolve(json.data.url);
                                    return;
                                }

                                if (
                                    json.code === 'image_repeated' &&
                                    json.images
                                ) {
                                    resolve(json.images);
                                    return;
                                }

                                reject(
                                    json.message ||
                                    `sm.ms upload failed: HTTP ${uploadResponse.status}`
                                );
                            } catch (error) {
                                reject(
                                    'Failed to parse sm.ms response.'
                                );
                            }
                        },

                        onerror() {
                            reject(
                                'Network error during upload to sm.ms.'
                            );
                        },

                        ontimeout() {
                            reject(
                                'Upload to sm.ms timed out.'
                            );
                        },

                        timeout: 60000
                    });
                },

                onerror() {
                    reject('Failed to fetch image from Moodle.');
                },

                ontimeout() {
                    reject('Fetching image from Moodle timed out.');
                },

                timeout: 60000
            });
        });
    }

    function uploadImageToImgbb(imageUrl) {
        return new Promise((resolve, reject) => {
            if (!IMGBB_API_KEY) {
                reject('ImgBB API key is not set.');
                return;
            }

            GM_xmlhttpRequest({
                method: 'GET',
                url: imageUrl,
                responseType: 'blob',

                onload(response) {
                    if (
                        response.status < 200 ||
                        response.status >= 300
                    ) {
                        reject(
                            `Failed to fetch image from Moodle: HTTP ${response.status}`
                        );
                        return;
                    }

                    const blob = response.response;
                    const reader = new FileReader();

                    reader.onload = function () {
                        try {
                            const result = String(reader.result);
                            const base64Data = result.includes(',')
                                ? result.split(',')[1]
                                : result;

                            const formData = new FormData();
                            formData.append('key', IMGBB_API_KEY);
                            formData.append('image', base64Data);

                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: 'https://api.imgbb.com/1/upload',
                                data: formData,

                                onload(uploadResponse) {
                                    try {
                                        const json = JSON.parse(
                                            uploadResponse.responseText
                                        );

                                        if (
                                            json.success &&
                                            json.data?.url
                                        ) {
                                            resolve(json.data.url);
                                            return;
                                        }

                                        reject(
                                            json.error?.message ||
                                            `ImgBB upload failed: HTTP ${uploadResponse.status}`
                                        );
                                    } catch (error) {
                                        reject(
                                            'Failed to parse ImgBB response.'
                                        );
                                    }
                                },

                                onerror() {
                                    reject(
                                        'Network error during upload to ImgBB.'
                                    );
                                },

                                ontimeout() {
                                    reject(
                                        'Upload to ImgBB timed out.'
                                    );
                                },

                                timeout: 60000
                            });
                        } catch (error) {
                            reject(
                                'Failed to prepare image for ImgBB.'
                            );
                        }
                    };

                    reader.onerror = function () {
                        reject(
                            'Failed to convert image to base64.'
                        );
                    };

                    reader.readAsDataURL(blob);
                },

                onerror() {
                    reject('Failed to fetch image from Moodle.');
                },

                ontimeout() {
                    reject('Fetching image from Moodle timed out.');
                },

                timeout: 60000
            });
        });
    }

    function getImageFilename(imageUrl, blob) {
        try {
            const url = new URL(imageUrl, window.location.href);
            const pathname = url.pathname;
            const lastPart = pathname.split('/').pop();

            if (
                lastPart &&
                /\.[a-zA-Z0-9]{2,5}$/.test(lastPart)
            ) {
                return decodeURIComponent(lastPart);
            }
        } catch (error) {
            // Use fallback below.
        }

        const type = blob?.type || '';

        if (type.includes('jpeg')) {
            return 'image.jpg';
        }

        if (type.includes('gif')) {
            return 'image.gif';
        }

        if (type.includes('webp')) {
            return 'image.webp';
        }

        if (type.includes('svg')) {
            return 'image.svg';
        }

        return 'image.png';
    }

    function uploadImage(imageUrl) {
        if (IMAGE_HOST_SERVICE === 'imgbb') {
            return uploadImageToImgbb(imageUrl);
        }

        return uploadImageToSmms(imageUrl);
    }

    function hasRequiredImageApiKey() {
        if (IMAGE_HOST_SERVICE === 'imgbb') {
            return Boolean(IMGBB_API_KEY);
        }

        return Boolean(SMMS_API_KEY);
    }

    function getCurrentImageServiceName() {
        return IMAGE_HOST_SERVICE === 'imgbb'
            ? 'ImgBB'
            : 'sm.ms';
    }

    // ============================================================
    // MARKDOWN CONVERSION
    // ============================================================

    async function processFormulationElement(formulationEl) {
        const images = Array.from(
            formulationEl.querySelectorAll('img')
        );

        const uploadPromises = images.map(async (img) => {
            const sourceUrl =
                img.currentSrc ||
                img.src ||
                img.getAttribute('src');

            if (!sourceUrl) {
                img.replaceWith(
                    document.createTextNode(
                        '\n\n[IMAGE SOURCE NOT FOUND]\n\n'
                    )
                );
                return;
            }

            try {
                const newUrl = await uploadImage(sourceUrl);
                const alt =
                    img.getAttribute('alt')?.trim() ||
                    img.getAttribute('title')?.trim() ||
                    'image';

                img.replaceWith(
                    document.createTextNode(
                        `\n\n![${escapeMarkdownText(alt)}](${newUrl})\n\n`
                    )
                );
            } catch (error) {
                console.error(
                    'Image upload failed:',
                    sourceUrl,
                    error
                );

                const message =
                    typeof error === 'string'
                        ? error
                        : error?.message || 'Unknown image upload error';

                img.replaceWith(
                    document.createTextNode(
                        `\n\n[IMAGE UPLOAD FAILED: ${message}]\n\n`
                    )
                );
            }
        });

        await Promise.all(uploadPromises);

        convertMathJaxToText(formulationEl);

        formulationEl
            .querySelectorAll(
                [
                    'input',
                    'button',
                    'script',
                    'style',
                    'noscript',
                    '.stackinputfeedback',
                    '.im-controls',
                    '.questionflag',
                    '.accesshide',
                    '.sr-only',
                    '.qtype_multichoice_clearchoice'
                ].join(',')
            )
            .forEach((element) => element.remove());

        let contentMarkdown = Array.from(
            formulationEl.childNodes
        )
            .map(convertNodeToMarkdown)
            .join('');

        contentMarkdown = cleanMarkdown(contentMarkdown);

        return contentMarkdown;
    }

    function convertMathJaxToText(root) {
        const mathSpans = Array.from(
            root.querySelectorAll('span.nolink')
        );

        mathSpans.forEach((span) => {
            let script = span.querySelector(
                'script[type^="math/tex"]'
            );

            if (
                !script &&
                span.nextElementSibling?.matches(
                    'script[type^="math/tex"]'
                )
            ) {
                script = span.nextElementSibling;
            }

            if (!script) {
                return;
            }

            const tex = script.textContent.trim();
            const displayMath =
                script.type.includes('mode=display');

            const markdown = displayMath
                ? `\n\n$$\n${tex}\n$$\n\n`
                : `$${tex}$`;

            span.replaceWith(
                document.createTextNode(markdown)
            );

            if (script.isConnected) {
                script.remove();
            }
        });

        const standaloneScripts = Array.from(
            root.querySelectorAll('script[type^="math/tex"]')
        );

        standaloneScripts.forEach((script) => {
            const tex = script.textContent.trim();
            const displayMath =
                script.type.includes('mode=display');

            const markdown = displayMath
                ? `\n\n$$\n${tex}\n$$\n\n`
                : `$${tex}$`;

            script.replaceWith(
                document.createTextNode(markdown)
            );
        });
    }

    function convertNodeToMarkdown(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return normalizeTextNode(node.textContent);
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const tag = node.tagName.toLowerCase();

        if (
            node.classList.contains('accesshide') ||
            node.classList.contains('sr-only')
        ) {
            return '';
        }

        const innerMarkdown = Array.from(node.childNodes)
            .map(convertNodeToMarkdown)
            .join('');

        switch (tag) {
            case 'p':
                return `\n\n${innerMarkdown.trim()}\n\n`;

            case 'br':
                return '\n';

            case 'strong':
            case 'b':
                return innerMarkdown.trim()
                    ? `**${innerMarkdown.trim()}**`
                    : '';

            case 'em':
            case 'i':
                return innerMarkdown.trim()
                    ? `*${innerMarkdown.trim()}*`
                    : '';

            case 'u':
                return innerMarkdown;

            case 'del':
            case 's':
            case 'strike':
                return innerMarkdown.trim()
                    ? `~~${innerMarkdown.trim()}~~`
                    : '';

            case 'code':
                return `\`${innerMarkdown.trim()}\``;

            case 'pre':
                return `\n\n\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;

            case 'h1':
                return `\n\n# ${innerMarkdown.trim()}\n\n`;

            case 'h2':
                return `\n\n## ${innerMarkdown.trim()}\n\n`;

            case 'h3':
                return `\n\n### ${innerMarkdown.trim()}\n\n`;

            case 'h4':
                return `\n\n#### ${innerMarkdown.trim()}\n\n`;

            case 'h5':
                return `\n\n##### ${innerMarkdown.trim()}\n\n`;

            case 'h6':
                return `\n\n###### ${innerMarkdown.trim()}\n\n`;

            case 'blockquote':
                return (
                    '\n\n' +
                    innerMarkdown
                        .trim()
                        .split('\n')
                        .map((line) => `> ${line}`)
                        .join('\n') +
                    '\n\n'
                );

            case 'ul':
            case 'ol':
                return `\n${innerMarkdown.trim()}\n`;

            case 'li': {
                const parentTag =
                    node.parentElement?.tagName.toLowerCase();

                if (parentTag === 'ol') {
                    const siblings = Array.from(
                        node.parentElement.children
                    ).filter(
                        (child) =>
                            child.tagName.toLowerCase() === 'li'
                    );

                    const index =
                        siblings.indexOf(node) + 1;

                    return `\n${index}. ${innerMarkdown.trim()}`;
                }

                return `\n- ${innerMarkdown.trim()}`;
            }

            case 'a': {
                const href = node.getAttribute('href');
                const text = innerMarkdown.trim();

                if (!href || href === '#') {
                    return text;
                }

                return `[${text || href}](${href})`;
            }

            case 'img': {
                const src =
                    node.getAttribute('src') || '';

                const alt =
                    node.getAttribute('alt') || 'image';

                return `\n\n![${escapeMarkdownText(alt)}](${src})\n\n`;
            }

            case 'table':
                return convertTableToMarkdown(node);

            case 'fieldset':
                return `\n\n${innerMarkdown.trim()}\n\n`;

            case 'legend':
                if (
                    node.classList.contains('prompt') ||
                    node.classList.contains('sr-only')
                ) {
                    return '';
                }

                return `\n\n**${innerMarkdown.trim()}**\n\n`;

            case 'div':
                if (
                    node.classList.contains('r0') ||
                    node.classList.contains('r1') ||
                    node.matches('.answer > div')
                ) {
                    const optionText = innerMarkdown.trim();

                    return optionText
                        ? `\n- ${optionText}`
                        : '';
                }

                if (
                    node.classList.contains('qtext') ||
                    node.classList.contains('answer') ||
                    node.classList.contains('formulation')
                ) {
                    return `\n${innerMarkdown}\n`;
                }

                return innerMarkdown;

            case 'span':
                return innerMarkdown;

            case 'sup':
                return `^${innerMarkdown.trim()}^`;

            case 'sub':
                return `~${innerMarkdown.trim()}~`;

            case 'hr':
                return '\n\n---\n\n';

            default:
                return innerMarkdown;
        }
    }

    function convertTableToMarkdown(table) {
        const rows = Array.from(table.querySelectorAll('tr'));

        if (rows.length === 0) {
            return '';
        }

        const parsedRows = rows
            .map((row) => {
                return Array.from(
                    row.querySelectorAll(':scope > th, :scope > td')
                ).map((cell) => {
                    return cleanInlineMarkdown(
                        Array.from(cell.childNodes)
                            .map(convertNodeToMarkdown)
                            .join('')
                    );
                });
            })
            .filter((row) => row.length > 0);

        if (parsedRows.length === 0) {
            return '';
        }

        const columnCount = Math.max(
            ...parsedRows.map((row) => row.length)
        );

        const normalizedRows = parsedRows.map((row) => {
            const result = [...row];

            while (result.length < columnCount) {
                result.push('');
            }

            return result;
        });

        const header = normalizedRows[0];

        const separator = new Array(columnCount)
            .fill('---');

        const body = normalizedRows.slice(1);

        const lines = [
            `| ${header.join(' | ')} |`,
            `| ${separator.join(' | ')} |`,
            ...body.map(
                (row) => `| ${row.join(' | ')} |`
            )
        ];

        return `\n\n${lines.join('\n')}\n\n`;
    }

    function normalizeTextNode(text) {
        return String(text)
            .replace(/\u00a0/g, ' ')
            .replace(/[ \t]+/g, ' ');
    }

    function cleanInlineMarkdown(text) {
        return String(text)
            .replace(/\r/g, '')
            .replace(/\n+/g, ' ')
            .replace(/\|/g, '\\|')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    function cleanMarkdown(markdown) {
        return String(markdown)
            .replace(/\r/g, '')
            .replace(/\u00a0/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n[ \t]+/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\s+|\s+$/g, '');
    }

    function escapeMarkdownText(text) {
        return String(text)
            .replace(/\\/g, '\\\\')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]');
    }

    // ============================================================
    // COMMON QUESTION SCRAPING
    // ============================================================

    async function scrapeQuestionElement(questionElement) {
        const questionNo =
            questionElement
                .querySelector('.qno')
                ?.textContent
                ?.trim() || 'N/A';

        const formulation =
            questionElement.querySelector('.formulation');

        if (!formulation) {
            return '';
        }

        const cloned = formulation.cloneNode(true);
        const markdown =
            await processFormulationElement(cloned);

        return `## Question ${questionNo}\n\n${markdown}`;
    }

    async function scrapeQuestionsOnCurrentPage(
        progressCallback = null
    ) {
        const questions = Array.from(
            document.querySelectorAll('div.que')
        );

        const results = [];

        for (
            let index = 0;
            index < questions.length;
            index += 1
        ) {
            if (typeof progressCallback === 'function') {
                progressCallback(
                    index + 1,
                    questions.length
                );
            }

            const markdown =
                await scrapeQuestionElement(questions[index]);

            if (markdown) {
                results.push(markdown);
            }
        }

        return {
            count: results.length,
            markdown: results.join('\n\n---\n\n')
        };
    }

    // ============================================================
    // SINGLE QUESTION SCRAPE
    // ============================================================

    async function processQuestion() {
        const output =
            document.getElementById('scraper-output');

        const spinner =
            document.getElementById('scraper-spinner');

        const scrapeBtn =
            document.getElementById('scrape-btn');

        const copyBtn =
            document.getElementById('copy-btn');

        const scrapeAllBtn =
            document.getElementById('scrape-all-btn');

        const autoBtn =
            document.getElementById('auto-scrape-btn');

        const startLoading = () => {
            if (spinner) {
                spinner.style.display = 'inline-block';
            }

            if (scrapeBtn) {
                scrapeBtn.classList.add('loading');
                scrapeBtn.disabled = true;
            }

            if (scrapeAllBtn) {
                scrapeAllBtn.disabled = true;
            }

            if (autoBtn) {
                autoBtn.disabled = true;
            }

            if (copyBtn) {
                copyBtn.disabled = true;
            }
        };

        const stopLoading = () => {
            if (spinner) {
                spinner.style.display = 'none';
            }

            if (scrapeBtn) {
                scrapeBtn.classList.remove('loading');
                scrapeBtn.disabled = false;
            }

            if (scrapeAllBtn) {
                scrapeAllBtn.disabled = false;
            }

            if (autoBtn) {
                autoBtn.disabled = false;
            }

            if (copyBtn) {
                copyBtn.disabled = false;
            }
        };

        openPanel();
        startLoading();

        try {
            output.value = 'Processing... Please wait.';

            const questionElement =
                document.querySelector('div.que');

            if (!questionElement) {
                output.value =
                    'Error: Could not find a question element (div.que) on this page.';
                return;
            }

            const hasImages =
                questionElement.querySelector(
                    '.formulation img'
                );

            if (hasImages && !hasRequiredImageApiKey()) {
                output.value =
                    `Error: ${getCurrentImageServiceName()} API key is not set.\n` +
                    'Please set it through the userscript menu.';
                return;
            }

            output.value =
                'Found question. Processing content and images...';

            const finalMarkdown =
                await scrapeQuestionElement(questionElement);

            output.value =
                finalMarkdown ||
                'No content extracted.';
        } catch (error) {
            console.error(error);

            output.value =
                `Error: ${error?.message || 'Unexpected error.'}`;
        } finally {
            stopLoading();
        }
    }

    // ============================================================
    // SCRAPE ALL QUESTIONS ON CURRENT REVIEW PAGE
    // ============================================================

    async function processAllQuestions() {
        const output =
            document.getElementById('scraper-output');

        const spinner =
            document.getElementById('scraper-spinner');

        const scrapeBtn =
            document.getElementById('scrape-btn');

        const copyBtn =
            document.getElementById('copy-btn');

        const scrapeAllBtn =
            document.getElementById('scrape-all-btn');

        const autoBtn =
            document.getElementById('auto-scrape-btn');

        const startLoading = () => {
            if (spinner) {
                spinner.style.display = 'inline-block';
            }

            if (scrapeAllBtn) {
                scrapeAllBtn.classList.add('loading');
                scrapeAllBtn.disabled = true;
            }

            if (scrapeBtn) {
                scrapeBtn.disabled = true;
            }

            if (autoBtn) {
                autoBtn.disabled = true;
            }

            if (copyBtn) {
                copyBtn.disabled = true;
            }
        };

        const stopLoading = () => {
            if (spinner) {
                spinner.style.display = 'none';
            }

            if (scrapeAllBtn) {
                scrapeAllBtn.classList.remove('loading');
                scrapeAllBtn.disabled = false;
            }

            if (scrapeBtn) {
                scrapeBtn.disabled = false;
            }

            if (autoBtn) {
                autoBtn.disabled = false;
            }

            if (copyBtn) {
                copyBtn.disabled = false;
            }
        };

        openPanel();
        startLoading();

        try {
            output.value =
                'Processing all questions... Please wait.';

            const questions = Array.from(
                document.querySelectorAll('div.que')
            );

            if (questions.length === 0) {
                output.value =
                    'Error: No questions found (div.que).';
                return;
            }

            const hasImages = questions.some((question) =>
                question.querySelector('.formulation img')
            );

            if (
                hasImages &&
                !hasRequiredImageApiKey()
            ) {
                output.value =
                    `Error: ${getCurrentImageServiceName()} API key is not set.\n` +
                    'Please set it through the userscript menu.';
                return;
            }

            const summaryMarkdown =
                SCRAPE_SUMMARY
                    ? scrapeQuizSummary()
                    : '';

            const result =
                await scrapeQuestionsOnCurrentPage(
                    (current, total) => {
                        output.value =
                            `Processing question ${current}/${total}...`;
                    }
                );

            const finalMarkdown = [
                summaryMarkdown,
                result.markdown
            ]
                .filter(Boolean)
                .join('\n\n');

            output.value =
                finalMarkdown ||
                'No content extracted.';
        } catch (error) {
            console.error(error);

            output.value =
                `Error: ${error?.message || 'Unexpected error.'}`;
        } finally {
            stopLoading();
        }
    }

    function scrapeQuizSummary() {
        const summaryTable = document.querySelector(
            [
                'table.generaltable.quizreviewsummary',
                'table.generaltable.generalbox.quizreviewsummary'
            ].join(',')
        );

        if (!summaryTable) {
            return '';
        }

        const rows = Array.from(
            summaryTable.querySelectorAll('tbody tr')
        );

        const lines = [];

        for (const row of rows) {
            const heading =
                row.querySelector('th')
                    ?.textContent
                    ?.trim();

            const valueCell =
                row.querySelector('td');

            if (!heading || !valueCell) {
                continue;
            }

            const cloned =
                valueCell.cloneNode(true);

            cloned
                .querySelectorAll(
                    'script, style, button, input'
                )
                .forEach((element) => element.remove());

            const markdown = cleanMarkdown(
                Array.from(cloned.childNodes)
                    .map(convertNodeToMarkdown)
                    .join('')
            );

            const fallback =
                cloned.textContent.trim();

            lines.push(
                `- ${heading}: ${markdown || fallback}`
            );
        }

        if (lines.length === 0) {
            return '';
        }

        return `# Quiz Summary\n\n${lines.join('\n')}`;
    }

    // ============================================================
    // AUTOMATIC CROSS-PAGE SCRAPER
    // ============================================================

    function isAutoScrapeActive() {
        return (
            GM_getValue(AUTO_KEYS.ACTIVE, false) === true
        );
    }

    function getAttemptId() {
        const hiddenAttempt =
            document.querySelector(
                '#responseform input[name="attempt"]'
            )?.value;

        if (hiddenAttempt) {
            return String(hiddenAttempt);
        }

        const url =
            new URL(window.location.href);

        return (
            url.searchParams.get('attempt') ||
            ''
        );
    }

    function getNextNavButton() {
        return document.querySelector(
            [
                '#mod_quiz-next-nav',
                'input.mod_quiz-next-nav[name="next"]',
                'button.mod_quiz-next-nav[name="next"]'
            ].join(',')
        );
    }

    function getNextButtonLabel() {
        const button = getNextNavButton();

        if (!button) {
            return '';
        }

        return String(
            button.value ||
            button.textContent ||
            button.getAttribute('aria-label') ||
            ''
        ).trim();
    }

    function isLastQuizPage() {
        const button = getNextNavButton();

        if (!button) {
            return true;
        }

        return /finish\s+attempt/i.test(
            getNextButtonLabel()
        );
    }

    function getCurrentPageNumber() {
        const field =
            document.querySelector(
                '#responseform input[name="thispage"]'
            );

        if (field?.value !== undefined) {
            return String(field.value);
        }

        const url =
            new URL(window.location.href);

        return (
            url.searchParams.get('page') ||
            'unknown'
        );
    }

    function createCurrentPageSignature() {
        const attemptId = getAttemptId();
        const pageNumber = getCurrentPageNumber();

        const questionIds = Array.from(
            document.querySelectorAll('div.que')
        )
            .map((question) => {
                const id =
                    question.id || '';

                const number =
                    question
                        .querySelector('.qno')
                        ?.textContent
                        ?.trim() || '';

                return `${id}:${number}`;
            })
            .join('|');

        return [
            attemptId,
            pageNumber,
            questionIds
        ].join('::');
    }

    function showAutoScrapeUI() {
        openPanel();

        const stopButton =
            document.getElementById('auto-stop-btn');

        const autoButton =
            document.getElementById('auto-scrape-btn');

        const scrapeButton =
            document.getElementById('scrape-btn');

        const scrapeAllButton =
            document.getElementById('scrape-all-btn');

        const copyButton =
            document.getElementById('copy-btn');

        const spinner =
            document.getElementById('scraper-spinner');

        if (stopButton) {
            stopButton.style.display = 'inline-block';
            stopButton.disabled = false;
        }

        if (autoButton) {
            autoButton.style.display = 'none';
        }

        if (scrapeButton) {
            scrapeButton.disabled = true;
        }

        if (scrapeAllButton) {
            scrapeAllButton.disabled = true;
        }

        if (copyButton) {
            copyButton.disabled = true;
        }

        if (spinner) {
            spinner.style.display = 'inline-block';
        }
    }

    function hideAutoScrapeUI() {
        const stopButton =
            document.getElementById('auto-stop-btn');

        const autoButton =
            document.getElementById('auto-scrape-btn');

        const scrapeButton =
            document.getElementById('scrape-btn');

        const scrapeAllButton =
            document.getElementById('scrape-all-btn');

        const copyButton =
            document.getElementById('copy-btn');

        const spinner =
            document.getElementById('scraper-spinner');

        if (stopButton) {
            stopButton.style.display = 'none';
        }

        if (
            autoButton &&
            window.location.pathname.includes(
                '/mod/quiz/attempt.php'
            )
        ) {
            autoButton.style.display = 'inline-block';
            autoButton.disabled = false;
        }

        if (scrapeButton) {
            scrapeButton.disabled = false;
        }

        if (scrapeAllButton) {
            scrapeAllButton.disabled = false;
        }

        if (copyButton) {
            copyButton.disabled = false;
        }

        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    async function beginAutoScrape() {
        if (
            !window.location.pathname.includes(
                '/mod/quiz/attempt.php'
            )
        ) {
            alert(
                'Auto-scrape only works on Moodle quiz attempt pages.'
            );
            return;
        }

        if (isAutoScrapeActive()) {
            alert('Auto-scrape is already running.');
            return;
        }

        const questionImages =
            document.querySelector(
                'div.que .formulation img'
            );

        if (
            questionImages &&
            !hasRequiredImageApiKey()
        ) {
            const shouldContinue = confirm(
                [
                    `${getCurrentImageServiceName()} API key is not set.`,
                    '',
                    'Questions will still be scraped, but images will be replaced with upload-failure messages.',
                    '',
                    'Continue anyway?'
                ].join('\n')
            );

            if (!shouldContinue) {
                return;
            }
        }

        const attemptId = getAttemptId();

        GM_setValue(AUTO_KEYS.DATA, '');
        GM_setValue(AUTO_KEYS.COUNT, 0);
        GM_setValue(AUTO_KEYS.PAGES, 0);
        GM_setValue(AUTO_KEYS.LAST_SIGNATURE, '');
        GM_setValue(AUTO_KEYS.ATTEMPT_ID, attemptId);
        GM_setValue(AUTO_KEYS.ACTIVE, true);

        autoStepRunning = false;

        await autoScrapeStep();
    }

    async function autoScrapeStep() {
        if (autoStepRunning) {
            return;
        }

        if (!isAutoScrapeActive()) {
            return;
        }

        autoStepRunning = true;
        showAutoScrapeUI();

        const output =
            document.getElementById('scraper-output');

        try {
            const questions = Array.from(
                document.querySelectorAll('div.que')
            );

            if (questions.length === 0) {
                finishAutoScrape(
                    'No question elements were found on this page.'
                );
                return;
            }

            const storedAttemptId =
                GM_getValue(AUTO_KEYS.ATTEMPT_ID, '');

            const currentAttemptId =
                getAttemptId();

            if (
                storedAttemptId &&
                currentAttemptId &&
                storedAttemptId !== currentAttemptId
            ) {
                finishAutoScrape(
                    'The Moodle attempt ID changed. Auto-scrape stopped to avoid mixing two quizzes.'
                );
                return;
            }

            const signature =
                createCurrentPageSignature();

            const lastSignature =
                GM_getValue(
                    AUTO_KEYS.LAST_SIGNATURE,
                    ''
                );

            if (
                signature &&
                signature === lastSignature
            ) {
                finishAutoScrape(
                    'The page did not advance after clicking Next. Moodle may be blocking navigation, or the same page was loaded again.'
                );
                return;
            }

            GM_setValue(
                AUTO_KEYS.LAST_SIGNATURE,
                signature
            );

            const completedPages =
                Number(
                    GM_getValue(AUTO_KEYS.PAGES, 0)
                ) + 1;

            if (completedPages > 300) {
                finishAutoScrape(
                    'The 300-page safety limit was reached.'
                );
                return;
            }

            GM_setValue(
                AUTO_KEYS.PAGES,
                completedPages
            );

            setStatus(
                `Auto-scrape is running — page ${completedPages}, ${questions.length} question(s) found.`
            );

            if (output) {
                output.value =
                    `⏳ Processing page ${completedPages}...\n` +
                    `Found ${questions.length} question(s).`;
            }

            const pageResult =
                await scrapeQuestionsOnCurrentPage(
                    (current, total) => {
                        setStatus(
                            `Page ${completedPages}: processing question ${current}/${total}...`
                        );
                    }
                );

            /*
             * 图片上传过程中，用户可能按了 Stop。
             * 这种情况下不能继续追加数据或点击 Next。
             */
            if (!isAutoScrapeActive()) {
                return;
            }

            if (pageResult.markdown) {
                const existingData =
                    GM_getValue(AUTO_KEYS.DATA, '');

                const combinedData =
                    existingData
                        ? `${existingData}\n\n---\n\n${pageResult.markdown}`
                        : pageResult.markdown;

                GM_setValue(
                    AUTO_KEYS.DATA,
                    combinedData
                );

                const existingCount =
                    Number(
                        GM_getValue(
                            AUTO_KEYS.COUNT,
                            0
                        )
                    );

                GM_setValue(
                    AUTO_KEYS.COUNT,
                    existingCount + pageResult.count
                );
            }

            const totalCount =
                Number(
                    GM_getValue(AUTO_KEYS.COUNT, 0)
                );

            const accumulatedData =
                GM_getValue(AUTO_KEYS.DATA, '');

            if (output) {
                output.value =
                    `${accumulatedData}\n\n` +
                    `---\n\n` +
                    `⏳ Auto-scrape progress: ${totalCount} question(s), ${completedPages} page(s).`;
            }

            if (isLastQuizPage()) {
                finishAutoScrape(
                    'Reached the last page. The button says “Finish attempt ...”. The script did not click it.'
                );
                return;
            }

            const nextButton =
                getNextNavButton();

            if (!nextButton) {
                finishAutoScrape(
                    'Could not find the Next page button.'
                );
                return;
            }

            setStatus(
                `Page ${completedPages} saved. Navigating to the next page...`
            );

            if (output) {
                output.value =
                    `${accumulatedData}\n\n` +
                    `---\n\n` +
                    '⏳ Current page saved. Navigating to the next page...';
            }

            setTimeout(() => {
                if (!isAutoScrapeActive()) {
                    return;
                }

                const latestButton =
                    getNextNavButton();

                if (!latestButton) {
                    finishAutoScrape(
                        'The Next page button disappeared before it could be clicked.'
                    );
                    return;
                }

                latestButton.click();
            }, 700);
        } catch (error) {
            console.error('[Moodle Auto-Scrape]', error);

            finishAutoScrape(
                `Unexpected error: ${error?.message || error}`
            );
        } finally {
            autoStepRunning = false;
        }
    }

    function finishAutoScrape(reason) {
        const data =
            GM_getValue(AUTO_KEYS.DATA, '');

        const count =
            Number(
                GM_getValue(AUTO_KEYS.COUNT, 0)
            );

        const pages =
            Number(
                GM_getValue(AUTO_KEYS.PAGES, 0)
            );

        const finalResult = [
            '# Moodle Quiz Dump',
            '',
            `> Auto-scraped ${count} question(s) across ${pages} page(s).`,
            `> ${reason}`,
            '',
            data
        ]
            .filter(
                (part, index, array) =>
                    part !== '' ||
                    array[index - 1] !== ''
            )
            .join('\n')
            .trim();

        GM_setValue(AUTO_KEYS.ACTIVE, false);
        GM_setValue(
            AUTO_KEYS.LAST_RESULT,
            finalResult
        );

        /*
         * LAST_RESULT 保留最终结果。
         * DATA 等临时运行数据可以清空，避免下一次混入旧题。
         */
        GM_setValue(AUTO_KEYS.DATA, '');
        GM_setValue(AUTO_KEYS.COUNT, 0);
        GM_setValue(AUTO_KEYS.PAGES, 0);
        GM_setValue(AUTO_KEYS.LAST_SIGNATURE, '');
        GM_setValue(AUTO_KEYS.ATTEMPT_ID, '');

        const output =
            document.getElementById('scraper-output');

        if (output) {
            output.value = finalResult;
        }

        openPanel();
        hideAutoScrapeUI();
        setStatus(
            `Auto-scrape stopped: ${reason}`
        );

        try {
            if (
                finalResult &&
                typeof GM_setClipboard === 'function'
            ) {
                GM_setClipboard(
                    finalResult,
                    'text'
                );
            }
        } catch (error) {
            console.warn(
                'GM_setClipboard failed:',
                error
            );
        }

        alert(
            [
                `Auto-scrape finished.`,
                '',
                `Questions: ${count}`,
                `Pages: ${pages}`,
                '',
                reason,
                '',
                'The Markdown has been placed in the panel and copied to the clipboard.'
            ].join('\n')
        );
    }

    function cancelAutoScrape() {
        if (!isAutoScrapeActive()) {
            alert('Auto-scrape is not running.');
            return;
        }

        finishAutoScrape(
            'Cancelled by the user.'
        );
    }

    function copyLastAutoResult() {
        const lastResult =
            GM_getValue(
                AUTO_KEYS.LAST_RESULT,
                ''
            );

        if (!lastResult) {
            alert(
                'No stored auto-scrape result was found.'
            );
            return;
        }

        const output =
            document.getElementById('scraper-output');

        if (output) {
            output.value = lastResult;
        }

        openPanel();

        copyTextToClipboard(lastResult)
            .then(() => {
                alert(
                    'The previous auto-scrape result was loaded and copied to the clipboard.'
                );
            })
            .catch(() => {
                alert(
                    'The previous result was loaded into the panel, but automatic clipboard access failed. Click “Copy Markdown”.'
                );
            });
    }

    function clearStoredAutoResult() {
        const hasResult =
            Boolean(
                GM_getValue(
                    AUTO_KEYS.LAST_RESULT,
                    ''
                )
            );

        if (!hasResult) {
            alert('No stored result to clear.');
            return;
        }

        const confirmed = confirm(
            'Delete the stored auto-scrape result?'
        );

        if (!confirmed) {
            return;
        }

        GM_setValue(AUTO_KEYS.LAST_RESULT, '');
        alert('Stored auto-scrape result deleted.');
    }

    // ============================================================
    // CLIPBOARD
    // ============================================================

    async function copyTextToClipboard(text) {
        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {
            await navigator.clipboard.writeText(text);
            return;
        }

        if (
            typeof GM_setClipboard === 'function'
        ) {
            GM_setClipboard(text, 'text');
            return;
        }

        const temporaryTextarea =
            document.createElement('textarea');

        temporaryTextarea.value = text;
        temporaryTextarea.style.position = 'fixed';
        temporaryTextarea.style.left = '-9999px';
        temporaryTextarea.style.top = '-9999px';

        document.body.appendChild(
            temporaryTextarea
        );

        temporaryTextarea.focus();
        temporaryTextarea.select();

        const successful =
            document.execCommand('copy');

        temporaryTextarea.remove();

        if (!successful) {
            throw new Error(
                'Clipboard copy failed.'
            );
        }
    }

    function copyMarkdown() {
        const output =
            document.getElementById('scraper-output');

        const copyButton =
            document.getElementById('copy-btn');

        if (!output) {
            return;
        }

        const text =
            output.value.trim();

        if (
            !text ||
            text.startsWith('Processing...') ||
            text.startsWith('Error:')
        ) {
            alert(
                'Nothing to copy yet. Please scrape a question first.'
            );
            return;
        }

        copyTextToClipboard(text)
            .then(() => {
                const originalText =
                    copyButton.textContent;

                copyButton.textContent = 'Copied!';
                copyButton.style.backgroundColor =
                    '#28a745';

                setTimeout(() => {
                    copyButton.textContent =
                        originalText;

                    copyButton.style.backgroundColor =
                        '#28a745';
                }, 2000);
            })
            .catch((error) => {
                alert(
                    'Failed to copy text. See the browser console for details.'
                );

                console.error(
                    'Copy failed:',
                    error
                );
            });
    }

    // ============================================================
    // INITIALIZATION / CROSS-PAGE RESUME
    // ============================================================

    function registerMenuCommands() {
        GM_registerMenuCommand(
            '🤖 Auto-Scrape All Pages',
            beginAutoScrape
        );

        GM_registerMenuCommand(
            '⛔ Stop Auto-Scrape',
            cancelAutoScrape
        );

        GM_registerMenuCommand(
            '📋 Copy Last Auto-Scrape Result',
            copyLastAutoResult
        );

        GM_registerMenuCommand(
            '🗑 Clear Last Auto-Scrape Result',
            clearStoredAutoResult
        );

        GM_registerMenuCommand(
            'Select Image Hosting Service',
            selectImageHostService
        );

        GM_registerMenuCommand(
            'Set sm.ms API Key',
            setSmmsApiKey
        );

        GM_registerMenuCommand(
            'Set ImgBB API Key',
            setImgbbApiKey
        );

        GM_registerMenuCommand(
            `Toggle Scrape Quiz Summary — currently ${
                SCRAPE_SUMMARY ? 'ON' : 'OFF'
            }`,
            toggleScrapeSummary
        );
    }

    function resumeAutoScrapeIfNeeded() {
        if (!isAutoScrapeActive()) {
            return;
        }

        const isAttemptPage =
            window.location.pathname.includes(
                '/mod/quiz/attempt.php'
            );

        if (isAttemptPage) {
            showAutoScrapeUI();

            const storedCount =
                Number(
                    GM_getValue(
                        AUTO_KEYS.COUNT,
                        0
                    )
                );

            const storedPages =
                Number(
                    GM_getValue(
                        AUTO_KEYS.PAGES,
                        0
                    )
                );

            setStatus(
                `Resuming auto-scrape after page reload — ${storedCount} question(s), ${storedPages} page(s) saved.`
            );

            /*
             * Moodle 部分组件在 DOMContentLoaded 后仍会初始化，
             * 延迟一点再开始，避免按钮或题目尚未准备好。
             */
            setTimeout(() => {
                autoStepRunning = false;
                autoScrapeStep();
            }, 800);

            return;
        }

        /*
         * 如果运行期间被送到了 summary.php，
         * 说明可能时间到、手动离开或 Moodle 改变了导航流程。
         * 这里保留已抓取的数据并正常结束。
         */
        finishAutoScrape(
            'The browser left the quiz attempt page. Existing scraped data was preserved.'
        );
    }

    function init() {
        addStyles();
        createPanel();
        registerMenuCommands();
        resumeAutoScrapeIfNeeded();
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            init,
            { once: true }
        );
    } else {
        init();
    }
})();
