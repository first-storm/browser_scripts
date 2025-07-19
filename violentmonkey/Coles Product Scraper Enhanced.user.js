// ==UserScript==
// @name         Coles Product Scraper Enhanced
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Robust Coles scraper with SVG icons, Abort, Retry, and a native-looking UI.
// @author       Gemini
// @match        https://www.coles.com.au/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // --- SVG ICONS ---
    const icons = {
        scrapePage: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
        scrapeAll: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
        fetchDetails: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>`,
        stop: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`,
        copy: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        clear: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        tool: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`
    };

    // --- GLOBAL STATE ---
    let uiPanel, uiToggleButton, resultsArea, statusArea, progressBar, stopButton;
    let allProducts = [];
    let isExpanded = false;
    let currentPageType = 'unknown';
    let isOperationRunning = false;

    // --- SETTINGS STATE ---
    let settings = {
        minDelay: 800,
        maxDelay: 1500,
        maxRetries: 3,
        retryDelay: 2000,
        includeImageUrlOnCopy: true,
        includeProductUrlOnCopy: true,
    };

    // --- UTILITY FUNCTIONS ---
    const sleepRandom = () => {
        const delay = Math.random() * (settings.maxDelay - settings.minDelay) + settings.minDelay;
        return new Promise(resolve => setTimeout(resolve, delay));
    };
    const sleepFixed = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function parseProductImageUrl(imgTag) {
        if (!imgTag || !imgTag.src) return null;
        try {
            const url = new URL(imgTag.src);
            const originalUrlEncoded = url.searchParams.get('url');
            if (originalUrlEncoded) return decodeURIComponent(originalUrlEncoded);
        } catch (e) {
            const srcset = imgTag.getAttribute('srcset');
            if (srcset) {
                const firstUrlPart = srcset.split(' ')[0];
                if (firstUrlPart && firstUrlPart.includes('_next/image')) {
                    try {
                        const url = new URL(firstUrlPart, window.location.origin);
                        const originalUrlEncoded = url.searchParams.get('url');
                        if (originalUrlEncoded) return decodeURIComponent(originalUrlEncoded);
                    } catch (e2) { /* Ignore */ }
                }
            }
        }
        return imgTag.src;
    }

    // --- PAGE TYPE DETECTION ---
    function detectPageType() {
        if (window.location.pathname.includes('/search') || document.querySelector("section[data-testid='product-tile']")) {
            return 'product-list';
        }
        if (window.location.pathname.includes('/product/') && document.getElementById('__NEXT_DATA__')) {
            return 'product-detail';
        }
        return 'other';
    }

    // --- SCRAPING LOGIC (Unchanged) ---
    function scrapeSearchPage(doc = document) {
        const productsOnPage = [];
        doc.querySelectorAll("section[data-testid='product-tile']").forEach(tile => {
            try {
                const linkTag = tile.querySelector("a.product__link") || tile.querySelector('.product__message-title_area a.product__link');
                productsOnPage.push({
                    name: tile.querySelector("h2.product__title")?.textContent.trim() || "N/A",
                    product_url: (linkTag && linkTag.href) ? new URL(linkTag.href, window.location.origin).href : "N/A",
                    price: tile.querySelector("span.price__value")?.textContent.trim() || "N/A",
                    unit_price: tile.querySelector("div.price__calculation_method")?.textContent.trim() || "N/A",
                    image_url: parseProductImageUrl(tile.querySelector("img[data-testid='product-image']"))
                });
            } catch (e) { console.error("Could not parse a product tile:", e); }
        });
        return productsOnPage;
    }

    function scrapeProductDetailPage(doc = document) {
        const productData = {};
        const scriptTag = doc.getElementById('__NEXT_DATA__');
        if (!scriptTag) {
            productData.detail_error = "__NEXT_DATA__ script tag not found.";
            return productData;
        }
        try {
            const productInfo = JSON.parse(scriptTag.textContent)?.props?.pageProps?.product;
            if (productInfo) {
                const name = productInfo.name || '', size = productInfo.size || '';
                productData.detailed_name = `${name} | ${size}`.replace(/^ \| | \| $/g, '');
                productData.brand = productInfo.brand || 'N/A';
                const pricing = productInfo.pricing || {};
                productData.detailed_current_price = pricing.now ? `$${pricing.now.toFixed(2)}` : 'N/A';
                productData.detailed_original_price = pricing.was ? `$${pricing.was.toFixed(2)}` : 'None';
                productData.savings = pricing.saveStatement || 'None';
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = productInfo.longDescription || '';
                productData.description = tempDiv.textContent || tempDiv.innerText || 'N/A';
                (productInfo.additionalInfo || []).forEach(item => {
                    if (item?.title && item.description) productData[item.title.toLowerCase().replace(/\s+/g, '_')] = item.description;
                });
                productData.barcode_gtin = productInfo.gtin || 'N/A';
                const ratingContainer = doc.querySelector('div[data-bv-show="rating_summary"][data-bv-ready="true"]');
                if (ratingContainer) {
                    productData.rating = ratingContainer.querySelector('.bv_avgRating_component_container')?.textContent.trim() + ' / 5' || 'N/A';
                    productData.review_count = ratingContainer.querySelector('.bv_numReviews_text')?.textContent.trim().replace(/[()]/g, '') || 'N/A';
                } else {
                    productData.rating = 'N/A'; productData.review_count = 'N/A';
                }
            } else { productData.detail_error = "Product info not found in __NEXT_DATA__."; }
        } catch (e) { console.error("Error parsing product detail JSON:", e); productData.detail_error = `Error parsing JSON: ${e.message}`; }
        return productData;
    }

    // --- UI & STATE MANAGEMENT ---
    function createUI() {
        uiToggleButton = document.createElement('div');
        uiToggleButton.id = 'coles-scraper-toggle';
        uiToggleButton.innerHTML = icons.tool;
        uiToggleButton.title = 'Coles Scraper';
        document.body.appendChild(uiToggleButton);

        uiPanel = document.createElement('div');
        uiPanel.id = 'coles-scraper-panel';
        uiPanel.style.display = 'none';
        uiPanel.innerHTML = `
            <div id="coles-scraper-header">
                <span>Coles Scraper v4.2</span>
                <button id="close-panel-btn" title="Close">✕</button>
            </div>
            <div id="coles-scraper-content">
                <div id="action-buttons" class="button-group"></div>
                <div id="coles-scraper-status-container">
                    <div id="coles-scraper-status"></div>
                    <progress id="scraper-progress-bar" value="0" max="100" style="display: none;"></progress>
                </div>
                <pre id="coles-scraper-results">Navigate to a product page to begin.</pre>
                <div class="button-group export-group">
                    <button id="export-json-btn">${icons.copy} Copy JSON</button>
                    <button id="export-csv-btn">${icons.copy} Copy CSV</button>
                    <button id="clear-btn">${icons.clear} Clear</button>
                </div>
                <details id="scraper-settings">
                    <summary>Advanced Settings</summary>
                    <div class="settings-grid">
                        <label for="min-delay" title="Minimum random delay between fetches">Min Delay (ms)</label>
                        <input type="number" id="min-delay" value="${settings.minDelay}">
                        <label for="max-delay" title="Maximum random delay between fetches">Max Delay (ms)</label>
                        <input type="number" id="max-delay" value="${settings.maxDelay}">
                        <label for="max-retries" title="How many times to retry a failed network request">Max Retries</label>
                        <input type="number" id="max-retries" value="${settings.maxRetries}">
                        <label for="retry-delay" title="How long to wait before retrying a failed request">Retry Wait (ms)</label>
                        <input type="number" id="retry-delay" value="${settings.retryDelay}">
                    </div>
                    <div class="settings-grid">
                        <label for="include-img-url">Include Image URL</label>
                        <input type="checkbox" id="include-img-url" ${settings.includeImageUrlOnCopy ? 'checked' : ''}>
                        <label for="include-prod-url">Include Product URL</label>
                        <input type="checkbox" id="include-prod-url" ${settings.includeProductUrlOnCopy ? 'checked' : ''}>
                    </div>
                </details>
            </div>
        `;
        document.body.appendChild(uiPanel);

        // Assign elements
        resultsArea = document.getElementById('coles-scraper-results');
        statusArea = document.getElementById('coles-scraper-status');
        progressBar = document.getElementById('scraper-progress-bar');

        // Add event listeners
        uiToggleButton.addEventListener('click', togglePanel);
        document.getElementById('close-panel-btn').addEventListener('click', togglePanel);
        document.getElementById('export-json-btn').addEventListener('click', exportJSON);
        document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
        document.getElementById('clear-btn').addEventListener('click', clearResults);

        // Settings listeners
        document.getElementById('min-delay').addEventListener('input', e => { settings.minDelay = parseInt(e.target.value, 10) || 0; });
        document.getElementById('max-delay').addEventListener('input', e => { settings.maxDelay = parseInt(e.target.value, 10) || 0; });
        document.getElementById('max-retries').addEventListener('input', e => { settings.maxRetries = parseInt(e.target.value, 10) || 0; });
        document.getElementById('retry-delay').addEventListener('input', e => { settings.retryDelay = parseInt(e.target.value, 10) || 0; });
        document.getElementById('include-img-url').addEventListener('change', e => { settings.includeImageUrlOnCopy = e.target.checked; });
        document.getElementById('include-prod-url').addEventListener('change', e => { settings.includeProductUrlOnCopy = e.target.checked; });

        makeDraggable(uiPanel, document.getElementById('coles-scraper-header'));
        updateActionButtons();
    }

    function togglePanel() {
        isExpanded = !isExpanded;
        uiPanel.style.display = isExpanded ? 'flex' : 'none';
        uiToggleButton.style.display = isExpanded ? 'none' : 'flex';
    }

    function toggleOperationControls(isRunning) {
        document.querySelectorAll('#action-buttons button, .export-group button').forEach(btn => {
            if (btn.id !== 'stop-btn') btn.disabled = isRunning;
        });
        document.getElementById('scraper-settings').style.pointerEvents = isRunning ? 'none' : 'auto';
        document.getElementById('scraper-settings').style.opacity = isRunning ? 0.6 : 1;
        if (stopButton) stopButton.style.display = isRunning ? 'inline-flex' : 'none';
        if (stopButton) stopButton.disabled = !isRunning;
    }

    function updateActionButtons() {
        currentPageType = detectPageType();
        const actionsContainer = document.getElementById('action-buttons');
        if (!actionsContainer) return;

        actionsContainer.innerHTML = '';
        if (currentPageType === 'product-list') {
            actionsContainer.innerHTML = `
                <button id="scrape-current-btn">${icons.scrapePage} Scrape Page</button>
                <button id="scrape-all-btn">${icons.scrapeAll} Scrape All</button>
                <button id="fetch-details-btn" ${allProducts.length === 0 ? 'disabled' : ''}>${icons.fetchDetails} Fetch Details</button>
                <button id="stop-btn" class="stop-button" style="display: none;">${icons.stop} Stop</button>
            `;
            document.getElementById('scrape-current-btn')?.addEventListener('click', handleScrapeCurrentPage);
            document.getElementById('scrape-all-btn')?.addEventListener('click', handleScrapeAllPages);
            document.getElementById('fetch-details-btn')?.addEventListener('click', handleFetchAllDetails);
        } else if (currentPageType === 'product-detail') {
            actionsContainer.innerHTML = `<button id="scrape-detail-btn">${icons.scrapePage} Scrape Product</button>`;
            document.getElementById('scrape-detail-btn')?.addEventListener('click', handleScrapeDetailPage);
        } else {
            actionsContainer.innerHTML = `<div class="info-message">Navigate to a Coles product or search page to use the scraper.</div>`;
        }

        stopButton = document.getElementById('stop-btn');
        if (stopButton) stopButton.addEventListener('click', handleStopOperation);
        updateResultsDisplay();
    }

    function updateResultsDisplay() {
        if (!resultsArea || !statusArea) return;
        if (allProducts.length > 0) {
            resultsArea.textContent = JSON.stringify(allProducts, null, 2);
            statusArea.textContent = `Displaying ${allProducts.length} products.`;
            const detailsBtn = document.getElementById('fetch-details-btn');
            if (detailsBtn && currentPageType === 'product-list') detailsBtn.disabled = false;
        } else {
            resultsArea.textContent = (currentPageType === 'product-list' || currentPageType === 'product-detail') ? 'Click a button to start scraping.' : 'Navigate to a Coles product page or search results.';
            statusArea.textContent = '';
            const detailsBtn = document.getElementById('fetch-details-btn');
            if (detailsBtn) detailsBtn.disabled = true;
        }
    }

    // --- BUTTON HANDLERS ---
    function handleStopOperation() {
        if (isOperationRunning) {
            isOperationRunning = false; // Set flag to stop loops
            statusArea.textContent = "Stopping operation...";
            if (stopButton) stopButton.disabled = true;
        }
    }

    async function handleScrapeCurrentPage() {
        statusArea.textContent = 'Scraping current page...';
        progressBar.style.display = 'none';
        allProducts = scrapeSearchPage();
        updateResultsDisplay();
        statusArea.textContent = `Scraped ${allProducts.length} products from this page.`;
    }

    async function handleScrapeDetailPage() {
        statusArea.textContent = 'Scraping product details...';
        progressBar.style.display = 'none';
        allProducts = [scrapeProductDetailPage()];
        updateResultsDisplay();
        statusArea.textContent = 'Scraped product details.';
    }

    async function runFetchWithRetries(url, originalStatus) {
        let error = null;
        for (let i = 0; i <= settings.maxRetries; i++) {
            if (!isOperationRunning) return { error: new Error("Operation stopped") };
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return { doc: new DOMParser().parseFromString(await response.text(), 'text/html') };
            } catch (e) {
                error = e;
                if (i < settings.maxRetries) {
                    statusArea.textContent = `Fetch failed. Retrying... (${i + 1}/${settings.maxRetries})`;
                    await sleepFixed(settings.retryDelay);
                    statusArea.textContent = originalStatus; // Restore original status before next try
                }
            }
        }
        return { error };
    }

    async function handleScrapeAllPages() {
        if (isOperationRunning) return;
        isOperationRunning = true;
        allProducts = [];
        updateResultsDisplay();
        toggleOperationControls(true);

        try {
            const paginationTag = document.querySelector("div[data-testid='pagination-info']");
            let totalPages = 1;
            if (paginationTag) {
                const ofMatch = paginationTag.textContent.match(/of ([\d,]+)/);
                const rangeMatch = paginationTag.textContent.match(/(\d+)\s*-\s*(\d+)/);
                if (ofMatch && rangeMatch) {
                    const totalResults = parseInt(ofMatch[1].replace(/,/g, ''), 10);
                    const resultsOnPage = parseInt(rangeMatch[2], 10) - parseInt(rangeMatch[1], 10) + 1;
                    if (resultsOnPage > 0) totalPages = Math.ceil(totalResults / resultsOnPage);
                }
            }
            statusArea.textContent = `Found ${totalPages} pages. Starting scrape...`;
            progressBar.style.display = 'block';
            progressBar.value = 0;
            progressBar.max = totalPages;

            allProducts.push(...scrapeSearchPage());
            progressBar.value = 1;
            updateResultsDisplay();

            if (totalPages > 1) {
                const baseUrl = new URL(window.location.href);
                for (let i = 2; i <= totalPages; i++) {
                    if (!isOperationRunning) break;
                    const originalStatus = `Fetching page ${i} of ${totalPages}...`;
                    statusArea.textContent = originalStatus;
                    baseUrl.searchParams.set('page', i);

                    const { doc, error } = await runFetchWithRetries(baseUrl.href, originalStatus);

                    if (error) {
                        statusArea.textContent = `Error fetching page ${i}: ${error.message}. Stopping.`;
                        console.error(error);
                        break;
                    }

                    const newProducts = scrapeSearchPage(doc);
                    if (newProducts.length === 0) { statusArea.textContent = `No products on page ${i}. Stopping.`; break; }
                    allProducts.push(...newProducts);
                    progressBar.value = i;
                    updateResultsDisplay();
                    if (isOperationRunning) await sleepRandom();
                }
            }
            statusArea.textContent = isOperationRunning ? `Finished scraping. Found ${allProducts.length} products.` : 'Scraping stopped by user.';
        } finally {
            isOperationRunning = false;
            toggleOperationControls(false);
            progressBar.style.display = 'none';
        }
    }

    async function handleFetchAllDetails() {
        if (isOperationRunning || allProducts.length === 0) return;
        isOperationRunning = true;
        toggleOperationControls(true);
        const total = allProducts.length;
        statusArea.textContent = `Starting to fetch details for ${total} products...`;
        progressBar.style.display = 'block';
        progressBar.value = 0;
        progressBar.max = total;

        try {
            for (let i = 0; i < total; i++) {
                if (!isOperationRunning) break;
                const product = allProducts[i];
                progressBar.value = i + 1;

                if (!product.product_url || product.product_url === 'N/A') {
                    product.detail_error = "No URL to fetch.";
                    continue;
                }
                const originalStatus = `(${i + 1}/${total}) Fetching: ${product.name.substring(0, 30)}...`;
                statusArea.textContent = originalStatus;

                const { doc, error } = await runFetchWithRetries(product.product_url, originalStatus);

                if (error) {
                    product.detail_error = `Fetch failed after retries: ${error.message}`;
                } else {
                    Object.assign(product, scrapeProductDetailPage(doc));
                }
                updateResultsDisplay();
                if (isOperationRunning && i < total - 1) await sleepRandom();
            }
            statusArea.textContent = isOperationRunning ? 'Finished fetching all details.' : 'Fetching stopped by user.';
        } finally {
            isOperationRunning = false;
            toggleOperationControls(false);
            progressBar.style.display = 'none';
        }
    }

    // --- EXPORT FUNCTIONS & OTHERS ---
    function prepareDataForExport() {
        return allProducts.map(p => {
            const newProd = { ...p };
            if (!settings.includeImageUrlOnCopy) delete newProd.image_url;
            if (!settings.includeProductUrlOnCopy) delete newProd.product_url;
            return newProd;
        });
    }

    function exportJSON() {
        if (allProducts.length === 0) return alert('No data to copy.');
        const dataToCopy = prepareDataForExport();
        GM_setClipboard(JSON.stringify(dataToCopy, null, 2));
        alert(`${dataToCopy.length} products copied to clipboard as JSON.`);
    }

    function exportCSV() {
        if (allProducts.length === 0) return alert('No data to copy.');
        const dataToCopy = prepareDataForExport();
        const headers = Array.from(new Set(dataToCopy.flatMap(Object.keys)));
        let csvContent = headers.join(',') + '\n';
        dataToCopy.forEach(product => {
            csvContent += headers.map(header => {
                let value = String(product[header] || '').replace(/"/g, '""');
                return (value.includes(',') || value.includes('\n')) ? `"${value}"` : value;
            }).join(',') + '\n';
        });
        GM_setClipboard(csvContent);
        alert(`${dataToCopy.length} products copied to clipboard as CSV.`);
    }

    function clearResults() {
        if (isOperationRunning) return;
        allProducts = [];
        progressBar.style.display = 'none';
        updateResultsDisplay();
    }

    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = e => {
            e.preventDefault();
            pos3 = e.clientX; pos4 = e.clientY;
            document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
            document.onmousemove = e => {
                e.preventDefault();
                pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
                pos3 = e.clientX; pos4 = e.clientY;
                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
            };
        };
    }

    function setupPageChangeMonitoring() {
        let currentUrl = window.location.href;
        const observer = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                setTimeout(() => { if (!isOperationRunning) updateActionButtons(); }, 1500);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // --- CSS STYLES (Revamped for Coles Theme with SVG Icons) ---
    GM_addStyle(`
        :root {
            --theme-red: #E4002B;
            --theme-red-dark: #c30024;
            --theme-text-primary: #212121;
            --theme-text-secondary: #585858;
            --theme-border-light: #e0e0e0;
            --theme-background-light: #f7f7f7;
            --theme-gray-medium: #8f8f8f;
            --theme-blue-stop: #007bff; /* Kept distinct for critical action */
        }
        #coles-scraper-toggle {
            position: fixed; top: 100px; right: 0; transform: translateY(0);
            width: 48px; height: 48px;
            background-color: var(--theme-red);
            color: white; border-radius: 8px 0 0 8px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            box-shadow: -2px 2px 8px rgba(0,0,0,0.2);
            z-index: 99999; transition: all 0.2s ease; user-select: none;
        }
        #coles-scraper-toggle:hover {
            background-color: var(--theme-red-dark);
            width: 52px;
        }
        #coles-scraper-toggle svg { width: 28px; height: 28px; }
        #coles-scraper-panel {
            position: fixed; top: 20px; right: 20px;
            width: 520px; max-height: 90vh;
            background-color: #fff;
            border: 1px solid var(--theme-border-light);
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            z-index: 99999; display: flex; flex-direction: column;
            font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #coles-scraper-header {
            padding: 12px 18px;
            cursor: move;
            background-color: #fff;
            color: var(--theme-text-primary);
            font-weight: 600; font-size: 16px;
            border-bottom: 1px solid var(--theme-border-light);
            border-top-left-radius: 8px; border-top-right-radius: 8px;
            display: flex; justify-content: space-between; align-items: center;
        }
        #close-panel-btn {
            background: none; border: none;
            color: var(--theme-text-secondary);
            font-size: 24px; cursor: pointer;
            padding: 0 5px; line-height: 1;
            opacity: 0.8; transition: all 0.2s;
        }
        #close-panel-btn:hover {
            opacity: 1;
        }
        #coles-scraper-content {
            padding: 18px; overflow-y: auto;
            display: flex; flex-direction: column; gap: 15px;
        }
        #coles-scraper-results {
            width: 100%; height: 350px;
            background-color: #fcfcfc;
            border: 1px solid var(--theme-border-light);
            border-radius: 6px; padding: 10px; box-sizing: border-box;
            white-space: pre-wrap; word-break: break-all;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 12px; overflow-y: auto; line-height: 1.5;
            color: #333;
        }
        #coles-scraper-status-container { display: flex; flex-direction: column; gap: 8px; }
        #coles-scraper-status { font-style: italic; color: var(--theme-text-secondary); min-height: 1.2em; font-size: 14px; }
        #scraper-progress-bar { width: 100%; height: 6px; border-radius: 3px; border: none; }
        #scraper-progress-bar::-webkit-progress-bar { background-color: #f0f0f0; border-radius: 3px; }
        #scraper-progress-bar::-webkit-progress-value { background-color: var(--theme-red); border-radius: 3px; transition: width 0.3s ease; }
        .button-group { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .button-group.export-group { border-top: 1px solid var(--theme-border-light); padding-top: 15px; }

        /* Base Button Style */
        .button-group button {
            display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            padding: 10px 18px;
            border: 1px solid transparent;
            border-radius: 24px; /* Match Coles "Add" button */
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 14px; font-weight: 700;
            line-height: 1;
        }
        .button-group button:hover:not(:disabled) {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .button-group button:disabled {
            background-color: #e0e0e0 !important;
            color: #a0a0a0 !important;
            cursor: not-allowed;
            box-shadow: none;
            border-color: #e0e0e0 !important;
        }
        .button-group button svg {
            width: 16px; height: 16px;
            stroke-width: 2.5;
            stroke: currentColor; /* Icon color matches text color */
        }

        /* Primary Buttons (Solid Red) */
        #scrape-all-btn, #fetch-details-btn { background-color: var(--theme-red); color: white; }
        #scrape-all-btn:hover:not(:disabled), #fetch-details-btn:hover:not(:disabled) { background-color: var(--theme-red-dark); }

        /* Secondary Buttons (Outlined) */
        #scrape-current-btn, #scrape-detail-btn, #export-json-btn, #export-csv-btn {
            background-color: #fff; color: var(--theme-red); border: 1px solid var(--theme-red);
        }
        #scrape-current-btn:hover:not(:disabled), #scrape-detail-btn:hover:not(:disabled),
        #export-json-btn:hover:not(:disabled), #export-csv-btn:hover:not(:disabled) {
            background-color: var(--theme-red); color: #fff;
        }

        /* Utility & Stop Buttons */
        #clear-btn { background-color: var(--theme-text-secondary); color: white; border-color: var(--theme-text-secondary); }
        #clear-btn:hover:not(:disabled) { background-color: var(--theme-text-primary); border-color: var(--theme-text-primary); }
        .stop-button { background-color: var(--theme-blue-stop); color: white; border-color: var(--theme-blue-stop); }
        .stop-button:hover:not(:disabled) { background-color: #0069d9; border-color: #0069d9; }

        .info-message { width: 100%; color: #666; font-style: italic; text-align: center; padding: 20px; background-color: var(--theme-background-light); border-radius: 6px; box-sizing: border-box; }
        #scraper-settings { border: 1px solid var(--theme-border-light); border-radius: 6px; background-color: #fff; transition: opacity 0.3s; margin-top: 5px; }
        #scraper-settings summary { font-weight: 600; cursor: pointer; padding: 12px 15px; color: var(--theme-text-primary); border-radius: 6px; }
        #scraper-settings summary:hover { background-color: var(--theme-background-light); }
        #scraper-settings > div { padding: 15px; }
        .settings-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px 15px; align-items: center; font-size: 14px; }
        .settings-grid:not(:last-child) { border-bottom: 1px solid #f0f0f0; padding-bottom: 15px; margin-bottom: 15px; }
        .settings-grid label { justify-self: start; color: var(--theme-text-secondary); }
        .settings-grid input[type="number"] { width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
        .settings-grid input[type="number"]:focus { border-color: var(--theme-red); outline: none; box-shadow: 0 0 0 2px rgba(228, 0, 43, 0.2); }
        .settings-grid input[type="checkbox"] { justify-self: start; width: 20px; height: 20px; accent-color: var(--theme-red); }
    `);

    // --- INITIALIZATION ---
    function initialize() {
        console.log('Coles Scraper: Initializing...');
        createUI();
        setupPageChangeMonitoring();
        console.log('Coles Scraper: Ready!');
    }

    if (document.readyState === 'complete') {
        initialize();
    } else {
        window.addEventListener('load', initialize);
    }
})();