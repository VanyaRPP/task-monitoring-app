import '@styles//globals.scss'
import '@styles/antd-override.scss'
import MainLayout from '../common/components/Layouts/MainLayout'
import { ConfigProvider, Empty, theme as antTheme } from 'antd'
import { store } from '../common/modules/store/store'
import { SessionProvider } from 'next-auth/react'
import { lightTheme } from './theme/themeConfig'
import NextNProgress from 'nextjs-progressbar'
import ukUA from 'antd/lib/locale/uk_UA'
import { Provider } from 'react-redux'

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const { darkAlgorithm, defaultAlgorithm } = antTheme

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
            theme={{
              ...lightTheme,
              algorithm: defaultAlgorithm,
            }}
            renderEmpty={() => (
              <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
            locale={ukUA}
          >
            <Component {...pageProps} />
          </ConfigProvider>
        </MainLayout>
      </Provider>
    </SessionProvider>
  )
}
