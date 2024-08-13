import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import PaymentsChartHeader from '@components/Tables/PaymentsChart/Header'
import TableCard from '@components/UI/TableCard'
import { AppRoutes, Operations } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { Empty } from 'antd'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { chartConfig, getPaymentsChartData } from './paymentsChartHelper'
import s from './style.module.scss'

const PaymentsChart = () => {
  const Line = dynamic(
    () => import('@ant-design/plots').then(({ Line }) => Line),
    { ssr: false }
  )
  const router = useRouter()
  const { data: user } = useGetCurrentUserQuery()
  const isAdmin = isAdminCheck(user?.roles)
  const isOnPage = router.pathname === AppRoutes.PAYMENT_CHART
  const [companyId, setCompanyId] = useState<string>()
  const [paymentsLimit, setPaymentsLimit] = useState(isOnPage ? 10 : 5)

  const {
    data: payments,
    isLoading,
    isError,
  } = useGetAllPaymentsQuery(
    {
      limit: paymentsLimit,
      type: Operations.Debit,
      companyIds: isAdmin && companyId ? [companyId] : undefined,
    },
    {
      skip: isAdmin && !companyId,
    }
  )
  const chartData = {
    ...chartConfig,
    data: getPaymentsChartData(payments?.data),
  } as any

  const canShowChart = !isLoading && !isError && payments?.data?.length > 0

  return (
    <TableCard
      title={
        <PaymentsChartHeader
          paymentsLimit={paymentsLimit}
          setPaymentsLimit={setPaymentsLimit}
          setCompanyId={setCompanyId}
          canShowChart={canShowChart}
        />
      }
    >
      <div className={s.centerContent}>
        {canShowChart ? (
          <Line {...chartData} />
        ) : (
          <Empty description="Неможливо відобразити графік" />
        )}
      </div>
    </TableCard>
  )
}

export default PaymentsChart
