import PaymentBulkBlock from '@common/components/DashboardPage/blocks/paymentsBulk'
import withAuthRedirect from '@common/components/HOC/withAuthRedirect'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'

const PaymentsBulk: React.FC = () => {
  return <PaymentBulkBlock />
}

export default withAuthRedirect(PaymentsBulk)

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
