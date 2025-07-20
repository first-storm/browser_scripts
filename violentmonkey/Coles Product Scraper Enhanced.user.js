// ==UserScript==
// @name         Coles Scraper
// @namespace    http://tampermonkey.net/
// @version      6.2
// @description  A comprehensive Coles tool with a tabbed UI for scraping products, including detailed data fetching, an interactive visual list display, and multiple export formats (JSON, CSV, Markdown).
// @author       Artificial Intelligence LOL & Gemini
// @match        https://www.coles.com.au/*
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
    let scrapedProducts = []; // Stores products for the Scraper tab
    let trolleyProducts = []; // Stores products for the Trolley tab
    let isExpanded = false;
    let isOperationRunning = false;
    let activeTab = 'scraper'; // 'scraper' or 'trolley'
    let operationAbortController = null; // For stopping operations

    // --- SETTINGS STATE ---
    let settings = {
        minDelay: 800,
        maxDelay: 1500,
        maxRetries: 3,
        retryDelay: 2000,
        includeImageUrlOnCopy: true,
        includeProductUrlOnCopy: true,
    };

    // --- UTILITY FUNCTIONS & CLIPBOARD HELPER ---
    const sleepRandom = () => {
        const delay = Math.random() * (settings.maxDelay - settings.minDelay) + settings.minDelay;
        return new Promise(resolve => setTimeout(resolve, delay));
    };
    const sleepFixed = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Validate settings to prevent invalid values
    function validateSettings() {
        settings.minDelay = Math.max(100, Math.min(settings.minDelay, 10000));
        settings.maxDelay = Math.max(settings.minDelay, Math.min(settings.maxDelay, 10000));
        settings.maxRetries = Math.max(0, Math.min(settings.maxRetries, 10));
        settings.retryDelay = Math.max(100, Math.min(settings.retryDelay, 10000));
    }

    /**
     * Robust cross-platform clipboard copy.
     * Returns a Promise that resolves to true on success, false otherwise.
     */
    async function copyToClipboard(text) {
        try {
            /* 1) Tampermonkey / Violentmonkey native API ------------------ */
            if (typeof GM_setClipboard === 'function') {
                GM_setClipboard(text, 'text');
                return true;
            }
        } catch (e) { /* fall through */ }

        /* 2) Modern browsers (requires HTTPS & user gesture) -------------- */
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (e) {
                /* fall through to legacy method */
            }
        }

        /* 3) Legacy fallback --------------------------------------------- */
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            ta.style.top = '-9999px';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch (e) {
            console.error('Clipboard copy failed:', e);
            return false;
        }
    }

    const waitForElement = (selector, timeout = 5000) => new Promise((resolve, reject) => {
        if (timeout <= 0) {
            reject(new Error('Invalid timeout value'));
            return;
        }
        
        const intervalTime = 100;
        let elapsedTime = 0;
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
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

    function parseProductImageUrl(imgTag) {
        if (!imgTag || !imgTag.src) return null;
        try {
            const url = new URL(imgTag.src);
            const originalUrlEncoded = url.searchParams.get('url');
            if (originalUrlEncoded) return decodeURIComponent(originalUrlEncoded);
        } catch (e) {
            try {
                const srcset = imgTag.getAttribute('srcset');
                if (srcset) {
                    const firstUrlPart = srcset.split(' ')[0];
                    if (firstUrlPart && firstUrlPart.includes('_next/image')) {
                        const url = new URL(firstUrlPart, window.location.origin);
                        const originalUrlEncoded = url.searchParams.get('url');
                        if (originalUrlEncoded) return decodeURIComponent(originalUrlEncoded);
                    }
                }
            } catch (e2) { /* Ignore */ }
        }
        return imgTag.src;
    }

    // --- PAGE TYPE DETECTION ---
    function detectPageType() {
        if (window.location.pathname.includes('/search') || document.querySelector("section[data-testid='product-tile']")) return 'product-list';
        if (window.location.pathname.includes('/product/') && document.getElementById('__NEXT_DATA__')) return 'product-detail';
        return 'other';
    }

    // --- SCRAPING LOGIC ---
    function scrapeSearchPage(doc = document) {
        const productsOnPage = [];
        doc.querySelectorAll("section[data-testid='product-tile']").forEach(tile => {
            try {
                const linkTag = tile.querySelector("a.product__link") || tile.querySelector('.product__message-title_area a.product__link');
                let productUrl = "N/A";
                
                if (linkTag && linkTag.href) {
                    try {
                        productUrl = new URL(linkTag.href, window.location.origin).href;
                    } catch (e) {
                        productUrl = linkTag.href; // fallback to original href
                    }
                }
                
                productsOnPage.push({
                    name: tile.querySelector("h2.product__title")?.textContent.trim() || "N/A",
                    product_url: productUrl,
                    price: tile.querySelector("span.price__value")?.textContent.trim() || "N/A",
                    unit_price: tile.querySelector("div.price__calculation_method")?.textContent.trim() || "N/A",
                    image_url: parseProductImageUrl(tile.querySelector("img[data-testid='product-image']"))
                });
            } catch (e) { 
                console.error("Could not parse a product tile:", e); 
            }
        });
        return productsOnPage;
    }

    function scrapeProductDetailPage(doc = document) {
        const productData = {};
        const scriptTag = doc.getElementById('__NEXT_DATA__');
        if (!scriptTag || !scriptTag.textContent) {
            return { detail_error: "__NEXT_DATA__ script tag not found or empty." };
        }
        
        try {
            const jsonData = JSON.parse(scriptTag.textContent);
            const productInfo = jsonData?.props?.pageProps?.product;
            
            if (productInfo) {
                const name = productInfo.name || '';
                const size = productInfo.size || '';
                productData.detailed_name = `${name} | ${size}`.replace(/^ \| | \| $/g, '');
                productData.brand = productInfo.brand || 'N/A';
                
                const pricing = productInfo.pricing || {};
                productData.detailed_current_price = pricing.now ? `$${pricing.now.toFixed(2)}` : 'N/A';
                productData.detailed_original_price = pricing.was ? `$${pricing.was.toFixed(2)}` : 'None';
                productData.savings = pricing.saveStatement || 'None';
                
                // Safely parse description
                if (productInfo.longDescription) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = productInfo.longDescription;
                    productData.description = tempDiv.textContent || tempDiv.innerText || 'N/A';
                } else {
                    productData.description = 'N/A';
                }
                
                // Process additional info
                if (Array.isArray(productInfo.additionalInfo)) {
                    productInfo.additionalInfo.forEach(item => {
                        if (item?.title && item.description) {
                            productData[item.title.toLowerCase().replace(/\s+/g, '_')] = item.description;
                        }
                    });
                }
                
                productData.barcode_gtin = productInfo.gtin || 'N/A';
                
                // Rating and reviews
                const ratingContainer = doc.querySelector('div[data-bv-show="rating_summary"][data-bv-ready="true"]');
                if (ratingContainer) {
                    productData.rating = ratingContainer.querySelector('.bv_avgRating_component_container')?.textContent.trim() + ' / 5' || 'N/A';
                    productData.review_count = ratingContainer.querySelector('.bv_numReviews_text')?.textContent.trim().replace(/[()]/g, '') || 'N/A';
                } else {
                    productData.rating = 'N/A';
                    productData.review_count = 'N/A';
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
        const productListContainer = document.querySelector('#trolley-drawer-available-items ul');
        if (!productListContainer) {
            return { error: 'Could not find the trolley items list.' };
        }

        const productItems = productListContainer.children;
        if (productItems.length === 0) {
            return { error: 'Trolley is empty.' };
        }

        const items = [];
        Array.from(productItems).forEach(item => {
            try {
                const titleElement = item.querySelector('a[data-testid="product_in_trolley__title"]');
                const imageElement = item.querySelector('img[data-testid="product-image"]');
                const quantitySelect = item.querySelector('select[data-testid="quantity-picker-select"]');
                const priceElement = item.querySelector('span[data-testid="product-pricing"]');
                
                if (!titleElement || !imageElement || !quantitySelect || !priceElement) return;

                const quantity = parseInt(quantitySelect.value, 10);
                const totalPrice = parseFloat(priceElement.textContent.replace('$', ''));
                
                if (isNaN(quantity) || isNaN(totalPrice)) return;

                let productUrl = "N/A";
                if (titleElement.href) {
                    try {
                        productUrl = new URL(titleElement.href, window.location.origin).href;
                    } catch (e) {
                        productUrl = titleElement.href;
                    }
                }

                items.push({
                    name: titleElement.textContent.trim(),
                    image_url: imageElement.src,
                    product_url: productUrl,
                    quantity: quantity,
                    price: `$${totalPrice.toFixed(2)}`,
                    itemTotal: totalPrice
                });
            } catch (e) {
                console.error("Error parsing trolley item:", e);
            }
        });

        if (items.length === 0) {
            return { error: 'No valid products found to export.' };
        }
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
            const unitPrice = product.unit_price || '';
            const imageUrl = product.image_url || 'https://www.coles.com.au/_next/static/images/default_product_image-cf915244318b7c77271b489369949419.png';

            let detailsHtml = `
                <p class="product-price">${price} <span class="product-unit-price">${unitPrice}</span></p>
            `;
            if (type === 'trolley') {
                detailsHtml += `<p class="product-quantity">Quantity: <strong>${product.quantity}</strong></p>`;
            }

            productDiv.innerHTML = `
                <div class="product-item" data-product-index="${index}" data-tab-type="${type}">
                    <img src="${imageUrl}" class="product-item-img" alt="" loading="lazy" onerror="this.onerror=null;this.src='https://www.coles.com.au/_next/static/images/default_product_image-cf915244318b7c77271b489369949419.png';">
                    <div class="product-item-details">
                        <p class="product-name" title="${name}">${name}</p>
                        ${detailsHtml}
                    </div>
                    <div class="product-item-actions">
                        <button class="product-action-btn product-expand-btn" title="Expand/Collapse Details">${icons.expand}</button>
                        <button class="product-action-btn product-copy-btn" title="Copy Details (JSON)">${icons.copy}</button>
                        <button class="product-action-btn product-delete-btn" title="Remove from list">${icons.trash}</button>
                    </div>
                </div>
                <div class="product-details-expanded" style="display: none;"></div>
            `;
            container.appendChild(productDiv);
        });
    }

    function createUI() {
        uiToggleButton = document.createElement('div');
        uiToggleButton.id = 'coles-scraper-toggle';
        uiToggleButton.innerHTML = icons.tool;
        uiToggleButton.title = 'Coles Scraper & Exporter';
        document.body.appendChild(uiToggleButton);

        uiPanel = document.createElement('div');
        uiPanel.id = 'coles-scraper-panel';
        uiPanel.style.display = 'none';
        uiPanel.innerHTML = `
            <div id="coles-scraper-header">
                <span>Coles Scraper v6.2</span>
                <button id="close-panel-btn" title="Close">✕</button>
            </div>
            <div id="coles-scraper-tabs">
                <button class="tab-btn active" data-tab="scraper">Scraper</button>
                <button class="tab-btn" data-tab="trolley">Trolley</button>
            </div>
            <div id="coles-scraper-content">
                <!-- Scraper Tab Content -->
                <div id="scraper-tab-content" class="tab-content active">
                    <div id="scraper-tab-action-buttons" class="button-group"></div>
                    <div class="status-container">
                        <div id="scraper-tab-status"></div>
                        <progress id="scraper-tab-progress-bar" value="0" max="100" style="display: none;"></progress>
                    </div>
                    <div id="scraper-tab-results" class="product-list-container"></div>
                </div>
                <!-- Trolley Tab Content -->
                <div id="trolley-tab-content" class="tab-content">
                    <div id="trolley-tab-action-buttons" class="button-group"></div>
                    <div class="status-container">
                        <div id="trolley-tab-status"></div>
                        <progress id="trolley-tab-progress-bar" value="0" max="100" style="display: none;"></progress>
                    </div>
                    <div id="trolley-tab-results" class="product-list-container"></div>
                    <div id="trolley-total-price" style="display: none;"></div>
                </div>

                <!-- Shared Controls -->
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
                        <label for="min-delay" title="Minimum random delay between fetches">Min Delay (ms)</label>
                        <input type="number" id="min-delay" value="${settings.minDelay}" min="100" max="10000">
                        <label for="max-delay" title="Maximum random delay between fetches">Max Delay (ms)</label>
                        <input type="number" id="max-delay" value="${settings.maxDelay}" min="100" max="10000">
                        <label for="max-retries" title="How many times to retry a failed network request">Max Retries</label>
                        <input type="number" id="max-retries" value="${settings.maxRetries}" min="0" max="10">
                        <label for="retry-delay" title="How long to wait before retrying a failed request">Retry Wait (ms)</label>
                        <input type="number" id="retry-delay" value="${settings.retryDelay}" min="100" max="10000">
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

        // Add event listeners
        uiToggleButton.addEventListener('click', togglePanel);
        document.getElementById('close-panel-btn').addEventListener('click', togglePanel);
        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
        document.getElementById('clear-btn').addEventListener('click', clearResults);
        uiPanel.addEventListener('click', handleProductActions);

        // Export listeners
        document.getElementById('export-main-btn').addEventListener('click', handleExport);
        document.getElementById('export-toggle-btn').addEventListener('click', toggleExportMenu);
        document.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', selectExportOption);
        });
        document.addEventListener('click', (e) => {
            const container = document.querySelector('.export-btn-container');
            if (container && !container.contains(e.target)) {
                const menu = document.getElementById('export-menu');
                if(menu) menu.style.display = 'none';
            }
        });

        // Settings listeners with validation
        document.getElementById('min-delay').addEventListener('input', e => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value)) {
                settings.minDelay = value;
                validateSettings();
                e.target.value = settings.minDelay;
            }
        });
        document.getElementById('max-delay').addEventListener('input', e => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value)) {
                settings.maxDelay = value;
                validateSettings();
                e.target.value = settings.maxDelay;
            }
        });
        document.getElementById('max-retries').addEventListener('input', e => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value)) {
                settings.maxRetries = value;
                validateSettings();
                e.target.value = settings.maxRetries;
            }
        });
        document.getElementById('retry-delay').addEventListener('input', e => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value)) {
                settings.retryDelay = value;
                validateSettings();
                e.target.value = settings.retryDelay;
            }
        });
        document.getElementById('include-img-url').addEventListener('change', e => {
            settings.includeImageUrlOnCopy = e.target.checked;
        });
        document.getElementById('include-prod-url').addEventListener('change', e => {
            settings.includeProductUrlOnCopy = e.target.checked;
        });

        makeDraggable(uiPanel, document.getElementById('coles-scraper-header'));
        updateUIForActiveTab();
    }

    function switchTab(tabId) {
        if (isOperationRunning) {
            alert('Please stop the current operation before switching tabs.');
            return;
        }
        activeTab = tabId;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === `${tabId}-tab-content`));
        updateUIForActiveTab();
    }

    function togglePanel() {
        isExpanded = !isExpanded;
        uiPanel.style.display = isExpanded ? 'flex' : 'none';
        uiToggleButton.style.display = isExpanded ? 'none' : 'flex';
    }

    function toggleOperationControls(isRunning) {
        document.querySelectorAll('.button-group button').forEach(btn => {
            if (!btn.classList.contains('stop-button')) btn.disabled = isRunning;
        });
        document.querySelectorAll('.product-action-btn').forEach(btn => btn.disabled = isRunning);
        document.getElementById('scraper-settings').style.pointerEvents = isRunning ? 'none' : 'auto';
        document.getElementById('scraper-settings').style.opacity = isRunning ? 0.6 : 1;
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
        container.innerHTML = '';

        if (pageType === 'product-list') {
            container.innerHTML = `
                <button id="scraper-scrape-current-btn">${icons.scrapePage} Scrape Page</button>
                <button id="scraper-scrape-all-btn">${icons.scrapeAll} Scrape All</button>
                <button id="scraper-fetch-details-btn">${icons.fetchDetails} Fetch Details</button>
                <button class="stop-button" style="display: none;">${icons.stop} Stop</button>
            `;
            container.querySelector('#scraper-scrape-current-btn')?.addEventListener('click', handleScrapeCurrentPage);
            container.querySelector('#scraper-scrape-all-btn')?.addEventListener('click', handleScrapeAllPages);
            container.querySelector('#scraper-fetch-details-btn')?.addEventListener('click', handleFetchScraperDetails);
        } else if (pageType === 'product-detail') {
            container.innerHTML = `<button id="scraper-scrape-detail-btn">${icons.scrapePage} Scrape Product</button>`;
            container.querySelector('#scraper-scrape-detail-btn')?.addEventListener('click', handleScrapeDetailPage);
        } else {
            container.innerHTML = `<div class="info-message">Navigate to a Coles product or search page.</div>`;
        }
        container.querySelector('.stop-button')?.addEventListener('click', handleStopOperation);
    }

    function updateTrolleyActionButtons() {
        const container = document.getElementById('trolley-tab-action-buttons');
        if (!container) return;
        container.innerHTML = `
            <button id="trolley-scrape-btn">${icons.trolley} Scrape Trolley</button>
            <button id="trolley-fetch-details-btn">${icons.fetchDetails} Fetch Details</button>
            <button class="stop-button" style="display: none;">${icons.stop} Stop</button>
        `;
        container.querySelector('#trolley-scrape-btn').addEventListener('click', handleScrapeTrolley);
        container.querySelector('#trolley-fetch-details-btn').addEventListener('click', handleFetchTrolleyDetails);
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
            if (detailsBtn && !isOperationRunning) detailsBtn.disabled = false;
        } else {
            resultsArea.innerHTML = `<div class="info-message">Click a button to start scraping.</div>`;
            statusArea.textContent = '';
            if (detailsBtn) detailsBtn.disabled = true;
        }
    }

    function updateTrolleyResultsDisplay() {
        const resultsArea = document.getElementById('trolley-tab-results');
        const statusArea = document.getElementById('trolley-tab-status');
        const detailsBtn = document.getElementById('trolley-fetch-details-btn');
        const totalArea = document.getElementById('trolley-total-price');
        if (!resultsArea || !statusArea || !detailsBtn || !totalArea) return;

        if (trolleyProducts.length > 0) {
            const total = trolleyProducts.reduce((acc, p) => acc + (p.itemTotal || 0), 0);
            totalArea.innerHTML = `<span>Trolley Total:</span> <span class="total-price-value">$${total.toFixed(2)}</span>`;
            totalArea.style.display = 'flex';

            renderProductList(resultsArea, trolleyProducts, 'trolley');
            statusArea.textContent = `Displaying ${trolleyProducts.length} items from trolley.`;
            if (!isOperationRunning) detailsBtn.disabled = false;
        } else {
            resultsArea.innerHTML = `<div class="info-message">Click "Scrape Trolley" to get started.</div>`;
            statusArea.textContent = '';
            totalArea.style.display = 'none';
            detailsBtn.disabled = true;
        }
    }

    // --- BUTTON HANDLERS ---
    function handleStopOperation() {
        if (isOperationRunning) {
            isOperationRunning = false;
            if (operationAbortController) {
                operationAbortController.abort();
                operationAbortController = null;
            }
            document.getElementById('scraper-tab-status').textContent = "Stopping operation...";
            document.getElementById('trolley-tab-status').textContent = "Stopping operation...";
            document.querySelectorAll('.stop-button').forEach(btn => btn.disabled = true);
        }
    }

    async function handleScrapeCurrentPage() {
        if (isOperationRunning) return;
        const statusArea = document.getElementById('scraper-tab-status');
        statusArea.textContent = 'Scraping current page...';
        document.getElementById('scraper-tab-progress-bar').style.display = 'none';
        try {
            scrapedProducts = scrapeSearchPage();
            updateScraperResultsDisplay();
            statusArea.textContent = `Scraped ${scrapedProducts.length} products from this page.`;
        } catch (error) {
            statusArea.textContent = `Error scraping page: ${error.message}`;
            console.error('Scraping error:', error);
        }
    }

    async function handleScrapeDetailPage() {
        if (isOperationRunning) return;
        const statusArea = document.getElementById('scraper-tab-status');
        statusArea.textContent = 'Scraping product details...';
        document.getElementById('scraper-tab-progress-bar').style.display = 'none';
        try {
            scrapedProducts = [scrapeProductDetailPage()];
            updateScraperResultsDisplay();
            statusArea.textContent = 'Scraped product details.';
        } catch (error) {
            statusArea.textContent = `Error scraping product: ${error.message}`;
            console.error('Scraping error:', error);
        }
    }

    async function handleScrapeTrolley() {
        if (isOperationRunning) return;
        const statusArea = document.getElementById('trolley-tab-status');
        statusArea.textContent = 'Opening trolley and scraping...';
        
        try {
            // More robust trolley drawer detection
            let drawer = document.querySelector('div[data-testid="trolley-drawer"]');
            let isDrawerOpen = false;
            
            if (drawer) {
                const drawerRect = drawer.getBoundingClientRect();
                isDrawerOpen = drawerRect.width > 0 && drawerRect.height > 0 && 
                              getComputedStyle(drawer).visibility !== 'hidden';
            }

            if (!isDrawerOpen) {
                const trolleyButton = document.querySelector('button[data-testid="header-trolley-tablet-up"], button[data-testid="header-trolley"]');
                if (!trolleyButton) {
                    statusArea.textContent = 'Could not find the trolley button to open the drawer.';
                    return;
                }
                trolleyButton.click();
                try {
                    await waitForElement('#trolley-drawer-available-items ul li');
                    await sleepFixed(250);
                } catch (error) {
                    statusArea.textContent = 'Failed to load trolley content. Please try again.';
                    console.error("Trolley load error:", error);
                    return;
                }
            }

            const result = scrapeTrolley();
            if (result.error) {
                statusArea.textContent = result.error;
            } else {
                trolleyProducts = result.products;
                statusArea.textContent = `Scraped ${trolleyProducts.length} items from the trolley.`;
            }
            updateTrolleyResultsDisplay();
        } catch (error) {
            statusArea.textContent = `Error scraping trolley: ${error.message}`;
            console.error('Trolley scraping error:', error);
        }
    }

    async function runFetchWithRetries(url, statusAreaElement, originalStatus, signal) {
        validateSettings();
        let error = null;
        
        for (let i = 0; i <= settings.maxRetries; i++) {
            if (signal && signal.aborted) {
                throw new Error("Operation aborted");
            }
            if (!isOperationRunning && statusAreaElement) {
                throw new Error("Operation stopped");
            }
            
            try {
                const response = await fetch(url, { signal });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const text = await response.text();
                return { doc: new DOMParser().parseFromString(text, 'text/html') };
            } catch (e) {
                if (signal && signal.aborted) throw e;
                error = e;
                if (i < settings.maxRetries) {
                    if(statusAreaElement) statusAreaElement.textContent = `Fetch failed. Retrying... (${i + 1}/${settings.maxRetries})`;
                    await sleepFixed(settings.retryDelay);
                    if(statusAreaElement) statusAreaElement.textContent = originalStatus;
                }
            }
        }
        throw error;
    }

    async function handleScrapeAllPages() {
        if (isOperationRunning) return;
        isOperationRunning = true;
        operationAbortController = new AbortController();
        scrapedProducts = [];
        const statusArea = document.getElementById('scraper-tab-status');
        const progressBar = document.getElementById('scraper-tab-progress-bar');
        updateScraperResultsDisplay();
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

            scrapedProducts.push(...scrapeSearchPage());
            progressBar.value = 1;
            updateScraperResultsDisplay();

            if (totalPages > 1) {
                const baseUrl = new URL(window.location.href);
                for (let i = 2; i <= totalPages; i++) {
                    if (!isOperationRunning) break;
                    
                    const originalStatus = `Fetching page ${i} of ${totalPages}...`;
                    statusArea.textContent = originalStatus;
                    baseUrl.searchParams.set('page', i);

                    try {
                        const { doc } = await runFetchWithRetries(
                            baseUrl.href, 
                            statusArea, 
                            originalStatus, 
                            operationAbortController.signal
                        );
                        
                        const newProducts = scrapeSearchPage(doc);
                        if (newProducts.length === 0) {
                            statusArea.textContent = `No products on page ${i}. Stopping.`;
                            break;
                        }
                        scrapedProducts.push(...newProducts);
                        progressBar.value = i;
                        updateScraperResultsDisplay();
                        
                        if (isOperationRunning && i < totalPages) await sleepRandom();
                    } catch (error) {
                        if (error.message === "Operation aborted" || error.message === "Operation stopped") {
                            break;
                        }
                        statusArea.textContent = `Error fetching page ${i}: ${error.message}. Stopping.`;
                        break;
                    }
                }
            }
            statusArea.textContent = isOperationRunning ? `Finished scraping. Found ${scrapedProducts.length} products.` : 'Scraping stopped by user.';
        } catch (error) {
            statusArea.textContent = `Error during scraping: ${error.message}`;
        } finally {
            isOperationRunning = false;
            operationAbortController = null;
            toggleOperationControls(false);
            progressBar.style.display = 'none';
            updateUIForActiveTab();
        }
    }

    async function runDetailFetchProcess(productList, statusAreaElement, progressBarElement, updateDisplayFunc) {
        if (isOperationRunning || productList.length === 0) return;
        isOperationRunning = true;
        operationAbortController = new AbortController();
        toggleOperationControls(true);
        
        const total = productList.length;
        statusAreaElement.textContent = `Starting to fetch details for ${total} products...`;
        progressBarElement.style.display = 'block';
        progressBarElement.value = 0;
        progressBarElement.max = total;

        try {
            for (let i = 0; i < total; i++) {
                if (!isOperationRunning) break;
                
                const product = productList[i];
                progressBarElement.value = i + 1;

                if (!product.product_url || product.product_url === 'N/A') {
                    product.detail_error = "No URL to fetch.";
                    continue;
                }
                
                const originalStatus = `(${i + 1}/${total}) Fetching: ${product.name.substring(0, 30)}...`;
                statusAreaElement.textContent = originalStatus;

                try {
                    const { doc } = await runFetchWithRetries(
                        product.product_url, 
                        statusAreaElement, 
                        originalStatus,
                        operationAbortController.signal
                    );
                    Object.assign(product, scrapeProductDetailPage(doc));
                } catch (error) {
                    if (error.message === "Operation aborted" || error.message === "Operation stopped") {
                        break;
                    }
                    product.detail_error = `Fetch failed: ${error.message}`;
                }
                
                updateDisplayFunc();
                if (isOperationRunning && i < total - 1) await sleepRandom();
            }
            statusAreaElement.textContent = isOperationRunning ? 'Finished fetching all details.' : 'Fetching stopped by user.';
        } catch (error) {
            statusAreaElement.textContent = `Error during detail fetching: ${error.message}`;
        } finally {
            isOperationRunning = false;
            operationAbortController = null;
            toggleOperationControls(false);
            progressBarElement.style.display = 'none';
            updateUIForActiveTab();
        }
    }

    async function handleFetchScraperDetails() {
        await runDetailFetchProcess(
            scrapedProducts,
            document.getElementById('scraper-tab-status'),
            document.getElementById('scraper-tab-progress-bar'),
            updateScraperResultsDisplay
        );
    }

    async function handleFetchTrolleyDetails() {
        await runDetailFetchProcess(
            trolleyProducts,
            document.getElementById('trolley-tab-status'),
            document.getElementById('trolley-tab-progress-bar'),
            updateTrolleyResultsDisplay
        );
    }

    async function handleProductActions(e) {
        if (isOperationRunning) return;

        const deleteBtn = e.target.closest('.product-delete-btn');
        const copyBtn = e.target.closest('.product-copy-btn');
        const expandBtn = e.target.closest('.product-expand-btn');

        if (!deleteBtn && !copyBtn && !expandBtn) return;

        const productItem = e.target.closest('.product-item');
        if (!productItem) return;
        
        const index = parseInt(productItem.dataset.productIndex, 10);
        const tabType = productItem.dataset.tabType;
        const productList = tabType === 'scraper' ? scrapedProducts : trolleyProducts;
        
        if (index < 0 || index >= productList.length) return;
        const product = productList[index];

        if (deleteBtn) {
            productList.splice(index, 1);
            if (tabType === 'scraper') updateScraperResultsDisplay();
            else updateTrolleyResultsDisplay();
        } else if (copyBtn) {
            try {
                const success = await copyToClipboard(JSON.stringify(product, null, 2));
                if (success) {
                    copyBtn.classList.add('copied');
                    copyBtn.innerHTML = icons.check;
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.innerHTML = icons.copy;
                    }, 1500);
                } else {
                    console.error('Failed to copy to clipboard');
                }
            } catch (error) {
                console.error('Copy error:', error);
            }
        } else if (expandBtn) {
            const wrapper = e.target.closest('.product-item-wrapper');
            const detailsContainer = wrapper.querySelector('.product-details-expanded');
            const isVisible = detailsContainer.style.display !== 'none';

            if (isVisible) {
                detailsContainer.style.display = 'none';
                expandBtn.innerHTML = icons.expand;
            } else {
                if (product.detailed_name || product.detail_error) {
                    renderExpandedDetails(detailsContainer, product);
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

        if (!product.product_url || product.product_url === 'N/A') {
            product.detail_error = "No URL to fetch.";
            renderExpandedDetails(detailsContainer, product);
            detailsContainer.style.display = 'block';
            expandBtn.innerHTML = icons.collapse;
            return;
        }

        detailsContainer.innerHTML = `<div class="details-loading">Fetching details...</div>`;
        detailsContainer.style.display = 'block';
        expandBtn.disabled = true;

        try {
            const { doc } = await runFetchWithRetries(product.product_url, null, '', null);
            Object.assign(product, scrapeProductDetailPage(doc));
        } catch (error) {
            Object.assign(product, { detail_error: `Fetch failed: ${error.message}` });
        }

        renderExpandedDetails(detailsContainer, product);
        expandBtn.innerHTML = icons.collapse;
        expandBtn.disabled = false;
    }

    function renderExpandedDetails(container, product) {
        const keysToIgnore = new Set(['name', 'price', 'unit_price', 'image_url', 'product_url', 'itemTotal', 'quantity']);
        let html = '<dl class="details-dl">';
        for (const key in product) {
            if (!keysToIgnore.has(key) && product[key] && product[key] !== 'N/A') {
                const prettyKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                html += `<dt>${prettyKey}</dt><dd>${String(product[key]).substring(0, 500)}</dd>`;
            }
        }
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
            case 'copy-json':      exportJSON(false); break;
            case 'download-json':  exportJSON(true); break;
            case 'copy-csv':       exportCSV(false); break;
            case 'download-csv':   exportCSV(true); break;
            case 'copy-md':        exportMarkdown(false); break;
            case 'download-md':    exportMarkdown(true); break;
        }
    }

    function selectExportOption(e) {
        const option = e.currentTarget;
        const action = option.dataset.action;
        const mainBtn = document.getElementById('export-main-btn');

        if (mainBtn) {
            mainBtn.innerHTML = option.innerHTML;
            mainBtn.dataset.action = action;
        }

        const menu = document.getElementById('export-menu');
        if (menu) menu.style.display = 'none';

        executeExportAction(action);
    }

    function handleExport() {
        const mainBtn = document.getElementById('export-main-btn');
        const action = mainBtn ? mainBtn.dataset.action : 'copy-json';
        executeExportAction(action);
    }

    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    function prepareDataForExport() {
        const sourceData = activeTab === 'scraper' ? scrapedProducts : trolleyProducts;
        const exportData = sourceData.map(p => {
            const newProd = { ...p };
            if (!settings.includeImageUrlOnCopy) delete newProd.image_url;
            if (!settings.includeProductUrlOnCopy) delete newProd.product_url;
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

    async function exportJSON(download = false) {
        const dataToExport = prepareDataForExport();
        if (!dataToExport.items || dataToExport.items.length === 0) {
            alert('No data to export.');
            return;
        }
        
        const jsonString = JSON.stringify(dataToExport, null, 2);
        
        if (download) {
            const filename = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.json`;
            downloadFile(filename, jsonString, 'application/json');
        } else {
            const success = await copyToClipboard(jsonString);
            if (success) {
                showCopyFeedback('export-main-btn');
            } else {
                alert('Failed to copy to clipboard. Try downloading instead.');
            }
        }
    }

    async function exportCSV(download = false) {
        const dataToExport = prepareDataForExport();
        const itemsArray = dataToExport.items;
        
        if (!itemsArray || itemsArray.length === 0) {
            alert('No data to export.');
            return;
        }

        let csvContent = '';

        if (dataToExport.totalPrice !== undefined) {
            csvContent = `Total Price,"${dataToExport.totalPriceFormatted}"\n\n`;
        }

        const headers = Array.from(new Set(itemsArray.flatMap(Object.keys)));
        csvContent += headers.join(',') + '\n';
        
        itemsArray.forEach(product => {
            csvContent += headers.map(header => {
                let value = String(product[header] || '').replace(/"/g, '""');
                return (value.includes(',') || value.includes('\n') || value.includes('"')) ? `"${value}"` : value;
            }).join(',') + '\n';
        });

        if (download) {
            const filename = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.csv`;
            downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
        } else {
            const success = await copyToClipboard(csvContent);
            if (success) {
                showCopyFeedback('export-main-btn');
            } else {
                alert('Failed to copy to clipboard. Try downloading instead.');
            }
        }
    }

    function generateMarkdown() {
        const sourceData = activeTab === 'scraper' ? scrapedProducts : trolleyProducts;
        if (sourceData.length === 0) return null;

        let md = `# ${activeTab === 'trolley' ? 'Trolley' : 'Product List'}\n\n`;

        const keyMap = {
            detailed_name: 'Full Name', brand: 'Brand', description: 'Description',
            detailed_current_price: 'Current Price', price: 'Price', detailed_original_price: 'Original Price',
            savings: 'Savings', unit_price: 'Unit Price', quantity: 'Quantity', itemTotal: 'Subtotal',
            rating: 'Rating', review_count: 'Review Count', barcode_gtin: 'Barcode (GTIN)',
            product_url: 'Product URL', detail_error: 'Error'
        };
        
        const keyOrder = [
            'detailed_name', 'brand', 'description', 'detailed_current_price', 'price',
            'detailed_original_price', 'savings', 'unit_price', 'quantity', 'itemTotal', 'rating',
            'review_count', 'barcode_gtin', 'ingredients', 'allergens', 'claims',
            'country_of_origin', 'storage_instructions', 'product_url', 'detail_error'
        ];

        sourceData.forEach(product => {
            md += '---\n\n';
            const name = product.detailed_name || product.name || 'Unnamed Product';
            md += `## Product Name: ${name}\n`;

            if (product.image_url && settings.includeImageUrlOnCopy) {
                md += `![${name} Image](${product.image_url})\n`;
            }
            md += '\n';

            let mdList = '';
            keyOrder.forEach(key => {
                if (product[key] && product[key] !== 'N/A' && product[key] !== 'None' && String(product[key]).trim() !== '') {
                    const displayName = keyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let value = product[key];
                    if (key === 'itemTotal' && typeof value === 'number') {
                        value = `$${value.toFixed(2)}`;
                    }
                    mdList += `- **${displayName}**: ${String(value).replace(/\n/g, ' ').substring(0, 200)}\n`;
                }
            });
            md += mdList ? mdList + '\n' : '';
        });

        if (activeTab === 'trolley' && trolleyProducts.length > 0) {
            md += '---\n\n';
            const total = trolleyProducts.reduce((acc, p) => acc + (p.itemTotal || 0), 0);
            md += `**Total: $${total.toFixed(2)}**\n`;
        }
        return md;
    }

    async function exportMarkdown(download = false) {
        const mdContent = generateMarkdown();
        if (!mdContent) {
            alert('No data to export.');
            return;
        }
        
        if (download) {
            const filename = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.md`;
            downloadFile(filename, mdContent, 'text/markdown;charset=utf-8;');
        } else {
            const success = await copyToClipboard(mdContent);
            if (success) {
                showCopyFeedback('export-main-btn');
            } else {
                alert('Failed to copy to clipboard. Try downloading instead.');
            }
        }
    }

    function clearResults() {
        if (isOperationRunning) return;
        if (activeTab === 'scraper') {
            scrapedProducts = [];
            document.getElementById('scraper-tab-progress-bar').style.display = 'none';
            updateScraperResultsDisplay();
        } else {
            trolleyProducts = [];
            document.getElementById('trolley-tab-progress-bar').style.display = 'none';
            updateTrolleyResultsDisplay();
        }
    }

    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        if (handle) {
            handle.onmousedown = dragMouseDown;
        } else {
            element.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            const newTop = element.offsetTop - pos2;
            const newLeft = element.offsetLeft - pos1;
            
            // Keep element within viewport
            const rect = element.getBoundingClientRect();
            const maxTop = window.innerHeight - rect.height;
            const maxLeft = window.innerWidth - rect.width;
            
            element.style.top = Math.max(0, Math.min(newTop, maxTop)) + "px";
            element.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function setupPageChangeMonitoring() {
        let currentUrl = window.location.href;
        const observer = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                setTimeout(() => {
                    if (!isOperationRunning) updateUIForActiveTab();
                }, 1500);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // --- CSS STYLES ---
    GM_addStyle(`
        :root {
            --theme-red: #E4002B; --theme-red-dark: #c30024; --theme-text-primary: #212121;
            --theme-text-secondary: #585858; --theme-border-light: #e0e0e0; --theme-background-light: #f7f7f7;
            --theme-blue-stop: #007bff; --theme-green-success: #4caf50;
        }
        #coles-scraper-toggle {
            position: fixed; top: 100px; right: 0; width: 48px; height: 48px; background-color: var(--theme-red);
            color: white; border-radius: 8px 0 0 8px; display: flex; align-items: center; justify-content: center;
            cursor: pointer; box-shadow: -2px 2px 8px rgba(0,0,0,0.2); z-index: 99999; transition: all 0.2s ease; user-select: none;
        }
        #coles-scraper-toggle:hover { background-color: var(--theme-red-dark); width: 52px; }
        #coles-scraper-toggle svg { width: 28px; height: 28px; }
        #coles-scraper-panel {
            position: fixed; top: 20px; right: 20px; width: 550px; max-height: 90vh; background-color: #fff;
            border: 1px solid var(--theme-border-light); border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            z-index: 99999; display: flex; flex-direction: column;
            font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #coles-scraper-header {
            padding: 12px 18px; cursor: move; background-color: #fff; color: var(--theme-text-primary);
            font-weight: 600; font-size: 16px; border-bottom: 1px solid var(--theme-border-light);
            border-top-left-radius: 8px; border-top-right-radius: 8px; display: flex; justify-content: space-between; align-items: center;
        }
        #close-panel-btn { background: none; border: none; color: var(--theme-text-secondary); font-size: 24px; cursor: pointer; padding: 0 5px; line-height: 1; opacity: 0.8; transition: all 0.2s; }
        #close-panel-btn:hover { opacity: 1; }
        #coles-scraper-tabs { display: flex; border-bottom: 1px solid var(--theme-border-light); background-color: var(--theme-background-light); }
        .tab-btn {
            padding: 12px 20px; border: none; background: none; cursor: pointer; font-size: 15px; font-weight: 600;
            color: var(--theme-text-secondary); border-bottom: 3px solid transparent; transition: all 0.2s ease;
        }
        .tab-btn:hover { background-color: #e9e9e9; }
        .tab-btn.active { color: var(--theme-red); border-bottom-color: var(--theme-red); }
        #coles-scraper-content { padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .tab-content { display: none; flex-direction: column; gap: 15px; }
        .tab-content.active { display: flex; }

        .product-list-container {
            width: 100%; height: 350px; background-color: #f7f7f7; border: 1px solid var(--theme-border-light);
            border-radius: 6px; padding: 8px; box-sizing: border-box;
            overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
        }
        .product-item-wrapper { background-color: #fff; border: 1px solid #e9e9e9; border-radius: 4px; }
        .product-item { display: flex; align-items: center; gap: 15px; padding: 10px; }
        .product-item-img { width: 60px; height: 60px; object-fit: contain; flex-shrink: 0; border-radius: 4px; }
        .product-item-details { flex: 1; min-width: 0; }
        .product-name {
            font-weight: 600; color: var(--theme-text-primary); margin: 0 0 4px 0; white-space: nowrap;
            overflow: hidden; text-overflow: ellipsis; font-size: 14px;
        }
        .product-price { font-weight: 700; color: var(--theme-red); margin: 0; font-size: 15px; }
        .product-unit-price { font-weight: 400; color: var(--theme-text-secondary); font-size: 12px; margin-left: 8px; }
        .product-quantity { font-size: 13px; color: var(--theme-text-secondary); margin: 4px 0 0 0;}

        .product-item-actions { display: flex; gap: 5px; align-items: center; }
        .product-action-btn {
            background-color: #f0f0f0; border: 1px solid #e0e0e0; color: var(--theme-text-secondary);
            width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s ease;
        }
        .product-action-btn:hover:not(:disabled) { background-color: #e0e0e0; color: var(--theme-text-primary); }
        .product-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .product-action-btn svg { width: 16px; height: 16px; }
        .product-delete-btn:hover:not(:disabled) { background-color: #ffebee; color: #c62828; }
        .product-copy-btn:hover:not(:disabled):not(.copied) { background-color: #e3f2fd; color: #1565c0; }
        .product-copy-btn.copied { background-color: var(--theme-green-success) !important; color: white !important; transition: all 0.3s ease; }
        .product-details-expanded { padding: 12px 15px; border-top: 1px solid #f0f0f0; background-color: #fafafa; font-size: 13px; }
        .details-loading { font-style: italic; color: var(--theme-text-secondary); }
        .details-dl { margin: 0; display: grid; grid-template-columns: 120px 1fr; gap: 8px; }
        .details-dl dt { font-weight: 600; color: var(--theme-text-primary); }
        .details-dl dd { margin: 0; color: var(--theme-text-secondary); word-break: break-word; }

        #trolley-total-price {
            padding: 12px 18px; background-color: var(--theme-background-light); border: 1px solid var(--theme-border-light);
            border-radius: 6px; display: flex; justify-content: space-between; align-items: center;
            font-size: 16px; font-weight: 600; color: var(--theme-text-primary);
        }
        .total-price-value { font-size: 18px; font-weight: 700; color: var(--theme-red); }

        .status-container { display: flex; flex-direction: column; gap: 8px; }
        #scraper-tab-status, #trolley-tab-status {
            font-style: italic; color: var(--theme-text-secondary); min-height: 1.2em; font-size: 14px;
        }
        #scraper-tab-progress-bar, #trolley-tab-progress-bar { width: 100%; height: 6px; border-radius: 3px; border: none; }
        #scraper-tab-progress-bar::-webkit-progress-bar, #trolley-tab-progress-bar::-webkit-progress-bar { background-color: #f0f0f0; border-radius: 3px; }
        #scraper-tab-progress-bar::-webkit-progress-value, #trolley-tab-progress-bar::-webkit-progress-value { background-color: var(--theme-red); border-radius: 3px; transition: width 0.3s ease; }

        .button-group { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .button-group.export-group { border-top: 1px solid var(--theme-border-light); padding-top: 15px; justify-content: space-between; }
        .button-group button {
            display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 18px;
            border: 1px solid transparent; border-radius: 24px; cursor: pointer; transition: all 0.2s ease;
            font-size: 14px; font-weight: 700; line-height: 1;
        }
        .button-group button:hover:not(:disabled) { box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .button-group button:disabled { background-color: #e0e0e0 !important; color: #a0a0a0 !important; cursor: not-allowed; box-shadow: none; border-color: #e0e0e0 !important; }
        .button-group button svg { width: 16px; height: 16px; stroke-width: 2.5; stroke: currentColor; }

        #scraper-scrape-all-btn, #scraper-fetch-details-btn, #trolley-fetch-details-btn { background-color: var(--theme-red); color: white; }
        #scraper-scrape-all-btn:hover:not(:disabled), #scraper-fetch-details-btn:hover:not(:disabled), #trolley-fetch-details-btn:hover:not(:disabled) { background-color: var(--theme-red-dark); }
        #scraper-scrape-current-btn, #scraper-scrape-detail-btn, #trolley-scrape-btn { background-color: #fff; color: var(--theme-red); border: 1px solid var(--theme-red); }
        #scraper-scrape-current-btn:hover:not(:disabled), #scraper-scrape-detail-btn:hover:not(:disabled), #trolley-scrape-btn:hover:not(:disabled) { background-color: var(--theme-red); color: #fff; }
        #clear-btn { background-color: var(--theme-text-secondary); color: white; border-color: var(--theme-text-secondary); }
        #clear-btn:hover:not(:disabled) { background-color: var(--theme-text-primary); border-color: var(--theme-text-primary); }
        .stop-button { background-color: var(--theme-blue-stop); color: white; border-color: var(--theme-blue-stop); }
        .stop-button:hover:not(:disabled) { background-color: #0069d9; border-color: #0069d9; }

        /* --- EXPORT DROPDOWN STYLES --- */
        .export-btn-container { position: relative; display: flex; }
        #export-main-btn {
            border-radius: 24px 0 0 24px; border-right: none; background-color: #fff;
            color: var(--theme-red); border: 1px solid var(--theme-red);
        }
        #export-main-btn:hover:not(:disabled) { background-color: var(--theme-red); color: #fff; }
        #export-main-btn.copied-success {
            background-color: var(--theme-green-success) !important; color: white !important;
            border-color: var(--theme-green-success) !important;
        }
        #export-toggle-btn {
            padding: 10px 12px; border-radius: 0 24px 24px 0; border: 1px solid var(--theme-red);
            background-color: #fff; color: var(--theme-red); font-size: 10px; font-weight: bold; margin-left: -1px;
        }
        #export-toggle-btn:hover:not(:disabled) { background-color: var(--theme-red); color: #fff; }
        #export-menu {
            position: absolute; bottom: 110%; left: 0; background-color: #fff; border: 1px solid var(--theme-border-light);
            border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; width: 220px; overflow: hidden;
        }
        .export-option {
            display: flex; align-items: center; gap: 10px; padding: 10px 15px; cursor: pointer;
            font-size: 14px; color: var(--theme-text-primary); transition: background-color 0.2s;
        }
        .export-option:hover { background-color: var(--theme-background-light); }
        .export-option svg { width: 16px; height: 16px; stroke-width: 2; color: var(--theme-text-secondary); }

        .info-message {
            display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;
            color: #666; font-style: italic; text-align: center; padding: 20px; background-color: transparent;
            border-radius: 6px; box-sizing: border-box;
        }
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
        console.log('Coles Scraper & Exporter: Initializing...');
        validateSettings();
        createUI();
        setupPageChangeMonitoring();
        switchTab('scraper');
        console.log('Coles Scraper & Exporter: Ready!');
    }

    if (document.readyState === 'complete') {
        initialize();
    } else {
        window.addEventListener('load', initialize);
    }
})();