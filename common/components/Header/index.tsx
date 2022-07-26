import Link from 'next/link'
import { Button, Layout } from 'antd'
import LoginUser from '../LoginUser'
import ThemeSwitcher from '../UI/ThemeSwitcher'
import TaskButton from '../UI/Buttons/TaskButton'
import { AppRoutes } from 'utils/constants'
import s from './style.module.scss'
import { useSession } from 'next-auth/react'
import Router from 'next/router'
import BurgerMenu from '../BurgerMenu'
import Diamant from '../../assets/svg/diamant'
import LogoCircle from '../../assets/svg/logo_circle'
import Logo from '../Logo'

const Header: React.FC = () => {
  const { status } = useSession()

  return (
    <Layout.Header className={s.Header}>
      <BurgerMenu />
      <div className={s.Item}>
        <Logo />
        <TaskButton />
        <div className={s.ThemeSwitcher}>
          <ThemeSwitcher />
        </div>
      </div>
      {status === 'authenticated' && (
        <Button
          icon={<Diamant className={s.Diamant} />}
          className={s.Button_Premium}
          type="primary"
          onClick={() => Router.push(AppRoutes.PREMIUM)}
        >
          <span>Преміум</span>
        </Button>
      )}
      <div className={s.LoginUser}>
        <LoginUser />
      </div>
    </Layout.Header>
  )
}

export default Header
