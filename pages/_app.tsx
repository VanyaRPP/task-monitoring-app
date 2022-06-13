import '../styles/globals.sass'
import type { AppProps } from 'next/app'
import MainLayout from '../components/Layouts/MainLayout'

function MyApp({ Component, pageProps }: AppProps) {
  return <MainLayout>
    <Component {...pageProps} />
  </MainLayout>

}

export default MyApp
