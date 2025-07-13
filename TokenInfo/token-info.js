// Token Info Popup - Main functionality
// Handles text selection + shift detection and popup display

class TokenInfoPopup {
  constructor() {
    this.popup = null
    this.isShiftPressed = false
    this.currentSelection = null
    this.showTimeout = null
    this.hideTimeout = null
    this.dataGenerator = new FakeTokenDataGenerator()
    this.isEnabled = true

    // Regex patterns for detection
    this.contractPattern = /^0x[a-fA-F0-9]{40}$/
    this.tokenPattern = /^\$[a-zA-Z]+$/ // Starts with $ and no numbers
    this.solanaPattern = /^[A-Za-z0-9]{32,44}$/

    this.init()
  }

  init() {
    this.injectStyles()
    this.attachEventListeners()
  }

  injectStyles() {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = chrome.runtime.getURL("TokenInfo/token-info.css")
    document.head.appendChild(link)
  }

  attachEventListeners() {
    // Global key event listeners
    document.addEventListener("keydown", (e) => {
      if (e.key === "Shift") {
        this.isShiftPressed = true
        this.checkSelection()
      }
    })

    document.addEventListener("keyup", (e) => {
      if (e.key === "Shift") {
        this.isShiftPressed = false
        this.hidePopup()
      }
    })

    // Selection change listeners
    document.addEventListener("selectionchange", () => {
      this.updateSelection()
      if (this.isShiftPressed) {
        this.checkSelection()
      }
    })

    // Mouse up to check selection after drag
    document.addEventListener("mouseup", () => {
      setTimeout(() => {
        this.updateSelection()
        if (this.isShiftPressed) {
          this.checkSelection()
        }
      }, 10) // Small delay to ensure selection is updated
    })

    // Clean up on page unload
    window.addEventListener("beforeunload", () => {
      this.cleanup()
    })
  }

  updateSelection() {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const selectedText = selection.toString().trim()
      this.currentSelection = {
        text: selectedText,
        range: selection.getRangeAt(0),
        selection: selection,
      }
    } else {
      this.currentSelection = null
    }
  }

  checkSelection() {
    if (!this.currentSelection || !this.currentSelection.text) {
      this.hidePopup()
      return
    }

    const selectedText = this.currentSelection.text
    if (this.isValidToken(selectedText)) {
      this.showPopup(selectedText)
    } else {
      this.hidePopup()
    }
  }

  isValidToken(text) {
    if (!text || text.length < 3) return false

    // Clean up the text
    text = text.trim()

    // Check for contract addresses
    if (this.contractPattern.test(text)) return true

    // Check for Solana addresses
    if (this.solanaPattern.test(text)) return true

    // Check for token tickers (starts with $ and no numbers)
    if (this.tokenPattern.test(text)) return true

    return false
  }

  showPopup(text) {
    if (!this.isShiftPressed || !this.currentSelection) return

    clearTimeout(this.hideTimeout)
    clearTimeout(this.showTimeout)

    this.showTimeout = setTimeout(() => {
      this.createPopup(text)
    }, 100) // Small delay to avoid flashing
  }

  scheduleHidePopup() {
    clearTimeout(this.showTimeout)
    this.hideTimeout = setTimeout(() => {
      this.hidePopup()
    }, 200)
  }

  createPopup(text) {
    if (this.popup) {
      this.hidePopup()
    }

    // Ensure noise texture is set
    window.ensureNoiseTexture && window.ensureNoiseTexture()

    // Extract the actual token identifier from text
    const tokenId = this.extractTokenId(text)
    const tokenData = this.dataGenerator.generateTokenData(tokenId)

    this.popup = document.createElement("div")
    this.popup.className = "token-info-popup"
    this.setNetworkColor(tokenId)
    this.popup.innerHTML = this.generatePopupHTML(tokenData)

    document.body.appendChild(this.popup)

    // Add event listeners for action buttons
    const openBtn = this.popup.querySelector(".token-info-action-btn.secondary")
    const buyBtn = this.popup.querySelector(".token-info-action-btn.primary")
    if (openBtn) {
      openBtn.addEventListener("click", () =>
        this.openInZerion(tokenData.contractAddress)
      )
    }
    if (buyBtn) {
      buyBtn.addEventListener("click", () =>
        this.quickBuy(tokenData.contractAddress)
      )
    }

    // Position the popup
    this.positionPopup()

    // Add event listeners to popup
    this.popup.addEventListener("mouseenter", () => {
      clearTimeout(this.hideTimeout)
    })

    this.popup.addEventListener("mouseleave", () => {
      this.scheduleHidePopup()
    })

    // Show with animation
    requestAnimationFrame(() => {
      this.popup.classList.add("show")
    })

    // Generate and animate chart
    setTimeout(() => {
      this.drawChart(tokenData.chartData)
    }, 100)
  }

  extractTokenId(text) {
    // Extract the actual token identifier for consistent data generation
    const contractMatch = text.match(this.contractPattern)
    if (contractMatch) return contractMatch[0]

    const tokenMatch = text.match(this.tokenPattern)
    if (tokenMatch) return tokenMatch[0]

    const solanaMatch = text.match(this.solanaPattern)
    if (solanaMatch) return solanaMatch[0]

    // Fallback to the text itself
    return text.substring(0, 42) // Limit length
  }

  generatePopupHTML(tokenData) {
    return `
      <div class="token-info-header">
        <div class="token-info-icon">
          ${tokenData.symbol.charAt(0)}
        </div>
        <div class="token-info-title">
          <div class="token-info-name">
            ${tokenData.name}
            ${
              tokenData.verified
                ? '<div class="token-info-verified"></div>'
                : ""
            }
          </div>
          <div class="token-info-symbol">${tokenData.symbol}</div>
        </div>
      </div>
      
      <div class="token-info-price-row">
        <div class="token-info-price-value">
          ${this.dataGenerator.formatPrice(tokenData.price)}
        </div>
        <div class="token-info-price-change-inline ${
          tokenData.change >= 0 ? "positive" : "negative"
        }">
          ${tokenData.change >= 0 ? "+" : ""}${tokenData.change}%
        </div>
      </div>
      <div class="token-info-chart">
        <svg class="token-info-chart-svg" viewBox="0 0 280 60">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:0" />
            </linearGradient>
          </defs>
          <path class="token-info-chart-path" d=""></path>
          <path class="token-info-chart-gradient" fill="url(#chartGradient)" d=""></path>
        </svg>
      </div>
      <div class="token-info-stats">
        <div class="token-info-stat">
          <div class="token-info-stat-label">AGE</div>
          <div class="token-info-stat-value">${tokenData.age}</div>
        </div>
        <div class="token-info-stat">
          <div class="token-info-stat-label">FDV</div>
          <div class="token-info-stat-value">${this.dataGenerator.formatNumber(
            tokenData.fdv
          )}</div>
        </div>
        <div class="token-info-stat">
          <div class="token-info-stat-label">MCAP</div>
          <div class="token-info-stat-value">${this.dataGenerator.formatNumber(
            tokenData.marketCap
          )}</div>
        </div>
      </div>
      <div class="token-info-details">
        <div class="token-info-detail">
          <div class="token-info-detail-label">VOL</div>
          <div class="token-info-detail-value">${this.dataGenerator.formatNumber(
            tokenData.volume
          )}</div>
        </div>
        <div class="token-info-detail">
          <div class="token-info-detail-label">HLDRS</div>
          <div class="token-info-detail-value">${this.dataGenerator.formatHolders(
            tokenData.holders
          )}</div>
        </div>
      </div>
      <div class="token-info-actions">
        <button class="token-info-action-btn secondary">
          <span class="token-info-action-label">Open in Zerion</span>
        </button>
        <button class="token-info-action-btn primary">
          <span class="token-info-action-label">Quick Buy</span>
        </button>
      </div>
    `
  }

  drawChart(chartData) {
    if (!this.popup) return

    const svg = this.popup.querySelector(".token-info-chart-svg")
    const path = this.popup.querySelector(".token-info-chart-path")
    const gradientPath = this.popup.querySelector(".token-info-chart-gradient")

    if (!svg || !path || !chartData) return

    const width = 280
    const height = 60
    const padding = 10

    // Generate SVG path
    let pathData = ""
    let gradientData = ""

    chartData.forEach((point, index) => {
      const x =
        (index / (chartData.length - 1)) * (width - padding * 2) + padding
      const y = height - (point * (height - padding * 2) + padding)

      if (index === 0) {
        pathData += `M ${x} ${y}`
        gradientData += `M ${x} ${height - padding}`
      } else {
        pathData += ` L ${x} ${y}`
      }

      if (index === 0) {
        gradientData += ` L ${x} ${y}`
      } else {
        gradientData += ` L ${x} ${y}`
      }
    })

    // Complete gradient path
    const lastX =
      ((chartData.length - 1) / (chartData.length - 1)) *
        (width - padding * 2) +
      padding
    gradientData += ` L ${lastX} ${height - padding} Z`

    path.setAttribute("d", pathData)
    gradientPath.setAttribute("d", gradientData)
  }

  positionPopup() {
    if (!this.popup || !this.currentSelection) return

    const range = this.currentSelection.range
    const rect = range.getBoundingClientRect()
    const popupRect = this.popup.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate position relative to selection
    let x = rect.left + rect.width / 2 - popupRect.width / 2
    let y = rect.top - popupRect.height - 10

    // Adjust if popup goes off screen horizontally
    if (x < 10) {
      x = 10
    } else if (x + popupRect.width > viewportWidth - 10) {
      x = viewportWidth - popupRect.width - 10
    }

    // Adjust if popup goes off screen vertically
    if (y < 10) {
      y = rect.bottom + 10
    }

    if (y + popupRect.height > viewportHeight - 10) {
      y = viewportHeight - popupRect.height - 10
    }

    this.popup.style.left = `${x}px`
    this.popup.style.top = `${y}px`
  }

  hidePopup() {
    if (this.popup) {
      this.popup.classList.remove("show")
      setTimeout(() => {
        if (this.popup && this.popup.parentNode) {
          this.popup.parentNode.removeChild(this.popup)
        }
        this.popup = null
      }, 300)
    }
  }

  cleanup() {
    clearTimeout(this.showTimeout)
    clearTimeout(this.hideTimeout)
    this.hidePopup()
  }

  // Action button handlers
  openInZerion(contractAddress) {
    const url = `https://app.zerion.io/search?q=${contractAddress}`
    window.open(url, "_blank")
    this.hidePopup()
  }

  quickBuy(contractAddress) {
    // Send message to background script to trigger the quick buy flow
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: "contractCopied",
        contract: contractAddress,
      })
    }
    this.hidePopup()
  }

  // Network color mapping (same as banner)
  static NETWORK_COLORS = {
    ethereum: "#627eea",
    base: "#0052ff",
    solana: "#6c2eb7", // updated to match banner
    polygon: "#8247e5",
    optimism: "#ff0420",
    arbitrum: "#28a0f0",
    bsc: "#f3ba2f",
    avalanche: "#e84142",
    celo: "#35d07f",
    fantom: "#1969ff",
    gnosis: "#048a60",
    zksync: "#2f80ed",
    default: "#2063ff",
  }

  setNetworkColor(tokenId) {
    // Try to detect network from contract address or ticker
    let network = "default"
    if (/^0x[a-fA-F0-9]{40}$/.test(tokenId)) {
      network = "ethereum"
    } else if (/^[A-Za-z0-9]{32,44}$/.test(tokenId)) {
      network = "solana"
    } else if (/^\$[a-zA-Z]+$/.test(tokenId)) {
      // Optionally, map tickers to networks if you want
      network = "default"
    }
    // Add more detection if needed
    const color =
      TokenInfoPopup.NETWORK_COLORS[network] ||
      TokenInfoPopup.NETWORK_COLORS.default
    if (this.popup) {
      this.popup.style.setProperty("--zerion-network-color", color)
    }
  }
}

// Initialize the token info popup when the page loads
if (typeof window !== "undefined") {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.tokenInfoPopup = new TokenInfoPopup()
    })
  } else {
    window.tokenInfoPopup = new TokenInfoPopup()
  }
}

// Export for use in other modules
window.TokenInfoPopup = TokenInfoPopup

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "SHOW_TOKEN_INFO_POPUP" && msg.text) {
    if (
      window.tokenInfoPopup &&
      typeof window.tokenInfoPopup.createPopup === "function"
    ) {
      window.tokenInfoPopup.createPopup(msg.text)
    } else {
      console.warn("[TokenInfo] tokenInfoPopup not available")
    }
  }
})
