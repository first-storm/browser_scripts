# Violentmonkey User Scripts

This repository contains a collection of personal user scripts designed to enhance browsing experience and automate tasks using Violentmonkey (or Tampermonkey).

## Installation & Setup

Before using these scripts, you need to install a userscript manager extension in your browser:

### Browser Recommendations

- **Firefox**: [Violentmonkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/) (Recommended)
- **Chrome/Chromium**: [Violentmonkey](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag) (Recommended)
- **Safari**: [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) (Recommended)

### Installation Steps

1. **Install the userscript manager**:
   - Click the link above for your browser
   - Follow the installation process in your browser's extension/add-on store

2. **Install userscripts**:
   - Click any of the blue "Install UserScript" badges in this README
   - Your userscript manager will open and prompt you to install the script
   - Click "Install" or "Confirm installation"
   - To update later, click the same badge again; your manager will show an update diff

3. **Usage**:
   - Navigate to the supported websites (as listed in each script's @match directive)
   - The scripts will automatically activate and add their functionality

### Troubleshooting

- If a script doesn't work, ensure it's enabled in your userscript manager
- Some scripts may require page refresh after installation
- Check that you're on a supported website URL

## Scripts Overview

### 🛒 Scrapers

A set of comprehensive tools for scraping product information from major Australian retailers. Each script features a tabbed UI, supports scraping from current search/product listing pages, auto-pagination, detailed data fetching, cart/trolley exporting, and multiple export formats (JSON, CSV, Markdown). Advanced settings for delay, retries, and data inclusion are available.

#### Coles Scraper
[`ColesScraper.user.js`](violentmonkey/ColesScraper.user.js)

Scrapes product information from the Coles Australia website, including trolley items.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ColesScraper.user.js)

#### Chemist Warehouse Scraper
[`ChemistWarehouseScraper.user.js`](violentmonkey/ChemistWarehouseScraper.user.js)

Scrapes product information from Chemist Warehouse, with export options including Markdown.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ChemistWarehouseScraper.user.js)

#### Woolworths Scraper
[`woolworth.user.js`](violentmonkey/woolworth.user.js)

Scrapes products from Woolworths, supporting detailed data, cart export, and visual lists.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/woolworth.user.js)

### 🎓 Educational Tools

#### Increase Moodle Login Timeout Warning
[`Increase Moodle login timeout warning..user.js`](violentmonkey/Increase%20Moodle%20login%20timeout%20warning..user.js)

This script aims to prevent automatic logout from Moodle by increasing the login timeout warning. It continuously checks for and clicks on session extension buttons that appear in Moodle modals, ensuring the user remains logged in during long sessions.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/Increase%20Moodle%20login%20timeout%20warning..user.js)

#### Moodle Question Scraper to Markdown
[`moodle-scraper.user.js`](violentmonkey/moodle-scraper.user.js)

Scrapes Moodle quiz questions, uploads images to sm.ms, converts MathJax/HTML to Markdown, and shows results in a draggable panel. Includes copy-to-clipboard and API key management via menu.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/moodle-scraper.user.js)

#### 国家中小学智慧教育平台PDF下载 (SmartEdu PDF Downloader)
[`smartedu.user.js`](violentmonkey/smartedu.user.js)

Adds a custom download button to the National Smart Education Platform PDF viewer toolbar. Features a comprehensive download button that handles download logic independently, ensuring stable PDF file downloads with progress indicators and error handling. Works specifically with the Chinese National Smart Education Platform's PDF viewing interface.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/smartedu.user.js)

#### Screenshot & Copy Question on Mobius (UNSW)
[`Screenshot & Copy Question on Mobius(UNSW).user.js`](violentmonkey/Screenshot%20&%20Copy%20Question%20on%20Mobius(UNSW).user.js)

Designed for students using Mobius (UNSW), this script adds a button to capture and copy a screenshot of the question container. It uses `html2canvas` to render the question area and copies the image to the clipboard, simplifying the process of saving or sharing specific questions.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/Screenshot%20%26%20Copy%20Question%20on%20Mobius(UNSW).user.js)

#### UNSW College Timetable Helper
[`unsw-college-allocateplus.user.js`](violentmonkey/unsw-college-allocateplus.user.js)

Helps UNSW College students manage AllocatePlus timetables. Features include a visual 7-day timetable with clash detection, activity finder with status filters, export to PNG/CSV/JSON, and a polished, responsive UI. Updates automatically when course data changes.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/unsw-college-allocateplus.user.js)

### 🎬 Media Enhancement

#### Netflix Plus
[`Netflix Plus.user.js`](violentmonkey/Netflix%20Plus.user.js)

Enhances the Netflix viewing experience by enabling the best available audio and video quality. It includes features like forcing maximum bitrate, showing all audio tracks and subtitles, enabling Dolby and HE-AAC 5.1 audio, and options to focus on specific video qualities (e.g., 1080P, AV1, VP9). It also includes a fix for Edge fullscreen issues and a household check bypass.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/Netflix%20Plus.user.js)

#### YouTube字幕下载助手 (YouTube Subtitle Download Assistant)
[`YouTube字幕下载助手.user.js`](violentmonkey/YouTube字幕下载助手.user.js)

This script intelligently detects if a YouTube video provides subtitles and automatically shows or hides a download button accordingly. It integrates seamlessly into the YouTube player controls, offering a stable and aesthetically pleasing solution for downloading subtitles via DownSub.com.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/YouTube字幕下载助手.user.js)

#### YouTube Music Playlist Exporter
[`ytm-export.user.js`](violentmonkey/ytm-export.user.js)

Adds a collapsible floating panel to YouTube Music playlist pages that allows you to export the full song list as CSV or JSON files. Features include automatic scrolling to load all songs in the playlist, elegant glassmorphism UI design, and support for both CSV and JSON export formats. The panel automatically appears only on playlist pages and provides a seamless export experience.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/ytm-export.user.js)

### 🛠️ Browser Enhancement

#### YouTube Share Link – Remove si
[`YouTube Share Link - Remove si.user.js`](violentmonkey/YouTube%20Share%20Link%20-%20Remove%20si.user.js)

Removes the `si` parameter from YouTube share links and ensures the share dialog’s copy button copies a clean link while preserving other parameters like `t`. Supports `watch`, `shorts`, and `m.youtube.com`.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/YouTube%20Share%20Link%20-%20Remove%20si.user.js)

#### Mullvad Leta – Quick Google Search
[`Mullvad Leta - Quick Google Search.user.js`](violentmonkey/Mullvad%20Leta%20-%20Quick%20Google%20Search.user.js)

Adds a small external-link icon to the Google engine option on Mullvad Leta. Clicking the icon opens the current query directly on `google.com` in a new tab. Works on `leta.mullvad.net` and `search.mullvad.net`, integrates with the page dynamically, and supports mouse, middle-click, and keyboard activation.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/Mullvad%20Leta%20-%20Quick%20Google%20Search.user.js)

#### Gemini Sidebar Padding Fix for Firefox
[`GeminiSidebarPaddingFix.user.js`](violentmonkey/GeminiSidebarPaddingFix.user.js)

Adjusts Gemini's sidebar padding for a symmetrical look in Firefox by balancing the space around the chat history list. This script fixes the asymmetry caused by Firefox's scrollbar rendering, ensuring a more visually pleasing interface.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/GeminiSidebarPaddingFix.user.js)

#### Selection and Copying Restorer (Universal)
[`Selection and Copying Restorer (Universal).user.js`](violentmonkey/Selection%20and%20Copying%20Restorer%20(Universal).user.js)

A universal script to unlock right-click functionality and remove restrictions on text selection, copying, cutting, and image right-clicking on various websites. It also enhances functionality by allowing Alt-key based hyperlink text selection and includes options to prevent repetitive auxiliary clicks and control hover effects on images.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/Selection%20and%20Copying%20Restorer%20(Universal).user.js)

#### Tencent Redirect Bypass
[`Tencent Redirect Bypass.user.js`](violentmonkey/Tencent%20Redirect%20Bypass.user.js)

This script bypasses the `c.pc.qq.com` redirect page, which is often used by Tencent for security warnings before navigating to external links. It displays a custom, elegant提示界面 (prompt interface) and automatically redirects to the real URL after a short delay, improving user experience by removing an unnecessary interstitial page.

[![Install](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/Tencent%20Redirect%20Bypass.user.js)
