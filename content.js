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
      this.overlay.classList.add("selecting");
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
        this.overlay.classList.remove("selecting");
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

      // Hide overlay temporarily - use both display and visibility for complete hiding
      this.overlay.style.display = "none";
      this.overlay.style.visibility = "hidden";
      this.selectionBox.style.display = "none";
      this.selectionBox.style.visibility = "hidden";
      this.selectionInfo.style.display = "none";
      this.selectionInfo.style.visibility = "hidden";
      this.selectionControls.style.display = "none";
      this.selectionControls.style.visibility = "hidden";

      // Show loading animation
      this.showLoadingAnimation();

      // Wait a brief moment to ensure overlay is completely hidden before capture
      await new Promise(resolve => setTimeout(resolve, 50));

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
      // Create simple loading spinner in bottom right corner
      this.loadingModal = document.createElement("div");
      this.loadingModal.className = "ai-loading-spinner";
      this.loadingModal.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      animation: spinnerPulse 2s ease-in-out infinite;
    `;

      // Spinner icon
      const spinner = document.createElement("div");
      spinner.innerHTML = "🤖";
      spinner.style.cssText = `
      font-size: 24px;
      animation: spinnerRotate 1s linear infinite;
    `;

      this.loadingModal.appendChild(spinner);

      // Add CSS animations
      const style = document.createElement("style");
      style.textContent = `
      @keyframes spinnerRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes spinnerPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
        50% { transform: scale(1.1); box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6); }
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
      // Create dark-themed code block result container in bottom-right corner
      const resultContainer = document.createElement("div");
      resultContainer.className = "text-result-container";
      resultContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 450px;
      max-height: 400px;
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 10001;
      font-family: 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', monospace;
      animation: growFromSpinner 0.3s ease-out;
      transform-origin: bottom right;
      overflow: hidden;
    `;

      // Header with close button in top right
      const header = document.createElement("div");
      header.style.cssText = `
      padding: 12px 16px;
      background: #2d2d2d;
      color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #333;
    `;

      const headerLeft = document.createElement("div");
      headerLeft.style.cssText = `
      display: flex;
      align-items: center;
    `;

      const icon = document.createElement("div");
      icon.innerHTML = "🤖";
      icon.style.cssText = `
      font-size: 16px;
      margin-right: 8px;
    `;

      const title = document.createElement("div");
      title.textContent = "AI Extracted Text";
      title.style.cssText = `
      font-size: 13px;
      font-weight: 500;
      color: #e0e0e0;
    `;

      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "×";
      closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: #888;
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;

      closeBtn.addEventListener("mouseenter", () => {
        closeBtn.style.background = "#444";
        closeBtn.style.color = "#fff";
      });

      closeBtn.addEventListener("mouseleave", () => {
        closeBtn.style.background = "none";
        closeBtn.style.color = "#888";
      });

      headerLeft.appendChild(icon);
      headerLeft.appendChild(title);
      header.appendChild(headerLeft);

      // Code block container with relative positioning for copy button
      const codeContainer = document.createElement("div");
      codeContainer.style.cssText = `
      position: relative;
      background: #1e1e1e;
      border-bottom: 1px solid #333;
    `;

      // Text preview area styled like a code block
      const textPreview = document.createElement("pre");
      textPreview.textContent = extractedText;
      textPreview.style.cssText = `
      padding: 16px 16px 50px 16px;
      margin: 0;
      max-height: 300px;
      overflow-y: auto;
      font-size: 12px;
      font-family: 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', monospace;
      line-height: 1.5;
      color: #e0e0e0;
      background: #1e1e1e;
      white-space: pre-wrap;
      word-wrap: break-word;
      border: none;
    `;

      // Copy button positioned in bottom right of code area
      const copyButton = document.createElement("button");
      copyButton.innerHTML = "📋";
      copyButton.style.cssText = `
      position: absolute;
      bottom: 8px;
      right: 8px;
      padding: 8px;
      background: #333;
      color: #e0e0e0;
      border: 1px solid #555;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

      copyButton.addEventListener("mouseenter", () => {
        copyButton.style.background = "#444";
        copyButton.style.borderColor = "#666";
      });

      copyButton.addEventListener("mouseleave", () => {
        copyButton.style.background = "#333";
        copyButton.style.borderColor = "#555";
      });

      // Event listeners
      copyButton.onclick = async () => {
        try {
          await navigator.clipboard.writeText(extractedText);
          copyButton.innerHTML = "✅";
          copyButton.style.background = "#28a745";
          copyButton.style.borderColor = "#28a745";
          setTimeout(() => {
            copyButton.innerHTML = "📋";
            copyButton.style.background = "#333";
            copyButton.style.borderColor = "#555";
          }, 2000);
        } catch (error) {
          console.error("Failed to copy text:", error);
          copyButton.innerHTML = "❌";
          copyButton.style.background = "#dc3545";
          copyButton.style.borderColor = "#dc3545";
          setTimeout(() => {
            copyButton.innerHTML = "📋";
            copyButton.style.background = "#333";
            copyButton.style.borderColor = "#555";
          }, 2000);
        }
      };

      closeBtn.onclick = () => {
        resultContainer.style.animation = "shrinkToSpinner 0.3s ease-in";
        setTimeout(() => resultContainer.remove(), 300);
      };

      // Assemble components
      codeContainer.appendChild(textPreview);
      codeContainer.appendChild(copyButton);

      resultContainer.appendChild(closeBtn);
      resultContainer.appendChild(header);
      resultContainer.appendChild(codeContainer);

      // Add animations
      const resultStyle = document.createElement("style");
      resultStyle.textContent = `
      @keyframes growFromSpinner {
        from { 
          transform: scale(0) translate(50px, 50px); 
          opacity: 0; 
        }
        to { 
          transform: scale(1) translate(0, 0); 
          opacity: 1; 
        }
      }
      @keyframes shrinkToSpinner {
        from { 
          transform: scale(1) translate(0, 0); 
          opacity: 1; 
        }
        to { 
          transform: scale(0) translate(50px, 50px); 
          opacity: 0; 
        }
      }
    `;
      document.head.appendChild(resultStyle);

      document.body.appendChild(resultContainer);
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
