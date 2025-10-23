import './globals.css'
import { AppProviders } from './providers'
import { getRequestLocale, getLocaleDirection } from '../lib/i18n/request'
import { loadShellMessages } from '../lib/i18n/shell'
import { LandingHeader } from '../components/LandingHeader'
import { UserProvider } from './providers/UserProvider';

export const metadata = {
  title: 'Pixel Flow',
  description: 'Stock images, AI generation, and design tools',
}

export default function RootLayout({ children }) {
  return (
    <SessionProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </SessionProvider>
  );
}