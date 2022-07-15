import React, { useState, useEffect } from 'react'
import { Switch } from 'antd'
import { BulbOutlined, BulbFilled } from '@ant-design/icons'
import useLocalStorage from '../../../modules/hooks/useLocalStorage'
import themes from '../../../lib/themes.config'
import useTheme from 'common/modules/hooks/useTheme'
import s from './style.module.scss'

const ThemeSwitcher: React.FC = () => {
  let systemColorScheme
  if (typeof window !== 'undefined') {
    systemColorScheme = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
  } // user system/browser theme (color scheme)

  const [theme, setTheme] = useLocalStorage(
    'theme',
    !systemColorScheme ? 'light' : 'dark'
  ) // localStorage theme

  useTheme(theme === 'dark' ? themes.dark : themes.light) // light default

  const [isChecked, setIsChecked] = useState(theme === 'light')
  useEffect(() => {
    setIsChecked(!isChecked)
  }, [isChecked, theme])

  return (
    <Switch
      className={s.ThemeSwitcher}
      checked={isChecked}
      checkedChildren={<BulbOutlined />}
      unCheckedChildren={<BulbFilled />}
      onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    />
  )
}

export default ThemeSwitcher
