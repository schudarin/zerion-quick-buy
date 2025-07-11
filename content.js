// Zerion Quick Buy Banner Content Script
// Injects a banner on supported DexScreener token pages for quick Zerion swaps

// --- Grain Texture Injection ---
;(function generateZerionBannerGrain() {
  const size = 128
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 180 // increased alpha for more visible grain
  }
  ctx.putImageData(img, 0, 0)
  const dataURL = canvas.toDataURL("image/png")
  document.documentElement.style.setProperty(
    "--zqb-noise-texture",
    `url(${dataURL})`
  )
})()

// --- Constants ---
const BANNER_ID = "zerion-top-banner"
const HOSTED_NETWORKS = ["solana", "base", "ethereum"]
const SUPPORTED_HOSTS = ["dexscreener.com", "gmgn.ai"]
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

/**
 * Inject Zerion banner CSS file into the page (only once)
 */
function injectBannerCSS() {
  if ($("#zerion-banner-css")) return
  const link = document.createElement("link")
  link.id = "zerion-banner-css"
  link.rel = "stylesheet"
  link.type = "text/css"
  link.href = chrome.runtime.getURL("zerion-banner.css")
  document.head.appendChild(link)
}

// Main function to build and inject the Zerion banner
function buildBanner(info) {
  injectBannerCSS()
  window.__ZQB_metaCache = window.__ZQB_metaCache || {}

  // Create banner div and set ARIA attributes
  const div = document.createElement("div")
  div.id = BANNER_ID
  div.className = `zqb-banner zqb-options-enabled ${info.network.toLowerCase()}`
  div.setAttribute("role", "region")
  div.setAttribute("aria-label", "Zerion Quick Buy Banner")
  // Set --zerion-network-color variable and data attribute for CSS reference
  const networkColors = {
    solana: "#6c2eb7",
    base: "#2063ff",
    ethereum: "#2063ff",
  }
  const color = networkColors[info.network.toLowerCase()] || "#2063ff"
  div.style.setProperty("--zerion-network-color", color)
  div.setAttribute("data-network-color", color)
  try {
    localStorage.setItem("zqb_banner_network_color", color)
  } catch (e) {}
  // Responsive styles
  div.style.maxWidth = "95vw"
  div.style.minWidth = "220px"
  div.style.flexWrap = "wrap"
  div.style.wordBreak = "break-word"
  // Capitalize network
  let network = info.network
    ? info.network.charAt(0).toUpperCase() + info.network.slice(1)
    : ""
  // Build info line: name, ticker, network, contract link, copy button
  const infoLine = document.createElement("span")
  infoLine.className = "zqb-info-line"
  // Name and ticker
  const nameSpan = document.createElement("span")
  nameSpan.className = "zqb-name"
  let nameAndTicker = ""
  if (info.name && info.symbol && info.symbol !== "—") {
    nameAndTicker = `${info.name} (${info.symbol})`
  } else if (info.name) {
    nameAndTicker = info.name
  } else if (info.symbol && info.symbol !== "—") {
    nameAndTicker = info.symbol
  }
  nameSpan.textContent = nameAndTicker
  infoLine.appendChild(nameSpan)
  // Dot between name and network
  const dot1 = document.createElement("span")
  dot1.className = "zqb-dot"
  dot1.textContent = "·"
  infoLine.appendChild(dot1)
  // Network
  const networkSpan = document.createElement("span")
  networkSpan.className = "zqb-network"
  networkSpan.textContent = network
  infoLine.appendChild(networkSpan)
  // Dot between network and contract
  const dot2 = document.createElement("span")
  dot2.className = "zqb-dot"
  dot2.textContent = "·"
  infoLine.appendChild(dot2)
  // Contract link
  const zerionLink = document.createElement("a")
  zerionLink.className = "zqb-link"
  zerionLink.href = `https://app.zerion.io/${info.network}/asset/${info.contract}`
  zerionLink.target = "_blank"
  zerionLink.rel = "noopener noreferrer"
  zerionLink.textContent = `${info.contract.slice(
    0,
    6
  )}...${info.contract.slice(-4)}`
  zerionLink.title = "Open in Zerion Web"
  // Arrow (not part of link)
  const arrow = document.createElement("span")
  arrow.className = "zqb-contract-arrow"
  arrow.textContent = "\u2197"
  // Copy button (immediately after contract/arrow)
  const copyBtn = document.createElement("button")
  copyBtn.className = "zqb-copy-btn"
  copyBtn.textContent = "Copy"
  copyBtn.title = "Copy contract address"
  copyBtn.setAttribute("aria-label", "Copy contract address")
  copyBtn.onclick = () => {
    navigator.clipboard
      .writeText(info.contract)
      .then(() => {
        copyBtn.textContent = "Copied!"
        copyBtn.classList.remove("copy-failed")
        optionsEnabled = false
        setTimeout(() => {
          copyBtn.textContent = "Copy"
          optionsEnabled = true
        }, 1200)
      })
      .catch(() => {
        copyBtn.textContent = "Copy failed"
        copyBtn.classList.add("copy-failed")
        optionsEnabled = false
        setTimeout(() => {
          copyBtn.textContent = "Copy"
          copyBtn.classList.remove("copy-failed")
          optionsEnabled = true
        }, 1500)
      })
  }
  // Contract link
  const contractSpan = document.createElement("span")
  contractSpan.className = "zqb-contract"
  contractSpan.appendChild(zerionLink)
  // Arrow (not part of link)
  contractSpan.appendChild(arrow)
  infoLine.appendChild(contractSpan)
  // Copy button (immediately after contract/arrow)
  infoLine.appendChild(copyBtn)
  // Quick Buy button
  const btn = document.createElement("button")
  btn.className = "zqb-buy-btn"
  btn.style.display = "flex"
  btn.style.alignItems = "center"
  // Add improved inline SVG icon to the left of the button text
  const buyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  buyIcon.setAttribute("width", "20")
  buyIcon.setAttribute("height", "20")
  buyIcon.setAttribute("viewBox", "0 0 20 20")
  buyIcon.setAttribute("fill", "currentColor")
  buyIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  buyIcon.classList.add("zqb-buy-btn-icon")
  buyIcon.innerHTML = `
    <path fill-rule="evenodd" clip-rule="evenodd" d="M5 20C2.23858 20 8.74228e-07 17.7614 8.74228e-07 15L0 4.99999C1.93283e-06 2.23857 2.23858 -6.11091e-06 5 -6.75517e-06L15 -7.62939e-06C17.7614 -7.62939e-06 20 2.23857 20 4.99999V15C20 17.7614 17.7614 20 15 20H5ZM11.4111 9.92248C11.884 10.1747 12.5435 10.0749 12.8674 9.62829C13.596 8.62694 14.4724 7.28567 15.2521 5.95702C15.4827 5.5638 15.2038 5.00011 14.6606 4.99999C12.493 4.99999 7.52854 5.00121 5.31555 5.00121C4.6359 5.00127 4.40403 5.86275 4.98596 6.22192C6.86926 7.38121 9.51985 8.91431 11.4111 9.92248ZM14.3073 15C14.9459 14.9999 15.214 14.1918 14.6857 13.811C12.8944 12.6938 10.5144 11.3231 8.55835 10.2661C8.08326 10.0104 7.44797 10.1059 7.05811 10.6616C6.3319 11.6969 5.46252 13.0028 4.86694 14.0314C4.61916 14.4485 4.94991 15 5.44434 15L14.3073 15Z"/>
  `
  // Set SVG path fill to current network color directly from 'color' variable
  const zqbPath = buyIcon.querySelector("path")
  if (zqbPath) zqbPath.setAttribute("fill", color)
  btn.appendChild(buyIcon)
  btn.appendChild(document.createTextNode("Quick Buy"))
  btn.setAttribute("aria-label", "Quick Buy")
  btn.addEventListener("click", () => {
    try {
      chrome.runtime.sendMessage(info)
    } catch (e) {
      console.debug("[ZQB] Could not send message to background:", e)
    }
  })
  // --- Event listener cleanup logic ---
  // Keyboard shortcut: Alt+B (Option+B) for accessibility
  function onKeydown(e) {
    if (
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA")
    ) {
      return
    }
    if ((e.altKey || e.metaKey) && e.key.toLowerCase() === "b") {
      if (document.getElementById(BANNER_ID)) {
        btn.focus()
        btn.click()
        e.preventDefault()
      }
    }
  }
  document.addEventListener("keydown", onKeydown)
  // MutationObserver to clean up when banner is removed
  const observer = new MutationObserver(() => {
    if (!document.body.contains(div)) {
      observer.disconnect()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  // Options state variables for moving the banner
  let isOptionsMoving = false,
    optionsOffsetX = 0,
    optionsOffsetY = 0
  // Track event handlers for moving the banner
  let optionsEnabled = true

  // Options icon (static 3-dots button)
  const optionsIconBg = document.createElement("span")
  optionsIconBg.className = "zqb-options-icon-bg"
  optionsIconBg.style.cursor = "pointer"
  optionsIconBg.style.position = "static"
  // All other appearance styles are now handled by CSS only

  // 3-dots SVG icon
  const optionsIcon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  )
  optionsIcon.setAttribute("width", "20")
  optionsIcon.setAttribute("height", "20")
  optionsIcon.setAttribute("viewBox", "0 0 20 20")
  optionsIcon.setAttribute("fill", "none")
  optionsIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  optionsIcon.classList.add("zqb-options-icon-img")
  optionsIcon.innerHTML = `
    <circle cx="4" cy="10" r="2" />
    <circle cx="10" cy="10" r="2" />
    <circle cx="16" cy="10" r="2" />
  `
  optionsIconBg.appendChild(optionsIcon)

  // --- Quick Buy + Options (3-dots) container ---
  const actionsContainer = document.createElement("div")
  actionsContainer.style.display = "flex"
  actionsContainer.style.alignItems = "center"
  actionsContainer.appendChild(btn)
  actionsContainer.appendChild(optionsIconBg)

  // When appending to the banner, place actionsContainer instead of btn and optionsIconBg
  div.appendChild(infoLine)
  div.appendChild(actionsContainer)

  // Prevent move when clicking Quick Buy or Options or Copy
  btn.addEventListener("mousedown", (e) => e.stopPropagation())
  optionsIconBg.addEventListener("mousedown", (e) => e.stopPropagation())
  copyBtn.addEventListener("mousedown", (e) => e.stopPropagation())

  // Move logic on the banner itself
  div.addEventListener("mousedown", function (e) {
    // Only left mouse button, and not on the icon or Quick Buy
    if (!optionsEnabled || e.button !== 0) return
    if (
      e.target === optionsIcon ||
      optionsIconBg.contains(e.target) ||
      btn.contains(e.target)
    )
      return
    isOptionsMoving = true
    // Calculate offset from mouse to top-left of banner
    const rect = div.getBoundingClientRect()
    optionsOffsetX = e.clientX - rect.left
    optionsOffsetY = e.clientY - rect.top
    // Bring to front while moving
    div.style.zIndex = 10000
    document.body.style.userSelect = "none"
    // Add dashed border
    div.classList.add("zqb-options-active")
    e.stopPropagation()
    e.preventDefault()
  })

  function onMouseMove(e) {
    if (!isOptionsMoving || !optionsEnabled) return
    const left = `${e.clientX - optionsOffsetX}px`
    const top = `${e.clientY - optionsOffsetY}px`
    div.style.left = left
    div.style.top = top
    div.style.right = "auto"
    div.style.bottom = "auto"
    div.style.transform = "none"
    div.style.position = "fixed"
  }
  function onMouseUp(e) {
    if (isOptionsMoving) {
      isOptionsMoving = false
      document.body.style.userSelect = ""
      div.classList.remove("zqb-options-active")
      try {
        localStorage.setItem("zqb_banner_left", div.style.left)
        localStorage.setItem("zqb_banner_top", div.style.top)
      } catch (e) {
        console.warn("[ZQB] Could not save banner position:", e)
      }
    }
  }
  document.addEventListener("mousemove", onMouseMove)
  document.addEventListener("mouseup", onMouseUp)
  // Responsive: adjust layout on small screens
  function applyResponsive() {
    if (window.innerWidth < 500) {
      div.classList.add("responsive")
    } else {
      div.classList.remove("responsive")
    }
  }
  applyResponsive()
  window.addEventListener("resize", applyResponsive)
  // Restore position from localStorage if present
  let savedLeft, savedTop
  try {
    savedLeft = localStorage.getItem("zqb_banner_left")
    savedTop = localStorage.getItem("zqb_banner_top")
  } catch (e) {
    console.warn("[ZQB] Could not access localStorage:", e)
  }
  if (savedLeft && savedTop) {
    div.style.left = savedLeft
    div.style.top = savedTop
    div.style.right = "auto"
    div.style.bottom = "auto"
    div.style.transform = "none"
    div.style.position = "fixed"
  }
  // Remove reset button, add double-click to reset position and width on banner
  div.addEventListener("dblclick", function () {
    try {
      localStorage.removeItem("zqb_banner_left")
      localStorage.removeItem("zqb_banner_top")
      localStorage.removeItem("zqb_banner_width")
    } catch (e) {
      console.warn("[ZQB] Could not reset banner position:", e)
    }
    div.style.left = "50%"
    div.style.top = ""
    div.style.right = ""
    div.style.bottom = "24px"
    div.style.transform = "translateX(-50%)"
    div.style.position = "fixed"
    div.style.width = ""
  })
  // --- Add horizontal resize handles ---
  const leftHandle = document.createElement("div")
  leftHandle.className = "zqb-resize-handle zqb-resize-handle-left"
  const rightHandle = document.createElement("div")
  rightHandle.className = "zqb-resize-handle zqb-resize-handle-right"
  div.appendChild(leftHandle)
  div.appendChild(rightHandle)

  // Add dropdown menu button and logic
  addMenuButtonToBanner(div, !!(savedLeft && savedTop))

  // Double-click on resize handles resets only width (and left if left handle)
  leftHandle.addEventListener("dblclick", function (e) {
    e.stopPropagation()
    e.preventDefault()
    try {
      localStorage.removeItem("zqb_banner_width")
    } catch (e) {}
    // Reset width and left so right edge stays fixed
    if (div.style.width) {
      const rect = div.getBoundingClientRect()
      const width = div.offsetWidth
      // Remove width to get default width
      div.style.width = ""
      const newWidth = div.offsetWidth
      // Adjust left so right edge stays fixed
      const delta = width - newWidth
      div.style.left = rect.left + delta + "px"
      div.style.right = "auto"
      div.style.transform = "none"
      div.style.position = "fixed"
    } else {
      div.style.width = ""
    }
  })
  rightHandle.addEventListener("dblclick", function (e) {
    e.stopPropagation()
    e.preventDefault()
    try {
      localStorage.removeItem("zqb_banner_width")
    } catch (e) {}
    // Reset width only, left edge stays fixed
    div.style.width = ""
  })

  let resizing = false
  let resizeStartX = 0
  let startWidth = 0
  let startLeft = 0
  let resizeDirection = null

  function onResizeMouseDown(e, direction) {
    e.stopPropagation()
    e.preventDefault()
    resizing = true
    resizeStartX = e.clientX
    startWidth = div.offsetWidth
    startLeft = div.getBoundingClientRect().left
    resizeDirection = direction
    document.body.style.userSelect = "none"
    div.classList.add("zqb-resizing")
  }
  leftHandle.addEventListener("mousedown", (e) => onResizeMouseDown(e, "left"))
  rightHandle.addEventListener("mousedown", (e) =>
    onResizeMouseDown(e, "right")
  )

  function onResizeMouseMove(e) {
    if (!resizing) return
    let newWidth
    if (resizeDirection === "right") {
      newWidth = startWidth + (e.clientX - resizeStartX)
      div.style.width = newWidth + "px"
    } else if (resizeDirection === "left") {
      newWidth = startWidth - (e.clientX - resizeStartX)
      let newLeft = startLeft + (e.clientX - resizeStartX)
      // Convert newLeft to px relative to viewport, then to % of window for left style
      div.style.width = newWidth + "px"
      div.style.left = newLeft + "px"
      div.style.right = "auto"
      div.style.transform = "none"
      div.style.position = "fixed"
    }
  }
  function onResizeMouseUp() {
    if (resizing) {
      resizing = false
      document.body.style.userSelect = ""
      div.classList.remove("zqb-resizing")
      // Save width
      try {
        localStorage.setItem("zqb_banner_width", div.style.width)
      } catch (e) {}
    }
  }
  document.addEventListener("mousemove", onResizeMouseMove)
  document.addEventListener("mouseup", onResizeMouseUp)

  // Restore width from localStorage if present
  let savedWidth
  try {
    savedWidth = localStorage.getItem("zqb_banner_width")
  } catch (e) {}
  if (savedWidth) {
    div.style.width = savedWidth
  }
  return div
}

// Dropdown menu logic for Zerion Quick Buy Banner
function createDropdownMenu(canResetPosition = true) {
  const menu = document.createElement("div")
  menu.className = "zqb-dropdown-menu"

  const options = [
    { label: "Hide Panel", id: "hide" },
    { label: "Reset Position", id: "reset" },
    { label: "Feedback", id: "feedback" },
    { label: "About", id: "about" },
  ]

  options.forEach((opt) => {
    const item = document.createElement("div")
    item.className = "zqb-dropdown-item"
    item.textContent = opt.label
    if (opt.id === "hide") {
      item.addEventListener("click", (e) => {
        e.stopPropagation()
        menu.classList.remove("open")
        const banner = document.getElementById("zerion-top-banner")
        if (banner) {
          banner.style.display = "none"
          showFloatingRestoreButton()
        }
      })
    } else if (opt.id === "reset") {
      item.addEventListener("click", (e) => {
        e.stopPropagation()
        menu.classList.remove("open")
        localStorage.removeItem("zqb_banner_left")
        localStorage.removeItem("zqb_banner_top")
        localStorage.removeItem("zqb_banner_right")
        localStorage.removeItem("zqb_banner_bottom")
        localStorage.removeItem("zqb_banner_width")
        const banner = document.getElementById("zerion-top-banner")
        if (banner) {
          banner.style.left = "50%"
          banner.style.top = ""
          banner.style.right = ""
          banner.style.bottom = "24px"
          banner.style.transform = "translateX(-50%)"
          banner.style.position = "fixed"
          banner.style.width = ""
        }
        const menuBtn = banner?.querySelector(".zqb-options-icon-bg")
        if (menuBtn) {
          menuBtn.innerHTML =
            '<svg class="zqb-options-icon-img" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="10" r="2" fill="currentColor"/><circle cx="10" cy="10" r="2" fill="currentColor"/><circle cx="16" cy="10" r="2" fill="currentColor"/></svg>'
        }
      })
    } else if (opt.id === "about") {
      item.addEventListener("click", (e) => {
        e.stopPropagation()
        menu.classList.remove("open")
        showAboutModal()
      })
    } else {
      item.addEventListener("click", (e) => {
        e.stopPropagation()
        alert(opt.label + " clicked (placeholder)")
        menu.classList.remove("open")
      })
    }
    menu.appendChild(item)
  })
  return menu
}

function showAboutModal() {
  if (document.getElementById("zqb-about-modal")) return
  const modal = document.createElement("div")
  modal.id = "zqb-about-modal"
  modal.style.position = "fixed"
  modal.style.top = "50%"
  modal.style.left = "50%"
  modal.style.transform = "translate(-50%, -50%)"
  modal.style.background = "#fff"
  modal.style.color = "#222"
  modal.style.borderRadius = "14px"
  modal.style.boxShadow = "0 4px 32px rgba(0,0,0,0.18)"
  modal.style.padding = "28px 32px 20px 32px"
  modal.style.zIndex = 10050
  modal.style.minWidth = "320px"
  modal.style.maxWidth = "90vw"
  modal.style.fontSize = "16px"
  modal.style.textAlign = "center"
  modal.innerHTML = `
    <div style="font-size:22px;font-weight:700;margin-bottom:8px;">Zerion Quick Buy Banner</div>
    <div style="margin-bottom:8px;">Version: 1.0.0</div>
    <div style="margin-bottom:12px;">Author: Zerion Team</div>
    <div style="margin-bottom:18px;">A browser extension that injects a smart, draggable, and customizable quick-buy banner for tokens on supported networks. Features include contract copy, quick buy, drag, resize, hide, and more. <br/><br/>For feedback or issues, use the Feedback option in the menu.</div>
    <button id="zqb-about-close" style="margin-top:8px;padding:6px 18px;font-size:15px;border-radius:8px;border:none;background:#2063ff;color:#fff;cursor:pointer;">Close</button>
  `
  document.body.appendChild(modal)
  document.getElementById("zqb-about-close").onclick = function () {
    modal.remove()
  }
}

function addMenuButtonToBanner(banner, canResetPosition = true) {
  let menuBtn = banner.querySelector(".zqb-options-icon-bg")
  let isCustomMenuBtn = false
  if (!menuBtn) {
    menuBtn = document.createElement("div")
    menuBtn.className = "zqb-options-icon-bg"
    menuBtn.innerHTML =
      '<svg class="zqb-options-icon-img" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="10" r="2"/><circle cx="10" cy="10" r="2"/><circle cx="16" cy="10" r="2"/></svg>'
    banner.appendChild(menuBtn)
    isCustomMenuBtn = true
  }
  let dropdown = banner.querySelector(".zqb-dropdown-menu")
  if (!dropdown) {
    dropdown = createDropdownMenu(canResetPosition)
    banner.appendChild(dropdown)
  }
  // SVGs for icons
  const dotsSVG =
    '<svg class="zqb-options-icon-img" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="10" r="2" fill="currentColor"/><circle cx="10" cy="10" r="2" fill="currentColor"/><circle cx="16" cy="10" r="2" fill="currentColor"/></svg>'
  const crossSVG =
    '<svg class="zqb-options-icon-img" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="5" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="5" x2="5" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'

  menuBtn.onclick = (e) => {
    e.stopPropagation()
    const isOpen = dropdown.classList.toggle("open")
    menuBtn.innerHTML = isOpen ? crossSVG : dotsSVG
  }
  document.addEventListener("click", (e) => {
    if (!banner.contains(e.target)) {
      dropdown.classList.remove("open")
      menuBtn.innerHTML = dotsSVG
    }
  })
}

// Refresh the banner based on current page state
function refreshBanner() {
  const info = parseInfo()
  console.log("[ZQB] parseInfo:", info)
  let main = document.querySelector("main")
  if (!main) {
    console.warn("[ZQB] No <main> element found, setting up observer")
    // Watch for <main> to appear
    const observer = new MutationObserver(() => {
      main = document.querySelector("main")
      if (main) {
        observer.disconnect()
        refreshBanner() // Try again now that <main> exists
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return
  }
  const old = document.getElementById(BANNER_ID)
  const valid = isValidContract(info)
  console.log("[ZQB] isValidContract:", valid)
  if (!valid) {
    if (old) {
      old.remove()
    }
    console.debug("[ZQB] Not a valid contract/network, banner not shown")
    return
  }
  // No API, just use info from parseInfo
  console.log("[ZQB] final info for banner:", info)
  if (old) {
    old.classList.add("shimmer")
    setTimeout(() => {
      old.classList.remove("shimmer")
      old.remove()
      const bannerDiv = buildBanner(info)
      // Check collapsed state
      if (localStorage.getItem("zqb_banner_collapsed") === "1") {
        bannerDiv.style.display = "none"
        showFloatingRestoreButton()
      }
      main.prepend(bannerDiv)
    }, 1000)
  } else {
    const bannerDiv = buildBanner(info)
    if (localStorage.getItem("zqb_banner_collapsed") === "1") {
      bannerDiv.style.display = "none"
      showFloatingRestoreButton()
    }
    main.prepend(bannerDiv)
  }
}

// Schedule a banner refresh after a delay
function scheduleRefresh() {
  clearTimeout(window.__zqbTimer)
  window.__zqbTimer = setTimeout(refreshBanner, DELAY)
}

function injectQuickActionsWindow(contract) {
  // Remove any existing window
  const existing = document.getElementById("zerion-quick-actions")
  if (existing) existing.remove()

  // Create container
  const container = document.createElement("div")
  container.id = "zerion-quick-actions"
  container.style.position = "fixed"
  container.style.top = "24px"
  container.style.right = "24px"
  container.style.zIndex = "999999"
  container.style.background = "white"
  container.style.border = "1px solid #e0e0e0"
  container.style.borderRadius = "10px"
  container.style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)"
  container.style.padding = "14px 14px 10px 14px"
  container.style.width = "200px"
  container.style.fontFamily = "system-ui, sans-serif"
  container.style.color = "#222"
  container.style.display = "flex"
  container.style.flexDirection = "column"
  container.style.alignItems = "flex-start"
  container.style.textAlign = "left"
  container.style.opacity = "0"
  container.style.transform = "translateY(-10px)"
  container.style.transition = "opacity 0.35s, transform 0.35s"

  // Timer bar
  const timerBar = document.createElement("div")
  timerBar.style.height = "4px"
  timerBar.style.width = "100%"
  timerBar.style.background = "linear-gradient(90deg, #1da1f2, #6c47ff)"
  timerBar.style.borderRadius = "10px 10px 0 0"
  timerBar.style.margin = "-14px -14px 10px -14px"
  timerBar.style.transition = "width 0.2s linear"
  container.appendChild(timerBar)

  // Fade in after appending
  setTimeout(() => {
    container.style.opacity = "1"
    container.style.transform = "translateY(0)"
  }, 10)

  // Close button
  const closeBtn = document.createElement("button")
  closeBtn.innerText = "×"
  closeBtn.title = "Close"
  closeBtn.style.position = "absolute"
  closeBtn.style.top = "6px"
  closeBtn.style.right = "10px"
  closeBtn.style.background = "none"
  closeBtn.style.border = "none"
  closeBtn.style.fontSize = "20px"
  closeBtn.style.cursor = "pointer"
  closeBtn.style.color = "#888"
  closeBtn.addEventListener("click", () => fadeOutAndRemove(container))
  container.appendChild(closeBtn)

  // Title
  const title = document.createElement("div")
  title.innerHTML = `<b>Zerion Quick Actions</b>`
  title.style.marginBottom = "8px"
  title.style.textAlign = "left"
  container.appendChild(title)

  // Contract address
  const contractDiv = document.createElement("div")
  contractDiv.innerHTML = `<span style="font-family: monospace; font-size: 13px; display: inline-block; max-width: 100%; word-break: break-all; white-space: normal; vertical-align: bottom;">${contract}</span>`
  contractDiv.style.marginBottom = "14px"
  contractDiv.style.textAlign = "left"
  contractDiv.style.width = "100%"
  container.appendChild(contractDiv)

  // Buttons
  const btnStyle =
    "margin-bottom: 8px; width: 100%; padding: 8px 0; border-radius: 6px; border: none; background: #1da1f2; color: white; font-weight: 600; font-size: 13px; cursor: pointer; text-align: center;"

  const zerionBtn = document.createElement("button")
  zerionBtn.innerText = "Open in Zerion Web"
  zerionBtn.style = btnStyle
  zerionBtn.onclick = () =>
    window.open(`https://app.zerion.io/search?q=${contract}`, "_blank")
  container.appendChild(zerionBtn)

  const buyBtn = document.createElement("button")
  buyBtn.innerText = "Quick Buy"
  buyBtn.style = btnStyle
  buyBtn.onclick = () => {
    if (
      chrome &&
      chrome.runtime &&
      chrome.runtime.id &&
      chrome.action &&
      chrome.action.openPopup
    ) {
      chrome.action.openPopup()
    } else {
      // fallback: open the extension popup.html directly if possible
      window.open(chrome.runtime.getURL("popup.html"), "_blank")
    }
  }
  container.appendChild(buyBtn)

  const dexBtn = document.createElement("button")
  dexBtn.innerText = "View on DexScreener"
  dexBtn.style = btnStyle + "background: #6c47ff;"
  dexBtn.onclick = () =>
    window.open(`https://dexscreener.com/search?q=${contract}`, "_blank")
  container.appendChild(dexBtn)

  document.body.appendChild(container)

  // Auto-dismiss logic with visible timer
  let dismissTimer = null
  let remaining = 4000
  let lastStart = Date.now()
  let timerInterval = null
  function updateTimerBar() {
    const percent = Math.max(0, remaining / 4000)
    timerBar.style.width = percent * 100 + "%"
  }
  function startTimer() {
    lastStart = Date.now()
    dismissTimer = setTimeout(() => fadeOutAndRemove(container), remaining)
    timerInterval = setInterval(() => {
      remaining = Math.max(0, 4000 - (Date.now() - lastStart))
      updateTimerBar()
    }, 50)
  }
  function pauseTimer() {
    clearTimeout(dismissTimer)
    clearInterval(timerInterval)
    remaining -= Date.now() - lastStart
    updateTimerBar()
  }
  function resumeTimer() {
    startTimer()
  }
  container.addEventListener("mouseenter", pauseTimer)
  container.addEventListener("mouseleave", resumeTimer)
  updateTimerBar()
  startTimer()
}

function fadeOutAndRemove(el) {
  el.style.opacity = "0"
  el.style.transform = "translateY(-10px)"
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el)
  }, 350)
}

// Listen for copy events and inject quick actions window if contract address is copied
;(function listenForContractCopy() {
  document.addEventListener("copy", (event) => {
    let copiedText = ""
    if (window.getSelection) {
      copiedText = window.getSelection().toString()
    }
    copiedText = copiedText.trim()
    if (copiedText) {
    }
    if (/^0x[a-fA-F0-9]{40}$/.test(copiedText)) {
      injectQuickActionsWindow(copiedText)
    }
  })
})()

// Dexscreener-specific: Listen for clicks on the 'Copy token address' button
;(function listenForDexscreenerCopyButton() {
  document.body.addEventListener(
    "click",
    function (e) {
      // Look for SVG with title 'Copy token address'
      let target = e.target
      for (let i = 0; i < 3 && target; i++, target = target.parentElement) {
        if (target.tagName === "svg") {
          const titleEl = target.querySelector("title")
          if (titleEl && titleEl.textContent === "Copy token address") {
            // Extract contract address from URL
            const match = window.location.pathname.match(/0x[a-fA-F0-9]{40}/)
            if (match) {
              injectQuickActionsWindow(match[0])
            }
            break
          }
        }
      }
    },
    true
  )
})()

// --- Script entry point ---
// Wait for DOM ready, then schedule initial banner refresh
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleRefresh)
} else {
  scheduleRefresh()
}
let lastPath = location.pathname
setInterval(() => {
  if (location.pathname !== lastPath) {
    lastPath = location.pathname
    scheduleRefresh()
  }
}, WATCH)

chrome.runtime.onMessage.addListener((msg, _s, res) => {
  if (msg === "getInfo") {
    res(parseInfo())
    return true
  }
})

function showFloatingRestoreButton() {
  if (document.getElementById("zqb-restore-btn")) return
  // Try to get color from banner or fallback
  let color = "#2063ff"
  const banner = document.getElementById("zerion-top-banner")
  if (banner) {
    color = banner.getAttribute("data-network-color") || color
  } else if (localStorage.getItem("zqb_banner_network_color")) {
    color = localStorage.getItem("zqb_banner_network_color")
  }
  const btn = document.createElement("div")
  btn.id = "zqb-restore-btn"
  btn.style.position = "fixed"
  btn.style.bottom = "24px"
  btn.style.right = "24px"
  btn.style.width = "56px"
  btn.style.height = "56px"
  btn.style.background = color
  btn.style.borderRadius = "16px"
  btn.style.boxShadow = "0 4px 24px rgba(0,0,0,0.18)"
  btn.style.display = "flex"
  btn.style.alignItems = "center"
  btn.style.justifyContent = "center"
  btn.style.cursor = "pointer"
  btn.style.zIndex = 10020
  btn.style.opacity = "0"
  btn.style.transform = "translateY(100px)"
  btn.style.transition = "opacity 0.4s, transform 0.4s"
  btn.innerHTML =
    '<svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5 20C2.23858 20 8.74228e-07 17.7614 8.74228e-07 15L0 4.99999C1.93283e-06 2.23857 2.23858 -6.11091e-06 5 -6.75517e-06L15 -7.62939e-06C17.7614 -7.62939e-06 20 2.23857 20 4.99999V15C20 17.7614 17.7614 20 15 20H5ZM11.4111 9.92248C11.884 10.1747 12.5435 10.0749 12.8674 9.62829C13.596 8.62694 14.4724 7.28567 15.2521 5.95702C15.4827 5.5638 15.2038 5.00011 14.6606 4.99999C12.493 4.99999 7.52854 5.00121 5.31555 5.00121C4.6359 5.00127 4.40403 5.86275 4.98596 6.22192C6.86926 7.38121 9.51985 8.91431 11.4111 9.92248ZM14.3073 15C14.9459 14.9999 15.214 14.1918 14.6857 13.811C12.8944 12.6938 10.5144 11.3231 8.55835 10.2661C8.08326 10.0104 7.44797 10.1059 7.05811 10.6616C6.3319 11.6969 5.46252 13.0028 4.86694 14.0314C4.61916 14.4485 4.94991 15 5.44434 15L14.3073 15Z" fill="#fff"/></svg>'
  document.body.appendChild(btn)
  setTimeout(() => {
    btn.style.opacity = "1"
    btn.style.transform = "translateY(0)"
  }, 10)
  btn.onclick = function () {
    btn.remove()
    const banner = document.getElementById("zerion-top-banner")
    if (banner) {
      // If the banner is in default position, set default styles BEFORE showing
      const left = localStorage.getItem("zqb_banner_left")
      const top = localStorage.getItem("zqb_banner_top")
      const right = localStorage.getItem("zqb_banner_right")
      const bottom = localStorage.getItem("zqb_banner_bottom")
      const width = localStorage.getItem("zqb_banner_width")
      if (!left && !top && !right && !bottom && !width) {
        banner.style.left = "50%"
        banner.style.top = ""
        banner.style.right = ""
        banner.style.bottom = "24px"
        banner.style.transform = "translateX(-50%)"
        banner.style.position = "fixed"
        banner.style.width = ""
      }
      banner.style.display = ""
      // Force reflow before animating
      void banner.offsetWidth
      banner.classList.add("zqb-show-anim")
      setTimeout(() => {
        banner.classList.remove("zqb-show-anim")
      }, 400)
    }
    localStorage.setItem("zqb_banner_collapsed", "0")
  }
  // Persist collapsed state
  localStorage.setItem("zqb_banner_collapsed", "1")
}

console.log("ZERION content.js loaded")
