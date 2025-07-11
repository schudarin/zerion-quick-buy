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
messageEl.style.color = "#333"

// Try to get token info from background, fallback to content script if needed
chrome.runtime.sendMessage("getTokenInfo", (tokenInfo) => {
  if (tokenInfo) {
    showTokenInfo(tokenInfo)
    messageEl.textContent = ""
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, "getInfo", (resp) => {
        if (resp) {
          showTokenInfo(resp)
          messageEl.textContent = ""
        } else {
          messageEl.textContent = "Could not load token info."
          messageEl.style.color = "red"
        }
      })
    })
  }
})

// Handle swap form submission with validation and feedback
$("swap-form").addEventListener("submit", (e) => {
  e.preventDefault()
  const amount = $("amount").value.trim()
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    messageEl.textContent = "Please enter a valid amount."
    messageEl.style.color = "red"
    return
  }
  // Show success message for demo
  messageEl.textContent = "Swap successful!"
  messageEl.style.color = "green"
  setTimeout(() => {
    messageEl.textContent = ""
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
      container.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold;">Copied contract: <span style="font-family: monospace;">${contract}</span></div>
        <button id="open-zerion">Open in Zerion Web</button>
        <button id="quick-buy">Quick Buy</button>
        <button id="open-dexscreener">View on DexScreener</button>
      `
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
      container.innerHTML =
        '<div style="color: #888;">Copy a contract address (0x...) to see quick actions here.</div>'
    }
  })
})
