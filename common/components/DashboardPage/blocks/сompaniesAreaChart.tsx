import {
  useGetAreasQuery,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import Chart from '@components/Chart'
import CompaniesAreaChartHeader from '@components/Tables/CompaniesAreaChart/Header'
import TableCard from '@components/UI/TableCard'
import React, { useEffect, useMemo, useState } from 'react'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Typography } from 'antd'

const { Text } = Typography

interface CompaniesAreaChartProps {
  domainID: string
}

const CompaniesAreaChart: React.FC<CompaniesAreaChartProps> = ({
  domainID,
}) => {
  const { data: domains } = useGetDomainsQuery({})
  const [domainId, setDomainId] = useState<string>()
  const { data } = useGetAllRealEstateQuery({})
  const [domainName, setDomainName] = useState('')

  useEffect(() => {
    if (domainID) {
      setDomainId(domainID)
    } else {
      setDomainId(undefined)
    }
  }, [data, domainID])

  const { data: areas } = useGetAreasQuery(
    {
      domainId: domainId,
    },
    {
      skip: !domainId,
    }
  )

  const dataSource = useMemo(() => {
    if (!areas?.companies || areas.companies.length === 0) {
      return []
    }

    const totalPart = areas?.companies?.reduce(
      (acc, { rentPart }) => (acc += rentPart),
      0
    )

    const totalArea = areas?.companies?.reduce(
      (acc, { totalArea }) => (acc += totalArea),
      0
    )

    const domainName =
      data?.domainsFilter?.find(({ value }) => value === domainId)?.text ||
      'Невідомий домен'

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
        {
          value: {
            part: 100 - totalPart,
            area: totalArea,
          },
          label: domainName,
          color: '#cecece',
        },
      ]
    }
  }, [data, areas, domainId])

  return (
    <TableCard
      title={<CompaniesAreaChartHeader setDomainId={setDomainId} />}
      style={{ height: '100%' }}
    >
      {dataSource.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '65px',
            marginBottom: '20px',
            height: '100%',
          }}
        >
          <ExclamationCircleOutlined
            style={{ fontSize: 24, color: 'yellow' }}
          />
          <Text style={{ marginTop: '10px' }}>Площі поки немає!</Text>
        </div>
      ) : (
        <Chart
          dataSources={dataSource}
          chartTitle={undefined}
          domainName={domainName}
        />
      )}
    </TableCard>
  )
}

export default CompaniesAreaChart
