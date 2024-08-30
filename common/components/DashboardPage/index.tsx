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
      <PaymentsBlock />
      <PaymentsChart style={{ height: '100%' }} />
      <ServicesBlock />
      {isGlobalAdmin && <StreetsBlock />}
      <DomainsBlock />
      <RealEstateBlock />
      {/* <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={8}>
          <CompaniesAreaChart />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={16}>
        <PaymentsChart style={{ height: '100%' }} />
        </Col>
      </Row> */}
      <CompaniesAreaChart />
    </Space>
  )
}

export default Dashboard
