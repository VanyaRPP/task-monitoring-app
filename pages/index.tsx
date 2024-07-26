import MainLayout from '@common/components/Layouts/Main'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import DashboardPage from '../common/components/DashboardPage'
import HomePage from '../common/components/HomePage/index'
import { authOptions } from './api/auth/[...nextauth]'

const Home: React.FC<{
  isAuth: boolean
}> = ({ isAuth }) => {
  return isAuth ? (
    <MainLayout path={[{ title: 'Dashboard', path: AppRoutes.INDEX }]}>
      <DashboardPage />
    </MainLayout>
  ) : (
    <HomePage />
  )
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
