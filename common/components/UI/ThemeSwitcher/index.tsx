import React from 'react'
import { Switch } from 'antd'
import { BulbOutlined, BulbFilled } from '@ant-design/icons'
import useTheme from 'common/modules/hooks/useTheme'
import { useAppSelector } from '../../../modules/store/hooks'
import s from './style.module.scss'

const ThemeSwitcher: React.FC = () => {
  const [_, setTheme] = useTheme()

  const { theme } = useAppSelector((state) => state.themeReducer)

  return (
    <Switch
      className={s.ThemeSwitcher}
      checked={theme == 'dark'}
      checkedChildren={<BulbOutlined />}
      unCheckedChildren={<BulbFilled />}
      onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    />
  )
}

export default ThemeSwitcher
