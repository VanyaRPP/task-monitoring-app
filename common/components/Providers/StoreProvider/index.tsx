'use client'

import { store } from '@modules/store/store'
import { Provider } from 'react-redux'

export const StoreProvider: React.FC<{
  children?: React.ReactNode
}> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>
}

/**
 * @deprecated only for pages router and will be replaced in app router
 */
export const StoreProvider_pages: React.FC<{
  children?: React.ReactNode
  pageProps?: { [x: string]: any }
}> = ({ children, pageProps }) => {
  return <Provider store={store}>{children}</Provider>
}
