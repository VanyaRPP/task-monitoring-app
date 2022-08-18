import Link from 'next/link'
import { Button, Layout, Popover } from 'antd'
import LoginUser from '../LoginUser'
import ThemeSwitcher from '../UI/ThemeSwitcher'
import { AppRoutes } from 'utils/constants'
import s from './style.module.scss'
import { useSession } from 'next-auth/react'
import Router from 'next/router'
import BurgerMenu from '../BurgerMenu'
import Diamant from '../../assets/svg/diamant'
import Logo from '../Logo'
import NotificationOutlined from '@ant-design/icons/lib/icons/NotificationOutlined'
import ExclamationCircleFilled from '@ant-design/icons/lib/icons/ExclamationCircleFilled'
import { useMemo } from 'react'

const Notification = ({ text }: { text: string }) => {
  return (
    <div className={s.Notification}>
      <div className={s.notificationIcon}>
        <ExclamationCircleFilled />
      </div>
      <div className={s.notificationText}>{text}</div>
    </div>
  )
}

const Header: React.FC = () => {
  const { status } = useSession()

  const content = useMemo(() => {
    /*
      return notifications.map(item => <Notification key={item.id} {...item} />)
    */
    return <p>Test content</p>
  }, [])

  return (
    <Layout.Header className={s.Header}>
      <BurgerMenu />
      <div className={s.Item}>
        <Logo />
        {/* <TaskButton /> */}
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
      {status === 'authenticated' && (
        <Popover content={content} trigger="click">
          <NotificationOutlined />
        </Popover>
      )}
      <div className={s.LoginUser}>
        <LoginUser />
      </div>
    </Layout.Header>
  )
}

export default Header
