import s from './style.module.scss'
import {
  DeleteOutlined,
  EditOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Popconfirm } from 'antd'
import Router, { useRouter } from 'next/router'
import {
  useDeleteTaskMutation,
  useGetTaskByIdQuery,
} from '../../api/taskApi/task.api'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import { useSession } from 'next-auth/react'
import { ObjectId } from 'mongoose'
import { dateToDefaultFormat } from '../../components/features/formatDate'
import { AppRoutes } from '../../utils/constants'

const Task: React.FC = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const { data } = useGetTaskByIdQuery(`${router.query.id}`, {
    skip: !router.query.id,
  })
  const task = data?.data

  const { data: userData } = useGetUserByIdQuery(`${task?.creator}`, {
    skip: !task,
  })
  const user = userData?.data

  const [deleteTask] = useDeleteTaskMutation()

  const taskDelete = (id: ObjectId) => {
    deleteTask(id)
    Router.push(AppRoutes.TASK)
  }

  return (
    <div className={s.TaskContainer}>
      <Card
        className={s.Task}
        actions={
          session?.user?.email === user?.email
            ? [
                <Button key="edit" ghost type="primary">
                  <EditOutlined />
                </Button>,
                <Popconfirm
                  key="delete"
                  title="Are you sure？"
                  okText="Yes"
                  cancelText="No"
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  onConfirm={() => taskDelete(task?._id)}
                >
                  <Button ghost type="primary">
                    <DeleteOutlined />
                  </Button>
                </Popconfirm>,
              ]
            : null
        }
      >
        <div className={s.Content}>
          <div className={s.UserInfo}>
            <Avatar size={200} src={user?.image} />
            <p>{user?.name}</p>
          </div>
          <div className={s.TaskInfo}>
            <h2>{task?.name}</h2>
            <p>Description: {task?.desription}</p>
            <p>Category: {task?.category}</p>
            <p>Domain: {task?.domain}</p>
            <p>DeadLine: {dateToDefaultFormat(task?.deadline)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Task
