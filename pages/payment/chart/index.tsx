import PaymentsChart from '@components/DashboardPage/blocks/PaymentsChart/paymentsChart'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import MainLayout from '@components/Layouts/Main'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'

export default withAuthRedirect(() => {
  return (
    <MainLayout
      path={[
        { title: 'Панель управління', path: AppRoutes.INDEX },
        { title: 'Платежі', path: AppRoutes.PAYMENT },
        { title: 'Графік платежів', path: AppRoutes.PAYMENT_CHART },
      ]}
    >
      <PaymentsChart />
    </MainLayout>
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
