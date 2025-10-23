/**
 * Parse stock URLs to extract site and ID
 */
export interface ParsedStockURL {
  site: string
  id: string
  url: string
  valid: boolean
}

export function parseStockURL(url: string): ParsedStockURL | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.replace('www.', '')

    // Adobe Stock
    if (hostname.includes('stock.adobe.com')) {
      const match = url.match(/\/(\d+)/)
      if (match) return { site: 'adobestock', id: match[1], url, valid: true }
    }

    // Shutterstock
    if (hostname.includes('shutterstock.com')) {
      const match = url.match(/image-photo\/[^\/]+-(\d+)/) || url.match(/\/(\d+)/)
      if (match) return { site: 'shutterstock', id: match[1], url, valid: true }
    }

    // Freepik
    if (hostname.includes('freepik.com')) {
      const match = url.match(/free-(?:photo|vector)\/[^\/]+-(\d+)/) || url.match(/\/(\d+)/)
      if (match) return { site: 'freepik', id: match[1], url, valid: true }
    }

    // 123RF
    if (hostname.includes('123rf.com')) {
      const match = url.match(/photo_(\d+)/) || url.match(/\/(\d+)/)
      if (match) return { site: '123rf', id: match[1], url, valid: true }
    }

    // iStock
    if (hostname.includes('istockphoto.com')) {
      const match = url.match(/\/photo\/[^\/]+-gm(\d+)/) || url.match(/\/(\d+)/)
      if (match) return { site: 'istock', id: match[1], url, valid: true }
    }

    // Pngtree (requires full URL)
    if (hostname.includes('pngtree.com')) {
      const match = url.match(/\/(\d+)/)
      if (match) return { site: 'pngtree', id: match[1], url, valid: true }
    }

    // Storyblocks (requires full URL)
    if (hostname.includes('storyblocks.com')) {
      const match = url.match(/\/(\d+)/)
      if (match) return { site: 'storyblocks', id: match[1], url, valid: true }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Check if site requires full URL parameter
 */
export function requiresFullURL(site: string): boolean {
  return ['pngtree', 'storyblocks'].includes(site.toLowerCase())
}

/**
 * Validate multiple URLs
 */
export function validateURLs(urls: string[]): {
  valid: ParsedStockURL[]
  invalid: string[]
} {
  const valid: ParsedStockURL[] = []
  const invalid: string[] = []

  urls.forEach((url) => {
    const parsed = parseStockURL(url)
    if (parsed) {
      valid.push(parsed)
    } else {
      invalid.push(url)
    }
  })

  return { valid, invalid }
}
