// Fake Wallet Data Generator
// Generates realistic but random wallet data for the detailed info popup

class FakeWalletDataGenerator {
  constructor() {
    this.walletNames = [
      "eth_master",
      "crypto_whale",
      "defi_king",
      "nft_collector",
      "yield_farmer",
      "diamond_hands",
      "moon_walker",
      "hodl_lord",
      "liquidity_provider",
      "gas_optimizer",
      "alpha_hunter",
      "degen_trader",
      "protocol_dev",
      "treasury_dao",
      "bridge_user",
      "staking_pro",
      "arbitrage_bot",
      "validator_node",
      "mempool_surfer",
      "flashloan_expert",
    ]

    this.balanceRanges = {
      small: { min: 0.1, max: 5 },
      medium: { min: 5, max: 100 },
      large: { min: 100, max: 5000 },
      whale: { min: 5000, max: 100000 },
    }

    this.avatarColors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FECA57",
      "#FF9FF3",
      "#54A0FF",
      "#5F27CD",
      "#00D2D3",
      "#FF9F43",
      "#10AC84",
      "#EE5A6F",
      "#C44569",
      "#F8B500",
      "#6C5CE7",
    ]

    this.activityPatterns = ["active", "moderate", "quiet", "dormant", "new"]
  }

  generateWalletData(ensName) {
    // Use ENS name as seed for consistent data per wallet
    const seed = this.hashCode(ensName)
    const random = this.seededRandom(seed)

    const walletName =
      this.walletNames[Math.floor(random() * this.walletNames.length)]
    const address = this.generateAddress(random)
    const balanceRange = this.selectBalanceRange(random)
    const balance = this.generateBalance(balanceRange, random)
    const balanceChange = this.generateBalanceChange(random)
    const avatar = this.generateAvatar(ensName, random)
    const timeActive = this.generateTimeActive(random)
    const activityLevel = this.generateActivityLevel(random)
    const followerCount = this.generateFollowerCount(random)

    return {
      ensName,
      walletName,
      address,
      truncatedAddress: this.truncateAddress(address),
      balance,
      balanceChange,
      avatar,
      timeActive,
      activityLevel,
      followerCount,
      chartData: this.generateBalanceChart(random),
      isFollowing: random() > 0.7, // 30% chance already following
      verified: random() > 0.8, // 20% chance of being verified
    }
  }

  generateAddress(random) {
    const chars = "0123456789abcdef"
    let address = "0x"
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(random() * chars.length)]
    }
    return address
  }

  truncateAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`
  }

  selectBalanceRange(random) {
    const rand = random()
    if (rand < 0.4) return this.balanceRanges.small
    if (rand < 0.7) return this.balanceRanges.medium
    if (rand < 0.9) return this.balanceRanges.large
    return this.balanceRanges.whale
  }

  generateBalance(balanceRange, random) {
    const balance =
      balanceRange.min + (balanceRange.max - balanceRange.min) * random()
    return parseFloat(balance.toFixed(3))
  }

  generateBalanceChange(random) {
    const change = (random() - 0.5) * 30 // Range from -15% to +15%
    return parseFloat(change.toFixed(1))
  }

  generateAvatar(ensName, random) {
    const colorIndex = Math.floor(random() * this.avatarColors.length)
    const color = this.avatarColors[colorIndex]
    const initial = ensName.charAt(0).toUpperCase()

    return {
      color,
      initial,
      type: random() > 0.6 ? "pfp" : "initial", // 40% chance of having a profile picture
    }
  }

  generateTimeActive(random) {
    const timeOptions = [
      "2 days",
      "1 week",
      "2 weeks",
      "1 month",
      "3 months",
      "6 months",
      "1 year",
      "2 years",
      "3 years",
      "5+ years",
    ]
    return timeOptions[Math.floor(random() * timeOptions.length)]
  }

  generateActivityLevel(random) {
    const levels = ["Very Active", "Active", "Moderate", "Quiet", "Dormant"]
    return levels[Math.floor(random() * levels.length)]
  }

  generateFollowerCount(random) {
    const count = Math.floor(random() * 10000) // 0 to 10K followers
    return count
  }

  generateBalanceChart(random) {
    const points = []
    let currentBalance = 0.5 // Start at middle point

    for (let i = 0; i < 30; i++) {
      const change = (random() - 0.5) * 0.08 // Smaller changes for balance
      currentBalance = Math.max(0.1, Math.min(0.9, currentBalance + change))
      points.push(currentBalance)
    }

    return points
  }

  formatBalance(balance) {
    if (balance >= 1000) {
      return `${(balance / 1000).toFixed(1)}K ETH`
    } else if (balance >= 1) {
      return `${balance.toFixed(2)} ETH`
    } else {
      return `${balance.toFixed(3)} ETH`
    }
  }

  formatUsdValue(balance) {
    const ethPrice = 2500 // Approximate ETH price for demo
    const usdValue = balance * ethPrice

    if (usdValue >= 1000000) {
      return `$${(usdValue / 1000000).toFixed(1)}M`
    } else if (usdValue >= 1000) {
      return `$${(usdValue / 1000).toFixed(1)}K`
    } else {
      return `$${usdValue.toFixed(0)}`
    }
  }

  formatFollowers(followers) {
    if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}K`
    } else {
      return followers.toString()
    }
  }

  // Simple hash function for seeding
  hashCode(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // Seeded random number generator
  seededRandom(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
  }
}

// Export for use in other modules
window.FakeWalletDataGenerator = FakeWalletDataGenerator
