import useTheme from '@modules/hooks/useTheme'
import { ConfigProvider, theme as themeConfig } from 'antd'
import { useMemo } from 'react'

export const ThemeProvider: React.FC<{
  children?: React.ReactNode
  pageProps?: { [x: string]: any }
}> = ({ children, pageProps }) => {
  const [theme] = useTheme()

  const algorithm = useMemo(() => {
    return theme === 'dark'
      ? themeConfig.darkAlgorithm
      : themeConfig.defaultAlgorithm
  }, [theme])

  const token = themeConfig.getDesignToken({ algorithm })

  return (
    <ConfigProvider
      theme={{
        algorithm,
        components: {
          Layout: {
            footerBg: token.colorBgContainer,
            headerBg: token.colorBgContainer,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
