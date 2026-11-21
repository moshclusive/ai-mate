"use strict";

let smallIcon = null;
let floatingIframe = null;

function createSmallIcon() {
    smallIcon = document.createElement('img');
    smallIcon.src = chrome.runtime.getURL('assets/small-icon.png');
    smallIcon.title = 'AI Mate';
    
    smallIcon.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; width: 32px; height: 32px; cursor: pointer;
        z-index: 2147483647; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
        transition: transform 0.2s ease, opacity 0.2s ease; display: none;
    `;

    smallIcon.addEventListener('mouseenter', () => smallIcon.style.transform = 'scale(1.1)');
    smallIcon.addEventListener('mouseleave', () => smallIcon.style.transform = 'scale(1)');

    smallIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString().trim() : '';
        chrome.storage.local.set({ selectedText }, openFloatingUI);
    });
    
    document.body.appendChild(smallIcon);
}

function openFloatingUI() {
    if (!floatingIframe) {
        floatingIframe = document.createElement('iframe');
        floatingIframe.src = chrome.runtime.getURL('floating.html');
        // CRITICAL FIX: Allow clipboard access to the floating iframe
        floatingIframe.allow = "clipboard-read; clipboard-write";
        floatingIframe.style.cssText = `
            position: fixed; bottom: 70px; right: 24px; width: 340px; height: 420px; 
            border: 1px solid #27272a; border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.4);
            z-index: 2147483647; display: none; opacity: 0;
            transition: opacity 0.2s ease, transform 0.2s ease; background: transparent;
            transform: translateY(10px); color-scheme: normal;
        `;
        document.body.appendChild(floatingIframe);
    }
    
    floatingIframe.style.display = 'block';
    requestAnimationFrame(() => {
        floatingIframe.style.opacity = '1'; 
        floatingIframe.style.transform = 'translateY(0)';
    });
    smallIcon.style.display = 'none';
}

function hideFloatingUI() {
    if (!floatingIframe) return;
    floatingIframe.style.opacity = '0';
    floatingIframe.style.transform = 'translateY(10px)';
    setTimeout(() => { 
        if (floatingIframe) floatingIframe.style.display = 'none'; 
    }, 200);
}

document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
        if (!floatingIframe || floatingIframe.style.display === 'none') {
            smallIcon.style.display = 'block';
        }
    } else {
        smallIcon.style.display = 'none';
        hideFloatingUI();
    }
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'openFloatingUI_ContextMenu') {
        openFloatingUI();
    } else if (request.action === 'shortcutToggleFloatingUI') {
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString().trim() : '';
        chrome.storage.local.set({ selectedText }, openFloatingUI);
    }
});

window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'closeFloatingUI') {
        hideFloatingUI();
        window.getSelection()?.removeAllRanges();
    }
});

createSmallIcon();