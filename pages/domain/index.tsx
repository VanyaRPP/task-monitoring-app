import Dashboard from '@common/components/Dashboard'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { AppRoutes } from '../../utils/constants'
import { authOptions } from '../api/auth/[...nextauth]'

const DomainsPage: React.FC = () => {
  return <Dashboard.Domains />
}

export default DomainsPage

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
