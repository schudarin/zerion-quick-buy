# Quick Buy with Zerion - Browser Extension

A Chrome browser extension that adds Zerion quick buy functionality to cryptocurrency token pages, providing streamlined access to token swaps and information.

## 🚀 Features

- **Smart Banner Integration**: Automatically detects token pages on supported sites and injects a customizable Zerion banner
- **Quick Actions Window**: Appears when copying contract addresses from any website
- **Context Menu Integration**: Right-click on contract addresses for quick actions
- **Multi-Chain Support**: Works with Ethereum, Base, and Solana networks
- **Responsive Design**: Adapts to different screen sizes and can be dragged/resized
- **Copy Detection**: Automatically detects when cryptocurrency contract addresses are copied

## 🌐 Supported Websites

- **DexScreener**: `dexscreener.com` (Ethereum, Base, Solana)
- **Interface.social**: `app.interface.social` (Multi-chain token pages)
- **Universal Copy Detection**: Works on any website when contract addresses are copied

## 📁 Project Structure

```
zerion-inj/
├── manifest.json           # Extension manifest (permissions, content scripts, etc.)
├── background.js           # Service worker for message handling and context menus
├── content.js             # Main content script with grain texture injection
├── Banner/
│   ├── zqb-banner.js       # Banner creation and management (1100+ lines)
│   ├── zqb-utils.js        # Shared utilities (parseInfo, isValidContract)
│   └── zqb-banner.css      # Banner styling and animations
├── Popup/
│   ├── popup.html          # Extension popup interface
│   ├── popup.js            # Popup logic and UI handling
│   └── popup.css           # Popup styling
├── QuickActions/
│   ├── quick-actions.js    # Shared quick actions overlay functionality
│   └── copy-listener.js    # Detects copied contract addresses globally
└── icons/                  # Extension icons (16px, 32px, 48px, 128px)
```

## 🏗️ Architecture Overview

### Core Components

#### 1. **Background Script** (`background.js`)

- **Service Worker**: Handles extension lifecycle and message passing
- **Token Cache**: Maintains per-tab token information cache
- **Context Menus**: Creates right-click menus for contract addresses
- **Message Routing**: Coordinates communication between content scripts and popup

#### 2. **Content Scripts**

- **Main Content Script** (`content.js`): Injects grain texture, handles page-specific logic
- **Banner Module** (`Banner/zqb-banner.js`): Creates and manages the Zerion banner UI
- **Copy Listener** (`QuickActions/copy-listener.js`): Detects contract address copying on all websites
- **Quick Actions** (`QuickActions/quick-actions.js`): Provides floating action window

#### 3. **Popup Interface**

- **HTML** (`Popup/popup.html`): Clean, modern interface for token interactions
- **JavaScript** (`Popup/popup.js`): Handles form submission and token info display
- **CSS** (`Popup/popup.css`): Modern styling with gradients and animations

#### 4. **Utilities** (`Banner/zqb-utils.js`)

- **Token Parsing**: Extracts token info from URLs and DOM
- **Validation**: Validates contract addresses for different networks
- **Chain Mapping**: Maps chain IDs to network names

## 🛠️ Development Guide

### Key Functions and APIs

#### Token Information Parsing

```javascript
// From Banner/zqb-utils.js
const tokenInfo = parseInfo() // Returns { network, contract, name, symbol }
const isValid = isValidContract(tokenInfo) // Validates token info
```

#### Banner Creation

```javascript
// From Banner/zqb-banner.js
createZerionBanner(tokenInfo) // Creates and injects banner
```

#### Quick Actions

```javascript
// From QuickActions/quick-actions.js
window.injectQuickActionsWindow(contractAddress) // Shows floating actions
```

### Message Passing

The extension uses Chrome's message passing API for communication:

```javascript
// Content script to background
chrome.runtime.sendMessage(tokenInfo, (response) => {
  // Handle response
})

// Background to popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Handle messages
})
```

### Adding New Supported Sites

1. **Update manifest.json**:

   ```json
   {
     "content_scripts": [
       {
         "matches": ["https://newsite.com/*"],
         "js": [
           "Banner/zqb-utils.js",
           "QuickActions/quick-actions.js",
           "Banner/zqb-banner.js",
           "content.js"
         ]
       }
     ]
   }
   ```

2. **Update parsing logic** in `Banner/zqb-utils.js`:
   ```javascript
   if (host === "newsite.com") {
     // Add parsing logic for the new site
   }
   ```

### Styling and Theming

The extension uses CSS custom properties for theming:

```css
:root {
  --zerion-network-color: #2063ff; /* Dynamic based on network */
  --zqb-noise-texture: url(...); /* Grain texture */
}
```

Network-specific colors:

- **Ethereum**: `#2063ff`
- **Base**: `#2063ff`
- **Solana**: `#6c2eb7`

## 📊 Banner Features

### Interactive Elements

- **Draggable**: Banner can be moved around the screen
- **Resizable**: Handles on left/right for width adjustment
- **Responsive**: Adapts layout for small screens
- **Options Menu**: Dropdown with settings and actions
- **Auto-hide**: Automatically hides after period of inactivity

### Customization

- **Position Memory**: Remembers last position via localStorage
- **Size Persistence**: Maintains custom dimensions
- **Network Theming**: Colors adapt to detected network
- **Visibility Controls**: Can be temporarily hidden or restored

## 🔍 Supported Networks & Validation

### Contract Address Formats

- **Ethereum**: `0x[40 hex chars]` - Standard ERC-20 token contract addresses
- **Base**: `0x[40 hex chars]` or `0x[64 hex chars]` - Base supports both standard 40-character addresses and extended 64-character addresses. The 64-character format is used for certain token implementations and cross-chain bridge contracts that require additional data encoding within the address itself.
- **Solana**: `[32-44 alphanumeric chars]` - Base58-encoded addresses using Solana's address format

### Chain ID Mappings

The extension supports multiple EVM chains via Interface.social by mapping chain IDs to network names. This is necessary because Interface.social uses numerical chain IDs in their URLs (e.g., `/token/8453/0x...`) rather than network names like DexScreener uses. The mapping converts these chain IDs to human-readable network names that the extension can process:

- **Ethereum (1)**, **Base (8453)**, **Polygon (137)**, **Optimism (10)**
- **Arbitrum (42161)**, **BSC (56)**, **Avalanche (43114)**, and more

This allows the extension to work seamlessly across different sites that use different URL structures for the same networks.

## 🎨 UI/UX Features

### Modern Design

- **Gradient Backgrounds**: Network-specific color schemes
- **Grain Texture**: Subtle noise texture for visual depth
- **Smooth Animations**: Fade in/out, hover effects, and transitions
- **Accessibility**: ARIA labels, keyboard navigation support

### Responsive Behavior

- **Mobile-friendly**: Adapts to smaller screens
- **Flexible Layout**: Wraps content on narrow viewports
- **Touch-friendly**: Appropriate button sizes and spacing

## 🚨 Error Handling

The extension includes comprehensive error handling:

- **Network Validation**: Ensures supported networks
- **Contract Validation**: Validates address formats
- **Fallback Parsing**: Multiple strategies for extracting token info
- **Graceful Degradation**: Continues working even if some features fail

## 🧪 Testing Checklist

- [ ] Test on DexScreener (Ethereum, Base, Solana)
- [ ] Test on Interface.social
- [ ] Test copy detection on various websites
- [ ] Test context menu functionality
- [ ] Test popup interface
- [ ] Test responsive behavior
- [ ] Test error scenarios

## 🔗 Related Links

- [Zerion](https://zerion.io/) - The DeFi portfolio manager
- [DexScreener](https://dexscreener.com/) - DEX trading analytics
- [Interface.social](https://app.interface.social/) - Social token platform
