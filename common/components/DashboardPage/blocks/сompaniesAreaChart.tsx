import {
  useGetAreasQuery,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import Chart from '@components/Chart'
import CompaniesAreaChartHeader from '@components/Tables/CompaniesAreaChart/Header'
import TableCard from '@components/UI/TableCard'
import React, { useEffect, useMemo, useState } from 'react'

interface CompaniesAreaChartProps {
  domainID?: string
}

const CompaniesAreaChart: React.FC<CompaniesAreaChartProps> = ({ domainID }) => {

  const { data: domains } = useGetDomainsQuery({})
  const [domainId, setDomainId] = useState<string>(domainID)
  const { data } = useGetAllRealEstateQuery({})
  const [domainName, setDomainName] = useState('')

  useEffect(() => {
    if (data?.domainsFilter?.length) {
      setDomainId(data.domainsFilter[0].value)
    } else {
      setDomainId(undefined)
    }
    // if (domainID) {
    //   setDomainId(domainID)
    // } else {
    //   data?.domainsFilter?.length ? setDomainId(data.domainsFilter[0].value) : setDomainId(undefined)
    // }
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
    const totalPart = areas?.companies?.reduce(
      (acc, { rentPart }) => (acc += rentPart),
      0
    )

    const totalArea = areas?.companies?.reduce(
      (acc, { totalArea }) => (acc += totalArea),
      0
    )

    const domainName = data?.domainsFilter?.find(
      ({ value }) => value === domainId
    )?.text
    setDomainName(domainName)

    const newDataSource =
      areas?.companies?.map((i) => ({
        label: i.companyName,
        value: {
          part: i.rentPart,
          area: i.totalArea,
        },
      })) ?? []

    if (totalPart > 100) {
      return newDataSource
    } else {
      return [
        ...newDataSource,
        { value: {
          part: 100 - totalPart,
          area: totalArea,
        },
        label: domainName, 
        color: '#cecece' },
      ]
    }
  }, [data, areas, domainId])

  return (
    <TableCard
      title={!domainID ? <CompaniesAreaChartHeader setDomainId={setDomainId}/> : null}
      style={{ height: '100%' }}
    >
      <Chart
        dataSources={dataSource}
        chartTitle={undefined}
        domainName={domainName}
      />
    </TableCard>
  )
}

export default CompaniesAreaChart
