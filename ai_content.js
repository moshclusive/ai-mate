"use strict";

const SITE_CONFIGS = {
    chatgpt: {
        domain: 'chatgpt.com',
        input: '#prompt-textarea, form div[contenteditable="true"]',
        sidebarCSS: '.flex-shrink-0.overflow-x-hidden { display: none !important; }'
    },
    gemini: {
        domain: 'gemini.google.com',
        input: 'rich-textarea, .ql-editor, div[contenteditable="true"]',
        sidebarCSS: 'navigation-drawer { display: none !important; }'
    },
    deepseek: {
        domain: 'chat.deepseek.com',
        input: '#chat-input, textarea',
        sidebarCSS: `
            aside, [class*="sidebar"], div:has(> div > svg > path[d*="M20 20"]) { display: none !important; }
            main, [class*="layout-main"] { width: 100% !important; max-width: 100% !important; padding: 0 !important; }
        `
    },
    kimi: {
        domain: 'kimi.',
        input: 'div[contenteditable="true"], textarea',
        sidebarCSS: 'aside, .sidebar, .menu { display: none !important; }'
    }
};

function applyPanelModeStyling() {
    if (!window.location.search.includes('aimate_panel=true')) return;

    document.body.classList.add('aimate-panel-mode');
    
    const style = document.createElement('style');
    let cssRules = `
        ::-webkit-scrollbar { width: 4px; background: transparent; }
        ::-webkit-scrollbar-thumb { background: #a1a1aa; border-radius: 4px; }
    `;
    
    const config = getCurrentSiteConfig();
    if (config) cssRules += config.sidebarCSS;
    
    style.innerHTML = cssRules;
    document.head.appendChild(style);
}

function getCurrentSiteConfig() {
    return Object.values(SITE_CONFIGS).find(c => window.location.href.includes(c.domain));
}

function setNativeValue(element, value) {
    try {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

        if (valueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
            valueSetter.call(element, value);
        } else {
            element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (error) {
        console.error("AI Mate: Error injecting native value", error);
    }
}

function dataURItoFile(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], {type: mimeString});
    return new File([blob], "image.png", {type: mimeString});
}

function triggerPromptExecution(text, base64Image) {
    const config = getCurrentSiteConfig();
    if (!config) return;

    let attempts = 0;
    const maxAttempts = 60;
    const pollInterval = 250;

    const intervalId = setInterval(async () => {
        attempts++;
        
        let inputEl = document.querySelector(config.input);
        if (config.domain === 'chatgpt.com') {
            const formInput = document.querySelector('form #prompt-textarea, form div[contenteditable="true"]');
            if (formInput) inputEl = formInput;
        }

        if (inputEl && !inputEl.disabled && inputEl.getAttribute('aria-disabled') !== 'true') {
            clearInterval(intervalId);
            
            let targetEl = inputEl;
            if (inputEl.tagName.toLowerCase() !== 'textarea' && inputEl.getAttribute('contenteditable') !== 'true') {
                const innerEditable = inputEl.querySelector('textarea, [contenteditable="true"]');
                if (innerEditable) targetEl = innerEditable;
            }

            targetEl.focus();

            setTimeout(async () => {
                // Step 1: Force Clear Content depending on editor type
                if (targetEl.tagName.toLowerCase() === 'textarea') {
                    setNativeValue(targetEl, ''); // React friendly clear for DeepSeek/ChatGPT
                } else {
                    document.execCommand('selectAll', false, null); // ProseMirror friendly select for Gemini
                }

                // Step 2: Insert New Text after a micro-delay (Allows React state to reset)
                setTimeout(async () => {
                    if (text) {
                        if (targetEl.tagName.toLowerCase() === 'textarea') {
                            setNativeValue(targetEl, text);
                        } else {
                            document.execCommand('insertText', false, text);
                            // Deep fallback for contenteditable
                            if (!targetEl.textContent.includes(text.trim().substring(0, 5))) {
                                targetEl.textContent = text;
                            }
                        }
                    } else if (targetEl.tagName.toLowerCase() !== 'textarea') {
                        document.execCommand('delete', false, null);
                    }

                    // Handle Images
                    let imageFile = null;
                    if (base64Image) {
                        try { imageFile = dataURItoFile(base64Image); } catch (e) {}
                    } else {
                        try {
                            const clipboardItems = await navigator.clipboard.read();
                            for (const item of clipboardItems) {
                                const imgType = item.types.find(t => t.startsWith('image/'));
                                if (imgType) {
                                    const blob = await item.getType(imgType);
                                    imageFile = new File([blob], "screenshot.png", {type: blob.type});
                                    break;
                                }
                            }
                        } catch (e) {}
                    }

                    if (imageFile) {
                        if (targetEl.tagName.toLowerCase() !== 'textarea') {
                            const selection = window.getSelection();
                            if (selection && targetEl.lastChild) {
                                const range = document.createRange();
                                range.selectNodeContents(targetEl);
                                range.collapse(false);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            }
                        }
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(imageFile);
                        const pasteEvent = new ClipboardEvent('paste', {
                            clipboardData: dataTransfer,
                            bubbles: true,
                            cancelable: true
                        });
                        targetEl.dispatchEvent(pasteEvent);
                    }

                    // Trigger Framework Events to confirm insertion
                    targetEl.dispatchEvent(new Event('input', { bubbles: true }));
                    targetEl.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    if (targetEl.tagName.toLowerCase() === 'textarea') {
                        targetEl.style.height = 'auto';
                        targetEl.style.height = targetEl.scrollHeight + 'px';
                        targetEl.selectionStart = targetEl.selectionEnd = targetEl.value.length;
                    }

                }, 50);

            }, 100);

        } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
        }
    }, pollInterval);
}

function handleInjection(site, text, image, ts) {
    if (!text || !site) return;
    const config = getCurrentSiteConfig();
    const siteKey = Object.keys(SITE_CONFIGS).find(k => SITE_CONFIGS[k].domain === config?.domain);
    
    // Check if the injection is meant for this specific AI
    if (config && site === siteKey && (Date.now() - ts < 15000)) {
        triggerPromptExecution(text, image);
    }
}

// Initial Load Check
chrome.storage.local.get('activeInjection', (data) => {
    if (data.activeInjection) {
        const { site, text, image, ts } = data.activeInjection;
        handleInjection(site, text, image, ts);
    }
});

applyPanelModeStyling();

// Listener for active changes (Reloads & Consecutive Sends)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.activeInjection && changes.activeInjection.newValue) {
            const { site, text, image, ts } = changes.activeInjection.newValue;
            handleInjection(site, text, image, ts);
        }
        
        if (changes.sharedContext && changes.sharedContext.newValue) {
            chrome.storage.local.get(['targetSite', 'sharedImage'], (data) => {
                handleInjection(data.targetSite, changes.sharedContext.newValue, data.sharedImage, Date.now());
            });
        }
    }
});