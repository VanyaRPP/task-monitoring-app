import s from './style.module.scss'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Avatar, Card } from 'antd'
import moment from 'moment'
import { useRouter } from 'next/router'
import { useGetTaskByIdQuery } from '../../api/taskApi/task.api'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'


const Task: React.FC = () => {

  const router = useRouter()

  const { data } = useGetTaskByIdQuery(`${router.query.id}`, {
    skip: !router.query.id,
  })
  const task = data?.data

  const { data: userData } = useGetUserByIdQuery(`${task?.creator}`, {
    skip: !task,
  })
  const user = userData?.data

  return (
    <div className={s.TaskContainer}>
      <Card
        className={s.Task}
        actions={[
          <EditOutlined key="edit" />,
          <DeleteOutlined key="ellipsis" />,
        ]}
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
            <p>DeadLine: {moment(task?.deadline).format("MMM Do YY")}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Task

