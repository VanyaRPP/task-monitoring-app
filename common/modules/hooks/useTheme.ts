import { themeSlice } from '@common/modules/store/reducers/ThemeSlice'
import { ConfigProvider } from 'antd'
import { useEffect, useState } from 'react'
import { COLOR_THEME } from 'utils/constants'
import themes from '../../lib/themes.config'
import { useAppDispatch } from '../store/hooks'

function getDefaultTheme() {
  if (typeof window !== 'undefined') {
    const localValue = JSON.parse(localStorage.getItem('theme')) || ''
    if (localValue) {
      const browserColor = COLOR_THEME[localValue.toUpperCase()]
      if (browserColor) {
        return browserColor // local storage color
      }
    }
    const isDarkColorScheme = window.matchMedia?.(
      '(prefers-color-scheme: dark)'
    ).matches

    return isDarkColorScheme ? COLOR_THEME.DARK : COLOR_THEME.LIGHT // system prefer color
  }

  return COLOR_THEME.LIGHT // default color
}

export default function useTheme(value: string = getDefaultTheme()) {
  const [theme, setTheme] = useState(value)

  const { changeTheme } = themeSlice.actions
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!themes[theme]) return

    // save
    dispatch(changeTheme(theme))
    localStorage.setItem('theme', JSON.stringify(theme))

    //use
    ConfigProvider.config({
      theme: {
        primaryColor: themes[theme].primaryColor,
      },
    })

    // antd
    for (const key in themes[theme]) {
      document.documentElement.style.setProperty(`--${key}`, themes[theme][key])
    } // custom css variables
  }, [theme, changeTheme, dispatch])

  return [theme, setTheme] as const
}
