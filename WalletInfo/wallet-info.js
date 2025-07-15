// Wallet Info Popup - Main functionality
// Handles text selection + shift detection and popup display for ENS names

class WalletInfoPopup {
  constructor() {
    this.popup = null
    this.isShiftPressed = false
    this.currentSelection = null
    this.showTimeout = null
    this.hideTimeout = null
    this.dataGenerator = new FakeWalletDataGenerator()
    this.isEnabled = true

    // Regex patterns for ENS name detection
    this.ensPattern = /^[a-z0-9-]+\.eth$/i
    this.ensSubdomainPattern = /^[a-z0-9-]+\.[a-z0-9-]+\.eth$/i

    this.init()
  }

  init() {
    this.injectStyles()
    this.attachEventListeners()
  }

  injectStyles() {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = chrome.runtime.getURL("WalletInfo/wallet-info.css")
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
    if (this.isValidEnsName(selectedText)) {
      this.showPopup(selectedText)
    } else {
      this.hidePopup()
    }
  }

  isValidEnsName(text) {
    if (!text || text.length < 5) return false // Minimum ENS name length

    // Clean up the text
    text = text.trim().toLowerCase()

    // Check for ENS names (xxx.eth)
    if (this.ensPattern.test(text)) return true

    // Check for ENS subdomains (xxx.yyy.eth)
    if (this.ensSubdomainPattern.test(text)) return true

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

    // Extract the actual ENS name from text
    const ensName = this.extractEnsName(text)
    const walletData = this.dataGenerator.generateWalletData(ensName)

    this.popup = document.createElement("div")
    this.popup.className = "wallet-info-popup"
    this.setWalletColor(walletData.avatar.color)
    this.popup.innerHTML = this.generatePopupHTML(walletData)

    document.body.appendChild(this.popup)

    // Add event listeners for action buttons
    const openBtn = this.popup.querySelector(
      ".wallet-info-action-btn.secondary"
    )
    const followBtn = this.popup.querySelector(
      ".wallet-info-action-btn.primary"
    )
    if (openBtn) {
      openBtn.addEventListener("click", () =>
        this.openInZerion(walletData.ensName)
      )
    }
    if (followBtn) {
      followBtn.addEventListener("click", () =>
        this.followWallet(walletData.ensName)
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
      this.drawChart(walletData.chartData)
    }, 100)
  }

  extractEnsName(text) {
    // Extract the actual ENS name for consistent data generation
    const ensMatch = text.match(this.ensPattern)
    if (ensMatch) return ensMatch[0].toLowerCase()

    const ensSubdomainMatch = text.match(this.ensSubdomainPattern)
    if (ensSubdomainMatch) return ensSubdomainMatch[0].toLowerCase()

    // Fallback to the text itself
    return text.toLowerCase()
  }

  generatePopupHTML(walletData) {
    return `
      <div class="wallet-info-header">
        <div class="wallet-info-avatar" style="background-color: ${
          walletData.avatar.color
        }">
          ${walletData.avatar.type === "pfp" ? "👤" : walletData.avatar.initial}
        </div>
        <div class="wallet-info-title">
          <div class="wallet-info-name">
            ${walletData.ensName}
            ${
              walletData.verified
                ? '<div class="wallet-info-verified"></div>'
                : ""
            }
          </div>
          <div class="wallet-info-address">${walletData.truncatedAddress}</div>
        </div>
      </div>
      
      <div class="wallet-info-balance-row">
        <div class="wallet-info-balance-value">
          ${this.dataGenerator.formatBalance(walletData.balance)}
        </div>
        <div class="wallet-info-balance-usd">
          ${this.dataGenerator.formatUsdValue(walletData.balance)}
        </div>
        <div class="wallet-info-balance-change ${
          walletData.balanceChange >= 0 ? "positive" : "negative"
        }">
          ${walletData.balanceChange >= 0 ? "+" : ""}${
      walletData.balanceChange
    }%
        </div>
      </div>
      
      <div class="wallet-info-chart">
        <svg class="wallet-info-chart-svg" viewBox="0 0 280 60">
          <defs>
            <linearGradient id="walletChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${
                walletData.avatar.color
              };stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:${
                walletData.avatar.color
              };stop-opacity:0" />
            </linearGradient>
          </defs>
          <path class="wallet-info-chart-path" d=""></path>
          <path class="wallet-info-chart-gradient" fill="url(#walletChartGradient)" d=""></path>
        </svg>
      </div>
      
      <div class="wallet-info-stats">
        <div class="wallet-info-stat">
          <div class="wallet-info-stat-label">ACTIVE</div>
          <div class="wallet-info-stat-value">${walletData.timeActive}</div>
        </div>
        <div class="wallet-info-stat">
          <div class="wallet-info-stat-label">ACTIVITY</div>
          <div class="wallet-info-stat-value">${walletData.activityLevel}</div>
        </div>
        <div class="wallet-info-stat">
          <div class="wallet-info-stat-label">FOLLOWERS</div>
          <div class="wallet-info-stat-value">${this.dataGenerator.formatFollowers(
            walletData.followerCount
          )}</div>
        </div>
      </div>
      
      <div class="wallet-info-actions">
        <button class="wallet-info-action-btn secondary">
          <span class="wallet-info-action-label">Open in Zerion</span>
        </button>
        <button class="wallet-info-action-btn primary">
          <span class="wallet-info-action-label">${
            walletData.isFollowing ? "Unfollow" : "Follow"
          }</span>
        </button>
      </div>
    `
  }

  drawChart(chartData) {
    if (!this.popup) return

    const svg = this.popup.querySelector(".wallet-info-chart-svg")
    const path = this.popup.querySelector(".wallet-info-chart-path")
    const gradientPath = this.popup.querySelector(".wallet-info-chart-gradient")

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
  openInZerion(ensName) {
    const url = `https://app.zerion.io/profile/${ensName}`
    window.open(url, "_blank")
    this.hidePopup()
  }

  followWallet(ensName) {
    // This would integrate with a real follow system
    console.log(`Following wallet: ${ensName}`)

    // Update the button text
    const followBtn = this.popup.querySelector(
      ".wallet-info-action-btn.primary .wallet-info-action-label"
    )
    if (followBtn) {
      const isCurrentlyFollowing = followBtn.textContent === "Unfollow"
      followBtn.textContent = isCurrentlyFollowing ? "Follow" : "Unfollow"
    }

    // In a real implementation, this would send a message to background script
    // chrome.runtime.sendMessage({
    //   type: "followWallet",
    //   ensName: ensName,
    //   action: isCurrentlyFollowing ? "unfollow" : "follow"
    // })
  }

  setWalletColor(color) {
    if (this.popup) {
      this.popup.style.setProperty("--wallet-primary-color", color)
    }
  }
}

// Initialize the wallet info popup when the page loads
if (typeof window !== "undefined") {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.walletInfoPopup = new WalletInfoPopup()
    })
  } else {
    window.walletInfoPopup = new WalletInfoPopup()
  }
}

// Export for use in other modules
window.WalletInfoPopup = WalletInfoPopup

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "SHOW_WALLET_INFO_POPUP" && msg.text) {
    if (
      window.walletInfoPopup &&
      typeof window.walletInfoPopup.createPopup === "function"
    ) {
      window.walletInfoPopup.createPopup(msg.text)
    } else {
      console.warn("[WalletInfo] walletInfoPopup not available")
    }
  }
})
