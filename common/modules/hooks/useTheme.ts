import { useEffect, useState } from 'react'
import { ConfigProvider } from 'antd'
import { useAppDispatch } from '../store/hooks'
import { themeSlice } from 'common/modules/store/reducers/ThemeSlice'
import themes from '../../lib/themes.config'

function getDefaultTheme() {
  let systemColorScheme
  if (typeof window !== 'undefined') {
    systemColorScheme = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
  } // user system/browser theme (color scheme)

  let theme = systemColorScheme ? 'dark' : 'light'

  if (typeof window !== 'undefined') {
    theme = JSON.parse(localStorage.getItem('theme'))
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
