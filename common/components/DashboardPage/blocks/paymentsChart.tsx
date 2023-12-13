import PaymentsChartHeader from '@common/components/Tables/PaymentsChart/Header'
import TableCard from '@common/components/UI/TableCard'
import React, { useState } from 'react'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { AppRoutes, Operations } from '@utils/constants'
import dynamic from 'next/dynamic'
import { dateToDayYearMonthFormat } from '@common/assets/features/formatDate'
import { useRouter } from 'next/router'

const PaymentsChart = () => {
  const Line = dynamic(
    () => import('@ant-design/plots').then(({ Line }) => Line),
    { ssr: false }
  )
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENTS_CHARTS
  const [paymentsLimit, setPaymentsLimit] = useState(isOnPage ? 10 : 5)
  const { data: payments, isLoading } = useGetAllPaymentsQuery({
    limit: paymentsLimit,
    type: Operations.Debit,
  })

  const data = payments
    ? payments?.data?.flatMap((payment) => [
        ...payment?.invoice?.map((item) => ({
          date: dateToDayYearMonthFormat(payment?.invoiceCreationDate),
          value: +item.sum,
          category: item.type,
        })),
        {
          date: dateToDayYearMonthFormat(payment?.invoiceCreationDate),
          value: +payment?.generalSum,
          category: 'generalSum',
        },
      ])
    : []

  const config = {
    data,
    xField: 'date',
    yField: 'value',
    seriesField: 'category',
    xAxis: {
      type: 'time',
    },
    yAxis: {
      label: {
        formatter: (v) =>
          `${v}`.replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`),
      },
    },
  } as any
  
  return (
    <TableCard
      title={
        <PaymentsChartHeader
          paymentsLimit={paymentsLimit}
          setPaymentsLimit={setPaymentsLimit}
        />
      }
    >
      <Line {...config} />
    </TableCard>
  )
}

export default PaymentsChart
