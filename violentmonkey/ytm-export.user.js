// ==UserScript==
// @name         YouTube Music Playlist Exporter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a collapsible floating panel to YouTube Music playlist pages to export the full song list as a CSV or JSON file.
// @author       Gemini And Me
// @match        *://music.youtube.com/*
// @grant        GM_addStyle
// @license      MIT
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ytm-export.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ytm-export.user.js
// ==/UserScript==

(function() {
    'usea strict';

    // --- Configuration ---
    const PREFIX = 'ytm-exporter';
    const CONTAINER_ID = `${PREFIX}-container`;
    const HEADER_ID = `${PREFIX}-header`;
    const BODY_ID = `${PREFIX}-body`;
    const TOGGLE_BTN_ID = `${PREFIX}-toggle-btn`;
    const STATUS_ID = `${PREFIX}-status`;
    const EXPORT_BTN_ID = `${PREFIX}-btn`;

    // --- Selectors for YouTube Music ---
    const PLAYLIST_SELECTOR = 'ytmusic-playlist-shelf-renderer';
    const SONG_ROW_SELECTOR = 'ytmusic-responsive-list-item-renderer';
    const LOADING_SPINNER_SELECTOR = 'ytmusic-continuation-item-renderer:not([hidden])';

    /**
     * Adds the necessary CSS styles for the UI panel.
     */
    function addStyles() {
        GM_addStyle(`
            #${CONTAINER_ID} {
                position: fixed;
                bottom: 25px;
                right: 25px;
                z-index: 9999;
                background: rgba(15, 15, 15, 0.75);
                backdrop-filter: blur(16px) saturate(180%);
                -webkit-backdrop-filter: blur(16px) saturate(180%);
                color: #f1f1f1;
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 10px;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
                font-family: 'Roboto', 'Arial', sans-serif;
                display: none; /* Hidden by default */
                flex-direction: column;
                min-width: 260px;
                transition: bottom 0.3s ease;
            }
            #${CONTAINER_ID} * {
                color: #f1f1f1;
            }
            #${HEADER_ID} {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 15px;
                cursor: pointer;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                transition: background-color 0.2s;
            }
            #${HEADER_ID}:hover {
                background-color: rgba(255, 255, 255, 0.05);
            }
            #${HEADER_ID} h3 {
                margin: 0;
                padding: 0;
                font-size: 16px;
                font-weight: 500;
            }
            #${TOGGLE_BTN_ID} svg {
                width: 20px;
                height: 20px;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform-origin: center;
            }
            #${BODY_ID} {
                display: flex;
                flex-direction: column;
                gap: 14px;
                padding: 15px;
                max-height: 500px; /* For transition */
                opacity: 1;
                overflow: hidden;
                transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                            opacity 0.3s ease,
                            padding 0.3s ease,
                            margin 0.3s ease;
            }
            /* Collapsed State */
            #${CONTAINER_ID}.collapsed #${BODY_ID} {
                max-height: 0;
                opacity: 0;
                padding-top: 0;
                padding-bottom: 0;
                margin-top: 0;
            }
            #${CONTAINER_ID}.collapsed #${TOGGLE_BTN_ID} svg {
                transform: rotate(-90deg);
            }
            #${CONTAINER_ID} .${PREFIX}-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 14px;
            }
            #${CONTAINER_ID} .${PREFIX}-row label {
                display: flex;
                align-items: center;
                cursor: pointer;
                gap: 8px;
            }
            #${CONTAINER_ID} input[type="radio"], #${CONTAINER_ID} input[type="checkbox"] {
                accent-color: #ff0000;
                cursor: pointer;
                width: 16px;
                height: 16px;
            }
            #${EXPORT_BTN_ID} {
                background-color: #ff0000;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px;
                font-size: 15px;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.3s, transform 0.2s;
                margin-top: 5px;
            }
            #${EXPORT_BTN_ID}:hover:not(:disabled) {
                background-color: #e60000;
                transform: scale(1.03);
            }
            #${EXPORT_BTN_ID}:disabled {
                background-color: #555;
                cursor: not-allowed;
                transform: scale(1);
            }
            #${STATUS_ID} {
                font-size: 13px;
                text-align: center;
                min-height: 18px;
                color: #ccc;
                font-style: italic;
            }
            .${PREFIX}-select {
                background-color: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                color: #f1f1f1;
                padding: 6px 8px;
                font-size: 14px;
                cursor: pointer;
                outline: none;
                transition: background-color 0.2s, border-color 0.2s;
            }
            .${PREFIX}-select:hover {
                background-color: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }
            .${PREFIX}-select:focus {
                background-color: rgba(255, 255, 255, 0.2);
                border-color: #ff0000;
            }
            .${PREFIX}-select option {
                background-color: #2a2a2a;
                color: #f1f1f1;
            }
        `);
    }

    /**
     * Creates and injects the main control panel into the page.
     */
    function createControls() {
        if (document.getElementById(CONTAINER_ID)) return;

        const container = document.createElement('div');
        container.id = CONTAINER_ID;

        // Chevron icon for the collapse button
        const toggleIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>`;

        container.innerHTML = `
            <div id="${HEADER_ID}">
                <h3>Playlist Exporter</h3>
                <span id="${TOGGLE_BTN_ID}">${toggleIcon}</span>
            </div>
            <div id="${BODY_ID}">
                <div id="${STATUS_ID}">Ready</div>
                <div class="${PREFIX}-row">
                    <label for="${PREFIX}-auto-scroll-toggle">
                        <input type="checkbox" id="${PREFIX}-auto-scroll-toggle" checked>
                        <span>Auto-scroll to load all</span>
                    </label>
                </div>
                <div class="${PREFIX}-row">
                    <span>Format:</span>
                    <select id="${PREFIX}-format-select" class="${PREFIX}-select">
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                    </select>
                </div>
                <button id="${EXPORT_BTN_ID}">Export</button>
            </div>
        `;

        document.body.appendChild(container);

        // --- Event Listeners ---
        document.getElementById(EXPORT_BTN_ID).addEventListener('click', handleExport);
        document.getElementById(HEADER_ID).addEventListener('click', () => {
            container.classList.toggle('collapsed');
        });
    }

    /**
     * Handles the main export process when the button is clicked.
     */
    async function handleExport() {
        const exportButton = document.getElementById(EXPORT_BTN_ID);
        const statusEl = document.getElementById(STATUS_ID);
        const autoScroll = document.getElementById(`${PREFIX}-auto-scroll-toggle`).checked;
        const format = document.getElementById(`${PREFIX}-format-select`).value;

        exportButton.disabled = true;

        try {
            if (autoScroll) {
                await scrollToBottom(statusEl);
            }

            statusEl.textContent = 'Extracting song data...';
            await new Promise(r => setTimeout(r, 100)); // Short delay for UI update

            const songData = extractSongData();

            if (!songData.length) {
                alert('No songs found on the current page.');
                throw new Error('No songs found.');
            }

            const playlistTitleElem = document.querySelector('ytmusic-detail-header-renderer yt-formatted-string.title');
            const playlistTitle = playlistTitleElem ? playlistTitleElem.textContent.trim() : 'playlist';
            const filename = `${playlistTitle.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')}.${format}`;

            statusEl.textContent = `Generating ${format.toUpperCase()} file...`;
            await new Promise(r => setTimeout(r, 100)); // Short delay for UI update

            if (format === 'json') {
                const jsonContent = JSON.stringify(songData, null, 2);
                triggerDownload(jsonContent, filename, 'application/json;charset=utf-8;');
            } else {
                const csvHeader = ['Title', 'Artist', 'Album', 'Duration'];
                const csvRows = songData.map(song => [song.title, song.artist, song.album, song.duration]);
                const csvContent = convertToCSV([csvHeader, ...csvRows]);
                triggerDownload('\uFEFF' + csvContent, filename, 'text/csv;charset=utf-8;');
            }

            statusEl.textContent = 'Export successful!';

        } catch (error) {
            console.error('Export failed:', error);
            statusEl.textContent = 'Export failed. Check console.';
        } finally {
            setTimeout(() => {
                exportButton.disabled = false;
                statusEl.textContent = 'Ready';
            }, 3000);
        }
    }

    /**
     * Scrolls the page to the bottom to load all playlist items.
     * @param {HTMLElement} statusEl - The element to display status updates.
     */
    function scrollToBottom(statusEl) {
        return new Promise((resolve, reject) => {
            const scrollInterval = 200; // ms
            const timeout = 60000; // 60 seconds
            let lastHeight = 0;
            let consecutiveStops = 0;
            const stopThreshold = 5; // How many times height must be the same to stop

            statusEl.textContent = 'Scrolling to load all songs...';

            const scrollTimer = setInterval(() => {
                const spinner = document.querySelector(LOADING_SPINNER_SELECTOR);
                const currentHeight = document.documentElement.scrollHeight;
                window.scrollTo(0, currentHeight);

                if (!spinner || (currentHeight === lastHeight && ++consecutiveStops > stopThreshold)) {
                    clearInterval(scrollTimer);
                    clearTimeout(safetyTimeout);
                    const songCount = document.querySelectorAll(SONG_ROW_SELECTOR).length;
                    statusEl.textContent = `Scrolling complete. Found ${songCount} songs.`;
                    resolve();
                } else if (currentHeight !== lastHeight) {
                    lastHeight = currentHeight;
                    consecutiveStops = 0;
                }
            }, scrollInterval);

            const safetyTimeout = setTimeout(() => {
                clearInterval(scrollTimer);
                console.warn('Auto-scroll timed out after 60 seconds.');
                reject(new Error('Auto-scroll timed out.'));
            }, timeout);
        });
    }

    /**
     * Extracts song data from the DOM into an array of objects.
     * @returns {Array<Object>} An array of song objects.
     */
    function extractSongData() {
        const songRows = document.querySelectorAll(SONG_ROW_SELECTOR);
        const songs = [];

        songRows.forEach(row => {
            try {
                const title = row.querySelector('yt-formatted-string.title')?.title;
                const flexColumns = row.querySelectorAll('.secondary-flex-columns yt-formatted-string.flex-column');

                // Extract artist, album, and sometimes other info. The order can vary.
                const metadata = Array.from(flexColumns).map(el => el?.title || '');
                const artist = metadata[0] || '';
                const album = metadata[1] || '';

                const duration = row.querySelector('.fixed-columns yt-formatted-string')?.textContent.trim();

                // Ensure it's a valid song row before adding (e.g., not a header or deleted video)
                if (title && duration && duration.includes(':')) {
                    songs.push({ title, artist, album, duration });
                }
            } catch (e) {
                console.warn('Could not parse a row:', row, e);
            }
        });

        return songs;
    }

    /**
     * Converts a 2D array into a CSV-formatted string.
     * @param {Array<Array<string>>} data - 2D array of data.
     * @returns {string} CSV formatted string.
     */
    function convertToCSV(data) {
        return data.map(row =>
            row.map(field => {
                const str = (field === null || field === undefined) ? '' : String(field);
                const escaped = str.replace(/"/g, '""');
                return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
            }).join(',')
        ).join('\n');
    }

    /**
     * Triggers a file download in the browser.
     * @param {string} content - The content of the file.
     * @param {string} filename - The desired name of the file.
     * @param {string} mimeType - The MIME type of the file.
     */
    function triggerDownload(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Uses MutationObserver to show/hide the control panel based on the page content.
     */
    function observePageChanges() {
        const observer = new MutationObserver(() => {
            const panel = document.getElementById(CONTAINER_ID);
            if (!panel) return;

            const isOnPlaylistPage = !!document.querySelector(PLAYLIST_SELECTOR);
            panel.style.display = isOnPlaylistPage ? 'flex' : 'none';
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // --- Script Initialization ---
    addStyles();
    createControls();
    observePageChanges();

})();