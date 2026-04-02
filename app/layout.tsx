import type { Metadata } from 'next'
import { DM_Serif_Display, Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/app/components/Navigation'
import AppFooter from '@/app/components/ui/AppFooter'
import ToastProvider from '@/app/components/ui/ToastProvider'
import ErrorBoundary from '@/app/components/ErrorBoundary'
import { branding as BRAND } from '@/lib/branding'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const dmSerif = DM_Serif_Display({
  variable: '--font-dm-serif',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: {
    default: BRAND.appName,
    template: `%s | ${BRAND.appName}`,
  },
  description: BRAND.description,
  applicationName: BRAND.appName,
  metadataBase: new URL(BRAND.canonicalUrl),
  alternates: {
    canonical: BRAND.canonicalUrl,
  },
  icons: {
    icon: '/branding/icon.png',
    apple: '/branding/icon.png',
    shortcut: '/branding/icon.png',
  },
  // Allow public landing pages to be indexed; protected app pages
  // each override this at the page level (or are served behind auth).
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: BRAND.canonicalUrl,
    siteName: BRAND.appName,
    title: BRAND.appName,
    description: BRAND.description,
    images: [
      {
        url: BRAND.logoUrl,
        width: 512,
        height: 512,
        alt: BRAND.appName,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: BRAND.appName,
    description: BRAND.description,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-stone-900">
        <ToastProvider>
          <ErrorBoundary>
            <Navigation />
            {children}
            <AppFooter />
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  )
}
