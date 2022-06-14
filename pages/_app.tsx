import '../styles/globals.sass'
import type { AppProps } from 'next/app'
import MainLayout from '../components/Layouts/MainLayout'
import { Provider } from 'react-redux'
import { store } from '../store/store'

function MyApp({ Component, pageProps }: AppProps) {
  return <Provider store={store}>
    <MainLayout>
      <Component {...pageProps} />
    </MainLayout>
  </Provider>


}

export default MyApp
