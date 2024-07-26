import '@styles/globals.scss'
import '@styles/reset.scss'
import { ConfigProvider, Empty, theme as antTheme } from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import { SessionProvider } from 'next-auth/react'
import NextNProgress from 'nextjs-progressbar'
import { Provider } from 'react-redux'
import { store } from '../common/modules/store/store'
import { lightTheme } from '../theme/themeConfig'

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const { darkAlgorithm, defaultAlgorithm } = antTheme

  return (
    <SessionProvider session={session}>
      <Provider store={store}>
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
      </Provider>
    </SessionProvider>
  )
}
