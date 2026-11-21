"use strict";

document.addEventListener('DOMContentLoaded', () => {
    const exportButton = document.getElementById('exportButton');
    const fileInput = document.getElementById('fileInput');
    const toast = document.getElementById('toast');

    function showToast(message) {
        toast.textContent = message;
        toast.className = "show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
    }

    exportButton.addEventListener('click', () => {
        chrome.storage.sync.get(null, (result) => {
            delete result['selectedSite'];
            
            let csvContent = "data:text/csv;charset=utf-8,";
            
            // Generate CSV Headers
            csvContent += `"Prompt Name","Instruction"\n`;

            for (let key in result) {
                let escapedKey = key.replace(/"/g, '""');
                let escapedPrompt = result[key].replace(/"/g, '""');
                csvContent += `"${escapedKey}","${escapedPrompt}"\n`;
            }
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "aimate_prompts_backup.csv");
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast("Backup exported successfully!");
        });
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        
        if (file && file.type === 'text/csv') {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const lines = e.target.result.split('\n');
                let newPrompts = {};
                let count = 0;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.trim() === '') continue;
                    
                    // Skip header row if exists
                    if (i === 0 && line.toLowerCase().includes("prompt name")) continue;

                    const match = line.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)"$/);
                    
                    if (match) {
                        newPrompts[match[1].replace(/""/g, '"')] = match[2].replace(/""/g, '"');
                        count++;
                    }
                }
                
                if (count > 0) {
                    chrome.storage.sync.get(null, (result) => {
                        if (result.hasOwnProperty('selectedSite')) {
                            delete result['selectedSite'];
                        }
                        chrome.storage.sync.set({ ...result, ...newPrompts }, () => {
                            showToast(`${count} Prompts imported successfully!`);
                        });
                    });
                } else {
                    showToast("No valid prompts found in the CSV file.");
                }
            };
            reader.readAsText(file);
        } else {
            showToast("Invalid format. Please select a valid CSV file.");
        }
        
        // Reset file input so the same file can be selected again
        event.target.value = '';
    });
});