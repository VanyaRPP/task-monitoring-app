import '../styles/globals.scss'
import '@styles/antd-override.scss'
import { ConfigProvider, Empty } from 'antd'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { Provider } from 'react-redux'
import { store } from '../common/modules/store/store'
import NextNProgress from 'nextjs-progressbar'
import MainLayout from '../common/components/Layouts/MainLayout'

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        <MainLayout>
          <NextNProgress
            color="var(--primaryColor)"
            height={2}
            showOnShallow={false}
          />
          <ConfigProvider
            renderEmpty={() => (
              <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          >
            <Component {...pageProps} />
          </ConfigProvider>
        </MainLayout>
      </Provider>
    </SessionProvider>
  )
}
