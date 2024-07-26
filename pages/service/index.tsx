import ServicesBlock from '@common/components/DashboardPage/blocks/services'
import MainLayout from '@common/components/Layouts/Main'
import { Typography } from 'antd'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { AppRoutes } from '../../utils/constants'
import { authOptions } from '../api/auth/[...nextauth]'

export default withAuthRedirect(() => {
  return (
    <MainLayout
      path={[
        { title: 'Dashboard', path: AppRoutes.INDEX },
        { title: 'Services', path: AppRoutes.SERVICE },
      ]}
    >
      <Typography.Title level={3} style={{ marginTop: '0.5rem' }}>
        Services
      </Typography.Title>
      <ServicesBlock />
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
