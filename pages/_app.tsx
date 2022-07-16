import '../styles/globals.scss'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { Provider } from 'react-redux'
import { store } from '../common/modules/store/store'
import NextNProgress from 'nextjs-progressbar'
import MainLayout from '../common/components/Layouts/MainLayout'
import themes from 'common/lib/themes.config'

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        <MainLayout>
          <NextNProgress color="#722ed1" height={2} showOnShallow={false} />
          <Component {...pageProps} />
        </MainLayout>
      </Provider>
    </SessionProvider>
  )
}
