type Matcher = {
  match: RegExp
  result: (matches: string[]) => { site: string; id: string }
}

const MATCHERS: Matcher[] = [
  {
    match: /shutterstock\.com\/(?:.*)(?:image-vector|image-photo|image-illustration|image|image-generated|editorial)\/(?:[0-9a-zA-Z-_]*)-([0-9a-z]*)/,
    result: (m) => ({ site: 'shutterstock', id: m[1] }),
  },
  {
    match: /shutterstock\.com\/(?:.*)(?:image-vector|image-photo|image-illustration|image-generated|editorial)\/([0-9a-z]*)/,
    result: (m) => ({ site: 'shutterstock', id: m[1] }),
  },
  {
    match: /stock\.adobe\.com\/(?:..\/|.....\/)(?:images|templates|3d-assets|stock-photo|video)\/(?:[a-zA-Z0-9-%.,]*)\/([0-9]*)/,
    result: (m) => ({ site: 'adobestock', id: m[1] }),
  },
  {
    match: /istockphoto\.com\/(?:.*)gm([0-9A-Z_]*)-/,
    result: (m) => ({ site: 'istockphoto', id: m[1] }),
  },
  {
    match: /freepik\.(?:.*)(?:.*)_([0-9]*)\.htm/,
    result: (m) => ({ site: 'freepik', id: m[1] }),
  },
  {
    match: /elements\.envato\.com(?:.*)\/(?:[0-9a-zA-Z-]*)-([0-9A-Z]*)/,
    result: (m) => ({ site: 'envato', id: m[1] }),
  },
]

export function detectSiteAndIdFromUrl(url: string): { site: string; id: string } | null {
  const trimmedUrl = url.trim()

  for (const matcher of MATCHERS) {
    const result = trimmedUrl.match(matcher.match)
    if (result) {
      const siteAndId = matcher.result(Array.from(result))
      if (siteAndId.site && siteAndId.id) {
        return siteAndId
      }
    }
  }

  const parts = trimmedUrl.split(':')
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { site: parts[0], id: parts[1] }
  }

  return null
}
