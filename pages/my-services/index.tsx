import MainLayout from '@common/components/Layouts/Main'
import MyServicesBlock from '@components/DashboardPage/blocks/myServices'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import Head from 'next/head'

const MyServicesPage = () => {
  return (
    <>
      <Head>
        <title>Мої послуги</title>
      </Head>
      <MainLayout
        path={[
          { title: 'Панель управління', path: AppRoutes.INDEX },
          { title: 'Мої послуги', path: AppRoutes.MYSERVICES },
        ]}
      >
        <MyServicesBlock />
      </MainLayout>
    </>
  )
}

export default withAuthRedirect(MyServicesPage)

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

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