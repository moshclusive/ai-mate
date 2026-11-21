"use strict";

chrome.runtime.onInstalled.addListener(() => {
    initializeContextMenus();
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});

function initializeContextMenus() {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({ 
            id: "open-ai-mate", 
            title: "Send to AI Mate", 
            contexts: ["selection", "image"] 
        });
    });
}

async function fetchImageAsBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("AI Mate: Failed to fetch image:", e);
        return null;
    }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "open-ai-mate") {
        let updates = {}; // Dynamic update object

        // If right-click is performed on the image
        if (info.mediaType === "image" && info.srcUrl) {
            updates.copiedImage = await fetchImageAsBase64(info.srcUrl);
        } 
        
        // If text is selected and right-click is performed
        if (info.selectionText) {
            updates.selectedText = info.selectionText.trim();
        }

        // Save the data retrieved from memory and call the Floating UI
        chrome.storage.local.set(updates, () => {
            chrome.tabs.sendMessage(tab.id, { action: "openFloatingUI_ContextMenu" }).catch(err => console.error(err));
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openSidePanel' && sender.tab?.windowId) {
        chrome.sidePanel.open({ windowId: sender.tab.windowId }).catch(err => console.error(err));
        sendResponse({ success: true });
        return true; 
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === "open_floating_menu") {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "shortcutToggleFloatingUI"}).catch(() => {});
            }
        });
    }
});