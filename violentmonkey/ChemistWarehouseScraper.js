// ==UserScript==
// @name         Chemist Warehouse Scraper
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  A comprehensive CW tool with a tabbed UI. "Scrape All Pages" now simulates clicking the NEXT button for more reliable scraping on dynamic pages. UI updated to better match the site's style. "Scrape This Product" is now more robust.
// @author       Artificial Intelligence & Gemini
// @match        https://www.chemistwarehouse.com.au/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- SVG ICONS ---
    const icons = {
        scrapePage: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
        scrapeAll: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
        fetchDetails: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>`,
        trolley: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
        stop: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`,
        copy: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        clear: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        tool: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
        check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        expand: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
        collapse: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`
    };

    // --- GLOBAL STATE ---
    let uiPanel, uiToggleButton;
    let scrapedProducts = [];
    let trolleyProducts = [];
    let isExpanded = false;
    let isOperationRunning = false;
    let activeTab = 'scraper';

    // --- SETTINGS STATE ---
    let settings = {
        minDelay: 1000,
        maxDelay: 2000,
        maxRetries: 3,
        retryDelay: 2000,
        includeProductUrlOnCopy: true,
    };

    // --- UTILITY FUNCTIONS ---
    const sleepRandom = () => {
        const delay = Math.random() * (settings.maxDelay - settings.minDelay) + settings.minDelay;
        return new Promise(resolve => setTimeout(resolve, delay));
    };
    const sleepFixed = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const waitForElement = (selector, timeout = 10000, container = document) => new Promise((resolve, reject) => {
        const intervalTime = 100; let elapsedTime = 0;
        const interval = setInterval(() => {
            const element = container.querySelector(selector);
            if (element) { clearInterval(interval); resolve(element); }
            else {
                elapsedTime += intervalTime;
                if (elapsedTime >= timeout) { clearInterval(interval); reject(new Error(`Element ${selector} not found within ${timeout}ms`)); }
            }
        }, intervalTime);
    });

    /**
     * Waits for the product grid to update after a page change.
     * It resolves when the content of the grid is observed to change.
     * @returns {Promise<void>}
     */
    function waitForProductGridUpdate() {
        return new Promise((resolve, reject) => {
            const grid = document.querySelector('ul[data-cy="product-grid"]');
            if (!grid) {
                return reject(new Error("Could not find product grid to observe."));
            }

            const timeout = setTimeout(() => {
                observer.disconnect();
                reject(new Error("Waiting for content update timed out (15s)."));
            }, 15000);

            const observer = new MutationObserver((mutationsList, obs) => {
                // We look for a change in child nodes, which indicates a re-render.
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                        clearTimeout(timeout);
                        obs.disconnect();
                        resolve();
                        return;
                    }
                }
            });

            observer.observe(grid, { childList: true });
        });
    }


    function stripHtml(html) {
        if (!html) return "";
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html.replace(/<br\s*\/?>/ig, '\n');
        return tmp.textContent || tmp.innerText || "";
    }

    // --- PAGE TYPE DETECTION ---
    function detectPageType() {
        const path = window.location.pathname;
        if (path.startsWith('/search') || path.startsWith('/shop-online')) return 'product-list';
        if (path.startsWith('/buy/')) return 'product-detail';
        return 'other';
    }

    // --- SCRAPING LOGIC ---
    function scrapeSearchPage(doc = document) {
        const productsOnPage = new Map();
        doc.querySelectorAll('ul[data-cy="product-grid"] > li a[href^="/buy/"]').forEach(linkTag => {
            try {
                const productUrl = new URL(linkTag.href, window.location.origin).href;
                if (productsOnPage.has(productUrl)) return;

                const tile = linkTag.closest('li');
                if (!tile) return;

                const priceEl = tile.querySelector('p[data-cy="dollar-string"]');
                const rrpEl = tile.querySelector('p.body-s.text-colour-subtitle-light');

                productsOnPage.set(productUrl, {
                    name: linkTag.textContent.trim() || "N/A",
                    product_url: productUrl,
                    price: priceEl?.textContent.trim() || 'N/A',
                    rrp_info: rrpEl?.textContent.trim() || 'N/A',
                });
            } catch (e) { console.error("Could not parse a product tile:", e, linkTag); }
        });
        return Array.from(productsOnPage.values());
    }

    function scrapeProductDetailPage(doc = document) {
        const productData = {};
        const scriptTag = doc.getElementById('__NEXT_DATA__');
        if (!scriptTag) return { detail_error: "__NEXT_DATA__ script tag not found." };
        try {
            const data = JSON.parse(scriptTag.textContent);
            const pp = data?.props?.pageProps || {};
            const productInfo = pp.product ?? pp.productPage ?? pp.mwebProductPage ?? null;
            if (!productInfo) return { detail_error: "Product object not found in __NEXT_DATA__." };

            const product   = productInfo.product ?? productInfo;
            const pricesObj = productInfo.prices?.[0]?.price ?? productInfo.price;

            if (product) {
                const variant = product.variants?.[0];
                productData.detailed_name = product.name || 'N/A';
                productData.brand = product.brand?.label || 'N/A';
                productData.description = stripHtml(product.description || '');

                if (pricesObj) {
                    productData.detailed_current_price = pricesObj.value?.amount ? `$${pricesObj.value.amount.toFixed(2)}` : 'N/A';
                    productData.detailed_original_price = pricesObj.rrp?.amount ? `$${pricesObj.rrp.amount.toFixed(2)}` : 'N/A';
                    if (pricesObj.value?.amount && pricesObj.rrp?.amount) {
                        const saved = pricesObj.rrp.amount - pricesObj.value.amount;
                        productData.savings = saved > 0 ? `Save $${saved.toFixed(2)}` : 'None';
                    }
                }

                if (variant?.attributes) {
                    const getAttr = (key) => variant.attributes.find(attr => attr.key === key)?.value;
                    productData.ingredients = stripHtml(getAttr('cwr-au-ingredients') || '');
                    productData.warnings = stripHtml(getAttr('cwr-au-warnings') || '');
                    productData.directions = stripHtml(getAttr('cwr-au-directions') || '');
                    productData.rating = getAttr('cwr-review-rating') ? `${getAttr('cwr-review-rating').toFixed(1)} / 5` : 'N/A';
                    productData.review_count = getAttr('cwr-review-rating-count') || 0;
                    productData.product_id = variant.sku || 'N/A';
                }
            } else { productData.detail_error = "Product info not found in __NEXT_DATA__."; }
        } catch (e) {
            console.error("Error parsing product detail JSON:", e);
            productData.detail_error = `Error parsing JSON: ${e.message}`;
        }
        return productData;
    }

    function scrapeTrolley() {
        const trolleyContainer = document.querySelector('div[role="dialog"][data-state="open"] ul[data-cy="cart-items"]');
        if (!trolleyContainer) return { error: 'Could not find the cart items list. Is the cart open?' };

        const productItems = trolleyContainer.querySelectorAll('li');
        if (productItems.length === 0) return { error: 'Cart is empty.' };

        const items = [];
        productItems.forEach(item => {
            const nameElement = item.querySelector('p.body-s');
            const quantityInput = item.querySelector('input[type="number"]');
            const priceElement = item.querySelector('div.headline-m p[data-cy="dollar-string"]');

            if (!nameElement || !quantityInput || !priceElement) return;

            const quantity = parseInt(quantityInput.value, 10);
            const itemPrice = parseFloat(priceElement.textContent.replace('$', ''));

            if (isNaN(quantity) || isNaN(itemPrice)) return;
            items.push({
                name: nameElement.textContent.trim(),
                product_url: 'N/A - Not available from cart',
                quantity: quantity,
                price: `Total: $${(itemPrice * quantity).toFixed(2)}`,
                itemPrice: itemPrice,
                itemTotal: itemPrice * quantity,
            });
        });

        if (items.length === 0) return { error: 'No valid products found to export.' };
        return { products: items };
    }

    // --- UI & STATE MANAGEMENT ---
    function renderProductList(container, products, type = 'scraper') {
        container.innerHTML = '';
        if (!products || products.length === 0) return;

        products.forEach((product, index) => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product-item-wrapper';
            const name = product.detailed_name || product.name || 'N/A';
            const price = product.detailed_current_price || product.price || 'N/A';
            const rrpInfo = product.rrp_info || ''; // Renamed from unitPrice to be clearer

            // In the scraper tab, show the RRP info. In the trolley tab, show quantity.
            let secondaryInfoHtml = '';
            if (type === 'scraper') {
                secondaryInfoHtml = `<span class="product-rrp-info">${rrpInfo}</span>`;
            } else if (type === 'trolley') {
                secondaryInfoHtml = `<p class="product-quantity">Quantity: <strong>${product.quantity}</strong></p>`;
            }

            productDiv.innerHTML = `
                <div class="product-item" data-product-index="${index}" data-tab-type="${type}">
                    <div class="product-item-details">
                        <p class="product-name" title="${name}">${name}</p>
                        <p class="product-price">${price} ${secondaryInfoHtml}</p>
                    </div>
                    <div class="product-item-actions">
                        <button class="product-action-btn product-expand-btn" title="Expand/Collapse Details">${icons.expand}</button>
                        <button class="product-action-btn product-copy-btn" title="Copy Details (JSON)">${icons.copy}</button>
                        <button class="product-action-btn product-delete-btn" title="Remove from list">${icons.trash}</button>
                    </div>
                </div>
                <div class="product-details-expanded" style="display: none;"></div>`;
             if (type === 'trolley') {
                const priceContainer = productDiv.querySelector('.product-price');
                priceContainer.insertAdjacentHTML('afterend', secondaryInfoHtml);
                priceContainer.style.marginBottom = '4px';
             }
            container.appendChild(productDiv);
        });
    }

    function createUI() {
        uiToggleButton = document.createElement('div');
        uiToggleButton.id = 'cw-scraper-toggle';
        uiToggleButton.innerHTML = icons.tool;
        uiToggleButton.title = 'Chemist Warehouse Scraper';
        document.body.appendChild(uiToggleButton);

        uiPanel = document.createElement('div');
        uiPanel.id = 'cw-scraper-panel';
        uiPanel.style.display = 'none';
        uiPanel.innerHTML = `
            <div id="cw-scraper-header">
                <span>CW Scraper v2.4</span>
                <button id="close-panel-btn" title="Close">✕</button>
            </div>
            <div id="cw-scraper-tabs">
                <button class="tab-btn active" data-tab="scraper">Scraper</button>
                <button class="tab-btn" data-tab="trolley">Cart</button>
            </div>
            <div id="cw-scraper-content">
                <div id="scraper-tab-content" class="tab-content active">
                    <div id="scraper-tab-action-buttons" class="button-group"></div>
                    <div class="status-container">
                        <div id="scraper-tab-status"></div>
                        <progress id="scraper-tab-progress-bar" value="0" max="100" style="display: none;"></progress>
                    </div>
                    <div id="scraper-tab-results" class="product-list-container"></div>
                </div>
                <div id="trolley-tab-content" class="tab-content">
                    <div id="trolley-tab-action-buttons" class="button-group"></div>
                    <div class="status-container">
                        <div id="trolley-tab-status"></div>
                        <progress id="trolley-tab-progress-bar" value="0" max="100" style="display: none;"></progress>
                    </div>
                    <div id="trolley-tab-results" class="product-list-container"></div>
                    <div id="trolley-total-price" style="display: none;"></div>
                </div>
                <div class="button-group export-group">
                    <div class="export-btn-container">
                        <button id="export-main-btn" data-action="copy-json">${icons.copy} Copy JSON</button>
                        <button id="export-toggle-btn" aria-label="More export options">▼</button>
                        <div id="export-menu" style="display: none;">
                            <div class="export-option" data-action="copy-json">${icons.copy} Copy JSON</div>
                            <div class="export-option" data-action="download-json">${icons.scrapeAll} Download JSON</div>
                            <div class="export-option" data-action="copy-csv">${icons.copy} Copy CSV</div>
                            <div class="export-option" data-action="download-csv">${icons.scrapeAll} Download CSV</div>
                            <div class="export-option" data-action="copy-md">${icons.copy} Copy Markdown</div>
                            <div class="export-option" data-action="download-md">${icons.scrapeAll} Download Markdown</div>
                        </div>
                    </div>
                    <button id="clear-btn">${icons.clear} Clear</button>
                </div>
                <details id="scraper-settings">
                    <summary>Advanced Settings</summary>
                    <div class="settings-grid">
                        <label for="min-delay">Min Delay (ms)</label> <input type="number" id="min-delay" value="${settings.minDelay}">
                        <label for="max-delay">Max Delay (ms)</label> <input type="number" id="max-delay" value="${settings.maxDelay}">
                    </div>
                     <div class="settings-grid">
                        <label for="max-retries">Max Retries</label> <input type="number" id="max-retries" value="${settings.maxRetries}">
                        <label for="retry-delay">Retry Wait (ms)</label> <input type="number" id="retry-delay" value="${settings.retryDelay}">
                    </div>
                    <div class="settings-grid">
                        <label for="include-prod-url">Include Product URL</label> <input type="checkbox" id="include-prod-url" ${settings.includeProductUrlOnCopy ? 'checked' : ''}>
                    </div>
                </details>
            </div>`;
        document.body.appendChild(uiPanel);

        uiToggleButton.addEventListener('click', togglePanel);
        document.getElementById('close-panel-btn').addEventListener('click', togglePanel);
        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
        document.getElementById('clear-btn').addEventListener('click', clearResults);
        uiPanel.addEventListener('click', handleProductActions);
        document.getElementById('export-main-btn').addEventListener('click', handleExport);
        document.getElementById('export-toggle-btn').addEventListener('click', toggleExportMenu);
        document.querySelectorAll('.export-option').forEach(option => option.addEventListener('click', selectExportOption));
        document.addEventListener('click', (e) => {
            const container = document.querySelector('.export-btn-container');
            if (container && !container.contains(e.target)) document.getElementById('export-menu').style.display = 'none';
        });
        document.getElementById('min-delay').addEventListener('input', e => { settings.minDelay = parseInt(e.target.value, 10) || 0; });
        document.getElementById('max-delay').addEventListener('input', e => { settings.maxDelay = parseInt(e.target.value, 10) || 0; });
        document.getElementById('max-retries').addEventListener('input', e => { settings.maxRetries = parseInt(e.target.value, 10) || 0; });
        document.getElementById('retry-delay').addEventListener('input', e => { settings.retryDelay = parseInt(e.target.value, 10) || 0; });
        document.getElementById('include-prod-url').addEventListener('change', e => { settings.includeProductUrlOnCopy = e.target.checked; });

        makeDraggable(uiPanel, document.getElementById('cw-scraper-header'));
        updateUIForActiveTab();
    }

    function switchTab(tabId) {
        if (isOperationRunning) { alert('Please stop the current operation before switching tabs.'); return; }
        activeTab = tabId;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === `${tabId}-tab-content`));
        updateUIForActiveTab();
    }

    function togglePanel() { isExpanded = !isExpanded; uiPanel.style.display = isExpanded ? 'flex' : 'none'; uiToggleButton.style.display = isExpanded ? 'none' : 'flex'; }

    function toggleOperationControls(isRunning) {
        isOperationRunning = isRunning;
        document.querySelectorAll('#cw-scraper-panel .button-group button, #cw-scraper-panel .product-action-btn').forEach(btn => btn.disabled = isRunning);
        document.getElementById('scraper-settings').style.pointerEvents = isRunning ? 'none' : 'auto';
        document.getElementById('scraper-settings').style.opacity = isRunning ? 0.6 : 1;
        document.querySelectorAll('.stop-button').forEach(btn => { btn.style.display = isRunning ? 'inline-flex' : 'none'; btn.disabled = !isRunning; });
        if (!isRunning) document.querySelectorAll('#cw-scraper-panel .button-group button.stop-button').forEach(btn => btn.disabled = true);
    }

    function updateUIForActiveTab() {
        if (activeTab === 'scraper') { updateScraperActionButtons(); updateScraperResultsDisplay();}
        else if (activeTab === 'trolley') { updateTrolleyActionButtons(); updateTrolleyResultsDisplay(); }
    }

    function updateScraperActionButtons() {
        const pageType = detectPageType();
        const container = document.getElementById('scraper-tab-action-buttons'); if (!container) return;
        container.innerHTML = '';
        if (pageType === 'product-list') {
            container.innerHTML = `<button id="scraper-scrape-current-btn">${icons.scrapePage} Scrape Current View</button> <button id="scraper-scrape-all-btn">${icons.scrapeAll} Scrape All Pages</button> <button id="scraper-fetch-details-btn">${icons.fetchDetails} Fetch Details</button> <button class="stop-button" style="display: none;">${icons.stop} Stop</button>`;
            container.querySelector('#scraper-scrape-current-btn')?.addEventListener('click', handleScrapeCurrentPage);
            container.querySelector('#scraper-scrape-all-btn')?.addEventListener('click', handleScrapeAllPages);
            container.querySelector('#scraper-fetch-details-btn')?.addEventListener('click', handleFetchScraperDetails);
        } else if (pageType === 'product-detail') {
            container.innerHTML = `<button id="scraper-scrape-detail-btn">${icons.scrapePage} Scrape This Product</button>`;
            container.querySelector('#scraper-scrape-detail-btn')?.addEventListener('click', handleScrapeDetailPage);
        } else { container.innerHTML = `<div class="info-message">Navigate to a product or search page.</div>`; }
        container.querySelector('.stop-button')?.addEventListener('click', handleStopOperation);
    }

    function updateTrolleyActionButtons() {
        const container = document.getElementById('trolley-tab-action-buttons'); if (!container) return;
        container.innerHTML = `<button id="trolley-scrape-btn">${icons.trolley} Scrape Cart</button> <button class="stop-button" style="display: none;">${icons.stop} Stop</button>`;
        container.querySelector('#trolley-scrape-btn').addEventListener('click', handleScrapeTrolley);
        container.querySelector('.stop-button').addEventListener('click', handleStopOperation);
    }

    function updateScraperResultsDisplay() {
        const resultsArea = document.getElementById('scraper-tab-results');
        const statusArea = document.getElementById('scraper-tab-status');
        const detailsBtn = document.getElementById('scraper-fetch-details-btn');
        if (!resultsArea || !statusArea) return;

        if (scrapedProducts.length > 0) {
            renderProductList(resultsArea, scrapedProducts, 'scraper');
            statusArea.textContent = `Displaying ${scrapedProducts.length} products.`;
            if (detailsBtn) detailsBtn.disabled = isOperationRunning;
        } else {
            resultsArea.innerHTML = `<div class="info-message">Click a button to start scraping.</div>`;
            statusArea.textContent = '';
            if (detailsBtn) detailsBtn.disabled = true;
        }
    }

    function updateTrolleyResultsDisplay() {
        const resultsArea = document.getElementById('trolley-tab-results');
        const statusArea = document.getElementById('trolley-tab-status');
        const totalArea = document.getElementById('trolley-total-price');
        if (!resultsArea || !statusArea || !totalArea) return;

        if (trolleyProducts.length > 0) {
            const total = trolleyProducts.reduce((acc, p) => acc + (p.itemTotal || 0), 0);
            totalArea.innerHTML = `<span>Cart Total:</span> <span class="total-price-value">$${total.toFixed(2)}</span>`;
            totalArea.style.display = 'flex';
            renderProductList(resultsArea, trolleyProducts, 'trolley');
            statusArea.textContent = `Displaying ${trolleyProducts.length} items from cart.`;
        } else {
            resultsArea.innerHTML = `<div class="info-message">Click "Scrape Cart" to get started.</div>`;
            statusArea.textContent = '';
            totalArea.style.display = 'none';
        }
    }

    // --- BUTTON HANDLERS ---
    function handleStopOperation() { isOperationRunning = false; document.getElementById('scraper-tab-status').textContent = "Stopping..."; document.getElementById('trolley-tab-status').textContent = "Stopping..."; }

    function handleScrapeCurrentPage() {
        if (isOperationRunning) return;
        document.getElementById('scraper-tab-status').textContent = 'Scraping current page...';
        scrapedProducts = scrapeSearchPage(); updateScraperResultsDisplay();
        document.getElementById('scraper-tab-status').textContent = `Scraped ${scrapedProducts.length} products.`;
    }

    /**
     * [FIXED] This function now robustly scrapes the current product detail page,
     * checks for duplicates, and adds or updates the product in the scrapedProducts list.
     */
    function handleScrapeDetailPage() {
        if (isOperationRunning) return;
        const statusArea = document.getElementById('scraper-tab-status');
        statusArea.textContent = 'Scraping this product page...';

        // Scrape the details from the current document.
        const newProduct = scrapeProductDetailPage(document);
        // Explicitly add the current page's URL, as scrapeProductDetailPage doesn't know its context.
        newProduct.product_url = window.location.href;

        // Check for errors during scraping.
        if (newProduct.detail_error && !newProduct.detailed_name) {
            statusArea.textContent = `Scraping failed: ${newProduct.detail_error}`;
            return;
        }

        // Check if the product already exists in our list by its URL.
        const existingProductIndex = scrapedProducts.findIndex(p => p.product_url === newProduct.product_url);

        if (existingProductIndex !== -1) {
            // If it exists, replace it with the new, more detailed data.
            scrapedProducts[existingProductIndex] = newProduct;
            statusArea.textContent = 'Product details updated in the list.';
        } else {
            // If it's a new product, add it to the start of the list for visibility.
            scrapedProducts.unshift(newProduct);
            statusArea.textContent = 'Product added to the list.';
        }

        // Update the UI to show the new/updated list.
        updateScraperResultsDisplay();
    }


    async function handleScrapeTrolley() {
        if (isOperationRunning) return;
        const statusArea = document.getElementById('trolley-tab-status');
        statusArea.textContent = 'Opening cart and scraping...';
        const cartButton = document.querySelector('[data-cy="cart-button-desktop"]');
        if (!cartButton) { statusArea.textContent = 'Could not find cart button.'; return; }
        cartButton.click();
        try {
            await waitForElement('div[role="dialog"][data-state="open"] ul[data-cy="cart-items"]', 5000);
            await sleepFixed(500);
            const result = scrapeTrolley();
            if (result.error) { statusArea.textContent = result.error; }
            else { trolleyProducts = result.products; statusArea.textContent = `Scraped ${trolleyProducts.length} items.`; }

            // Auto-close the cart dialog after scraping
            const closeButton = document.querySelector('div[role="dialog"][data-state="open"] button[type="button"] svg[data-cy="x-mark-icon"]');
            if (closeButton) {
                const buttonElement = closeButton.closest('button');
                if (buttonElement) {
                    await sleepFixed(500); // Small delay before closing
                    buttonElement.click();
                    statusArea.textContent = statusArea.textContent + ' Cart closed.';
                }
            }
        } catch (error) { statusArea.textContent = 'Failed to load cart content.'; console.error(error); }
        finally { updateTrolleyResultsDisplay(); }
    }

    async function runFetchWithRetries(url, statusAreaElement, originalStatus) {
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
                    if (statusAreaElement) statusAreaElement.textContent = `Fetch failed. Retrying... (${i + 1}/${settings.maxRetries})`;
                    await sleepFixed(settings.retryDelay);
                    if (statusAreaElement) statusAreaElement.textContent = originalStatus;
                }
            }
        }
        return { error };
    }

    async function fetchSingleWithRetries(url) {
        let error = null;
        for (let i = 0; i <= settings.maxRetries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return { doc: new DOMParser().parseFromString(await response.text(), 'text/html') };
            } catch (e) {
                error = e;
                if (i < settings.maxRetries) {
                    await sleepFixed(settings.retryDelay);
                }
            }
        }
        return { error };
    }

    async function handleScrapeAllPages() {
        if (isOperationRunning) return;
        toggleOperationControls(true);
        scrapedProducts = [];
        const statusArea = document.getElementById('scraper-tab-status');
        const progressBar = document.getElementById('scraper-tab-progress-bar');
        updateScraperResultsDisplay();
        progressBar.style.display = 'none'; // Hide progress bar as total pages are unknown

        try {
            let pageCount = 1;
            while (isOperationRunning) {
                statusArea.textContent = `Scraping page ${pageCount}...`;
                await sleepFixed(500); // Small delay to allow UI to update

                const newProducts = scrapeSearchPage(document);
                // Add only new products to avoid duplicates if the page reloads weirdly
                scrapedProducts.push(
                    ...newProducts.filter(p => !scrapedProducts.some(sp => sp.product_url === p.product_url))
                );
                updateScraperResultsDisplay();
                statusArea.textContent = `Page ${pageCount} scraped. Total: ${scrapedProducts.length}. Looking for next page...`;

                const nextButton = document.querySelector('nav[aria-label="pagination"] a[aria-label="Go to next page"]:not([aria-disabled="true"])');

                if (nextButton) {
                    const updatePromise = waitForProductGridUpdate();
                    nextButton.click();
                    statusArea.textContent = `Loading page ${pageCount + 1}...`;
                    try {
                        await updatePromise;
                        await sleepFixed(1000); // Wait a bit for all resources to settle
                    } catch (error) {
                        statusArea.textContent = `Error: ${error.message}`;
                        console.error(error);
                        break; // Stop on error
                    }
                    pageCount++;
                } else {
                    statusArea.textContent = `Finished. No more pages found. Scraped a total of ${scrapedProducts.length} products.`;
                    break; // No more pages
                }
            }
            if (!isOperationRunning) {
                statusArea.textContent = `Scraping stopped. Found ${scrapedProducts.length} products.`;
            }
        } catch(e) {
            statusArea.textContent = `An unexpected error occurred: ${e.message}`;
            console.error("Error during page scraping loop:", e);
        } finally {
            toggleOperationControls(false);
            progressBar.style.display = 'none';
        }
    }


    async function runDetailFetchProcess(productList, statusAreaElement, progressBarElement, updateDisplayFunc) {
        if (isOperationRunning || productList.length === 0) return;
        toggleOperationControls(true);
        const total = productList.length;
        statusAreaElement.textContent = `Starting to fetch details for ${total} products...`;
        progressBarElement.style.display = 'block'; progressBarElement.value = 0; progressBarElement.max = total;

        try {
            for (let i = 0; i < total; i++) {
                if (!isOperationRunning) break;
                const product = productList[i]; progressBarElement.value = i + 1;
                if (!product.product_url || product.product_url === 'N/A' || product.product_url.includes('Not available')) {
                    product.detail_error = "No URL to fetch details from."; continue;
                }
                const originalStatus = `(${i + 1}/${total}) Fetching: ${product.name.substring(0, 30)}...`;
                statusAreaElement.textContent = originalStatus;

                const { doc, error } = await runFetchWithRetries(product.product_url, statusAreaElement, originalStatus);
                if (error) { product.detail_error = `Fetch failed: ${error.message}`; }
                else { Object.assign(product, scrapeProductDetailPage(doc)); }

                updateDisplayFunc();
                if (isOperationRunning && i < total - 1) await sleepRandom();
            }
            statusAreaElement.textContent = isOperationRunning ? 'Finished fetching all details.' : 'Fetching stopped by user.';
        } finally {
            toggleOperationControls(false);
            progressBarElement.style.display = 'none';
        }
    }

    async function handleFetchScraperDetails() {
       await runDetailFetchProcess(scrapedProducts, document.getElementById('scraper-tab-status'), document.getElementById('scraper-tab-progress-bar'), updateScraperResultsDisplay);
    }

    async function handleProductActions(e) {
        if (isOperationRunning) return;
        const deleteBtn = e.target.closest('.product-delete-btn');
        const copyBtn = e.target.closest('.product-copy-btn');
        const expandBtn = e.target.closest('.product-expand-btn');
        if (!deleteBtn && !copyBtn && !expandBtn) return;

        const productItem = e.target.closest('.product-item');
        const index = parseInt(productItem.dataset.productIndex, 10);
        const tabType = productItem.dataset.tabType;
        const productList = tabType === 'scraper' ? scrapedProducts : trolleyProducts;
        const product = productList[index];

        if (deleteBtn) {
            productList.splice(index, 1);
            if (tabType === 'scraper') updateScraperResultsDisplay(); else updateTrolleyResultsDisplay();
        } else if (copyBtn) {
            GM_setClipboard(JSON.stringify(product, null, 2));
            copyBtn.classList.add('copied'); copyBtn.innerHTML = icons.check;
            setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.innerHTML = icons.copy; }, 1500);
        } else if (expandBtn) {
            const wrapper = e.target.closest('.product-item-wrapper');
            const detailsContainer = wrapper.querySelector('.product-details-expanded');
            const isVisible = detailsContainer.style.display !== 'none';

            if (isVisible) { detailsContainer.style.display = 'none'; expandBtn.innerHTML = icons.expand; }
            else {
                 if (tabType === 'trolley') {
                    product.detail_error = "Details cannot be fetched from the cart. Please use the Scraper tab for full details.";
                    renderExpandedDetails(detailsContainer, product);
                    detailsContainer.style.display = 'block';
                    expandBtn.innerHTML = icons.collapse;
                    return;
                }
                if (product.detailed_name || product.detail_error) {
                    renderExpandedDetails(detailsContainer, product); detailsContainer.style.display = 'block'; expandBtn.innerHTML = icons.collapse;
                } else { await fetchAndDisplaySingleDetail(index, tabType, detailsContainer, expandBtn); }
            }
        }
    }

    async function fetchAndDisplaySingleDetail(index, tabType, detailsContainer, expandBtn) {
        const productList = tabType === 'scraper' ? scrapedProducts : trolleyProducts;
        const product = productList[index];
        if (!product.product_url || product.product_url.includes('N/A')) {
            product.detail_error = "No URL to fetch.";
            renderExpandedDetails(detailsContainer, product); detailsContainer.style.display = 'block'; expandBtn.innerHTML = icons.collapse; return;
        }
        detailsContainer.innerHTML = `<div class="details-loading">Fetching details...</div>`;
        detailsContainer.style.display = 'block'; expandBtn.disabled = true;

        const { doc, error } = await fetchSingleWithRetries(product.product_url);
        if (error) { Object.assign(product, { detail_error: `Fetch failed: ${error.message}` }); }
        else { Object.assign(product, scrapeProductDetailPage(doc)); }

        renderExpandedDetails(detailsContainer, product);
        expandBtn.innerHTML = icons.collapse; expandBtn.disabled = false;
    }

    function renderExpandedDetails(container, product) {
        const keysToIgnore = new Set(['name', 'price', 'rrp_info', 'product_url', 'itemTotal', 'quantity', 'itemPrice']);
        let html = '<dl class="details-dl">';
        const keyOrder = ['detailed_name', 'brand', 'description', 'detailed_current_price', 'detailed_original_price', 'savings', 'rating', 'review_count', 'product_id', 'ingredients', 'directions', 'warnings', 'detail_error'];
        keyOrder.forEach(key => {
             if (product[key] && !keysToIgnore.has(key) && String(product[key]).trim() !== '') {
                const prettyKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                html += `<dt>${prettyKey}</dt><dd>${String(product[key]).replace(/\n/g, '<br>')}</dd>`;
            }
        });
        html += '</dl>'; container.innerHTML = html;
    }

    // --- EXPORT & MENU FUNCTIONS ---
    function toggleExportMenu() { const menu = document.getElementById('export-menu'); menu.style.display = menu.style.display === 'none' ? 'block' : 'none'; }
    function executeExportAction(action) {
        switch (action) {
            case 'copy-json': exportJSON(false); break; case 'download-json': exportJSON(true); break;
            case 'copy-csv': exportCSV(false); break; case 'download-csv': exportCSV(true); break;
            case 'copy-md': exportMarkdown(false); break; case 'download-md': exportMarkdown(true); break;
        }
    }
    function selectExportOption(e) {
        const action = e.currentTarget.dataset.action;
        document.getElementById('export-main-btn').innerHTML = e.currentTarget.innerHTML;
        document.getElementById('export-main-btn').dataset.action = action;
        document.getElementById('export-menu').style.display = 'none';
        executeExportAction(action);
    }
    function handleExport() { executeExportAction(document.getElementById('export-main-btn').dataset.action); }
    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType }); const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(a.href);
    }
    function prepareDataForExport() {
        const sourceData = activeTab === 'scraper' ? scrapedProducts : trolleyProducts;
        const exportData = sourceData.map(p => { const newProd = { ...p }; if (!settings.includeProductUrlOnCopy) delete newProd.product_url; return newProd; });
        const result = { items: exportData };
        if (activeTab === 'trolley' && trolleyProducts.length > 0) { const total = trolleyProducts.reduce((acc, p) => acc + (p.itemTotal || 0), 0); result.totalPrice = parseFloat(total.toFixed(2)); result.totalPriceFormatted = `$${total.toFixed(2)}`; }
        return result;
    }
    function showCopyFeedback(buttonId) {
        const btn = document.getElementById(buttonId); if (!btn) return;
        const originalHTML = btn.innerHTML; const originalAction = btn.dataset.action;
        btn.innerHTML = `${icons.check} Copied`; btn.classList.add('copied-success'); btn.disabled = true;
        document.getElementById('export-toggle-btn')?.setAttribute('disabled', 'true');
        setTimeout(() => { btn.innerHTML = originalHTML; btn.dataset.action = originalAction; btn.classList.remove('copied-success'); btn.disabled = false; document.getElementById('export-toggle-btn')?.removeAttribute('disabled'); }, 2000);
    }
    function exportJSON(download = false) {
        const { items } = prepareDataForExport(); if(items.length === 0) { alert('No data to export.'); return; }
        const jsonString = JSON.stringify(prepareDataForExport(), null, 2);
        if (download) { downloadFile(`${activeTab}_export_${new Date().toISOString().slice(0, 10)}.json`, jsonString, 'application/json'); }
        else { GM_setClipboard(jsonString); showCopyFeedback('export-main-btn'); }
    }
    function exportCSV(download = false) {
        const { items, totalPriceFormatted } = prepareDataForExport(); if(items.length === 0) { alert('No data to export.'); return; }
        let csvContent = totalPriceFormatted ? `Total Price,"${totalPriceFormatted}"\n\n` : '';
        const headers = Array.from(new Set(items.flatMap(Object.keys))); csvContent += headers.join(',') + '\n';
        items.forEach(product => { csvContent += headers.map(header => { let value = String(product[header] || '').replace(/"/g, '""'); return (value.includes(',') || value.includes('\n')) ? `"${value}"` : value; }).join(',') + '\n'; });
        if (download) { downloadFile(`${activeTab}_export_${new Date().toISOString().slice(0, 10)}.csv`, csvContent, 'text/csv;charset=utf-8;'); }
        else { GM_setClipboard(csvContent); showCopyFeedback('export-main-btn'); }
    }
    function exportMarkdown(download = false) {
        const data = prepareDataForExport(); const sourceData = data.items;
        if (sourceData.length === 0) { alert('No data to export.'); return; }
        let md = `# ${activeTab === 'trolley' ? 'Chemist Warehouse Cart' : 'Chemist Warehouse Products'}\n\n`;
        sourceData.forEach(p => {
            md += `## ${p.detailed_name || p.name}\n\n`;
            md += `| Attribute | Value |\n|---|---|\n`;
            const keyOrder = ['detailed_name', 'brand', 'description', 'detailed_current_price', 'price', 'detailed_original_price', 'savings', 'rrp_info', 'quantity', 'itemPrice', 'rating', 'review_count', 'product_id', 'ingredients', 'directions', 'warnings', 'product_url', 'detail_error'];
            keyOrder.forEach(key => {
                if (p[key] && String(p[key]).trim() !== '' && !['name'].includes(key)) {
                    const keyFormatted = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let value = p[key]; if (key === 'itemTotal' && typeof value === 'number') { value = `$${value.toFixed(2)}`; }
                    md += `| **${keyFormatted}** | ${String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>')} |\n`;
                }
            });
            md += `\n---\n\n`;
        });
        if(data.totalPriceFormatted) md += `\n**Grand Total: ${data.totalPriceFormatted}**\n`;
        if (download) { downloadFile(`${activeTab}_export_${new Date().toISOString().slice(0, 10)}.md`, md, 'text/markdown;charset=utf-8;'); }
        else { GM_setClipboard(md); showCopyFeedback('export-main-btn'); }
    }
    function clearResults() {
        if (isOperationRunning) return;
        if (activeTab === 'scraper') { scrapedProducts = []; }
        else { trolleyProducts = []; }
        updateUIForActiveTab();
    }
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = e => { e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; }; document.onmousemove = e => { e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY; element.style.top = (element.offsetTop - pos2) + "px"; element.style.left = (element.offsetLeft - pos1) + "px"; }; };
    }
    function setupPageChangeMonitoring() {
        let currentUrl = window.location.href;
        const observer = new MutationObserver(() => { if (window.location.href !== currentUrl) { currentUrl = window.location.href; setTimeout(() => { if (!isOperationRunning) updateUIForActiveTab(); }, 1500); } });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // --- CSS STYLES ---
    GM_addStyle(`
        :root { --cw-blue: #0054a6; --cw-blue-dark: #003e7a; --cw-red: #e31c23; --cw-text-primary: #1a1a1a; --cw-text-secondary: #595959; --cw-border-light: #e0e0e0; --cw-background-light: #f7f7f7; --cw-stop-blue: #007bff; --cw-green-success: #28a745; }
        #cw-scraper-toggle { position: fixed; top: 150px; right: 0; width: 48px; height: 48px; background-color: var(--cw-blue); color: white; border-radius: 8px 0 0 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: -2px 2px 8px rgba(0,0,0,0.2); z-index: 100001; transition: all 0.2s ease; user-select: none; }
        #cw-scraper-toggle:hover { background-color: var(--cw-blue-dark); width: 52px; }
        #cw-scraper-toggle svg { width: 28px; height: 28px; }
        #cw-scraper-panel { position: fixed; top: 20px; right: 20px; width: 540px; max-width: 95vw; max-height: 90vh; background-color: #fff; border: 1px solid var(--cw-border-light); border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); z-index: 100001; display: flex; flex-direction: column; font-family: Outfit, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #cw-scraper-header { padding: 12px 18px; cursor: move; background-color: #fff; color: var(--cw-text-primary); font-weight: 600; font-size: 16px; border-bottom: 1px solid var(--cw-border-light); border-top-left-radius: 8px; border-top-right-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
        #close-panel-btn { background: none; border: none; color: var(--cw-text-secondary); font-size: 24px; cursor: pointer; padding: 0 5px; line-height: 1; opacity: 0.8; transition: all 0.2s; }
        #close-panel-btn:hover { opacity: 1; transform: scale(1.1); }
        #cw-scraper-tabs { display: flex; border-bottom: 1px solid var(--cw-border-light); background-color: var(--cw-background-light); }
        .tab-btn { padding: 12px 20px; border: none; background: none; cursor: pointer; font-size: 15px; font-weight: 600; color: var(--cw-text-secondary); border-bottom: 3px solid transparent; transition: all 0.2s ease; flex-grow: 1; }
        .tab-btn:hover { background-color: #e9e9e9; }
        .tab-btn.active { color: var(--cw-blue); border-bottom-color: var(--cw-blue); }
        #cw-scraper-content { padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .tab-content { display: none; flex-direction: column; gap: 15px; }
        .tab-content.active { display: flex; }
        .product-list-container { width: 100%; height: 300px; background-color: #f8f9fa; border: 1px solid var(--cw-border-light); border-radius: 6px; padding: 8px; box-sizing: border-box; resize: vertical; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .product-item-wrapper { background-color: #fff; border: 1px solid #e9e9e9; border-radius: 4px; }
        .product-item { display: flex; align-items: center; gap: 10px; padding: 10px; }
        .product-item-details { flex: 1; min-width: 0; }
        .product-name { font-weight: 500; color: var(--cw-text-primary); margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px; }
        .product-price { font-weight: 700; color: var(--cw-red); margin: 0; font-size: 15px; display: inline; }
        .product-rrp-info { font-weight: 400; color: var(--cw-text-secondary); font-size: 12px; margin-left: 8px; }
        .product-quantity { font-size: 13px; color: var(--cw-text-secondary); margin: 0;}
        .product-item-actions { display: flex; gap: 5px; align-items: center; }
        .product-action-btn { background-color: #f0f0f0; border: 1px solid #e0e0e0; color: var(--cw-text-secondary); width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
        .product-action-btn:hover:not(:disabled) { background-color: #e0e0e0; color: var(--cw-text-primary); }
        .product-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .product-action-btn svg { width: 15px; height: 15px; }
        .product-delete-btn:hover:not(:disabled) { background-color: #ffebee; color: #c62828; }
        .product-copy-btn.copied { background-color: var(--cw-green-success) !important; color: white !important; }
        .product-details-expanded { padding: 12px 15px; border-top: 1px solid #f0f0f0; background-color: #fafafa; font-size: 13px; }
        .details-loading { font-style: italic; color: var(--cw-text-secondary); }
        .details-dl { margin: 0; display: grid; grid-template-columns: 120px 1fr; gap: 8px; }
        .details-dl dt { font-weight: 600; color: var(--cw-text-primary); }
        .details-dl dd { margin: 0; color: var(--cw-text-secondary); word-break: break-word; }
        #trolley-total-price { padding: 12px 18px; background-color: var(--cw-background-light); border: 1px solid var(--cw-border-light); border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 600; color: var(--cw-text-primary); }
        .total-price-value { font-size: 18px; font-weight: 700; color: var(--cw-red); }
        .status-container { display: flex; flex-direction: column; gap: 8px; }
        #scraper-tab-status, #trolley-tab-status { font-style: italic; color: var(--cw-text-secondary); min-height: 1.2em; font-size: 14px; }
        progress { width: 100%; height: 8px; border-radius: 4px; border: none; appearance: none; }
        progress::-webkit-progress-bar { background-color: #e9ecef; border-radius: 4px; }
        progress::-webkit-progress-value { background-color: var(--cw-blue); border-radius: 4px; transition: width 0.3s ease; }
        .button-group { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .button-group.export-group { border-top: 1px solid var(--cw-border-light); padding-top: 15px; justify-content: space-between; }
        .button-group button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 16px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; font-size: 14px; font-weight: 600; line-height: 1; }
        .button-group button:hover:not(:disabled) { box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        .button-group button:disabled { background-color: #e0e0e0 !important; color: #a0a0a0 !important; cursor: not-allowed; box-shadow: none; border-color: #e0e0e0 !important; }
        .button-group button svg { width: 16px; height: 16px; stroke-width: 2.5; stroke: currentColor; }
        #scraper-scrape-all-btn, #scraper-fetch-details-btn { background-color: var(--cw-blue); color: white; }
        #scraper-scrape-all-btn:hover:not(:disabled), #scraper-fetch-details-btn:hover:not(:disabled) { background-color: var(--cw-blue-dark); }
        #scraper-scrape-current-btn, #scraper-scrape-detail-btn, #trolley-scrape-btn { background-color: #fff; color: var(--cw-blue); border: 1px solid var(--cw-blue); }
        #scraper-scrape-current-btn:hover:not(:disabled), #scraper-scrape-detail-btn:hover:not(:disabled), #trolley-scrape-btn:hover:not(:disabled) { background-color: #f0f6ff; }
        #clear-btn { background-color: var(--cw-text-secondary); color: white; border-color: var(--cw-text-secondary); }
        #clear-btn:hover:not(:disabled) { background-color: var(--cw-text-primary); border-color: var(--cw-text-primary); }
        .stop-button { background-color: var(--cw-stop-blue); color: white; border-color: var(--cw-stop-blue); }
        .stop-button:hover:not(:disabled) { background-color: #0069d9; border-color: #0069d9; }
        .export-btn-container { position: relative; display: flex; }
        #export-main-btn { border-radius: 4px 0 0 4px; border-right: none; background-color: var(--cw-green-success); color: white; border-color: var(--cw-green-success); }
        #export-main-btn:hover:not(:disabled) { background-color: #218838; }
        #export-main-btn.copied-success { background-color: #218838 !important; }
        #export-toggle-btn { padding: 8px 10px; border-radius: 0 4px 4px 0; border: 1px solid var(--cw-green-success); background-color: var(--cw-green-success); color: white; font-size: 10px; margin-left: -1px; }
        #export-toggle-btn:hover:not(:disabled) { background-color: #218838; }
        #export-menu { position: absolute; bottom: 110%; left: 0; background-color: #fff; border: 1px solid var(--cw-border-light); border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; width: 220px; overflow: hidden; }
        .export-option { display: flex; align-items: center; gap: 10px; padding: 10px 15px; cursor: pointer; font-size: 14px; color: var(--cw-text-primary); transition: background-color 0.2s; }
        .export-option:hover { background-color: var(--cw-background-light); }
        .export-option svg { width: 16px; height: 16px; stroke-width: 2; color: var(--cw-text-secondary); }
        #scraper-settings { border: 1px solid var(--cw-border-light); border-radius: 6px; background-color: #fff; transition: opacity 0.3s; margin-top: 5px; }
        #scraper-settings summary { font-weight: 600; cursor: pointer; padding: 12px 15px; color: var(--cw-text-primary); border-radius: 6px; position: relative; }
        #scraper-settings summary:hover { background-color: var(--cw-background-light); }
        #scraper-settings > div { padding: 15px; }
        .settings-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px 15px; align-items: center; font-size: 14px; }
        .settings-grid:not(:last-child) { border-bottom: 1px solid #f0f0f0; padding-bottom: 15px; margin-bottom: 15px; }
        .settings-grid label { justify-self: start; color: var(--cw-text-secondary); }
        .settings-grid input[type="number"] { width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
        .settings-grid input[type="number"]:focus { border-color: var(--cw-blue); outline: none; box-shadow: 0 0 0 2px rgba(0, 84, 166, 0.2); }
        .settings-grid input[type="checkbox"] { justify-self: start; width: 20px; height: 20px; accent-color: var(--cw-blue); }
        .info-message { display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; color: #666; font-style: italic; text-align: center; padding: 20px; background-color: transparent; }
    `);

    // --- INITIALIZATION ---
    function initialize() {
        console.log('Chemist Warehouse Scraper: Initializing...');
        createUI();
        setupPageChangeMonitoring();
        switchTab('scraper');
        console.log('Chemist Warehouse Scraper: Ready!');
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initialize();
    } else {
        window.addEventListener('DOMContentLoaded', initialize);
    }
})();