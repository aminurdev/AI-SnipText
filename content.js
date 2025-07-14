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
    
    // Show loading animation
    this.showLoadingAnimation();
    
    try {
      // Send message to background script to capture screenshot
      const response = await chrome.runtime.sendMessage({
        action: 'captureArea',
        selection: selectionData
      });
      
      // Hide loading animation
      this.hideLoadingAnimation();
      
      if (response.success) {
        // Display extracted text
        if (response.extractedText) {
          this.showTextResult(response.extractedText);
        } else if (response.textExtractionError) {
          this.showTextResult(`Error extracting text: ${response.textExtractionError}`);
        } else {
          this.showTextResult('Text extraction completed but no text found in image.');
        }
      } else {
        throw new Error(response.error || 'Failed to capture screenshot');
      }
      
    } catch (error) {
      this.hideLoadingAnimation();
      console.error('Error capturing area:', error);
      this.showTextResult(`Error: ${error.message}`);
    }
    
    this.cancelSelection();
  }

  showLoadingAnimation() {
    // Create loading modal
    this.loadingModal = document.createElement('div');
    this.loadingModal.className = 'ai-loading-modal';
    this.loadingModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10002;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const loadingContent = document.createElement('div');
    loadingContent.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      color: white;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // AI Brain Animation
    const brainContainer = document.createElement('div');
    brainContainer.style.cssText = `
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      position: relative;
    `;
    
    const brain = document.createElement('div');
    brain.innerHTML = '🧠';
    brain.style.cssText = `
      font-size: 60px;
      animation: pulse 2s ease-in-out infinite;
      filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
    `;
    
    // Neural network dots
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background: #fff;
        border-radius: 50%;
        animation: neuralPulse ${1 + i * 0.2}s ease-in-out infinite;
        top: ${20 + Math.sin(i) * 30}px;
        left: ${20 + Math.cos(i) * 30}px;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
      `;
      brainContainer.appendChild(dot);
    }
    
    brainContainer.appendChild(brain);
    
    const title = document.createElement('h3');
    title.textContent = 'AI Processing';
    title.style.cssText = `
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    `;
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Extracting text with Gemini 2.0 Flash...';
    subtitle.style.cssText = `
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
      animation: fadeInOut 2s ease-in-out infinite;
    `;
    
    // Progress bar
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 200px;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      margin: 20px auto 0;
      overflow: hidden;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #fff, #a8edea, #fed6e3);
      border-radius: 2px;
      animation: progressFlow 3s ease-in-out infinite;
    `;
    
    progressContainer.appendChild(progressBar);
    
    loadingContent.appendChild(brainContainer);
    loadingContent.appendChild(title);
    loadingContent.appendChild(subtitle);
    loadingContent.appendChild(progressContainer);
    
    this.loadingModal.appendChild(loadingContent);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes neuralPulse {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
      }
      @keyframes fadeInOut {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
      @keyframes progressFlow {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(this.loadingModal);
  }
  
  hideLoadingAnimation() {
    if (this.loadingModal) {
      this.loadingModal.remove();
      this.loadingModal = null;
    }
  }

  showTextResult(extractedText) {
    // Create result modal
    const modal = document.createElement('div');
    modal.className = 'text-result-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: modalFadeIn 0.3s ease-out;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 700px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      position: relative;
      animation: modalSlideIn 0.3s ease-out;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f0f0f0;
    `;
    
    const icon = document.createElement('div');
    icon.innerHTML = '✨';
    icon.style.cssText = `
      font-size: 28px;
      margin-right: 12px;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Extracted Text';
    title.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 24px;
      font-weight: 600;
      flex: 1;
    `;
    
    header.appendChild(icon);
    header.appendChild(title);
    
    const textArea = document.createElement('textarea');
    textArea.value = extractedText;
    textArea.style.cssText = `
      width: 100%;
      min-height: 250px;
      border: 2px solid #e1e5e9;
      border-radius: 12px;
      padding: 16px;
      font-size: 15px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      resize: vertical;
      margin-bottom: 20px;
      box-sizing: border-box;
      line-height: 1.5;
      transition: border-color 0.2s ease;
    `;
    
    textArea.addEventListener('focus', () => {
      textArea.style.borderColor = '#007bff';
      textArea.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
    });
    
    textArea.addEventListener('blur', () => {
      textArea.style.borderColor = '#e1e5e9';
      textArea.style.boxShadow = 'none';
    });
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;
    
    const copyButton = document.createElement('button');
    copyButton.innerHTML = '📋 Copy Text';
    copyButton.style.cssText = `
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    `;
    
    copyButton.addEventListener('mouseenter', () => {
      copyButton.style.transform = 'translateY(-2px)';
      copyButton.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
    });
    
    copyButton.addEventListener('mouseleave', () => {
      copyButton.style.transform = 'translateY(0)';
      copyButton.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
    });
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕ Close';
    closeButton.style.cssText = `
      background: #6c757d;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = '#5a6268';
      closeButton.style.transform = 'translateY(-2px)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = '#6c757d';
      closeButton.style.transform = 'translateY(0)';
    });
    
    // Event listeners
    copyButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(extractedText);
        copyButton.innerHTML = '✅ Copied!';
        copyButton.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
        setTimeout(() => {
          copyButton.innerHTML = '📋 Copy Text';
          copyButton.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
        }, 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
        copyButton.innerHTML = '❌ Failed';
        copyButton.style.background = '#dc3545';
        setTimeout(() => {
          copyButton.innerHTML = '📋 Copy Text';
          copyButton.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
        }, 2000);
      }
    };
    
    closeButton.onclick = () => {
      modal.style.animation = 'modalFadeOut 0.2s ease-in';
      setTimeout(() => modal.remove(), 200);
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.animation = 'modalFadeOut 0.2s ease-in';
        setTimeout(() => modal.remove(), 200);
      }
    };
    
    // Assemble modal
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);
    
    modalContent.appendChild(header);
    modalContent.appendChild(textArea);
    modalContent.appendChild(buttonContainer);
    
    modal.appendChild(modalContent);
    
    // Add modal animations
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes modalSlideIn {
        from { transform: translateY(-50px) scale(0.9); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(modalStyle);
    
    document.body.appendChild(modal);
    
    // Focus on text area for easy selection
    setTimeout(() => {
      textArea.focus();
      textArea.select();
    }, 300);
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