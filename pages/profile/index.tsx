import MainLayout from '@common/components/Layouts/Main'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { ProfilePage } from '@components/Pages/Profile'
import { authOptions } from '../api/auth/[...nextauth]'
import Head from 'next/head'

export default withAuthRedirect(() => {
  return (
    <>
      <Head>
        <title>Профіль</title>
      </Head>
      <MainLayout path={[{ title: 'Профіль', path: AppRoutes.PROFILE }]}>
        <ProfilePage />
      </MainLayout>
    </>
  )
})

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
