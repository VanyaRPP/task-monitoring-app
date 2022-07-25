import { Button, Card, Empty } from 'antd'
import classNames from 'classnames'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import Router, { useRouter } from 'next/router'
import { useGetAllTaskQuery } from '../../../common/api/taskApi/task.api'
import {
  dateToDefaultFormat,
  isDeadlineExpired,
} from '../../../common/assets/features/formatDate'
import { ITask } from '../../../common/modules/models/Task'
import { AppRoutes } from '../../../utils/constants'
import { authOptions } from '../../api/auth/[...nextauth]'
import s from './../style.module.scss'

const UserTasks: React.FC = () => {
  const router = useRouter()
  const { data } = useGetAllTaskQuery('')
  const tasks = data?.data

  const userTasks = tasks?.filter(
    (task: ITask) => task.creator === router.query.id
  )

  return (
    <>
      {userTasks && userTasks.length !== 0 ? (
        <div className={s.TasksList}>
          {userTasks &&
            [...userTasks].reverse().map((task: ITask, index) => {
              return (
                <Card
                  key={index}
                  title={task.name}
                  extra={
                    <Button
                      ghost
                      type="primary"
                      onClick={() =>
                        Router.push(AppRoutes.TASK + '/' + task._id)
                      }
                    >
                      {isDeadlineExpired(task?.deadline) ? 'Info' : 'Apply'}
                    </Button>
                  }
                  className={classNames(s.Card, {
                    [s.Disabled]: isDeadlineExpired(task?.deadline),
                  })}
                >
                  <p>Category: {task?.category}</p>
                  <p>Description: {task.description}</p>
                  <p>Address: {task?.address?.name}</p>
                  <p>DeadLine: {dateToDefaultFormat(task?.deadline)}</p>
                </Card>
              )
            })}
        </div>
      ) : (
        <Empty />
      )}
    </>
  )
}

export default UserTasks

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
