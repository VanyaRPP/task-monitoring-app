import { SunFilled, SunOutlined } from '@ant-design/icons'
import useTheme from '@modules/hooks/useTheme'
import { Button } from 'antd'
import React from 'react'

const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useTheme()

  return (
    <Button
      icon={theme === 'light' ? <SunFilled /> : <SunOutlined />}
      size="large"
      shape="circle"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    />
  )
}

export default ThemeSwitcher
