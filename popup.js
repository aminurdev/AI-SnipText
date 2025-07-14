document.addEventListener('DOMContentLoaded', function() {
  const captureBtn = document.getElementById('captureBtn');
  
  captureBtn.addEventListener('click', async function() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we can access the tab
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        alert('Cannot capture screenshots on browser internal pages. Please navigate to a regular website.');
        return;
      }
      
      try {
        // Try to inject content script if not already present
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Also inject CSS
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['overlay.css']
        });
      } catch (injectionError) {
        // Content script might already be injected, continue
        console.log('Content script injection skipped:', injectionError.message);
      }
      
      // Wait a bit for script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send message to content script to start area selection
      await chrome.tabs.sendMessage(tab.id, { action: 'startAreaSelection' });
      
      // Close the popup
      window.close();
    } catch (error) {
      console.error('Error starting area selection:', error);
      alert('Error starting area selection. Please refresh the page and try again.');
    }
  });
});