import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from './components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ECEFA Marketplace',
  description: 'La marketplace de référence en Côte d\'Ivoire - Trouvez tout ce dont vous avez besoin',
  icons: {
    icon: '/logo_ecefa.png',
    shortcut: '/logo_ecefa.png',
    apple: '/logo_ecefa.png',
  },
  themeColor: '#BFC0C0',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}