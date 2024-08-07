import { SessionProvider as NextSessionProvider } from 'next-auth/react'

export const SessionProvider: React.FC<{
  children?: React.ReactNode
  pageProps?: { [x: string]: any }
}> = ({ children, pageProps }) => {
  return (
    <NextSessionProvider session={pageProps?.session}>
      {children}
    </NextSessionProvider>
  )
}
