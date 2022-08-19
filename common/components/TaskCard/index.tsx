import {
  ConsoleSqlOutlined,
  EditOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Form } from 'antd'
import { useSession } from 'next-auth/react'
import React, { useMemo, useState } from 'react'
import {
  useDeleteTaskMutation,
  useEditTaskMutation,
} from '../../api/taskApi/task.api'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import DeleteButton from '../UI/Buttons/DeleteButton'
import { dateToDefaultFormat } from '../../assets/features/formatDate'
import { useRouter } from 'next/router'
import { AppRoutes } from 'utils/constants'
import s from './style.module.scss'
import { Marker, useJsApiLoader } from '@react-google-maps/api'
import Map from '../Map'
import UserLink from '../UserLink'
import StatusTag from '../UI/StatusTag'
import ModalWindow from '../UI/ModalWindow'
import { ITask } from 'common/modules/models/Task'
import EditTaskForm from 'common/components/Forms/EditTaskForm'
import moment from 'moment'

interface Props {
  taskId: any
  task: ITask
}

const TaskCard: React.FC<Props> = ({ taskId, task }) => {
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

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)
  const [form] = Form.useForm()

  const [editTask] = useEditTaskMutation()
  const [deleteTask] = useDeleteTaskMutation()

  const Reset = () => {
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  const onCancelModal = () => {
    Reset()
  }

  const onSubmitModal = async () => {
    const formData: any = await form.validateFields()
    setIsFormDisabled(true)

    // editTask({
    //   ...task,
    //   ...formData,
    //   //TODO: properly datetime format
    //   deadline: task.deadline,
    // })

    await editTask({ ...task })

    Reset()
  }

  const taskDelete = () => {
    deleteTask(taskId)
    router.push(AppRoutes.TASK)
  }

  const Actions = [
    <Button key="edit" type="primary" onClick={() => setIsModalVisible(true)}>
      <EditOutlined />
    </Button>,
    <DeleteButton key="delete" onDelete={taskDelete} />,
  ]

  const mapOptions = useMemo(() => {
    return {
      geoCode: task?.address.geoCode,
      zoom: task?.address ? 17 : 12,
    }
  }, [task?.address])

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
          <Marker position={mapOptions?.geoCode} />
        </Map>
      </div>

      <ModalWindow
        title={`Редагування завдання від "${task?.customer}"`}
        isModalVisible={isModalVisible}
        onCancel={onCancelModal}
        onOk={onSubmitModal}
        okText="Зберегти"
        cancelText="Скасувати"
      >
        <EditTaskForm
          defaultTask={task}
          formDisabled={isFormDisabled}
          form={form}
        />
      </ModalWindow>
    </Card>
  )
}

export default TaskCard
