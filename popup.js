// Zerion Quick Buy Popup Script
// Handles UI logic for the extension popup

// Helper to get element by ID
const $ = (id) => document.getElementById(id)

// Populate token info in the popup
function showTokenInfo(info) {
  $("token-name").textContent = info.name
  $("network").textContent = info.network
  $("contract").textContent = info.contract
}

// Show loading message while fetching token info
const messageEl = $("swap-message")
messageEl.textContent = "Loading token info..."
messageEl.className = "zqb-message loading"

// Try to get token info from background, fallback to content script if needed
chrome.runtime.sendMessage("getTokenInfo", (tokenInfo) => {
  try {
    if (tokenInfo) {
      showTokenInfo(tokenInfo)
      messageEl.textContent = ""
      messageEl.className = "zqb-message"
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error("Tab query error:", chrome.runtime.lastError)
          messageEl.textContent = "Error: Could not access current tab."
          messageEl.className = "zqb-message error"
          return
        }

        chrome.tabs.sendMessage(tabs[0].id, "getInfo", (resp) => {
          if (chrome.runtime.lastError) {
            console.error("Message send error:", chrome.runtime.lastError)
            messageEl.textContent = "Error: Could not communicate with page."
            messageEl.className = "zqb-message error"
            return
          }

          if (resp) {
            showTokenInfo(resp)
            messageEl.textContent = ""
            messageEl.className = "zqb-message"
          } else {
            messageEl.textContent = "Could not load token info."
            messageEl.className = "zqb-message error"
          }
        })
      })
    }
  } catch (error) {
    console.error("Popup error:", error)
    messageEl.textContent = "Unexpected error occurred."
    messageEl.className = "zqb-message error"
  }
})

// Handle swap form submission with validation and feedback
$("swap-form").addEventListener("submit", (e) => {
  e.preventDefault()
  const amount = $("amount").value.trim()
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    messageEl.textContent = "Please enter a valid amount."
    messageEl.className = "zqb-message error"
    return
  }
  // Show success message for demo
  messageEl.textContent = "Swap successful!"
  messageEl.className = "zqb-message success"
  setTimeout(() => {
    messageEl.textContent = ""
    messageEl.className = "zqb-message"
  }, 2000)
})

// Focus the amount input when the popup opens
document.addEventListener("DOMContentLoaded", () => {
  const amountInput = $("amount")
  if (amountInput) amountInput.focus()

  chrome.runtime.sendMessage({ type: "getLastCopiedContract" }, (response) => {
    const contract = response && response.contract
    const container = document.getElementById("contract-actions")
    if (contract && container) {
      // Clear container
      container.innerHTML = ""

      // Create contract info div
      const contractInfo = document.createElement("div")
      contractInfo.className = "zqb-contract-info"
      contractInfo.textContent = "Copied contract: "

      const contractSpan = document.createElement("span")
      contractSpan.textContent = contract
      contractSpan.className = "zqb-contract-address"
      contractInfo.appendChild(contractSpan)
      container.appendChild(contractInfo)

      // Create buttons
      const openZerionBtn = document.createElement("button")
      openZerionBtn.id = "open-zerion"
      openZerionBtn.textContent = "Open in Zerion Web"
      openZerionBtn.className = "zqb-action-button zerion"
      openZerionBtn.setAttribute(
        "aria-label",
        "Open token in Zerion Web application"
      )
      container.appendChild(openZerionBtn)

      const quickBuyBtn = document.createElement("button")
      quickBuyBtn.id = "quick-buy"
      quickBuyBtn.textContent = "Quick Buy"
      quickBuyBtn.className = "zqb-action-button quick-buy"
      quickBuyBtn.setAttribute("aria-label", "Quick buy this token")
      container.appendChild(quickBuyBtn)

      const openDexscreenerBtn = document.createElement("button")
      openDexscreenerBtn.id = "open-dexscreener"
      openDexscreenerBtn.textContent = "View on DexScreener"
      openDexscreenerBtn.className = "zqb-action-button dexscreener"
      openDexscreenerBtn.setAttribute("aria-label", "View token on DexScreener")
      container.appendChild(openDexscreenerBtn)
      document.getElementById("open-zerion").onclick = () => {
        window.open(`https://app.zerion.io/search?q=${contract}`, "_blank")
      }
      document.getElementById("quick-buy").onclick = () => {
        // Implement your quick buy logic here, or open a relevant page
        window.open(`https://app.zerion.io/search?q=${contract}`, "_blank")
      }
      document.getElementById("open-dexscreener").onclick = () => {
        window.open(`https://dexscreener.com/search?q=${contract}`, "_blank")
      }
    } else if (container) {
      const fallbackDiv = document.createElement("div")
      fallbackDiv.className = "zqb-fallback-message"
      fallbackDiv.textContent =
        "Copy a contract address (0x...) to see quick actions here."
      container.appendChild(fallbackDiv)
    }
  })
})
