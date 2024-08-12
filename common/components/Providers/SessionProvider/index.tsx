'use client'

import { SessionProvider as NextSessionProvider } from 'next-auth/react'

export const SessionProvider: React.FC<{
  children?: React.ReactNode
}> = ({ children }) => {
  return <NextSessionProvider>{children}</NextSessionProvider>
}

/**
 * @deprecated only for pages router and will be replaced in app router
 */
export const SessionProvider_pages: React.FC<{
  children?: React.ReactNode
  pageProps?: { [x: string]: any }
}> = ({ children, pageProps }) => {
  return (
    <NextSessionProvider session={pageProps?.session}>
      {children}
    </NextSessionProvider>
  )
}
