import { useRouter } from 'next/router'
import { AppRoutes } from '../../utils/constants'

import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'
import TaskCard from 'common/components/TaskCard'
import AuctionCard from 'common/components/AuctionCard'
import CommentsCard from 'common/components/CommentsCard'

import s from './style.module.scss'

const Task: React.FC = () => {
  const router = useRouter()

  return (
    <div className={s.TaskContainer}>
      <TaskCard taskId={router.query.id} />
      <AuctionCard taskId={router.query.id} />
      <CommentsCard taskId={router.query.id} />
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
