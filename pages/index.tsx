import MainLayout from '@common/components/Layouts/Main'
import { useScrollToTop } from '@modules/hooks/useScrollToTop'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import Head from 'next/head'
import DashboardLanding from '../common/components/Pages/DashboardLanding'
import HomePage from '../common/components/HomePage/index'
import { authOptions } from './api/auth/[...nextauth]'

interface PageProps {
  isAuth: boolean
}

const Home: React.FC<PageProps> = ({ isAuth }) => {
  const { handleNavigateHome } = useScrollToTop()
  return (
    <>
      <Head>
        <title>
          {isAuth
            ? 'Персональний кабінет'
            : 'E-ORENDA — автоматизація виставлення рахунків'}
        </title>
      </Head>
      {isAuth ? (
        <MainLayout
          path={[{ title: 'Панель управління', path: AppRoutes.INDEX }]}
          onPathClick={(path) => {
            if (path === AppRoutes.INDEX) handleNavigateHome()
          }}
          hideHeader
          hideFooter
        >
          <DashboardLanding />
        </MainLayout>
      ) : (
        <MainLayout simple hideFloatButtons>
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
    props: { isAuth: true },
  }
}
