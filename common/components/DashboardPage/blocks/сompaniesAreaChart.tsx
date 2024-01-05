import React from 'react'
import Chart from '@common/components/Chart'
import { useGetDomainsQuery, useGetAreasQuery } from '@common/api/domainApi/domain.api'

const CompaniesAreaChart: React.FC = () => {
  const chartTitle: string = 'Займані площі'
  const chartElementTitle: string = 'Частка площі'

  const { data: domains } = useGetDomainsQuery({limit:1})
  const { data: areasData } = useGetAreasQuery({
    domainId: domains?.[0]?._id,
  }, {
    skip: !domains?.[0]?._id,
  })
  return (
    <Chart
      dataSources={areasData?.companies?.map(i => ({label: i.companyName, value: i.rentPart}))}
      chartTitle={chartTitle}
      chartElementTitle={chartElementTitle}
    />
  )
}

export default CompaniesAreaChart
