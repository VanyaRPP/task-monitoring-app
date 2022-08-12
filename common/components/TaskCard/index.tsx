import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card } from 'antd'
import { useSession } from 'next-auth/react'
import React, { useMemo, useState } from 'react'
import { useDeleteTaskMutation } from '../../api/taskApi/task.api'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import DeleteButton from '../UI/Buttons/DeleteButton'
import { dateToDefaultFormat } from '../../assets/features/formatDate'
import { useRouter } from 'next/router'
import { AppRoutes } from 'utils/constants'
import s from './style.module.scss'
import { InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api'
import Map from '../Map'
import Link from 'next/link'
import UserLink from '../UserLink'
import StatusTag from '../UI/StatusTag'

const TaskCard = ({ taskId, task }) => {
  const router = useRouter()

  const { data: session } = useSession()

  const { data: userData } = useGetUserByIdQuery(`${task?.creator}`, {
    skip: !task,
  })
  const user = userData?.data

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

  const [activeMarker, setActiveMarker] = useState(null)

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
          <p>Адреса: {task?.address?.name}</p>
          <p>Виконати до: {dateToDefaultFormat(task?.deadline)}</p>
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
              </InfoWindow>
            ) : null}
          </Marker>
        </Map>
      </div>
    </Card>
  )
}

export default TaskCard
