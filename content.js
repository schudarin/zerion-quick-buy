// Zerion Quick Buy Banner Content Script
// Injects a banner on supported DexScreener token pages for quick Zerion swaps

// --- Grain Texture Injection ---
window.ensureNoiseTexture && window.ensureNoiseTexture()

// --- Context Menu Integration ---
window.addEventListener("message", (event) => {
  if (event?.data?.type === "SHOW_TOKEN_INFO_POPUP" && event.data.text) {
    console.log("[TokenInfo] Received SHOW_TOKEN_INFO_POPUP:", event.data.text)
    if (
      window.tokenInfoPopup &&
      typeof window.tokenInfoPopup.createPopup === "function"
    ) {
      window.tokenInfoPopup.createPopup(event.data.text)
    } else {
      console.warn("[TokenInfo] tokenInfoPopup not available")
    }
  }
  
  if (event?.data?.type === "SHOW_WALLET_INFO_POPUP" && event.data.text) {
    console.log("[WalletInfo] Received SHOW_WALLET_INFO_POPUP:", event.data.text)
    if (
      window.walletInfoPopup &&
      typeof window.walletInfoPopup.createPopup === "function"
    ) {
      window.walletInfoPopup.createPopup(event.data.text)
    } else {
      console.warn("[WalletInfo] walletInfoPopup not available")
    }
  }
})

// --- Constants ---
const BANNER_ID = "zerion-top-banner"
const HOSTED_NETWORKS = ["solana", "base", "ethereum"]
const SUPPORTED_HOSTS = ["dexscreener.com"]
const DELAY = 800 // ms after hydration
const WATCH = 500 // ms path check

// --- Utility Functions ---
const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector))

/**
 * Parse token info from URL and DOM
 * @returns {Object} { network, contract, name, symbol }
 */
function parseInfo() {
  let network = ""
  let contract = ""
  let name
  let ticker = ""
  const host = location.hostname.replace(/^www\./, "")
  if (host === "dexscreener.com") {
    const parts = location.pathname.split("/").filter(Boolean)
    network = parts[0]?.toLowerCase() || ""
    contract = parts[1] || ""
  }
  // --- Interface Social support ---
  if (host === "app.interface.social") {
    // URL: /token/{network}/{contract}
    const match = location.pathname.match(
      /^\/token\/(\d+)\/(0x[a-fA-F0-9]{40,})/
    )
    if (match) {
      // Map chainId to network name (add more as needed)
      const chainIdMap = {
        8453: "base",
        1: "ethereum",
        137: "polygon",
        10: "optimism",
        42161: "arbitrum",
        56: "bsc",
        43114: "avalanche",
        42220: "celo",
        250: "fantom",
        100: "gnosis",
        324: "zksync",
        1101: "polygon-zkevm",
        66: "okex",
        1284: "moonbeam",
        1285: "moonriver",
        2222: "kava",
        5000: "mantle",
        59144: "linea",
        7777777: "zora",
      }
      const chainId = match[1]
      network = chainIdMap[chainId] || chainId
      contract = match[2]
    }
    // Parse ticker and name from <title>: 'FLAY (Flayer) on Base'
    const title = document.title
    const titleMatch = title.match(/^(\S+) \(([^)]+)\)/)
    if (titleMatch) {
      ticker = titleMatch[1]
      name = titleMatch[2]
    }
  }
  // Fallbacks (generic logic)
  if (!name) {
    const span = $("main h1 span, main h2 span")
    if (span?.textContent) name = span.textContent.trim()
  }
  if (!name) {
    const h = $("main h1, main h2")
    if (h?.textContent) name = h.textContent.trim().split(/[ 0-9\s·]/)[0]
  }
  if (!ticker) {
    const h2 = $("main h2")
    if (h2) {
      const spans = $$("span", h2)
      if (spans.length > 1) {
        ticker = spans[1].textContent.trim().replace(/[^A-Za-z0-9$]/g, "")
      }
    }
  }
  // Fallback: try from title
  let usedTitle = false
  if (!ticker || ticker === "—" || !name || name === "Unknown") {
    const extractTickerAndName = () => {
      const title = document.title
      const regex = /^(\S+)\s.*?-\s(.+?)\s\//
      const match = title.match(regex)
      if (match) {
        return { ticker: match[1], name: match[2].trim() }
      }
      return null
    }
    const extracted = extractTickerAndName()
    if (extracted) {
      ticker = extracted.ticker
      name = extracted.name
      usedTitle = true
    }
  }
  if ((!name || name === "Unknown") && !usedTitle) {
    name = contract ? contract.slice(0, 6) + "…" : "Unknown"
  }
  if (!ticker) ticker = "—"
  return { network, contract, name, symbol: ticker }
}

/**
 * Validate network and contract address
 * @param {Object} param0
 * @returns {boolean}
 */
function isValidContract({ network, contract }) {
  if (!HOSTED_NETWORKS.includes(network)) return false
  if (!contract) return false
  if (network === "solana") {
    return /^[A-Za-z0-9]{32,44}$/.test(contract)
  }
  if (network === "base") {
    return (
      /^0x[a-fA-F0-9]{40}$/.test(contract) ||
      /^0x[a-fA-F0-9]{64}$/.test(contract)
    )
  }
  // Default EVM: 40 hex chars
  return /^0x[a-fA-F0-9]{40}$/.test(contract)
}
console.log("ZERION content.js loaded")
