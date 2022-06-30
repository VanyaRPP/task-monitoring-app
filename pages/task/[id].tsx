import s from './style.module.scss'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Avatar, Button, Card } from 'antd'
import moment from 'moment'
import Router, { useRouter } from 'next/router'
import {
  useDeleteTaskMutation,
  useGetTaskByIdQuery,
} from '../../api/taskApi/task.api'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import { useSession } from 'next-auth/react'
import { ObjectId } from 'mongoose'

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
    Router.push('/task')
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
                <Button
                  key="delete"
                  ghost
                  type="primary"
                  onClick={() => taskDelete(task?._id)}
                >
                  <DeleteOutlined />
                </Button>,
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
            <p>DeadLine: {moment(task?.deadline).format('MMM Do YY')}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Task
