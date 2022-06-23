import '../styles/globals.scss'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { Provider } from 'react-redux'
import { store } from '../store/store'
import NextNProgress from "nextjs-progressbar"
import MainLayout from '../components/Layouts/MainLayout'

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {

  return <SessionProvider session={session}>
    <Provider store={store}>
      <MainLayout >
        <NextNProgress color="#ff4d4f" height={2} showOnShallow={false} />
        <Component {...pageProps} />
      </MainLayout>
    </Provider>
  </SessionProvider >
}

export default MyApp
