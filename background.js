// Background script for the Area Screenshot Extension

// Import environment variables and configuration
importScripts("env.js");
importScripts("config.js");

// Use configuration from config.js
const GEMINI_API_URL = CONFIG.GEMINI_API_URL;
const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
const API_TIMEOUT = CONFIG.EXTENSION_SETTINGS.API_TIMEOUT;
const MAX_RETRIES = CONFIG.EXTENSION_SETTINGS.MAX_API_RETRIES;
const DEFAULT_PROMPT = CONFIG.EXTENSION_SETTINGS.DEFAULT_PROMPT;

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("AI SnipText Extension installed");
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureArea") {
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
      format: "png",
    });

    // Convert data URL to blob and create ImageBitmap
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);

    try {
      // Create canvas for cropping
      const canvas = new OffscreenCanvas(selection.width, selection.height);
      const ctx = canvas.getContext("2d");

      // Account for device pixel ratio and scroll position
      const scaleFactor = selection.devicePixelRatio;
      const sourceX = (selection.left + selection.scrollX) * scaleFactor;
      const sourceY = (selection.top + selection.scrollY) * scaleFactor;
      const sourceWidth = selection.width * scaleFactor;
      const sourceHeight = selection.height * scaleFactor;

      // Draw the selected area to the canvas
      ctx.drawImage(
        imageBitmap,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        selection.width,
        selection.height
      );

      // Convert to blob and then to data URL
      const croppedBlob = await canvas.convertToBlob({ type: "image/png" });
      const reader = new FileReader();

      reader.onload = async () => {
        const imageDataUrl = reader.result;

        // Extract text from image using Gemini API
        const extractedText = await extractTextFromImage(imageDataUrl);
        sendResponse({
          success: true,
          dataUrl: imageDataUrl,
          extractedText: extractedText,
        });
      };

      reader.onerror = () => {
        sendResponse({ success: false, error: "Failed to convert image" });
      };

      reader.readAsDataURL(croppedBlob);

      // Clean up
      imageBitmap.close();
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle tab updates if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Could be used to inject content script dynamically if needed
  if (changeInfo.status === "complete" && tab.url) {
    // Extension is ready to work on this tab
  }
});

// Function to extract text from image using Gemini API
async function extractTextFromImage(imageDataUrl) {
  // Check if API key is configured
  if (!CONFIG.isValidApiKey()) {
    const errorMsg = CONFIG.isEnvLoaded()
      ? "Gemini API key not properly configured in env.js"
      : "Gemini API key not configured. Please set your API key in env.js";
    throw new Error(errorMsg);
  }

  // Convert data URL to base64 (remove data:image/png;base64, prefix)
  const base64Image = imageDataUrl.split(",")[1];

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: DEFAULT_PROMPT,
          },
          {
            inline_data: {
              mime_type: "image/png",
              data: base64Image,
            },
          },
        ],
      },
    ],
  };

  // Retry logic with exponential backoff
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        return null;
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        return null;
      }
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.name === "AbortError") {
        return null;
      }
      if (error.message.includes("API key")) {
        return null;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  return null;
}
