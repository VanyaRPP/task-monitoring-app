import MainLayout from '@common/components/Layouts/Main'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import DashboardPage from '../common/components/DashboardPage'
import HomePage from '../common/components/HomePage/index'
import { authOptions } from './api/auth/[...nextauth]'
import Head from 'next/head'

const Home: React.FC<{
  isAuth: boolean
}> = ({ isAuth }) => {
  return (
    <>
      <Head>
        <title>
          {isAuth ? 'Персональний кабінет' : 'Комуналка в E-ORENDA'}
        </title>
      </Head>
      {isAuth ? (
        <MainLayout
          path={[{ title: 'Панель управління', path: AppRoutes.INDEX }]}
        >
          <DashboardPage />
        </MainLayout>
      ) : (
        <HomePage />
      )}
    </>
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
