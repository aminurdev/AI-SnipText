// Content script for area selection and screenshot capture
if (typeof window.AreaSelector === "undefined") {
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
      this.overlay = document.createElement("div");
      this.overlay.className = "screenshot-overlay";
      document.body.appendChild(this.overlay);

      // Create selection box
      this.selectionBox = document.createElement("div");
      this.selectionBox.className = "selection-box";
      this.selectionBox.style.display = "none";
      document.body.appendChild(this.selectionBox);

      // Create info display
      this.selectionInfo = document.createElement("div");
      this.selectionInfo.className = "selection-info";
      this.selectionInfo.textContent = "Click and drag to select an area";
      document.body.appendChild(this.selectionInfo);

      // Create control buttons (only cancel button, no capture button)
      this.selectionControls = document.createElement("div");
      this.selectionControls.className = "selection-controls";

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "control-btn cancel";
      cancelBtn.textContent = "Cancel (ESC)";
      cancelBtn.onclick = () => this.cancelSelection();

      this.selectionControls.appendChild(cancelBtn);
      document.body.appendChild(this.selectionControls);
    }

    addEventListeners() {
      this.overlay.addEventListener("mousedown", this.onMouseDown);
      document.addEventListener("mousemove", this.onMouseMove);
      document.addEventListener("mouseup", this.onMouseUp);
      document.addEventListener("keydown", this.onKeyDown);
    }

    removeEventListeners() {
      if (this.overlay) {
        this.overlay.removeEventListener("mousedown", this.onMouseDown);
      }
      document.removeEventListener("mousemove", this.onMouseMove);
      document.removeEventListener("mouseup", this.onMouseUp);
      document.removeEventListener("keydown", this.onKeyDown);
    }

    onMouseDown(e) {
      e.preventDefault();
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.endX = e.clientX;
      this.endY = e.clientY;
      this.selectionBox.style.display = "block";
      this.selectionBox.style.left = this.startX + "px";
      this.selectionBox.style.top = this.startY + "px";
      this.selectionBox.style.width = "0px";
      this.selectionBox.style.height = "0px";
    }

    onMouseMove(e) {
      if (
        !this.isDragging ||
        !this.selectionBox ||
        this.selectionBox.style.display === "none"
      )
        return;

      e.preventDefault();
      this.endX = e.clientX;
      this.endY = e.clientY;

      const left = Math.min(this.startX, this.endX);
      const top = Math.min(this.startY, this.endY);
      const width = Math.abs(this.endX - this.startX);
      const height = Math.abs(this.endY - this.startY);

      this.selectionBox.style.left = left + "px";
      this.selectionBox.style.top = top + "px";
      this.selectionBox.style.width = width + "px";
      this.selectionBox.style.height = height + "px";

      this.selectionInfo.textContent = `Selection: ${width} x ${height}px`;
    }

    onMouseUp(e) {
      if (
        !this.isDragging ||
        !this.selectionBox ||
        this.selectionBox.style.display === "none"
      )
        return;

      e.preventDefault();
      this.isDragging = false;

      const width = Math.abs(this.endX - this.startX);
      const height = Math.abs(this.endY - this.startY);

      if (width > 10 && height > 10) {
        // Immediately start AI processing
        this.captureArea();
      } else {
        // If selection is too small, reset
        this.selectionBox.style.display = "none";
        this.selectionInfo.textContent = "Click and drag to select an area";
      }
    }

    onKeyDown(e) {
      if (e.key === "Escape") {
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
        scrollY: window.scrollY,
      };

      // Hide overlay temporarily
      this.overlay.style.display = "none";
      this.selectionBox.style.display = "none";
      this.selectionInfo.style.display = "none";
      this.selectionControls.style.display = "none";

      // Show loading animation
      this.showLoadingAnimation();

      try {
        // Send message to background script to capture screenshot
        const response = await chrome.runtime.sendMessage({
          action: "captureArea",
          selection: selectionData,
        });

        // Hide loading animation
        this.hideLoadingAnimation();

        if (response.success) {
          // Display extracted text
          if (response.extractedText) {
            this.showTextResult(response.extractedText);
          } else if (response.textExtractionError) {
            this.showTextResult(
              `Error extracting text: ${response.textExtractionError}`
            );
          } else {
            this.showTextResult(
              "Text extraction completed but no text found in image."
            );
          }
        } else {
          throw new Error(response.error || "Failed to capture screenshot");
        }
      } catch (error) {
        this.hideLoadingAnimation();
        console.error("Error capturing area:", error);
        this.showTextResult(`Error: ${error.message}`);
      }

      this.cancelSelection();
    }

    showLoadingAnimation() {
      // Create loading modal
      this.loadingModal = document.createElement("div");
      this.loadingModal.className = "ai-loading-modal";
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

      const loadingContent = document.createElement("div");
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
      const brainContainer = document.createElement("div");
      brainContainer.style.cssText = `
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      position: relative;
    `;

      const brain = document.createElement("div");
      brain.innerHTML = "🧠";
      brain.style.cssText = `
      font-size: 60px;
      animation: pulse 2s ease-in-out infinite;
      filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
    `;

      // Neural network dots
      for (let i = 0; i < 6; i++) {
        const dot = document.createElement("div");
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

      const title = document.createElement("h3");
      title.textContent = "AI Processing";
      title.style.cssText = `
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    `;

      const subtitle = document.createElement("p");
      subtitle.textContent = "Extracting text with Gemini 2.0 Flash...";
      subtitle.style.cssText = `
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
      animation: fadeInOut 2s ease-in-out infinite;
    `;

      // Progress bar
      const progressContainer = document.createElement("div");
      progressContainer.style.cssText = `
      width: 200px;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      margin: 20px auto 0;
      overflow: hidden;
    `;

      const progressBar = document.createElement("div");
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
      const style = document.createElement("style");
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
      // Create simple rectangular result container in bottom-right corner
      const resultContainer = document.createElement("div");
      resultContainer.className = "text-result-container";
      resultContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      max-height: 400px;
      background: white;
      border: 2px solid #e1e5e9;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideInFromRight 0.3s ease-out;
      overflow: hidden;
    `;

      // Header with icon and title
      const header = document.createElement("div");
      header.style.cssText = `
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;

      const headerLeft = document.createElement("div");
      headerLeft.style.cssText = `
      display: flex;
      align-items: center;
    `;

      const icon = document.createElement("div");
      icon.innerHTML = "🤖";
      icon.style.cssText = `
      font-size: 20px;
      margin-right: 8px;
    `;

      const title = document.createElement("div");
      title.textContent = "AI Extracted Text";
      title.style.cssText = `
      font-size: 14px;
      font-weight: 600;
    `;

      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "×";
      closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    `;

      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      });

      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'none';
      });

      headerLeft.appendChild(icon);
      headerLeft.appendChild(title);
      header.appendChild(headerLeft);
      header.appendChild(closeBtn);

      // Text preview area (read-only, image-like)
      const textPreview = document.createElement("div");
      textPreview.textContent = extractedText;
      textPreview.style.cssText = `
      padding: 16px;
      max-height: 200px;
      overflow-y: auto;
      font-size: 13px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      line-height: 1.4;
      color: #333;
      background: #f8f9fa;
      border-bottom: 1px solid #e1e5e9;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;

      // Copy button
      const copyButton = document.createElement("button");
      copyButton.innerHTML = "📋 Copy Text";
      copyButton.style.cssText = `
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

      copyButton.addEventListener("mouseenter", () => {
        copyButton.style.background = "linear-gradient(135deg, #0056b3, #004085)";
      });

      copyButton.addEventListener("mouseleave", () => {
        copyButton.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
      });

      // Event listeners
      copyButton.onclick = async () => {
        try {
          await navigator.clipboard.writeText(extractedText);
          copyButton.innerHTML = "✅ Copied!";
          copyButton.style.background = "linear-gradient(135deg, #28a745, #1e7e34)";
          setTimeout(() => {
            copyButton.innerHTML = "📋 Copy Text";
            copyButton.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
          }, 2000);
        } catch (error) {
          console.error("Failed to copy text:", error);
          copyButton.innerHTML = "❌ Failed";
          copyButton.style.background = "#dc3545";
          setTimeout(() => {
            copyButton.innerHTML = "📋 Copy Text";
            copyButton.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
          }, 2000);
        }
      };

      closeBtn.onclick = () => {
        resultContainer.style.animation = "slideOutToRight 0.2s ease-in";
        setTimeout(() => resultContainer.remove(), 200);
      };

      // Assemble result container
      resultContainer.appendChild(header);
      resultContainer.appendChild(textPreview);
      resultContainer.appendChild(copyButton);

      // Add animations
      const resultStyle = document.createElement("style");
      resultStyle.textContent = `
      @keyframes slideInFromRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutToRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
      document.head.appendChild(resultStyle);

      document.body.appendChild(resultContainer);

      // Auto-hide after configured delay
      const autoHideDelay = window.CONFIG?.EXTENSION_SETTINGS?.AUTO_HIDE_DELAY || 10000;
      const animationDuration = window.CONFIG?.UI_SETTINGS?.ANIMATION_DURATION || 200;
      
      setTimeout(() => {
        if (resultContainer.parentNode) {
          resultContainer.style.animation = `slideOutToRight ${animationDuration}ms ease-in`;
          setTimeout(() => resultContainer.remove(), animationDuration);
        }
      }, autoHideDelay);
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
if (typeof window.areaSelector === "undefined") {
  window.areaSelector = new window.AreaSelector();
}

// Listen for messages from popup
if (!window.areaScreenshotListenerAdded) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startAreaSelection") {
      window.areaSelector.startSelection();
      sendResponse({ success: true });
    }
  });
  window.areaScreenshotListenerAdded = true;
}
