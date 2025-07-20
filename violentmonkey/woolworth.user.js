// ==UserScript==
// @name         Woolworths Scraper
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  A comprehensive Woolworths tool with a tabbed UI for scraping products (from search or detail pages), with auto-pagination, detailed data fetching, cart exporting, an interactive visual list, and multiple export formats (JSON, CSV, Markdown). Fixed version with improved error handling and stability.
// @author       Claude & LMFuture QwQ
// @match        https://www.woolworths.com.au/*
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
        cart: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
        stop: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`,
        copy: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        clear: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        tool: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
        check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        expand: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
        collapse: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
        retry: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`
    };

    // --- GLOBAL STATE ---
    let uiPanel, uiToggleButton;
    let scrapedProducts = [];
    let cartProducts = [];
    let isExpanded = false;
    let isOperationRunning = false;
    let activeTab = 'scraper';
    let operationAbortController = null;
    let cleanupFunctions = [];

    // --- SETTINGS WITH PERSISTENCE ---
    const defaultSettings = {
        minDelay: 1000,
        maxDelay: 2000,
        maxRetries: 3,
        retryDelay: 2500,
        includeImageUrlOnCopy: true,
        includeProductUrlOnCopy: true,
    };

    let settings = { ...defaultSettings };

    function loadSettings() {
        try {
            if (typeof GM_getValue === 'function') {
                const saved = GM_getValue('woolworths_scraper_settings', null);
                if (saved) {
                    settings = { ...defaultSettings, ...JSON.parse(saved) };
                }
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
            settings = { ...defaultSettings };
        }
        validateSettings();
    }

    function saveSettings() {
        try {
            if (typeof GM_setValue === 'function') {
                GM_setValue('woolworths_scraper_settings', JSON.stringify(settings));
            }
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    // --- UTILITY FUNCTIONS ---
    function safeParseInt(value, fallback) {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? fallback : parsed;
    }

    function safeParseFloat(value, fallback) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? fallback : parsed;
    }

    const sleepRandom = () => {
        const delay = Math.random() * (settings.maxDelay - settings.minDelay) + settings.minDelay;
        return new Promise(resolve => setTimeout(resolve, delay));
    };

    const sleepFixed = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function validateSettings() {
        settings.minDelay = Math.max(100, Math.min(safeParseInt(settings.minDelay, 1000), 10000));
        settings.maxDelay = Math.max(settings.minDelay, Math.min(safeParseInt(settings.maxDelay, 2000), 10000));
        settings.maxRetries = Math.max(0, Math.min(safeParseInt(settings.maxRetries, 3), 10));
        settings.retryDelay = Math.max(100, Math.min(safeParseInt(settings.retryDelay, 2500), 10000));
        settings.includeImageUrlOnCopy = Boolean(settings.includeImageUrlOnCopy);
        settings.includeProductUrlOnCopy = Boolean(settings.includeProductUrlOnCopy);
    }

    async function copyToClipboard(text) {
        if (!text || typeof text !== 'string') return false;

        try {
            if (typeof GM_setClipboard === 'function') {
                GM_setClipboard(text, 'text');
                return true;
            }
        } catch (e) {
            console.warn('GM_setClipboard failed:', e);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (e) {
                console.warn('Navigator clipboard failed:', e);
            }
        }

        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch (e) {
            console.error('Fallback clipboard copy failed:', e);
            return false;
        }
    }

    const waitForElement = (selector, timeout = 5000, parent = document) => new Promise((resolve, reject) => {
        if (!selector || typeof selector !== 'string') {
            reject(new Error('Invalid selector'));
            return;
        }

        const element = parent.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const intervalTime = 100;
        let elapsedTime = 0;
        const interval = setInterval(() => {
            const element = parent.querySelector(selector);
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

    const getText = (selector, parent = document) => {
        try {
            const element = parent?.querySelector?.(selector);
            return element?.textContent?.trim() || '';
        } catch (e) {
            console.warn('getText failed for selector:', selector, e);
            return '';
        }
    };

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
        const pathname = window.location.pathname;
        if (pathname.startsWith('/shop/search/products')) return 'product-list';
        if (pathname.startsWith('/shop/productdetails')) return 'product-detail';
        return 'other';
    }

    // --- WOOLWORTHS SCRAPING LOGIC ---
    async function scrapeSearchPage(doc = document) {
        const productsOnPage = [];
        const productTiles = doc.querySelectorAll('shared-product-tile');

        if (!productTiles.length) {
            throw new Error('No product tiles found on page');
        }

        for (const tile of productTiles) {
            try {
                const wcProductTile = tile.querySelector('wc-product-tile');
                if (!wcProductTile?.shadowRoot) continue;

                const shadowRoot = wcProductTile.shadowRoot;
                const productData = {};

                const titleLink = shadowRoot.querySelector('.title a');
                if (titleLink) {
                    productData.name = titleLink.textContent?.trim() || '';
                    const href = titleLink.href;
                    if (href && isValidUrl(href)) {
                        productData.product_url = new URL(href, window.location.origin).href;
                    }
                }

                const priceElement = shadowRoot.querySelector('.product-tile-price .primary');
                productData.price = priceElement?.textContent?.trim() || 'N/A';

                const imageElement = shadowRoot.querySelector('img');
                if (imageElement) {
                    const imgSrc = imageElement.src || imageElement.getAttribute('data-src') || '';
                    if (imgSrc && isValidUrl(imgSrc)) {
                        productData.image_url = imgSrc;
                    }
                }

                const pricePerUnit = shadowRoot.querySelector('.price-per-cup');
                if (pricePerUnit) {
                    productData.unit_price = pricePerUnit.textContent?.trim() || '';
                }

                if (productData.name && productData.price !== 'N/A') {
                    productsOnPage.push(productData);
                }

            } catch (e) {
                console.warn("Could not parse a product tile:", e);
            }
        }

        if (productsOnPage.length === 0) {
            throw new Error('No valid products found on page');
        }

        return productsOnPage;
    }

    function parseNutrition(nutritionNode) {
        const nutritionData = {
            servingsPerPack: 'N/A',
            servingSize: 'N/A',
            nutrients: []
        };

        if (!nutritionNode) return nutritionData;

        try {
            const servingsEl = nutritionNode.querySelector('li:nth-child(1) .sr-only');
            if (servingsEl) {
                const servingsText = servingsEl.textContent || '';
                const servingsParts = servingsText.split(',');
                if (servingsParts.length > 1) {
                    nutritionData.servingsPerPack = servingsParts[1].trim();
                }
            }

            const servingSizeEl = nutritionNode.querySelector('li:nth-child(2) .sr-only');
            if (servingSizeEl) {
                const servingSizeText = servingSizeEl.textContent || '';
                const servingSizeParts = servingSizeText.split(',');
                if (servingSizeParts.length > 1) {
                    nutritionData.servingSize = servingSizeParts[1].trim();
                }
            }
        } catch (e) {
            console.warn("Could not parse servings info:", e);
        }

        try {
            const nutrientRows = nutritionNode.querySelectorAll('.nutritional-info_component_nutrition-row__IYE_S.nutritional-info_component_nutrition-table__HKLvU ~ .nutritional-info_component_nutrition-row__IYE_S');
            nutrientRows.forEach(row => {
                const cols = row.querySelectorAll('.nutritional-info_component_nutrition-column__zIAJK');
                if (cols.length === 3) {
                    const nutrient = {
                        name: cols[0]?.textContent?.trim() || '',
                        perServing: cols[1]?.textContent?.trim() || '',
                        per100g: cols[2]?.textContent?.trim() || ''
                    };
                    if (nutrient.name) {
                        nutritionData.nutrients.push(nutrient);
                    }
                }
            });
        } catch (e) {
            console.warn("Could not parse nutrition rows:", e);
        }

        return nutritionData;
    }

    function scrapeProductDetailPage(doc = document) {
        if (!doc) {
            return { detail_error: "Invalid document provided" };
        }

        const productPanel = doc.querySelector('.product-details-panel_component_product-panel__DGweV');
        if (!productPanel) {
            return { detail_error: "Product details panel not found. Page structure may have changed." };
        }

        const productData = {};

        try {
            productData.detailed_name = getText('h1.product-title_component_product-title__azQKW', productPanel);
            productData.detailed_current_price = getText('.product-price_component_price-lead__vlm8f', productPanel);

            const ratingValue = getText('.star-reviews_component_rating-label__n5Z34', productPanel);
            const reviewCountText = getText('button#rating-action', productPanel);
            productData.rating = ratingValue ? `${ratingValue} / 5` : 'N/A';
            const reviewMatch = reviewCountText.match(/\d+/);
            productData.review_count = reviewMatch ? reviewMatch[0] : '0';

            // Accordion Details
            const accordionItems = doc.querySelectorAll('.accordion_core-accordion-item__b_fD_');
            accordionItems.forEach(item => {
                try {
                    const headingText = getText('.accordion_core-accordion-trigger-heading__i2Jix', item);
                    const heading = headingText.toLowerCase().replace(/\s+/g, '_');
                    if (!heading) return;

                    if (heading === 'nutrition_information') {
                        productData[heading] = parseNutrition(item);
                    } else {
                        const contentNode = item.querySelector('.text_component_text__ErEDp, [class^="viewMore_content__"]');
                        if (contentNode) {
                            productData[heading] = contentNode.innerText?.trim() || '';
                        }
                    }
                } catch (e) {
                    console.warn("Error parsing accordion item:", e);
                }
            });
        } catch (e) {
            console.error("Error scraping product details:", e);
            productData.detail_error = `Scraping error: ${e.message}`;
        }

        return productData;
    }

    function scrapeCart() {
        const itemElements = document.querySelectorAll('wow-cart-item.cart-item');
        if (itemElements.length === 0) {
            return { error: 'Cart is empty or items not found.' };
        }

        const items = [];
        itemElements.forEach((itemEl, index) => {
            try {
                const nameLinkElement = itemEl.querySelector('a.cart-item-name');
                const name = nameLinkElement?.innerText?.trim() || 'N/A';

                let product_url = 'N/A';
                if (nameLinkElement?.href && isValidUrl(nameLinkElement.href)) {
                    product_url = new URL(nameLinkElement.href, window.location.origin).href;
                }

                const imageEl = itemEl.querySelector('img.cart-item-image');
                let image_url = 'N/A';
                if (imageEl?.src && isValidUrl(imageEl.src)) {
                    image_url = imageEl.src;
                }

                const quantityInput = itemEl.querySelector('input.cartControls-quantityInput');
                const quantity = safeParseInt(quantityInput?.value, 1);

                const dollarsElement = itemEl.querySelector('.price-dollars');
                const centsElement = itemEl.querySelector('.price-cents');
                let totalItemPrice = 0;

                if (dollarsElement && centsElement) {
                    const dollarsText = dollarsElement.innerText?.trim() || '0';
                    const centsText = centsElement.innerText?.trim() || '00';
                    totalItemPrice = safeParseFloat(`${dollarsText}.${centsText}`, 0);
                }

                items.push({
                    name,
                    product_url,
                    image_url,
                    quantity,
                    price: `$${totalItemPrice.toFixed(2)}`,
                    itemTotal: totalItemPrice
                });
            } catch (e) {
                console.error(`Error parsing cart item ${index}:`, e);
            }
        });

        if (items.length === 0) {
            return { error: 'No valid products found to export from cart.' };
        }

        let cartTotalPrice = 0;
        const cartTotalPriceElement = document.querySelector('.cart-checkout-total-amount');
        if (cartTotalPriceElement) {
            const totalText = cartTotalPriceElement.innerText?.replace('$', '').trim() || '0';
            cartTotalPrice = safeParseFloat(totalText, 0);
        } else {
            // Fallback: calculate from items
            cartTotalPrice = items.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
        }

        return { products: items, total: cartTotalPrice };
    }

    // --- UI MANAGEMENT ---
    function cleanupEventListeners() {
        cleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (e) {
                console.warn('Cleanup function failed:', e);
            }
        });
        cleanupFunctions = [];
    }

    function addEventListenerWithCleanup(element, event, handler, options) {
        if (!element || !event || !handler) return;

        element.addEventListener(event, handler, options);
        cleanupFunctions.push(() => {
            element.removeEventListener(event, handler, options);
        });
    }

    function renderProductList(container, products, type = 'scraper') {
        if (!container) return;

        container.innerHTML = '';
        if (!products || products.length === 0) return;

        const fragment = document.createDocumentFragment();

        products.forEach((product, index) => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product-item-wrapper';

            const name = product.detailed_name || product.name || 'N/A';
            const price = product.detailed_current_price || product.price || 'N/A';
            const unitPrice = product.unit_price || '';
            const imageUrl = product.image_url || 'https://www.woolworths.com.au/wow/Content/images/default_product_tile_image.png';

            let detailsHtml = `<p class="product-price">${price} <span class="product-unit-price">${unitPrice}</span></p>`;
            if (type === 'cart' && product.quantity) {
                detailsHtml += `<p class="product-quantity">Quantity: <strong>${product.quantity}</strong></p>`;
            }

            productDiv.innerHTML = `
                <div class="product-item" data-product-index="${index}" data-tab-type="${type}">
                    <img src="${imageUrl}" class="product-item-img" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='https://www.woolworths.com.au/wow/Content/images/default_product_tile_image.png';">
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
            fragment.appendChild(productDiv);
        });

        container.appendChild(fragment);
    }

    function resetProgressBar(progressBarId) {
        const progressBar = document.getElementById(progressBarId);
        if (progressBar) {
            progressBar.style.display = 'none';
            progressBar.value = 0;
        }
    }

    function setOperationStatus(statusElementId, message) {
        const statusElement = document.getElementById(statusElementId);
        if (statusElement) {
            statusElement.textContent = message || '';
        }
    }

    function createUI() {
        // Clean up existing UI
        if (uiPanel) uiPanel.remove();
        if (uiToggleButton) uiToggleButton.remove();
        cleanupEventListeners();

        // Create toggle button
        uiToggleButton = document.createElement('div');
        uiToggleButton.id = 'woolies-scraper-toggle';
        uiToggleButton.innerHTML = icons.tool;
        uiToggleButton.title = 'Woolworths Scraper & Exporter';
        document.body.appendChild(uiToggleButton);

        // Create main panel
        uiPanel = document.createElement('div');
        uiPanel.id = 'woolies-scraper-panel';
        uiPanel.style.display = 'none';
        uiPanel.innerHTML = `
            <div id="woolies-scraper-header">
                <span>Woolworths Scraper v1.2</span>
                <button id="close-panel-btn" title="Close">✕</button>
            </div>
            <div id="woolies-scraper-tabs">
                <button class="tab-btn active" data-tab="scraper">Scraper</button>
                <button class="tab-btn" data-tab="cart">Cart</button>
            </div>
            <div id="woolies-scraper-content">
                <!-- Scraper Tab Content -->
                <div id="scraper-tab-content" class="tab-content active">
                    <div id="scraper-tab-action-buttons" class="button-group"></div>
                    <div class="status-container">
                        <div id="scraper-tab-status"></div>
                        <progress id="scraper-tab-progress-bar" value="0" max="100" style="display: none;"></progress>
                    </div>
                    <div id="scraper-tab-results" class="product-list-container"></div>
                </div>
                <!-- Cart Tab Content -->
                <div id="cart-tab-content" class="tab-content">
                    <div id="cart-tab-action-buttons" class="button-group"></div>
                    <div class="status-container">
                        <div id="cart-tab-status"></div>
                        <progress id="cart-tab-progress-bar" value="0" max="100" style="display: none;"></progress>
                    </div>
                    <div id="cart-tab-results" class="product-list-container"></div>
                    <div id="cart-total-price" style="display: none;"></div>
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

        // Add event listeners with cleanup tracking
        addEventListenerWithCleanup(uiToggleButton, 'click', togglePanel);
        addEventListenerWithCleanup(document.getElementById('close-panel-btn'), 'click', togglePanel);

        document.querySelectorAll('.tab-btn').forEach(btn => {
            addEventListenerWithCleanup(btn, 'click', () => switchTab(btn.dataset.tab));
        });

        addEventListenerWithCleanup(document.getElementById('clear-btn'), 'click', clearResults);
        addEventListenerWithCleanup(uiPanel, 'click', handleProductActions);

        // Export listeners
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

        // Settings listeners with validation and persistence
        const settingsHandlers = {
            'min-delay': (e) => {
                settings.minDelay = safeParseInt(e.target.value, 1000);
                validateSettings();
                e.target.value = settings.minDelay;
                saveSettings();
            },
            'max-delay': (e) => {
                settings.maxDelay = safeParseInt(e.target.value, 2000);
                validateSettings();
                e.target.value = settings.maxDelay;
                saveSettings();
            },
            'max-retries': (e) => {
                settings.maxRetries = safeParseInt(e.target.value, 3);
                validateSettings();
                e.target.value = settings.maxRetries;
                saveSettings();
            },
            'retry-delay': (e) => {
                settings.retryDelay = safeParseInt(e.target.value, 2500);
                validateSettings();
                e.target.value = settings.retryDelay;
                saveSettings();
            },
            'include-img-url': (e) => {
                settings.includeImageUrlOnCopy = e.target.checked;
                saveSettings();
            },
            'include-prod-url': (e) => {
                settings.includeProductUrlOnCopy = e.target.checked;
                saveSettings();
            }
        };

        Object.entries(settingsHandlers).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                const eventType = element.type === 'checkbox' ? 'change' : 'input';
                addEventListenerWithCleanup(element, eventType, handler);
            }
        });

        makeDraggable(uiPanel, document.getElementById('woolies-scraper-header'));
        updateUIForActiveTab();
    }

    function switchTab(tabId) {
        if (isOperationRunning) {
            alert('Please stop the current operation before switching tabs.');
            return;
        }

        if (!tabId || !['scraper', 'cart'].includes(tabId)) {
            console.warn('Invalid tab ID:', tabId);
            return;
        }

        activeTab = tabId;

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab-content`);
        });

        updateUIForActiveTab();
    }

    function togglePanel() {
        isExpanded = !isExpanded;
        if (uiPanel) uiPanel.style.display = isExpanded ? 'flex' : 'none';
        if (uiToggleButton) uiToggleButton.style.display = isExpanded ? 'none' : 'flex';
    }

    function toggleOperationControls(isRunning) {
        // Disable main action buttons during operations
        document.querySelectorAll('.button-group button:not(.stop-button)').forEach(btn => {
            btn.disabled = isRunning;
        });

        // Only disable delete buttons for individual products during bulk operations
        document.querySelectorAll('.product-delete-btn').forEach(btn => {
            btn.disabled = isRunning;
            btn.classList.toggle('temporarily-disabled', isRunning);
        });

        // Disable settings during operations
        const settingsEl = document.getElementById('scraper-settings');
        if (settingsEl) {
            settingsEl.style.pointerEvents = isRunning ? 'none' : 'auto';
            settingsEl.style.opacity = isRunning ? '0.6' : '1';
        }

        // Toggle stop button visibility
        document.querySelectorAll('.stop-button').forEach(btn => {
            btn.style.display = isRunning ? 'inline-flex' : 'none';
            btn.disabled = !isRunning;
        });
    }

    function updateUIForActiveTab() {
        if (activeTab === 'scraper') {
            updateScraperActionButtons();
            updateScraperResultsDisplay();
        } else if (activeTab === 'cart') {
            updateCartActionButtons();
            updateCartResultsDisplay();
        }
    }

    function updateScraperActionButtons() {
        const pageType = detectPageType();
        const container = document.getElementById('scraper-tab-action-buttons');
        if (!container) return;

        // Clean up existing listeners
        container.innerHTML = '';

        if (pageType === 'product-list') {
            container.innerHTML = `
                <button id="scraper-scrape-current-btn">${icons.scrapePage} Scrape Page</button>
                <button id="scraper-scrape-all-btn">${icons.scrapeAll} Scrape All</button>
                <button id="scraper-fetch-details-btn">${icons.fetchDetails} Fetch Details</button>
                <button class="stop-button" style="display: none;">${icons.stop} Stop</button>
            `;

            addEventListenerWithCleanup(container.querySelector('#scraper-scrape-current-btn'), 'click', handleScrapeCurrentPage);
            addEventListenerWithCleanup(container.querySelector('#scraper-scrape-all-btn'), 'click', handleScrapeAllPages);
            addEventListenerWithCleanup(container.querySelector('#scraper-fetch-details-btn'), 'click', handleFetchScraperDetails);
        } else if (pageType === 'product-detail') {
            container.innerHTML = `<button id="scraper-scrape-detail-btn">${icons.scrapePage} Scrape Product</button>`;
            addEventListenerWithCleanup(container.querySelector('#scraper-scrape-detail-btn'), 'click', handleScrapeDetailPage);
        } else {
            container.innerHTML = `<div class="info-message">Navigate to a Woolworths product or search page.</div>`;
        }

        const stopBtn = container.querySelector('.stop-button');
        if (stopBtn) {
            addEventListenerWithCleanup(stopBtn, 'click', handleStopOperation);
        }
    }

    function updateCartActionButtons() {
        const container = document.getElementById('cart-tab-action-buttons');
        if (!container) return;

        container.innerHTML = `
            <button id="cart-scrape-btn">${icons.cart} Scrape Cart</button>
            <button id="cart-fetch-details-btn">${icons.fetchDetails} Fetch Details</button>
            <button class="stop-button" style="display: none;">${icons.stop} Stop</button>
        `;

        addEventListenerWithCleanup(container.querySelector('#cart-scrape-btn'), 'click', handleScrapeCart);
        addEventListenerWithCleanup(container.querySelector('#cart-fetch-details-btn'), 'click', handleFetchCartDetails);
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
            if (detailsBtn && !isOperationRunning) detailsBtn.disabled = false;
        } else {
            resultsArea.innerHTML = `<div class="info-message">Click a button to start scraping.</div>`;
            statusArea.textContent = '';
            if (detailsBtn) detailsBtn.disabled = true;
        }
    }

    function updateCartResultsDisplay() {
        const resultsArea = document.getElementById('cart-tab-results');
        const statusArea = document.getElementById('cart-tab-status');
        const detailsBtn = document.getElementById('cart-fetch-details-btn');
        const totalArea = document.getElementById('cart-total-price');

        if (!resultsArea || !statusArea || !totalArea) return;

        if (cartProducts.length > 0) {
            const total = cartProducts.reduce((acc, p) => acc + (p.itemTotal || 0), 0);
            totalArea.innerHTML = `<span>Cart Total:</span> <span class="total-price-value">$${total.toFixed(2)}</span>`;
            totalArea.style.display = 'flex';

            renderProductList(resultsArea, cartProducts, 'cart');
            statusArea.textContent = `Displaying ${cartProducts.length} items from cart.`;
            if (detailsBtn && !isOperationRunning) detailsBtn.disabled = false;
        } else {
            resultsArea.innerHTML = `<div class="info-message">Click "Scrape Cart" to get started.</div>`;
            statusArea.textContent = '';
            totalArea.style.display = 'none';
            if (detailsBtn) detailsBtn.disabled = true;
        }
    }

    // --- OPERATION HANDLERS ---
    function handleStopOperation() {
        if (!isOperationRunning) return;

        isOperationRunning = false;
        if (operationAbortController) {
            operationAbortController.abort();
            operationAbortController = null;
        }

        setOperationStatus('scraper-tab-status', "Operation stopped by user.");
        setOperationStatus('cart-tab-status', "Operation stopped by user.");

        document.querySelectorAll('.stop-button').forEach(btn => btn.disabled = true);

        // Reset progress bars
        resetProgressBar('scraper-tab-progress-bar');
        resetProgressBar('cart-tab-progress-bar');

        setTimeout(() => {
            toggleOperationControls(false);
            updateUIForActiveTab();
        }, 100);
    }

    async function handleScrapeCurrentPage() {
        if (isOperationRunning) return;

        const statusArea = document.getElementById('scraper-tab-status');
        setOperationStatus('scraper-tab-status', 'Scraping current page...');

        try {
            const newProducts = await scrapeSearchPage();
            scrapedProducts = [...newProducts];
            updateScraperResultsDisplay();
            setOperationStatus('scraper-tab-status', `Scraped ${scrapedProducts.length} products from this page.`);
        } catch (error) {
            console.error('Scraping error:', error);
            setOperationStatus('scraper-tab-status', `Error scraping page: ${error.message}`);
        }
    }

    async function handleScrapeDetailPage() {
        if (isOperationRunning) return;

        setOperationStatus('scraper-tab-status', 'Scraping product details...');

        try {
            const productData = scrapeProductDetailPage();
            scrapedProducts = [productData];
            updateScraperResultsDisplay();
            setOperationStatus('scraper-tab-status', 'Scraped product details.');
        } catch (error) {
            console.error('Detail scraping error:', error);
            setOperationStatus('scraper-tab-status', `Error scraping product: ${error.message}`);
        }
    }

    async function handleScrapeCart() {
        if (isOperationRunning) return;

        setOperationStatus('cart-tab-status', 'Opening cart and scraping...');

        try {
            const cartPanel = document.querySelector('wow-side-cart-panel');
            if (!cartPanel || !cartPanel.offsetParent) {
                const mainCartButton = document.querySelector('#header-view-cart-button');
                if (!mainCartButton) {
                    setOperationStatus('cart-tab-status', 'Could not find the cart button to open the panel.');
                    return;
                }

                mainCartButton.click();
                await waitForElement('wow-side-cart-panel wow-cart-item', 8000);
                await sleepFixed(500); // Wait for animations
            }

            const result = scrapeCart();
            if (result.error) {
                setOperationStatus('cart-tab-status', result.error);
            } else {
                cartProducts = [...result.products];
                setOperationStatus('cart-tab-status', `Scraped ${cartProducts.length} items from the cart.`);
            }
            updateCartResultsDisplay();
        } catch (error) {
            console.error('Cart scraping error:', error);
            setOperationStatus('cart-tab-status', `Error scraping cart: ${error.message}`);
        }
    }

    async function runFetchWithRetries(url, statusAreaElement, originalStatus, signal, allowIndividualFetch = false) {
        if (!url || !isValidUrl(url)) {
            throw new Error("Invalid URL provided");
        }

        validateSettings();
        let lastError = null;

        for (let i = 0; i <= settings.maxRetries; i++) {
            if (signal?.aborted) throw new Error("Operation aborted");
            if (!allowIndividualFetch && !isOperationRunning) throw new Error("Operation stopped");

            try {
                const response = await fetch(url, {
                    signal,
                    headers: {
                        'User-Agent': navigator.userAgent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();
                if (!text) {
                    throw new Error("Empty response received");
                }

                const doc = new DOMParser().parseFromString(text, 'text/html');
                if (!doc) {
                    throw new Error("Failed to parse response");
                }

                return { doc };
            } catch (e) {
                if (signal?.aborted) throw e;
                lastError = e;

                if (i < settings.maxRetries) {
                    if (statusAreaElement) {
                        statusAreaElement.textContent = `Fetch failed. Retrying... (${i + 1}/${settings.maxRetries})`;
                    }
                    await sleepFixed(settings.retryDelay);
                    if (statusAreaElement && originalStatus) {
                        statusAreaElement.textContent = originalStatus;
                    }
                }
            }
        }

        throw lastError || new Error("All retries failed");
    }

    async function handleScrapeAllPages() {
        if (isOperationRunning) return;

        isOperationRunning = true;
        operationAbortController = new AbortController();
        const signal = operationAbortController.signal;
        scrapedProducts = [];

        const statusArea = document.getElementById('scraper-tab-status');
        const progressBar = document.getElementById('scraper-tab-progress-bar');

        updateScraperResultsDisplay();
        toggleOperationControls(true);

        try {
            let totalPages = 1;
            const pageCountEl = document.querySelector('.page-indicator .page-count');
            if (pageCountEl) {
                totalPages = safeParseInt(pageCountEl.textContent, 1);
            }

            setOperationStatus('scraper-tab-status', `Found ${totalPages} pages. Starting scrape...`);
            if (progressBar) {
                progressBar.style.display = 'block';
                progressBar.value = 0;
                progressBar.max = totalPages;
            }

            let currentPage = 1;

            while (currentPage <= totalPages && isOperationRunning && !signal.aborted) {
                setOperationStatus('scraper-tab-status', `Processing page ${currentPage} of ${totalPages}...`);

                // Mark current tiles as processed to avoid re-scraping
                document.querySelectorAll('shared-product-tile').forEach(t => {
                    t.classList.add('processed-by-scraper');
                });

                try {
                    const newProducts = await scrapeSearchPage();
                    scrapedProducts.push(...newProducts);
                    if (progressBar) progressBar.value = currentPage;
                    updateScraperResultsDisplay();
                } catch (error) {
                    console.warn(`Error scraping page ${currentPage}:`, error);
                    setOperationStatus('scraper-tab-status', `Warning: Page ${currentPage} failed - ${error.message}`);
                }

                if (signal.aborted || !isOperationRunning) break;

                // Go to next page if not the last one
                if (currentPage < totalPages) {
                    const nextButton = document.querySelector('.paging-next:not(.disabled)');
                    if (!nextButton) {
                        setOperationStatus('scraper-tab-status', "Could not find 'Next' button. Stopping.");
                        break;
                    }

                    nextButton.click();

                    // Wait for new product tiles to appear that were not there before
                    try {
                        await waitForElement('shared-product-tile:not(.processed-by-scraper)', 10000);
                        await sleepFixed(1500); // Extra sleep for full render
                    } catch (e) {
                        setOperationStatus('scraper-tab-status', `Timed out waiting for page ${currentPage + 1}. Stopping.`);
                        break;
                    }
                }
                currentPage++;
            }

            // Clean up processed markers
            document.querySelectorAll('.processed-by-scraper').forEach(t => {
                t.classList.remove('processed-by-scraper');
            });

            const finalMessage = isOperationRunning && !signal.aborted ?
                `Finished scraping. Found ${scrapedProducts.length} products.` :
                'Scraping stopped by user.';
            setOperationStatus('scraper-tab-status', finalMessage);

        } catch (error) {
            console.error('Scrape all error:', error);
            setOperationStatus('scraper-tab-status', `Error during scraping: ${error.message}`);
        } finally {
            isOperationRunning = false;
            operationAbortController = null;
            toggleOperationControls(false);
            resetProgressBar('scraper-tab-progress-bar');
            updateUIForActiveTab();
        }
    }

    async function runDetailFetchProcess(productList, statusAreaElementId, progressBarElementId, updateDisplayFunc) {
        if (isOperationRunning || !productList || productList.length === 0) return;

        isOperationRunning = true;
        operationAbortController = new AbortController();
        toggleOperationControls(true);

        const statusAreaElement = document.getElementById(statusAreaElementId);
        const progressBarElement = document.getElementById(progressBarElementId);
        const total = productList.length;

        setOperationStatus(statusAreaElementId, `Starting to fetch details for ${total} products...`);

        if (progressBarElement) {
            progressBarElement.style.display = 'block';
            progressBarElement.value = 0;
            progressBarElement.max = total;
        }

        try {
            for (let i = 0; i < total; i++) {
                if (!isOperationRunning || operationAbortController.signal.aborted) break;

                const product = productList[i];
                if (progressBarElement) progressBarElement.value = i + 1;

                if (!product.product_url || product.product_url === 'N/A' || !isValidUrl(product.product_url)) {
                    product.detail_error = "No valid URL to fetch.";
                    continue;
                }

                const productName = (product.detailed_name || product.name || 'Unknown').substring(0, 30);
                const originalStatus = `(${i + 1}/${total}) Fetching: ${productName}...`;
                setOperationStatus(statusAreaElementId, originalStatus);

                try {
                    const { doc } = await runFetchWithRetries(
                        product.product_url,
                        statusAreaElement,
                        originalStatus,
                        operationAbortController.signal,
                        false
                    );

                    const detailData = scrapeProductDetailPage(doc);
                    Object.assign(product, detailData);
                } catch (error) {
                    if (error.name === 'AbortError' || error.message.includes("aborted") || error.message.includes("stopped")) {
                        break;
                    }
                    product.detail_error = `Fetch failed: ${error.message}`;
                }

                if (updateDisplayFunc) updateDisplayFunc();

                if (isOperationRunning && i < total - 1) {
                    await sleepRandom();
                }
            }

            const finalMessage = isOperationRunning ? 'Finished fetching all details.' : 'Fetching stopped by user.';
            setOperationStatus(statusAreaElementId, finalMessage);

        } catch (error) {
            console.error('Detail fetch error:', error);
            setOperationStatus(statusAreaElementId, `Error during detail fetching: ${error.message}`);
        } finally {
            isOperationRunning = false;
            operationAbortController = null;
            toggleOperationControls(false);
            resetProgressBar(progressBarElementId);
            updateUIForActiveTab();
        }
    }

    async function handleFetchScraperDetails() {
        await runDetailFetchProcess(
            scrapedProducts,
            'scraper-tab-status',
            'scraper-tab-progress-bar',
            updateScraperResultsDisplay
        );
    }

    async function handleFetchCartDetails() {
        await runDetailFetchProcess(
            cartProducts,
            'cart-tab-status',
            'cart-tab-progress-bar',
            updateCartResultsDisplay
        );
    }

    async function handleProductActions(e) {
        const btn = e.target.closest('.product-delete-btn, .product-copy-btn, .product-expand-btn, .product-retry-fetch-btn');
        if (!btn) return;

        const wrapper = btn.closest('.product-item-wrapper');
        const productItem = wrapper?.querySelector('.product-item');
        if (!productItem) return;

        const index = safeParseInt(productItem.dataset.productIndex, -1);
        const tabType = productItem.dataset.tabType;
        const productList = tabType === 'scraper' ? scrapedProducts : cartProducts;

        if (index < 0 || index >= productList.length) return;
        const product = productList[index];

        if (btn.classList.contains('product-delete-btn')) {
            if (isOperationRunning) return;
            productList.splice(index, 1);
            if (tabType === 'scraper') updateScraperResultsDisplay();
            else updateCartResultsDisplay();

        } else if (btn.classList.contains('product-copy-btn')) {
            const success = await copyToClipboard(JSON.stringify(product, null, 2));
            if (success) {
                btn.classList.add('copied');
                btn.innerHTML = icons.check;
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = icons.copy;
                }, 1500);
            } else {
                alert('Failed to copy to clipboard');
            }

        } else if (btn.classList.contains('product-retry-fetch-btn')) {
            const detailsContainer = wrapper.querySelector('.product-details-expanded');
            const expandBtnFromHeader = productItem.querySelector('.product-expand-btn');
            delete product.detail_error;
            await fetchAndDisplaySingleDetail(index, tabType, detailsContainer, expandBtnFromHeader);

        } else if (btn.classList.contains('product-expand-btn')) {
            const detailsContainer = wrapper.querySelector('.product-details-expanded');
            const isVisible = detailsContainer.style.display !== 'none';

            if (isVisible) {
                detailsContainer.style.display = 'none';
                btn.innerHTML = icons.expand;
            } else {
                if (product.detailed_name || product.detail_error) {
                    renderExpandedDetails(detailsContainer, product);
                    detailsContainer.style.display = 'block';
                    btn.innerHTML = icons.collapse;
                } else {
                    await fetchAndDisplaySingleDetail(index, tabType, detailsContainer, btn);
                }
            }
        }
    }

    async function fetchAndDisplaySingleDetail(index, tabType, detailsContainer, expandBtn) {
        const productList = tabType === 'scraper' ? scrapedProducts : cartProducts;
        const product = productList[index];

        if (!product.product_url || product.product_url === 'N/A' || !isValidUrl(product.product_url)) {
            product.detail_error = "No valid URL to fetch.";
            renderExpandedDetails(detailsContainer, product);
            detailsContainer.style.display = 'block';
            if (expandBtn) expandBtn.innerHTML = icons.collapse;
            return;
        }

        detailsContainer.innerHTML = `<div class="details-loading">Fetching details...</div>`;
        detailsContainer.style.display = 'block';

        if (expandBtn) {
            expandBtn.disabled = true;
            expandBtn.innerHTML = icons.collapse;
        }

        try {
            const { doc } = await runFetchWithRetries(product.product_url, null, '', null, true);
            const detailData = scrapeProductDetailPage(doc);
            Object.assign(product, detailData);
        } catch (error) {
            product.detail_error = `Fetch failed: ${error.message}`;
        }

        renderExpandedDetails(detailsContainer, product);
        if (expandBtn) expandBtn.disabled = false;
    }

    function renderExpandedDetails(container, product) {
        if (!container || !product) return;

        const keysToIgnore = new Set(['name', 'price', 'unit_price', 'image_url', 'product_url', 'itemTotal', 'quantity']);
        let html = '<dl class="details-dl">';
        let hasContent = false;

        for (const key in product) {
            if (!keysToIgnore.has(key) && product[key] != null && product[key] !== 'N/A' && String(product[key]).trim() !== '') {
                const prettyKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                let valueHtml;
                if (typeof product[key] === 'object' && product[key] !== null) {
                    valueHtml = `<pre>${JSON.stringify(product[key], null, 2)}</pre>`;
                } else {
                    const value = String(product[key]);
                    valueHtml = value.length > 500 ? value.substring(0, 500) + '...' : value;
                }

                if (key === 'detail_error') {
                    html += `<dt>Error</dt>
                             <dd class="details-error-dd">
                                 <span>${valueHtml}</span>
                                 <button class="product-action-btn product-retry-fetch-btn" title="Retry Fetch">${icons.retry}</button>
                             </dd>`;
                } else {
                    html += `<dt>${prettyKey}</dt><dd>${valueHtml}</dd>`;
                }
                hasContent = true;
            }
        }

        if (!hasContent) {
            html += '<dd style="grid-column: 1 / -1;">No additional details available.</dd>';
        }

        html += '</dl>';
        container.innerHTML = html;
    }

    // --- EXPORT FUNCTIONS ---
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
            default: console.warn('Unknown export action:', action);
        }
    }

    function selectExportOption(e) {
        const option = e.currentTarget;
        if (!option) return;

        const action = option.dataset.action;
        const mainBtn = document.getElementById('export-main-btn');

        if (mainBtn && action) {
            mainBtn.innerHTML = option.innerHTML;
            mainBtn.dataset.action = action;
        }

        const menu = document.getElementById('export-menu');
        if (menu) menu.style.display = 'none';

        if (action) executeExportAction(action);
    }

    function handleExport() {
        const mainBtn = document.getElementById('export-main-btn');
        const action = mainBtn?.dataset?.action || 'copy-json';
        executeExportAction(action);
    }

    function downloadFile(filename, content, mimeType) {
        if (!filename || !content) return;

        try {
            const blob = new Blob([content], { type: mimeType || 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch (e) {
            console.error('Download failed:', e);
            alert('Download failed. Please try again.');
        }
    }

    function prepareDataForExport() {
        const sourceData = activeTab === 'scraper' ? scrapedProducts : cartProducts;

        if (!sourceData || sourceData.length === 0) {
            return { items: [] };
        }

        const exportData = sourceData.map(p => {
            const newProd = { ...p };
            if (!settings.includeImageUrlOnCopy) delete newProd.image_url;
            if (!settings.includeProductUrlOnCopy) delete newProd.product_url;
            return newProd;
        });

        const result = { items: exportData };

        if (activeTab === 'cart' && cartProducts.length > 0) {
            const total = cartProducts.reduce((acc, p) => acc + (p.itemTotal || 0), 0);
            result.totalPrice = safeParseFloat(total.toFixed(2), 0);
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
        if (dataToExport.items.length === 0) {
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
                alert('Failed to copy. Try downloading instead.');
            }
        }
    }

    async function exportCSV(download = false) {
        const data = prepareDataForExport();
        if (data.items.length === 0) {
            alert('No data to export.');
            return;
        }

        let csvContent = '';

        if (data.totalPrice) {
            csvContent += `Total Price,"${data.totalPriceFormatted}"\n\n`;
        }

        // Get all unique keys from all items (excluding objects)
        const headers = Array.from(new Set(
            data.items.flatMap(p =>
                Object.keys(p).filter(k => typeof p[k] !== 'object' || p[k] === null)
            )
        ));

        csvContent += headers.join(',') + '\n';

        data.items.forEach(p => {
            const row = headers.map(h => {
                let value = p[h];
                if (value == null) value = '';

                value = String(value).replace(/"/g, '""');
                return (value.includes(',') || value.includes('\n') || value.includes('"')) ? `"${value}"` : value;
            });
            csvContent += row.join(',') + '\n';
        });

        if (download) {
            const filename = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.csv`;
            downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
        } else {
            const success = await copyToClipboard(csvContent);
            if (success) {
                showCopyFeedback('export-main-btn');
            } else {
                alert('Failed to copy. Try downloading instead.');
            }
        }
    }

    function generateMarkdown() {
        const sourceData = activeTab === 'scraper' ? scrapedProducts : cartProducts;
        if (!sourceData || sourceData.length === 0) return null;

        let md = `# ${activeTab === 'cart' ? 'Cart' : 'Product List'} - Woolworths\n\n`;

        const keyMap = {
            detailed_name: 'Full Name',
            brand: 'Brand',
            description: 'Description',
            detailed_current_price: 'Price',
            price: 'Price',
            savings: 'Savings',
            unit_price: 'Unit Price',
            quantity: 'Quantity',
            itemTotal: 'Subtotal',
            rating: 'Rating',
            review_count: 'Reviews',
            product_url: 'URL',
            detail_error: 'Error'
        };

        const keyOrder = [
            'detailed_name', 'brand', 'description', 'detailed_current_price', 'price',
            'savings', 'unit_price', 'quantity', 'itemTotal', 'rating', 'review_count',
            'ingredients', 'allergens', 'country_of_origin', 'storage_instructions',
            'product_url', 'detail_error'
        ];

        sourceData.forEach(product => {
            md += '---\n\n';
            const name = product.detailed_name || product.name || 'Unnamed Product';
            md += `## ${name}\n`;

            if (product.image_url && settings.includeImageUrlOnCopy && isValidUrl(product.image_url)) {
                md += `![${name}](${product.image_url})\n`;
            }
            md += '\n';

            let mdList = '';
            keyOrder.forEach(key => {
                const value = product[key];
                if (value && value !== 'N/A' && value !== 'None' && String(value).trim() !== '' && typeof value !== 'object') {
                    const displayName = keyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const displayValue = String(value).replace(/\n/g, ' ').substring(0, 200);
                    mdList += `- **${displayName}**: ${displayValue}\n`;
                }
            });

            md += mdList ? mdList + '\n' : '';
        });

        if (activeTab === 'cart' && cartProducts.length > 0) {
            md += '---\n\n';
            const total = cartProducts.reduce((acc, p) => acc + (p.itemTotal || 0), 0);
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
                alert('Failed to copy. Try downloading instead.');
            }
        }
    }

    function clearResults() {
        if (isOperationRunning) return;

        if (activeTab === 'scraper') {
            scrapedProducts = [];
            updateScraperResultsDisplay();
        } else {
            cartProducts = [];
            updateCartResultsDisplay();
        }
    }

    function makeDraggable(element, handle) {
        if (!element || !handle) return;

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        const dragMouseDown = (e) => {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };

        const elementDrag = (e) => {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            let newTop = element.offsetTop - pos2;
            let newLeft = element.offsetLeft - pos1;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const elementWidth = element.offsetWidth;
            const elementHeight = element.offsetHeight;

            if (newTop < 0) newTop = 0;
            if (newLeft < 0) newLeft = 0;
            if (newTop + elementHeight > viewportHeight) newTop = viewportHeight - elementHeight;
            if (newLeft + elementWidth > viewportWidth) newLeft = viewportWidth - elementWidth;

            element.style.top = newTop + "px";
            element.style.left = newLeft + "px";
        };

        const closeDragElement = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };

        handle.onmousedown = dragMouseDown;
    }

    function setupPageChangeMonitoring() {
        let currentUrl = window.location.href;

        const observer = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                setTimeout(() => {
                    if (!isOperationRunning) {
                        updateUIForActiveTab();
                    }
                }, 1500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Cleanup function
        cleanupFunctions.push(() => observer.disconnect());
    }

    // --- CSS STYLES ---
    GM_addStyle(`
        :root {
            --ww-green: #178841;
            --ww-green-dark: #116a32;
            --ww-text-primary: #1a1a1a;
            --ww-text-secondary: #5a5a5a;
            --ww-text-light: #828282;
            --ww-border: #e6e6e6;
            --ww-background: #f7f8f9;
            --ww-background-white: #ffffff;
            --ww-grey-dark: #33373a;
            --ww-grey-dark-hover: #494e52;
            --ww-blue-stop: #007bff;
            --ww-green-success: #4caf50;
        }
        #woolies-scraper-toggle {
            position: fixed; top: 100px; right: 0; width: 48px; height: 48px; background-color: var(--ww-green);
            color: white; border-radius: 8px 0 0 8px; display: flex; align-items: center; justify-content: center;
            cursor: pointer; box-shadow: -2px 2px 8px rgba(0,0,0,0.2); z-index: 99999; transition: all 0.2s ease; user-select: none;
        }
        #woolies-scraper-toggle:hover { background-color: var(--ww-green-dark); }
        #woolies-scraper-toggle svg { width: 28px; height: 28px; }
        #woolies-scraper-panel {
            position: fixed; top: 20px; right: 20px; width: 480px; max-height: 90vh; background-color: var(--ww-background-white);
            border: 1px solid #d9d9d9; border-radius: 8px; box-shadow: 0 8px 24px rgba(26, 26, 26, 0.15);
            z-index: 99999; display: flex; flex-direction: column; overflow: hidden;
            font-family: "Helvetica Neue", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #woolies-scraper-header {
            padding: 12px 18px; cursor: move; background-color: var(--ww-background-white); color: var(--ww-text-primary);
            font-weight: 500; font-size: 18px; border-bottom: 1px solid var(--ww-border);
            border-top-left-radius: 8px; border-top-right-radius: 8px; display: flex; justify-content: space-between; align-items: center;
        }
        #close-panel-btn { background: none; border: none; color: var(--ww-text-secondary); font-size: 24px; cursor: pointer; padding: 0 5px; line-height: 1; opacity: 0.8; transition: all 0.2s; }
        #close-panel-btn:hover { opacity: 1; color: var(--ww-text-primary); }
        #woolies-scraper-tabs { display: flex; border-bottom: 1px solid var(--ww-border); background-color: var(--ww-background-white); padding: 0 10px; }
        .tab-btn {
            padding: 14px 10px; margin: 0 8px; border: none; background: none; cursor: pointer; font-size: 15px; font-weight: 500;
            color: var(--ww-text-secondary); border-bottom: 3px solid transparent; transition: all 0.2s ease;
        }
        .tab-btn:hover { color: var(--ww-text-primary); }
        .tab-btn.active { color: var(--ww-green); border-bottom-color: var(--ww-green); font-weight: 700; }
        #woolies-scraper-content {
            padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px;
            background-color: var(--ww-background);
            border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;
        }
        .tab-content { display: none; flex-direction: column; gap: 15px; }
        .tab-content.active { display: flex; }

        .product-list-container {
            width: 100%; height: 350px; background-color: var(--ww-background); border: none;
            padding: 2px; box-sizing: border-box;
            overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
        }
        .product-item-wrapper {
            background-color: var(--ww-background-white); border: 1px solid var(--ww-border);
            border-radius: 8px;
        }
        .product-item { display: flex; align-items: center; gap: 15px; padding: 12px; }
        .product-item-img { width: 50px; height: 50px; object-fit: contain; flex-shrink: 0; border-radius: 4px; }
        .product-item-details { flex: 1; min-width: 0; }
        .product-name {
            font-weight: 400; color: var(--ww-text-primary); margin: 0 0 4px 0; white-space: nowrap;
            overflow: hidden; text-overflow: ellipsis; font-size: 14px;
        }
        .product-price { font-weight: 700; color: var(--ww-text-primary); margin: 0; font-size: 15px; }
        .product-unit-price { font-weight: 400; color: var(--ww-text-light); font-size: 12px; margin-left: 8px; }
        .product-quantity { font-size: 13px; color: var(--ww-text-secondary); margin: 4px 0 0 0;}

        .product-item-actions { display: flex; gap: 8px; align-items: center; }
        .product-action-btn {
            background-color: #f2f2f2; border: none; color: var(--ww-text-secondary);
            width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
        }
        .product-action-btn:hover:not(:disabled) { background-color: #e6e6e6; color: var(--ww-text-primary); }
        .product-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .product-action-btn:disabled.temporarily-disabled { opacity: 0.7; }
        .product-action-btn svg { width: 16px; height: 16px; }
        .product-delete-btn:hover:not(:disabled) { background-color: #fff0f0; color: #d92121; }
        .product-copy-btn:hover:not(:disabled):not(.copied) { background-color: #eef5ff; color: #005fcc; }
        .product-copy-btn.copied { background-color: var(--ww-green-success) !important; color: white !important; transition: all 0.3s ease; }
        .product-retry-fetch-btn:hover:not(:disabled) { background-color: #eef5ff; color: #005fcc; }

        .product-details-expanded { padding: 12px 15px; border-top: 1px solid var(--ww-border); background-color: #fafafa; font-size: 13px; }
        .details-loading { font-style: italic; color: var(--ww-text-secondary); }
        .details-dl { margin: 0; display: grid; grid-template-columns: 140px 1fr; gap: 8px; }
        .details-dl dt { font-weight: 500; color: var(--ww-text-primary); }
        .details-dl dd { margin: 0; color: var(--ww-text-secondary); word-break: break-word; }
        .details-dl dd pre { white-space: pre-wrap; background-color: #fff; padding: 5px; border-radius: 3px; border: 1px solid #eee; }
        .details-error-dd { display: flex; align-items: center; gap: 10px; color: #d92121; }
        .details-error-dd span { flex-grow: 1; }

        #cart-total-price {
            padding: 12px 18px; background-color: var(--ww-background-white); border: 1px solid var(--ww-border);
            border-radius: 6px; display: flex; justify-content: space-between; align-items: center;
            font-size: 16px; font-weight: 500; color: var(--ww-text-primary);
        }
        .total-price-value { font-size: 18px; font-weight: 700; color: var(--ww-text-primary); }

        .status-container { display: flex; flex-direction: column; gap: 8px; padding: 0 4px; }
        #scraper-tab-status, #cart-tab-status {
            color: var(--ww-text-secondary); min-height: 1.2em; font-size: 14px;
        }
        #scraper-tab-progress-bar, #cart-tab-progress-bar { width: 100%; height: 6px; border-radius: 3px; border: none; }
        #scraper-tab-progress-bar::-webkit-progress-bar, #cart-tab-progress-bar::-webkit-progress-bar { background-color: #e0e0e0; border-radius: 3px; }
        #scraper-tab-progress-bar::-webkit-progress-value, #cart-tab-progress-bar::-webkit-progress-value { background-color: var(--ww-green); border-radius: 3px; transition: width 0.3s ease; }

        .button-group { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .button-group.export-group { border-top: 1px solid var(--ww-border); padding-top: 15px; justify-content: flex-end; }
        .button-group button {
            display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 18px;
            border: 1px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;
            font-size: 14px; font-weight: 700; line-height: 1;
        }
        .button-group button:disabled { background-color: #e6e6e6 !important; color: #a6a6a6 !important; cursor: not-allowed; box-shadow: none; border-color: #e6e6e6 !important; transform: none; }
        .button-group button svg { width: 16px; height: 16px; stroke-width: 2.5; stroke: currentColor; }

        /* Primary and Secondary Button Styles */
        #scraper-scrape-all-btn, #scraper-fetch-details-btn, #cart-fetch-details-btn { background-color: var(--ww-green); color: white; }
        #scraper-scrape-all-btn:hover:not(:disabled), #scraper-fetch-details-btn:hover:not(:disabled), #cart-fetch-details-btn:hover:not(:disabled) { background-color: var(--ww-green-dark); }
        #scraper-scrape-current-btn, #scraper-scrape-detail-btn, #cart-scrape-btn { background-color: var(--ww-background-white); color: var(--ww-green); border: 1px solid var(--ww-green); }
        #scraper-scrape-current-btn:hover:not(:disabled), #scraper-scrape-detail-btn:hover:not(:disabled), #cart-scrape-btn:hover:not(:disabled) { background-color: var(--ww-green); color: var(--ww-background-white); }

        /* Tertiary/Other Buttons */
        #clear-btn { background-color: var(--ww-grey-dark); color: white; border-color: var(--ww-grey-dark); }
        #clear-btn:hover:not(:disabled) { background-color: var(--ww-grey-dark-hover); border-color: var(--ww-grey-dark-hover); }
        .stop-button { background-color: var(--ww-blue-stop); color: white; border-color: var(--ww-blue-stop); }

        .export-btn-container { position: relative; display: flex; margin-right: auto; }
        #export-main-btn { border-radius: 8px 0 0 8px; border-right: none; background-color: var(--ww-background-white); color: var(--ww-green); border: 1px solid var(--ww-green); }
        #export-main-btn:hover:not(:disabled) { background-color: var(--ww-green); color: var(--ww-background-white); }
        #export-main-btn.copied-success { background-color: var(--ww-green-success) !important; color: white !important; border-color: var(--ww-green-success) !important; }
        #export-toggle-btn { padding: 10px 12px; border-radius: 0 8px 8px 0; border: 1px solid var(--ww-green); background-color: var(--ww-background-white); color: var(--ww-green); font-size: 10px; font-weight: bold; margin-left: -1px; }
        #export-toggle-btn:hover:not(:disabled) { background-color: var(--ww-green); color: var(--ww-background-white); }
        #export-menu { position: absolute; bottom: 110%; left: 0; background-color: var(--ww-background-white); border: 1px solid var(--ww-border); border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; width: 220px; overflow: hidden; }
        .export-option { display: flex; align-items: center; gap: 10px; padding: 10px 15px; cursor: pointer; font-size: 14px; color: var(--ww-text-primary); transition: background-color 0.2s; }
        .export-option:hover { background-color: var(--ww-background); }
        .export-option svg { width: 16px; height: 16px; stroke-width: 2; color: var(--ww-text-secondary); }

        .info-message { display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; color: #666; text-align: center; padding: 20px; background-color: transparent; border-radius: 6px; box-sizing: border-box; }
        #scraper-settings { border: 1px solid var(--ww-border); border-radius: 8px; background-color: var(--ww-background-white); transition: opacity 0.3s; margin-top: 5px; }
        #scraper-settings summary {
            font-weight: 500; cursor: pointer; padding: 12px 15px; color: var(--ww-text-primary);
            border-radius: 6px; list-style: none; display: flex; align-items: center;
        }
        #scraper-settings summary::-webkit-details-marker { display: none; }
        #scraper-settings summary:before {
            content: '▶'; display: inline-block; font-size: 0.8em;
            margin-right: 10px; transition: transform 0.2s ease;
        }
        #scraper-settings[open] > summary:before { transform: rotate(90deg); }
        #scraper-settings summary:hover { background-color: var(--ww-background); }
        #scraper-settings > div { padding: 15px; border-top: 1px solid var(--ww-border); }
        .settings-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px 15px; align-items: center; font-size: 14px; }
        .settings-grid:not(:last-child) { border-bottom: 1px solid #f0f0f0; padding-bottom: 15px; margin-bottom: 15px; }
        .settings-grid label { justify-self: start; color: var(--ww-text-secondary); }
        .settings-grid input[type="number"] { width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
        .settings-grid input[type="number"]:focus { border-color: var(--ww-green); outline: none; box-shadow: 0 0 0 2px rgba(23, 136, 65, 0.2); }
        .settings-grid input[type="checkbox"] { justify-self: start; width: 18px; height: 18px; accent-color: var(--ww-green); }
    `);

    // --- INITIALIZATION ---
    function initialize() {
        console.log('Woolworths Scraper (Fixed): Initializing...');

        try {
            loadSettings();
            createUI();
            setupPageChangeMonitoring();
            switchTab('scraper');
            console.log('Woolworths Scraper (Fixed): Ready!');
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        handleStopOperation();
        cleanupEventListeners();
    });

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initialize();
    } else {
        window.addEventListener('DOMContentLoaded', initialize);
    }
})();