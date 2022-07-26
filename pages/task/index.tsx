import { Badge, Button, Card, Empty } from 'antd'
import { useGetAllTaskQuery } from '../../common/api/taskApi/task.api'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { ITask } from '../../common/modules/models/Task'
import Router from 'next/router'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from '../../common/api/userApi/user.api'
import { AppRoutes } from '../../utils/constants'
import classNames from 'classnames'
import s from './style.module.scss'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'
import {
  dateToDefaultFormat,
  isDeadlineExpired,
} from '../../common/assets/features/formatDate'
import CardOneTask from '../../common/components/CardOneTask'

const Tasks: React.FC = () => {
  const { data: session } = useSession()

  const { data } = useGetAllTaskQuery('')
  const tasks = data?.data

  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = userData?.data

  return (
    <>
      {tasks && tasks.length !== 0 ? (
        <div className={s.TasksList}>
          {tasks &&
            [...tasks].reverse().map((task: ITask, index) => {
              return (
                <CardOneTask key={index} task={task} />
                // <Card
                //   key={index}
                //   title={task.name}
                //   extra={
                //     <Badge
                //       color="gold"
                //       count={
                //         task?.taskexecutors ? task?.taskexecutors.length : 0
                //       }
                //     >
                //       <Button
                //         ghost
                //         type="primary"
                //         onClick={() =>
                //           Router.push(AppRoutes.TASK + '/' + task._id)
                //         }
                //       >
                //         {isDeadlineExpired(task?.deadline) ? 'Info' : 'Apply'}
                //       </Button>
                //     </Badge>
                //   }
                //   className={classNames(s.Card, {
                //     [s.Disabled]: isDeadlineExpired(task?.deadline),
                //   })}
                // >
                //   <p>Категорія: {task?.category}</p>
                //   <p>Опис: {task.description}</p>
                //   <p>Адреса: {task?.address?.name}</p>
                //   <p>Виконати до: {dateToDefaultFormat(task?.deadline)}</p>
                // </Card>
              )
            })}
        </div>
      ) : (
        <Empty />
      )}
    </>
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
