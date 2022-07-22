import { Button, Card } from 'antd'
import { useGetAllTaskQuery } from '../../common/api/taskApi/task.api'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { ITask } from '../../common/modules/models/Task'
import Router from 'next/router'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from '../../common/api/userApi/user.api'
import {
  dateToDefaultFormat,
  isDeadlineExpired,
} from '../../common/components/features/formatDate'
import { AppRoutes } from '../../utils/constants'
import classNames from 'classnames'
import s from './style.module.scss'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'

const Tasks: React.FC = () => {
  const { data: session } = useSession()

  const { data } = useGetAllTaskQuery('')
  const tasks = data?.data

  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = userData?.data

  return (
    <div className={s.TasksList}>
      {tasks &&
        [...tasks].reverse().map((task: ITask, index) => {
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
                  {user?._id.toString() === task?.creator?.toString() ||
                  isDeadlineExpired(task?.deadline)
                    ? 'Інформація'
                    : 'Подати заявку'}
                </Button>
              }
              className={classNames(s.Card, {
                [s.Disabled]: isDeadlineExpired(task?.deadline),
              })}
            >
              <p>Категорія: {task?.category}</p>
              <p>Опис: {task.desription}</p>
              <p>Адреса: {task?.address?.name}</p>
              <p>Виконати до: {dateToDefaultFormat(task?.deadline)}</p>
            </Card>
          )
        })}
    </div>
  )
}

export default withAuthRedirect(Tasks)

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session) {
    return {
      redirect: {
        destination: AppRoutes.AUTH_SIGN_IN,
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
