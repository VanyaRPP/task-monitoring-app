import PaymentsChartHeader from '@common/components/Tables/PaymentsChart/Header'
import TableCard from '@common/components/UI/TableCard'
import React, { useState} from 'react'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { AppRoutes, Operations } from '@utils/constants'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { chartConfig, getPaymentsChartData } from './paymentsChartHelper'

const PaymentsChart = () => {
  const Line = dynamic(
    () => import('@ant-design/plots').then(({ Line }) => Line),
    { ssr: false }
  )
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENTS_CHARTS
  const [companyId, setCompanyId] = useState<string>()
  const [paymentsLimit, setPaymentsLimit] = useState(isOnPage ? 10 : 5)

  const { data: payments } = useGetAllPaymentsQuery({
    limit: paymentsLimit,
    type: Operations.Debit,
    companyIds: [companyId]
  },
  {
    skip: !companyId,
  })
  console.log(payments)
  const chartData = { ...chartConfig, data: getPaymentsChartData(payments?.data) } as any

  return (
    <TableCard
      title={
        <PaymentsChartHeader
          paymentsLimit={paymentsLimit}
          setPaymentsLimit={setPaymentsLimit}
          selectValues={payments?.realEstatesFilter.map((item) => ({
            label: item.text,
            value: item.value,
          }))}
          setCompanyId={setCompanyId}
        />
      }
    >
      <Line {...chartData} />
    </TableCard>
  )
}

export default PaymentsChart