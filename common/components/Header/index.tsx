import { Layout } from 'antd'
import LoginUser from '../LoginUser'
import ThemeSwitcher from '../UI/ThemeSwitcher'
import Logo from '../Logo'
import s from './style.module.scss'

const Header: React.FC = () => {
  return (
    <Layout.Header className={s.Header}>
      <div className={s.Item}>
        <Logo />
        <ThemeSwitcher />
      </div>

      <div className={s.LoginUser}>
        <LoginUser />
      </div>
    </Layout.Header>
  )
}

export default Header
