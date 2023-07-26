import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'
import HomePage from '../common/components/HomePage/index'
import DashboardPage from '../common/components/DashboardPage'

const Home: React.FC<{
  isAuth: boolean
}> = ({ isAuth }) => {
  return isAuth ? <DashboardPage /> : <HomePage />
}

export default Home

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session) {
    return {
      props: { isAuth: false },
    }
  }

  return {
    props: { isAuth: true },
  }
}
