import DomainsBlock from '@components/DashboardPage/blocks/domains'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { FC } from 'react'
import { authOptions } from '../api/auth/[...nextauth]'

const Domains: FC = () => {
  return <DomainsBlock />
}

export default withAuthRedirect(Domains)

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
