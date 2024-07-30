import { useGetTaskByIdQuery } from '@common/api/taskApi/task.api'
import CommentsCard from '@components/CommentsCard'
import CompetitionCard from '@components/CompetitionCard'
import TaskCard from '@components/TaskCard'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useRouter } from 'next/router'
import { authOptions } from '../api/auth/[...nextauth]'
import s from './style.module.scss'

const Task: React.FC = () => {
  const router = useRouter()

  const { data } = useGetTaskByIdQuery(`${router.query.id}`, {
    skip: !router.query.id,
  })
  const task = data?.data
  const taskStatus = task?.status

  return (
    <div className={s.TaskContainer}>
      <TaskCard taskId={router.query.id} task={task} />
      <CompetitionCard task={task} />
      <CommentsCard taskId={task?._id} />
    </div>
  )
}

export default Task

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
