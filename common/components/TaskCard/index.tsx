import {
  EditOutlined,
  FieldTimeOutlined,
  FireOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { dateToDefaultFormat } from '@assets/features/formatDate'
import DeleteButton from '@components/UI/Buttons/DeleteButton'
import StatusTag from '@components/UI/StatusTag'
import { InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api'
import { getFormattedAddress } from '@utils/helpers'
import { Avatar, Button, Card } from 'antd'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDeleteTaskMutation } from '../../api/taskApi/task.api'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import Map from '../Map'
import UserLink from '../UserLink'
import s from './style.module.scss'

const TaskCard = ({ taskId, task }) => {
  const router = useRouter()

  const { data: session } = useSession()

  const { data: user } = useGetUserByIdQuery(`${task?.creator}`, {
    skip: !task,
  })
  const [libraries] = useState(['places'] as any)
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  const [deleteTask] = useDeleteTaskMutation()

  const taskDelete = (id) => {
    deleteTask(id)
    // router.push(AppRoutes.TASK)
    router.push(`/task/user/${user?._id}`)
  }

  const Actions = [
    <Button key="edit" type="primary">
      <EditOutlined />
    </Button>,
    <DeleteButton key="delete" onDelete={() => taskDelete(taskId)} />,
  ]

  const mapOptions = useMemo(() => {
    return {
      geoCode: task?.address.geoCode,
      zoom: task?.address ? 17 : 12,
    }
  }, [task?.address])
  const lat = task?.address?.geoCode?.lat
  const lng = task?.address?.geoCode?.lng

  const url = `https://maps.google.com/?q=${lat},${lng}`
  const [activeMarker, setActiveMarker] = useState(null)
  const taskDeadline = dayjs(task?.deadline)
  const currentDate = dayjs(new Date())
  const differ = taskDeadline.diff(currentDate, 'days')

  return (
    <Card className={s.Card}>
      <div className={s.Half}>
        <div className={s.UserInfo}>
          <Avatar
            icon={<UserOutlined />}
            size={200}
            src={!task?.customer ? user?.image : null}
          />
          <h2>{!task?.customer ? <UserLink user={user} /> : task?.customer}</h2>
        </div>
        <Card
          className={s.TaskInfo}
          title={task?.name}
          actions={session?.user?.email === user?.email && Actions}
          extra={<StatusTag status={task?.status} />}
        >
          <p className={s.Description}>Опис: {task?.description}</p>
          <p>Категорія: {task?.category}</p>
          <p>Адреса: {getFormattedAddress(task?.address?.name)}</p>
          <div className={s.DeadlineBlock}>
            <p
              className={classNames(s.Deadline, {
                [s.CloseDeadline]: differ <= 1 && differ >= 0,
                [s.AfterDeadline]: differ < 0,
              })}
            >
              Виконати до: {dateToDefaultFormat(task?.deadline)}
              {differ <= 1 && differ >= 0 ? (
                <FireOutlined className={s.Icon} />
              ) : differ < 0 ? (
                <FieldTimeOutlined className={s.Icon} />
              ) : null}
            </p>
          </div>
        </Card>
      </div>

      <div className={s.TaskInfo}>
        <Map isLoaded={isLoaded} mapOptions={mapOptions}>
          <Marker
            position={mapOptions?.geoCode}
            onClick={() => setActiveMarker(true)}
          >
            {activeMarker ? (
              <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                <div>{task?.address?.name}</div>
                <a href={url}>Перейти в Google Maps</a>
              </InfoWindow>
            ) : null}
          </Marker>
        </Map>
      </div>
    </Card>
  )
}

export default TaskCard
