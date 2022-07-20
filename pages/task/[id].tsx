import { useRouter } from 'next/router'
import { AppRoutes } from '../../utils/constants'

import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'
import TaskCard from 'common/components/TaskCard'

import CommentsCard from 'common/components/CommentsCard'
import { useGetTaskByIdQuery } from 'common/api/taskApi/task.api'
import s from './style.module.scss'
import СompetitionCard from '../../common/components/CompetitionCard'

const Task: React.FC = () => {
  const router = useRouter()

  const { data } = useGetTaskByIdQuery(`${router.query.id}`, {
    skip: !router.query.id,
  })
  const task = data?.data

  return (
    <div className={s.TaskContainer}>
      <TaskCard taskId={router.query.id} task={task} />
      <СompetitionCard task={task} />
      <CommentsCard />
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
