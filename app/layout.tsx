import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Teletext Map',
  description: 'A simple map using teletext characters',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}