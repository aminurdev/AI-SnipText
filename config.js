// Configuration file for AI SnipText Extension
// This file contains all configuration settings for the extension

/**
 * Configuration for AI SnipText Extension
 *
 * Instructions:
 * 1. Configure your API key in env.js file
 * 2. Optionally customize other settings below
 *
 * Note:
 * - API key is now managed in env.js for better security
 * - Other extension settings can be customized here
 */

// Import environment variables
// Note: env.js should be loaded before this file
const CONFIG = {
  // API Configuration - imported from env.js
  get GEMINI_API_KEY() {
    return (
      (typeof ENV !== "undefined" && ENV.GEMINI_API_KEY) ||
      "YOUR_GEMINI_API_KEY_HERE"
    );
  },

  // API Endpoint Configuration
  GEMINI_API_URL:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",

  // Extension Settings
  EXTENSION_SETTINGS: {
    // Auto-hide result container after this many milliseconds
    AUTO_HIDE_DELAY: 10000,

    // Maximum number of retries for API calls
    MAX_API_RETRIES: 3,

    // Timeout for API requests (milliseconds)
    API_TIMEOUT: 30000,

    // Default text extraction prompt
    DEFAULT_PROMPT:
      "Extract all text from this image. Return only the text content, no additional formatting or explanations.",
  },

  // UI Configuration
  UI_SETTINGS: {
    // Result container position
    RESULT_POSITION: "bottom-right",

    // Animation duration (milliseconds)
    ANIMATION_DURATION: 300,

    // Loading animation settings
    LOADING_ANIMATION: {
      SHOW_BRAIN_ANIMATION: true,
      SHOW_NEURAL_DOTS: true,
      SHOW_PROGRESS_BAR: true,
    },
  },
};

// Validation function to check if API key is properly configured
CONFIG.isValidApiKey = function () {
  const apiKey = this.GEMINI_API_KEY;
  return apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE" && apiKey.length > 10;
};

// Check if env.js is loaded
CONFIG.isEnvLoaded = function () {
  return typeof ENV !== "undefined" && ENV.isValidApiKey && ENV.isValidApiKey();
};

// Export configuration for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}

// Make available globally for Chrome extension context
if (typeof window !== "undefined" && typeof window.CONFIG === "undefined") {
  window.CONFIG = CONFIG;
}

// For Chrome extension background script
if (typeof self !== "undefined" && typeof self.CONFIG === "undefined") {
  self.CONFIG = CONFIG;
}
