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

  // Hide contract-actions section in popup; handled by standalone quick actions overlay
  const ca = document.getElementById("contract-actions")
  if (ca) ca.style.display = "none"
})
