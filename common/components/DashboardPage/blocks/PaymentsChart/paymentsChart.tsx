import PaymentsChartHeader from '@common/components/Tables/PaymentsChart/Header'
import TableCard from '@common/components/UI/TableCard'
import React, { useState } from 'react'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { AppRoutes, Operations } from '@utils/constants'
import dynamic from 'next/dynamic'
import { isAdminCheck } from '@utils/helpers'
import { useRouter } from 'next/router'
import { chartConfig, getPaymentsChartData } from './paymentsChartHelper'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

const PaymentsChart = () => {
  const Line = dynamic(
    () => import('@ant-design/plots').then(({ Line }) => Line),
    { ssr: false }
  )
  const router = useRouter()
  const { data: user } = useGetCurrentUserQuery()
  const isAdmin = isAdminCheck(user?.roles) 
  const isOnPage = router.pathname === AppRoutes.PAYMENTS_CHARTS
  const [companyId, setCompanyId] = useState<string>()
  const [paymentsLimit, setPaymentsLimit] = useState(isOnPage ? 10 : 5)

  const { data: payments } = useGetAllPaymentsQuery({
    limit: paymentsLimit,
    type: Operations.Debit,
    companyIds: isAdmin && companyId ? [companyId] : undefined
  },
  {
    skip: isAdmin && !companyId,
  })
  const chartData = { ...chartConfig, data: getPaymentsChartData(payments?.data) } as any

  return (
    <TableCard
      title={
        <PaymentsChartHeader
          paymentsLimit={paymentsLimit}
          setPaymentsLimit={setPaymentsLimit}
          setCompanyId={setCompanyId}
        />
      }
    >
      <Line {...chartData} />
    </TableCard>
  )
}

export default PaymentsChart