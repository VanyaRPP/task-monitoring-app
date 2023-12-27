import React, { useState, useEffect } from 'react'
import Chart from '@common/components/Chart'
import TableCard from '@common/components/UI/TableCard'
import { useGetDomainsQuery, useGetAreasQuery } from '@common/api/domainApi/domain.api'
import CompaniesAreaChartHeader from '@common/components/Tables/CompaniesAreaChart/Header'

const CompaniesAreaChart: React.FC = () => {
  const chartElementTitle = 'Частка площі'

  const { data: domains } = useGetDomainsQuery({})
  const [domainId, setDomainId] = useState<string>()
  useEffect(() => {
    if(domains && domains.length > 0) {
      setDomainId(domains[0]._id)
    }
  },[domains])
  const { data: areasData } = useGetAreasQuery({
    domainId: domainId,
  }, {
    skip: !domainId,
  })
  return (
    <TableCard title={<CompaniesAreaChartHeader setDomainId={setDomainId}/>}>
      <Chart
        dataSources={areasData?.companies?.map(i => ({label: i.companyName, value: i.rentPart}))}
        chartTitle={undefined}
        chartElementTitle={chartElementTitle}
      />
    </TableCard>
  )
}

export default CompaniesAreaChart
