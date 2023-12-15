import PaymentsChartHeader from '@common/components/Tables/PaymentsChart/Header'
import TableCard from '@common/components/UI/TableCard'
import React, { useState, useEffect } from 'react'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { AppRoutes, Operations } from '@utils/constants'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { chartConfig, getPaymentsChartData } from './paymentsChartHelper'
import {
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'

const PaymentsChart = () => {
  const Line = dynamic(
    () => import('@ant-design/plots').then(({ Line }) => Line),
    { ssr: false }
  )
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENTS_CHARTS
  const [companyId, setCompanyId] = useState<string>()
  const [companyName, setCompanyName] = useState<string>()
  const [paymentsLimit, setPaymentsLimit] = useState(isOnPage ? 10 : 5)
  const { data: domains } = useGetDomainsQuery({})
  const { data: realEstates, isLoading } = useGetAllRealEstateQuery({ domainId: domains?.[0]._id })

  useEffect(() => {
    setCompanyId(realEstates?.data[0]._id)
    setCompanyName(realEstates?.data[0].companyName)
  }, [isLoading])
  
  const { data: payments } = useGetAllPaymentsQuery({
    limit: paymentsLimit,
    type: Operations.Debit,
    companyIds: [companyId]
  },
  {
    skip: !companyId,
  })
  const chartData = { ...chartConfig, data: getPaymentsChartData(payments?.data) } as any

  if(!companyName){
    return null
  }

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
          companyName={companyName}
        />
      }
    >
      <Line {...chartData} />
    </TableCard>
  )
}

export default PaymentsChart