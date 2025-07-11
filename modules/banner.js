// Banner Module - Handles banner creation and management

import { parseInfo, isValidContract } from "../utils.js"

// Constants
const BANNER_ID = "zerion-top-banner"
const HOSTED_NETWORKS = ["solana", "base", "ethereum"]
const SUPPORTED_HOSTS = ["dexscreener.com", "gmgn.ai"]
const DELAY = 800 // ms after hydration
const WATCH = 500 // ms path check

// Network color mapping
const NETWORK_COLORS = {
  solana: "#6c2eb7",
  base: "#2063ff",
  ethereum: "#2063ff",
}

// Utility functions
const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector))

// Cache frequently used elements
const elementCache = new Map()
const getCachedElement = (selector, root = document) => {
  const key = `${selector}_${root === document ? "doc" : "root"}`
  if (!elementCache.has(key)) {
    elementCache.set(key, root.querySelector(selector))
  }
  return elementCache.get(key)
}

/**
 * Inject Zerion banner CSS file into the page (only once)
 */
function injectBannerCSS() {
  if ($("#zerion-styles")) return

  // Inject consolidated styles CSS
  const link = document.createElement("link")
  link.id = "zerion-styles"
  link.rel = "stylesheet"
  link.type = "text/css"
  link.href = chrome.runtime.getURL("styles.css")
  document.head.appendChild(link)
}

/**
 * Main function to build and inject the Zerion banner
 */
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
  const color = NETWORK_COLORS[info.network.toLowerCase()] || "#2063ff"
  div.style.setProperty("--zerion-network-color", color)
  div.setAttribute("data-network-color", color)

  try {
    localStorage.setItem("zqb_banner_network_color", color)
  } catch (e) {}

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

  // Copy button
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
  contractSpan.appendChild(arrow)
  infoLine.appendChild(contractSpan)
  infoLine.appendChild(copyBtn)

  // Quick Buy button
  const btn = document.createElement("button")
  btn.className = "zqb-buy-btn"

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

  // Options icon (static 3-dots button)
  const optionsIconBg = document.createElement("span")
  optionsIconBg.className = "zqb-options-icon-bg"

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

  // Quick Buy + Options container
  const actionsContainer = document.createElement("div")
  actionsContainer.className = "zqb-actions-container"
  actionsContainer.appendChild(btn)
  actionsContainer.appendChild(optionsIconBg)

  // When appending to the banner, place actionsContainer instead of btn and optionsIconBg
  div.appendChild(infoLine)
  div.appendChild(actionsContainer)

  // Prevent move when clicking Quick Buy or Options or Copy
  btn.addEventListener("mousedown", (e) => e.stopPropagation())
  optionsIconBg.addEventListener("mousedown", (e) => e.stopPropagation())
  copyBtn.addEventListener("mousedown", (e) => e.stopPropagation())

  // Add event listeners and positioning logic
  setupBannerInteractions(div, btn, optionsIcon, optionsIconBg, copyBtn)

  return div
}

/**
 * Setup banner interactions (dragging, resizing, etc.)
 */
function setupBannerInteractions(
  div,
  btn,
  optionsIcon,
  optionsIconBg,
  copyBtn
) {
  // Event listener cleanup logic
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
      document.removeEventListener("keydown", onKeydown)
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  // Options state variables for moving the banner
  let isOptionsMoving = false,
    optionsOffsetX = 0,
    optionsOffsetY = 0

  // Track event handlers for moving the banner
  let optionsEnabled = true

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
    div.classList.add("zqb-dragging")
    document.body.classList.add("zqb-dragging")
    // Add dashed border
    div.classList.add("zqb-options-active")
    e.stopPropagation()
    e.preventDefault()
  })

  function onMouseMove(e) {
    if (!isOptionsMoving || !optionsEnabled) return
    const left = `${e.clientX - optionsOffsetX}px`
    const top = `${e.clientY - optionsOffsetY}px`
    div.style.setProperty("--zqb-left", left)
    div.style.setProperty("--zqb-top", top)
    div.classList.add("zqb-position-left")
  }

  function onMouseUp(e) {
    if (isOptionsMoving) {
      isOptionsMoving = false
      document.body.classList.remove("zqb-dragging")
      div.classList.remove("zqb-options-active")
      try {
        localStorage.setItem(
          "zqb_banner_left",
          div.style.getPropertyValue("--zqb-left")
        )
        localStorage.setItem(
          "zqb_banner_top",
          div.style.getPropertyValue("--zqb-top")
        )
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
    div.style.setProperty("--zqb-left", savedLeft)
    div.style.setProperty("--zqb-top", savedTop)
    div.classList.add("zqb-position-left")
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
    div.classList.remove("zqb-position-left")
    div.classList.add("zqb-position-default")
    div.style.removeProperty("--zqb-left")
    div.style.removeProperty("--zqb-top")
    div.style.removeProperty("--zqb-width")
  })

  // Add horizontal resize handles
  const leftHandle = document.createElement("div")
  leftHandle.className = "zqb-resize-handle zqb-resize-handle-left"
  const rightHandle = document.createElement("div")
  rightHandle.className = "zqb-resize-handle zqb-resize-handle-right"
  div.appendChild(leftHandle)
  div.appendChild(rightHandle)

  // Add dropdown menu button and logic
  addMenuButtonToBanner(div, !!(savedLeft && savedTop))

  // Setup resize functionality
  setupResizeHandles(div, leftHandle, rightHandle)
}

/**
 * Setup resize handles functionality
 */
function setupResizeHandles(div, leftHandle, rightHandle) {
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
    document.body.classList.add("zqb-resizing")
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
      div.style.setProperty("--zqb-width", newWidth + "px")
      div.classList.add("zqb-width-custom")
    } else if (resizeDirection === "left") {
      newWidth = startWidth - (e.clientX - resizeStartX)
      let newLeft = startLeft + (e.clientX - resizeStartX)
      div.style.setProperty("--zqb-width", newWidth + "px")
      div.style.setProperty("--zqb-left", newLeft + "px")
      div.classList.add("zqb-width-custom", "zqb-position-left")
    }
  }

  function onResizeMouseUp() {
    if (resizing) {
      resizing = false
      document.body.classList.remove("zqb-resizing")
      div.classList.remove("zqb-resizing")
      // Save width
      try {
        localStorage.setItem(
          "zqb_banner_width",
          div.style.getPropertyValue("--zqb-width")
        )
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
    div.style.setProperty("--zqb-width", savedWidth)
    div.classList.add("zqb-width-custom")
  }
}

/**
 * Add menu button to banner
 */
function addMenuButtonToBanner(banner, canResetPosition = true) {
  // Implementation would go here
  // This is a placeholder for the menu functionality
}

/**
 * Refresh banner
 */
function refreshBanner() {
  const info = parseInfo()
  if (!isValidContract(info)) {
    return
  }

  // Remove existing banner
  const existing = document.getElementById(BANNER_ID)
  if (existing) {
    existing.remove()
  }

  // Build and inject new banner
  const banner = buildBanner(info)
  document.body.appendChild(banner)
}

/**
 * Schedule banner refresh
 */
function scheduleRefresh() {
  setTimeout(refreshBanner, DELAY)
}

// Export functions
export {
  buildBanner,
  refreshBanner,
  scheduleRefresh,
  BANNER_ID,
  HOSTED_NETWORKS,
  SUPPORTED_HOSTS,
  DELAY,
  WATCH,
}
