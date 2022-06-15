import '../styles/globals.sass'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import MainLayout from '../components/Layouts/MainLayout'
import { Provider } from 'react-redux'
import { store } from '../store/store'

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return <Provider store={store}>
    <SessionProvider session={session}>
      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>
    </SessionProvider>

  </Provider>


}

export default MyApp
