import StreetsBlock from '@components/DashboardPage/blocks/streets'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import MainLayout from '@common/components/Layouts/Main'
import { Typography } from 'antd'

export default withAuthRedirect(() => {
  return (
    <MainLayout
      path={[
        { title: 'Dashboard', path: AppRoutes.INDEX },
        { title: 'Streets', path: AppRoutes.STREETS },
      ]}
    >
      <Typography.Title level={3} style={{ marginTop: '0.5rem' }}>
        Streets
      </Typography.Title>
      <StreetsBlock />
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
