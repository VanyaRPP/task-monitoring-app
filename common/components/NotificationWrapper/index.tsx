import {
  useDeleteNotificationsByUserIdMutation,
  useUpdateNotificationsStatusByUserIdMutation,
} from '@common/api/notificationApi/notification.api'
import { ReactNode } from 'react'
import config from '@utils/config'
import s from './index.module.scss'

const NotificationWrapper = ({
  children,
  userId,
}: {
  children: ReactNode
  userId: string
}) => {
  const [deleteNotificationsByUserId] = useDeleteNotificationsByUserIdMutation()
  const [updateNotificationsStatusByUserId] =
    useUpdateNotificationsStatusByUserIdMutation()

  const handleClick = async (switcher: boolean) =>
    switcher
      ? await updateNotificationsStatusByUserId({ _id: userId })
      : await deleteNotificationsByUserId({ _id: userId })

  return (
    <div className={s.NotificationWrapper}>
      <div className={s.header}>
        <div onClick={() => handleClick(true)}>
          {config.labels.readAllNotificationsLabel}
        </div>
        <div onClick={() => handleClick(false)}>
          {config.labels.deleteAllNotificationsLabel}
        </div>
      </div>
      <div className={s.body}>{children}</div>
    </div>
  )
}

export default NotificationWrapper
