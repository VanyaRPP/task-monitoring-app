import MainLayout from '@common/components/Layouts/Main'
import DomainsBlock from '@components/DashboardPage/blocks/domains'
import ServicesBlock from '@components/DashboardPage/blocks/services'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import StreetsBlock from '@components/DashboardPage/blocks/streets'
import PaymentsBlock from '@components/DashboardPage/blocks/payments'
import CompaniesAreaChart from '@components/DashboardPage/blocks/сompaniesAreaChart'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import { Space } from 'antd'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { useRouter } from 'next/router'

export default withAuthRedirect(() => {
  const { query, asPath } = useRouter()
  const sepDomainID = typeof query.domain === 'string' ? query.domain : null
  return (
    <MainLayout
      path={[
        { title: 'Панель управління', path: AppRoutes.INDEX },
        { title: `${query.name}`, path: `${asPath}` },
      ]}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <PaymentsBlock sepDomainID={sepDomainID} />
        <ServicesBlock sepDomainID={sepDomainID} />
        <RealEstateBlock sepDomainID={sepDomainID} />
        <StreetsBlock sepDomainId={sepDomainID} />
        <CompaniesAreaChart domainID={sepDomainID} />
      </Space>
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
