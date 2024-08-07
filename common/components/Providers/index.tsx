import { SessionProvider } from '@components/Providers/SessionProvider'
import { StoreProvider } from '@components/Providers/StoreProvider'
import { ThemeProvider } from '@components/Providers/ThemeProvider'
import React from 'react'

export const Providers: React.FC<{
  children?: React.ReactNode
  pageProps?: { [x: string]: any }
}> = ({ children, pageProps }) => {
  return (
    <SessionProvider pageProps={pageProps}>
      <StoreProvider pageProps={pageProps}>
        <ThemeProvider pageProps={pageProps}>{children}</ThemeProvider>
      </StoreProvider>
    </SessionProvider>
  )
}
