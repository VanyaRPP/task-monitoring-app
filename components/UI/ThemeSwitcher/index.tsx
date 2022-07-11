import React from 'react'
import { Switch } from 'antd'
import { BulbOutlined, BulbFilled } from '@ant-design/icons'
import { useAppSelector, useAppDispatch } from '../../../store/hooks'
import { themeSlice } from '../../../store/reducers/ThemeSlice'
import { ConfigProvider } from 'antd'
import styles from './style.module.scss'

const ThemeSwitcher: React.FC = () => {
  // Change to React.State maybe?
  const { theme } = useAppSelector((state) => state.themeReducer)
  const { changeTheme } = themeSlice.actions
  const dispatch = useAppDispatch()

  ConfigProvider.config({
    theme: {
      primaryColor: theme === 'light' ? '#722ed1' : '#238636',
    },
  })

  return (
    <Switch
      className={styles.ThemeSwitcher}
      checkedChildren={<BulbOutlined />}
      unCheckedChildren={<BulbFilled />}
      onChange={() =>
        dispatch(changeTheme(theme === 'light' ? 'dark' : 'light'))
      }
    />
  )
}

export default ThemeSwitcher
