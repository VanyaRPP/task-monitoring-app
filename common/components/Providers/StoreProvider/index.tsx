import { store } from '@modules/store/store'
import { Provider } from 'react-redux'

export const StoreProvider: React.FC<{
  children?: React.ReactNode
  pageProps?: { [x: string]: any }
}> = ({ children, pageProps }) => {
  return <Provider store={store}>{children}</Provider>
}
