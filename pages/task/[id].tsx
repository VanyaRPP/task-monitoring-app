import { Card } from 'antd'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../utils/constants'
import s from './style.module.scss'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'
import TaskCard from '../../components/TaskCard'

const Task: React.FC = () => {
  const router = useRouter()

  return (
    <div className={s.TaskContainer}>
      <TaskCard taskId={router.query.id} />

      <Card className={`${s.Card} ${s.Auction}`} title="Auction">
        <ul>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
        </ul>
      </Card>

      <Card
        className={`${s.Card} ${s.Additional}`}
        title="Additional card"
      ></Card>
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
