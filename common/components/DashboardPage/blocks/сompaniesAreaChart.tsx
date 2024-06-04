import {
  useGetAreasQuery,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import Chart from '@common/components/Chart'
import CompaniesAreaChartHeader from '@common/components/Tables/CompaniesAreaChart/Header'
import TableCard from '@common/components/UI/TableCard'
import React, { useEffect, useState } from 'react'

const CompaniesAreaChart: React.FC = () => {
  const chartElementTitle = 'Частка площі'

  const { data: domains } = useGetDomainsQuery({})
  const [domainId, setDomainId] = useState<string>()
  useEffect(() => {
    if (domains && domains?.data.length > 0) {
      setDomainId(domains.data[0]._id)
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
        <CompaniesAreaChartHeader
          domains={domains?.data}
          setDomainId={setDomainId}
        />
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
