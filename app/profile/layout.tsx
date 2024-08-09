import MainLayout from '@common/components/Layouts/Main'
import { AppRoutes } from '@utils/constants'

export const metadata = {
  title: 'Profile',
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MainLayout
      path={[
        { title: 'Dashboard', path: AppRoutes.INDEX },
        { title: 'Profile', path: AppRoutes.PROFILE },
      ]}
    >
      {children}
    </MainLayout>
  )
}
