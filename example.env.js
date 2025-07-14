// Environment variables for AI SnipText Extension
// This file contains sensitive configuration that should be kept secure

/**
 * Environment Configuration
 *
 * Instructions:
 * 1. Get your API key from: https://makersuite.google.com/app/apikey
 * 2. Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual Gemini API key
 * 3. Keep this file secure and never commit it to public repositories
 *
 * Security Notes:
 * - This file should be added to .gitignore if using version control
 * - Never share your API key publicly
 * - Consider using different keys for development and production
 */

const ENV = {
  // Gemini API Key - Replace with your actual key
  GEMINI_API_KEY: "YOUR_GEMINI_API_KEY_HERE",
};

// Validation function
ENV.isValidApiKey = function () {
  return (
    this.GEMINI_API_KEY &&
    this.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE" &&
    this.GEMINI_API_KEY.length > 10
  );
};

// Export for different environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = ENV;
}

// Make available globally for Chrome extension context
if (typeof window !== "undefined" && typeof window.ENV === "undefined") {
  window.ENV = ENV;
}

// For Chrome extension background script
if (typeof self !== "undefined" && typeof self.ENV === "undefined") {
  self.ENV = ENV;
}
