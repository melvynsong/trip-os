import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/app/components/Navigation";
import DeploymentFooter from "@/app/components/DeploymentFooter";
import ToastProvider from "@/app/components/ui/ToastProvider";
import { branding as BRAND } from "@/lib/branding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: BRAND.appName,
    template: `%s | ${BRAND.shortName}`,
  },
  description: BRAND.description,
  metadataBase: new URL(BRAND.siteUrl),
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-snippet': -1,
      'max-image-preview': 'none',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: BRAND.siteUrl,
    siteName: BRAND.appName,
    title: BRAND.appName,
    description: BRAND.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <Navigation />
          {children}
          <DeploymentFooter />
        </ToastProvider>
      </body>
    </html>
  );
}
