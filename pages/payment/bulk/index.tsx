import PaymentBulkBlock from '@common/components/DashboardPage/blocks/paymentsBulk'
import withAuthRedirect from '@common/components/HOC/withAuthRedirect'
import MainLayout from '@common/components/Layouts/Main'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { AppRoutes } from '@utils/constants'
import { Typography } from 'antd'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'

export default withAuthRedirect(() => {
  return (
    <MainLayout
      path={[
        { title: 'Dashboard', path: AppRoutes.INDEX },
        { title: 'Payments', path: AppRoutes.PAYMENT },
        { title: 'Bulk', path: AppRoutes.PAYMENT_BULK },
      ]}
    >
      <Typography.Title level={3} style={{ marginTop: '0.5rem' }}>
        Payments bulk
      </Typography.Title>
      <PaymentBulkBlock />
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
