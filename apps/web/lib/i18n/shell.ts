import type shellEn from '../../locales/en/shell.json'
import { type Locale } from '../i18n-config'

export type ShellMessages = typeof shellEn

export async function loadShellMessages(locale: Locale): Promise<ShellMessages> {
  switch (locale) {
    case 'ar': {
      const module = await import('../../locales/ar/shell.json')
      return module.default as ShellMessages
    }
    default: {
      const module = await import('../../locales/en/shell.json')
      return module.default as ShellMessages
    }
  }
}
