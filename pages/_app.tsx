import '../styles/globals.scss'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { Provider } from 'react-redux'
import { store } from '../store/store'
import MainLayout from '../components/Layouts/MainLayout'

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {

  return <SessionProvider session={session}>
    <Provider store={store}>
      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>
    </Provider>
  </SessionProvider >
}

export default MyApp
