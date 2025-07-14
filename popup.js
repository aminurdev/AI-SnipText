document.addEventListener('DOMContentLoaded', function() {
  const captureBtn = document.getElementById('captureBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const apiStatus = document.getElementById('apiStatus');
  
  // Load existing API key on popup open
  loadApiKey();
  
  // Save API key event listener
  saveApiKeyBtn.addEventListener('click', saveApiKey);
  
  // Enter key in API input
  apiKeyInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveApiKey();
    }
  });
  
  captureBtn.addEventListener('click', async function() {
    try {
      // Check if API key is set
      const apiKeyResponse = await chrome.runtime.sendMessage({ action: 'getApiKey' });
      if (!apiKeyResponse.success || !apiKeyResponse.apiKey) {
        showApiStatus('Please set your Gemini API key first', 'error');
        return;
      }
      
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
  
  // Load existing API key
  async function loadApiKey() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getApiKey' });
      if (response.success && response.apiKey) {
        apiKeyInput.value = response.apiKey;
        showApiStatus('API key loaded', 'success');
        updateCaptureButtonState(true);
      } else {
        showApiStatus('No API key found', 'error');
        updateCaptureButtonState(false);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
      showApiStatus('Error loading API key', 'error');
      updateCaptureButtonState(false);
    }
  }
  
  // Save API key
  async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showApiStatus('Please enter an API key', 'error');
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'setApiKey', 
        apiKey: apiKey 
      });
      
      if (response.success) {
        showApiStatus('API key saved successfully', 'success');
        updateCaptureButtonState(true);
      } else {
        showApiStatus('Error saving API key', 'error');
        updateCaptureButtonState(false);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      showApiStatus('Error saving API key', 'error');
      updateCaptureButtonState(false);
    }
  }
  
  // Show API status message
  function showApiStatus(message, type) {
    apiStatus.textContent = message;
    apiStatus.className = `api-status status-${type}`;
    apiStatus.style.display = 'block';
    
    // Hide status after 3 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        apiStatus.style.display = 'none';
      }, 3000);
    }
  }
  
  // Update capture button state
  function updateCaptureButtonState(hasApiKey) {
    if (hasApiKey) {
      captureBtn.disabled = false;
      captureBtn.textContent = 'Select Area & Extract Text';
    } else {
      captureBtn.disabled = true;
      captureBtn.textContent = 'Set API Key First';
    }
  }
});