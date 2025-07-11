// Utility functions for Zerion Quick Buy Extension

/**
 * Parse token info from URL and DOM
 * @returns {Object} { network, contract, name, symbol }
 */
export function parseInfo() {
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

  // Interface Social support
  if (host === "app.interface.social") {
    const match = location.pathname.match(
      /^\/token\/(\d+)\/(0x[a-fA-F0-9]{40,})/
    )
    if (match) {
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

    const title = document.title
    const titleMatch = title.match(/^(\S+) \(([^)]+)\)/)
    if (titleMatch) {
      ticker = titleMatch[1]
      name = titleMatch[2]
    }
  }

  // Fallbacks
  if (!name) {
    const span = document.querySelector("main h1 span, main h2 span")
    if (span?.textContent) name = span.textContent.trim()
  }
  if (!name) {
    const h = document.querySelector("main h1, main h2")
    if (h?.textContent) name = h.textContent.trim().split(/[ 0-9\s·]/)[0]
  }
  if (!ticker) {
    const h2 = document.querySelector("main h2")
    if (h2) {
      const spans = Array.from(h2.querySelectorAll("span"))
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
export function isValidContract({ network, contract }) {
  const HOSTED_NETWORKS = ["solana", "base", "ethereum"]

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

/**
 * Safe DOM element creation with text content
 * @param {string} tagName
 * @param {string} textContent
 * @param {Object} styles
 * @returns {HTMLElement}
 */
export function createSafeElement(tagName, textContent = "", styles = {}) {
  const element = document.createElement(tagName)
  element.textContent = textContent
  Object.assign(element.style, styles)
  return element
}

/**
 * Debounce function for performance optimization
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance optimization
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle
  return function () {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
