import {
  useGetAreasQuery,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import Chart from '@components/Chart'
import CompaniesAreaChartHeader from '@components/Tables/CompaniesAreaChart/Header'
import TableCard from '@components/UI/TableCard'
import React, {useEffect, useMemo, useState} from 'react'
import {useGetAllRealEstateQuery} from "@common/api/realestateApi/realestate.api";

const CompaniesAreaChart: React.FC = () => {
  const chartElementTitle = 'Частка площі'

  const { data: domains } = useGetDomainsQuery({})
  const [domainId, setDomainId] = useState<string>()
  const {data} = useGetAllRealEstateQuery({})



  useEffect(() => {
    if (data?.domainsFilter?.length){
      setDomainId(data.domainsFilter[0].value)
    }else {
      setDomainId(undefined)
    }

  }, [data])


  const { data: areas } = useGetAreasQuery(
    {
      domainId: domainId,
    },
    {
      skip: !domainId,
    }
  )

  const dataSource = useMemo(() => {
    const totalPart = areas?.companies?.reduce((acc, {rentPart}) => acc += rentPart, 0)
    const domainName = data?.domainsFilter?.find(({value}) => value === domainId)?.text

    const newDataSource = areas?.companies?.map((i) => ({
      label: i.companyName,
      value: i.rentPart,
    })) ?? []

    if (totalPart > 100) {
      return newDataSource
    } else {
      return [...newDataSource, {value: 100 - totalPart, label: domainName, color: '#cecece'}]
    }
  }, [data,areas,domainId])

  return (
    <TableCard
      title={
        <CompaniesAreaChartHeader setDomainId={setDomainId} />
      }
    >
      <Chart
        dataSources={dataSource}
        chartTitle={undefined}
        chartElementTitle={chartElementTitle}
      />
    </TableCard>
  )
}

export default CompaniesAreaChart
