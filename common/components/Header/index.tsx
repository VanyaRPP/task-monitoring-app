import Link from 'next/link'
import { Button, Empty, Layout, Popover } from 'antd'
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
import { useEffect, useState } from 'react'
import useLocalStorage from '@common/modules/hooks/useLocalStorage'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { useGetTaskByIdQuery } from '@common/api/taskApi/task.api'

const Notification = ({ id }: { id: string }) => {
  const {data} = useGetTaskByIdQuery(id)
  
  return (
    <div className={s.Notification}>
      <div className={s.NotificationIcon}>
        <ExclamationCircleFilled />
      </div>
      <div className={s.NotificationText}>
        New task: {data?.data?.name}
      </div>
    </div>
  )
}

const Header: React.FC = () => {
  const { status, data: session } = useSession()
  const [notification, setNotification] = useState<number>(0)
  const [storedValue, setValue] = useLocalStorage('service-notifications', {
    total: 0,
    tasks: [],
  })
  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)

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
        <Popover content={<Empty/>} trigger="click">
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
