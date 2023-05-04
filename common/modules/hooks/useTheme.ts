import { useEffect, useState } from 'react'
import { ConfigProvider } from 'antd'
import { useAppDispatch } from '../store/hooks'
import { themeSlice } from '@common/modules/store/reducers/ThemeSlice'
import { COLOR_THEME } from '@utils/constants'
import themes from '../../lib/themes.config'
const colors = [COLOR_THEME.DARK, COLOR_THEME.LIGHT]

function getDefaultTheme() {
  let systemColorScheme
  if (typeof window !== 'undefined') {
    systemColorScheme = window.matchMedia(
      '(prefers-color-scheme: COLOR_THEME.DARK)'
    ).matches
  } // user system/browser theme (color scheme)

  let theme = systemColorScheme ? COLOR_THEME.DARK : COLOR_THEME.LIGHT

  if (typeof window !== 'undefined') {
    var localValue = localStorage.getItem('theme') || 'light'

    if (colors.includes(localValue)) theme = localValue
  }

  return theme
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
    }) // antd
    for (const key in themes[theme]) {
      document.documentElement.style.setProperty(`--${key}`, themes[theme][key])
    } // custom css variables
  }, [theme])

  return [theme, setTheme] as const
}
