import React from 'react'
import { Switch } from 'antd'
import { BulbOutlined, BulbFilled } from '@ant-design/icons'
import useTheme from 'common/modules/hooks/useTheme'
import s from './style.module.scss'
import { COLOR_THEME } from '@utils/constants'

const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useTheme()

  return (
    <div className={s.tsWrapper}>
      <Switch
        className={s.ThemeSwitcher}
        checked={theme === COLOR_THEME.DARK}
        checkedChildren={<BulbOutlined />}
        unCheckedChildren={<BulbFilled />}
        onChange={() =>
          setTheme(
            theme === COLOR_THEME.LIGHT ? COLOR_THEME.DARK : COLOR_THEME.LIGHT
          )
        }
      />
    </div>
  )
}

export default ThemeSwitcher
