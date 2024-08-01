import DashboardPage from '@components/DashboardPage'
import HomePage from '@components/HomePage/index'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'

const Home: React.FC<{
  isAuth: boolean
}> = ({ isAuth }) => {
  return isAuth ? <DashboardPage /> : <HomePage />
}

export default Home

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      props: { isAuth: false },
    }
  }

  return {
    props: { isAuth: true },
  }
}
