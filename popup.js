"use strict";

document.addEventListener('DOMContentLoaded', () => {
    const promptList = document.getElementById('promptList');
    const addBtn = document.getElementById('addBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const searchInput = document.getElementById('searchInput');
    const emptyState = document.getElementById('emptyState');
    
    const modal = document.getElementById('addModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveBtn = document.getElementById('saveBtn');
    const headingInput = document.getElementById('promptHeading');
    const textInput = document.getElementById('promptText');
    const errorMsg = document.getElementById('errorMsg');
    const modalTitle = document.getElementById('modalTitle');

    let editModeKey = null;

    /**
     * Render list using data from storage
     */
    function renderPrompts() {
        chrome.storage.sync.get(null, (result) => {
            promptList.innerHTML = '';
            const keys = Object.keys(result).filter(k => k !== 'selectedSite');
            
            if (keys.length === 0) {
                emptyState.style.display = 'flex';
                searchInput.parentElement.style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                searchInput.parentElement.style.display = 'block';
            }
            
            keys.forEach(key => {
                const li = document.createElement('li');
                li.className = 'entry';
                li.innerHTML = `
                    <span class="entry-title">${escapeHTML(key)}</span>
                    <div class="actions">
                        <button class="edit-btn" title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="delete-btn" title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                `;
                
                // Edit Click
                li.querySelector('.edit-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openModal(key, result[key]);
                });
                
                // Delete Click
                li.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if(confirm(`Delete "${key}"?`)) {
                        chrome.storage.sync.remove(key, renderPrompts);
                    }
                });
                
                promptList.appendChild(li);
            });
            // Preserve the search filte
            applySearchFilter();
        });
    }

    /**
     * Live search filtering logic
     */
    function applySearchFilter() {
        const term = searchInput.value.toLowerCase();
        let visibleCount = 0;
        
        document.querySelectorAll('.entry').forEach(li => {
            const text = li.querySelector('.entry-title').textContent.toLowerCase();
            if (text.includes(term)) {
                li.style.display = 'flex';
                visibleCount++;
            } else {
                li.style.display = 'none';
            }
        });

        // If no results are found in search
        if (visibleCount === 0 && document.querySelectorAll('.entry').length > 0) {
            emptyState.style.display = 'flex';
            emptyState.querySelector('p').textContent = "No matching prompts.";
        } else if (visibleCount > 0) {
            emptyState.style.display = 'none';
        }
    }

    searchInput.addEventListener('input', applySearchFilter);

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag]));
    }

    function openModal(key = null, text = '') {
        editModeKey = key;
        headingInput.value = key || '';
        textInput.value = text;
        errorMsg.style.display = 'none';
        modalTitle.textContent = key ? 'Edit Prompt' : 'New Prompt';
        
        modal.style.display = 'flex';
        headingInput.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
        editModeKey = null;
    }

    // Event Listeners
    addBtn.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);
    settingsBtn.addEventListener('click', () => chrome.tabs.create({ url: 'settings.html' }));

    saveBtn.addEventListener('click', () => {
        const key = headingInput.value.trim();
        const text = textInput.value.trim();

        if (!key || !text) {
            errorMsg.style.display = 'block';
            return;
        }

        chrome.storage.sync.get(null, (result) => {
            if (key !== editModeKey && result[key]) {
                alert("This name already exists. Please use a unique name.");
                return;
            }
            
            const saveData = { [key]: text };
            if (editModeKey && editModeKey !== key) {
                chrome.storage.sync.remove(editModeKey);
            }
            
            chrome.storage.sync.set(saveData, () => {
                closeModal();
                renderPrompts();
            });
        });
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    renderPrompts();
});