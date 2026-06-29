'use client'

import useTheme from '@modules/hooks/useTheme'
import { ConfigProvider, theme as themeConfig, App } from 'antd'
import { useMemo, useState, useEffect } from 'react'

export const ThemeProvider: React.FC<{
  children?: React.ReactNode
}> = ({ children }) => {
  const [theme] = useTheme()
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true)
    const handleAfterPrint = () => setIsPrinting(false)

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  const algorithm = useMemo(() => {
    if (isPrinting) return themeConfig.defaultAlgorithm
    return theme === 'dark'
      ? themeConfig.darkAlgorithm
      : themeConfig.defaultAlgorithm
  }, [theme, isPrinting])

  const token = themeConfig.getDesignToken({ algorithm })

  return (
    <ConfigProvider
      theme={{
        algorithm,
        token: {
          colorPrimary: '#722ed1',
          colorInfo: '#722ed1',
          fontSize: 16,
        },
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

/**
 * @deprecated only for pages router and will be replaced in app router
 */
export const ThemeProvider_pages: React.FC<{
  children?: React.ReactNode
  pageProps?: { [x: string]: any }
}> = ({ children, pageProps }) => {
  const [theme] = useTheme()
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true)
    const handleAfterPrint = () => setIsPrinting(false)

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  const algorithm = useMemo(() => {
    if (isPrinting) return themeConfig.defaultAlgorithm
    return theme === 'dark'
      ? themeConfig.darkAlgorithm
      : themeConfig.defaultAlgorithm
  }, [theme, isPrinting])

  const token = themeConfig.getDesignToken({ algorithm })

  return (
    <ConfigProvider
      theme={{
        algorithm,
        token: {
          colorPrimary: '#722ed1',
          colorInfo: '#722ed1',
          fontSize: 16,
        },
        components: {
          Layout: {
            footerBg: token.colorBgContainer,
            headerBg: token.colorBgContainer,
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}
