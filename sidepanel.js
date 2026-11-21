"use strict";

document.addEventListener('DOMContentLoaded', () => {
    const aiFrame = document.getElementById('aiFrame');
    const loaderContainer = document.getElementById('loader-container');
    const tabs = document.querySelectorAll('.sp-tab');
    const reloadBtn = document.getElementById('reloadBtn');

    let currentDraft = "";
    let currentImage = null; 

    const siteUrls = {
        'chatgpt': 'https://chatgpt.com/?aimate_panel=true',
        'gemini': 'https://gemini.google.com/app?aimate_panel=true',
        'deepseek': 'https://chat.deepseek.com/?aimate_panel=true',
        'kimi': 'https://kimi.moonshot.cn/?aimate_panel=true'
    };

    function showFrame() {
        if (loaderContainer) loaderContainer.style.display = 'none';
        if (aiFrame) {
            aiFrame.style.display = 'block';
            requestAnimationFrame(() => { aiFrame.style.opacity = '1'; });
        }
    }

    function loadSite(site) {
        try {
            const targetUrl = siteUrls[site] || siteUrls['chatgpt'];
            
            tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.site === site));
            
            if (loaderContainer) loaderContainer.style.display = 'flex';
            if (aiFrame) {
                aiFrame.style.display = 'none';
                aiFrame.style.opacity = '0';
                aiFrame.src = targetUrl;
            }
            
            setTimeout(showFrame, 2000);

            if (currentDraft || currentImage) {
                chrome.storage.local.set({
                    activeInjection: { site: site, text: currentDraft, image: currentImage, ts: Date.now() }
                });
            }
        } catch (error) {
            console.error("AI Mate: Error loading site", error);
            showFrame(); 
        }
    }

    if (aiFrame) {
        aiFrame.onload = showFrame;
        aiFrame.onerror = showFrame;
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => loadSite(tab.dataset.site));
    });

    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            const activeTab = document.querySelector('.sp-tab.active');
            if (activeTab) loadSite(activeTab.dataset.site);
        });
    }

    try {
        chrome.storage.local.get(['sharedContext', 'sharedImage', 'targetSite'], (data) => {
            if (data.sharedContext || data.sharedImage) {
                currentDraft = data.sharedContext || "";
                currentImage = data.sharedImage || null;
            }
            loadSite(data.targetSite || 'chatgpt');
        });
    } catch (error) {
        console.error("AI Mate: Storage init error", error);
        loadSite('chatgpt');
    }

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes.sharedContext) currentDraft = changes.sharedContext.newValue || "";
            if (changes.sharedImage) currentImage = changes.sharedImage.newValue || null;
            
            if (changes.targetSite && changes.targetSite.newValue) {
                loadSite(changes.targetSite.newValue);
            }
        }
    });
});