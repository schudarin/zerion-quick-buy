// Zerion Quick Buy Banner Module

;(function (global) {
  if (global.createZerionBanner) return // already present

  // Local fallback constants if not already defined globally (content.js defines them as well)
  const WATCH = global.WATCH || 500
  const DELAY = global.DELAY || 800
  global.WATCH = WATCH
  global.DELAY = DELAY

  const BANNER_ID = global.BANNER_ID || "zerion-top-banner"
  global.BANNER_ID = BANNER_ID

  // Local query helpers if not already defined
  const $ = global.$ || ((sel, root = document) => root.querySelector(sel))
  const $$ =
    global.$$ ||
    ((sel, root = document) => Array.from(root.querySelectorAll(sel)))
  global.$ = $
  global.$$ = $$

  /**
   * Check if a banner position would be offscreen
   * @param {HTMLElement} banner - The banner element
   * @returns {object} - Object with isOffscreen boolean and correction data
   */
  function checkBannerOffscreen(banner) {
    if (!banner) return { isOffscreen: false }

    const rect = banner.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Check if banner is offscreen
    const isOffscreenLeft = rect.left < 0
    const isOffscreenRight = rect.right > viewportWidth
    const isOffscreenTop = rect.top < 0
    const isOffscreenBottom = rect.bottom > viewportHeight

    const isOffscreen =
      isOffscreenLeft || isOffscreenRight || isOffscreenTop || isOffscreenBottom

    if (!isOffscreen) return { isOffscreen: false }

    // Calculate correction values
    let correctedLeft = rect.left
    let correctedTop = rect.top

    // Handle case where banner is wider than viewport
    if (rect.width > viewportWidth - 20) {
      // Allow 10px margin on each side
      correctedLeft = 10
    } else if (isOffscreenLeft) {
      correctedLeft = 10 // 10px from left edge
    } else if (isOffscreenRight) {
      correctedLeft = viewportWidth - rect.width - 10 // 10px from right edge
    }

    // Handle case where banner is taller than viewport
    if (rect.height > viewportHeight) {
      correctedTop = 10
    } else if (isOffscreenTop) {
      correctedTop = 10 // 10px from top edge
    } else if (isOffscreenBottom) {
      correctedTop = viewportHeight - rect.height - 10 // 10px from bottom edge
    }

    return {
      isOffscreen: true,
      correctedLeft: Math.max(0, correctedLeft),
      correctedTop: Math.max(0, correctedTop),
    }
  }

  /**
   * Correct banner position if it's offscreen
   * @param {HTMLElement} banner - The banner element
   * @returns {boolean} - True if position was corrected
   */
  function correctBannerPosition(banner) {
    if (!banner) return false

    const check = checkBannerOffscreen(banner)
    if (!check.isOffscreen) return false

    // Apply corrected position
    banner.style.left = check.correctedLeft + "px"
    banner.style.top = check.correctedTop + "px"
    banner.style.right = "auto"
    banner.style.bottom = "auto"
    banner.style.transform = "none"
    banner.style.position = "fixed"

    // Save corrected position to localStorage
    try {
      localStorage.setItem("zqb_banner_left", banner.style.left)
      localStorage.setItem("zqb_banner_top", banner.style.top)
    } catch (e) {
      console.warn("[ZQB] Could not save corrected banner position:", e)
    }

    return true
  }

  /**
   * Check and correct banner position on window resize
   */
  function handleWindowResize() {
    const banner = document.getElementById(BANNER_ID)
    if (banner && banner.style.display !== "none") {
      // Check if banner is in default centered position (no saved position)
      const savedLeft = localStorage.getItem("zqb_banner_left")
      const savedTop = localStorage.getItem("zqb_banner_top")

      if (!savedLeft && !savedTop) {
        // Re-center the banner for default position
        const bannerWidth = banner.offsetWidth
        const viewportWidth = window.innerWidth
        const centeredLeft = (viewportWidth - bannerWidth) / 2

        banner.style.left = centeredLeft + "px"
      } else {
        // For saved positions, check if it's offscreen
        correctBannerPosition(banner)
      }
    }
  }

  /**
   * Public entry-point used by content.js after parsing token info.
   * For now it delegates to the legacy buildBanner defined in content.js.
   * @param {object} info – parsed token info
   */
  function createZerionBanner(info) {
    if (typeof global._internalBuildBanner === "function") {
      return global._internalBuildBanner(info)
    }
    console.warn("[ZQB] createZerionBanner called but implementation not found")
    return null
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
    link.href = chrome.runtime.getURL("Banner/zqb-banner.css")
    document.head.appendChild(link)
  }

  // Main function to build and inject the Zerion banner
  function _internalBuildBanner(info) {
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
    // Store current contract for quick comparison on subsequent refreshes
    div.setAttribute("data-contract", info.contract.toLowerCase())
    try {
      localStorage.setItem("zqb_banner_network_color", color)
    } catch (e) {}
    // Responsive styles are now handled by CSS
    // Default width is handled by CSS, but preserve dynamic width setting ability
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
    // Display flex and align items are now handled by CSS
    // Add improved inline SVG icon to the left of the button text
    const buyIcon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    )
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
    // All appearance styles are now handled by CSS only

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
    actionsContainer.className = "zqb-actions-container"
    // Display flex and align items are now handled by CSS
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
    window.addEventListener("resize", handleWindowResize)
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

      // Check and correct position if offscreen after a brief delay to ensure banner is rendered
      // Only correct position if banner is actually offscreen, don't preemptively constrain
      setTimeout(() => {
        const rect = div.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        // Only correct if actually going off-screen with some buffer
        if (rect.left < 10 || rect.right > viewportWidth - 10) {
          correctBannerPosition(div)
        }
      }, 100)
    } else {
      // For default centered position, use absolute positioning to avoid transform issues with fit-content
      setTimeout(() => {
        const bannerWidth = div.offsetWidth
        const viewportWidth = window.innerWidth
        const centeredLeft = (viewportWidth - bannerWidth) / 2

        div.style.left = centeredLeft + "px"
        div.style.right = "auto"
        div.style.bottom = "24px"
        div.style.transform = "none"
        div.style.position = "fixed"
      }, 10) // Small delay to ensure the banner is rendered and width is calculated
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
      div.style.width = "" // Reset to CSS default (fit-content)
      // Use absolute positioning for proper centering
      setTimeout(() => {
        const bannerWidth = div.offsetWidth
        const viewportWidth = window.innerWidth
        const centeredLeft = (viewportWidth - bannerWidth) / 2

        div.style.left = centeredLeft + "px"
        div.style.top = ""
        div.style.right = "auto"
        div.style.bottom = "24px"
        div.style.transform = "none"
        div.style.position = "fixed"
      }, 10)
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
        div.style.width = "" // Reset to CSS default (fit-content)
      }
    })
    rightHandle.addEventListener("dblclick", function (e) {
      e.stopPropagation()
      e.preventDefault()
      try {
        localStorage.removeItem("zqb_banner_width")
      } catch (e) {}
      // Reset width only, left edge stays fixed
      div.style.width = "" // Reset to CSS default (fit-content)
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
    leftHandle.addEventListener("mousedown", (e) =>
      onResizeMouseDown(e, "left")
    )
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
          const banner = document.getElementById(BANNER_ID)
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
          const banner = document.getElementById(BANNER_ID)
          if (banner) {
            banner.style.width = "" // Reset to CSS default (fit-content)
            // Use absolute positioning for proper centering
            setTimeout(() => {
              const bannerWidth = banner.offsetWidth
              const viewportWidth = window.innerWidth
              const centeredLeft = (viewportWidth - bannerWidth) / 2

              banner.style.left = centeredLeft + "px"
              banner.style.top = ""
              banner.style.right = "auto"
              banner.style.bottom = "24px"
              banner.style.transform = "none"
              banner.style.position = "fixed"
            }, 10)
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
    // All styling is now handled by CSS
    modal.innerHTML = `
    <div class="zqb-modal-title">Zerion Quick Buy Banner</div>
    <div class="zqb-modal-version">Version: 1.0.0</div>
    <div class="zqb-modal-author">Author: Zerion Team</div>
    <div class="zqb-modal-description">A browser extension that injects a smart, draggable, and customizable quick-buy banner for tokens on supported networks. Features include contract copy, quick buy, drag, resize, hide, and more. <br/><br/>For feedback or issues, use the Feedback option in the menu.</div>
    <button id="zqb-about-close">Close</button>
  `
    document.body.appendChild(modal)
    const closeBtn = document.getElementById("zqb-about-close")
    if (closeBtn) {
      closeBtn.onclick = function () {
        modal.remove()
      }
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
  let refreshAttempts = 0
  const MAX_REFRESH_ATTEMPTS = 6 // ~3 s total (6×500 ms)

  function refreshBanner() {
    const info = parseInfo()

    // Try multiple injection targets in order of preference
    let injectionTarget =
      document.querySelector("main") ||
      document.querySelector("#root") ||
      document.querySelector("#app") ||
      document.querySelector("[data-testid='main']") ||
      document.querySelector("body")

    if (!injectionTarget || injectionTarget === document.body) {
      // If we can't find a good target, use body as fallback
      injectionTarget = document.body
    }

    if (!injectionTarget) {
      console.warn(
        "[ZQB] No suitable injection target found, setting up observer"
      )
      // Watch for any suitable target to appear
      const observer = new MutationObserver(() => {
        const target =
          document.querySelector("main") ||
          document.querySelector("#root") ||
          document.querySelector("#app") ||
          document.querySelector("[data-testid='main']") ||
          document.querySelector("body")
        if (target) {
          observer.disconnect()
          refreshBanner() // Try again now that target exists
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
      return
    }
    const old = document.getElementById(BANNER_ID)
    // If banner already exists and is showing the same contract, skip update
    if (
      old &&
      old.getAttribute("data-contract") === info.contract.toLowerCase()
    ) {
      console.debug("[ZQB] Banner already up-to-date, skipping refresh")
      return
    }
    const valid = isValidContract(info)
    if (!valid) {
      // Retry a few times in case SPA navigation hasn't fully rendered yet
      if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
        refreshAttempts++
        setTimeout(refreshBanner, 500)
      } else {
        refreshAttempts = 0
      }
      if (old) {
        old.remove()
      }
      console.debug("[ZQB] Not a valid contract/network, banner not shown")
      return
    }
    // Reset attempt counter once we have a valid contract
    refreshAttempts = 0
    // No API, just use info from parseInfo
    console.log("[ZQB] final info for banner:", info)
    if (old) {
      old.classList.add("shimmer")
      setTimeout(() => {
        old.classList.remove("shimmer")
        old.remove()
        // Recompute token info as the DOM may have updated during the delay
        const latestInfo = parseInfo()
        if (!isValidContract(latestInfo)) {
          console.debug(
            "[ZQB] Skipping banner rebuild – contract became invalid after delay"
          )
          return
        }
        const bannerDiv = _internalBuildBanner(latestInfo)
        // Check collapsed state
        if (localStorage.getItem("zqb_banner_collapsed") === "1") {
          bannerDiv.style.display = "none"
          showFloatingRestoreButton()
        }
        injectionTarget.prepend(bannerDiv)
      }, 1000)
    } else {
      const bannerDiv = _internalBuildBanner(info)
      if (localStorage.getItem("zqb_banner_collapsed") === "1") {
        bannerDiv.style.display = "none"
        showFloatingRestoreButton()
      }
      injectionTarget.prepend(bannerDiv)
    }
  }

  // Schedule a banner refresh after a delay
  function scheduleRefresh() {
    clearTimeout(window.__zqbTimer)
    window.__zqbTimer = setTimeout(refreshBanner, DELAY)
  }

  // Fallback: periodic path check (cheap) in case the site changes URL without using History API
  ;(function startPathPolling() {
    let polledPath = location.pathname
    setInterval(() => {
      if (location.pathname !== polledPath) {
        polledPath = location.pathname
        scheduleRefresh()
      }
    }, WATCH)
  })()

  function openSharedQuickActions(contract) {
    if (typeof window.injectQuickActionsWindow === "function") {
      window.injectQuickActionsWindow(contract)
    }
  }

  function fadeOutAndRemove(el) {
    el.classList.add("zqb-fade-out")
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }, 350)
  }

  // Note: Copy event listening is handled by copy-listener.js to avoid conflicts

  // Dexscreener-specific: Listen for copy success toast
  ;(function listenForDexscreenerCopySuccess() {
    // Set up observer when body is available
    function setupCopySuccessObserver() {
      if (!document.body) {
        setTimeout(setupCopySuccessObserver, 100)
        return
      }

      // Create a MutationObserver to watch for the success toast
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Only log elements that might be toasts or alerts
              const isPotentialToast =
                node.className &&
                typeof node.className === "string" &&
                (node.className.includes("toast") ||
                  node.className.includes("alert") ||
                  node.className.includes("notification") ||
                  node.getAttribute("data-status") === "success" ||
                  node.querySelector('[id*="toast"]') ||
                  node.querySelector('[id*="alert"]'))

              if (isPotentialToast) {
                console.log("[ZQB] Potential toast detected:", node)
                console.log("[ZQB] Element tag:", node.tagName)
                console.log("[ZQB] Element classes:", node.className)
                console.log(
                  "[ZQB] Element data-status:",
                  node.getAttribute("data-status")
                )
                console.log(
                  "[ZQB] Element innerHTML:",
                  node.innerHTML.substring(0, 200) + "..."
                )
              }

              // Check if this is the copy success toast - multiple detection methods
              let isCopySuccess = false

              // Method 1: Check for success status and toast ID
              if (
                node.getAttribute &&
                node.getAttribute("data-status") === "success" &&
                node.querySelector &&
                node.querySelector('[id*="toast"]')
              ) {
                console.log("[ZQB] Success toast element detected!")

                const descriptionEl = node.querySelector(
                  '[id*="toast"]-description'
                )
                console.log("[ZQB] Description element:", descriptionEl)
                console.log(
                  "[ZQB] Description text:",
                  descriptionEl?.textContent
                )

                if (
                  descriptionEl &&
                  descriptionEl.textContent.includes(
                    "Address copied to clipboard"
                  )
                ) {
                  isCopySuccess = true
                }
              }

              // Method 2: Check for any element containing the success text
              if (
                !isCopySuccess &&
                node.textContent &&
                node.textContent.includes("Address copied to clipboard")
              ) {
                console.log("[ZQB] Copy success text found in element:", node)
                isCopySuccess = true
              }

              // Method 3: Check for chakra alert with success status
              if (
                !isCopySuccess &&
                node.className &&
                typeof node.className === "string" &&
                node.className.includes("chakra-alert") &&
                node.getAttribute("data-status") === "success"
              ) {
                console.log(
                  "[ZQB] Chakra alert with success status detected:",
                  node
                )
                if (
                  node.textContent &&
                  node.textContent.includes("Address copied to clipboard")
                ) {
                  isCopySuccess = true
                }
              }

              if (isCopySuccess) {
                console.log("[ZQB] Copy success detected!")

                // Get contract from parseInfo() which already works correctly
                const info = parseInfo()
                if (info && info.contract) {
                  console.log("[ZQB] Contract from parseInfo:", info.contract)
                  openSharedQuickActions(info.contract)
                } else {
                  console.warn("[ZQB] No contract found in parseInfo")
                }
              }
            }
          })
        })
      })

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })

    }

    // Start setup
    setupCopySuccessObserver()
  })()

  // --- Script entry point ---
  // Wait for DOM ready, then schedule initial banner refresh
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleRefresh)
  } else {
    scheduleRefresh()
  }

  // --- Efficient SPA navigation detection ---
  ;(function observeLocationChanges() {
    let lastPath = location.pathname

    const checkPath = () => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname
        scheduleRefresh()
      }
    }

    // Monkey-patch History API methods to detect client-side route changes
    const patchHistoryMethod = (method) => {
      const original = history[method]
      history[method] = function () {
        const result = original.apply(this, arguments)
        checkPath()
        return result
      }
    }
    patchHistoryMethod("pushState")
    patchHistoryMethod("replaceState")

    // Also listen for back/forward navigation
    window.addEventListener("popstate", checkPath)
  })()

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
    const banner = document.getElementById(BANNER_ID)
    if (banner) {
      color = banner.getAttribute("data-network-color") || color
    } else if (localStorage.getItem("zqb_banner_network_color")) {
      color = localStorage.getItem("zqb_banner_network_color")
    }
    const btn = document.createElement("div")
    btn.id = "zqb-restore-btn"
    // Most styling is now handled by CSS, only set dynamic background color
    btn.style.background = color
    btn.style.opacity = "0"
    btn.style.transform = "translateY(100px)"
    btn.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5 20C2.23858 20 8.74228e-07 17.7614 8.74228e-07 15L0 4.99999C1.93283e-06 2.23857 2.23858 -6.11091e-06 5 -6.75517e-06L15 -7.62939e-06C17.7614 -7.62939e-06 20 2.23857 20 4.99999V15C20 17.7614 17.7614 20 15 20H5ZM11.4111 9.92248C11.884 10.1747 12.5435 10.0749 12.8674 9.62829C13.596 8.62694 14.4724 7.28567 15.2521 5.95702C15.4827 5.5638 15.2038 5.00011 14.6606 4.99999C12.493 4.99999 7.52854 5.00121 5.31555 5.00121C4.6359 5.00127 4.40403 5.86275 4.98596 6.22192C6.86926 7.38121 9.51985 8.91431 11.4111 9.92248ZM14.3073 15C14.9459 14.9999 15.214 14.1918 14.6857 13.811C12.8944 12.6938 10.5144 11.3231 8.55835 10.2661C8.08326 10.0104 7.44797 10.1059 7.05811 10.6616C6.3319 11.6969 5.46252 13.0028 4.86694 14.0314C4.61916 14.4485 4.94991 15 5.44434 15L14.3073 15Z" fill="#fff"/></svg>'
    document.body.appendChild(btn)
    setTimeout(() => {
      btn.style.opacity = "1"
      btn.style.transform = "translateY(0)"
    }, 10)
    btn.onclick = function () {
      btn.remove()
      const banner = document.getElementById(BANNER_ID)
      if (banner) {
        // If the banner is in default position, set default styles BEFORE showing
        const left = localStorage.getItem("zqb_banner_left")
        const top = localStorage.getItem("zqb_banner_top")
        const right = localStorage.getItem("zqb_banner_right")
        const bottom = localStorage.getItem("zqb_banner_bottom")
        const width = localStorage.getItem("zqb_banner_width")
        if (!left && !top && !right && !bottom && !width) {
          banner.style.width = "" // Reset to CSS default (fit-content)
          // Use absolute positioning for proper centering
          setTimeout(() => {
            const bannerWidth = banner.offsetWidth
            const viewportWidth = window.innerWidth
            const centeredLeft = (viewportWidth - bannerWidth) / 2

            banner.style.left = centeredLeft + "px"
            banner.style.top = ""
            banner.style.right = "auto"
            banner.style.bottom = "24px"
            banner.style.transform = "none"
            banner.style.position = "fixed"
          }, 10)
        }
        banner.style.display = ""
        // Force reflow before animating
        void banner.offsetWidth
        banner.classList.add("zqb-show-anim")
        setTimeout(() => {
          banner.classList.remove("zqb-show-anim")
        }, 400)

        // Check and correct position if offscreen after banner is shown
        setTimeout(() => {
          correctBannerPosition(banner)
        }, 450)
      }
      localStorage.setItem("zqb_banner_collapsed", "0")
    }
    // Persist collapsed state
    localStorage.setItem("zqb_banner_collapsed", "1")
  }

  // Expose to global scope
  global.createZerionBanner = createZerionBanner
  global._internalBuildBanner = _internalBuildBanner
})(typeof window !== "undefined" ? window : this)
