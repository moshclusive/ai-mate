"use strict";

document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('inputField');
    const promptList = document.getElementById('promptList');
    const closeBtn = document.getElementById('closeBtn');
    const enterHint = document.getElementById('enterHint');
    
    const sites = {
        'chatgpt': document.getElementById('siteChatGPT'),
        'gemini': document.getElementById('siteGemini'),
        'deepseek': document.getElementById('siteDeepseek'),
        'kimi': document.getElementById('siteKimi')
    };

    let selectedSite = 'chatgpt';

    chrome.storage.sync.get(null, (result) => {
        if (result.selectedSite && sites[result.selectedSite]) {
            selectedSite = result.selectedSite;
        }
        updateSiteSelection();
        
        Object.entries(result).forEach(([key, value]) => {
            if (key !== 'selectedSite') {
                const li = document.createElement('li');
                li.className = 'promptItem'; 
                li.textContent = key; 
                li.dataset.prompt = value;
                promptList.appendChild(li);
            }
        });
    });

    Object.entries(sites).forEach(([siteKey, imgElement]) => {
        if(imgElement) {
            imgElement.addEventListener('click', () => {
                selectedSite = siteKey;
                chrome.storage.sync.set({ selectedSite: siteKey });
                updateSiteSelection();
            });
        }
    });

    function updateSiteSelection() {
        Object.values(sites).forEach(img => { if(img) img.classList.remove('selected'); });
        if (sites[selectedSite]) sites[selectedSite].classList.add('selected');
    }

    inputField.addEventListener('input', (e) => {
        inputField.style.height = 'auto';
        inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';

        const term = e.target.value.toLowerCase().trim();
        if (term.length > 0) enterHint.style.opacity = '1';
        else enterHint.style.opacity = '0';

        document.querySelectorAll('.promptItem').forEach(li => {
            const text = li.textContent.toLowerCase();
            li.style.display = text.includes(term) ? 'flex' : 'none';
        });
    });

    promptList.addEventListener('click', (e) => {
        if (e.target.classList.contains('promptItem')) {
            executeAndClose(e.target.dataset.prompt);
        }
    });

    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = inputField.value.trim();
            if (text) executeAndClose(text);
        }
    });

    async function executeAndClose(promptInstruction) {
        chrome.storage.local.get(['selectedText', 'copiedImage'], async (data) => {
            let combinedText = promptInstruction;
            let finalImage = data.copiedImage || null;
            
            // 1. যদি কোনো সিলেক্টেড টেক্সট থাকে, তবে সেটি প্রম্পটের সাথে জুড়ে দিন
            if (data.selectedText && data.selectedText.trim().length > 0) {
                combinedText = `${promptInstruction}\n\n${data.selectedText}`;
            }

            // 2. যদি লোকাল মেমোরিতে কোনো ইমেজ না থাকে, তবে OS Clipboard চেক করুন (Alt+A/Win+Shift+S এর জন্য)
            if (!finalImage) {
                try {
                    const clipboardItems = await navigator.clipboard.read();
                    for (const item of clipboardItems) {
                        const imgType = item.types.find(t => t.startsWith('image/'));
                        if (imgType) {
                            const blob = await item.getType(imgType);
                            finalImage = await new Promise(resolve => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            });
                            break; // প্রথম ইমেজটি পেয়ে গেলেই লুপ স্টপ করবে
                        }
                    }
                } catch (e) {
                    console.warn("AI Mate: No image in clipboard or permission denied", e);
                }
            }

            // 3. টেক্সট এবং ইমেজ দুটোই একসাথে গ্লোবাল কনটেক্সটে সেভ করে Side Panel ওপেন করা
            chrome.storage.local.set({ 
                sharedContext: combinedText,
                sharedImage: finalImage,
                targetSite: selectedSite
            }, () => {
                chrome.runtime.sendMessage({ action: 'openSidePanel' });
            });
            
            // 4. এক্সিকিউট হওয়ার পর মেমোরি ক্লিয়ার করে দেওয়া (যাতে পরের প্রম্পটে আগের ডেটা না যায়)
            chrome.storage.local.remove(['selectedText', 'copiedImage']);
            closeOverlay();
        });
    }

    closeBtn.addEventListener('click', closeOverlay);
    function closeOverlay() { 
        window.parent.postMessage({ action: 'closeFloatingUI' }, '*'); 
    }
    
    setTimeout(() => inputField.focus(), 50);
});