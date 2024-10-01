import PaymentsBlock from '@common/components/DashboardPage/blocks/payments'
import MainLayout from '@common/components/Layouts/Main'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { AppRoutes, Roles } from '@utils/constants'
import { authOptions } from '../api/auth/[...nextauth]'
import Head from 'next/head'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

export default withAuthRedirect(() => {
  const { data: userResponse } = useGetCurrentUserQuery()
  const isUser = userResponse?.roles?.includes(Roles.USER)
  return (
    <>
      <Head>
        <title>{isUser ? 'Мої платежі' : 'Платежі'}</title>
      </Head>
      <MainLayout
        path={[
          { title: 'Панель управління', path: AppRoutes.INDEX },
          { title: 'Платежі', path: AppRoutes.PAYMENT },
        ]}
      >
        <PaymentsBlock />
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
