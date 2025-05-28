import { MoonOutlined, SunFilled } from '@ant-design/icons'
import type { FloatButtonItem } from '@components/Layouts/Main/FloatButtonsLayoutAddon'
import useTheme from '@modules/hooks/useTheme'
import React from 'react'

export const useThemeFloatButton = (): FloatButtonItem => {
  const [theme, setTheme] = useTheme()

  return {
    key: 'theme',
    icon: theme === 'light' ? <MoonOutlined /> : <SunFilled />,
    tooltip: `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`,
    onClick: () => setTheme(theme === 'light' ? 'dark' : 'light'),
  }
}
