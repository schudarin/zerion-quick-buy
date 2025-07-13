// Fake Token Data Generator
// Generates realistic but random token data for the detailed info popup

class FakeTokenDataGenerator {
  constructor() {
    this.tokenNames = [
      "Hyped Pepe",
      "Moon Doge",
      "Rocket Shiba",
      "Galaxy Cat",
      "Cosmic Frog",
      "Stellar Wolf",
      "Quantum Ape",
      "Nebula Fox",
      "Astro Bunny",
      "Plasma Duck",
      "Cyber Panda",
      "Neon Tiger",
      "Electric Penguin",
      "Atomic Llama",
      "Pixel Bear",
      "Binary Fish",
      "Digital Owl",
      "Crypto Hamster",
      "Blockchain Turtle",
      "Defi Whale",
    ]

    this.priceRanges = {
      low: { min: 0.00001, max: 0.001 },
      medium: { min: 0.001, max: 0.1 },
      high: { min: 0.1, max: 10 },
    }

    this.chartPatterns = [
      "bullish",
      "bearish",
      "sideways",
      "volatile",
      "recovery",
    ]
  }

  generateTokenData(address) {
    // Use address as seed for consistent data per token
    const seed = this.hashCode(address)
    const random = this.seededRandom(seed)

    const name = this.tokenNames[Math.floor(random() * this.tokenNames.length)]
    const symbol = this.generateSymbol(name)
    const priceRange = this.selectPriceRange(random)
    const price = this.generatePrice(priceRange, random)
    const change = this.generatePriceChange(random)
    const volume = this.generateVolume(random)
    const marketCap = this.generateMarketCap(price, random)
    const holders = this.generateHolders(random)
    const age = this.generateAge(random)
    const fdv = marketCap * (1 + random() * 0.5) // FDV slightly higher than market cap

    return {
      name,
      symbol,
      price,
      change,
      volume,
      marketCap,
      fdv,
      holders,
      age,
      contractAddress: address,
      chartData: this.generateChartData(random),
      verified: random() > 0.6, // 40% chance of being verified
    }
  }

  generateSymbol(name) {
    const words = name.split(" ")
    if (words.length === 1) {
      return words[0].substring(0, 4).toUpperCase()
    }
    return words
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
  }

  selectPriceRange(random) {
    const rand = random()
    if (rand < 0.6) return this.priceRanges.low
    if (rand < 0.85) return this.priceRanges.medium
    return this.priceRanges.high
  }

  generatePrice(priceRange, random) {
    const price = priceRange.min + (priceRange.max - priceRange.min) * random()
    return parseFloat(price.toFixed(5))
  }

  generatePriceChange(random) {
    const change = (random() - 0.5) * 40 // Range from -20% to +20%
    return parseFloat(change.toFixed(1))
  }

  generateVolume(random) {
    const volume = 1000 + random() * 500000 // $1K to $500K
    return Math.floor(volume)
  }

  generateMarketCap(price, random) {
    const supply = 1000000 + random() * 999000000 // 1M to 1B tokens
    return Math.floor(price * supply)
  }

  generateHolders(random) {
    const holders = 100 + random() * 50000 // 100 to 50K holders
    return Math.floor(holders)
  }

  generateAge(random) {
    const ageOptions = [
      "2h",
      "5h",
      "1d",
      "3d",
      "1w",
      "2w",
      "1m",
      "3m",
      "6m",
      "1y",
    ]
    return ageOptions[Math.floor(random() * ageOptions.length)]
  }

  generateChartData(random) {
    const points = []
    let currentPrice = 0.5 // Start at middle point

    for (let i = 0; i < 30; i++) {
      const change = (random() - 0.5) * 0.1 // Small random changes
      currentPrice = Math.max(0.1, Math.min(0.9, currentPrice + change))
      points.push(currentPrice)
    }

    return points
  }

  formatPrice(price) {
    if (price >= 1) {
      return `$${price.toFixed(2)}`
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toFixed(5)}`
    }
  }

  formatNumber(num) {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`
    } else {
      return `$${num.toFixed(0)}`
    }
  }

  formatHolders(holders) {
    if (holders >= 1000000) {
      return `${(holders / 1000000).toFixed(1)}M`
    } else if (holders >= 1000) {
      return `${(holders / 1000).toFixed(1)}K`
    } else {
      return holders.toString()
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
window.FakeTokenDataGenerator = FakeTokenDataGenerator
