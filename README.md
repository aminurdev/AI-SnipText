# AI SnipText Chrome Extension

A Chrome extension that allows users to select any area on a webpage, capture it as an image, and extract text from it using Google's Gemini AI.

## Features

- **Area Selection**: Click and drag to select any rectangular area on a webpage
- **Visual Overlay**: Semi-transparent overlay with selection box for precise area selection
- **Real-time Feedback**: Shows selection dimensions in real-time
- **AI Text Extraction**: Uses Google Gemini 2.0 Flash for fast and accurate text extraction
- **Professional Loading Animation**: Beautiful AI-themed loading screen with neural network effects
- **Smart Text Display**: Shows extracted text in a modern modal with copy functionality
- **API Key Management**: Secure storage of Gemini API key
- **Easy Controls**: Simple capture and cancel buttons
- **Keyboard Support**: Press Escape to cancel selection

## Setup

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

2. **Configure API Key**:
   - Open `env.js` in the extension folder
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key
   - Save the file
   - Optionally customize other settings in `config.js` like auto-hide delay, timeouts, etc.

3. **Install the Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select this extension folder

## How to Use

1. **Instant Selection**:
   - Click the AI SnipText extension icon
   - Area selection starts immediately - no additional clicks needed!

2. **Select Area**:
   - Your cursor will change to a crosshair
   - Click and drag to select the area containing text
   - The selection will be highlighted with a blue border

3. **Automatic AI Processing**:
   - After selecting an area, AI processing begins automatically
   - A professional loading animation will appear
   - The Gemini 2.0 Flash model extracts text from the selected area

4. **View Results**:
   - Extracted text appears in a simple rectangular container in the bottom-right corner
   - Click the copy button to copy text to clipboard
   - The result container auto-hides after 10 seconds
   - Press ESC anytime to cancel the selection

## Files Structure

- `manifest.json` - Extension configuration and permissions
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `content.js` - Main area selection and capture logic
- `overlay.css` - Styling for the selection overlay
- `background.js` - Background script for extension management

## Technical Details

- Uses HTML5 Canvas API for image capture
- Integrates Google Gemini 2.0 Flash API for fast text extraction
- Professional loading animations with neural network effects
- Implements drag-and-drop area selection with visual feedback
- Secure API key storage using Chrome storage API
- Modern modal design with smooth animations
- One-click copy to clipboard functionality

## Browser Compatibility

- Chrome (Manifest V3)
- Other Chromium-based browsers (Edge, Brave, etc.)

## Permissions

- `activeTab` - Access to the current active tab
- `scripting` - Inject content scripts
- `downloads` - Download captured images
- `storage` - Store API key securely
- `host_permissions` - Access to Gemini AI API

## Troubleshooting

- **API Key Issues**: Make sure you have a valid Gemini API key from Google AI Studio
- **Text Extraction Fails**: Check your internet connection and API key validity
- **Extension Not Working**: If the extension doesn't work on certain websites, it might be due to Content Security Policy restrictions
- **Permissions**: Make sure the extension has permission to access the current website
- **Overlay Issues**: Refresh the page if the overlay doesn't appear properly
- **Rate Limits**: Gemini API has usage limits; check your API quota if requests fail

## API Costs

This extension uses Google's Gemini 2.0 Flash API, which may have associated costs depending on usage. Gemini 2.0 Flash is optimized for speed and efficiency. Check [Google AI pricing](https://ai.google.dev/pricing) for current rates.
