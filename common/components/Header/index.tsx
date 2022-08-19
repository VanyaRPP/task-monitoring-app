import Link from 'next/link'
import { Button, Empty, Layout, Popover } from 'antd'
import LoginUser from '../LoginUser'
import ThemeSwitcher from '../UI/ThemeSwitcher'
import { AppRoutes } from 'utils/constants'
import s from './style.module.scss'
import { useSession } from 'next-auth/react'
import Router, { useRouter } from 'next/router'
import BurgerMenu from '../BurgerMenu'
import Diamant from '../../assets/svg/diamant'
import Logo from '../Logo'
import NotificationOutlined from '@ant-design/icons/lib/icons/NotificationOutlined'
import ExclamationCircleFilled from '@ant-design/icons/lib/icons/ExclamationCircleFilled'
import NotificationWrapper from '../NotificationWrapper'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import {
  useGetNotificationsByUserIdQuery,
  useUpdateNotificationStatusByIdMutation,
} from '@common/api/notificationApi/notification.api'
import { INotification } from '@common/modules/models/Notification'

const Notification = ({ url, text }: { url: string; text: string }) => {
  const router = useRouter()
  const [updateNotificationStatusById] =
    useUpdateNotificationStatusByIdMutation()

  const handleClick = async () => {
    await updateNotificationStatusById({ isSeen: true })
    router.push(url)
  }

  return (
    <div className={s.Notification} onClick={handleClick}>
      <div className={s.NotificationIcon}>
        <ExclamationCircleFilled />
      </div>
      <div className={s.NotificationText}>{text}</div>
    </div>
  )
}

const Header: React.FC = () => {
  const { status, data: session } = useSession()
  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const { data: notificationData } = useGetNotificationsByUserIdQuery(
    userData?.data?._id
  )

  return (
    <Layout.Header className={s.Header}>
      <BurgerMenu />
      <div className={s.Item}>
        <Logo />
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
        <Popover
          placement="bottomRight"
          content={
            notificationData?.data?.length === 0 ? (
              <Empty />
            ) : (
              <NotificationWrapper userId={userData?.data?._id}>
                {notificationData?.data?.map((notification: INotification) => (
                  <Notification
                    key={notification?._id}
                    url={notification?.url}
                    text={notification?.text}
                  />
                ))}
              </NotificationWrapper>
            )
          }
          trigger="click"
        >
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
