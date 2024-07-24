import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import ProfilePage from '../../common/components/ProfilePage'
import { authOptions } from '../api/auth/[...nextauth]'

const Profile: React.FC = () => {
  return <ProfilePage />
}

export default Profile

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
