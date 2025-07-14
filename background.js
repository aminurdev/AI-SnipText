// Background script for the Area Screenshot Extension

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Area Screenshot Extension installed');
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureArea') {
    handleAreaCapture(request, sender, sendResponse);
    return true; // Keep message channel open for async response
  }
});

// Function to handle area screenshot capture
async function handleAreaCapture(request, sender, sendResponse) {
  try {
    const { selection } = request;
    const tabId = sender.tab.id;
    
    // Capture the visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(sender.tab.windowId, {
      format: 'png'
    });
    
    // Convert data URL to blob and create ImageBitmap
     const response = await fetch(dataUrl);
     const blob = await response.blob();
     const imageBitmap = await createImageBitmap(blob);
     
     try {
       // Create canvas for cropping
       const canvas = new OffscreenCanvas(selection.width, selection.height);
       const ctx = canvas.getContext('2d');
       
       // Account for device pixel ratio and scroll position
       const scaleFactor = selection.devicePixelRatio;
       const sourceX = (selection.left + selection.scrollX) * scaleFactor;
       const sourceY = (selection.top + selection.scrollY) * scaleFactor;
       const sourceWidth = selection.width * scaleFactor;
       const sourceHeight = selection.height * scaleFactor;
       
       // Draw the selected area to the canvas
       ctx.drawImage(
         imageBitmap,
         sourceX, sourceY, sourceWidth, sourceHeight,
         0, 0, selection.width, selection.height
       );
       
       // Convert to blob and then to data URL
       const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
       const reader = new FileReader();
       
       reader.onload = () => {
         sendResponse({ success: true, dataUrl: reader.result });
       };
       
       reader.onerror = () => {
         sendResponse({ success: false, error: 'Failed to convert image' });
       };
       
       reader.readAsDataURL(croppedBlob);
       
       // Clean up
       imageBitmap.close();
       
     } catch (error) {
       sendResponse({ success: false, error: error.message });
     }
    
  } catch (error) {
    console.error('Error in background script:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle tab updates if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Could be used to inject content script dynamically if needed
  if (changeInfo.status === 'complete' && tab.url) {
    // Extension is ready to work on this tab
  }
});