import { Badge, Button, Empty, Layout, Popover } from 'antd'
import LoginUser from '../LoginUser'
import ThemeSwitcher from '../UI/ThemeSwitcher'
import { AppRoutes } from 'utils/constants'
import { useSession } from 'next-auth/react'
import Router, { useRouter } from 'next/router'
import BurgerMenu from '../BurgerMenu'
import Diamant from '../../assets/svg/diamant'
import Logo from '../Logo'
import NotificationWrapper from '../NotificationWrapper'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import {
  useGetNotificationsByUserIdQuery,
  useUpdateNotificationStatusByIdMutation,
} from '@common/api/notificationApi/notification.api'
import { INotification } from '@common/modules/models/Notification'
import Circle from '@common/assets/svg/circle'
import config from '@utils/config'
import { useMemo } from 'react'
import {
  NotificationActive,
  NotificationInactive,
} from '@common/assets/svg/notification'
import s from './style.module.scss'

const Notification = ({
  id,
  isSeen,
  url,
  text,
}: {
  id: string
  isSeen: boolean
  url: string
  text: string
}) => {
  const router = useRouter()
  const [updateNotificationStatusById] =
    useUpdateNotificationStatusByIdMutation()

  const handleClick = async () => {
    await updateNotificationStatusById({ _id: id })
    router.push(url)
  }

  return (
    <div className={s.Notification} onClick={handleClick}>
      <div className={s.NotificationIcon}>
        <Circle width={8} height={8} color={!isSeen ? '#61e279' : '#5b5b5b'} />
      </div>
      <div className={s.NotificationText}>{text}</div>
    </div>
  )
}

const Header: React.FC = () => {
  const { status, data: session } = useSession()
  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const { data: notificationData } = useGetNotificationsByUserIdQuery(
    userData?.data?._id as string
  )

  const unreadNotificationsExist = useMemo(() => {
    if (notificationData?.data) {
      let check = false
      notificationData?.data?.forEach((notification: INotification) => {
        if (!check && !notification?.isSeen) check = true
      })

      return check
    }

    return false
  }, [notificationData?.data])

  return (
    <Layout.Header className={s.Header}>
      <BurgerMenu />
      <div className={s.Item}>
        <Logo />
        <div className={s.ThemeSwitcher}>
          <ThemeSwitcher />
        </div>
      </div>
      {/* {status === 'authenticated' && (
        <Button
          icon={<Diamant className={s.Diamant} />}
          className={s.Button_Premium}
          type="primary"
          onClick={() => Router.push(AppRoutes.PREMIUM)}
        >
          <span>{config.titles.premium}</span>
        </Button>
      )} */}
      {/* {status === 'authenticated' && (
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
                    id={notification?._id}
                    url={notification?.url}
                    text={notification?.text}
                    isSeen={notification?.isSeen}
                  />
                ))}
              </NotificationWrapper>
            )
          }
          trigger="click"
        >
          {unreadNotificationsExist ? (
            <NotificationActive
              style={{ cursor: 'pointer' }}
              height={30}
              width={30}
            />
          ) : (
            <NotificationInactive
              style={{ cursor: 'pointer' }}
              height={30}
              width={30}
            />
          )}
        </Popover>
      )} */}
      <div className={s.LoginUser}>
        <LoginUser />
      </div>
    </Layout.Header>
  )
}

export default Header
