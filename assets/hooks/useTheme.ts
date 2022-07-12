import { useEffect } from 'react'
import { ConfigProvider } from 'antd'

function useTheme(theme) {
  useEffect(() => {
    ConfigProvider.config({
      theme: {
        primaryColor: theme.primaryColor,
      },
    })

    for (const key in theme) {
      document.documentElement.style.setProperty(`--${key}`, theme[key])
    }
  }, [theme])
}

export default useTheme
