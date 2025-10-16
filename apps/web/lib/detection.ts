import type { StockSite } from './stock'

export type SiteIdDetection = {
  site?: string
  id?: string
}

type DetectionRule = {
  site: string
  pattern: RegExp
  derive?: (match: RegExpMatchArray, url: string) => SiteIdDetection | null
}

function matchToDetection(rule: DetectionRule, match: RegExpMatchArray, url: string): SiteIdDetection | null {
  if (rule.derive) return rule.derive(match, url)
  const id = match[1]
  if (!id) return { site: rule.site }
  return { site: rule.site, id }
}

const detectionRules: DetectionRule[] = [
  {
    site: 'shutterstock',
    pattern:
      /shutterstock\.com\/(?:[a-z-]+\/)*(?:image|image-photo|image-vector|image-illustration|image-generated|editorial)\/[a-z0-9-]+-(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'shutterstock',
    pattern: /shutterstock\.com\/(?:[a-z-]+\/)*(?:image|image-photo|image-vector|image-illustration|image-generated|editorial)\/(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'vshutter',
    pattern: /shutterstock\.com\/(?:[a-z-]+\/)?video\/clip-(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'mshutter',
    pattern: /shutterstock\.com\/(?:[a-z-]+\/)?music\/.*track-(\d+)(?:-|$)/i,
  },
  {
    site: 'adobestock',
    pattern: /stock\.adobe\.com\/(?:[^?]*?)(?:asset_id=)?(\d+)(?:[/?&]|$)/i,
  },
  {
    site: 'adobestock',
    pattern: /stock\.adobe\.com\/(?:[a-z]{2}\/)?(?:images|templates|3d-assets|stock-photo|video)\/[\w%.,-]+\/(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'depositphotos',
    pattern: /depositphotos\.com\/(\d+)(?:\/|$)/i,
    derive: (match) => ({ site: 'depositphotos', id: match[1] }),
  },
  {
    site: 'depositphotos',
    pattern: /depositphotos\.com.*?depositphotos_(\d+)/i,
  },
  {
    site: 'depositphotos_video',
    pattern: /depositphotos\.com\/(\d+)\/stock-video/i,
  },
  {
    site: '123rf',
    pattern: /123rf\.com\/(?:photo|free-photo)_?(\d+)_/i,
  },
  {
    site: '123rf',
    pattern: /123rf\.com\/(?:.*)mediapopup=(\d+)/i,
  },
  {
    site: 'istockphoto',
    pattern: /istockphoto\.com\/(?:[a-z-]+\/)*.*?gm([0-9a-z_]+)-(?:[/?]|$)/i,
    derive: (match) => ({ site: 'istockphoto', id: match[1] }),
  },
  {
    site: 'istockphoto',
    pattern: /gettyimages\.com\/(?:[a-z-]+\/)*(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'freepik',
    pattern: /freepik\.com\/(?:[a-z-]+\/)*(?:photo|vector|free-photo|free-vector)\/[a-z0-9-]*_(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'flaticon',
    pattern: /flaticon\.com\/(?:[a-z]{2}\/)?icons?\/.*_(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'flaticonpack',
    pattern: /flaticon\.com\/(?:[a-z]{2}\/)?(?:packs|stickers-pack)\/([a-z0-9-]+)(?:[/?]|$)/i,
    derive: (match) => ({ site: 'flaticonpack', id: match[1] }),
  },
  {
    site: 'envato',
    pattern: /elements\.envato\.com\/[a-z0-9-]+-([A-Z0-9]+)/,
  },
  {
    site: 'dreamstime',
    pattern: /dreamstime\.com\/(?:[a-z-]+-)?image(?:-|)(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'pngtree',
    pattern: /pngtree\.com\/(?:[a-z-]+-)?(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'vectorstock',
    pattern: /vectorstock\.com\/[a-z0-9-]+\/[a-z0-9-]+-(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'motionarray',
    pattern: /motionarray\.com\/[a-z0-9-]+\/[a-z0-9-]+-(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'alamy',
    pattern: /(alamy|alamyimages)\.(?:com|es|de|it|fr)\/(?:[a-z-]+\/)*[a-z0-9-]*-(\d+)(?:\.html|$)/i,
  },
  {
    site: 'storyblocks',
    pattern: /storyblocks\.com\/(?:video|images|audio)\/stock\/[a-z0-9-]+-([a-z0-9_]+)(?:[/?]|$)/i,
  },
  {
    site: 'epidemicsound',
    pattern: /epidemicsound\.com\/(?:track|music|sound-effect|sound-effects)s?\/([a-z0-9-]+)(?:[/?]|$)/i,
  },
  {
    site: 'vecteezy',
    pattern: /vecteezy\.com\/(?:[a-z-]+\/)*(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'rawpixel',
    pattern: /rawpixel\.com\/image\/(\d+)(?:[/?]|$)/i,
  },
  {
    site: 'ui8',
    pattern: /ui8\.net\/(?:[a-z0-9-]+\/){1,2}([a-z0-9-]+)(?:[/?]|$)/i,
    derive: (match) => ({ site: 'ui8', id: match[1] }),
  },
  {
    site: 'iconscout',
    pattern: /iconscout\.com\/(?:[a-z]{2}\/)?[a-z0-9-]+\/([a-z0-9-_]+)(?:[/?]|$)/i,
  },
]

export function detectSiteAndIdFromUrl(url: string, sites: StockSite[] = []): SiteIdDetection | null {
  if (!url) return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const normalizedUrl = parsed.toString()
  const availableSites = new Set(sites.map((s) => s.site))

  for (const rule of detectionRules) {
    const match = normalizedUrl.match(rule.pattern)
    if (!match) continue
    if (availableSites.size > 0 && !availableSites.has(rule.site)) continue
    const result = matchToDetection(rule, match, normalizedUrl)
    if (result && (result.site || result.id)) return result
  }

  return null
}

export const DETECTION_RULES = detectionRules
