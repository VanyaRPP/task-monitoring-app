import { Button, Card } from 'antd'
import { useGetAllTaskQuery } from '../../api/taskApi/task.api'
import withAuthRedirect from '../../components/HOC/withAuthRedirect'
import s from './style.module.scss'
import { ITask } from '../../models/Task'
import Router from 'next/router'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from '../../api/userApi/user.api'
import {
  dateToDefaultFormat,
  isDeadlineExpired,
} from '../../components/features/formatDate'
import { AppRoutes } from '../../utils/constants'
import classNames from 'classnames'

const Tasks: React.FC = () => {
  const { data: session } = useSession()

  const { data } = useGetAllTaskQuery('')
  const tasks = data?.data

  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = userData?.data

  return (
    <div className={s.TasksList}>
      {tasks &&
        tasks.map((task: ITask, index) => {
          return (
            <Card
              key={index}
              title={task.name}
              extra={
                <Button
                  ghost
                  type="primary"
                  onClick={() => Router.push(AppRoutes.TASK + '/' + task._id)}
                >
                  {user?._id.toString() === task?.creator.toString() ||
                  isDeadlineExpired(task?.deadline)
                    ? 'Info'
                    : 'Apply'}
                </Button>
              }
              className={classNames(s.Card, {
                [s.Disabled]: isDeadlineExpired(task?.deadline),
              })}
            >
              <p>Catagory: {task?.category}</p>
              <p>Description: {task.desription}</p>
              <p>Domain: {task?.domain}</p>
              <p>DeadLine: {dateToDefaultFormat(task?.deadline)}</p>
            </Card>
          )
        })}
    </div>
  )
}

export default withAuthRedirect(Tasks)
