import { Empty } from 'antd'
import { useGetAllTaskQuery } from '../../common/api/taskApi/task.api'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { ITask } from '../../common/modules/models/Task'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from '../../common/api/userApi/user.api'
import { AppRoutes } from '../../utils/constants'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'
import s from './style.module.scss'
import TaskViewer from '@common/components/UI/Buttons/TaskViewer'

const Tasks: React.FC = () => {
  const { data: session } = useSession()

  const { data } = useGetAllTaskQuery('')
  const tasks: ITask[] = data?.data

  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = userData?.data

  // useEffect(() => {
  //   setValue('task-view', TaskView.CARD)
  // }, [taskView])

  return (
    <>
      <TaskViewer tasks={tasks} />
      {/* <Filter tasks={tasks} /> */}
      {tasks && tasks.length !== 0 ? (
        <div className={s.TasksList}>
          {/* {tasks &&
            [...tasks].reverse().map((task: ITask, index) => {
              // {task?.status == 'Completed' ? null : return <CardOneTask key={index} task={task} />}
              return task?.status == 'completed' ? null : (
                <CardOneTask key={index} task={task} />
                )
              // return <CardOneTask key={index} task={task} />
            })} */}
          {/* {tasks.map((task) => {
            return <CardOneTask key={task._id} task={task} />
          })} */}
        </div>
      ) : (
        <Empty description="Немає даних" />
      )}
      {/* {tasks?.map((task) => {
        return <ListOneTask task={tasks} />
      })} */}
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
