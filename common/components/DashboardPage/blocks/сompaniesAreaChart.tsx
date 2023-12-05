import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Chart from '@common/components/Chart'
import { useGetAreasQuery } from '@common/api/areasApi/areas.api'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

const CompaniesAreaChart: React.FC = () => {
  const router = useRouter()
  const [rentParts, setRentParts] = useState<number[]>([])
  const [companyNames, setCompanyNames] = useState<string[]>([])
  const chartTitle: string = 'Займані площі'
  const chartElementTitle: string = 'Частка площі'

  const { data: domains } = useGetDomainsQuery({})
  const { data: userResponse } = useGetCurrentUserQuery()
  const userDomain = domains?.find((domain) =>
    domain.adminEmails.includes(userResponse.email)
  )
  const { data: areasData } = useGetAreasQuery({
    domainId: userDomain?._id,
  })

  const createData = () => {
    const rentParts: number[] = []
    const companyNames: string[] = []
    const { companies } = areasData
    for (const element of companies) {
      rentParts.push(element.totalArea)
      companyNames.push(element.companyName)
    }
    setRentParts(rentParts)
    setCompanyNames(companyNames)
  }

  useEffect(() => {
    if (areasData) {
      createData()
    }
  }, [areasData, domains])

  return (
    <Chart
      names={companyNames}
      values={rentParts}
      chartTitle={chartTitle}
      chartElementTitle={chartElementTitle}
    />
  )
}

export default CompaniesAreaChart
