import styles from './style.module.scss'
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

  const Actions = [
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

  return (
    <div className={styles.TaskContainer}>
      <Card
        className={`${styles.Card} ${styles.Task}`}
        actions={session?.user?.email === user?.email && Actions}
      >
        <div className={styles.UserInfo}>
          <Avatar size={200} src={user?.image} />
          <h2>{user?.name}</h2>
        </div>
        <div className={styles.TaskInfo}>
          <h3>{task?.name}</h3>
          <p className={styles.Description}>Description: {task?.desription}</p>
          <p>Category: {task?.category}</p>
          <p>Domain: {task?.domain}</p>
          <p>DeadLine: {dateToDefaultFormat(task?.deadline)}</p>
        </div>
      </Card>

      <Card className={`${styles.Card} ${styles.Auction}`} title="Auction">
        <ul>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
        </ul>
      </Card>

      <Card
        className={`${styles.Card} ${styles.Additional}`}
        title="Additional card"
      ></Card>
    </div>
  )
}

export default Task
