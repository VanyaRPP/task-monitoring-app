import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { AppRoutes } from '../../utils/constants'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'
import { FC } from 'react'
import PaymentsBlock from '@common/components/DashboardPage/blocks/payments'


const Payments: FC = () => {
  return <PaymentsBlock />
}

export default withAuthRedirect(Payments)

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

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
