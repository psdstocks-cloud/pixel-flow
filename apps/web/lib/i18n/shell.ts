import type shellEn from '../../locales/en/shell.json'
import { type Locale } from '../i18n-config'

export type ShellMessages = typeof shellEn

export async function loadShellMessages(locale: Locale): Promise<ShellMessages> {
  switch (locale) {
    case 'ar': {
      return (await import('../../locales/ar/shell.json')).default as ShellMessages
    }
    default: {
      return (await import('../../locales/en/shell.json')).default as ShellMessages
    }
  }
}
