// Zerion Quick Buy Background Script (Refactored)
// Handles per-tab token info cache and message passing between content and popup

// Per-tab cache for token info
const tabTokenCache = {} // tabId -> token info

// Store last copied contract address for popup
let lastCopiedContract = null

// Listen for messages from content or popup scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    if (msg && msg.type === "contractCopied" && msg.contract) {
      lastCopiedContract = msg.contract
      chrome.action.openPopup()
      sendResponse({ ok: 1 })
      return true
    }
    // Store token info from content script, keyed by tabId
    if (
      msg &&
      typeof msg === "object" &&
      msg.contract &&
      typeof msg.contract === "string"
    ) {
      if (sender.tab && sender.tab.id !== undefined) {
        tabTokenCache[sender.tab.id] = msg
      }
      chrome.action.openPopup()
      sendResponse({ ok: 1 })
    } else if (msg === "getTokenInfo") {
      let info = null
      if (sender.tab && sender.tab.id !== undefined) {
        info = tabTokenCache[sender.tab.id] || null
        tabTokenCache[sender.tab.id] = null
      }
      sendResponse(info)
    } else {
      sendResponse({ error: "Invalid message format" })
    }
  } catch (e) {
    sendResponse({ error: "Internal error", details: e.message })
  }
  return true
})

// Provide contract address to popup on request
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "getLastCopiedContract") {
    sendResponse({ contract: lastCopiedContract })
    return true
  }
})

// Clean up cache when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabTokenCache[tabId]
})

// === Context Menu for Contract Addresses ===
const CONTRACT_REGEX = /^0x[a-fA-F0-9]{40}$/
const CHAIN = "ethereum" // You can make this dynamic if needed

// Create context menu on install or update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "zerion-root",
    title: "Zerion",
    contexts: ["selection"],
    visible: true,
  })
  chrome.contextMenus.create({
    id: "zerion-open",
    parentId: "zerion-root",
    title: "Open in Zerion Web",
    contexts: ["selection"],
  })
  chrome.contextMenus.create({
    id: "zerion-buy",
    parentId: "zerion-root",
    title: "Quick Buy",
    contexts: ["selection"],
  })
  chrome.contextMenus.create({
    id: "zerion-copy",
    parentId: "zerion-root",
    title: "Copy Contract Address",
    contexts: ["selection"],
  })
  chrome.contextMenus.create({
    id: "zerion-dexscreener",
    parentId: "zerion-root",
    title: "View on DexScreener",
    contexts: ["selection"],
  })
})

// Handle menu actions
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const contract = info.selectionText && info.selectionText.trim()
  if (!contract || !CONTRACT_REGEX.test(contract)) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "Zerion",
      message: "Please select a valid contract address (0x...)",
    })
    return
  }
  switch (info.menuItemId) {
    case "zerion-open": {
      const url = `https://app.zerion.io/search?q=${contract}`
      chrome.tabs.create({ url })
      break
    }
    case "zerion-buy": {
      // Open extension popup or trigger buy flow
      chrome.action.openPopup()
      // Optionally, send contract to popup
      break
    }
    case "zerion-copy": {
      // Copy to clipboard using content script (service workers cannot access navigator.clipboard)
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text) => navigator.clipboard.writeText(text),
        args: [contract],
      })
      break
    }
    case "zerion-dexscreener": {
      const url = `https://dexscreener.com/search?q=${contract}`
      chrome.tabs.create({ url })
      break
    }
  }
})
