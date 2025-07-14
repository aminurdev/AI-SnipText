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

## Installation

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy the API key for later use

2. **Install the Extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" by toggling the switch in the top right corner
   - Click "Load unpacked" button
   - Select the folder containing this extension
   - The extension should now appear in your extensions list and toolbar

3. **Configure API Key**:
   - Click the extension icon in the Chrome toolbar
   - Paste your Gemini API key in the "Gemini API Key" field
   - Click "Save API Key"
   - The extension is now ready to use

## How to Use

1. **Start Selection**: Click the extension icon in the Chrome toolbar and click "Select Area & Extract Text"
2. **Select Area**: An overlay will appear on the current webpage. Click and drag to select the desired area
3. **Capture & Extract**: Once you've selected an area, click the "Capture" button
4. **AI Processing**: Watch the professional loading animation while Gemini 2.0 Flash processes your image
5. **View Results**: A modern modal will appear showing:
   - Extracted text from the image
   - One-click copy to clipboard functionality
6. **Cancel**: Click "Cancel" or press Escape to exit selection mode

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