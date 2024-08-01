import {
  useGetAreasQuery,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import Chart from '@components/Chart'
import CompaniesAreaChartHeader from '@components/Tables/CompaniesAreaChart/Header'
import TableCard from '@components/UI/TableCard'
import React, { useEffect, useState } from 'react'

const CompaniesAreaChart: React.FC = () => {
  const chartElementTitle = 'Частка площі'

  const { data: domains } = useGetDomainsQuery({})
  const [domainId, setDomainId] = useState<string>()
  useEffect(() => {
    if (domains && domains.length > 0) {
      setDomainId(domains[0]._id)
    }
  }, [domains])
  const { data: areasData } = useGetAreasQuery(
    {
      domainId: domainId,
    },
    {
      skip: !domainId,
    }
  )
  return (
    <TableCard
      title={
        <CompaniesAreaChartHeader domains={domains} setDomainId={setDomainId} />
      }
    >
      <Chart
        dataSources={areasData?.companies?.map((i) => ({
          label: i.companyName,
          value: i.rentPart,
        }))}
        chartTitle={undefined}
        chartElementTitle={chartElementTitle}
      />
    </TableCard>
  )
}

export default CompaniesAreaChart
