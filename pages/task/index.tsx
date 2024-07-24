import TaskViewer from '@common/components/UI/Buttons/TaskViewer'
import { AppRoutes } from '@utils/constants'
import { Empty } from 'antd'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useGetAllTaskQuery } from '../../common/api/taskApi/task.api'
import { useGetUserByEmailQuery } from '../../common/api/userApi/user.api'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { ITask } from '../../common/modules/models/Task'
import { authOptions } from '../api/auth/[...nextauth]'
import s from './style.module.scss'

const Tasks: React.FC = () => {
  const { data: session } = useSession()

  const { data } = useGetAllTaskQuery('')
  const tasks: ITask[] = data?.data

  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = userData?.data

  return (
    <>
      <TaskViewer tasks={tasks} />
      {tasks && tasks.length !== 0 ? (
        <div className={s.TasksList}></div>
      ) : (
        <Empty description="Немає даних" />
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
