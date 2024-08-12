'use client'

import {
  SessionProvider,
  SessionProvider_pages,
} from '@components/Providers/SessionProvider'
import {
  StoreProvider,
  StoreProvider_pages,
} from '@components/Providers/StoreProvider'
import {
  ThemeProvider,
  ThemeProvider_pages,
} from '@components/Providers/ThemeProvider'
import React from 'react'

export const Providers: React.FC<{
  children?: React.ReactNode
}> = ({ children }) => {
  return (
    <SessionProvider>
      <StoreProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </StoreProvider>
    </SessionProvider>
  )
}

/**
 * @deprecated only for pages router and will be replaced in app router
 */
export const Providers_pages: React.FC<{
  children?: React.ReactNode
  pageProps?: { [x: string]: any }
}> = ({ children, pageProps }) => {
  return (
    <SessionProvider_pages pageProps={pageProps}>
      <StoreProvider_pages pageProps={pageProps}>
        <ThemeProvider_pages pageProps={pageProps}>
          {children}
        </ThemeProvider_pages>
      </StoreProvider_pages>
    </SessionProvider_pages>
  )
}
