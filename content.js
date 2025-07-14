// Content script for area selection and screenshot capture
if (typeof window.AreaSelector === 'undefined') {
class AreaSelector {
  constructor() {
    this.isSelecting = false;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.overlay = null;
    this.selectionBox = null;
    this.selectionInfo = null;
    this.selectionControls = null;
    
    // Bind methods to preserve 'this' context
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  startSelection() {
    if (this.isSelecting) return;
    
    this.isSelecting = true;
    this.createOverlay();
    this.addEventListeners();
  }

  createOverlay() {
    // Create main overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'screenshot-overlay';
    document.body.appendChild(this.overlay);

    // Create selection box
    this.selectionBox = document.createElement('div');
    this.selectionBox.className = 'selection-box';
    this.selectionBox.style.display = 'none';
    document.body.appendChild(this.selectionBox);

    // Create info display
    this.selectionInfo = document.createElement('div');
    this.selectionInfo.className = 'selection-info';
    this.selectionInfo.textContent = 'Click and drag to select an area';
    document.body.appendChild(this.selectionInfo);

    // Create control buttons
    this.selectionControls = document.createElement('div');
    this.selectionControls.className = 'selection-controls';
    
    const captureBtn = document.createElement('button');
    captureBtn.className = 'control-btn';
    captureBtn.textContent = 'Capture';
    captureBtn.style.display = 'none';
    captureBtn.onclick = () => this.captureArea();
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'control-btn cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => this.cancelSelection();
    
    this.selectionControls.appendChild(captureBtn);
    this.selectionControls.appendChild(cancelBtn);
    document.body.appendChild(this.selectionControls);
  }

  addEventListeners() {
    this.overlay.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('keydown', this.onKeyDown);
  }

  removeEventListeners() {
    if (this.overlay) {
      this.overlay.removeEventListener('mousedown', this.onMouseDown);
    }
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  onMouseDown(e) {
    e.preventDefault();
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.endX = e.clientX;
    this.endY = e.clientY;
    this.selectionBox.style.display = 'block';
    this.selectionBox.style.left = this.startX + 'px';
    this.selectionBox.style.top = this.startY + 'px';
    this.selectionBox.style.width = '0px';
    this.selectionBox.style.height = '0px';
  }

  onMouseMove(e) {
    if (!this.isDragging || !this.selectionBox || this.selectionBox.style.display === 'none') return;
    
    e.preventDefault();
    this.endX = e.clientX;
    this.endY = e.clientY;
    
    const left = Math.min(this.startX, this.endX);
    const top = Math.min(this.startY, this.endY);
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);
    
    this.selectionBox.style.left = left + 'px';
    this.selectionBox.style.top = top + 'px';
    this.selectionBox.style.width = width + 'px';
    this.selectionBox.style.height = height + 'px';
    
    this.selectionInfo.textContent = `Selection: ${width} x ${height}px`;
  }

  onMouseUp(e) {
    if (!this.isDragging || !this.selectionBox || this.selectionBox.style.display === 'none') return;
    
    e.preventDefault();
    this.isDragging = false;
    
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);
    
    if (width > 10 && height > 10) {
      this.selectionInfo.textContent = 'Area selected! Click Capture to save as image';
      this.selectionControls.querySelector('.control-btn:not(.cancel)').style.display = 'inline-block';
    } else {
      // If selection is too small, reset
      this.selectionBox.style.display = 'none';
      this.selectionInfo.textContent = 'Click and drag to select an area';
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') {
      this.cancelSelection();
    }
  }

  async captureArea() {
    const left = Math.min(this.startX, this.endX);
    const top = Math.min(this.startY, this.endY);
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);
    
    // Store selection coordinates for background script
    const selectionData = {
      left: left,
      top: top,
      width: width,
      height: height,
      devicePixelRatio: window.devicePixelRatio || 1,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
    
    // Hide overlay temporarily
    this.overlay.style.display = 'none';
    this.selectionBox.style.display = 'none';
    this.selectionInfo.style.display = 'none';
    this.selectionControls.style.display = 'none';
    
    try {
      // Send message to background script to capture screenshot
      const response = await chrome.runtime.sendMessage({
        action: 'captureArea',
        selection: selectionData
      });
      
      if (response.success) {
        // Create download link for the captured image
        const a = document.createElement('a');
        a.href = response.dataUrl;
        a.download = `screenshot-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error(response.error || 'Failed to capture screenshot');
      }
      
    } catch (error) {
      console.error('Error capturing area:', error);
      alert('Error capturing screenshot. Please try again.');
    }
    
    this.cancelSelection();
  }

  cancelSelection() {
    this.isSelecting = false;
    this.isDragging = false;
    this.removeEventListeners();
    
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    
    if (this.selectionBox) {
      this.selectionBox.remove();
      this.selectionBox = null;
    }
    
    if (this.selectionInfo) {
      this.selectionInfo.remove();
      this.selectionInfo = null;
    }
    
    if (this.selectionControls) {
      this.selectionControls.remove();
      this.selectionControls = null;
    }
  }
}

// Store class globally to prevent redeclaration
window.AreaSelector = AreaSelector;
}

// Create global instance if not exists
if (typeof window.areaSelector === 'undefined') {
  window.areaSelector = new window.AreaSelector();
}

// Listen for messages from popup
if (!window.areaScreenshotListenerAdded) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startAreaSelection') {
      window.areaSelector.startSelection();
      sendResponse({ success: true });
    }
  });
  window.areaScreenshotListenerAdded = true;
}