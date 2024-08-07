import DomainsBlock from '@components/DashboardPage/blocks/domains'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { FC } from 'react'
import { authOptions } from '../api/auth/[...nextauth]'
import MainLayout from '@common/components/Layouts/Main'
import { Typography } from 'antd'

export default withAuthRedirect(() => {
  return (
    <MainLayout
      path={[
        { title: 'Dashboard', path: AppRoutes.INDEX },
        { title: 'Domains', path: AppRoutes.DOMAIN },
      ]}
    >
      <Typography.Title level={3} style={{ marginTop: '0.5rem' }}>
        Domains
      </Typography.Title>
      <DomainsBlock />
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
