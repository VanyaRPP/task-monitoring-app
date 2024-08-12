import MainLayout from '@common/components/Layouts/Main'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'

import { authOptions } from '../api/auth/[...nextauth]'

export default withAuthRedirect(() => {
  return (
    <MainLayout
      path={[
        { title: 'Панель управління', path: AppRoutes.INDEX },
        { title: 'Компанії', path: AppRoutes.REAL_ESTATE },
      ]}
    >
      <RealEstateBlock />
    </MainLayout>
  )
})

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
