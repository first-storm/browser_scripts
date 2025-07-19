// ==UserScript==
// @name         YouTube字幕下载助手
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  智能检测视频是否提供字幕，无字幕时自动隐藏下载按钮。采用用户视觉优化方案，稳定美观。
// @author       Gemini 2.5 Pro & User
// @match        *://www.youtube.com/watch*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=downsub.com
// @grant        GM_addStyle
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    'use strict';

    // 采用您提供的SVG代码，以获得最佳显示效果
    const iconSVG = `
        <svg height="100%" fill="currentColor" width="75%" viewBox="0 0 36 40">
            <path d="M27 18.5h-6V9.25h-6v9.25H9l9 9 9-9zM9 30.5h18v-3H9v3z"></path>
        </svg>
    `;

    // 仅为工具提示添加样式
    GM_addStyle(`
        .downsub-btn-gemini { position: relative; }
        .downsub-tooltip-gemini {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(28,28,28,.9);
            color:#fff;
            font-size:12px;
            padding:5px 8px;
            border-radius:3px;
            white-space:nowrap;
            opacity:0;
            pointer-events:none;
            transition:opacity .15s;
            margin-bottom: 8px;
        }
        .downsub-btn-gemini:hover .downsub-tooltip-gemini { opacity:1; }
    `);

    let stateCheckInterval = null;
    let lastUrl = '';

    // 管理下载按钮状态的核心函数（显示或隐藏）
    function manageDownloadButtonState() {
        const rightControls = document.querySelector('.ytp-right-controls');
        if (!rightControls) return; // 播放器未就绪

        const ourButton = rightControls.querySelector('.downsub-btn-gemini');
        const subtitlesButton = rightControls.querySelector('.ytp-subtitles-button');

        // 条件：CC按钮存在，并且其标题不包含"unavailable"
        const shouldShow = subtitlesButton && !subtitlesButton.title.includes('unavailable');

        if (shouldShow) {
            // 如果应该显示，但按钮不存在，则创建并注入
            if (!ourButton) {
                const btn = document.createElement('button');
                btn.className = 'ytp-button downsub-btn-gemini';
                btn.title = '通过 DownSub 下载字幕';
                btn.innerHTML = iconSVG + '<div class="downsub-tooltip-gemini">下载字幕</div>';

                btn.onclick = (e) => {
                    e.stopPropagation();
                    const currentUrl = window.location.href;
                    const downsubUrl = `https://downsub.com/?url=${encodeURIComponent(currentUrl)}`;
                    GM_openInTab(downsubUrl, { active: true, insert: true });
                };

                // 注入到CC按钮之后
                subtitlesButton.after(btn);
            }
        } else {
            // 如果不应该显示，但按钮存在，则移除它
            if (ourButton) {
                ourButton.remove();
            }
        }
    }

    // 启动状态监测流程
    function startStateCheckProcess() {
        if (stateCheckInterval) {
            clearInterval(stateCheckInterval); // 清除旧的定时器
        }
        // 每秒检查一次CC按钮的状态，确保按钮的显示/隐藏是实时的
        stateCheckInterval = setInterval(manageDownloadButtonState, 1000);
    }

    // 使用 MutationObserver 监视URL变化，当切换视频时重新启动监测
    const observer = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            startStateCheckProcess();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();