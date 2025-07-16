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

    // Check if CSS is already injected
    const isCSSInjected = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return (
          document.querySelector('link[href*="overlay.css"]') !== null ||
          Array.from(document.styleSheets).some(
            (sheet) => sheet.href && sheet.href.includes("overlay.css")
          )
        );
      },
    });

    // Only inject CSS if it hasn't been injected yet
    if (!isCSSInjected[0].result) {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["overlay.css"],
      });
    }

    // Check if scripts are already injected to prevent duplicate declarations
    const isInjected = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return (
          typeof window.areaSelector !== "undefined" &&
          typeof window.ENV !== "undefined" &&
          typeof window.CONFIG !== "undefined"
        );
      },
    });

    // Only inject scripts if they haven't been injected yet
    if (!isInjected[0].result) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["env.js", "config.js", "content.js"],
      });
    }

    // Send message to start area selection
    await chrome.tabs.sendMessage(tab.id, { action: "startAreaSelection" });

    // Close popup immediately
    window.close();
  } catch (error) {
    console.error("Error starting area selection:", error);
    document.querySelector(".status").innerHTML = "❌ Error starting selection";
  }
});
