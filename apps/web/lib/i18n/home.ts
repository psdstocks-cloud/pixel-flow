import type homeEn from '../../locales/en/home.json'
import { type Locale } from '../i18n-config'

export type HomeMessages = typeof homeEn

export async function loadHomeMessages(locale: Locale): Promise<HomeMessages> {
  switch (locale) {
    case 'ar': {
      const module = await import('../../locales/ar/home.json')
      return module.default as HomeMessages
    }
    default: {
      const module = await import('../../locales/en/home.json')
      return module.default as HomeMessages
    }
  }
}
