import { ProfilePage } from '@components/Pages/Profile'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { AppRoutes } from '@utils/constants'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export default async function Profile() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(AppRoutes.AUTH_SIGN_IN)
  }

  return <ProfilePage />
}
