// ==UserScript==
// @name         Coles Scraper
// @namespace    http://tampermonkey.net/
// @version      7.2
// @description  Coles tool with tabbed UI for scraping products, detailed data fetching (concurrent queue), visual list display, and multiple export formats (JSON, CSV, Markdown).
// @author       Artificial Intelligence LOL & Gemini
// @match        https://www.coles.com.au/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-idle
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ColesScraper.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ColesScraper.user.js
// ==/UserScript==

(function () {
    'use strict';

    // --- SVG ICONS (inline, keyed) ---
    const I = {
        scrapePage: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        scrapeAll: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
        fetchDet: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>`,
        trolley: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
        stop: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
        copy: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
        clear: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
        tool: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
        check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        expand: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
        collapse: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`,
        retry: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    };

    // --- STATE ---
    const DATA = { scraper: [], trolley: [] }; // unified product stores
    let activeTab = 'scraper';
    let isRunning = false;
    let abortCtrl = null;

    const cfg = {
        minDelay: 800, maxDelay: 1500,
        maxRetries: 3, retryDelay: 2000,
        concurrency: 4,
        pageConcurrency: 2,
        inclImg: true, inclUrl: true,
        exportAction: 'copy-json',
    };

    // --- DOM CACHE (populated after createUI) ---
    const $ = {};

    // --- UTILITIES ---
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const sleepR = () => sleep(Math.random() * (cfg.maxDelay - cfg.minDelay) + cfg.minDelay);

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
    function validateCfg() {
        cfg.minDelay = clamp(cfg.minDelay, 100, 10000);
        cfg.maxDelay = clamp(cfg.maxDelay, cfg.minDelay, 10000);
        cfg.maxRetries = clamp(cfg.maxRetries, 0, 10);
        cfg.retryDelay = clamp(cfg.retryDelay, 100, 10000);
        cfg.concurrency = clamp(cfg.concurrency, 1, 32);
        cfg.pageConcurrency = clamp(cfg.pageConcurrency, 1, 16);
    }

    const CFG_KEY = 'coles-scraper-cfg';
    function saveCfg() {
        try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch { }
    }
    function loadCfg() {
        try {
            const saved = JSON.parse(localStorage.getItem(CFG_KEY) || 'null');
            if (saved && typeof saved === 'object') Object.assign(cfg, saved);
        } catch { }
    }

    async function copyText(text) {
        if (typeof GM_setClipboard === 'function') { GM_setClipboard(text, 'text'); return true; }
        if (navigator.clipboard?.writeText) { try { await navigator.clipboard.writeText(text); return true; } catch { } }
        try {
            const ta = Object.assign(document.createElement('textarea'), {
                value: text, style: 'position:fixed;opacity:0;top:-9999px;left:-9999px'
            });
            document.body.appendChild(ta);
            ta.focus(); ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch { return false; }
    }

    const waitFor = (sel, timeout = 5000) => new Promise((res, rej) => {
        let elapsed = 0;
        const iv = setInterval(() => {
            const el = document.querySelector(sel);
            if (el) { clearInterval(iv); return res(el); }
            if ((elapsed += 100) >= timeout) { clearInterval(iv); rej(new Error(`${sel} not found`)); }
        }, 100);
    });

    function parseImgUrl(img) {
        if (!img?.src) return null;
        const tryExtract = src => {
            try { return decodeURIComponent(new URL(src).searchParams.get('url') || ''); } catch { return ''; }
        };
        return tryExtract(img.src) || tryExtract((img.getAttribute('srcset') || '').split(' ')[0]) || img.src;
    }

    // --- QUEUE UTILITY ---
    class TaskQueue {
        constructor(concurrency, signal) {
            this._conc = concurrency;
            this._signal = signal;
            this._tasks = [];
            this._running = 0;
            this._resolve = null;
            this._reject = null;
            this._settled = false;
            this._results = [];
            this._errors = [];
        }

        push(fn) {
            this._tasks.push(fn);
        }

        run() {
            return new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
                this._drain();
            });
        }

        _drain() {
            if (this._settled) return;
            while (this._running < this._conc && this._tasks.length > 0) {
                if (this._signal?.aborted) {
                    this._settle(); return;
                }
                const task = this._tasks.shift();
                this._running++;
                task().then(
                    val => { this._results.push(val); this._running--; this._drain(); },
                    err => {
                        if (err.name === 'AbortError' || err.message === 'Operation stopped') {
                            this._tasks.length = 0; // flush remaining
                            this._errors.push(err);
                        } else {
                            this._errors.push(err);
                        }
                        this._running--;
                        this._drain();
                    }
                );
            }
            if (this._running === 0 && this._tasks.length === 0) {
                this._settle();
            }
        }

        _settle() {
            if (this._settled) return;
            this._settled = true;
            this._resolve({ results: this._results, errors: this._errors });
        }
    }

    // --- PAGE DETECTION ---
    const detectPage = () => {
        const p = location.pathname;
        if (p.includes('/search') || document.querySelector("section[data-testid='product-tile']")) return 'list';
        if (p.includes('/product/') && document.getElementById('__NEXT_DATA__')) return 'detail';
        return 'other';
    };

    // --- SCRAPING ---
    function scrapeList(doc = document) {
        const products = [];
        doc.querySelectorAll("section[data-testid='product-tile']").forEach(tile => {
            try {
                const link = tile.querySelector('a.product__link');
                let product_url = 'N/A';
                try { product_url = link ? new URL(link.href, location.origin).href : 'N/A'; } catch { }
                products.push({
                    name: tile.querySelector('h2.product__title')?.textContent.trim() || 'N/A',
                    product_url,
                    price: tile.querySelector('span.price__value')?.textContent.trim() || 'N/A',
                    unit_price: tile.querySelector('div.price__calculation_method')?.textContent.trim() || 'N/A',
                    image_url: parseImgUrl(tile.querySelector("img[data-testid='product-image']")),
                });
            } catch (e) { console.error('Tile parse error:', e); }
        });
        return products;
    }

    function scrapeDetail(doc = document) {
        const pd = {};
        const script = doc.getElementById('__NEXT_DATA__');
        if (!script?.textContent) return { detail_error: '__NEXT_DATA__ not found.' };
        try {
            const pi = JSON.parse(script.textContent)?.props?.pageProps?.product;
            if (!pi) return { detail_error: 'Product info absent in __NEXT_DATA__.' };

            pd.detailed_name = `${pi.name || ''} | ${pi.size || ''}`.replace(/^ \| | \| $/g, '');
            pd.brand = pi.brand || 'N/A';

            const pr = pi.pricing || {};
            pd.detailed_current_price = pr.now ? `$${pr.now.toFixed(2)}` : 'N/A';
            pd.detailed_original_price = pr.was ? `$${pr.was.toFixed(2)}` : 'None';
            pd.savings = pr.saveStatement || 'None';

            if (pi.longDescription) {
                const d = document.createElement('div');
                d.innerHTML = pi.longDescription;
                pd.description = d.textContent || 'N/A';
            } else pd.description = 'N/A';

            (pi.additionalInfo || []).forEach(({ title, description }) => {
                if (title && description)
                    pd[title.toLowerCase().replace(/\s+/g, '_')] = description;
            });

            pd.barcode_gtin = pi.gtin || 'N/A';

            const rv = doc.querySelector('div[data-bv-show="rating_summary"][data-bv-ready="true"]');
            pd.rating = rv?.querySelector('.bv_avgRating_component_container')?.textContent.trim() + ' / 5' || 'N/A';
            pd.review_count = rv?.querySelector('.bv_numReviews_text')?.textContent.trim().replace(/[()]/g, '') || 'N/A';

            const di = doc.querySelector('img[data-testid^="product-image"]');
            if (di) pd.image_url = parseImgUrl(di);
        } catch (e) { pd.detail_error = `JSON parse error: ${e.message}`; }
        return pd;
    }

    function scrapeTrolley() {
        const ul = document.querySelector('#trolley-drawer-available-items ul');
        if (!ul) return { error: 'Trolley list not found.' };
        const items = [];
        Array.from(ul.children).forEach(li => {
            try {
                const title = li.querySelector('a[data-testid="product_in_trolley__title"]');
                const img = li.querySelector('img[data-testid="product-image"]');
                const qty = li.querySelector('select[data-testid="quantity-picker-select"]');
                const price = li.querySelector('span[data-testid="product-pricing"]');
                if (!title || !img || !qty || !price) return;
                const quantity = parseInt(qty.value, 10);
                const itemTotal = parseFloat(price.textContent.replace('$', ''));
                if (isNaN(quantity) || isNaN(itemTotal)) return;
                let product_url = 'N/A';
                try { product_url = new URL(title.href, location.origin).href; } catch { }
                items.push({
                    name: title.textContent.trim(), image_url: img.src,
                    product_url, quantity, price: `$${itemTotal.toFixed(2)}`, itemTotal,
                });
            } catch (e) { console.error('Trolley item parse:', e); }
        });
        return items.length ? { products: items } : { error: 'No valid trolley products.' };
    }

    // --- NETWORK ---
    async function fetchWithRetry(url, signal, checkRunning = true) {
        validateCfg();
        let lastErr;
        for (let i = 0; i <= cfg.maxRetries; i++) {
            if (signal?.aborted || (checkRunning && !isRunning)) throw new Error('Operation stopped');
            try {
                const res = await fetch(url, signal ? { signal } : {});
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return new DOMParser().parseFromString(await res.text(), 'text/html');
            } catch (e) {
                if (e.name === 'AbortError' || e.message === 'Operation stopped') throw e;
                lastErr = e;
                if (i < cfg.maxRetries) await sleep(cfg.retryDelay);
            }
        }
        throw lastErr;
    }

    // --- UI HELPERS ---
    const setStatus = (tab, msg) => { if ($[`${tab}Status`]) $[`${tab}Status`].textContent = msg; };
    const setProgress = (tab, val, max, show) => {
        const pb = $[`${tab}Progress`];
        if (!pb) return;
        pb.style.display = show ? 'block' : 'none';
        if (show) { pb.value = val; pb.max = max; }
    };

    function toggleControls(on) {
        document.querySelectorAll('.button-group button:not(.stop-btn)').forEach(b => b.disabled = on);
        document.querySelectorAll('.product-action-btn').forEach(b => b.disabled = on);
        $.settings.style.pointerEvents = on ? 'none' : 'auto';
        $.settings.style.opacity = on ? '0.6' : '1';
        document.querySelectorAll('.stop-btn').forEach(b => {
            b.style.display = on ? 'inline-flex' : 'none';
            b.disabled = !on;
        });
    }

    // --- RENDER ---
    const DEFAULT_IMG = 'https://www.coles.com.au/_next/static/images/default_product_image-cf915244318b7c77271b489369949419.png';

    function renderList(container, products, tab) {
        container.innerHTML = '';
        products.forEach((p, i) => {
            const name = p.detailed_name || p.name || 'N/A';
            const price = p.detailed_current_price || p.price || 'N/A';
            const unitPrice = p.unit_price || '';
            const img = p.image_url || DEFAULT_IMG;
            const extra = tab === 'trolley' ? `<p class="product-quantity">Qty: <strong>${p.quantity}</strong></p>` : '';
            const wrap = document.createElement('div');
            wrap.className = 'product-item-wrapper';
            wrap.innerHTML = `
                <div class="product-item" data-i="${i}" data-tab="${tab}">
                    <img src="${img}" class="product-item-img" alt="" loading="lazy" onerror="this.src='${DEFAULT_IMG}'">
                    <div class="product-item-details">
                        <p class="product-name" title="${name}">${name}</p>
                        <p class="product-price">${price} <span class="product-unit-price">${unitPrice}</span></p>
                        ${extra}
                    </div>
                    <div class="product-item-actions">
                        <button class="product-action-btn product-expand-btn" title="Expand">${I.expand}</button>
                        <button class="product-action-btn product-copy-btn"   title="Copy JSON">${I.copy}</button>
                        <button class="product-action-btn product-delete-btn" title="Delete">${I.trash}</button>
                    </div>
                </div>
                <div class="product-details-expanded" style="display:none"></div>`;
            container.appendChild(wrap);
        });
    }

    function renderExpanded(container, p) {
        const SKIP = new Set(['name', 'price', 'unit_price', 'image_url', 'product_url', 'itemTotal', 'quantity']);
        let html = '<dl class="details-dl">';
        let any = false;
        for (const k in p) {
            if (SKIP.has(k) || !p[k] || p[k] === 'N/A' || !String(p[k]).trim()) continue;
            const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            html += k === 'detail_error'
                ? `<dt>Error</dt><dd class="details-error-dd"><span>${p[k]}</span><button class="product-action-btn product-retry-btn" title="Retry">${I.retry}</button></dd>`
                : `<dt>${label}</dt><dd>${String(p[k]).substring(0, 500)}</dd>`;
            any = true;
        }
        if (!any) html += '<dd style="grid-column:1/-1">No additional details.</dd>';
        container.innerHTML = html + '</dl>';
    }

    function refreshDisplay(tab) {
        const products = DATA[tab];
        const list = $[`${tab}List`];
        const status = $[`${tab}Status`];
        if (!list) return;

        if (products.length) {
            renderList(list, products, tab);
            status.textContent = `Displaying ${products.length} products.`;
        } else {
            list.innerHTML = `<div class="info-message">No data. Click a button to start.</div>`;
            status.textContent = '';
        }

        if (tab === 'trolley') {
            const total = products.reduce((a, p) => a + (p.itemTotal || 0), 0);
            $.trolleyTotal.style.display = products.length ? 'flex' : 'none';
            if (products.length) $.trolleyTotal.innerHTML = `<span>Trolley Total:</span><span class="total-price-value">$${total.toFixed(2)}</span>`;
        }

        // Enable/disable fetch-details button
        const detBtn = $[`${tab}FetchBtn`];
        if (detBtn && !isRunning) detBtn.disabled = products.length === 0;
    }

    // --- TAB SWITCHING ---
    function buildScraperButtons() {
        const c = $.scraperBtns;
        const pt = detectPage();
        c.innerHTML = pt === 'list'
            ? `<button id="sc-page-btn">${I.scrapePage} Scrape Page</button>
               <button id="sc-all-btn">${I.scrapeAll} Scrape All</button>
               <button id="sc-det-btn" disabled>${I.fetchDet} Fetch Details</button>
               <button class="stop-btn" style="display:none">${I.stop} Stop</button>`
            : pt === 'detail'
                ? `<button id="sc-detail-btn">${I.scrapePage} Scrape Product</button>`
                : `<div class="info-message">Navigate to a Coles product or search page.</div>`;

        c.querySelector('#sc-page-btn')?.addEventListener('click', doScrapePage);
        c.querySelector('#sc-all-btn')?.addEventListener('click', doScrapeAll);
        c.querySelector('#sc-det-btn')?.addEventListener('click', () => doFetchDetails('scraper'));
        c.querySelector('#sc-detail-btn')?.addEventListener('click', doScrapeDetailPage);
        c.querySelector('.stop-btn')?.addEventListener('click', doStop);
        $['scraperFetchBtn'] = c.querySelector('#sc-det-btn');
    }

    function buildTrolleyButtons() {
        const c = $.trolleyBtns;
        c.innerHTML = `
            <button id="tr-scrape-btn">${I.trolley} Scrape Trolley</button>
            <button id="tr-det-btn" disabled>${I.fetchDet} Fetch Details</button>
            <button class="stop-btn" style="display:none">${I.stop} Stop</button>`;
        c.querySelector('#tr-scrape-btn').addEventListener('click', doScrapeTrolley);
        c.querySelector('#tr-det-btn').addEventListener('click', () => doFetchDetails('trolley'));
        c.querySelector('.stop-btn').addEventListener('click', doStop);
        $['trolleyFetchBtn'] = c.querySelector('#tr-det-btn');
    }

    function switchTab(tab) {
        if (isRunning) { alert('Stop the current operation first.'); return; }
        activeTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${tab}-tab`));
        if (tab === 'scraper') { buildScraperButtons(); refreshDisplay('scraper'); }
        else { buildTrolleyButtons(); refreshDisplay('trolley'); }
    }

    // --- OPERATIONS ---
    function doStop() {
        isRunning = false;
        abortCtrl?.abort(); abortCtrl = null;
        ['scraper', 'trolley'].forEach(t => setStatus(t, 'Stopped.'));
        document.querySelectorAll('.stop-btn').forEach(b => b.disabled = true);
    }

    async function doScrapePage() {
        if (isRunning) return;
        DATA.scraper = scrapeList();
        refreshDisplay('scraper');
        setStatus('scraper', `Scraped ${DATA.scraper.length} products from this page.`);
    }

    async function doScrapeDetailPage() {
        if (isRunning) return;
        DATA.scraper = [scrapeDetail()];
        refreshDisplay('scraper');
        setStatus('scraper', 'Scraped product details.');
    }

    async function doScrapeAll() {
        if (isRunning) return;
        isRunning = true; abortCtrl = new AbortController();
        DATA.scraper = [];
        toggleControls(true);
        validateCfg();

        const pag = document.querySelector("div[data-testid='pagination-info']");
        let totalPages = 1;
        if (pag) {
            const of = pag.textContent.match(/of ([\d,]+)/);
            const rg = pag.textContent.match(/(\d+)\s*-\s*(\d+)/);
            if (of && rg) {
                const total = parseInt(of[1].replace(/,/g, ''), 10);
                const perPg = parseInt(rg[2], 10) - parseInt(rg[1], 10) + 1;
                if (perPg > 0) totalPages = Math.ceil(total / perPg);
            }
        }

        setStatus('scraper', `Found ${totalPages} pages. Starting…`);
        setProgress('scraper', 0, totalPages, true);

        // Scrape current page (page 1) directly
        DATA.scraper.push(...scrapeList());
        let completed = 1;
        setProgress('scraper', completed, totalPages, true);
        refreshDisplay('scraper');

        if (totalPages > 1) {
            const base = new URL(location.href);
            const sig = abortCtrl.signal;
            const conc = Math.min(cfg.pageConcurrency, totalPages - 1);

            // Slot for ordered results: pageResults[0] = page 2, pageResults[1] = page 3, ...
            const pageResults = new Array(totalPages - 1).fill(null);
            let earlyStop = false;

            const queue = new TaskQueue(conc, sig);

            for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
                const pn = pageNum; // closure capture
                queue.push(async () => {
                    if (!isRunning || sig.aborted || earlyStop) throw new Error('Operation stopped');
                    await sleepR();
                    if (!isRunning || sig.aborted || earlyStop) throw new Error('Operation stopped');

                    const url = new URL(base.href);
                    url.searchParams.set('page', pn);

                    const doc = await fetchWithRetry(url.href, sig);
                    const rows = scrapeList(doc);

                    if (!rows.length) {
                        earlyStop = true;
                        setStatus('scraper', `No products on page ${pn}. Stopping.`);
                        return;
                    }

                    pageResults[pn - 2] = rows;
                    completed++;
                    setProgress('scraper', completed, totalPages, true);
                    setStatus('scraper', `Fetched page ${pn}/${totalPages} (${completed}/${totalPages} done)…`);

                    // Merge all available ordered results so far
                    const merged = [];
                    for (const r of pageResults) {
                        if (r) merged.push(...r);
                    }
                    DATA.scraper = [...scrapeList(), ...merged]; // page 1 + ordered rest
                    refreshDisplay('scraper');
                });
            }

            await queue.run();
        }

        setStatus('scraper', isRunning ? `Done. ${DATA.scraper.length} products.` : 'Stopped.');
        isRunning = false; abortCtrl = null;
        toggleControls(false);
        setProgress('scraper', 0, 100, false);
        switchTab('scraper');
    }

    async function doScrapeTrolley() {
        if (isRunning) return;
        setStatus('trolley', 'Opening trolley…');
        const drawer = document.querySelector('div[data-testid="trolley-drawer"]');
        const open = drawer && drawer.getBoundingClientRect().width > 0 && getComputedStyle(drawer).visibility !== 'hidden';
        if (!open) {
            const btn = document.querySelector('button[data-testid="header-trolley-tablet-up"], button[data-testid="header-trolley"]');
            if (!btn) { setStatus('trolley', 'Trolley button not found.'); return; }
            btn.click();
            try { await waitFor('#trolley-drawer-available-items ul li'); await sleep(250); }
            catch { setStatus('trolley', 'Failed to load trolley.'); return; }
        }
        const result = scrapeTrolley();
        if (result.error) { setStatus('trolley', result.error); return; }
        DATA.trolley = result.products;
        refreshDisplay('trolley');
        setStatus('trolley', `Scraped ${DATA.trolley.length} items.`);
    }

    async function doFetchDetails(tab) {
        const products = DATA[tab];
        if (isRunning || !products.length) return;
        isRunning = true; abortCtrl = new AbortController();
        toggleControls(true);
        validateCfg();

        const total = products.length;
        const conc = Math.min(cfg.concurrency, total);
        let completed = 0;
        setStatus(tab, `Fetching details for ${total} products (concurrency: ${conc})…`);
        setProgress(tab, 0, total, true);

        let uiPending = false;
        const scheduleUI = () => {
            if (uiPending) return;
            uiPending = true;
            requestAnimationFrame(() => { uiPending = false; refreshDisplay(tab); });
        };

        const sig = abortCtrl.signal;
        const queue = new TaskQueue(conc, sig);

        for (let i = 0; i < total; i++) {
            const idx = i;
            queue.push(async () => {
                if (!isRunning || sig.aborted) throw new Error('Operation stopped');

                const p = products[idx];
                setStatus(tab, `(${completed}/${total}) ${(p.name || p.detailed_name || '').slice(0, 40)}…`);

                if (!p.product_url || p.product_url === 'N/A') {
                    p.detail_error = 'No URL.';
                } else {
                    try {
                        await sleepR();
                        if (!isRunning || sig.aborted) throw new Error('Operation stopped');
                        Object.assign(p, scrapeDetail(await fetchWithRetry(p.product_url, sig)));
                    } catch (e) {
                        if (e.message === 'Operation stopped' || e.name === 'AbortError') throw e;
                        p.detail_error = `Fetch failed: ${e.message}`;
                    }
                }
                completed++;
                setProgress(tab, completed, total, true);
                scheduleUI();
            });
        }

        const { errors } = await queue.run();
        const stopped = errors.some(e => e.message === 'Operation stopped' || e.name === 'AbortError');
        setStatus(tab, stopped ? 'Stopped.' : 'All details fetched.');
        isRunning = false; abortCtrl = null;
        toggleControls(false);
        setProgress(tab, 0, 100, false);
        switchTab(tab);
    }

    // --- PRODUCT ITEM ACTIONS ---
    async function handleItemActions(e) {
        if (isRunning) return;
        const del = e.target.closest('.product-delete-btn');
        const copy = e.target.closest('.product-copy-btn');
        const expand = e.target.closest('.product-expand-btn');
        const retry = e.target.closest('.product-retry-btn');
        if (!del && !copy && !expand && !retry) return;

        const wrap = e.target.closest('.product-item-wrapper');
        const item = wrap?.querySelector('.product-item');
        if (!item) return;

        const idx = parseInt(item.dataset.i, 10);
        const tab = item.dataset.tab;
        const list = DATA[tab];
        if (idx < 0 || idx >= list.length) return;
        const p = list[idx];

        if (del) {
            list.splice(idx, 1);
            refreshDisplay(tab);
        } else if (copy) {
            const ok = await copyText(JSON.stringify(p, null, 2));
            if (ok) {
                copy.classList.add('copied'); copy.innerHTML = I.check;
                setTimeout(() => { copy.classList.remove('copied'); copy.innerHTML = I.copy; }, 1500);
            }
        } else {
            const dc = wrap.querySelector('.product-details-expanded');
            const btn = item.querySelector('.product-expand-btn');
            if (expand) {
                if (dc.style.display !== 'none') {
                    dc.style.display = 'none'; btn.innerHTML = I.expand;
                } else {
                    if (p.detailed_name || p.detail_error) {
                        renderExpanded(dc, p); dc.style.display = 'block'; btn.innerHTML = I.collapse;
                    } else {
                        await fetchSingleDetail(idx, tab, dc, btn);
                    }
                }
            } else if (retry) {
                delete p.detail_error;
                await fetchSingleDetail(idx, tab, dc, item.querySelector('.product-expand-btn'));
            }
        }
    }

    async function fetchSingleDetail(idx, tab, dc, expandBtn) {
        const p = DATA[tab][idx];
        if (!p.product_url || p.product_url === 'N/A') {
            p.detail_error = 'No URL.'; renderExpanded(dc, p);
            dc.style.display = 'block'; if (expandBtn) expandBtn.innerHTML = I.collapse;
            return;
        }
        dc.innerHTML = '<div class="details-loading">Fetching…</div>';
        dc.style.display = 'block';
        if (expandBtn) { expandBtn.disabled = true; expandBtn.innerHTML = I.collapse; }
        try {
            Object.assign(p, scrapeDetail(await fetchWithRetry(p.product_url, null, false)));
        } catch (e) { p.detail_error = `Fetch failed: ${e.message}`; }
        renderExpanded(dc, p);
        if (expandBtn) { expandBtn.disabled = false; }
    }

    // --- EXPORT ---
    function prepareExport() {
        const src = DATA[activeTab].map(p => {
            const q = { ...p };
            if (!cfg.inclImg) delete q.image_url;
            if (!cfg.inclUrl) delete q.product_url;
            return q;
        });
        const out = { items: src };
        if (activeTab === 'trolley' && src.length) {
            const t = DATA.trolley.reduce((a, p) => a + (p.itemTotal || 0), 0);
            out.totalPrice = parseFloat(t.toFixed(2));
            out.totalPriceFormatted = `$${t.toFixed(2)}`;
        }
        return out;
    }

    function toCSV(data) {
        const { items, totalPriceFormatted } = data;
        const hdrs = [...new Set(items.flatMap(Object.keys))];
        const esc = v => { const s = String(v ?? '').replace(/"/g, '""'); return /[,\n"]/.test(s) ? `"${s}"` : s; };
        let csv = totalPriceFormatted ? `Total Price,"${totalPriceFormatted}"\n\n` : '';
        csv += hdrs.join(',') + '\n';
        items.forEach(p => { csv += hdrs.map(h => esc(p[h] ?? '')).join(',') + '\n'; });
        return csv;
    }

    function toMarkdown() {
        const src = DATA[activeTab];
        if (!src.length) return null;
        const KM = {
            detailed_name: 'Full Name', brand: 'Brand', description: 'Description',
            detailed_current_price: 'Current Price', price: 'Price', detailed_original_price: 'Original Price',
            savings: 'Savings', unit_price: 'Unit Price', quantity: 'Quantity', itemTotal: 'Subtotal',
            rating: 'Rating', review_count: 'Review Count', barcode_gtin: 'Barcode (GTIN)',
            product_url: 'Product URL', detail_error: 'Error',
        };
        const ORDER = [
            'detailed_name', 'brand', 'description', 'detailed_current_price', 'price',
            'detailed_original_price', 'savings', 'unit_price', 'quantity', 'itemTotal', 'rating',
            'review_count', 'barcode_gtin', 'ingredients', 'allergens', 'claims',
            'country_of_origin', 'storage_instructions', 'product_url', 'detail_error',
        ];
        let md = `# ${activeTab === 'trolley' ? 'Trolley' : 'Product List'}\n\n`;
        src.forEach(p => {
            md += '---\n\n';
            const name = p.detailed_name || p.name || 'Unnamed';
            md += `## ${name}\n`;
            if (p.image_url && cfg.inclImg) md += `![${name}](${p.image_url})\n`;
            md += '\n';
            ORDER.forEach(k => {
                if (!p[k] || p[k] === 'N/A' || p[k] === 'None' || !String(p[k]).trim()) return;
                const lbl = KM[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const val = k === 'itemTotal' ? `$${Number(p[k]).toFixed(2)}` : String(p[k]).replace(/\n/g, ' ').slice(0, 200);
                md += `- **${lbl}**: ${val}\n`;
            });
            md += '\n';
        });
        if (activeTab === 'trolley' && src.length) {
            const t = src.reduce((a, p) => a + (p.itemTotal || 0), 0);
            md += `---\n\n**Total: $${t.toFixed(2)}**\n`;
        }
        return md;
    }

    function download(name, content, mime) {
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([content], { type: mime })), download: name,
        });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    const datestamp = () => new Date().toISOString().slice(0, 10);

    // Map export action to display label
    const EXPORT_LABELS = {
        'copy-json': `${I.copy} Copy JSON`,
        'download-json': `${I.scrapeAll} Download JSON`,
        'copy-csv': `${I.copy} Copy CSV`,
        'download-csv': `${I.scrapeAll} Download CSV`,
        'copy-md': `${I.copy} Copy Markdown`,
        'download-md': `${I.scrapeAll} Download Markdown`,
    };

    function applyExportAction(action) {
        if (!EXPORT_LABELS[action]) action = 'copy-json';
        cfg.exportAction = action;
        if ($.exportMain) {
            $.exportMain.dataset.action = action;
            $.exportMain.innerHTML = EXPORT_LABELS[action];
        }
        saveCfg();
    }

    async function runExport(action) {
        const data = prepareExport();
        if (!data.items?.length) { alert('No data to export.'); return; }

        // Persist selected action
        applyExportAction(action);

        const dl = action.startsWith('download-');
        const fmt = action.replace(/^(copy|download)-/, '');

        let content, mime, ext;
        if (fmt === 'json') { content = JSON.stringify(data, null, 2); mime = 'application/json'; ext = 'json'; }
        else if (fmt === 'csv') { content = toCSV(data); mime = 'text/csv;charset=utf-8;'; ext = 'csv'; }
        else { content = toMarkdown(); mime = 'text/markdown;charset=utf-8;'; ext = 'md'; }
        if (!content) { alert('No data.'); return; }

        if (dl) {
            download(`${activeTab}_${datestamp()}.${ext}`, content, mime);
        } else {
            const ok = await copyText(content);
            if (ok) {
                const btn = $.exportMain;
                const origAction = btn.dataset.action;
                const orig = EXPORT_LABELS[origAction] || btn.innerHTML;
                btn.innerHTML = `${I.check} Copied`;
                btn.classList.add('copied-success'); btn.disabled = true;
                $.exportToggle.disabled = true;
                setTimeout(() => {
                    btn.innerHTML = orig; btn.classList.remove('copied-success');
                    btn.disabled = false; $.exportToggle.disabled = false;
                }, 2000);
            } else alert('Clipboard failed. Try downloading instead.');
        }
    }

    // --- UI CREATION ---
    function createUI() {
        // Toggle button
        const toggle = Object.assign(document.createElement('div'), {
            id: 'cs-toggle', innerHTML: I.tool, title: 'Coles Scraper',
        });
        document.body.appendChild(toggle);

        // Panel
        const panel = document.createElement('div');
        panel.id = 'cs-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <div id="cs-header">
                <span>Coles Scraper v7.2</span>
                <button id="cs-close">✕</button>
            </div>
            <div id="cs-tabs">
                <button class="tab-btn active" data-tab="scraper">Scraper</button>
                <button class="tab-btn" data-tab="trolley">Trolley</button>
            </div>
            <div id="cs-content">
                <div id="scraper-tab" class="tab-content active">
                    <div id="sc-btns" class="button-group"></div>
                    <div class="status-wrap">
                        <div id="sc-status"></div>
                        <progress id="sc-progress" value="0" max="100" style="display:none"></progress>
                    </div>
                    <div id="sc-list" class="product-list"></div>
                </div>
                <div id="trolley-tab" class="tab-content">
                    <div id="tr-btns" class="button-group"></div>
                    <div class="status-wrap">
                        <div id="tr-status"></div>
                        <progress id="tr-progress" value="0" max="100" style="display:none"></progress>
                    </div>
                    <div id="tr-list" class="product-list"></div>
                    <div id="tr-total" style="display:none"></div>
                </div>
                <div class="button-group export-group">
                    <div class="export-wrap">
                        <button id="exp-main" data-action="copy-json">${I.copy} Copy JSON</button>
                        <button id="exp-toggle">▼</button>
                        <div id="exp-menu" style="display:none">
                            <div class="exp-opt" data-action="copy-json">${I.copy} Copy JSON</div>
                            <div class="exp-opt" data-action="download-json">${I.scrapeAll} Download JSON</div>
                            <div class="exp-opt" data-action="copy-csv">${I.copy} Copy CSV</div>
                            <div class="exp-opt" data-action="download-csv">${I.scrapeAll} Download CSV</div>
                            <div class="exp-opt" data-action="copy-md">${I.copy} Copy Markdown</div>
                            <div class="exp-opt" data-action="download-md">${I.scrapeAll} Download Markdown</div>
                        </div>
                    </div>
                    <button id="cs-clear">${I.clear} Clear</button>
                </div>
                <details id="cs-settings">
                    <summary>Advanced Settings</summary>
                    <div class="settings-grid">
                        <label title="Min random delay">Min Delay (ms)</label>
                        <input type="number" data-cfg="minDelay"   value="${cfg.minDelay}"   min="100" max="10000">
                        <label title="Max random delay">Max Delay (ms)</label>
                        <input type="number" data-cfg="maxDelay"   value="${cfg.maxDelay}"   min="100" max="10000">
                        <label title="Retry count">Max Retries</label>
                        <input type="number" data-cfg="maxRetries" value="${cfg.maxRetries}" min="0"   max="10">
                        <label title="Delay between retries">Retry Wait (ms)</label>
                        <input type="number" data-cfg="retryDelay" value="${cfg.retryDelay}" min="100" max="10000">
                        <label title="Concurrent detail fetches">Detail Concurrency</label>
                        <input type="number" data-cfg="concurrency" value="${cfg.concurrency}" min="1" max="32">
                        <label title="Concurrent page fetches for Scrape All">Page Concurrency</label>
                        <input type="number" data-cfg="pageConcurrency" value="${cfg.pageConcurrency}" min="1" max="16">
                    </div>
                    <div class="settings-grid">
                        <label>Include Image URL</label>
                        <input type="checkbox" data-cfg="inclImg" ${cfg.inclImg ? 'checked' : ''}>
                        <label>Include Product URL</label>
                        <input type="checkbox" data-cfg="inclUrl" ${cfg.inclUrl ? 'checked' : ''}>
                    </div>
                </details>
            </div>`;
        document.body.appendChild(panel);

        // Cache DOM refs
        Object.assign($, {
            toggle, panel,
            scraperBtns: panel.querySelector('#sc-btns'),
            trolleyBtns: panel.querySelector('#tr-btns'),
            scraperStatus: panel.querySelector('#sc-status'),
            trolleyStatus: panel.querySelector('#tr-status'),
            scraperProgress: panel.querySelector('#sc-progress'),
            trolleyProgress: panel.querySelector('#tr-progress'),
            scraperList: panel.querySelector('#sc-list'),
            trolleyList: panel.querySelector('#tr-list'),
            trolleyTotal: panel.querySelector('#tr-total'),
            exportMain: panel.querySelector('#exp-main'),
            exportToggle: panel.querySelector('#exp-toggle'),
            exportMenu: panel.querySelector('#exp-menu'),
            settings: panel.querySelector('#cs-settings'),
        });

        // Restore persisted export action
        applyExportAction(cfg.exportAction);

        // Panels toggle
        let visible = false;
        const showPanel = v => {
            visible = v;
            panel.style.display = v ? 'flex' : 'none';
            toggle.style.display = v ? 'none' : 'flex';
        };
        toggle.addEventListener('click', () => showPanel(true));
        panel.querySelector('#cs-close').addEventListener('click', () => showPanel(false));

        // Tabs
        panel.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

        // Export
        $.exportMain.addEventListener('click', () => runExport($.exportMain.dataset.action));
        $.exportToggle.addEventListener('click', () => {
            $.exportMenu.style.display = $.exportMenu.style.display === 'none' ? 'block' : 'none';
        });
        panel.querySelectorAll('.exp-opt').forEach(o => o.addEventListener('click', () => {
            const action = o.dataset.action;
            applyExportAction(action);
            $.exportMenu.style.display = 'none';
            runExport(action);
        }));
        document.addEventListener('click', e => {
            if (!panel.querySelector('.export-wrap')?.contains(e.target))
                $.exportMenu.style.display = 'none';
        });

        // Clear
        panel.querySelector('#cs-clear').addEventListener('click', () => {
            if (isRunning) return;
            DATA[activeTab] = [];
            setProgress(activeTab, 0, 100, false);
            refreshDisplay(activeTab);
        });

        // Product item actions (delegated)
        panel.querySelector('#sc-list').addEventListener('click', handleItemActions);
        panel.querySelector('#tr-list').addEventListener('click', handleItemActions);

        // Settings — unified handler with persistence
        panel.querySelectorAll('[data-cfg]').forEach(el => {
            el.addEventListener('change', () => {
                const key = el.dataset.cfg;
                cfg[key] = el.type === 'checkbox' ? el.checked : parseInt(el.value, 10);
                validateCfg();
                if (el.type !== 'checkbox') el.value = cfg[key];
                saveCfg();
            });
        });

        // Draggable
        makeDraggable(panel, panel.querySelector('#cs-header'));
    }

    function makeDraggable(el, handle) {
        let ox, oy;
        (handle || el).addEventListener('mousedown', e => {
            e.preventDefault();
            ox = e.clientX - el.offsetLeft;
            oy = e.clientY - el.offsetTop;
            const move = e => {
                el.style.left = clamp(e.clientX - ox, 0, innerWidth - el.offsetWidth) + 'px';
                el.style.top = clamp(e.clientY - oy, 0, innerHeight - el.offsetHeight) + 'px';
            };
            const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });
    }

    // --- PAGE CHANGE MONITORING ---
    function monitorNavigation() {
        let cur = location.href;
        new MutationObserver(() => {
            if (location.href !== cur) {
                cur = location.href;
                setTimeout(() => { if (!isRunning) switchTab(activeTab); }, 1500);
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

    // --- CSS ---
    GM_addStyle(`
        :root {
            --red:#E4002B; --red-d:#c30024; --txt:#212121; --txt2:#585858;
            --bdr:#e0e0e0; --bg:#f7f7f7; --blue:#007bff; --green:#4caf50;
        }
        #cs-toggle {
            position:fixed; top:100px; right:0; width:48px; height:48px;
            background:var(--red); color:#fff; border-radius:8px 0 0 8px;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer; box-shadow:-2px 2px 8px rgba(0,0,0,.2); z-index:99999;
            transition:all .2s; user-select:none;
        }
        #cs-toggle:hover { background:var(--red-d); width:52px; }
        #cs-toggle svg { width:28px; height:28px; }
        #cs-panel {
            position:fixed; top:20px; right:20px; width:550px; max-height:90vh;
            background:#fff; border:1px solid var(--bdr); border-radius:8px;
            box-shadow:0 5px 20px rgba(0,0,0,.15); z-index:99999;
            display:flex; flex-direction:column;
            font-family:"Source Sans Pro",-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        }
        #cs-header {
            padding:12px 18px; cursor:move; font-weight:600; font-size:16px;
            border-bottom:1px solid var(--bdr); border-radius:8px 8px 0 0;
            display:flex; justify-content:space-between; align-items:center; background:#fff;
        }
        #cs-close { background:none; border:none; color:var(--txt2); font-size:24px; cursor:pointer; padding:0 5px; opacity:.8; transition:.2s; }
        #cs-close:hover { opacity:1; }
        #cs-tabs { display:flex; border-bottom:1px solid var(--bdr); background:var(--bg); }
        .tab-btn {
            padding:12px 20px; border:none; background:none; cursor:pointer; font-size:15px;
            font-weight:600; color:var(--txt2); border-bottom:3px solid transparent; transition:.2s;
        }
        .tab-btn:hover { background:#e9e9e9; }
        .tab-btn.active { color:var(--red); border-bottom-color:var(--red); }
        #cs-content { padding:18px; overflow-y:auto; display:flex; flex-direction:column; gap:15px; }
        .tab-content { display:none; flex-direction:column; gap:15px; }
        .tab-content.active { display:flex; }
        .product-list {
            width:100%; height:350px; background:var(--bg); border:1px solid var(--bdr);
            border-radius:6px; padding:8px; box-sizing:border-box;
            overflow-y:auto; display:flex; flex-direction:column; gap:8px;
        }
        .product-item-wrapper { background:#fff; border:1px solid #e9e9e9; border-radius:4px; }
        .product-item { display:flex; align-items:center; gap:15px; padding:10px; }
        .product-item-img { width:60px; height:60px; object-fit:contain; flex-shrink:0; border-radius:4px; }
        .product-item-details { flex:1; min-width:0; }
        .product-name { font-weight:600; color:var(--txt); margin:0 0 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:14px; }
        .product-price { font-weight:700; color:var(--red); margin:0; font-size:15px; }
        .product-unit-price { font-weight:400; color:var(--txt2); font-size:12px; margin-left:8px; }
        .product-quantity { font-size:13px; color:var(--txt2); margin:4px 0 0; }
        .product-item-actions { display:flex; gap:5px; align-items:center; }
        .product-action-btn {
            background:#f0f0f0; border:1px solid #e0e0e0; color:var(--txt2);
            width:30px; height:30px; border-radius:50%; display:flex; align-items:center;
            justify-content:center; cursor:pointer; transition:.2s; flex-shrink:0;
        }
        .product-action-btn:hover:not(:disabled) { background:#e0e0e0; color:var(--txt); }
        .product-action-btn:disabled { opacity:.5; cursor:not-allowed; }
        .product-action-btn svg { width:16px; height:16px; }
        .product-delete-btn:hover:not(:disabled) { background:#ffebee; color:#c62828; }
        .product-copy-btn:hover:not(:disabled):not(.copied) { background:#e3f2fd; color:#1565c0; }
        .product-copy-btn.copied { background:var(--green)!important; color:#fff!important; }
        .product-retry-btn:hover:not(:disabled) { background:#e3f2fd; color:#1565c0; }
        .product-details-expanded { padding:12px 15px; border-top:1px solid #f0f0f0; background:#fafafa; font-size:13px; }
        .details-loading { font-style:italic; color:var(--txt2); }
        .details-dl { margin:0; display:grid; grid-template-columns:120px 1fr; gap:8px; }
        .details-dl dt { font-weight:600; color:var(--txt); }
        .details-dl dd { margin:0; color:var(--txt2); word-break:break-word; }
        .details-error-dd { display:flex; align-items:center; gap:10px; color:#c62828; }
        .details-error-dd span { flex-grow:1; }
        #tr-total {
            padding:12px 18px; background:var(--bg); border:1px solid var(--bdr); border-radius:6px;
            justify-content:space-between; align-items:center; font-size:16px; font-weight:600; color:var(--txt);
        }
        .total-price-value { font-size:18px; font-weight:700; color:var(--red); }
        .status-wrap { display:flex; flex-direction:column; gap:8px; }
        #sc-status, #tr-status { font-style:italic; color:var(--txt2); min-height:1.2em; font-size:14px; }
        #sc-progress, #tr-progress { width:100%; height:6px; border-radius:3px; border:none; }
        #sc-progress::-webkit-progress-bar, #tr-progress::-webkit-progress-bar { background:#f0f0f0; border-radius:3px; }
        #sc-progress::-webkit-progress-value, #tr-progress::-webkit-progress-value { background:var(--red); border-radius:3px; transition:width .3s; }
        .button-group { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .button-group.export-group { border-top:1px solid var(--bdr); padding-top:15px; justify-content:space-between; }
        .button-group button {
            display:inline-flex; align-items:center; justify-content:center; gap:8px;
            padding:10px 18px; border:1px solid transparent; border-radius:24px;
            cursor:pointer; transition:.2s; font-size:14px; font-weight:700; line-height:1;
        }
        .button-group button:hover:not(:disabled) { box-shadow:0 4px 8px rgba(0,0,0,.1); }
        .button-group button:disabled { background:#e0e0e0!important; color:#a0a0a0!important; cursor:not-allowed; box-shadow:none; border-color:#e0e0e0!important; }
        .button-group button svg { width:16px; height:16px; stroke-width:2.5; stroke:currentColor; }
        #sc-all-btn, #sc-det-btn, #tr-det-btn { background:var(--red); color:#fff; }
        #sc-all-btn:hover:not(:disabled), #sc-det-btn:hover:not(:disabled), #tr-det-btn:hover:not(:disabled) { background:var(--red-d); }
        #sc-page-btn, #sc-detail-btn, #tr-scrape-btn { background:#fff; color:var(--red); border:1px solid var(--red); }
        #sc-page-btn:hover:not(:disabled), #sc-detail-btn:hover:not(:disabled), #tr-scrape-btn:hover:not(:disabled) { background:var(--red); color:#fff; }
        #cs-clear { background:var(--txt2); color:#fff; border-color:var(--txt2); }
        #cs-clear:hover:not(:disabled) { background:var(--txt); border-color:var(--txt); }
        .stop-btn { background:var(--blue); color:#fff; border-color:var(--blue); }
        .stop-btn:hover:not(:disabled) { background:#0069d9; }
        .export-wrap { position:relative; display:flex; }
        #exp-main {
            border-radius:24px 0 0 24px; border-right:none; background:#fff;
            color:var(--red); border:1px solid var(--red);
        }
        #exp-main:hover:not(:disabled) { background:var(--red); color:#fff; }
        #exp-main.copied-success { background:var(--green)!important; color:#fff!important; border-color:var(--green)!important; }
        #exp-toggle {
            padding:10px 12px; border-radius:0 24px 24px 0; border:1px solid var(--red);
            background:#fff; color:var(--red); font-size:10px; font-weight:bold; margin-left:-1px;
        }
        #exp-toggle:hover:not(:disabled) { background:var(--red); color:#fff; }
        #exp-menu {
            position:absolute; bottom:110%; left:0; background:#fff; border:1px solid var(--bdr);
            border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,.1); z-index:10; width:220px; overflow:hidden;
        }
        .exp-opt {
            display:flex; align-items:center; gap:10px; padding:10px 15px;
            cursor:pointer; font-size:14px; color:var(--txt); transition:background .2s;
        }
        .exp-opt:hover { background:var(--bg); }
        .exp-opt svg { width:16px; height:16px; stroke-width:2; color:var(--txt2); }
        .info-message {
            display:flex; align-items:center; justify-content:center; height:100%;
            color:#666; font-style:italic; text-align:center; padding:20px;
        }
        #cs-settings { border:1px solid var(--bdr); border-radius:6px; background:#fff; transition:opacity .3s; }
        #cs-settings summary { font-weight:600; cursor:pointer; padding:12px 15px; border-radius:6px; }
        #cs-settings summary:hover { background:var(--bg); }
        #cs-settings > div { padding:15px; }
        .settings-grid { display:grid; grid-template-columns:auto 1fr; gap:10px 15px; align-items:center; font-size:14px; }
        .settings-grid:not(:last-child) { border-bottom:1px solid #f0f0f0; padding-bottom:15px; margin-bottom:15px; }
        .settings-grid label { justify-self:start; color:var(--txt2); }
        .settings-grid input[type="number"] {
            width:100%; padding:8px 10px; border:1px solid #ccc; border-radius:4px;
            box-sizing:border-box; font-size:14px;
        }
        .settings-grid input[type="number"]:focus { border-color:var(--red); outline:none; box-shadow:0 0 0 2px rgba(228,0,43,.2); }
        .settings-grid input[type="checkbox"] { justify-self:start; width:20px; height:20px; accent-color:var(--red); }
    `);

    // --- INIT ---
    function init() {
        loadCfg();
        validateCfg();
        createUI();
        monitorNavigation();
        switchTab('scraper');
    }

    document.readyState === 'complete' ? init() : window.addEventListener('load', init);
})();