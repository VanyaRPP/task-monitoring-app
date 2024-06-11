import Dashboard from '@common/components/Dashboard'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'

const StreetsPage: React.FC = () => {
  return <Dashboard.Streets />
}

export default StreetsPage

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
