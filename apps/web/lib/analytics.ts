import mixpanel from 'mixpanel-browser'

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN

let isInitialized = false

export function initAnalytics() {
  if (!MIXPANEL_TOKEN) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[analytics] NEXT_PUBLIC_MIXPANEL_TOKEN is not set; analytics disabled.')
    }
    return
  }

  if (isInitialized) return

  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
  })

  isInitialized = true
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!MIXPANEL_TOKEN || !isInitialized) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[analytics] skipped event', event, properties)
    }
    return
  }

  mixpanel.track(event, properties)
}
