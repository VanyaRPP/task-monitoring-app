import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { usePaymentsChartConfig } from '@components/DashboardPage/PaymentsChart/hooks/usePaymentsChartConfig'
import { usePaymentsChartData } from '@components/DashboardPage/PaymentsChart/hooks/usePaymentsChartData'
import {useMemo, useState} from 'react'
import ChartComponent from '@components/DashboardPage/ChartComponent'
import {AppRoutes, Operations, Roles} from '@utils/constants'
import {useGetCurrentUserQuery} from "@common/api/userApi/user.api";

const PaymentsChart: React.FC = () => {
  const [companyId, setCompanyId] = useState<string>()
  const [size, setSize] = useState<number>(10)
  const { data: user } = useGetCurrentUserQuery()

  const isDomainAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.DOMAIN_ADMIN)
  }, [user])
  const isGlobalAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.GLOBAL_ADMIN)
  }, [user])

  const {
    data: { data: payments } = { data: [] },
    isFetching,
    isError,
  } = useGetAllPaymentsQuery({
    limit: size,
    companyIds: [companyId],
  },
    {
      skip: (!isGlobalAdmin && !isDomainAdmin) || !companyId,
    }
  )


  const chartData = usePaymentsChartData(payments)
  const chartConfig = usePaymentsChartConfig()

  return (
    <ChartComponent
      data={chartData}
      config={chartConfig}
      title="Графік платежів"
      link={AppRoutes.PAYMENT_CHART}
      isFetching={isFetching}
      isError={isError}
      placeholder="Оберіть компанію"
      companyId={companyId}
      onCompanyChange={setCompanyId}
      size={size}
      onSizeChange={setSize}
    />
  )
}

export default PaymentsChart
