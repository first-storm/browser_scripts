// ==UserScript==
// @name         Chemist Warehouse Scraper
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  A comprehensive CW tool with a tabbed UI. "Scrape All Pages" now simulates clicking the NEXT button for more reliable scraping on dynamic pages. UI updated to better match the site's style. "Scrape This Product" is now more robust. Added a retry button for failed detail fetches.
// @author       Artificial Intelligence & Gemini
// @match        https://www.chemistwarehouse.com.au/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function () {
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
    let eventListeners = []; // Track event listeners for cleanup
    let abortController = null; // For cancelling operations

    // --- SETTINGS STATE ---
    let settings = {
        minDelay: 1000,
        maxDelay: 2000,
        maxRetries: 3,
        retryDelay: 2000,
        includeProductUrlOnCopy: true,
    };

    // Load settings from storage
    function loadSettings() {
        try {
            const savedSettings = GM_getValue('cw_scraper_settings', null);
            if (savedSettings) {
                settings = { ...settings, ...JSON.parse(savedSettings) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }

    // Save settings to storage
    function saveSettings() {
        try {
            GM_setValue('cw_scraper_settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    // --- UTILITY FUNCTIONS ---
    const sleepRandom = () => {
        const delay = Math.random() * (settings.maxDelay - settings.minDelay) + settings.minDelay;
        return new Promise(resolve => setTimeout(resolve, delay));
    };
    const sleepFixed = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const waitForElement = (selector, timeout = 10000, container = document) => new Promise((resolve, reject) => {
        if (abortController?.signal.aborted) {
            reject(new Error('Operation aborted'));
            return;
        }

        const element = container.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const intervalTime = 100;
        let elapsedTime = 0;
        const interval = setInterval(() => {
            if (abortController?.signal.aborted) {
                clearInterval(interval);
                reject(new Error('Operation aborted'));
                return;
            }

            const element = container.querySelector(selector);
            if (element) {
                clearInterval(interval);
                resolve(element);
            } else {
                elapsedTime += intervalTime;
                if (elapsedTime >= timeout) {
                    clearInterval(interval);
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                }
            }
        }, intervalTime);
    });

    /**
     * Waits for the product grid to update after a page change.
     * Fixed to handle race conditions and provide better error handling.
     */
    function waitForProductGridUpdate() {
        return new Promise((resolve, reject) => {
            const grid = document.querySelector('ul[data-cy="product-grid"]');
            if (!grid) {
                return reject(new Error("Could not find product grid to observe."));
            }

            if (abortController?.signal.aborted) {
                return reject(new Error('Operation aborted'));
            }

            // Store initial content to compare against
            const initialContent = grid.innerHTML;
            let hasChanged = false;

            const timeout = setTimeout(() => {
                observer.disconnect();
                if (!hasChanged) {
                    reject(new Error("Waiting for content update timed out (15s)."));
                } else {
                    resolve();
                }
            }, 15000);

            const observer = new MutationObserver((mutationsList, obs) => {
                if (abortController?.signal.aborted) {
                    clearTimeout(timeout);
                    obs.disconnect();
                    reject(new Error('Operation aborted'));
                    return;
                }

                // Check if content has actually changed
                if (grid.innerHTML !== initialContent) {
                    hasChanged = true;
                    clearTimeout(timeout);
                    obs.disconnect();
                    resolve();
                }
            });

            observer.observe(grid, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'data-cy']
            });

            // Also check for URL changes as a backup
            const currentUrl = window.location.href;
            const urlCheckInterval = setInterval(() => {
                if (window.location.href !== currentUrl || abortController?.signal.aborted) {
                    clearInterval(urlCheckInterval);
                    clearTimeout(timeout);
                    observer.disconnect();
                    if (abortController?.signal.aborted) {
                        reject(new Error('Operation aborted'));
                    } else {
                        resolve();
                    }
                }
            }, 500);
        });
    }

    function stripHtml(html) {
        if (!html) return "";
        try {
            const tmp = document.createElement("DIV");
            tmp.innerHTML = html.replace(/<br\s*\/?>/ig, '\n');
            return tmp.textContent || tmp.innerText || "";
        } catch (e) {
            console.warn('Failed to strip HTML:', e);
            return String(html);
        }
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // --- PAGE TYPE DETECTION ---
    function detectPageType() {
        const path = window.location.pathname;
        if (path.includes('/search') || path.includes('/shop-online')) return 'product-list';
        if (path.startsWith('/buy/')) return 'product-detail';
        return 'other';
    }

    // --- SCRAPING LOGIC ---
    function scrapeSearchPage(doc = document) {
        const productsOnPage = new Map();
        const productLinks = doc.querySelectorAll('ul[data-cy="product-grid"] > li a[href^="/buy/"]');

        productLinks.forEach(linkTag => {
            try {
                const productUrl = new URL(linkTag.href, window.location.origin).href;
                if (productsOnPage.has(productUrl)) return;

                const tile = linkTag.closest('li');
                if (!tile) return;

                const priceEl = tile.querySelector('p[data-cy="dollar-string"]');
                const rrpEl = tile.querySelector('p.body-s.text-colour-subtitle-light');

                const productName = linkTag.textContent?.trim() || "N/A";
                const price = priceEl?.textContent?.trim() || 'N/A';
                const rrpInfo = rrpEl?.textContent?.trim() || 'N/A';

                productsOnPage.set(productUrl, {
                    name: productName,
                    product_url: productUrl,
                    price: price,
                    rrp_info: rrpInfo,
                });
            } catch (e) {
                console.error("Could not parse a product tile:", e, linkTag);
            }
        });

        return Array.from(productsOnPage.values());
    }

    function scrapeProductDetailPage(doc = document) {
        const productData = {};
        const scriptTag = doc.getElementById('__NEXT_DATA__');

        if (!scriptTag) {
            return { detail_error: "__NEXT_DATA__ script tag not found." };
        }

        try {
            const data = JSON.parse(scriptTag.textContent);
            const pp = data?.props?.pageProps;

            if (!pp) {
                return { detail_error: "PageProps not found in __NEXT_DATA__." };
            }

            const productInfo = pp.product ?? pp.productPage ?? pp.mwebProductPage;

            if (!productInfo) {
                return { detail_error: "Product object not found in __NEXT_DATA__." };
            }

            const product = productInfo.product ?? productInfo;
            const pricesObj = productInfo.prices?.[0]?.price ?? productInfo.price;

            if (product) {
                const variant = product.variants?.[0];
                productData.detailed_name = product.name || 'N/A';
                productData.brand = product.brand?.label || 'N/A';
                productData.description = stripHtml(product.description || '');

                if (pricesObj) {
                    if (pricesObj.value?.amount) {
                        productData.detailed_current_price = `$${pricesObj.value.amount.toFixed(2)}`;
                    }
                    if (pricesObj.rrp?.amount) {
                        productData.detailed_original_price = `$${pricesObj.rrp.amount.toFixed(2)}`;
                    }
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

                    const rating = getAttr('cwr-review-rating');
                    if (rating && !isNaN(rating)) {
                        productData.rating = `${Number(rating).toFixed(1)} / 5`;
                    }

                    const reviewCount = getAttr('cwr-review-rating-count');
                    productData.review_count = reviewCount || 0;
                    productData.product_id = variant.sku || 'N/A';
                }
            } else {
                productData.detail_error = "Product info not found in __NEXT_DATA__.";
            }
        } catch (e) {
            console.error("Error parsing product detail JSON:", e);
            productData.detail_error = `Error parsing JSON: ${e.message}`;
        }

        return productData;
    }

    function scrapeTrolley() {
        const trolleyContainer = document.querySelector('div[role="dialog"][data-state="open"] ul[data-cy="cart-items"]');
        if (!trolleyContainer) {
            return { error: 'Could not find the cart items list. Is the cart open?' };
        }

        const productItems = trolleyContainer.querySelectorAll('li');
        if (productItems.length === 0) {
            return { error: 'Cart is empty.' };
        }

        const items = [];
        productItems.forEach(item => {
            try {
                const nameElement = item.querySelector('p.body-s');
                const quantityInput = item.querySelector('input[type="number"]');
                const priceElement = item.querySelector('div.headline-m p[data-cy="dollar-string"]');

                if (!nameElement || !quantityInput || !priceElement) return;

                const quantity = parseInt(quantityInput.value, 10);
                const priceText = priceElement.textContent?.replace(/[$,]/g, '') || '0';
                const itemPrice = parseFloat(priceText);

                if (isNaN(quantity) || isNaN(itemPrice) || quantity <= 0) return;

                items.push({
                    name: nameElement.textContent?.trim() || 'Unknown Product',
                    product_url: 'N/A - Not available from cart',
                    quantity: quantity,
                    price: `Total: $${(itemPrice * quantity).toFixed(2)}`,
                    itemPrice: itemPrice,
                    itemTotal: itemPrice * quantity,
                });
            } catch (e) {
                console.error('Error parsing cart item:', e);
            }
        });

        if (items.length === 0) {
            return { error: 'No valid products found to export.' };
        }

        return { products: items };
    }

    // --- UI & STATE MANAGEMENT ---
    function addEventListenerWithCleanup(element, event, handler, options = false) {
        if (element) {
            element.addEventListener(event, handler, options);
            eventListeners.push({ element, event, handler, options });
        }
    }

    function cleanupEventListeners() {
        eventListeners.forEach(({ element, event, handler, options }) => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (e) {
                console.warn('Failed to remove event listener:', e);
            }
        });
        eventListeners = [];
    }

    function renderProductList(container, products, type = 'scraper') {
        if (!container) return;

        container.innerHTML = '';
        if (!products || products.length === 0) return;

        products.forEach((product, index) => {
            try {
                const productDiv = document.createElement('div');
                productDiv.className = 'product-item-wrapper';
                const name = product.detailed_name || product.name || 'N/A';
                const price = product.detailed_current_price || product.price || 'N/A';
                const rrpInfo = product.rrp_info || '';

                let secondaryInfoHtml = '';
                if (type === 'scraper') {
                    secondaryInfoHtml = `<span class="product-rrp-info">${rrpInfo}</span>`;
                } else if (type === 'trolley') {
                    secondaryInfoHtml = `<p class="product-quantity">Quantity: <strong>${product.quantity || 0}</strong></p>`;
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
                    if (priceContainer) {
                        priceContainer.insertAdjacentHTML('afterend', secondaryInfoHtml);
                        priceContainer.style.marginBottom = '4px';
                    }
                }

                container.appendChild(productDiv);
            } catch (e) {
                console.error('Error rendering product item:', e);
            }
        });
    }

    function createUI() {
        // Clean up existing UI if it exists
        if (uiPanel) uiPanel.remove();
        if (uiToggleButton) uiToggleButton.remove();
        cleanupEventListeners();

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
                <span>CW Scraper v2.6</span>
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
                        <label for="min-delay">Min Delay (ms)</label> <input type="number" id="min-delay" value="${settings.minDelay}" min="100" max="10000">
                        <label for="max-delay">Max Delay (ms)</label> <input type="number" id="max-delay" value="${settings.maxDelay}" min="100" max="10000">
                    </div>
                     <div class="settings-grid">
                        <label for="max-retries">Max Retries</label> <input type="number" id="max-retries" value="${settings.maxRetries}" min="0" max="10">
                        <label for="retry-delay">Retry Wait (ms)</label> <input type="number" id="retry-delay" value="${settings.retryDelay}" min="100" max="10000">
                    </div>
                    <div class="settings-grid">
                        <label for="include-prod-url">Include Product URL</label> <input type="checkbox" id="include-prod-url" ${settings.includeProductUrlOnCopy ? 'checked' : ''}>
                    </div>
                </details>
            </div>`;
        document.body.appendChild(uiPanel);

        // Add event listeners with cleanup tracking
        addEventListenerWithCleanup(uiToggleButton, 'click', togglePanel);
        addEventListenerWithCleanup(document.getElementById('close-panel-btn'), 'click', togglePanel);

        document.querySelectorAll('.tab-btn').forEach(btn => {
            addEventListenerWithCleanup(btn, 'click', () => switchTab(btn.dataset.tab));
        });

        addEventListenerWithCleanup(document.getElementById('clear-btn'), 'click', clearResults);
        addEventListenerWithCleanup(uiPanel, 'click', handleProductActions);
        addEventListenerWithCleanup(document.getElementById('export-main-btn'), 'click', handleExport);
        addEventListenerWithCleanup(document.getElementById('export-toggle-btn'), 'click', toggleExportMenu);

        document.querySelectorAll('.export-option').forEach(option => {
            addEventListenerWithCleanup(option, 'click', selectExportOption);
        });

        addEventListenerWithCleanup(document, 'click', (e) => {
            const container = document.querySelector('.export-btn-container');
            if (container && !container.contains(e.target)) {
                const menu = document.getElementById('export-menu');
                if (menu) menu.style.display = 'none';
            }
        });

        // Settings event listeners with validation and persistence
        const minDelayInput = document.getElementById('min-delay');
        const maxDelayInput = document.getElementById('max-delay');
        const maxRetriesInput = document.getElementById('max-retries');
        const retryDelayInput = document.getElementById('retry-delay');
        const includeUrlCheckbox = document.getElementById('include-prod-url');

        addEventListenerWithCleanup(minDelayInput, 'input', (e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value >= 100 && value <= 10000) {
                settings.minDelay = value;
                if (settings.minDelay > settings.maxDelay) {
                    settings.maxDelay = settings.minDelay;
                    maxDelayInput.value = settings.maxDelay;
                }
                saveSettings();
            }
        });

        addEventListenerWithCleanup(maxDelayInput, 'input', (e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value >= 100 && value <= 10000) {
                settings.maxDelay = value;
                if (settings.maxDelay < settings.minDelay) {
                    settings.minDelay = settings.maxDelay;
                    minDelayInput.value = settings.minDelay;
                }
                saveSettings();
            }
        });

        addEventListenerWithCleanup(maxRetriesInput, 'input', (e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value >= 0 && value <= 10) {
                settings.maxRetries = value;
                saveSettings();
            }
        });

        addEventListenerWithCleanup(retryDelayInput, 'input', (e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value >= 100 && value <= 10000) {
                settings.retryDelay = value;
                saveSettings();
            }
        });

        addEventListenerWithCleanup(includeUrlCheckbox, 'change', (e) => {
            settings.includeProductUrlOnCopy = e.target.checked;
            saveSettings();
        });

        makeDraggable(uiPanel, document.getElementById('cw-scraper-header'));
        updateUIForActiveTab();
    }

    function switchTab(tabId) {
        if (isOperationRunning) {
            alert('Please stop the current operation before switching tabs.');
            return;
        }

        activeTab = tabId;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab-content`);
        });

        updateUIForActiveTab();
    }

    function togglePanel() {
        isExpanded = !isExpanded;
        if (uiPanel && uiToggleButton) {
            uiPanel.style.display = isExpanded ? 'flex' : 'none';
            uiToggleButton.style.display = isExpanded ? 'none' : 'flex';
        }
    }

    function toggleOperationControls(isRunning) {
        isOperationRunning = isRunning;

        // Update abort controller
        if (isRunning) {
            abortController = new AbortController();
        } else if (abortController) {
            abortController.abort();
            abortController = null;
        }

        // Disable/enable buttons and controls
        document.querySelectorAll('#cw-scraper-panel .button-group button, #cw-scraper-panel .product-action-btn').forEach(btn => {
            if (!btn.classList.contains('stop-button')) {
                btn.disabled = isRunning;
            }
        });

        const settingsElement = document.getElementById('scraper-settings');
        if (settingsElement) {
            settingsElement.style.pointerEvents = isRunning ? 'none' : 'auto';
            settingsElement.style.opacity = isRunning ? '0.6' : '1';
        }

        // Handle stop buttons
        document.querySelectorAll('.stop-button').forEach(btn => {
            btn.style.display = isRunning ? 'inline-flex' : 'none';
            btn.disabled = !isRunning;
        });
    }

    function updateUIForActiveTab() {
        if (activeTab === 'scraper') {
            updateScraperActionButtons();
            updateScraperResultsDisplay();
        } else if (activeTab === 'trolley') {
            updateTrolleyActionButtons();
            updateTrolleyResultsDisplay();
        }
    }

    function updateScraperActionButtons() {
        const pageType = detectPageType();
        const container = document.getElementById('scraper-tab-action-buttons');
        if (!container) return;

        // Clear existing content and event listeners
        container.innerHTML = '';

        if (pageType === 'product-list') {
            container.innerHTML = `
                <button id="scraper-scrape-current-btn">${icons.scrapePage} Scrape Current View</button>
                <button id="scraper-scrape-all-btn">${icons.scrapeAll} Scrape All Pages</button>
                <button id="scraper-fetch-details-btn">${icons.fetchDetails} Fetch Details</button>
                <button class="stop-button" style="display: none;">${icons.stop} Stop</button>
            `;

            addEventListenerWithCleanup(container.querySelector('#scraper-scrape-current-btn'), 'click', handleScrapeCurrentPage);
            addEventListenerWithCleanup(container.querySelector('#scraper-scrape-all-btn'), 'click', handleScrapeAllPages);
            addEventListenerWithCleanup(container.querySelector('#scraper-fetch-details-btn'), 'click', handleFetchScraperDetails);
        } else if (pageType === 'product-detail') {
            container.innerHTML = `
                <button id="scraper-scrape-detail-btn">${icons.scrapePage} Scrape This Product</button>
            `;

            addEventListenerWithCleanup(container.querySelector('#scraper-scrape-detail-btn'), 'click', handleScrapeDetailPage);
        } else {
            container.innerHTML = `<div class="info-message">Navigate to a product or search page.</div>`;
        }

        const stopButton = container.querySelector('.stop-button');
        if (stopButton) {
            addEventListenerWithCleanup(stopButton, 'click', handleStopOperation);
        }
    }

    function updateTrolleyActionButtons() {
        const container = document.getElementById('trolley-tab-action-buttons');
        if (!container) return;

        container.innerHTML = `
            <button id="trolley-scrape-btn">${icons.trolley} Scrape Cart</button>
            <button class="stop-button" style="display: none;">${icons.stop} Stop</button>
        `;

        addEventListenerWithCleanup(container.querySelector('#trolley-scrape-btn'), 'click', handleScrapeTrolley);
        addEventListenerWithCleanup(container.querySelector('.stop-button'), 'click', handleStopOperation);
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
    function handleStopOperation() {
        isOperationRunning = false;
        if (abortController) {
            abortController.abort();
        }

        const scraperStatus = document.getElementById('scraper-tab-status');
        const trolleyStatus = document.getElementById('trolley-tab-status');

        if (scraperStatus) scraperStatus.textContent = "Operation stopped by user.";
        if (trolleyStatus) trolleyStatus.textContent = "Operation stopped by user.";

        toggleOperationControls(false);
    }

    function handleScrapeCurrentPage() {
        if (isOperationRunning) return;

        const statusArea = document.getElementById('scraper-tab-status');
        if (statusArea) statusArea.textContent = 'Scraping current page...';

        try {
            const newProducts = scrapeSearchPage();
            // Remove duplicates based on product_url
            const uniqueProducts = newProducts.filter(newProduct =>
                !scrapedProducts.some(existing => existing.product_url === newProduct.product_url)
            );

            scrapedProducts.push(...uniqueProducts);
            updateScraperResultsDisplay();

            if (statusArea) {
                statusArea.textContent = `Scraped ${newProducts.length} products (${uniqueProducts.length} new).`;
            }
        } catch (e) {
            console.error('Error scraping current page:', e);
            if (statusArea) statusArea.textContent = `Error: ${e.message}`;
        }
    }

    function handleScrapeDetailPage() {
        if (isOperationRunning) return;

        const statusArea = document.getElementById('scraper-tab-status');
        if (statusArea) statusArea.textContent = 'Scraping this product page...';

        try {
            const newProduct = scrapeProductDetailPage(document);
            newProduct.product_url = window.location.href;

            if (newProduct.detail_error && !newProduct.detailed_name) {
                if (statusArea) statusArea.textContent = `Scraping failed: ${newProduct.detail_error}`;
                return;
            }

            const existingProductIndex = scrapedProducts.findIndex(p => p.product_url === newProduct.product_url);

            if (existingProductIndex !== -1) {
                scrapedProducts[existingProductIndex] = newProduct;
                if (statusArea) statusArea.textContent = 'Product details updated in the list.';
            } else {
                scrapedProducts.unshift(newProduct);
                if (statusArea) statusArea.textContent = 'Product added to the list.';
            }

            updateScraperResultsDisplay();
        } catch (e) {
            console.error('Error scraping product detail:', e);
            if (statusArea) statusArea.textContent = `Error: ${e.message}`;
        }
    }

    async function handleScrapeTrolley() {
        if (isOperationRunning) return;

        const statusArea = document.getElementById('trolley-tab-status');
        if (statusArea) statusArea.textContent = 'Opening cart and scraping...';

        try {
            const cartButton = document.querySelector('[data-cy="cart-button-desktop"]');
            if (!cartButton) {
                if (statusArea) statusArea.textContent = 'Could not find cart button.';
                return;
            }

            cartButton.click();

            await waitForElement('div[role="dialog"][data-state="open"] ul[data-cy="cart-items"]', 5000);
            await sleepFixed(500);

            const result = scrapeTrolley();

            if (result.error) {
                if (statusArea) statusArea.textContent = result.error;
            } else {
                trolleyProducts = result.products;
                if (statusArea) statusArea.textContent = `Scraped ${trolleyProducts.length} items.`;
            }

            // Auto-close the cart dialog after scraping
            const closeButton = document.querySelector('div[role="dialog"][data-state="open"] button[type="button"] svg[data-cy="x-mark-icon"]');
            if (closeButton) {
                const buttonElement = closeButton.closest('button');
                if (buttonElement) {
                    await sleepFixed(500);
                    buttonElement.click();
                    if (statusArea && !result.error) {
                        statusArea.textContent = statusArea.textContent + ' Cart closed.';
                    }
                }
            }
        } catch (error) {
            console.error('Error scraping trolley:', error);
            if (statusArea) statusArea.textContent = 'Failed to load cart content.';
        } finally {
            updateTrolleyResultsDisplay();
        }
    }

    async function runFetchWithRetries(url, statusAreaElement, originalStatus) {
        let lastError = null;

        for (let i = 0; i <= settings.maxRetries; i++) {
            if (!isOperationRunning || abortController?.signal.aborted) {
                return { error: new Error("Operation stopped") };
            }

            try {
                const response = await fetch(url, {
                    signal: abortController?.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();
                const doc = new DOMParser().parseFromString(text, 'text/html');
                return { doc };
            } catch (e) {
                lastError = e;

                if (e.name === 'AbortError') {
                    return { error: new Error("Operation stopped") };
                }

                if (i < settings.maxRetries) {
                    if (statusAreaElement) {
                        statusAreaElement.textContent = `Fetch failed. Retrying... (${i + 1}/${settings.maxRetries})`;
                    }
                    await sleepFixed(settings.retryDelay);
                    if (statusAreaElement) {
                        statusAreaElement.textContent = originalStatus;
                    }
                }
            }
        }

        return { error: lastError };
    }

    async function fetchSingleWithRetries(url) {
        let lastError = null;

        for (let i = 0; i <= settings.maxRetries; i++) {
            if (abortController?.signal.aborted) {
                return { error: new Error("Operation stopped") };
            }

            try {
                const response = await fetch(url, {
                    signal: abortController?.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();
                const doc = new DOMParser().parseFromString(text, 'text/html');
                return { doc };
            } catch (e) {
                lastError = e;

                if (e.name === 'AbortError') {
                    return { error: new Error("Operation stopped") };
                }

                if (i < settings.maxRetries) {
                    await sleepFixed(settings.retryDelay);
                }
            }
        }

        return { error: lastError };
    }

    async function handleScrapeAllPages() {
        if (isOperationRunning) return;

        toggleOperationControls(true);
        scrapedProducts = [];

        const statusArea = document.getElementById('scraper-tab-status');
        const progressBar = document.getElementById('scraper-tab-progress-bar');

        updateScraperResultsDisplay();
        if (progressBar) progressBar.style.display = 'none';

        try {
            let pageCount = 1;

            while (isOperationRunning && !abortController?.signal.aborted) {
                if (statusArea) statusArea.textContent = `Scraping page ${pageCount}...`;
                await sleepFixed(500);

                const newProducts = scrapeSearchPage(document);

                // Add only new products to avoid duplicates
                const uniqueNewProducts = newProducts.filter(p =>
                    !scrapedProducts.some(sp => sp.product_url === p.product_url)
                );

                scrapedProducts.push(...uniqueNewProducts);
                updateScraperResultsDisplay();

                if (statusArea) {
                    statusArea.textContent = `Page ${pageCount} scraped. Total: ${scrapedProducts.length}. Looking for next page...`;
                }

                const nextButton = document.querySelector('nav[aria-label="pagination"] a[aria-label="Go to next page"]:not([aria-disabled="true"])');

                if (nextButton && isOperationRunning) {
                    try {
                        const updatePromise = waitForProductGridUpdate();
                        nextButton.click();

                        if (statusArea) statusArea.textContent = `Loading page ${pageCount + 1}...`;

                        await updatePromise;
                        await sleepFixed(1000);
                        pageCount++;
                    } catch (error) {
                        if (statusArea) statusArea.textContent = `Error: ${error.message}`;
                        console.error('Page navigation error:', error);
                        break;
                    }
                } else {
                    if (statusArea) {
                        statusArea.textContent = `Finished. No more pages found. Scraped a total of ${scrapedProducts.length} products.`;
                    }
                    break;
                }
            }

            if (!isOperationRunning || abortController?.signal.aborted) {
                if (statusArea) statusArea.textContent = `Scraping stopped. Found ${scrapedProducts.length} products.`;
            }
        } catch (e) {
            console.error("Error during page scraping loop:", e);
            if (statusArea) statusArea.textContent = `An unexpected error occurred: ${e.message}`;
        } finally {
            toggleOperationControls(false);
            if (progressBar) progressBar.style.display = 'none';
        }
    }

    async function runDetailFetchProcess(productList, statusAreaElement, progressBarElement, updateDisplayFunc) {
        if (isOperationRunning || productList.length === 0) return;

        toggleOperationControls(true);
        const total = productList.length;

        if (statusAreaElement) {
            statusAreaElement.textContent = `Starting to fetch details for ${total} products...`;
        }

        if (progressBarElement) {
            progressBarElement.style.display = 'block';
            progressBarElement.value = 0;
            progressBarElement.max = total;
        }

        try {
            for (let i = 0; i < total; i++) {
                if (!isOperationRunning || abortController?.signal.aborted) break;

                const product = productList[i];

                if (progressBarElement) progressBarElement.value = i + 1;

                if (!product.product_url || product.product_url === 'N/A' || product.product_url.includes('Not available')) {
                    product.detail_error = "No URL to fetch details from.";
                    continue;
                }

                const originalStatus = `(${i + 1}/${total}) Fetching: ${(product.name || '').substring(0, 30)}...`;
                if (statusAreaElement) statusAreaElement.textContent = originalStatus;

                const { doc, error } = await runFetchWithRetries(product.product_url, statusAreaElement, originalStatus);

                if (error) {
                    product.detail_error = `Fetch failed: ${error.message}`;
                } else {
                    Object.assign(product, scrapeProductDetailPage(doc));
                }

                updateDisplayFunc();

                if (isOperationRunning && i < total - 1) {
                    await sleepRandom();
                }
            }

            if (statusAreaElement) {
                statusAreaElement.textContent = isOperationRunning && !abortController?.signal.aborted
                    ? 'Finished fetching all details.'
                    : 'Fetching stopped by user.';
            }
        } finally {
            toggleOperationControls(false);
            if (progressBarElement) progressBarElement.style.display = 'none';
        }
    }

    async function handleFetchScraperDetails() {
        const statusArea = document.getElementById('scraper-tab-status');
        const progressBar = document.getElementById('scraper-tab-progress-bar');
        await runDetailFetchProcess(scrapedProducts, statusArea, progressBar, updateScraperResultsDisplay);
    }

    async function handleProductActions(e) {
        if (isOperationRunning) return;

        const deleteBtn = e.target.closest('.product-delete-btn');
        const copyBtn = e.target.closest('.product-copy-btn');
        const expandBtn = e.target.closest('.product-expand-btn');
        const retryBtn = e.target.closest('.product-retry-btn');

        if (retryBtn) {
            const productWrapper = e.target.closest('.product-item-wrapper');
            if (!productWrapper) return;

            const expandBtnFromWrapper = productWrapper.querySelector('.product-expand-btn');
            const detailsContainer = productWrapper.querySelector('.product-details-expanded');
            const index = parseInt(retryBtn.dataset.productIndex, 10);
            const tabType = retryBtn.dataset.tabType;

            if (!isNaN(index) && detailsContainer && expandBtnFromWrapper && tabType === 'scraper') {
                await fetchAndDisplaySingleDetail(index, tabType, detailsContainer, expandBtnFromWrapper);
            }
            return;
        }

        if (!deleteBtn && !copyBtn && !expandBtn) return;

        const productItem = e.target.closest('.product-item');
        if (!productItem) return;

        const index = parseInt(productItem.dataset.productIndex, 10);
        const tabType = productItem.dataset.tabType;

        if (isNaN(index)) return;

        const productList = tabType === 'scraper' ? scrapedProducts : trolleyProducts;
        const product = productList[index];

        if (!product) return;

        if (deleteBtn) {
            productList.splice(index, 1);
            if (tabType === 'scraper') {
                updateScraperResultsDisplay();
            } else {
                updateTrolleyResultsDisplay();
            }
        } else if (copyBtn) {
            try {
                GM_setClipboard(JSON.stringify(product, null, 2));
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = icons.check;

                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = icons.copy;
                }, 1500);
            } catch (e) {
                console.error('Failed to copy to clipboard:', e);
            }
        } else if (expandBtn) {
            const wrapper = e.target.closest('.product-item-wrapper');
            const detailsContainer = wrapper?.querySelector('.product-details-expanded');

            if (!detailsContainer) return;

            const isVisible = detailsContainer.style.display !== 'none';

            if (isVisible) {
                detailsContainer.style.display = 'none';
                expandBtn.innerHTML = icons.expand;
            } else {
                if (tabType === 'trolley') {
                    product.detail_error = "Details cannot be fetched from the cart. Please use the Scraper tab for full details.";
                    renderExpandedDetails(detailsContainer, product, index, tabType);
                    detailsContainer.style.display = 'block';
                    expandBtn.innerHTML = icons.collapse;
                    return;
                }

                if (product.detailed_name || product.detail_error) {
                    renderExpandedDetails(detailsContainer, product, index, tabType);
                    detailsContainer.style.display = 'block';
                    expandBtn.innerHTML = icons.collapse;
                } else {
                    await fetchAndDisplaySingleDetail(index, tabType, detailsContainer, expandBtn);
                }
            }
        }
    }

    async function fetchAndDisplaySingleDetail(index, tabType, detailsContainer, expandBtn) {
        const productList = tabType === 'scraper' ? scrapedProducts : trolleyProducts;
        const product = productList[index];

        if (!product.product_url || product.product_url.includes('N/A')) {
            product.detail_error = "No URL to fetch.";
            renderExpandedDetails(detailsContainer, product, index, tabType);
            detailsContainer.style.display = 'block';
            expandBtn.innerHTML = icons.collapse;
            return;
        }

        detailsContainer.innerHTML = `<div class="details-loading">Fetching details...</div>`;
        detailsContainer.style.display = 'block';
        expandBtn.disabled = true;

        const { doc, error } = await fetchSingleWithRetries(product.product_url);

        if (error) {
            Object.assign(product, { detail_error: `Fetch failed: ${error.message}` });
        } else {
            Object.assign(product, scrapeProductDetailPage(doc));
        }

        renderExpandedDetails(detailsContainer, product, index, tabType);
        expandBtn.innerHTML = icons.collapse;
        expandBtn.disabled = false;
    }

    function renderExpandedDetails(container, product, index, tabType) {
        if (!container || !product) return;

        const keysToIgnore = new Set(['name', 'price', 'rrp_info', 'product_url', 'itemTotal', 'quantity', 'itemPrice']);
        let html = '<dl class="details-dl">';

        const keyOrder = [
            'detailed_name', 'brand', 'description', 'detailed_current_price',
            'detailed_original_price', 'savings', 'rating', 'review_count',
            'product_id', 'ingredients', 'directions', 'warnings', 'detail_error'
        ];

        keyOrder.forEach(key => {
            const value = product[key];
            if (value && !keysToIgnore.has(key) && String(value).trim() !== '') {
                const prettyKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let formattedValue = String(value).replace(/\n/g, '<br>');

                if (key === 'detail_error' && index !== undefined && tabType === 'scraper') {
                    formattedValue += ` <button class="product-retry-btn" data-product-index="${index}" data-tab-type="${tabType}" title="Retry Fetching Details">${icons.fetchDetails} Retry</button>`;
                }

                html += `<dt>${prettyKey}</dt><dd>${formattedValue}</dd>`;
            }
        });

        html += '</dl>';
        container.innerHTML = html;
    }

    // --- EXPORT & MENU FUNCTIONS ---
    function toggleExportMenu() {
        const menu = document.getElementById('export-menu');
        if (menu) {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    }

    function executeExportAction(action) {
        switch (action) {
            case 'copy-json': exportJSON(false); break;
            case 'download-json': exportJSON(true); break;
            case 'copy-csv': exportCSV(false); break;
            case 'download-csv': exportCSV(true); break;
            case 'copy-md': exportMarkdown(false); break;
            case 'download-md': exportMarkdown(true); break;
            default:
                console.warn('Unknown export action:', action);
        }
    }

    function selectExportOption(e) {
        const action = e.currentTarget.dataset.action;
        const mainBtn = document.getElementById('export-main-btn');
        const menu = document.getElementById('export-menu');

        if (mainBtn && menu) {
            mainBtn.innerHTML = e.currentTarget.innerHTML;
            mainBtn.dataset.action = action;
            menu.style.display = 'none';
            executeExportAction(action);
        }
    }

    function handleExport() {
        const mainBtn = document.getElementById('export-main-btn');
        if (mainBtn) {
            executeExportAction(mainBtn.dataset.action);
        }
    }

    function downloadFile(filename, content, mimeType) {
        try {
            const blob = new Blob([content], { type: mimeType });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch (e) {
            console.error('Failed to download file:', e);
            alert('Failed to download file. Please try copying instead.');
        }
    }

    function prepareDataForExport() {
        const sourceData = activeTab === 'scraper' ? scrapedProducts : trolleyProducts;
        const exportData = sourceData.map(p => {
            const newProd = { ...p };
            if (!settings.includeProductUrlOnCopy) {
                delete newProd.product_url;
            }
            return newProd;
        });

        const result = { items: exportData };

        if (activeTab === 'trolley' && trolleyProducts.length > 0) {
            const total = trolleyProducts.reduce((acc, p) => acc + (p.itemTotal || 0), 0);
            result.totalPrice = parseFloat(total.toFixed(2));
            result.totalPriceFormatted = `$${total.toFixed(2)}`;
        }

        return result;
    }

    function showCopyFeedback(buttonId) {
        const btn = document.getElementById(buttonId);
        if (!btn) return;

        const originalHTML = btn.innerHTML;
        const originalAction = btn.dataset.action;

        btn.innerHTML = `${icons.check} Copied`;
        btn.classList.add('copied-success');
        btn.disabled = true;

        const toggleBtn = document.getElementById('export-toggle-btn');
        if (toggleBtn) toggleBtn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.dataset.action = originalAction;
            btn.classList.remove('copied-success');
            btn.disabled = false;
            if (toggleBtn) toggleBtn.disabled = false;
        }, 2000);
    }

    function exportJSON(download = false) {
        const data = prepareDataForExport();

        if (data.items.length === 0) {
            alert('No data to export.');
            return;
        }

        try {
            const jsonString = JSON.stringify(data, null, 2);

            if (download) {
                const filename = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.json`;
                downloadFile(filename, jsonString, 'application/json');
            } else {
                GM_setClipboard(jsonString);
                showCopyFeedback('export-main-btn');
            }
        } catch (e) {
            console.error('Export JSON failed:', e);
            alert('Failed to export JSON data.');
        }
    }

    function exportCSV(download = false) {
        const { items, totalPriceFormatted } = prepareDataForExport();

        if (items.length === 0) {
            alert('No data to export.');
            return;
        }

        try {
            let csvContent = totalPriceFormatted ? `Total Price,"${totalPriceFormatted}"\n\n` : '';

            // Get all unique headers from all items
            const headers = Array.from(new Set(items.flatMap(Object.keys)));
            csvContent += headers.join(',') + '\n';

            // Add data rows
            items.forEach(product => {
                const row = headers.map(header => {
                    let value = String(product[header] || '').replace(/"/g, '""');
                    return (value.includes(',') || value.includes('\n') || value.includes('"')) ? `"${value}"` : value;
                }).join(',');
                csvContent += row + '\n';
            });

            if (download) {
                const filename = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.csv`;
                downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
            } else {
                GM_setClipboard(csvContent);
                showCopyFeedback('export-main-btn');
            }
        } catch (e) {
            console.error('Export CSV failed:', e);
            alert('Failed to export CSV data.');
        }
    }

    function exportMarkdown(download = false) {
        const data = prepareDataForExport();
        const sourceData = data.items;

        if (sourceData.length === 0) {
            alert('No data to export.');
            return;
        }

        try {
            let md = `# ${activeTab === 'trolley' ? 'Chemist Warehouse Cart' : 'Chemist Warehouse Products'}\n\n`;

            sourceData.forEach(p => {
                const title = p.detailed_name || p.name || 'Unknown Product';
                md += `## ${title}\n\n`;
                md += `| Attribute | Value |\n|---|---|\n`;

                const keyOrder = [
                    'detailed_name', 'brand', 'description', 'detailed_current_price',
                    'price', 'detailed_original_price', 'savings', 'rrp_info', 'quantity',
                    'itemPrice', 'rating', 'review_count', 'product_id', 'ingredients',
                    'directions', 'warnings', 'product_url', 'detail_error'
                ];

                keyOrder.forEach(key => {
                    const value = p[key];
                    if (value && String(value).trim() !== '' && !['name'].includes(key)) {
                        const keyFormatted = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        let formattedValue = value;

                        if (key === 'itemTotal' && typeof value === 'number') {
                            formattedValue = `$${value.toFixed(2)}`;
                        }

                        const escapedValue = String(formattedValue)
                            .replace(/\|/g, '\\|')
                            .replace(/\n/g, '<br>');

                        md += `| **${keyFormatted}** | ${escapedValue} |\n`;
                    }
                });

                md += `\n---\n\n`;
            });

            if (data.totalPriceFormatted) {
                md += `\n**Grand Total: ${data.totalPriceFormatted}**\n`;
            }

            if (download) {
                const filename = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.md`;
                downloadFile(filename, md, 'text/markdown;charset=utf-8;');
            } else {
                GM_setClipboard(md);
                showCopyFeedback('export-main-btn');
            }
        } catch (e) {
            console.error('Export Markdown failed:', e);
            alert('Failed to export Markdown data.');
        }
    }

    function clearResults() {
        if (isOperationRunning) {
            alert('Cannot clear results while an operation is running.');
            return;
        }

        if (activeTab === 'scraper') {
            scrapedProducts = [];
        } else {
            trolleyProducts = [];
        }

        updateUIForActiveTab();
    }

    function makeDraggable(element, handle) {
        if (!element || !handle) return;

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        const mouseDownHandler = (e) => {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;

            const mouseMoveHandler = (e) => {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;

                const newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, element.offsetTop - pos2));
                const newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, element.offsetLeft - pos1));

                element.style.top = newTop + "px";
                element.style.left = newLeft + "px";
            };

            const mouseUpHandler = () => {
                document.removeEventListener('mouseup', mouseUpHandler);
                document.removeEventListener('mousemove', mouseMoveHandler);
            };

            document.addEventListener('mouseup', mouseUpHandler);
            document.addEventListener('mousemove', mouseMoveHandler);
        };

        handle.addEventListener('mousedown', mouseDownHandler);

        // Track for cleanup
        eventListeners.push({
            element: handle,
            event: 'mousedown',
            handler: mouseDownHandler,
            options: false
        });
    }

    function setupPageChangeMonitoring() {
        let currentUrl = window.location.href;

        const observer = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;

                // Debounce the update to avoid excessive calls
                setTimeout(() => {
                    if (!isOperationRunning && window.location.href === currentUrl) {
                        updateUIForActiveTab();
                    }
                }, 1500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also listen for popstate events
        const popstateHandler = () => {
            setTimeout(() => {
                if (!isOperationRunning) {
                    updateUIForActiveTab();
                }
            }, 1500);
        };

        window.addEventListener('popstate', popstateHandler);

        // Track for cleanup
        eventListeners.push({
            element: window,
            event: 'popstate',
            handler: popstateHandler,
            options: false
        });
    }

    // --- CSS STYLES ---
    GM_addStyle(`
        :root {
            --cw-blue: #0054a6;
            --cw-blue-dark: #003e7a;
            --cw-red: #e31c23;
            --cw-text-primary: #1a1a1a;
            --cw-text-secondary: #595959;
            --cw-border-light: #e0e0e0;
            --cw-background-light: #f7f7f7;
            --cw-stop-blue: #007bff;
            --cw-green-success: #28a745;
        }

        #cw-scraper-toggle {
            position: fixed;
            top: 150px;
            right: 0;
            width: 48px;
            height: 48px;
            background-color: var(--cw-blue);
            color: white;
            border-radius: 8px 0 0 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: -2px 2px 8px rgba(0,0,0,0.2);
            z-index: 100001;
            transition: all 0.2s ease;
            user-select: none;
        }

        #cw-scraper-toggle:hover {
            background-color: var(--cw-blue-dark);
            width: 52px;
        }

        #cw-scraper-toggle svg {
            width: 28px;
            height: 28px;
        }

        #cw-scraper-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 540px;
            max-width: 95vw;
            max-height: 90vh;
            background-color: #fff;
            border: 1px solid var(--cw-border-light);
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            z-index: 100001;
            display: flex;
            flex-direction: column;
            font-family: Outfit, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        #cw-scraper-header {
            padding: 12px 18px;
            cursor: move;
            background-color: #fff;
            color: var(--cw-text-primary);
            font-weight: 600;
            font-size: 16px;
            border-bottom: 1px solid var(--cw-border-light);
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #close-panel-btn {
            background: none;
            border: none;
            color: var(--cw-text-secondary);
            font-size: 24px;
            cursor: pointer;
            padding: 0 5px;
            line-height: 1;
            opacity: 0.8;
            transition: all 0.2s;
        }

        #close-panel-btn:hover {
            opacity: 1;
            transform: scale(1.1);
        }

        #cw-scraper-tabs {
            display: flex;
            border-bottom: 1px solid var(--cw-border-light);
            background-color: var(--cw-background-light);
        }

        .tab-btn {
            padding: 12px 20px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            color: var(--cw-text-secondary);
            border-bottom: 3px solid transparent;
            transition: all 0.2s ease;
            flex-grow: 1;
        }

        .tab-btn:hover {
            background-color: #e9e9e9;
        }

        .tab-btn.active {
            color: var(--cw-blue);
            border-bottom-color: var(--cw-blue);
        }

        #cw-scraper-content {
            padding: 18px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .tab-content {
            display: none;
            flex-direction: column;
            gap: 15px;
        }

        .tab-content.active {
            display: flex;
        }

        .product-list-container {
            width: 100%;
            height: 300px;
            background-color: #f8f9fa;
            border: 1px solid var(--cw-border-light);
            border-radius: 6px;
            padding: 8px;
            box-sizing: border-box;
            resize: vertical;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .product-item-wrapper {
            background-color: #fff;
            border: 1px solid #e9e9e9;
            border-radius: 4px;
        }

        .product-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
        }

        .product-item-details {
            flex: 1;
            min-width: 0;
        }

        .product-name {
            font-weight: 500;
            color: var(--cw-text-primary);
            margin: 0 0 4px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 14px;
        }

        .product-price {
            font-weight: 700;
            color: var(--cw-red);
            margin: 0;
            font-size: 15px;
            display: inline;
        }

        .product-rrp-info {
            font-weight: 400;
            color: var(--cw-text-secondary);
            font-size: 12px;
            margin-left: 8px;
        }

        .product-quantity {
            font-size: 13px;
            color: var(--cw-text-secondary);
            margin: 0;
        }

        .product-item-actions {
            display: flex;
            gap: 5px;
            align-items: center;
        }

        .product-action-btn {
            background-color: #f0f0f0;
            border: 1px solid #e0e0e0;
            color: var(--cw-text-secondary);
            width: 28px;
            height: 28px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .product-action-btn:hover:not(:disabled) {
            background-color: #e0e0e0;
            color: var(--cw-text-primary);
        }

        .product-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .product-action-btn svg {
            width: 15px;
            height: 15px;
        }

        .product-delete-btn:hover:not(:disabled) {
            background-color: #ffebee;
            color: #c62828;
        }

        .product-copy-btn.copied {
            background-color: var(--cw-green-success) !important;
            color: white !important;
        }

        .product-details-expanded {
            padding: 12px 15px;
            border-top: 1px solid #f0f0f0;
            background-color: #fafafa;
            font-size: 13px;
        }

        .details-loading {
            font-style: italic;
            color: var(--cw-text-secondary);
        }

        .details-dl {
            margin: 0;
            display: grid;
            grid-template-columns: 120px 1fr;
            gap: 8px;
        }

        .details-dl dt {
            font-weight: 600;
            color: var(--cw-text-primary);
        }

        .details-dl dd {
            margin: 0;
            color: var(--cw-text-secondary);
            word-break: break-word;
        }
        
        .product-retry-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 600;
            padding: 3px 8px;
            margin-left: 8px;
            vertical-align: middle;
            background-color: #f0f0f0;
            border: 1px solid #d0d0d0;
            color: var(--cw-text-secondary);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .product-retry-btn:hover {
            background-color: #e0e0e0;
            color: var(--cw-text-primary);
            border-color: #c0c0c0;
        }

        .product-retry-btn svg {
            width: 14px;
            height: 14px;
            stroke-width: 2;
        }

        #trolley-total-price {
            padding: 12px 18px;
            background-color: var(--cw-background-light);
            border: 1px solid var(--cw-border-light);
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 16px;
            font-weight: 600;
            color: var(--cw-text-primary);
        }

        .total-price-value {
            font-size: 18px;
            font-weight: 700;
            color: var(--cw-red);
        }

        .status-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        #scraper-tab-status, #trolley-tab-status {
            font-style: italic;
            color: var(--cw-text-secondary);
            min-height: 1.2em;
            font-size: 14px;
        }

        progress {
            width: 100%;
            height: 8px;
            border-radius: 4px;
            border: none;
            appearance: none;
        }

        progress::-webkit-progress-bar {
            background-color: #e9ecef;
            border-radius: 4px;
        }

        progress::-webkit-progress-value {
            background-color: var(--cw-blue);
            border-radius: 4px;
            transition: width 0.3s ease;
        }

        .button-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
        }

        .button-group.export-group {
            border-top: 1px solid var(--cw-border-light);
            padding-top: 15px;
            justify-content: space-between;
        }

        .button-group button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 8px 16px;
            border: 1px solid transparent;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 14px;
            font-weight: 600;
            line-height: 1;
        }

        .button-group button:hover:not(:disabled) {
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        .button-group button:disabled {
            background-color: #e0e0e0 !important;
            color: #a0a0a0 !important;
            cursor: not-allowed;
            box-shadow: none;
            border-color: #e0e0e0 !important;
        }

        .button-group button svg {
            width: 16px;
            height: 16px;
            stroke-width: 2.5;
            stroke: currentColor;
        }

        #scraper-scrape-all-btn, #scraper-fetch-details-btn {
            background-color: var(--cw-blue);
            color: white;
        }

        #scraper-scrape-all-btn:hover:not(:disabled), #scraper-fetch-details-btn:hover:not(:disabled) {
            background-color: var(--cw-blue-dark);
        }

        #scraper-scrape-current-btn, #scraper-scrape-detail-btn, #trolley-scrape-btn {
            background-color: #fff;
            color: var(--cw-blue);
            border: 1px solid var(--cw-blue);
        }

        #scraper-scrape-current-btn:hover:not(:disabled), #scraper-scrape-detail-btn:hover:not(:disabled), #trolley-scrape-btn:hover:not(:disabled) {
            background-color: #f0f6ff;
        }

        #clear-btn {
            background-color: var(--cw-text-secondary);
            color: white;
            border-color: var(--cw-text-secondary);
        }

        #clear-btn:hover:not(:disabled) {
            background-color: var(--cw-text-primary);
            border-color: var(--cw-text-primary);
        }

        .stop-button {
            background-color: var(--cw-stop-blue);
            color: white;
            border-color: var(--cw-stop-blue);
        }

        .stop-button:hover:not(:disabled) {
            background-color: #0069d9;
            border-color: #0069d9;
        }

        .export-btn-container {
            position: relative;
            display: flex;
        }

        #export-main-btn {
            border-radius: 4px 0 0 4px;
            border-right: none;
            background-color: var(--cw-green-success);
            color: white;
            border-color: var(--cw-green-success);
        }

        #export-main-btn:hover:not(:disabled) {
            background-color: #218838;
        }

        #export-main-btn.copied-success {
            background-color: #218838 !important;
        }

        #export-toggle-btn {
            padding: 8px 10px;
            border-radius: 0 4px 4px 0;
            border: 1px solid var(--cw-green-success);
            background-color: var(--cw-green-success);
            color: white;
            font-size: 10px;
            margin-left: -1px;
        }

        #export-toggle-btn:hover:not(:disabled) {
            background-color: #218838;
        }

        #export-menu {
            position: absolute;
            bottom: 110%;
            left: 0;
            background-color: #fff;
            border: 1px solid var(--cw-border-light);
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10;
            width: 220px;
            overflow: hidden;
        }

        .export-option {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 14px;
            color: var(--cw-text-primary);
            transition: background-color 0.2s;
        }

        .export-option:hover {
            background-color: var(--cw-background-light);
        }

        .export-option svg {
            width: 16px;
            height: 16px;
            stroke-width: 2;
            color: var(--cw-text-secondary);
        }

        #scraper-settings {
            border: 1px solid var(--cw-border-light);
            border-radius: 6px;
            background-color: #fff;
            transition: opacity 0.3s;
            margin-top: 5px;
        }

        #scraper-settings summary {
            font-weight: 600;
            cursor: pointer;
            padding: 12px 15px;
            color: var(--cw-text-primary);
            border-radius: 6px;
            position: relative;
        }

        #scraper-settings summary:hover {
            background-color: var(--cw-background-light);
        }

        #scraper-settings > div {
            padding: 15px;
        }

        .settings-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px 15px;
            align-items: center;
            font-size: 14px;
        }

        .settings-grid:not(:last-child) {
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 15px;
            margin-bottom: 15px;
        }

        .settings-grid label {
            justify-self: start;
            color: var(--cw-text-secondary);
        }

        .settings-grid input[type="number"] {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 14px;
        }

        .settings-grid input[type="number"]:focus {
            border-color: var(--cw-blue);
            outline: none;
            box-shadow: 0 0 0 2px rgba(0, 84, 166, 0.2);
        }

        .settings-grid input[type="checkbox"] {
            justify-self: start;
            width: 20px;
            height: 20px;
            accent-color: var(--cw-blue);
        }

        .info-message {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
            color: #666;
            font-style: italic;
            text-align: center;
            padding: 20px;
            background-color: transparent;
        }
    `);

    // --- INITIALIZATION ---
    function initialize() {
        console.log('Chemist Warehouse Scraper: Initializing...');

        // Load saved settings
        loadSettings();

        // Create UI
        createUI();

        // Setup page monitoring
        setupPageChangeMonitoring();

        // Set initial tab
        switchTab('scraper');

        console.log('Chemist Warehouse Scraper v2.6: Ready!');
    }

    // Cleanup function for page unload
    function cleanup() {
        cleanupEventListeners();
        if (abortController) {
            abortController.abort();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initialize();
    } else {
        window.addEventListener('DOMContentLoaded', initialize);
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
})();