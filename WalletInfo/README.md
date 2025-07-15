# Wallet Info Feature

## Overview

The Wallet Info feature allows users to get detailed information about Ethereum wallets by selecting ENS names on any website. It works similarly to the Token Info feature but focuses on wallet-specific data.

## How to Use

1. **Select an ENS name** on any website (e.g., `vitalik.eth`, `ens.eth`, `subdomain.ens.eth`)
2. **Hold Shift** while the text is selected
3. A **popup will appear** showing wallet information

## Supported ENS Formats

- **Primary ENS names**: `vitalik.eth`, `ens.eth`, `unstoppable.eth`
- **ENS subdomains**: `wallet.vitalik.eth`, `treasury.dao.eth`

## Displayed Information

### Avatar

- Colorful circular avatar with initial letter
- Dynamic color based on ENS name
- Glowing animation effect

### Wallet Balance and Progress

- **ETH Balance**: Primary balance in ETH
- **USD Value**: Approximate USD equivalent
- **Balance Change**: Percentage change with positive/negative indicators

### Chart

- **Balance History**: 30-point historical chart
- **Animated Drawing**: Chart draws on popup appearance
- **Color Matching**: Chart color matches avatar color

### Wallet Address

- **Truncated Format**: Shows first 6 and last 4 characters (e.g., `0x1234...abcd`)
- **Monospace Font**: Easy to read format

### Activity Information

- **Time Active**: How long the wallet has been active (e.g., "2 years", "6 months")
- **Activity Level**: Current activity status (Very Active, Active, Moderate, Quiet, Dormant)
- **Followers**: Social following count

## Actions

### Open in Zerion

- Opens the wallet profile in Zerion web app
- URL format: `https://app.zerion.io/profile/{ens-name}`

### Follow/Unfollow

- Toggles follow status for the wallet
- Button text changes based on current state
- Console logging for demo purposes

## Context Menu Integration

Right-click on selected ENS names to access:

- **Get Wallet Info**: Shows the wallet info popup
- **Open Wallet in Zerion**: Directly opens wallet profile

## Technical Implementation

### Detection

- Uses regex patterns to identify valid ENS names
- Supports both primary domains and subdomains
- Case-insensitive matching

### Data Generation

- Fake data generator for demonstration
- Consistent data per ENS name (seeded random)
- Realistic wallet metrics and activity levels

### Styling

- Modern gradient backgrounds
- Smooth animations and transitions
- Responsive design for mobile
- Dynamic color theming based on wallet

## Demo ENS Names to Try

- `vitalik.eth`
- `ens.eth`
- `unstoppable.eth`
- `wallet.example.eth`
- `treasury.dao.eth`

Simply select any of these names on a webpage, hold Shift, and see the wallet info popup in action!
