# Area Screenshot Chrome Extension

A Chrome extension that allows users to select any area on a webpage and convert it to an image.

## Features

- **Area Selection**: Click and drag to select any rectangular area on a webpage
- **Visual Overlay**: Semi-transparent overlay with selection box for precise area selection
- **Real-time Feedback**: Shows selection dimensions in real-time
- **Image Capture**: Converts selected area to PNG image and automatically downloads it
- **Easy Controls**: Simple capture and cancel buttons
- **Keyboard Support**: Press Escape to cancel selection

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" button
4. Select the folder containing this extension (`c:\Users\Aminur R\Desktop\Extention\AI`)
5. The extension should now appear in your extensions list and toolbar

## How to Use

1. **Start Selection**: Click the extension icon in the Chrome toolbar and click "Select Area"
2. **Select Area**: An overlay will appear on the current webpage. Click and drag to select the desired area
3. **Capture**: Once you've selected an area, click the "Capture" button to save it as an image
4. **Cancel**: Click "Cancel" or press Escape to exit selection mode

## Files Structure

- `manifest.json` - Extension configuration and permissions
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `content.js` - Main area selection and capture logic
- `overlay.css` - Styling for the selection overlay
- `background.js` - Background script for extension management

## Technical Details

- Uses HTML5 Canvas API for image capture
- Integrates html2canvas library for webpage screenshot functionality
- Implements drag-and-drop area selection with visual feedback
- Automatically downloads captured images as PNG files

## Browser Compatibility

- Chrome (Manifest V3)
- Other Chromium-based browsers (Edge, Brave, etc.)

## Permissions

- `activeTab` - Access to the current active tab
- `scripting` - Inject content scripts
- `downloads` - Download captured images

## Troubleshooting

- If the extension doesn't work on certain websites, it might be due to Content Security Policy restrictions
- Make sure the extension has permission to access the current website
- Refresh the page if the overlay doesn't appear properly