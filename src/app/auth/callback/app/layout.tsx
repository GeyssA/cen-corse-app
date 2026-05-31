import type { Metadata, Viewport } from 'next'
import OAuthAppBridgeLayout from './OAuthAppBridgeLayout'

export const metadata: Metadata = {
  title: 'Connexion — CEN Corse',
  description: 'Connexion à l’application CEN Corse',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#020617',
  colorScheme: 'dark',
}

export default function AuthCallbackAppLayout({ children }: { children: React.ReactNode }) {
  return <OAuthAppBridgeLayout>{children}</OAuthAppBridgeLayout>
}
