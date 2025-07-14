// Background script for the Area Screenshot Extension

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI SnipText Extension installed');
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureArea') {
    handleAreaCapture(request, sender, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'setApiKey') {
    handleSetApiKey(request, sendResponse);
    return true;
  } else if (request.action === 'getApiKey') {
    handleGetApiKey(sendResponse);
    return true;
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
       
       reader.onload = async () => {
         const imageDataUrl = reader.result;
         
         // Extract text from image using Gemini API
         try {
           const extractedText = await extractTextFromImage(imageDataUrl);
           sendResponse({ 
             success: true, 
             dataUrl: imageDataUrl,
             extractedText: extractedText
           });
         } catch (error) {
           console.error('Error extracting text:', error);
           sendResponse({ 
             success: true, 
             dataUrl: imageDataUrl,
             extractedText: null,
             textExtractionError: error.message
           });
         }
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

// Function to handle API key storage
async function handleSetApiKey(request, sendResponse) {
  try {
    await chrome.storage.local.set({ 'gemini_api_key': request.apiKey });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error storing API key:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function to get stored API key
async function handleGetApiKey(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['gemini_api_key']);
    sendResponse({ success: true, apiKey: result.gemini_api_key || null });
  } catch (error) {
    console.error('Error retrieving API key:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function to extract text from image using Gemini API
async function extractTextFromImage(imageDataUrl) {
  // Get API key from storage
  const result = await chrome.storage.local.get(['gemini_api_key']);
  const apiKey = result.gemini_api_key;
  
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please set your API key in the extension popup.');
  }
  
  // Convert data URL to base64 (remove data:image/png;base64, prefix)
  const base64Image = imageDataUrl.split(',')[1];
  
  const requestBody = {
    contents: [{
      parts: [
        {
          text: "Extract all text from this image. Return only the text content, no additional formatting or explanations."
        },
        {
          inline_data: {
            mime_type: "image/png",
            data: base64Image
          }
        }
      ]
    }]
  };
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('No text found in the image or unexpected API response format');
    }
  } catch (error) {
    console.error('Gemini API request failed:', error);
    throw error;
  }
}