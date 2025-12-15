import MainLayout from '@common/components/Layouts/Main'
import { useScrollToTop } from '@modules/hooks/useScrollToTop'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import Head from 'next/head'
import DashboardPage from '../common/components/DashboardPage'
import HomePage from '../common/components/HomePage/index'
import { authOptions } from './api/auth/[...nextauth]'

const Home: React.FC<{
  isAuth: boolean
  initialSession?: any
}> = ({ isAuth, initialSession }) => {
  const { handleNavigateHome } = useScrollToTop()
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
          onPathClick={(path) => {
            if (path === AppRoutes.INDEX) handleNavigateHome()
          }}
        >
          <DashboardPage initialSession={initialSession} />
        </MainLayout>
      ) : (
        <MainLayout simple>
          <HomePage />
        </MainLayout>
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
    props: {
      isAuth: true,
      initialSession: JSON.parse(JSON.stringify(session)),
    },
  }
}
