// Injects a small quick-actions window when a contract address is copied on any site.

;(function () {
  const ETHEREUM_REGEX = /^0x[a-fA-F0-9]{40}$/
  const SOLANA_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

  document.addEventListener("copy", () => {
    const sel = window.getSelection
      ? window.getSelection().toString().trim()
      : ""
    
    if (sel) {
      // Check for Ethereum-style contract addresses
      if (ETHEREUM_REGEX.test(sel) && typeof window.injectQuickActionsWindow === "function") {
        window.injectQuickActionsWindow(sel)
      }
      // Check for Solana-style addresses
      else if (SOLANA_REGEX.test(sel) && typeof window.injectQuickActionsWindow === "function") {
        window.injectQuickActionsWindow(sel)
      }
    }
  })
})()
