import React from 'react'
import { Switch } from 'antd'
import { BulbOutlined, BulbFilled } from '@ant-design/icons'
import { useAppSelector, useAppDispatch } from '../../../store/hooks'
import styles from './style.module.scss'
import { themeSlice } from '../../../store/reducers/ThemeSlice'

const ThemeSwitcher: React.FC = () => {
  const { theme } = useAppSelector((state) => state.themeReducer)
  const { changeTheme } = themeSlice.actions
  const dispatch = useAppDispatch()

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
