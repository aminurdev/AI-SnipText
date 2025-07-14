document.addEventListener("DOMContentLoaded", async function () {
  // Automatically start area selection when popup opens
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (
      !tab ||
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      document.querySelector(".status").innerHTML =
        "❌ Cannot capture on this page";
      return;
    }

    // Inject content script and CSS
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["overlay.css"],
    });

    // Inject env.js, configuration and content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["env.js", "config.js", "content.js"],
    });

    // Send message to start area selection
    await chrome.tabs.sendMessage(tab.id, { action: "startAreaSelection" });

    // Close popup immediately
    window.close();
  } catch (error) {
    console.error("Error starting area selection:", error);
    document.querySelector(".status").innerHTML = "❌ Error starting selection";
  }
});
