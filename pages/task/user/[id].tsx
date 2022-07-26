import { Empty } from 'antd'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useRouter } from 'next/router'
import { useGetAllTaskQuery } from '../../../common/api/taskApi/task.api'
import CardOneTask from '../../../common/components/CardOneTask'
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
                <CardOneTask key={index} task={task} />
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
