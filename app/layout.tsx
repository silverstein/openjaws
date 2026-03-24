import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Beach Panic: Jaws Royale",
  description: "A chaotic multiplayer survival party game where an AI-powered shark hunts beachgoers. 6 characters, 6 shark personalities, and terrible dad jokes.",
  openGraph: {
    title: "Beach Panic: Jaws Royale",
    description: "Survive the AI shark. Complete challenges. Don't get eaten.",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overscroll-none`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  )
}
