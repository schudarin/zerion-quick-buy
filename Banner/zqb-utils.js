// Zerion Quick Buy Utilities
// Provides parseInfo() and isValidContract() helpers for token pages.

;(function (global) {
  const HOSTED_NETWORKS = ["solana", "base", "ethereum"]

  /**
   * Parse token info from current URL & DOM
   * @returns {{ network:string, contract:string, name:string, symbol:string }}
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
    let usedTitle = false
    if (!ticker || ticker === "—" || !name || name === "Unknown") {
      const title = document.title
      const m = title.match(/^(\S+)\s.*?-\s(.+?)\s\//)
      if (m) {
        ticker = m[1]
        name = m[2].trim()
        usedTitle = true
      }
    }
    if ((!name || name === "Unknown") && !usedTitle) {
      name = contract ? contract.slice(0, 6) + "…" : "Unknown"
    }
    if (!ticker) ticker = "—"
    return { network, contract, name, symbol: ticker }
  }

  function isValidContract({ network, contract }) {
    if (!HOSTED_NETWORKS.includes(network)) return false
    if (!contract) return false
    if (network === "solana") return /^[A-Za-z0-9]{32,44}$/.test(contract)
    if (network === "base")
      return (
        /^0x[a-fA-F0-9]{40}$/.test(contract) ||
        /^0x[a-fA-F0-9]{64}$/.test(contract)
      )
    return /^0x[a-fA-F0-9]{40}$/.test(contract)
  }

  global.parseInfo = parseInfo
  global.isValidContract = isValidContract

  window.ensureNoiseTexture = function ensureNoiseTexture() {
    if (document.documentElement.style.getPropertyValue("--zqb-noise-texture"))
      return
    const size = 128
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = size
    const ctx = canvas.getContext("2d")
    const img = ctx.createImageData(size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 60
    }
    ctx.putImageData(img, 0, 0)
    const dataURL = canvas.toDataURL("image/png")
    document.documentElement.style.setProperty(
      "--zqb-noise-texture",
      `url(${dataURL})`
    )
  }
})(typeof window !== "undefined" ? window : this)
