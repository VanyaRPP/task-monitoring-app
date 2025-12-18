import MainLayout from '@common/components/Layouts/Main'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'

import { authOptions } from '../api/auth/[...nextauth]'
import BankTransactions from '@components/Pages/BankTransactions'

export default withAuthRedirect(
  ({ initialSession }: { initialSession: any }) => {
    return (
      <MainLayout path={[{ title: 'Bank', path: AppRoutes.BANK }]}>
        <BankTransactions initialSession={initialSession} />
      </MainLayout>
    )
  }
)

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
    props: { initialSession: JSON.parse(JSON.stringify(session)) },
  }
}
