import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import DomainsBlock from '@components/DashboardPage/blocks/domains'
import PaymentsBlock from '@components/DashboardPage/blocks/payments'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import ServicesBlock from '@components/DashboardPage/blocks/services'
import StreetsBlock from '@components/DashboardPage/blocks/streets'
import CompaniesAreaChart from '@components/DashboardPage/blocks/сompaniesAreaChart'
import { Roles } from '@utils/constants'
import { Col, Row, Space } from 'antd'
import PaymentsChart from "@components/DashboardPage/blocks/paymentChart";
// import PaymentsChart from '@components/DashboardPage/PaymentsChart'

const Dashboard: React.FC = () => {
  const { data: userResponse } = useGetCurrentUserQuery()
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <PaymentsBlock />
      <PaymentsChart />
      <ServicesBlock />
      {isGlobalAdmin && <StreetsBlock />}
      <DomainsBlock />
      <RealEstateBlock />
      <CompaniesAreaChart />
    </Space>
  )
}

export default Dashboard
