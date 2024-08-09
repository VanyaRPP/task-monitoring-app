import { Providers } from '@components/Providers'
import '@styles/globals.scss'
import '@styles/reset.scss'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
