import React, {useState, useEffect} from 'react'
import Chart from '@common/components/Chart'
import CompaniesAreaChartHeader from '@common/components/Tables/CompaniesAreaChart/Header'
import TableCard from '@common/components/UI/TableCard'
import { useGetDomainsQuery, useGetAreasQuery } from '@common/api/domainApi/domain.api'

const CompaniesAreaChart: React.FC = () => {
  const chartTitle: string = 'Займані площі'
  const chartElementTitle: string = 'Частка площі'
  const [domainId, setdomainId] = useState<string>()

  const handleChange = (value: string) => {
    setdomainId(value)    
  };
  const { data: domains } = useGetDomainsQuery({})
  const { data: areasData } = useGetAreasQuery({
    domainId: domainId,
  }, {
    skip: !domainId,
  })
  
  useEffect(() => {
    setdomainId(domains?.[0]._id)
  }, [domains])

  return (
    <TableCard title={<CompaniesAreaChartHeader handleChange={handleChange} selectValues={
      domains?.map(item => ({
        label: item.name,
        value: item._id,
      }))}/>}>
        <Chart
      dataSources={areasData?.companies?.map(i => ({label: i.companyName, value: i.rentPart}))}
      chartTitle={chartTitle}
      chartElementTitle={chartElementTitle}
    />
    </TableCard>
  )
}

export default CompaniesAreaChart
