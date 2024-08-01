import StreetsBlock from '@components/DashboardPage/blocks/streets'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { FC } from 'react'
import { authOptions } from '../api/auth/[...nextauth]'

const Streets: FC = () => {
  return <StreetsBlock />
}

export default withAuthRedirect(Streets)

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
