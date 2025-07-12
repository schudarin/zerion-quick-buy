// Zerion Quick Actions shared module
// Provides window.injectQuickActionsWindow(contract) usable by any content script.

;(function () {
  if (window.injectQuickActionsWindow) return // Already defined

  function fadeOutAndRemove(el) {
    el.style.opacity = "0"
    el.style.transform = "translateY(-10px)"
    setTimeout(() => {
      el.remove()
    }, 350)
  }

  window.injectQuickActionsWindow = function (contract) {
    // Remove existing window if present
    const prev = document.getElementById("zerion-quick-actions")
    if (prev) prev.remove()

    const container = document.createElement("div")
    container.id = "zerion-quick-actions"
    Object.assign(container.style, {
      position: "fixed",
      top: "24px",
      right: "24px",
      zIndex: "2147483647",
      background: "white",
      border: "1px solid #e0e0e0",
      borderRadius: "10px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      padding: "14px 14px 10px 14px",
      width: "auto",
      maxWidth: "90vw",
      fontFamily: "system-ui, sans-serif",
      color: "#222",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      textAlign: "left",
      opacity: "0",
      transform: "translateY(-10px)",
      transition: "opacity 0.35s, transform 0.35s",
    })

    // timer bar
    const timerBar = document.createElement("div")
    Object.assign(timerBar.style, {
      height: "4px",
      width: "100%",
      background: "linear-gradient(90deg, #1da1f2, #6c47ff)",
      borderRadius: "10px 10px 0 0",
      margin: "-14px -14px 10px -14px",
      transition: "width 0.2s linear",
    })
    container.appendChild(timerBar)

    // fade in
    setTimeout(() => {
      container.style.opacity = "1"
      container.style.transform = "translateY(0)"
    }, 10)

    // close button
    const closeBtn = document.createElement("button")
    closeBtn.textContent = "×"
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "6px",
      right: "10px",
      background: "none",
      border: "none",
      fontSize: "20px",
      cursor: "pointer",
      color: "#888",
    })
    closeBtn.addEventListener("click", () => fadeOutAndRemove(container))
    container.appendChild(closeBtn)

    const title = document.createElement("div")
    title.innerHTML = "<b>Zerion Quick Actions</b>"
    title.style.marginBottom = "8px"
    container.appendChild(title)

    // Contract display line
    const contractDiv = document.createElement("div")
    Object.assign(contractDiv.style, {
      marginBottom: "14px",
      textAlign: "left",
      width: "100%",
    })
    const contractSpan = document.createElement("span")
    Object.assign(contractSpan.style, {
      fontFamily: "monospace",
      fontSize: "13px",
      display: "inline-block",
      maxWidth: "100%",
      wordBreak: "break-all",
      overflowWrap: "anywhere",
      whiteSpace: "normal",
      verticalAlign: "bottom",
    })
    contractSpan.textContent = contract
    contractDiv.appendChild(contractSpan)
    container.appendChild(contractDiv)

    // Buttons
    // Button helpers
    const makeBtn = (text, bg, onClick) => {
      const btn = document.createElement("button")
      btn.textContent = text
      btn.style.cssText = `margin-bottom:8px;width:100%;padding:8px 0;border-radius:6px;border:none;background:${bg};color:white;font-weight:600;font-size:13px;cursor:pointer;text-align:center;`
      btn.addEventListener("click", onClick)
      container.appendChild(btn)
    }

    // Open in Zerion Web
    makeBtn("Open in Zerion Web", "#1da1f2", () => {
      window.open(`https://app.zerion.io/search?q=${contract}`, "_blank")
    })

    // Quick Buy: notify background to show popup
    makeBtn("Quick Buy", "#1da1f2", () => {
      try {
        chrome.runtime.sendMessage({ type: "contractCopied", contract }, () => {
          // Background will open popup. No need for local openPopup call which may be blocked.
        })
      } catch (e) {
        console.error("Quick Buy error", e)
      }
    })

    // View on DexScreener
    makeBtn("View on DexScreener", "#6c47ff", () => {
      window.open(`https://dexscreener.com/search?q=${contract}`, "_blank")
    })

    document.body.appendChild(container)

    // Auto-dismiss logic with progress bar
    const TOTAL = 4000 // ms
    let remaining = TOTAL
    let endTime = Date.now() + TOTAL
    let intervalId = null

    const update = () => {
      remaining = Math.max(0, endTime - Date.now())
      timerBar.style.width = `${(remaining / TOTAL) * 100}%`
      if (remaining === 0) {
        clearInterval(intervalId)
        fadeOutAndRemove(container)
      }
    }

    const startInterval = () => {
      clearInterval(intervalId)
      intervalId = setInterval(update, 50)
    }

    startInterval()

    container.addEventListener("mouseenter", () => {
      clearInterval(intervalId) // pause
      remaining = Math.max(0, endTime - Date.now())
    })

    container.addEventListener("mouseleave", () => {
      if (remaining > 0) {
        endTime = Date.now() + remaining
        startInterval()
      }
    })
  }
})()
