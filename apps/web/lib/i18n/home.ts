import type homeEn from '../../locales/en/home.json'
import { type Locale } from '../i18n-config'

export type HomeMessages = typeof homeEn

export async function loadHomeMessages(locale: Locale): Promise<HomeMessages> {
  switch (locale) {
    case 'ar': {
      return (await import('../../locales/ar/home.json')).default as HomeMessages
    }
    default: {
      return (await import('../../locales/en/home.json')).default as HomeMessages
    }
  }
}
