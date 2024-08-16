import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import DomainsBlock from '@components/DashboardPage/blocks/domains'
import PaymentsBlock from '@components/DashboardPage/blocks/payments'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import ServicesBlock from '@components/DashboardPage/blocks/services'
import StreetsBlock from '@components/DashboardPage/blocks/streets'
import CompaniesAreaChart from '@components/DashboardPage/blocks/сompaniesAreaChart'
import PaymentsChart from '@components/DashboardPage/PaymentsChart'
import { Roles } from '@utils/constants'
import { Col, Row, Space } from 'antd'

const Dashboard: React.FC = () => {
  const { data: userResponse } = useGetCurrentUserQuery()
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xl={24} xxl={8}>
          <CompaniesAreaChart />
        </Col>
        <Col xl={24} xxl={16}>
          <PaymentsChart style={{ height: '100%' }} />
        </Col>
      </Row>
      {isGlobalAdmin && <StreetsBlock />}
      <DomainsBlock />
      <RealEstateBlock />
      <ServicesBlock />
      <PaymentsBlock />
    </Space>
  )
}

export default Dashboard
