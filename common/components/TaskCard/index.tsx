import {
  EditOutlined,
  FieldTimeOutlined,
  FireOutlined,
  UserOutlined,
} from '@ant-design/icons'
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
import UserLink from '../UserLink'
import StatusTag from '../UI/StatusTag'
import { getFormattedAddress } from '../../../utils/helpers'
import moment from 'moment'
import classNames from 'classnames'

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
  const lat = task?.address?.geoCode?.lat
  const lng = task?.address?.geoCode?.lng

  const url = `https://maps.google.com/?q=${lat},${lng}`
  const [activeMarker, setActiveMarker] = useState(null)
  const taskDeadline = moment(task?.deadline)
  const currentDate = moment(new Date())
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
<<<<<<< HEAD
                [s.CloseDeadline]: differ <= 1,
              })}
            >
              Виконати до: {dateToDefaultFormat(task?.deadline)}
              {differ <= 1 ? (
                <FireOutlined
                  style={{ paddingLeft: '10px', fontSize: '25px' }}
                />
=======
                [s.CloseDeadline]: differ <= 1 && differ >= 0,
                [s.AfterDeadline]: differ < 0,
              })}
            >
              Виконати до: {dateToDefaultFormat(task?.deadline)}
              {differ <= 1 && differ >= 0 ? (
                <FireOutlined className={s.Icon} />
              ) : differ < 0 ? (
                <FieldTimeOutlined className={s.Icon} />
>>>>>>> origin/dev
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
