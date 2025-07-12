// Injects a small quick-actions window when a contract address is copied on any site.

;(function () {
  const CONTRACT_REGEX = /^0x[a-fA-F0-9]{40}$/

  document.addEventListener("copy", () => {
    const sel = window.getSelection
      ? window.getSelection().toString().trim()
      : ""
    if (
      CONTRACT_REGEX.test(sel) &&
      typeof window.injectQuickActionsWindow === "function"
    ) {
      window.injectQuickActionsWindow(sel)
    }
  })
})()
