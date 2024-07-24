import StreetsBlock from '@common/components/DashboardPage/blocks/streets'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { FC } from 'react'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { authOptions } from '../api/auth/[...nextauth]'

const Streets: FC = () => {
  return <StreetsBlock />
}

export default withAuthRedirect(Streets)

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
