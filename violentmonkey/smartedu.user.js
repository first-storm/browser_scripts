// ==UserScript==
// @name         国家中小学智慧教育平台PDF下载
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在工具栏中添加一个功能完善的下载按钮，独立处理下载逻辑，确保稳定下载PDF文件。
// @author       Gemini
// @match        https://basic.smartedu.cn/pdfjs/*/web/viewer.html*
// @connect      r1-ndr-doc-private.ykt.cbern.com.cn
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/smartedu.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/smartedu.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 为我们自己的按钮和进度条添加样式
    GM_addStyle(`
        #customDownloadBtn {
            position: relative !important; /* 用于进度条定位 */
        }
        #customDownloadBtn .progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background-color: #4CAF50; /* 绿色进度条 */
            width: 0%;
            transition: width 0.2s, background-color 0.5s;
        }
    `);

    /**
     * 创建并添加我们自己的下载按钮到工具栏
     * @param {HTMLElement} toolbar - 目标工具栏元素
     */
    function addCustomDownloadButton(toolbar) {
        if (document.getElementById('customDownloadBtn')) {
            return; // 如果按钮已存在，则退出
        }

        // 创建下载按钮
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'customDownloadBtn';
        // 使用页面自带的 `download` class 来获得与原生按钮一致的图标样式
        downloadBtn.className = 'toolbarButton download';
        downloadBtn.title = '下载原始PDF文件';
        // 按钮内部只包含进度条容器。按钮图标由CSS背景提供。
        downloadBtn.innerHTML = '<div class="progress-bar"></div>';

        // 为按钮添加点击事件，调用我们自己的下载逻辑
        downloadBtn.addEventListener('click', handleDownload);

        // 将按钮插入到“工具”按钮之前，位置更显眼
        const secondaryToolbarToggle = document.getElementById('secondaryToolbarToggle');
        if (secondaryToolbarToggle) {
            toolbar.insertBefore(downloadBtn, secondaryToolbarToggle);
        } else {
            toolbar.appendChild(downloadBtn);
        }
    }

    /**
     * 处理PDF下载的核心逻辑
     */
    function handleDownload() {
        const btn = document.getElementById('customDownloadBtn');
        const progressBar = btn.querySelector('.progress-bar');

        // 从当前浏览器URL中解析出 'file' 和 'headers' 参数
        const params = new URLSearchParams(window.location.search);
        const fileUrl = params.get('file');
        const headersStr = params.get('headers');

        if (!fileUrl || !headersStr) {
            alert('错误：无法在此URL中找到PDF文件链接或必需的请求头信息！');
            return;
        }

        let headers;
        try {
            headers = JSON.parse(decodeURIComponent(headersStr));
        } catch (e) {
            alert('错误：解析请求头信息失败！');
            console.error('Header parsing error:', e);
            return;
        }

        // 尝试从文件名或URL中生成一个更友好的文件名
        let filename = "downloaded.pdf";
        try {
             // 解码URL并移除可能存在的.pkg后缀和查询参数，替换为.pdf
             filename = decodeURIComponent(fileUrl.substring(fileUrl.lastIndexOf('/') + 1).replace(/\.pkg.*$/, '.pdf'));
        } catch(e) { console.error("Error parsing filename:", e); }


        // 更新按钮状态，提示用户下载已开始
        btn.title = '下载中...';
        btn.disabled = true;
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = '#4CAF50'; // 重置为绿色

        // 使用 GM_xmlhttpRequest 发起带自定义请求头的跨域请求
        GM_xmlhttpRequest({
            method: 'GET',
            url: fileUrl,
            headers: headers,
            responseType: 'blob',
            onprogress: function(e) {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressBar.style.width = percentComplete + '%';
                }
            },
            onload: function(response) {
                if (response.status === 200) {
                    const blob = response.response;
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();

                    // 增加一个短暂延迟再清理资源，以确保浏览器已启动下载流程
                    setTimeout(() => {
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }, 100);

                    btn.title = '下载完成！';
                    setTimeout(() => {
                       btn.title = '下载原始PDF文件';
                       btn.disabled = false;
                       progressBar.style.width = '0%';
                    }, 2000);
                } else {
                    handleError(`下载失败，服务器返回状态: ${response.status}`);
                }
            },
            onerror: function(response) {
                handleError('下载时发生网络错误。');
                console.error('Download error:', response);
            },
            ontimeout: function() {
                 handleError('下载超时，请重试。');
            }
        });

        // 统一的错误处理函数
        function handleError(message) {
             alert(message);
             btn.title = `下载失败: ${message}`;
             progressBar.style.backgroundColor = '#F44336'; // 进度条变红
             progressBar.style.width = '100%';
             setTimeout(() => {
                btn.title = '下载原始PDF文件';
                btn.disabled = false;
                progressBar.style.width = '0%';
             }, 3000);
        }
    }

    // 使用 MutationObserver 来监视DOM的变化，等待工具栏加载
    const observer = new MutationObserver((mutations, obs) => {
        // 目标是右侧工具栏容器
        const toolbar = document.getElementById('toolbarViewerRight');

        if (toolbar) {
            // 找到工具栏后，添加我们自己的按钮
            addCustomDownloadButton(toolbar);
            // 任务完成，停止观察，避免不必要的资源消耗
            obs.disconnect();
        }
    });

    // 开始观察整个文档的变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
